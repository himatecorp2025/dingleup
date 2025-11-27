import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import * as bcrypt from 'https://deno.land/x/bcrypt@v0.4.1/mod.ts';

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

    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      throw new Error('Missing password data');
    }

    // Validate new password requirements
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.])[A-Za-z\d@$!%*?&.]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      throw new Error('Password must contain lowercase, uppercase, number, special character (@$!%*?&.) and be at least 8 characters long');
    }

    // Verify current password by attempting to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: currentPassword
    });

    if (signInError) {
      throw new Error('Current password is incorrect');
    }

    // Hash the new password for comparison with history
    const newPasswordHash = await bcrypt.hash(newPassword);

    // Check password history (last 90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const { data: passwordHistory, error: historyError } = await supabase
      .from('password_history')
      .select('password_hash')
      .eq('user_id', user.id)
      .gte('created_at', ninetyDaysAgo.toISOString())
      .order('created_at', { ascending: false });

    if (historyError) {
      console.error('Error fetching password history:', historyError);
    }

    // Check if new password matches any in history
    if (passwordHistory && passwordHistory.length > 0) {
      for (const record of passwordHistory) {
        const matches = await bcrypt.compare(newPassword, record.password_hash);
        if (matches) {
          throw new Error('This password was used in the last 90 days. Please choose a different password.');
        }
      }
    }

    // Update password in auth.users
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (updateError) {
      throw new Error('Failed to update password');
    }

    // Store new password hash in history
    const { error: historyInsertError } = await supabase
      .from('password_history')
      .insert({
        user_id: user.id,
        password_hash: newPasswordHash,
        created_at: new Date().toISOString()
      });

    if (historyInsertError) {
      console.error('Error storing password in history:', historyInsertError);
    }

    // Clean up old password history (older than 90 days)
    await supabase
      .from('password_history')
      .delete()
      .eq('user_id', user.id)
      .lt('created_at', ninetyDaysAgo.toISOString());

    return new Response(
      JSON.stringify({ success: true, message: 'Password successfully updated' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Password update error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
