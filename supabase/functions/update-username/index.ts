import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

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
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { newUsername } = await req.json();

    if (!newUsername || typeof newUsername !== 'string') {
      throw new Error('Invalid username');
    }

    // Validate username format
    const trimmedUsername = newUsername.trim();
    if (trimmedUsername.length < 3 || trimmedUsername.length > 30) {
      throw new Error('Username must be between 3 and 30 characters');
    }

    // Check if username is already taken
    const { data: existingUser, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', trimmedUsername)
      .neq('id', user.id)
      .single();

    if (existingUser) {
      throw new Error('This username is already taken');
    }

    // Check last username change (7-day limit)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('last_username_change')
      .eq('id', user.id)
      .single();

    if (profileError) {
      throw new Error('Profile loading failed');
    }

    if (profile.last_username_change) {
      const lastChange = new Date(profile.last_username_change);
      const now = new Date();
      const daysSinceLastChange = (now.getTime() - lastChange.getTime()) / (1000 * 60 * 60 * 24);

      if (daysSinceLastChange < 7) {
        const daysRemaining = Math.ceil(7 - daysSinceLastChange);
        throw new Error(`Username can be changed in ${daysRemaining} days`);
      }
    }

    // Update username and timestamp
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        username: trimmedUsername,
        last_username_change: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      throw new Error('Username update failed');
    }

    // Also update global_leaderboard if user has entry there
    await supabase
      .from('global_leaderboard')
      .update({ username: trimmedUsername })
      .eq('user_id', user.id);

    return new Response(
      JSON.stringify({ success: true, message: 'Username successfully updated' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Username update error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
