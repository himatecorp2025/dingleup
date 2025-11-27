/**
 * ADMIN SELF-HEALING DASHBOARD
 * Interface for running and monitoring the self-healing audit cycle
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { auditCycle, errorMonitor, type AuditCycleMetrics } from '@/lib/selfHealing';
import { Play, RefreshCw, CheckCircle, AlertCircle, TrendingDown } from 'lucide-react';

export default function AdminSelfHealing() {
  const [isRunning, setIsRunning] = useState(false);
  const [cycles, setCycles] = useState<AuditCycleMetrics[]>([]);
  const [currentMetrics, setCurrentMetrics] = useState(errorMonitor.getMetrics());

  const runAudit = async () => {
    setIsRunning(true);
    try {
      const results = await auditCycle.runFullAudit();
      setCycles(results);
      setCurrentMetrics(errorMonitor.getMetrics());
    } catch (err) {
      console.error('Audit failed:', err);
    } finally {
      setIsRunning(false);
    }
  };

  const refreshMetrics = () => {
    setCurrentMetrics(errorMonitor.getMetrics());
  };

  const lastCycle = cycles[cycles.length - 1];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Self-Healing System</h1>
            <p className="text-muted-foreground mt-1">
              Automated audit, testing, and error resolution
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={refreshMetrics}
              variant="outline"
              size="sm"
              disabled={isRunning}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRunning ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              onClick={runAudit}
              disabled={isRunning}
              size="lg"
            >
              <Play className="w-5 h-5 mr-2" />
              {isRunning ? 'Running Audit...' : 'Start Full Audit'}
            </Button>
          </div>
        </div>

        {/* Current Error Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Critical</p>
                <p className="text-3xl font-bold text-red-500">{currentMetrics.critical}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">High</p>
                <p className="text-3xl font-bold text-orange-500">{currentMetrics.high}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-orange-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Medium</p>
                <p className="text-3xl font-bold text-yellow-500">{currentMetrics.medium}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-yellow-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Low</p>
                <p className="text-3xl font-bold text-blue-500">{currentMetrics.low}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-blue-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Fixed</p>
                <p className="text-3xl font-bold text-green-500">{currentMetrics.fixed}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </Card>
        </div>

        {/* Audit Cycles */}
        {cycles.length > 0 && (
          <Card className="p-6">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <TrendingDown className="w-5 h-5" />
              Audit Cycle Results
            </h2>
            
            <div className="space-y-4">
              {cycles.map((cycle, idx) => (
                <div key={idx} className="border-b border-border pb-4 last:border-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-foreground">
                        Cycle {cycle.cycle}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        cycle.status === 'completed' ? 'bg-green-500/20 text-green-500' :
                        cycle.status === 'failed' ? 'bg-red-500/20 text-red-500' :
                        'bg-blue-500/20 text-blue-500'
                      }`}>
                        {cycle.status}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {(cycle.duration / 1000).toFixed(1)}s
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Errors:</span>
                      <span className="ml-2 font-medium text-foreground">
                        {cycle.errors.critical + cycle.errors.high} critical/high
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total:</span>
                      <span className="ml-2 font-medium text-foreground">
                        {cycle.errors.total}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Fixed:</span>
                      <span className="ml-2 font-medium text-green-500">
                        {cycle.fixes.automatic}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Avg API:</span>
                      <span className="ml-2 font-medium text-foreground">
                        {cycle.performance.avgApiResponseTime.toFixed(0)}ms
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            {lastCycle && (
              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <h3 className="font-bold text-foreground mb-2">Final Status</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Error Reduction:</span>
                    <span className="ml-2 font-medium text-foreground">
                      {cycles[0].errors.total} → {lastCycle.errors.total}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total Fixes:</span>
                    <span className="ml-2 font-medium text-green-500">
                      {cycles.reduce((sum, c) => sum + c.fixes.automatic, 0)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Error Patterns */}
        {currentMetrics.patterns > 0 && (
          <Card className="p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">
              Detected Patterns ({currentMetrics.patterns})
            </h2>
            <p className="text-sm text-muted-foreground">
              {currentMetrics.patterns} recurring error patterns detected and being monitored
            </p>
          </Card>
        )}

        {/* Instructions */}
        <Card className="p-6 bg-muted/30">
          <h3 className="font-bold text-foreground mb-2">How It Works</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• <strong>Static Analysis:</strong> Checks for dead code, unused imports, type issues</li>
            <li>• <strong>Dynamic Testing:</strong> Simulates user flows (login, game start, rewards)</li>
            <li>• <strong>Pattern Detection:</strong> Identifies recurring errors (3+ occurrences)</li>
            <li>• <strong>Auto-Fix:</strong> Automatically resolves safe, well-known issues</li>
            <li>• <strong>Iterative:</strong> Repeats until critical/high errors reach 0</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
