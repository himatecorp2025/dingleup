import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InvitationRecord {
  inviter_id: string;
  invited_user_id: string;
  accepted: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('[Backfill] Starting friendship backfill from accepted invitations...');

    // Get all accepted invitations
    const { data: invitations, error: invError } = await supabase
      .from('invitations')
      .select('inviter_id, invited_user_id, accepted')
      .eq('accepted', true);

    if (invError) {
      console.error('[Backfill] Error fetching invitations:', invError);
      throw invError;
    }

    if (!invitations || invitations.length === 0) {
      console.log('[Backfill] No accepted invitations found');
      return new Response(
        JSON.stringify({ success: true, processed: 0, message: 'No invitations to backfill' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Backfill] Found ${invitations.length} accepted invitations to process`);

    let successCount = 0;
    let errorCount = 0;
    const errors: any[] = [];

    // Process in chunks of 100
    const chunkSize = 100;
    for (let i = 0; i < invitations.length; i += chunkSize) {
      const chunk = invitations.slice(i, i + chunkSize);
      
      for (const invitation of chunk) {
        try {
          // Call the database function to create friendship
          const { data, error } = await supabase.rpc('create_friendship_from_invitation', {
            p_inviter_id: invitation.inviter_id,
            p_invitee_id: invitation.invited_user_id
          });

          if (error) {
            console.error(`[Backfill] Error creating friendship for ${invitation.inviter_id} <-> ${invitation.invited_user_id}:`, error);
            errorCount++;
            errors.push({ invitation, error: error.message });
          } else {
            console.log(`[Backfill] Created friendship: ${invitation.inviter_id} <-> ${invitation.invited_user_id}`);
            successCount++;
          }
        } catch (err) {
          console.error(`[Backfill] Exception for ${invitation.inviter_id} <-> ${invitation.invited_user_id}:`, err);
          errorCount++;
          errors.push({ invitation, error: err instanceof Error ? err.message : 'Unknown error' });
        }
      }
    }

    console.log(`[Backfill] Completed: ${successCount} successful, ${errorCount} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: invitations.length,
        successful: successCount,
        errors: errorCount,
        errorDetails: errors.slice(0, 10) // Only return first 10 errors
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[Backfill] Fatal error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
