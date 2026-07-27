import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

interface CreateTeamMemberRequest {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  memberRole?: string;
  teamId: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    // Get authorization header to verify user is authenticated
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

    // Verify the requesting user
    const { data: { user: requestingUser }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !requestingUser) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { email, password, fullName, phone, memberRole, teamId }: CreateTeamMemberRequest = await req.json();

    if (!email || !password || !fullName || !teamId) {
      return new Response(
        JSON.stringify({ error: 'Email, password, full name, and team ID are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the requesting user is the team owner
    const { data: teamData, error: teamError } = await supabaseClient
      .from('client_teams')
      .select('id, primary_account_id')
      .eq('id', teamId)
      .single();

    if (teamError || !teamData) {
      return new Response(
        JSON.stringify({ error: 'Team not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (teamData.primary_account_id !== requestingUser.id) {
      // Check if user is an admin
      const { data: roleData } = await supabaseClient
        .from('user_roles')
        .select('role')
        .eq('user_id', requestingUser.id)
        .eq('role', 'admin')
        .single();

      if (!roleData) {
        return new Response(
          JSON.stringify({ error: 'Only team owners or admins can create team members' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Create the user using admin API
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm the email
      user_metadata: { full_name: fullName }
    });

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

    // Update the profile with additional details
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        phone: phone || null,
        status: 'active'
      })
      .eq('user_id', newUser.user.id);

    if (updateError) {
      console.error('Error updating profile:', { timestamp: new Date().toISOString() });
    }

    // Add user to the team
    const { error: membershipError } = await supabaseAdmin
      .from('team_memberships')
      .insert({
        team_id: teamId,
        user_id: newUser.user.id,
        member_role: memberRole || 'member',
        display_name: fullName,
        invited_by: requestingUser.id
      });

    if (membershipError) {
      console.error('Error creating team membership:', { message: membershipError.message, timestamp: new Date().toISOString() });
      // User was created but couldn't be added to team
      return new Response(
        JSON.stringify({ 
          error: 'User created but could not be added to team',
          userId: newUser.user.id
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        userId: newUser.user.id,
        email: newUser.user.email
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in create-team-member function:', { 
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString() 
    });
    return new Response(
      JSON.stringify({ error: 'An error occurred processing your request' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
