import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts';

interface QuestionReactionToggleResponse {
  liked: boolean;
  disliked: boolean;
  questionLikeCount: number;
  questionDislikeCount: number;
}

type ReactionType = 'like' | 'dislike';

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
    const pathParts = url.pathname.split('/');
    const questionId = pathParts[pathParts.length - 2]; // /api/questions/:questionId/like or /api/questions/:questionId/dislike
    const reactionType: ReactionType = pathParts[pathParts.length - 1] === 'like' ? 'like' : 'dislike';

    if (!questionId) {
      return new Response(
        JSON.stringify({ error: 'Question ID required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if question exists
    const { data: question, error: questionError } = await supabaseClient
      .from('questions')
      .select('id, like_count, dislike_count')
      .eq('id', questionId)
      .single();

    if (questionError || !question) {
      return new Response(
        JSON.stringify({ error: 'Question not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get current user reactions
    const { data: likeData } = await supabaseClient
      .from('question_likes')
      .select('id')
      .eq('question_id', questionId)
      .eq('user_id', user.id)
      .maybeSingle();

    const { data: dislikeData } = await supabaseClient
      .from('question_dislikes')
      .select('id')
      .eq('question_id', questionId)
      .eq('user_id', user.id)
      .maybeSingle();

    const hasLike = !!likeData;
    const hasDislike = !!dislikeData;

    // Transaction logic
    if (reactionType === 'like') {
      if (hasLike) {
        // User already liked - remove like (toggle off)
        await supabaseClient
          .from('question_likes')
          .delete()
          .eq('question_id', questionId)
          .eq('user_id', user.id);
      } else {
        // User wants to like
        if (hasDislike) {
          // Remove dislike first
          await supabaseClient
            .from('question_dislikes')
            .delete()
            .eq('question_id', questionId)
            .eq('user_id', user.id);
        }
        // Add like
        await supabaseClient
          .from('question_likes')
          .insert({ question_id: questionId, user_id: user.id });
      }
    } else {
      // reactionType === 'dislike'
      if (hasDislike) {
        // User already disliked - remove dislike (toggle off)
        await supabaseClient
          .from('question_dislikes')
          .delete()
          .eq('question_id', questionId)
          .eq('user_id', user.id);
      } else {
        // User wants to dislike
        if (hasLike) {
          // Remove like first
          await supabaseClient
            .from('question_likes')
            .delete()
            .eq('question_id', questionId)
            .eq('user_id', user.id);
        }
        // Add dislike
        await supabaseClient
          .from('question_dislikes')
          .insert({ question_id: questionId, user_id: user.id });
      }
    }

    // Get updated counts and user reactions
    const { data: updatedQuestion } = await supabaseClient
      .from('questions')
      .select('like_count, dislike_count')
      .eq('id', questionId)
      .single();

    const { data: updatedLike } = await supabaseClient
      .from('question_likes')
      .select('id')
      .eq('question_id', questionId)
      .eq('user_id', user.id)
      .maybeSingle();

    const { data: updatedDislike } = await supabaseClient
      .from('question_dislikes')
      .select('id')
      .eq('question_id', questionId)
      .eq('user_id', user.id)
      .maybeSingle();

    const response: QuestionReactionToggleResponse = {
      liked: !!updatedLike,
      disliked: !!updatedDislike,
      questionLikeCount: updatedQuestion?.like_count || 0,
      questionDislikeCount: updatedQuestion?.dislike_count || 0,
    };

    console.log(`[toggle-question-reaction] User ${user.id} toggled ${reactionType} on question ${questionId}. New state:`, response);

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[toggle-question-reaction] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});