import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DeleteClientRequest {
  user_id: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify the requesting user
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: requestingUser }, error: userError } = await supabaseClient.auth.getUser();

    if (userError || !requestingUser) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user has admin role
    const { data: roleData, error: roleError } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", requestingUser.id)
      .eq("role", "admin")
      .single();

    if (roleError || !roleData) {
      return new Response(
        JSON.stringify({ error: "Only admins can delete client accounts" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { user_id }: DeleteClientRequest = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: "user_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prevent deleting yourself
    if (user_id === requestingUser.id) {
      return new Response(
        JSON.stringify({ error: "Cannot delete your own account" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    console.log("delete-client: Starting deletion for user", user_id);

    // Delete related data first (in order of dependencies)
    // 1. Delete from team_memberships
    await supabaseAdmin.from("team_memberships").delete().eq("user_id", user_id);

    // 2. Delete client_teams where user is primary account
    await supabaseAdmin.from("client_teams").delete().eq("primary_account_id", user_id);

    // 3. Delete customer_uploads
    await supabaseAdmin.from("customer_uploads").delete().eq("user_id", user_id);

    // 4. Delete client_assets
    await supabaseAdmin.from("client_assets").delete().eq("user_id", user_id);

    // 5. Delete content_requests
    await supabaseAdmin.from("content_requests").delete().eq("user_id", user_id);

    // 6. Delete ad_campaigns
    await supabaseAdmin.from("ad_campaigns").delete().eq("user_id", user_id);

    // 7. Delete social_media_accounts (and related posts via cascade or manually)
    const { data: accounts } = await supabaseAdmin
      .from("social_media_accounts")
      .select("id")
      .eq("user_id", user_id);

    if (accounts && accounts.length > 0) {
      const accountIds = accounts.map((a) => a.id);
      await supabaseAdmin.from("social_media_posts").delete().in("account_id", accountIds);
      await supabaseAdmin.from("social_media_accounts").delete().eq("user_id", user_id);
    }

    // 8. Delete app_projects
    await supabaseAdmin.from("app_projects").delete().eq("user_id", user_id);

    // 9. Delete client_billing
    await supabaseAdmin.from("client_billing").delete().eq("user_id", user_id);

    // 10. Delete storage_quotas
    await supabaseAdmin.from("storage_quotas").delete().eq("user_id", user_id);

    // 11. Delete messages (both sent and received)
    await supabaseAdmin.from("messages").delete().eq("sender_id", user_id);
    await supabaseAdmin.from("messages").delete().eq("recipient_id", user_id);

    // 12. Delete conversations
    await supabaseAdmin.from("conversations").delete().eq("customer_id", user_id);

    // 13. Delete user_roles
    const { error: rolesError } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", user_id);

    if (rolesError) {
      console.error("Error deleting user_roles:", rolesError);
    }

    // 14. Delete profile
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .delete()
      .eq("user_id", user_id);

    if (profileError) {
      console.error("Error deleting profile:", profileError);
    }

    // 15. Finally, delete from Supabase Auth
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(user_id);

    if (authDeleteError) {
      console.error("Error deleting auth user:", authDeleteError);
      return new Response(
        JSON.stringify({ error: `Failed to delete auth user: ${authDeleteError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("delete-client: Successfully deleted user", user_id);

    return new Response(
      JSON.stringify({ success: true, message: "Client account fully deleted" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in delete-client:", error);
    const errorMessage = error instanceof Error ? error.message : "An error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
