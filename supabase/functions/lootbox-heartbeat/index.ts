import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts';

/**
 * Lootbox Heartbeat Edge Function
 * 
 * Processes pending lootbox slots based on user activity.
 * Called periodically (20-60s) when user is active in the app.
 * 
 * Logic:
 * 1. Get or generate today's lootbox_daily_plan
 * 2. Find pending slots where slot_time <= now
 * 3. If no active_drop exists, create one from first pending slot
 * 4. Mark slot as delivered, increment delivered_count
 */

const getUserIdFromAuthHeader = (req: Request): string | null => {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
    return null;
  }

  const token = authHeader.slice(7).trim();
  const parts = token.split('.');
  if (parts.length !== 3) {
    console.error('[lootbox-heartbeat] Invalid JWT format');
    return null;
  }

  try {
    const payloadJson = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(payloadJson);
    return typeof payload.sub === 'string' ? payload.sub : null;
  } catch (err) {
    console.error('[lootbox-heartbeat] Failed to decode JWT payload', err);
    return null;
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflight(req.headers.get('origin'));
  }

  try {
    const userId = getUserIdFromAuthHeader(req);
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized', details: 'Invalid or missing token' }), {
        status: 401,
        headers: { ...getCorsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    const now = new Date();
    const today = now.toISOString().split('T')[0]; // YYYY-MM-DD

    // 1. Get or generate today's plan
    let { data: plan, error: planError } = await supabaseAdmin
      .from('lootbox_daily_plan')
      .select('*')
      .eq('user_id', userId)
      .eq('plan_date', today)
      .single();

    if (planError || !plan) {
      // Generate new plan for today
      const { data: newPlanId, error: genError } = await supabaseAdmin.rpc(
        'generate_lootbox_daily_plan',
        {
          p_user_id: userId,
          p_plan_date: today,
          p_first_login_time: now.toISOString()
        }
      );

      if (genError) {
        console.error('[Lootbox Heartbeat] Failed to generate plan:', genError);
        return new Response(JSON.stringify({ error: 'Failed to generate daily plan' }), {
          status: 500,
          headers: { ...getCorsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' },
        });
      }

      // Fetch the newly generated plan
      const { data: fetchedPlan, error: fetchError } = await supabaseAdmin
        .from('lootbox_daily_plan')
        .select('*')
        .eq('user_id', userId)
        .eq('plan_date', today)
        .single();

      if (fetchError || !fetchedPlan) {
        return new Response(JSON.stringify({ error: 'Failed to fetch generated plan' }), {
          status: 500,
          headers: { ...getCorsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' },
        });
      }

      plan = fetchedPlan;
    }

    // 2. Check if there's already an active drop
    const { data: activeDrop } = await supabaseAdmin
      .from('lootbox_instances')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active_drop')
      .gt('expires_at', now.toISOString())
      .single();

    if (activeDrop) {
      // Already has active drop, don't create another
      return new Response(
        JSON.stringify({
          success: true,
          has_active_drop: true,
          plan: {
            target_count: plan.target_count,
            delivered_count: plan.delivered_count
          }
        }),
        {
          status: 200,
          headers: { ...getCorsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' },
        }
      );
    }

    // 2.5. Check cooldown: minimum 15 minutes between drops
    const COOLDOWN_MINUTES = 15;
    const cooldownMs = COOLDOWN_MINUTES * 60 * 1000;
    
    const { data: lastDrop } = await supabaseAdmin
      .from('lootbox_instances')
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (lastDrop) {
      const lastDropTime = new Date(lastDrop.created_at);
      const timeSinceLastDrop = now.getTime() - lastDropTime.getTime();
      
      if (timeSinceLastDrop < cooldownMs) {
        const remainingMinutes = Math.ceil((cooldownMs - timeSinceLastDrop) / (60 * 1000));
        return new Response(
          JSON.stringify({
            success: true,
            has_active_drop: false,
            cooldown_active: true,
            remaining_minutes: remainingMinutes,
            plan: {
              target_count: plan.target_count,
              delivered_count: plan.delivered_count
            }
          }),
          {
            status: 200,
            headers: { ...getCorsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // 3. Find pending slots that are due
    const slots = plan.slots as Array<{
      slot_id: number;
      slot_time: string;
      status: string;
    }>;

    const pendingDueSlots = slots.filter(slot => 
      slot.status === 'pending' && 
      new Date(slot.slot_time) <= now
    );

    if (pendingDueSlots.length === 0) {
      // No pending slots due yet
      return new Response(
        JSON.stringify({
          success: true,
          has_active_drop: false,
          no_pending_slots: true,
          plan: {
            target_count: plan.target_count,
            delivered_count: plan.delivered_count
          }
        }),
        {
          status: 200,
          headers: { ...getCorsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' },
        }
      );
    }

    // 4. Create active_drop from first pending slot
    const firstSlot = pendingDueSlots[0];

    // Insert lootbox_instance (active_drop)
    const expiresAt = new Date(now.getTime() + 60 * 1000); // 60 seconds from now
    
    console.log('[Lootbox Heartbeat] Creating drop with data:', {
      user_id: userId,
      status: 'active_drop',
      source: 'daily_activity',
      open_cost_gold: 150,
      expires_at: expiresAt.toISOString(),
      metadata: {
        slot_id: firstSlot.slot_id,
        plan_date: today,
        slot_time: firstSlot.slot_time
      }
    });
    
    const { data: newDrop, error: dropError } = await supabaseAdmin
      .from('lootbox_instances')
      .insert({
        user_id: userId,
        status: 'active_drop',
        source: 'daily_activity',
        open_cost_gold: 150,
        expires_at: expiresAt.toISOString(),
        metadata: {
          slot_id: firstSlot.slot_id,
          plan_date: today,
          slot_time: firstSlot.slot_time
        }
      })
      .select()
      .single();

    if (dropError || !newDrop) {
      console.error('[Lootbox Heartbeat] Failed to create drop. Error details:', {
        error: dropError,
        message: dropError?.message,
        details: dropError?.details,
        hint: dropError?.hint,
        code: dropError?.code
      });
      return new Response(JSON.stringify({ 
        error: 'Failed to create lootbox drop',
        details: dropError?.message,
        hint: dropError?.hint
      }), {
        status: 500,
        headers: { ...getCorsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' },
      });
    }
    
    console.log('[Lootbox Heartbeat] Drop created successfully:', newDrop.id);

    // 5. Update slot status to 'delivered' and increment delivered_count
    const updatedSlots = slots.map(slot => 
      slot.slot_id === firstSlot.slot_id
        ? { ...slot, status: 'delivered' }
        : slot
    );

    const { error: updateError } = await supabaseAdmin
      .from('lootbox_daily_plan')
      .update({
        slots: updatedSlots,
        delivered_count: plan.delivered_count + 1,
        updated_at: now.toISOString()
      })
      .eq('id', plan.id);

    if (updateError) {
      console.error('[Lootbox Heartbeat] Failed to update plan:', updateError);
    }

    // 6. Check if we're near end of day and below minimum (catch-up logic)
    const endOfDay = new Date(today + 'T23:59:59');
    const hoursUntilEOD = (endOfDay.getTime() - now.getTime()) / (1000 * 60 * 60);
    const needsCatchup = hoursUntilEOD <= 2 && (plan.delivered_count + 1) < 10;

    return new Response(
      JSON.stringify({
        success: true,
        has_active_drop: true,
        drop_created: true,
        lootbox: newDrop,
        plan: {
          target_count: plan.target_count,
          delivered_count: plan.delivered_count + 1,
          pending_slots: pendingDueSlots.length - 1,
          needs_catchup: needsCatchup
        }
      }),
      {
        status: 200,
        headers: { ...getCorsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('[Lootbox Heartbeat] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      {
        status: 500,
        headers: { ...getCorsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' },
      }
    );
  }
});
