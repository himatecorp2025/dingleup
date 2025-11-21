import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { getCorsHeaders } from '../_shared/cors.ts';

const corsHeaders = getCorsHeaders();

interface RequestBody {
  date_filter?: string; // '30', '90', '365', 'all'
  country_filter?: string | null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verify admin role
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'User not authenticated' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: hasRole } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (!hasRole) {
      return new Response(
        JSON.stringify({ success: false, error: 'Admin role required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: RequestBody = await req.json();
    const { date_filter = 'all', country_filter = null } = body;

    // Build query
    let query = supabase
      .from('profiles')
      .select('birth_date, created_at, country_code')
      .eq('age_verified', true)
      .not('birth_date', 'is', null);

    // Apply date filter
    if (date_filter !== 'all') {
      const days = parseInt(date_filter);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      query = query.gte('created_at', cutoffDate.toISOString());
    }

    // Apply country filter
    if (country_filter) {
      query = query.eq('country_code', country_filter);
    }

    const { data: profiles, error: queryError } = await query;

    if (queryError) {
      console.error('[admin-age-statistics] Query error:', queryError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch profiles' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate ages and group into buckets
    const today = new Date();
    const buckets: { [key: string]: number } = {
      '16–17': 0,
      '18–24': 0,
      '25–34': 0,
      '35–44': 0,
      '45+': 0,
    };

    profiles.forEach((profile) => {
      if (!profile.birth_date) return;

      const dob = new Date(profile.birth_date);
      let age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
      }

      // Categorize into buckets
      if (age >= 16 && age <= 17) buckets['16–17']++;
      else if (age >= 18 && age <= 24) buckets['18–24']++;
      else if (age >= 25 && age <= 34) buckets['25–34']++;
      else if (age >= 35 && age <= 44) buckets['35–44']++;
      else if (age >= 45) buckets['45+']++;
    });

    const total_users = profiles.length;
    const bucketsArray = Object.entries(buckets).map(([label, count]) => ({
      label,
      count,
      percentage: total_users > 0 ? (count / total_users) * 100 : 0,
    }));

    return new Response(
      JSON.stringify({
        total_users,
        buckets: bucketsArray,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[admin-age-statistics] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});