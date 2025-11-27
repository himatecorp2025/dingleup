/**
 * SELF-HEALING AUDIT CYCLE
 * Continuously runs audit → test → fix → re-test loop until error count reaches 0
 */

import { errorMonitor } from './errorMonitor';
import { staticAnalyzer } from './staticAnalyzer';
import { dynamicTester } from './dynamicTester';

export interface AuditCycleMetrics {
  cycle: number;
  timestamp: number;
  duration: number;
  errors: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    total: number;
  };
  fixes: {
    automatic: number;
    manual: number;
    failed: number;
  };
  performance: {
    avgApiResponseTime: number;
    failedRewards: number;
    failedGameStarts: number;
  };
  status: 'running' | 'completed' | 'failed';
}

class AuditCycle {
  private cycles: AuditCycleMetrics[] = [];
  private isRunning = false;
  private maxCycles = 10;
  private currentCycle = 0;

  async runFullAudit(): Promise<AuditCycleMetrics[]> {
    if (this.isRunning) {
      console.warn('[AuditCycle] Audit already running');
      return this.cycles;
    }

    this.isRunning = true;
    this.currentCycle = 0;
    this.cycles = [];

    console.log('🔍 [AuditCycle] Starting SELF-HEALING AUDIT CYCLE');

    while (this.currentCycle < this.maxCycles) {
      this.currentCycle++;
      const cycleStart = Date.now();

      console.log(`\n━━━ CYCLE ${this.currentCycle}/${this.maxCycles} ━━━`);

      // Clear previous errors for fresh cycle
      errorMonitor.clearErrors();

      // 1. STATIC ANALYSIS
      console.log('📊 Running static analysis...');
      const staticIssues = await staticAnalyzer.analyze();
      
      // 2. DYNAMIC TESTING
      console.log('🧪 Running dynamic tests...');
      const dynamicResults = await dynamicTester.runAllTests();

      // 3. COLLECT METRICS
      const errorMetrics = errorMonitor.getMetrics();
      const criticalErrors = errorMonitor.getCriticalErrors();
      const highPriorityErrors = errorMonitor.getHighPriorityErrors();

      const cycleMetrics: AuditCycleMetrics = {
        cycle: this.currentCycle,
        timestamp: Date.now(),
        duration: Date.now() - cycleStart,
        errors: {
          critical: errorMetrics.critical,
          high: errorMetrics.high,
          medium: errorMetrics.medium,
          low: errorMetrics.low,
          total: errorMetrics.total,
        },
        fixes: {
          automatic: errorMetrics.fixed,
          manual: staticIssues.manualReviewNeeded,
          failed: staticIssues.failedFixes,
        },
        performance: dynamicResults.performance,
        status: 'running',
      };

      this.cycles.push(cycleMetrics);

      // Log cycle results
      console.log('\n📈 Cycle Results:');
      console.log(`   Errors: ${errorMetrics.critical} critical, ${errorMetrics.high} high`);
      console.log(`   Fixes: ${errorMetrics.fixed} automatic`);
      console.log(`   Performance: ${dynamicResults.performance.avgApiResponseTime}ms avg`);

      // 4. CHECK TERMINATION CONDITIONS
      if (criticalErrors.length === 0 && highPriorityErrors.length === 0) {
        console.log('\n✅ SUCCESS: All critical and high-priority errors resolved!');
        cycleMetrics.status = 'completed';
        break;
      }

      // If no progress in last 2 cycles, stop
      if (this.currentCycle >= 3) {
        const lastCycles = this.cycles.slice(-3);
        const errorCounts = lastCycles.map(c => c.errors.critical + c.errors.high);
        const noProgress = errorCounts.every((count, i, arr) => i === 0 || count === arr[i - 1]);
        
        if (noProgress) {
          console.log('\n⚠️  WARNING: No progress in last 3 cycles, stopping.');
          cycleMetrics.status = 'failed';
          break;
        }
      }

      // Wait before next cycle
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    this.isRunning = false;

    // Final report
    this.generateFinalReport();

    return this.cycles;
  }

  private generateFinalReport() {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 FINAL SELF-HEALING AUDIT REPORT');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (this.cycles.length === 0) {
      console.log('No cycles completed.');
      return;
    }

    const firstCycle = this.cycles[0];
    const lastCycle = this.cycles[this.cycles.length - 1];

    console.log(`Total Cycles: ${this.cycles.length}`);
    console.log(`Total Duration: ${(lastCycle.timestamp - firstCycle.timestamp) / 1000}s`);
    console.log('\nError Reduction:');
    console.log(`  Critical: ${firstCycle.errors.critical} → ${lastCycle.errors.critical}`);
    console.log(`  High:     ${firstCycle.errors.high} → ${lastCycle.errors.high}`);
    console.log(`  Medium:   ${firstCycle.errors.medium} → ${lastCycle.errors.medium}`);
    console.log(`  Low:      ${firstCycle.errors.low} → ${lastCycle.errors.low}`);
    console.log(`  Total:    ${firstCycle.errors.total} → ${lastCycle.errors.total}`);

    const totalFixes = this.cycles.reduce((sum, c) => sum + c.fixes.automatic, 0);
    console.log(`\nTotal Automatic Fixes: ${totalFixes}`);

    const avgPerformance = this.cycles.reduce((sum, c) => sum + c.performance.avgApiResponseTime, 0) / this.cycles.length;
    console.log(`\nAverage API Response Time: ${avgPerformance.toFixed(0)}ms`);

    if (lastCycle.status === 'completed') {
      console.log('\n✅ STATUS: COMPLETE - All critical/high errors resolved');
    } else {
      console.log('\n⚠️  STATUS: INCOMPLETE - Manual review needed for remaining issues');
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }

  getMetrics(): AuditCycleMetrics[] {
    return [...this.cycles];
  }

  isAuditRunning(): boolean {
    return this.isRunning;
  }
}

export const auditCycle = new AuditCycle();
