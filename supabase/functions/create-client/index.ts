import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

interface CreateClientRequest {
  email: string;
  password: string;
  fullName: string;
  company?: string;
  phone?: string;
  plan?: string;
  pageCount?: string;
  notes?: string;
  websiteStatus?: string;
  previewUrl?: string;
  enquiryId?: string;
  enquiryData?: Record<string, unknown>;
  accountType?: string;
}


serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    // Get authorization header to verify admin is authenticated
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create client with anon key to verify the requesting user
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify the requesting user is an admin
    const { data: { user: requestingUser }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !requestingUser) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has admin role
    const { data: roleData, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', requestingUser.id)
      .eq('role', 'admin')
      .single();

    if (roleError || !roleData) {
      return new Response(
        JSON.stringify({ error: 'Only admins can create client accounts' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { email, password, fullName, company, phone, plan, pageCount, notes, websiteStatus, previewUrl, enquiryId, enquiryData, accountType }: CreateClientRequest = await req.json();

    if (!email || !password || !fullName) {
      return new Response(
        JSON.stringify({ error: 'Email, password, and full name are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Generate customer ID
    const { data: customerIdData, error: idError } = await supabaseAdmin.rpc('generate_customer_id');
    
    if (idError) {
      console.error('Error generating customer ID:', { timestamp: new Date().toISOString() });
      return new Response(
        JSON.stringify({ error: 'Failed to generate customer ID' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const customerId = customerIdData;

    // Create the user using admin API (won't affect the calling user's session)
    let { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm the email
      user_metadata: { full_name: fullName }
    });

    // If the auth user already exists (from a previous partial run), recover by finding them
    // and updating their password so this conversion is idempotent.
    if (createError && /already been registered|already exists|email_exists/i.test(createError.message)) {
      console.log('User exists, recovering and updating instead');
      // Find the existing user by listing (paginate if needed)
      let existingUserId: string | null = null;
      let page = 1;
      while (!existingUserId && page <= 20) {
        const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
        if (listErr) break;
        const match = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
        if (match) existingUserId = match.id;
        if (!list.users.length || list.users.length < 200) break;
        page++;
      }

      if (!existingUserId) {
        return new Response(
          JSON.stringify({ error: 'Email already registered but user could not be located. Please contact support.' }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: updated, error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(existingUserId, {
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      });

      if (updateErr || !updated.user) {
        return new Response(
          JSON.stringify({ error: updateErr?.message || 'Failed to update existing user' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      newUser = updated;
      createError = null;
    }

    if (createError) {
      console.error('Error creating user:', { message: createError.message, timestamp: new Date().toISOString() });
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!newUser.user) {
      return new Response(
        JSON.stringify({ error: 'Failed to create user' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // The profile should be created automatically by the trigger, 
    // but let's update it with additional details
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        customer_id: customerId,
        plan: plan || null,
        page_count: pageCount || null,
        company: company || null,
        phone: phone || null,
        notes: notes || null,
        status: 'active',
        website_status: websiteStatus || 'design',
        preview_url: previewUrl || null,
        enquiry_id: enquiryId || null,
        enquiry_data: enquiryData || null,
        account_type: accountType || 'paid_client',
      })
      .eq('user_id', newUser.user.id);

    if (updateError) {
      console.error('Error updating profile:', { timestamp: new Date().toISOString() });
      // Don't fail the request, the user was created successfully
    }

    // Ensure a client_teams row exists for this client so they appear in
    // Client Accounts. Idempotent: only creates if one doesn't already exist.
    const { data: existingTeam } = await supabaseAdmin
      .from('client_teams')
      .select('id')
      .eq('primary_account_id', newUser.user.id)
      .maybeSingle();

    if (!existingTeam) {
      const { data: teamCodeData } = await supabaseAdmin.rpc('generate_team_code');
      const teamName = (company && company.trim()) || `${fullName}'s Team`;
      const { error: teamError } = await supabaseAdmin
        .from('client_teams')
        .insert({
          primary_account_id: newUser.user.id,
          team_name: teamName,
          team_code: teamCodeData,
        });
      if (teamError) {
        console.error('Error creating client team:', { message: teamError.message, timestamp: new Date().toISOString() });
      }
    }

    // Mark the source enquiry as completed (best-effort)
    if (enquiryId) {
      await supabaseAdmin
        .from('enquiries')
        .update({ status: 'completed' })
        .eq('id', enquiryId);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        customerId,
        userId: newUser.user.id,
        email: newUser.user.email
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in create-client function:', { 
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString() 
    });
    return new Response(
      JSON.stringify({ error: 'An error occurred processing your request' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
