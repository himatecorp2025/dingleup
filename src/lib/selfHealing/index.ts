/**
 * SELF-HEALING SYSTEM MAIN EXPORT
 * Orchestrates the entire self-healing audit and fix cycle
 */

export { errorMonitor } from './errorMonitor';
export { auditCycle } from './auditCycle';
export { staticAnalyzer } from './staticAnalyzer';
export { dynamicTester } from './dynamicTester';

export type { MonitoredError, ErrorSeverity, ErrorCategory } from './errorMonitor';
export type { AuditCycleMetrics } from './auditCycle';
export type { StaticAnalysisResult } from './staticAnalyzer';
export type { DynamicTestResults } from './dynamicTester';

// Initialize error monitoring immediately
import { errorMonitor } from './errorMonitor';
console.log('🛡️ [SelfHealing] Error monitoring initialized');
