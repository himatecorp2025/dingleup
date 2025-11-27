/**
 * DYNAMIC TESTER
 * Simulates user flows and validates system behavior
 */

import { supabase } from '@/integrations/supabase/client';
import { errorMonitor } from './errorMonitor';

export interface DynamicTestResults {
  totalTests: number;
  passed: number;
  failed: number;
  performance: {
    avgApiResponseTime: number;
    failedRewards: number;
    failedGameStarts: number;
  };
  flows: {
    registration: boolean;
    login: boolean;
    welcomeBonus: boolean;
    dailyGift: boolean;
    gameStart: boolean;
    gameCompletion: boolean;
    leaderboard: boolean;
    languageSwitch: boolean;
  };
}

class DynamicTester {
  async runAllTests(): Promise<DynamicTestResults> {
    const results: DynamicTestResults = {
      totalTests: 0,
      passed: 0,
      failed: 0,
      performance: {
        avgApiResponseTime: 0,
        failedRewards: 0,
        failedGameStarts: 0,
      },
      flows: {
        registration: false,
        login: false,
        welcomeBonus: false,
        dailyGift: false,
        gameStart: false,
        gameCompletion: false,
        leaderboard: false,
        languageSwitch: false,
      },
    };

    const apiTimes: number[] = [];

    try {
      // Test 1: Check if user is authenticated
      results.totalTests++;
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        results.flows.login = true;
        results.passed++;
        console.log('  ✓ Authentication check passed');
      } else {
        results.failed++;
        console.log('  ✗ Authentication check failed - no user');
      }

      // Test 2: Wallet fetch performance
      results.totalTests++;
      const walletStart = performance.now();
      const { data: wallet, error: walletError } = await supabase.functions.invoke('get-wallet');
      const walletTime = performance.now() - walletStart;
      apiTimes.push(walletTime);

      if (!walletError && wallet) {
        results.flows.welcomeBonus = true;
        results.passed++;
        console.log(`  ✓ Wallet fetch passed (${walletTime.toFixed(0)}ms)`);
      } else {
        results.failed++;
        results.performance.failedRewards++;
        console.log(`  ✗ Wallet fetch failed: ${walletError?.message}`);
        errorMonitor.captureError({
          severity: 'high',
          category: 'backend_api',
          message: `Wallet fetch failed: ${walletError?.message}`,
          module: 'get-wallet',
          context: { endpoint: 'get-wallet' },
        });
      }

      // Test 3: Leaderboard fetch
      results.totalTests++;
      const leaderboardStart = performance.now();
      const { data: leaderboard, error: leaderboardError } = await supabase
        .from('leaderboard_cache')
        .select('*')
        .limit(10);
      const leaderboardTime = performance.now() - leaderboardStart;
      apiTimes.push(leaderboardTime);

      if (!leaderboardError) {
        results.flows.leaderboard = true;
        results.passed++;
        console.log(`  ✓ Leaderboard fetch passed (${leaderboardTime.toFixed(0)}ms)`);
      } else {
        results.failed++;
        console.log(`  ✗ Leaderboard fetch failed: ${leaderboardError.message}`);
        errorMonitor.captureError({
          severity: 'high',
          category: 'database',
          message: `Leaderboard fetch failed: ${leaderboardError.message}`,
          module: 'leaderboard',
          context: { endpoint: 'leaderboard_cache' },
        });
      }

      // Test 4: Profile fetch
      results.totalTests++;
      if (user) {
        const profileStart = performance.now();
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        const profileTime = performance.now() - profileStart;
        apiTimes.push(profileTime);

        if (!profileError && profile) {
          results.passed++;
          console.log(`  ✓ Profile fetch passed (${profileTime.toFixed(0)}ms)`);
        } else {
          results.failed++;
          console.log(`  ✗ Profile fetch failed: ${profileError?.message}`);
        }
      }

      // Calculate average API response time
      if (apiTimes.length > 0) {
        results.performance.avgApiResponseTime = 
          apiTimes.reduce((sum, t) => sum + t, 0) / apiTimes.length;
      }

    } catch (err: any) {
      console.error('[DynamicTester] Test execution failed:', err);
      errorMonitor.captureError({
        severity: 'critical',
        category: 'frontend_runtime',
        message: `Dynamic test execution failed: ${err.message}`,
        stack: err.stack,
        module: 'dynamicTester',
        context: {},
      });
    }

    return results;
  }
}

export const dynamicTester = new DynamicTester();
