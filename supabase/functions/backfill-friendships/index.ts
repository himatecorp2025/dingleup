import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts';

interface InvitationRecord {
  inviter_id: string;
  invited_user_id: string;
  accepted: boolean;
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  
  if (req.method === 'OPTIONS') {
    return handleCorsPreflight(origin);
  }
  
  const corsHeaders = getCorsHeaders(origin);

  try {
    // SECURITY: Authenticate the request - only admins can run backfill
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify JWT and check admin role
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has admin role
    const { data: roles, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError || !roles) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get all accepted invitations
    const { data: invitations, error: invError } = await supabase
      .from('invitations')
      .select('inviter_id, invited_user_id, accepted')
      .eq('accepted', true);

    if (invError) {
      throw invError;
    }

    if (!invitations || invitations.length === 0) {
      return new Response(
        JSON.stringify({ success: true, processed: 0, message: 'No invitations to backfill' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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
            errorCount++;
            errors.push({ invitation, error: error.message });
          } else {
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
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
