import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TOTAL_POOLS = 15;
const QUESTIONS_PER_POOL = 300;
const TOPICS_PER_POOL = 30;
const QUESTIONS_PER_TOPIC = 10;
const QUESTIONS_PER_GAME = 15;

interface TestResults {
  timestamp: string;
  pool_integrity: {
    passed: boolean;
    total_pools: number;
    valid_pools: number;
    issues: string[];
  };
  performance: {
    passed: boolean;
    avg_selection_time_ms: number;
    max_selection_time_ms: number;
    min_selection_time_ms: number;
    target_ms: number;
    samples: number;
  };
  stress_test: {
    passed: boolean;
    concurrent_requests: number;
    successful: number;
    failed: number;
    avg_response_time_ms: number;
    max_response_time_ms: number;
  };
  rotation_test: {
    passed: boolean;
    cycles: number;
    issues: string[];
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('[POOL TEST] Starting comprehensive pool system tests...');
    const results: TestResults = {
      timestamp: new Date().toISOString(),
      pool_integrity: await testPoolIntegrity(supabase),
      performance: await testPerformance(supabase),
      stress_test: await testStress(supabase),
      rotation_test: await testRotation(supabase)
    };

    const allPassed = results.pool_integrity.passed &&
                      results.performance.passed &&
                      results.stress_test.passed &&
                      results.rotation_test.passed;

    return new Response(
      JSON.stringify({
        success: allPassed,
        results,
        summary: {
          all_tests_passed: allPassed,
          pool_integrity: results.pool_integrity.passed ? '✅' : '❌',
          performance: results.performance.passed ? '✅' : '❌',
          stress_test: results.stress_test.passed ? '✅' : '❌',
          rotation: results.rotation_test.passed ? '✅' : '❌'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[POOL TEST] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

// Test 1: Pool Integrity - All 15 pools have exactly 300 questions
async function testPoolIntegrity(supabase: any) {
  console.log('[TEST 1] Checking pool integrity...');
  const issues: string[] = [];

  const { data: pools, error } = await supabase
    .from('question_pools')
    .select('*')
    .order('pool_order');

  if (error) {
    issues.push(`Failed to fetch pools: ${error.message}`);
    return { passed: false, total_pools: 0, valid_pools: 0, issues };
  }

  if (!pools || pools.length !== TOTAL_POOLS) {
    issues.push(`Expected ${TOTAL_POOLS} pools, found ${pools?.length || 0}`);
  }

  let validPools = 0;
  for (const pool of pools || []) {
    const questions = Array.isArray(pool.questions) ? pool.questions : [];
    
    if (questions.length !== QUESTIONS_PER_POOL) {
      issues.push(`Pool ${pool.pool_order}: has ${questions.length} questions, expected ${QUESTIONS_PER_POOL}`);
    } else {
      validPools++;
    }

    // Check topic distribution
    const topicCounts = new Map<number, number>();
    for (const q of questions) {
      topicCounts.set(q.topic_id, (topicCounts.get(q.topic_id) || 0) + 1);
    }

    if (topicCounts.size !== TOPICS_PER_POOL) {
      issues.push(`Pool ${pool.pool_order}: has ${topicCounts.size} topics, expected ${TOPICS_PER_POOL}`);
    }

    for (const [topicId, count] of topicCounts.entries()) {
      if (count !== QUESTIONS_PER_TOPIC) {
        issues.push(`Pool ${pool.pool_order}, Topic ${topicId}: has ${count} questions, expected ${QUESTIONS_PER_TOPIC}`);
      }
    }
  }

  return {
    passed: issues.length === 0,
    total_pools: pools?.length || 0,
    valid_pools: validPools,
    issues
  };
}

// Test 2: Performance - 15 question selection takes <5ms
async function testPerformance(supabase: any) {
  console.log('[TEST 2] Testing selection performance...');
  const samples = 1000;
  const targetMs = 5;
  const times: number[] = [];

  const { data: pools } = await supabase
    .from('question_pools')
    .select('*')
    .limit(5); // Test with first 5 pools

  if (!pools || pools.length === 0) {
    return {
      passed: false,
      avg_selection_time_ms: 0,
      max_selection_time_ms: 0,
      min_selection_time_ms: 0,
      target_ms: targetMs,
      samples: 0
    };
  }

  for (let i = 0; i < samples; i++) {
    const pool = pools[i % pools.length];
    const questions = Array.isArray(pool.questions) ? pool.questions : [];
    
    const start = performance.now();
    fisherYatesShuffle(questions).slice(0, QUESTIONS_PER_GAME);
    const elapsed = performance.now() - start;
    
    times.push(elapsed);
  }

  const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
  const maxTime = Math.max(...times);
  const minTime = Math.min(...times);

  return {
    passed: avgTime < targetMs,
    avg_selection_time_ms: Number(avgTime.toFixed(3)),
    max_selection_time_ms: Number(maxTime.toFixed(3)),
    min_selection_time_ms: Number(minTime.toFixed(3)),
    target_ms: targetMs,
    samples
  };
}

// Test 3: Stress Test - Simulate 25,000 concurrent game starts
async function testStress(supabase: any) {
  console.log('[TEST 3] Running stress test (simplified to 100 requests)...');
  const totalRequests = 100; // Reduced for practical testing
  const promises: Promise<any>[] = [];
  const times: number[] = [];

  for (let i = 0; i < totalRequests; i++) {
    const poolOrder = (i % TOTAL_POOLS) + 1;
    const start = performance.now();
    
    promises.push(
      supabase.functions.invoke('get-game-questions', {
        body: { last_pool_order: poolOrder - 1, lang: 'en' }
      }).then((result: any) => {
        const elapsed = performance.now() - start;
        times.push(elapsed);
        return result;
      })
    );
  }

  const results = await Promise.allSettled(promises);
  const successful = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;

  const avgTime = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
  const maxTime = times.length > 0 ? Math.max(...times) : 0;

  return {
    passed: failed === 0 && avgTime < 100, // All succeed, avg < 100ms
    concurrent_requests: totalRequests,
    successful,
    failed,
    avg_response_time_ms: Number(avgTime.toFixed(2)),
    max_response_time_ms: Number(maxTime.toFixed(2))
  };
}

// Test 4: Pool Rotation - Verify correct rotation logic
async function testRotation(supabase: any) {
  console.log('[TEST 4] Testing pool rotation...');
  const issues: string[] = [];
  const cycles = 3;

  for (let cycle = 0; cycle < cycles; cycle++) {
    for (let i = 0; i < TOTAL_POOLS; i++) {
      const currentPool = i + 1;
      const expectedNext = (currentPool % TOTAL_POOLS) + 1;
      
      const { data } = await supabase.functions.invoke('get-game-questions', {
        body: { last_pool_order: currentPool, lang: 'en' }
      });

      if (data?.used_pool_order !== expectedNext) {
        issues.push(`Cycle ${cycle + 1}, Pool ${currentPool}: expected next pool ${expectedNext}, got ${data?.used_pool_order}`);
      }
    }
  }

  return {
    passed: issues.length === 0,
    cycles,
    issues
  };
}

// Fisher-Yates shuffle implementation
function fisherYatesShuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
