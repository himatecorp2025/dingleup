import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Get all legacy users (those without @dingleup.auto email)
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, username, email')
      .not('email', 'like', '%@dingleup.auto');

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch profiles' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    // Update each legacy user's password in auth.users
    for (const profile of profiles || []) {
      try {
        // New password format: PIN (123456) + username
        const newPassword = '123456' + profile.username;

        // Update user password in auth.users using admin API
        const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          profile.id,
          { password: newPassword }
        );

        if (updateError) {
          console.error(`Error updating user ${profile.username}:`, updateError);
          results.push({
            username: profile.username,
            success: false,
            error: updateError.message
          });
          errorCount++;
        } else {
          console.log(`✅ Updated user ${profile.username}`);
          results.push({
            username: profile.username,
            success: true
          });
          successCount++;
        }
      } catch (err) {
        console.error(`Exception updating user ${profile.username}:`, err);
        results.push({
          username: profile.username,
          success: false,
          error: String(err)
        });
        errorCount++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Migration complete: ${successCount} users updated, ${errorCount} errors`,
        successCount,
        errorCount,
        totalUsers: (profiles || []).length,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Migration error:', error);
    return new Response(
      JSON.stringify({ error: 'Migration failed', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
