import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { getCorsHeaders, handleCorsPreflightRequest, isOriginAllowed } from '../_shared/cors.ts';

interface SecurityLogRequest {
  event_type: string;
  portal_attempted?: string;
  actual_role?: string;
  ip_address?: string;
  details?: Record<string, unknown>;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  // Validate origin
  if (!isOriginAllowed(req)) {
    return new Response(
      JSON.stringify({ error: 'Forbidden' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Get auth header
    const authHeader = req.headers.get('Authorization');
    
    // Create service role client for inserting logs (bypasses RLS)
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Get user if authenticated
    let userId: string | null = null;
    if (authHeader) {
      const userClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: authHeader } } }
      );
      const { data: { user } } = await userClient.auth.getUser();
      userId = user?.id ?? null;
    }

    // Parse request body
    const body: SecurityLogRequest = await req.json();

    // Validate required fields
    if (!body.event_type) {
      return new Response(
        JSON.stringify({ error: 'event_type is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get IP from headers (forwarded by edge runtime)
    let ipAddress = body.ip_address || 'unknown';
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    if (forwardedFor) {
      ipAddress = forwardedFor.split(',')[0].trim();
    } else if (realIp) {
      ipAddress = realIp;
    }

    // Get user agent
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Insert log entry using service role (automatically encrypted via trigger)
    const { error } = await serviceClient
      .from('security_logs')
      .insert({
        user_id: userId,
        event_type: body.event_type,
        portal_attempted: body.portal_attempted || null,
        actual_role: body.actual_role || null,
        ip_address: ipAddress, // Will be encrypted by trigger
        user_agent: userAgent,
        details: body.details || {},
      });

    if (error) {
      console.error('Failed to insert security log:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to log security event' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Security log error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
