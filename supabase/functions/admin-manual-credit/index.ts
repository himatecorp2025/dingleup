import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // Admin role check
    const { data: roleData, error: roleError } = await supabaseClient
      .rpc('has_role', { user_id: user.id, role_name: 'admin' });

    if (roleError || !roleData) {
      console.error('Admin role check failed:', roleError);
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Rate limiting: max 10 manual credits per hour per admin
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const { count, error: countError } = await supabaseClient
      .from('admin_audit_log')
      .select('id', { count: 'exact', head: true })
      .eq('admin_user_id', user.id)
      .eq('action', 'manual_credit')
      .gte('created_at', oneHourAgo);

    if (countError) {
      console.error('Rate limit check error:', countError);
      throw new Error('Failed to check rate limit');
    }

    if (count && count >= 10) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded: Maximum 10 manual credits per hour' }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const { targetUserId, deltaGold, deltaLives, reason } = await req.json();

    if (!targetUserId || typeof targetUserId !== 'string') {
      throw new Error('Invalid target user ID');
    }

    const gold = parseInt(deltaGold) || 0;
    const lives = parseInt(deltaLives) || 0;

    if (gold === 0 && lives === 0) {
      throw new Error('At least one of deltaGold or deltaLives must be non-zero');
    }

    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      throw new Error('Reason is required');
    }

    // Verify target user exists
    const { data: targetProfile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('id, username, coins, lives')
      .eq('id', targetUserId)
      .single();

    if (profileError || !targetProfile) {
      throw new Error('Target user not found');
    }

    // Get client IP and User-Agent
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    const oldValue = {
      coins: targetProfile.coins,
      lives: targetProfile.lives,
    };

    // Credit wallet using RPC
    const idempotencyKey = `admin_manual_${user.id}_${targetUserId}_${Date.now()}`;
    
    const { error: creditError } = await supabaseClient.rpc('credit_wallet', {
      p_user_id: targetUserId,
      p_delta_coins: gold,
      p_delta_lives: lives,
      p_source: 'admin_manual_credit',
      p_idempotency_key: idempotencyKey,
      p_metadata: {
        admin_user_id: user.id,
        reason: reason.trim(),
        applied_at: new Date().toISOString(),
      }
    });

    if (creditError) {
      console.error('Credit wallet error:', creditError);
      throw new Error(`Failed to credit wallet: ${creditError.message}`);
    }

    // Get updated values
    const { data: updatedProfile } = await supabaseClient
      .from('profiles')
      .select('coins, lives')
      .eq('id', targetUserId)
      .single();

    const newValue = {
      coins: updatedProfile?.coins || (oldValue.coins + gold),
      lives: updatedProfile?.lives || (oldValue.lives + lives),
    };

    // Log to admin_audit_log
    const { error: auditError } = await supabaseClient
      .from('admin_audit_log')
      .insert({
        admin_user_id: user.id,
        action: 'manual_credit',
        resource_type: 'wallet',
        resource_id: targetUserId,
        old_value: oldValue,
        new_value: newValue,
        status: 'success',
        ip_address: ipAddress,
        user_agent: userAgent,
      });

    if (auditError) {
      console.error('Audit log error:', auditError);
      // Non-fatal, continue
    }

    console.log(`Manual credit applied: Admin ${user.id} credited user ${targetUserId} with ${gold} gold, ${lives} lives`);

    return new Response(
      JSON.stringify({ 
        success: true,
        credited: {
          gold,
          lives,
          targetUserId,
          targetUsername: targetProfile.username,
        }
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Admin manual credit error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Log failed attempt
    try {
      const authHeader = req.headers.get("Authorization");
      if (authHeader) {
        const token = authHeader.replace("Bearer ", "");
        const { data: { user } } = await supabaseClient.auth.getUser(token);
        
        if (user) {
          await supabaseClient
            .from('admin_audit_log')
            .insert({
              admin_user_id: user.id,
              action: 'manual_credit',
              resource_type: 'wallet',
              status: 'failed',
              error_message: errorMessage,
            });
        }
      }
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
