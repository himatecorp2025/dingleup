import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts';

interface TopicPopularityRow {
  topicId: number;
  topicName: string;
  totalLikes: number;
  totalDislikes: number;
  netScore: number;
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

    // Check if user has admin role
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

    // Aggregate likes and dislikes by topic
    const { data: topicsData, error: topicsError } = await supabaseClient
      .from('topics')
      .select(`
        id,
        name,
        questions (
          like_count,
          dislike_count
        )
      `);

    if (topicsError) {
      console.error('[admin-topic-popularity] Error fetching topics:', topicsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch topic popularity data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Aggregate counts per topic
    const popularityData: TopicPopularityRow[] = (topicsData || []).map((topic: any) => {
      const totalLikes = (topic.questions || []).reduce((sum: number, q: any) => sum + (q.like_count || 0), 0);
      const totalDislikes = (topic.questions || []).reduce((sum: number, q: any) => sum + (q.dislike_count || 0), 0);
      
      return {
        topicId: topic.id,
        topicName: topic.name,
        totalLikes,
        totalDislikes,
        netScore: totalLikes - totalDislikes,
      };
    });

    // Sort by netScore descending, then by topicName ascending
    popularityData.sort((a, b) => {
      if (b.netScore !== a.netScore) {
        return b.netScore - a.netScore;
      }
      return a.topicName.localeCompare(b.topicName);
    });

    console.log(`[admin-topic-popularity] Returning ${popularityData.length} topics for admin user ${user.id}`);

    return new Response(
      JSON.stringify(popularityData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[admin-topic-popularity] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});