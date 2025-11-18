import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  
  if (req.method === 'OPTIONS') {
    return handleCorsPreflight(origin);
  }
  
  const corsHeaders = getCorsHeaders(origin);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Verify admin user
    const anonClient = createClient(supabaseUrl, supabaseAnonKey);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check admin role
    const { data: hasAdminRole } = await anonClient.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (!hasAdminRole) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { reporterId, message, reportId, newStatus, reasonType, reportDetails } = await req.json();

    if (!reporterId || !message || !reportId || !newStatus || !reportDetails) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate message length
    if (message.length > 2000) {
      return new Response(
        JSON.stringify({ error: 'Üzenet túl hosszú (max 2000 karakter)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use service role to bypass RLS
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // Create a system user for DingleUP! if not exists
    let systemUserId: string;
    const { data: systemUser } = await serviceClient
      .from('profiles')
      .select('id')
      .eq('email', 'system@dingleup.com')
      .single();

    if (systemUser) {
      systemUserId = systemUser.id;
    } else {
      // Create system user account
      const { data: authUser, error: authError } = await serviceClient.auth.admin.createUser({
        email: 'system@dingleup.com',
        email_confirm: true,
        user_metadata: {
          username: 'DingleUP!',
          avatar_url: '/dingleup-logo.png'
        }
      });

      if (authError || !authUser.user) {
        throw new Error('Failed to create system user');
      }

      systemUserId = authUser.user.id;

      // Update profile with logo
      await serviceClient
        .from('profiles')
        .update({
          username: 'DingleUP!',
          avatar_url: '/dingleup-logo.png'
        })
        .eq('id', systemUserId);
    }

    // Get or create thread between DingleUP! and reporter
    const normalizedIds = [systemUserId, reporterId].sort();
    let threadId: string;

    const { data: existingThread } = await serviceClient
      .from('dm_threads')
      .select('id')
      .eq('user_id_a', normalizedIds[0])
      .eq('user_id_b', normalizedIds[1])
      .single();

    if (existingThread) {
      threadId = existingThread.id;
    } else {
      // Create thread
      const { data: newThread, error: threadError } = await serviceClient
        .from('dm_threads')
        .insert({
          user_id_a: normalizedIds[0],
          user_id_b: normalizedIds[1]
        })
        .select('id')
        .single();

      if (threadError) {
        throw threadError;
      }

      threadId = newThread.id;

      // Ensure friendship exists (admin can message anyone)
      const { error: friendshipError } = await serviceClient
        .from('friendships')
        .insert({
          user_id_a: normalizedIds[0],
          user_id_b: normalizedIds[1],
          status: 'active',
          source: 'admin',
          requested_by: user.id
        })
        .select()
        .single();

      if (friendshipError && friendshipError.code !== '23505') { // Ignore duplicate error
        // Friendship creation failed
      }
    }

    // Sanitize message
    const sanitizedMessage = message
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .trim();

    // Build detailed message
    const statusLabels: Record<string, string> = {
      reviewing: '📋 Folyamatban',
      resolved: '✅ Megoldva',
      dismissed: '❌ Elutasítva'
    };

    let detailsSection = '';
    if (reportDetails.reportType === 'bug') {
      detailsSection = `
📱 Jelentés típusa: Fejlesztői (Bug)
🏷️ Kategória: ${reportDetails.bugCategory || 'N/A'}
📝 Leírás: ${reportDetails.bugDescription || 'N/A'}`;
    } else {
      detailsSection = `
⚠️ Jelentés típusa: Felhasználói (Visszaélés)
👤 Jelentett felhasználó: ${reportDetails.reportedUsername || 'N/A'}
🚫 Visszaélés típusa: ${reportDetails.violationType || 'N/A'}
📝 Részletek: ${reportDetails.violationDescription || 'N/A'}`;
    }

    const fullMessage = `${statusLabels[newStatus]}

━━━━━━━━━━━━━━━━━━━━━━
📋 JELENTÉS RÉSZLETEI
━━━━━━━━━━━━━━━━━━━━━━
${detailsSection}
${reasonType ? `\n${newStatus === 'resolved' ? '🔧 Megoldott probléma típusa' : '❌ Elutasítás oka'}:\n${reasonType}\n` : ''}
━━━━━━━━━━━━━━━━━━━━━━
💬 ADMIN ÜZENETE
━━━━━━━━━━━━━━━━━━━━━━
${sanitizedMessage}

━━━━━━━━━━━━━━━━━━━━━━
Köszönjük türelmedet!
- DingleUP! Csapat 🎮`;

    // Insert message from DingleUP! system
    const { data: dmMessage, error: messageError } = await serviceClient
      .from('dm_messages')
      .insert({
        thread_id: threadId,
        sender_id: systemUserId,
        body: fullMessage
      })
      .select()
      .single();

    if (messageError) {
      throw messageError;
    }

    // Update report status
    const statusMap: Record<string, string> = {
      reviewing: 'Folyamatban',
      resolved: 'Megoldva',
      dismissed: 'Elutasítva'
    };

    const { error: updateError } = await serviceClient
      .from('reports')
      .update({
        status: newStatus,
        admin_notes: reasonType 
          ? `${statusMap[newStatus]} - ${reasonType}: ${sanitizedMessage}`
          : `${statusMap[newStatus]}: ${sanitizedMessage}`
      })
      .eq('id', reportId);

    if (updateError) {
      throw updateError;
    }

    return new Response(
      JSON.stringify({ success: true, messageId: dmMessage.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
