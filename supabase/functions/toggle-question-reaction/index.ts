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
        JSON.stringify({ error: 'Not logged in' }),
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

    const body = await req.json();
    const questionId = body.questionId;
    const reactionType: ReactionType = body.reactionType;

    if (!questionId || typeof questionId !== 'string' || questionId.trim() === '') {
      return new Response(
        JSON.stringify({ error: 'Valid question ID required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!reactionType || (reactionType !== 'like' && reactionType !== 'dislike')) {
      return new Response(
        JSON.stringify({ error: 'Valid reaction type required (like or dislike)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if question exists
    const { data: question, error: questionError } = await supabaseClient
      .from('questions')
      .select('id, like_count, dislike_count')
      .eq('id', questionId)
      .maybeSingle();

    if (questionError) {
      console.error('[toggle-question-reaction] Question query error:', questionError);
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

    // Determine final state based on current state and action
    let finalLiked = hasLike;
    let finalDisliked = hasDislike;

    // Transaction logic with atomic operations and race condition handling
    if (reactionType === 'like') {
      if (hasLike) {
        // Toggle off LIKE
        const { error: deleteError } = await supabaseClient
          .from('question_likes')
          .delete()
          .eq('question_id', questionId)
          .eq('user_id', user.id);
        
        if (deleteError) {
          console.error('[toggle-question-reaction] Delete like error:', deleteError);
          throw new Error('Failed to remove like');
        }
        finalLiked = false;
      } else {
        // Toggle on LIKE
        if (hasDislike) {
          // Remove dislike first (atomic order matters)
          const { error: deleteDislikeError } = await supabaseClient
            .from('question_dislikes')
            .delete()
            .eq('question_id', questionId)
            .eq('user_id', user.id);
          
          if (deleteDislikeError) {
            console.error('[toggle-question-reaction] Delete dislike error:', deleteDislikeError);
            throw new Error('Failed to remove dislike');
          }
          finalDisliked = false;
        }
        
        // Add like (use insert with error handling for unique constraint)
        const { error: insertError } = await supabaseClient
          .from('question_likes')
          .insert({ 
            question_id: questionId, 
            user_id: user.id 
          });
        
        if (insertError) {
          console.error('[toggle-question-reaction] Insert like error:', insertError);
          // If unique constraint violation, it's already liked (race condition handled)
          if (insertError.code === '23505') {
            console.log('[toggle-question-reaction] Like already exists (race condition), treating as success');
            finalLiked = true;
          } else {
            throw new Error('Failed to add like');
          }
        } else {
          finalLiked = true;
        }
      }
    } else {
      // reactionType === 'dislike'
      if (hasDislike) {
        // Toggle off DISLIKE
        const { error: deleteError } = await supabaseClient
          .from('question_dislikes')
          .delete()
          .eq('question_id', questionId)
          .eq('user_id', user.id);
        
        if (deleteError) {
          console.error('[toggle-question-reaction] Delete dislike error:', deleteError);
          throw new Error('Failed to remove dislike');
        }
        finalDisliked = false;
      } else {
        // Toggle on DISLIKE
        if (hasLike) {
          // Remove like first (atomic order matters)
          const { error: deleteLikeError } = await supabaseClient
            .from('question_likes')
            .delete()
            .eq('question_id', questionId)
            .eq('user_id', user.id);
          
          if (deleteLikeError) {
            console.error('[toggle-question-reaction] Delete like error:', deleteLikeError);
            throw new Error('Failed to remove like');
          }
          finalLiked = false;
        }
        
        // Add dislike (use insert with error handling for unique constraint)
        const { error: insertError } = await supabaseClient
          .from('question_dislikes')
          .insert({ 
            question_id: questionId, 
            user_id: user.id 
          });
        
        if (insertError) {
          console.error('[toggle-question-reaction] Insert dislike error:', insertError);
          // If unique constraint violation, it's already disliked (race condition handled)
          if (insertError.code === '23505') {
            console.log('[toggle-question-reaction] Dislike already exists (race condition), treating as success');
            finalDisliked = true;
          } else {
            throw new Error('Failed to add dislike');
          }
        } else {
          finalDisliked = true;
        }
      }
    }

    // Get updated counts from questions table (triggers have updated them)
    const { data: updatedQuestion } = await supabaseClient
      .from('questions')
      .select('like_count, dislike_count')
      .eq('id', questionId)
      .single();

    const response: QuestionReactionToggleResponse = {
      liked: finalLiked,
      disliked: finalDisliked,
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
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});