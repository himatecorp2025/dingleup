import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Nincs bejelentkezve' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Extract JWT token from Bearer header
    const token = authHeader.replace('Bearer ', '');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
        auth: {
          persistSession: false,
        }
      }
    );

    // Use the JWT token directly with auth.getUser()
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { questionId } = await req.json();

    if (!questionId || typeof questionId !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid question ID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user already liked this question
    const { data: existingLike, error: checkError } = await supabaseClient
      .from('question_likes')
      .select('id')
      .eq('question_id', questionId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (checkError) {
      throw checkError;
    }

    let liked = false;

    if (existingLike) {
      // Unlike: Remove the like
      const { error: deleteError } = await supabaseClient
        .from('question_likes')
        .delete()
        .eq('id', existingLike.id);

      if (deleteError) {
        throw deleteError;
      }

      liked = false;
    } else {
      // Like: Insert new like
      const { error: insertError } = await supabaseClient
        .from('question_likes')
        .insert({
          question_id: questionId,
          user_id: user.id,
        });

      if (insertError) {
        throw insertError;
      }

      liked = true;
    }

    // Get updated question like count
    const { data: question, error: questionError } = await supabaseClient
      .from('questions')
      .select('like_count, topic_id')
      .eq('id', questionId)
      .single();

    if (questionError) {
      throw questionError;
    }

    // Calculate topic total likes
    const { data: topicStats, error: topicError } = await supabaseClient
      .from('questions')
      .select('like_count')
      .eq('topic_id', question.topic_id);

    if (topicError) {
      throw topicError;
    }

    const topicTotalLikes = topicStats?.reduce((sum, q) => sum + (q.like_count || 0), 0) || 0;

    return new Response(
      JSON.stringify({
        success: true,
        liked,
        question_like_count: question.like_count || 0,
        topic_total_likes: topicTotalLikes,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'An error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});