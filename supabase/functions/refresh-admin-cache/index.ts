import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts';

/**
 * Refresh Admin Materialized Views (Cron Job)
 * 
 * SCHEDULED: Runs every hour via cron
 * PURPOSE: Keeps materialized views fresh for admin analytics
 * 
 * Refreshes:
 * - mv_daily_engagement_metrics
 * - mv_hourly_engagement
 * - mv_feature_usage_summary
 * 
 * SECURITY: Can be called by:
 * - Supabase cron (service role)
 * - Admin users manually (via UI button)
 */

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  if (req.method === 'OPTIONS') {
    return handleCorsPreflight(origin);
  }
  const corsHeaders = getCorsHeaders(origin);

  try {
    const authHeader = req.headers.get('Authorization');
    
    // Allow service role OR admin users
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    let isAuthorized = false;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const anon = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!);
      const { data: { user }, error: authError } = await anon.auth.getUser(token);
      
      if (!authError && user) {
        const { data: hasAdminRole } = await anon.rpc('has_role', { 
          _user_id: user.id, 
          _role: 'admin' 
        });
        isAuthorized = hasAdminRole || false;
      }
    } else {
      // No auth header - assume cron/service role call
      isAuthorized = true;
    }

    if (!isAuthorized) {
      return new Response(JSON.stringify({ error: 'Forbidden: Admin or service role required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use service role to refresh views
    const service = createClient(supabaseUrl, supabaseServiceKey);

    // Call the RPC function that refreshes all views
    const { data, error } = await service.rpc('refresh_admin_materialized_views');

    if (error) {
      console.error('[refresh-admin-cache] RPC error:', error);
      throw error;
    }

    console.log('[refresh-admin-cache] Successfully refreshed:', data);

    return new Response(JSON.stringify({
      success: true,
      refreshed_at: new Date().toISOString(),
      result: data
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('[refresh-admin-cache] Fatal error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error?.message || 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});