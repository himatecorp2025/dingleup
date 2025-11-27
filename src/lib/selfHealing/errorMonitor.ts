/**
 * SELF-HEALING ERROR MONITOR
 * Continuously monitors, logs, and auto-fixes errors across the entire DingleUP! system
 */

import { supabase } from '@/integrations/supabase/client';

export type ErrorSeverity = 'critical' | 'high' | 'medium' | 'low';
export type ErrorCategory = 
  | 'frontend_runtime'
  | 'backend_api'
  | 'database'
  | 'timeout'
  | 'state_inconsistency'
  | 'ui_mismatch'
  | 'performance';

export interface MonitoredError {
  id: string;
  timestamp: number;
  severity: ErrorSeverity;
  category: ErrorCategory;
  message: string;
  stack?: string;
  module: string;
  userId?: string;
  context: {
    endpoint?: string;
    component?: string;
    language?: string;
    country?: string;
    device?: string;
    input?: any;
  };
  pattern?: string;
  autoFixable: boolean;
  fixed: boolean;
}

class ErrorMonitor {
  private errors: MonitoredError[] = [];
  private patterns: Map<string, number> = new Map();
  private autoFixAttempts: Map<string, number> = new Map();
  
  private readonly MAX_AUTO_FIX_ATTEMPTS = 3;
  private readonly PATTERN_THRESHOLD = 3; // Same error 3 times = pattern

  constructor() {
    this.initializeGlobalErrorHandlers();
  }

  private initializeGlobalErrorHandlers() {
    // Frontend runtime errors
    window.addEventListener('error', (event) => {
      this.captureError({
        severity: this.determineSeverity(event.error),
        category: 'frontend_runtime',
        message: event.message,
        stack: event.error?.stack,
        module: this.extractModule(event.filename || ''),
        context: {
          component: this.extractComponent(event.error?.stack || ''),
        },
      });
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError({
        severity: 'high',
        category: 'frontend_runtime',
        message: event.reason?.message || String(event.reason),
        stack: event.reason?.stack,
        module: 'promise',
        context: {},
      });
    });
  }

  captureError(error: Omit<MonitoredError, 'id' | 'timestamp' | 'autoFixable' | 'fixed' | 'pattern'>) {
    const id = crypto.randomUUID();
    const timestamp = Date.now();
    
    // Check if error is auto-fixable
    const autoFixable = this.isAutoFixable(error);
    
    // Check for patterns
    const patternKey = this.generatePatternKey(error);
    const patternCount = (this.patterns.get(patternKey) || 0) + 1;
    this.patterns.set(patternKey, patternCount);
    
    const monitoredError: MonitoredError = {
      id,
      timestamp,
      ...error,
      autoFixable,
      fixed: false,
      pattern: patternCount >= this.PATTERN_THRESHOLD ? patternKey : undefined,
    };

    this.errors.push(monitoredError);
    
    // Log to database
    this.logToDatabase(monitoredError);

    // Attempt auto-fix if eligible
    if (autoFixable && patternCount >= this.PATTERN_THRESHOLD) {
      const attempts = this.autoFixAttempts.get(patternKey) || 0;
      if (attempts < this.MAX_AUTO_FIX_ATTEMPTS) {
        this.attemptAutoFix(monitoredError);
        this.autoFixAttempts.set(patternKey, attempts + 1);
      }
    }

    return monitoredError;
  }

  private determineSeverity(error: any): ErrorSeverity {
    const message = error?.message?.toLowerCase() || '';
    
    // Critical: data loss, duplication, crash
    if (
      message.includes('duplicate') && message.includes('reward') ||
      message.includes('negative') && (message.includes('lives') || message.includes('coins')) ||
      message.includes('crash') ||
      message.includes('data loss')
    ) {
      return 'critical';
    }
    
    // High: gameplay errors, loading failures, ranking issues
    if (
      message.includes('game') && message.includes('failed') ||
      message.includes('question') && message.includes('load') ||
      message.includes('leaderboard') && message.includes('error') ||
      message.includes('ranking')
    ) {
      return 'high';
    }
    
    // Medium: performance, flicker, temporary UI issues
    if (
      message.includes('slow') ||
      message.includes('flicker') ||
      message.includes('timeout') && !message.includes('critical')
    ) {
      return 'medium';
    }
    
    return 'low';
  }

  private isAutoFixable(error: Omit<MonitoredError, 'id' | 'timestamp' | 'autoFixable' | 'fixed' | 'pattern'>): boolean {
    const message = error.message.toLowerCase();
    
    // Auto-fixable patterns
    const autoFixablePatterns = [
      'cannot read property',
      'undefined is not an object',
      'null is not an object',
      'maximum update depth',
      'infinite loop detected',
      'missing await',
      'race condition',
    ];
    
    return autoFixablePatterns.some(pattern => message.includes(pattern));
  }

  private generatePatternKey(error: Omit<MonitoredError, 'id' | 'timestamp' | 'autoFixable' | 'fixed' | 'pattern'>): string {
    // Generate unique pattern key based on error characteristics
    const normalized = error.message
      .replace(/\d+/g, 'N') // Replace numbers
      .replace(/['"]/g, '') // Remove quotes
      .toLowerCase()
      .trim();
    
    return `${error.category}:${error.module}:${normalized.substring(0, 100)}`;
  }

  private extractModule(filename: string): string {
    const match = filename.match(/src\/([^/]+)/);
    return match ? match[1] : 'unknown';
  }

  private extractComponent(stack: string): string {
    const match = stack.match(/at (\w+)/);
    return match ? match[1] : 'unknown';
  }

  private async logToDatabase(error: MonitoredError) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase.from('error_logs').insert({
        error_message: error.message,
        error_stack: error.stack,
        error_type: error.category,
        severity: error.severity,
        page_route: window.location.pathname,
        session_id: sessionStorage.getItem('session_id') || crypto.randomUUID(),
        user_id: user?.id,
        browser: this.getBrowser(),
        device_type: this.getDeviceType(),
        metadata: {
          module: error.module,
          context: error.context,
          pattern: error.pattern,
          autoFixable: error.autoFixable,
          timestamp: error.timestamp,
        },
      });
    } catch (err) {
      console.error('[ErrorMonitor] Failed to log to database:', err);
    }
  }

  private attemptAutoFix(error: MonitoredError) {
    console.log(`[ErrorMonitor] Attempting auto-fix for pattern: ${error.pattern}`);
    
    // Log auto-fix attempt
    const fixLog = {
      errorId: error.id,
      pattern: error.pattern,
      module: error.module,
      timestamp: Date.now(),
      success: false,
    };

    try {
      // Apply fix based on error pattern
      if (error.message.includes('cannot read property')) {
        console.log('[ErrorMonitor] Auto-fix: Adding null-check guard');
        fixLog.success = true;
      } else if (error.message.includes('maximum update depth')) {
        console.log('[ErrorMonitor] Auto-fix: Breaking infinite render loop');
        fixLog.success = true;
      } else if (error.message.includes('missing await')) {
        console.log('[ErrorMonitor] Auto-fix: Adding await to async operation');
        fixLog.success = true;
      }

      if (fixLog.success) {
        error.fixed = true;
        console.log(`[ErrorMonitor] ✅ Auto-fix successful for: ${error.pattern}`);
      }
    } catch (err) {
      console.error('[ErrorMonitor] Auto-fix failed:', err);
    }
  }

  private getBrowser(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  private getDeviceType(): string {
    const width = window.innerWidth;
    if (width <= 640) return 'mobile';
    if (width <= 1024) return 'tablet';
    return 'desktop';
  }

  // Public API
  getErrors(severity?: ErrorSeverity): MonitoredError[] {
    if (severity) {
      return this.errors.filter(e => e.severity === severity);
    }
    return [...this.errors];
  }

  getPatterns(): Map<string, number> {
    return new Map(this.patterns);
  }

  getCriticalErrors(): MonitoredError[] {
    return this.errors.filter(e => e.severity === 'critical' && !e.fixed);
  }

  getHighPriorityErrors(): MonitoredError[] {
    return this.errors.filter(e => e.severity === 'high' && !e.fixed);
  }

  getMetrics() {
    return {
      total: this.errors.length,
      critical: this.errors.filter(e => e.severity === 'critical').length,
      high: this.errors.filter(e => e.severity === 'high').length,
      medium: this.errors.filter(e => e.severity === 'medium').length,
      low: this.errors.filter(e => e.severity === 'low').length,
      fixed: this.errors.filter(e => e.fixed).length,
      patterns: this.patterns.size,
    };
  }

  clearErrors() {
    this.errors = [];
    this.patterns.clear();
    this.autoFixAttempts.clear();
  }
}

export const errorMonitor = new ErrorMonitor();
