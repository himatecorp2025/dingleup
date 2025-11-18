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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Authenticate user (admin only)
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: userRole, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError || !userRole) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get all topics with their aggregated like counts
    const { data: topics, error: topicsError } = await supabaseClient
      .from('topics')
      .select('id, name, description');

    if (topicsError) {
      throw topicsError;
    }

    // Get all questions with their like counts and topic associations
    const { data: questions, error: questionsError } = await supabaseClient
      .from('questions')
      .select('topic_id, like_count');

    if (questionsError) {
      throw questionsError;
    }

    // Aggregate likes by topic
    const topicLikesMap = new Map<number, { totalLikes: number; questionCount: number }>();

    questions?.forEach((q) => {
      if (q.topic_id) {
        const current = topicLikesMap.get(q.topic_id) || { totalLikes: 0, questionCount: 0 };
        topicLikesMap.set(q.topic_id, {
          totalLikes: current.totalLikes + (q.like_count || 0),
          questionCount: current.questionCount + 1,
        });
      }
    });

    // Build response
    const popularityData = topics?.map((topic) => {
      const stats = topicLikesMap.get(topic.id) || { totalLikes: 0, questionCount: 0 };
      return {
        topic_id: topic.id,
        topic_name: topic.name,
        topic_description: topic.description,
        total_likes: stats.totalLikes,
        question_count: stats.questionCount,
      };
    }) || [];

    // Sort by total likes descending
    popularityData.sort((a, b) => b.total_likes - a.total_likes);

    return new Response(
      JSON.stringify({
        success: true,
        topics: popularityData,
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