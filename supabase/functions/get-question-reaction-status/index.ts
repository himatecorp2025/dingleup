import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts';

interface QuestionReactionStatus {
  liked: boolean;
  disliked: boolean;
  questionLikeCount: number;
  questionDislikeCount: number;
}

serve(async (req) => {
  const origin = req.headers.get('origin');
  
  if (req.method === 'OPTIONS') {
    return handleCorsPreflight(origin);
  }
  
  const corsHeaders = getCorsHeaders(origin);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Nincs bejelentkezve' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

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

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const body = await req.json();
    const questionId = body.questionId;

    if (!questionId || typeof questionId !== 'string' || questionId.trim() === '') {
      return new Response(
        JSON.stringify({ error: 'Valid question ID required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if question exists and get counts
    const { data: question, error: questionError } = await supabaseClient
      .from('questions')
      .select('like_count, dislike_count')
      .eq('id', questionId)
      .maybeSingle();

    if (questionError) {
      console.error('[get-question-reaction-status] Question query error:', questionError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch question' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!question) {
      return new Response(
        JSON.stringify({ error: 'Question not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has liked this question
    const { data: likeData } = await supabaseClient
      .from('question_likes')
      .select('id')
      .eq('question_id', questionId)
      .eq('user_id', user.id)
      .maybeSingle();

    // Check if user has disliked this question
    const { data: dislikeData } = await supabaseClient
      .from('question_dislikes')
      .select('id')
      .eq('question_id', questionId)
      .eq('user_id', user.id)
      .maybeSingle();

    const response: QuestionReactionStatus = {
      liked: !!likeData,
      disliked: !!dislikeData,
      questionLikeCount: question.like_count || 0,
      questionDislikeCount: question.dislike_count || 0,
    };

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[get-question-reaction-status] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});