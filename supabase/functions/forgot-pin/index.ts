import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Hash recovery code using SHA-256
async function hashRecoveryCode(code: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(code);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// Hash PIN using SHA-256
async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// Generate new secure random recovery code (format: XXXX-XXXX-XXXX)
function generateRecoveryCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const segments: string[] = [];
  
  for (let i = 0; i < 3; i++) {
    let segment = '';
    for (let j = 0; j < 4; j++) {
      const randomIndex = Math.floor(Math.random() * chars.length);
      segment += chars[randomIndex];
    }
    segments.push(segment);
  }
  
  return segments.join('-');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { username, recovery_code, new_pin, new_pin_confirm } = await req.json();

    // Validation: all fields required
    if (!username || !recovery_code || !new_pin || !new_pin_confirm) {
      return new Response(
        JSON.stringify({ error: 'Minden mező kitöltése kötelező' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate new PIN format (exactly 6 digits)
    if (!/^\d{6}$/.test(new_pin)) {
      return new Response(
        JSON.stringify({ error: 'Az új PIN kódnak pontosan 6 számjegyből kell állnia' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate PIN confirmation match
    if (new_pin !== new_pin_confirm) {
      return new Response(
        JSON.stringify({ error: 'Az új PIN kódok nem egyeznek' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // ATOMIC OPERATION: Use RPC to handle forgot-pin with proper locking and rate limiting
    // This prevents race conditions under high concurrent load (multiple forgot-pin requests for same user)
    const now = new Date();
    
    // OPTIMIZATION: Hash recovery code once before database call
    const recoveryCodeHash = await hashRecoveryCode(recovery_code.trim().toUpperCase());
    
    // Call PostgreSQL RPC that handles the entire forgot-pin flow atomically with row-level locking
    const { data: result, error: rpcError } = await supabaseAdmin.rpc('forgot_pin_atomic', {
      p_username: username,
      p_recovery_code_hash: recoveryCodeHash,
      p_new_pin: new_pin,
      p_now: now.toISOString()
    });

    if (rpcError || !result) {
      console.error('[forgot-pin] RPC call failed:', rpcError);
      
      // Map RPC error codes to user-facing messages
      const errorCode = result?.error_code || rpcError?.code || 'UNKNOWN_ERROR';
      const errorMessage = result?.error || rpcError?.message || 'Váratlan hiba történt';
      
      // Determine HTTP status based on error code
      let statusCode = 500;
      if (errorCode === 'USER_NOT_FOUND' || errorCode === 'INVALID_RECOVERY_CODE') {
        statusCode = 401;
      } else if (errorCode === 'RATE_LIMIT_EXCEEDED') {
        statusCode = 429;
      }
      
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          error_code: errorCode
        }),
        { status: statusCode, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract results from RPC response
    const userId = result.user_id;
    const userUsername = result.username;
    const newRecoveryCode = result.new_recovery_code;

    // OPTIMIZATION: Auth password sync (non-blocking, profile is source of truth)
    // Continue even if this fails - login will work from profile.pin_hash
    supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password: new_pin + userUsername }
    ).catch((authError) => {
      console.error('[forgot-pin] Auth password sync failed (non-critical):', authError.message);
    });

    // Success log (no sensitive data)
    console.log(`[forgot-pin] Successful PIN reset for user ${userId}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'A PIN kódod sikeresen frissült.',
        new_recovery_code: newRecoveryCode,
        // IMPORTANT: Frontend must display this new recovery code to the user
        // Message: "Az új helyreállítási kódod: [code]. Írd fel / mentsd el biztonságosan!"
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[forgot-pin] Unexpected error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return new Response(
      JSON.stringify({ 
        error: 'Váratlan hiba történt',
        error_code: 'UNEXPECTED_ERROR'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});