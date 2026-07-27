import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

// TOTP implementation using Web Crypto API
class TOTP {
  private static readonly DIGITS = 6;
  private static readonly PERIOD = 30;

  static async generateSecret(): Promise<string> {
    const array = new Uint8Array(20);
    crypto.getRandomValues(array);
    return this.base32Encode(array);
  }

  private static base32Encode(buffer: Uint8Array): string {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = 0;
    let value = 0;
    let output = '';

    for (let i = 0; i < buffer.length; i++) {
      value = (value << 8) | buffer[i];
      bits += 8;

      while (bits >= 5) {
        output += alphabet[(value >>> (bits - 5)) & 31];
        bits -= 5;
      }
    }

    if (bits > 0) {
      output += alphabet[(value << (5 - bits)) & 31];
    }

    return output;
  }

  private static base32Decode(encoded: string): Uint8Array {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const cleanedInput = encoded.replace(/=+$/, '').toUpperCase();
    
    let bits = 0;
    let value = 0;
    const output: number[] = [];

    for (let i = 0; i < cleanedInput.length; i++) {
      const idx = alphabet.indexOf(cleanedInput[i]);
      if (idx === -1) continue;
      
      value = (value << 5) | idx;
      bits += 5;

      if (bits >= 8) {
        output.push((value >>> (bits - 8)) & 255);
        bits -= 8;
      }
    }

    return new Uint8Array(output);
  }

  static async generateCode(secret: string, counter?: number): Promise<string> {
    const key = this.base32Decode(secret);
    const time = counter ?? Math.floor(Date.now() / 1000 / this.PERIOD);
    
    const timeBuffer = new ArrayBuffer(8);
    const timeView = new DataView(timeBuffer);
    timeView.setUint32(4, time, false);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key.buffer as ArrayBuffer,
      { name: 'HMAC', hash: 'SHA-1' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', cryptoKey, timeBuffer);
    const signatureArray = new Uint8Array(signature);
    
    const offset = signatureArray[signatureArray.length - 1] & 0x0f;
    const binary =
      ((signatureArray[offset] & 0x7f) << 24) |
      ((signatureArray[offset + 1] & 0xff) << 16) |
      ((signatureArray[offset + 2] & 0xff) << 8) |
      (signatureArray[offset + 3] & 0xff);

    const otp = binary % Math.pow(10, this.DIGITS);
    return otp.toString().padStart(this.DIGITS, '0');
  }

  static async verify(secret: string, token: string, window = 1): Promise<boolean> {
    const currentTime = Math.floor(Date.now() / 1000 / this.PERIOD);
    
    for (let i = -window; i <= window; i++) {
      const expectedToken = await this.generateCode(secret, currentTime + i);
      if (token === expectedToken) {
        return true;
      }
    }
    return false;
  }
}

// Generate backup codes
function generateBackupCodes(count = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const array = new Uint8Array(4);
    crypto.getRandomValues(array);
    const code = Array.from(array)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
  }
  return codes;
}

// AES-GCM encryption for proper cryptographic security
// Magic bytes to identify AES-GCM encrypted data: 0x51 0x32 (Q2 for Quooro v2)
const MAGIC_BYTE_1 = 0x51; // 'Q'
const MAGIC_BYTE_2 = 0x32; // '2'

async function deriveEncryptionKey(userId: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = encoder.encode(userId + Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));
  
  // Import as raw key material for PBKDF2
  const baseKey = await crypto.subtle.importKey(
    'raw',
    keyMaterial,
    'PBKDF2',
    false,
    ['deriveKey']
  );
  
  // Derive a proper AES-GCM key using PBKDF2
  const salt = encoder.encode('quooro-2fa-salt-v2');
  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encryptSecret(secret: string, userId: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await deriveEncryptionKey(userId);
  
  // Generate a random 12-byte IV for each encryption
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  // Encrypt using AES-GCM - encode the secret as UTF-8 bytes
  const secretBytes = encoder.encode(secret);
  const encryptedData = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, tagLength: 128 },
    key,
    secretBytes
  );
  
  // Combine: magic bytes (2) + IV (12) + ciphertext
  // This ensures we can reliably detect AES-GCM encrypted data
  const result = new Uint8Array(2 + iv.length + encryptedData.byteLength);
  result[0] = MAGIC_BYTE_1;
  result[1] = MAGIC_BYTE_2;
  result.set(iv, 2);
  result.set(new Uint8Array(encryptedData), 2 + iv.length);
  
  // Use safe base64 encoding
  return btoa(String.fromCharCode(...result));
}

async function decryptSecret(encryptedSecret: string, userId: string): Promise<string> {
  try {
    // Decode base64 to bytes
    const combined = Uint8Array.from(atob(encryptedSecret), c => c.charCodeAt(0));
    
    // Check for magic bytes to identify AES-GCM format
    const isAesGcm = combined.length >= 14 && 
                     combined[0] === MAGIC_BYTE_1 && 
                     combined[1] === MAGIC_BYTE_2;
    
    if (isAesGcm) {
      // AES-GCM decryption (new format with magic bytes)
      const iv = combined.slice(2, 14);
      const ciphertext = combined.slice(14);
      
      const key = await deriveEncryptionKey(userId);
      
      const decryptedData = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv, tagLength: 128 },
        key,
        ciphertext
      );
      
      // Decode the decrypted bytes back to string
      const decrypted = new TextDecoder().decode(decryptedData);
      
      // Validate that the result looks like a Base32 TOTP secret
      const base32Regex = /^[A-Z2-7]+=*$/;
      if (!base32Regex.test(decrypted.replace(/=+$/, ''))) {
        console.error('Decrypted value does not appear to be valid Base32');
      }
      
      return decrypted;
    } else {
      // Legacy XOR decryption for old data
      console.log('Using legacy XOR decryption for migration');
      const encoder = new TextEncoder();
      const keyData = encoder.encode(userId + Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')?.slice(0, 32));
      const keyHash = await crypto.subtle.digest('SHA-256', keyData);
      const keyArray = new Uint8Array(keyHash);
      
      const decrypted = new Uint8Array(combined.length);
      
      for (let i = 0; i < combined.length; i++) {
        decrypted[i] = combined[i] ^ keyArray[i % keyArray.length];
      }
      
      return new TextDecoder().decode(decrypted);
    }
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt secret');
  }
}

// Extract client IP from request
function getClientIP(req: Request): string {
  // Check various headers for the real IP (in order of preference)
  const xForwardedFor = req.headers.get('x-forwarded-for');
  if (xForwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return xForwardedFor.split(',')[0].trim();
  }
  
  const xRealIP = req.headers.get('x-real-ip');
  if (xRealIP) {
    return xRealIP.trim();
  }
  
  const cfConnectingIP = req.headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP.trim();
  }
  
  // Fallback - this won't give the real client IP behind a proxy
  return 'unknown';
}

// Helper function to check if IP is blocked (uses RPC for encrypted IP handling)
async function isIPBlocked(supabase: any, ip: string): Promise<{ blocked: boolean; reason?: string; expiresAt?: string }> {
  const { data, error } = await supabase.rpc('check_ip_blocked', { p_ip_address: ip });
  
  if (error || !data || data.length === 0) {
    return { blocked: false };
  }
  
  const result = data[0];
  if (result.blocked) {
    return { 
      blocked: true, 
      reason: result.reason || 'IP has been blocked',
      expiresAt: result.expires_at
    };
  }
  
  return { blocked: false };
}

// Helper function to check if IP is whitelisted (uses RPC for encrypted IP handling)
async function isIPWhitelisted(supabase: any, ip: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('check_ip_whitelisted', { p_ip_address: ip });
  return !error && data === true;
}

// Helper function to auto-block IP after failed attempts
async function checkAndAutoBlockIP(supabase: any, ip: string, userId: string): Promise<void> {
  // Check if whitelisted first
  const whitelisted = await isIPWhitelisted(supabase, ip);
  if (whitelisted) return;

  // Count failed attempts from this IP in the last hour
  const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
  const { data: failedAttempts } = await supabase
    .from('two_factor_attempts')
    .select('id')
    .eq('ip_address', ip)
    .eq('success', false)
    .gte('created_at', oneHourAgo);

  const failCount = failedAttempts?.length || 0;

  // Auto-block after 5 failed attempts
  if (failCount >= 5) {
    // Check if already blocked
    const { data: existingBlock } = await supabase
      .from('blocked_ips')
      .select('id, failed_attempts')
      .eq('ip_address', ip)
      .single();

    if (existingBlock) {
      // Update failed attempts count
      await supabase
        .from('blocked_ips')
        .update({ 
          failed_attempts: failCount,
          blocked_at: new Date().toISOString(),
          // Extend block by 1 hour
          expires_at: new Date(Date.now() + 3600000).toISOString()
        })
        .eq('id', existingBlock.id);
    } else {
      // Create new auto-block (expires in 1 hour)
      await supabase.from('blocked_ips').insert({
        ip_address: ip,
        reason: `Auto-blocked after ${failCount} failed login attempts`,
        is_auto_blocked: true,
        failed_attempts: failCount,
        expires_at: new Date(Date.now() + 3600000).toISOString()
      });
    }
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the client's IP address early for blocking check
    const clientIPFromHeaders = getClientIP(req);

    // Check if IP is blocked BEFORE auth (to prevent brute force)
    const blockStatus = await isIPBlocked(supabaseClient, clientIPFromHeaders);
    if (blockStatus.blocked) {
      return new Response(
        JSON.stringify({ 
          error: 'Access denied', 
          reason: blockStatus.reason,
          expiresAt: blockStatus.expiresAt 
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get auth token from request
    const authHeader = req.headers.get('Authorization');
    
    // Parse body early to check action
    let body: Record<string, any> = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }
    
    // For status check without auth, return minimal info
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Allow 'status' action without auth for pre-login checks
      if (body.action === 'status' && body.userId) {
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('two_factor_enabled')
          .eq('user_id', body.userId)
          .single();
        
        return new Response(
          JSON.stringify({ 
            twoFactorEnabled: profile?.two_factor_enabled || false 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create a client with the user's token for authentication verification
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );
    
    // Verify user using getUser with the user client
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    
    if (authError || !user) {
      // Allow 'status' action to return gracefully
      if (body.action === 'status') {
        return new Response(
          JSON.stringify({ twoFactorEnabled: false, authenticated: false }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, code, ip: clientProvidedIP } = body as Record<string, any>;

    // Get the client's IP address
    const clientIP = clientProvidedIP || clientIPFromHeaders;

    // Check if the provided IP is blocked (in case it differs from header IP)
    if (clientIP !== clientIPFromHeaders) {
      const providedIPBlockStatus = await isIPBlocked(supabaseClient, clientIP);
      if (providedIPBlockStatus.blocked) {
        return new Response(
          JSON.stringify({ 
            error: 'Access denied', 
            reason: providedIPBlockStatus.reason,
            expiresAt: providedIPBlockStatus.expiresAt 
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Rate limiting check
    const thirtySecondsAgo = new Date(Date.now() - 30000).toISOString();
    const { data: recentAttempts } = await supabaseClient
      .from('two_factor_attempts')
      .select('id')
      .eq('user_id', user.id)
      .eq('success', false)
      .gte('created_at', thirtySecondsAgo);

    if (recentAttempts && recentAttempts.length >= 3) {
      // Check for auto-blocking
      await checkAndAutoBlockIP(supabaseClient, clientIP, user.id);
      return new Response(
        JSON.stringify({ error: 'Too many attempts. Please wait 30 seconds.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    switch (action) {
      case 'check-ip': {
        // Check if the current IP is in the user's known IPs list
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('known_ips, two_factor_enabled, two_factor_secret')
          .eq('user_id', user.id)
          .single();

        const knownIPs: string[] = (profile?.known_ips as string[]) || [];
        const isKnownIP = knownIPs.includes(clientIP);
        const hasTwoFactorSetup = profile?.two_factor_enabled && profile?.two_factor_secret;

        // Get user role
        const { data: roleData } = await supabaseClient
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        return new Response(
          JSON.stringify({ 
            isKnownIP,
            currentIP: clientIP,
            requiresVerification: !isKnownIP,
            hasTwoFactorSetup,
            role: roleData?.role || 'user'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'add-known-ip': {
        // Add the current IP to the user's known IPs list
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('known_ips')
          .eq('user_id', user.id)
          .single();

        const knownIPs: string[] = (profile?.known_ips as string[]) || [];
        
        // Only add if not already in the list
        if (!knownIPs.includes(clientIP)) {
          // Keep only the last 10 IPs to prevent bloat
          const updatedIPs = [...knownIPs, clientIP].slice(-10);
          
          await supabaseClient
            .from('profiles')
            .update({ known_ips: updatedIPs })
            .eq('user_id', user.id);
        }

        return new Response(
          JSON.stringify({ success: true, ip: clientIP }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get-known-ips': {
        // Get all known IPs for the user
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('known_ips')
          .eq('user_id', user.id)
          .single();

        const knownIPs: string[] = (profile?.known_ips as string[]) || [];

        return new Response(
          JSON.stringify({ 
            knownIPs,
            currentIP: clientIP,
            isCurrentIPKnown: knownIPs.includes(clientIP)
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'remove-known-ip': {
        // Remove a specific IP from the known IPs list
        const { ipToRemove } = body;
        
        if (!ipToRemove) {
          return new Response(
            JSON.stringify({ error: 'IP address to remove is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('known_ips')
          .eq('user_id', user.id)
          .single();

        const knownIPs: string[] = (profile?.known_ips as string[]) || [];
        const updatedIPs = knownIPs.filter(ip => ip !== ipToRemove);

        await supabaseClient
          .from('profiles')
          .update({ known_ips: updatedIPs })
          .eq('user_id', user.id);

        return new Response(
          JSON.stringify({ 
            success: true, 
            removedIP: ipToRemove,
            remainingIPs: updatedIPs
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'verify-ip': {
        // Verify the 2FA code for a new IP login
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('two_factor_secret, two_factor_enabled, backup_codes, known_ips')
          .eq('user_id', user.id)
          .single();

        if (!profile?.two_factor_enabled || !profile?.two_factor_secret) {
          return new Response(
            JSON.stringify({ error: '2FA not enabled. Please set up 2FA first.' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        let isValid = false;
        const secret = await decryptSecret(profile.two_factor_secret, user.id);
        isValid = await TOTP.verify(secret, code);

        // Check backup codes if TOTP failed
        if (!isValid && profile.backup_codes) {
          const backupCodes = profile.backup_codes as string[];
          const codeIndex = backupCodes.indexOf(code.toUpperCase());
          if (codeIndex !== -1) {
            isValid = true;
            // Remove used backup code
            backupCodes.splice(codeIndex, 1);
            await supabaseClient
              .from('profiles')
              .update({ backup_codes: backupCodes })
              .eq('user_id', user.id);
          }
        }

        // Log attempt
        await supabaseClient.from('two_factor_attempts').insert({
          user_id: user.id,
          attempt_type: 'ip_verify',
          success: isValid,
          ip_address: clientIP
        });

        if (!isValid) {
          return new Response(
            JSON.stringify({ error: 'Invalid code' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Add the IP to known IPs after successful verification
        const knownIPs: string[] = (profile?.known_ips as string[]) || [];
        if (!knownIPs.includes(clientIP)) {
          const updatedIPs = [...knownIPs, clientIP].slice(-10);
          await supabaseClient
            .from('profiles')
            .update({ known_ips: updatedIPs })
            .eq('user_id', user.id);
        }

        return new Response(
          JSON.stringify({ success: true, ipAdded: clientIP }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'setup': {
        // Generate new secret
        const secret = await TOTP.generateSecret();
        const encryptedSecret = await encryptSecret(secret, user.id);
        
        // Store temporarily (not enabled yet)
        await supabaseClient
          .from('profiles')
          .update({ two_factor_secret: encryptedSecret })
          .eq('user_id', user.id);

        // Generate QR code URL
        const issuer = 'Quooro';
        const otpAuthUrl = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(user.email || '')}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&digits=6&period=30`;

        return new Response(
          JSON.stringify({ 
            secret, 
            qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpAuthUrl)}`,
            otpAuthUrl
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'verify-setup': {
        // Get stored secret
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('two_factor_secret, known_ips')
          .eq('user_id', user.id)
          .single();

        if (!profile?.two_factor_secret) {
          return new Response(
            JSON.stringify({ error: 'No 2FA setup in progress' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const secret = await decryptSecret(profile.two_factor_secret, user.id);
        const isValid = await TOTP.verify(secret, code);

        // Log attempt
        await supabaseClient.from('two_factor_attempts').insert({
          user_id: user.id,
          attempt_type: 'setup',
          success: isValid,
          ip_address: clientIP
        });

        if (!isValid) {
          return new Response(
            JSON.stringify({ error: 'Invalid code' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Generate backup codes
        const backupCodes = generateBackupCodes();
        
        // Add current IP to known IPs on successful setup
        const knownIPs: string[] = (profile?.known_ips as string[]) || [];
        const updatedIPs = knownIPs.includes(clientIP) 
          ? knownIPs 
          : [...knownIPs, clientIP].slice(-10);
        
        // Enable 2FA
        await supabaseClient
          .from('profiles')
          .update({ 
            two_factor_enabled: true,
            backup_codes: backupCodes,
            two_factor_verified_at: new Date().toISOString(),
            known_ips: updatedIPs
          })
          .eq('user_id', user.id);

        return new Response(
          JSON.stringify({ success: true, backupCodes }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'verify': 
      case 'verify-backup': {
        // Get stored secret
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('two_factor_secret, two_factor_enabled, backup_codes, known_ips')
          .eq('user_id', user.id)
          .single();

        if (!profile?.two_factor_enabled || !profile?.two_factor_secret) {
          return new Response(
            JSON.stringify({ error: '2FA not enabled' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        let isValid = false;
        
        // If verify-backup action, only check backup codes
        if (action === 'verify-backup') {
          if (profile.backup_codes) {
            const backupCodes = profile.backup_codes as string[];
            const codeIndex = backupCodes.indexOf(code.toUpperCase());
            if (codeIndex !== -1) {
              isValid = true;
              // Remove used backup code
              backupCodes.splice(codeIndex, 1);
              await supabaseClient
                .from('profiles')
                .update({ backup_codes: backupCodes })
                .eq('user_id', user.id);
            }
          }
        } else {
          // Normal TOTP verification
          const secret = await decryptSecret(profile.two_factor_secret, user.id);
          isValid = await TOTP.verify(secret, code);

          // Check backup codes if TOTP failed
          if (!isValid && profile.backup_codes) {
            const backupCodes = profile.backup_codes as string[];
            const codeIndex = backupCodes.indexOf(code.toUpperCase());
            if (codeIndex !== -1) {
              isValid = true;
              // Remove used backup code
              backupCodes.splice(codeIndex, 1);
              await supabaseClient
                .from('profiles')
                .update({ backup_codes: backupCodes })
                .eq('user_id', user.id);
            }
          }
        }

        // Log attempt
        await supabaseClient.from('two_factor_attempts').insert({
          user_id: user.id,
          attempt_type: action === 'verify-backup' ? 'backup' : 'verify',
          success: isValid,
          ip_address: clientIP
        });

        if (!isValid) {
          return new Response(
            JSON.stringify({ error: action === 'verify-backup' ? 'Invalid backup code' : 'Invalid code' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Add IP to known IPs after successful verification
        const knownIPs: string[] = (profile?.known_ips as string[]) || [];
        if (!knownIPs.includes(clientIP)) {
          const updatedIPs = [...knownIPs, clientIP].slice(-10);
          await supabaseClient
            .from('profiles')
            .update({ known_ips: updatedIPs })
            .eq('user_id', user.id);
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'disable': {
        // Verify current code before disabling
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('two_factor_secret, two_factor_enabled')
          .eq('user_id', user.id)
          .single();

        if (!profile?.two_factor_enabled || !profile?.two_factor_secret) {
          return new Response(
            JSON.stringify({ error: '2FA not enabled' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const secret = await decryptSecret(profile.two_factor_secret, user.id);
        const isValid = await TOTP.verify(secret, code);

        if (!isValid) {
          await supabaseClient.from('two_factor_attempts').insert({
            user_id: user.id,
            attempt_type: 'verify',
            success: false,
            ip_address: clientIP
          });
          return new Response(
            JSON.stringify({ error: 'Invalid code' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Disable 2FA
        await supabaseClient
          .from('profiles')
          .update({ 
            two_factor_enabled: false,
            two_factor_secret: null,
            backup_codes: [],
            two_factor_verified_at: null
          })
          .eq('user_id', user.id);

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'status': {
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('two_factor_enabled, two_factor_verified_at, known_ips')
          .eq('user_id', user.id)
          .single();

        // Get user role
        const { data: roleData } = await supabaseClient
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        const knownIPs: string[] = (profile?.known_ips as string[]) || [];
        const isCurrentIPKnown = knownIPs.includes(clientIP);

        return new Response(
          JSON.stringify({ 
            enabled: profile?.two_factor_enabled || false,
            verifiedAt: profile?.two_factor_verified_at,
            role: roleData?.role || 'user',
            currentIP: clientIP,
            isCurrentIPKnown,
            knownIPCount: knownIPs.length
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'admin-stats': {
        // Check if admin
        const { data: roleData } = await supabaseClient
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (roleData?.role !== 'admin') {
          return new Response(
            JSON.stringify({ error: 'Admin access required' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get all users with 2FA status
        const { data: profiles } = await supabaseClient
          .from('profiles')
          .select('user_id, email, full_name, two_factor_enabled, updated_at, known_ips');

        const { data: roles } = await supabaseClient
          .from('user_roles')
          .select('user_id, role');

        const roleMap = new Map(roles?.map(r => [r.user_id, r.role]) || []);

        const usersList = profiles?.map(p => ({
          userId: p.user_id,
          email: p.email || 'Unknown',
          fullName: p.full_name || 'Unknown',
          twoFactorEnabled: p.two_factor_enabled || false,
          role: roleMap.get(p.user_id) || 'user',
          lastLogin: p.updated_at,
          knownIPCount: ((p.known_ips as string[]) || []).length
        })) || [];

        const totalUsers = usersList.length;
        const usersWithTwoFactor = usersList.filter(u => u.twoFactorEnabled).length;
        const adminCount = usersList.filter(u => u.role === 'admin').length;
        const adminsWithTwoFactor = usersList.filter(u => u.role === 'admin' && u.twoFactorEnabled).length;

        return new Response(
          JSON.stringify({ 
            totalUsers,
            usersWithTwoFactor,
            adminCount,
            adminsWithTwoFactor,
            usersList
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get-blocked-ips': {
        // Check if admin
        const { data: roleData } = await supabaseClient
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (roleData?.role !== 'admin') {
          return new Response(
            JSON.stringify({ error: 'Admin access required' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get all blocked IPs with blocker info
        const { data: blockedIPs } = await supabaseClient
          .from('blocked_ips')
          .select('*')
          .order('blocked_at', { ascending: false });

        // Get blocker profiles
        const blockerIds = [...new Set(blockedIPs?.filter(b => b.blocked_by).map(b => b.blocked_by) || [])];
        const { data: blockerProfiles } = await supabaseClient
          .from('profiles')
          .select('user_id, email, full_name')
          .in('user_id', blockerIds);

        const profileMap = new Map(blockerProfiles?.map(p => [p.user_id, p]) || []);

        const enrichedBlockedIPs = blockedIPs?.map(b => ({
          ...b,
          blockedByEmail: b.blocked_by ? profileMap.get(b.blocked_by)?.email : 'System',
          blockedByName: b.blocked_by ? profileMap.get(b.blocked_by)?.full_name : 'Auto-blocked'
        })) || [];

        return new Response(
          JSON.stringify({ blockedIPs: enrichedBlockedIPs }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get-whitelisted-ips': {
        // Check if admin
        const { data: roleData } = await supabaseClient
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (roleData?.role !== 'admin') {
          return new Response(
            JSON.stringify({ error: 'Admin access required' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get all whitelisted IPs with adder info
        const { data: whitelistedIPs } = await supabaseClient
          .from('whitelisted_ips')
          .select('*')
          .order('created_at', { ascending: false });

        // Get adder profiles
        const adderIds = [...new Set(whitelistedIPs?.filter(w => w.added_by).map(w => w.added_by) || [])];
        const { data: adderProfiles } = await supabaseClient
          .from('profiles')
          .select('user_id, email, full_name')
          .in('user_id', adderIds);

        const profileMap = new Map(adderProfiles?.map(p => [p.user_id, p]) || []);

        const enrichedWhitelistedIPs = whitelistedIPs?.map(w => ({
          ...w,
          addedByEmail: w.added_by ? profileMap.get(w.added_by)?.email : 'Unknown',
          addedByName: w.added_by ? profileMap.get(w.added_by)?.full_name : 'Unknown'
        })) || [];

        return new Response(
          JSON.stringify({ whitelistedIPs: enrichedWhitelistedIPs }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'block-ip': {
        // Check if admin
        const { data: roleData } = await supabaseClient
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (roleData?.role !== 'admin') {
          return new Response(
            JSON.stringify({ error: 'Admin access required' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { ipToBlock, reason, expiresIn } = body;

        if (!ipToBlock) {
          return new Response(
            JSON.stringify({ error: 'IP address is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Check if IP is whitelisted
        const whitelisted = await isIPWhitelisted(supabaseClient, ipToBlock);
        if (whitelisted) {
          return new Response(
            JSON.stringify({ error: 'Cannot block a whitelisted IP. Remove from whitelist first.' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Calculate expiration if provided (in hours)
        const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 3600000).toISOString() : null;

        // Insert or update block
        const { data: existingBlock } = await supabaseClient
          .from('blocked_ips')
          .select('id')
          .eq('ip_address', ipToBlock)
          .single();

        if (existingBlock) {
          await supabaseClient
            .from('blocked_ips')
            .update({
              blocked_by: user.id,
              reason: reason || 'Manually blocked by admin',
              is_auto_blocked: false,
              blocked_at: new Date().toISOString(),
              expires_at: expiresAt
            })
            .eq('id', existingBlock.id);
        } else {
          await supabaseClient.from('blocked_ips').insert({
            ip_address: ipToBlock,
            blocked_by: user.id,
            reason: reason || 'Manually blocked by admin',
            is_auto_blocked: false,
            expires_at: expiresAt
          });
        }

        return new Response(
          JSON.stringify({ success: true, ip: ipToBlock }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'unblock-ip': {
        // Check if admin
        const { data: roleData } = await supabaseClient
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (roleData?.role !== 'admin') {
          return new Response(
            JSON.stringify({ error: 'Admin access required' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { ipToUnblock } = body;

        if (!ipToUnblock) {
          return new Response(
            JSON.stringify({ error: 'IP address is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        await supabaseClient
          .from('blocked_ips')
          .delete()
          .eq('ip_address', ipToUnblock);

        return new Response(
          JSON.stringify({ success: true, ip: ipToUnblock }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'whitelist-ip': {
        // Check if admin
        const { data: roleData } = await supabaseClient
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (roleData?.role !== 'admin') {
          return new Response(
            JSON.stringify({ error: 'Admin access required' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { ipToWhitelist, notes } = body;

        if (!ipToWhitelist) {
          return new Response(
            JSON.stringify({ error: 'IP address is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Remove from blocked list if exists
        await supabaseClient
          .from('blocked_ips')
          .delete()
          .eq('ip_address', ipToWhitelist);

        // Add to whitelist (upsert)
        const { error: whitelistError } = await supabaseClient
          .from('whitelisted_ips')
          .upsert({
            ip_address: ipToWhitelist,
            added_by: user.id,
            notes: notes || 'Whitelisted by admin'
          }, { onConflict: 'ip_address' });

        if (whitelistError) {
          return new Response(
            JSON.stringify({ error: 'Failed to whitelist IP' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, ip: ipToWhitelist }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'remove-whitelist-ip': {
        // Check if admin
        const { data: roleData } = await supabaseClient
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (roleData?.role !== 'admin') {
          return new Response(
            JSON.stringify({ error: 'Admin access required' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { ipToRemove } = body;

        if (!ipToRemove) {
          return new Response(
            JSON.stringify({ error: 'IP address is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        await supabaseClient
          .from('whitelisted_ips')
          .delete()
          .eq('ip_address', ipToRemove);

        return new Response(
          JSON.stringify({ success: true, ip: ipToRemove }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'check-ip-status': {
        // Check if admin
        const { data: roleData } = await supabaseClient
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (roleData?.role !== 'admin') {
          return new Response(
            JSON.stringify({ error: 'Admin access required' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { ipToCheck } = body;
        const ipAddress = ipToCheck || clientIP;

        const blocked = await isIPBlocked(supabaseClient, ipAddress);
        const whitelisted = await isIPWhitelisted(supabaseClient, ipAddress);

        return new Response(
          JSON.stringify({ 
            ip: ipAddress,
            isBlocked: blocked.blocked,
            blockReason: blocked.reason,
            blockExpiresAt: blocked.expiresAt,
            isWhitelisted: whitelisted
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('2FA Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});