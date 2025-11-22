import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, PlayCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/i18n';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type LoadTestMode = 'test' | 'full';
type LoadTestScenario = 'A' | 'B' | 'C';

interface LoadTestConfig {
  baseUrl: string;
  vus: number;
  requestsPerUser: number;
  delayMs: number;
  scenario: LoadTestScenario;
  mode: LoadTestMode;
}

interface ProgressPayload {
  progressPercent: number;
  totalRequests: number;
  success: number;
  failed: number;
  lastError: { url: string; status?: number; error?: string } | null;
  vus: number;
  scenario: string;
  mode: string;
}

interface DonePayload {
  totalTimeSec: number;
  totalRequests: number;
  success: number;
  failed: number;
  p50: number;
  p95: number;
  p99: number;
  sampleErrors: Array<{ url: string; status?: number; error?: string; bodySample?: string }>;
}

export default function AdminLoadTest() {
  const { t } = useI18n();
  
  const [config, setConfig] = useState<LoadTestConfig>({
    baseUrl: import.meta.env.VITE_SUPABASE_URL || '',
    vus: 500,
    requestsPerUser: 10,
    delayMs: 300,
    scenario: 'A',
    mode: 'test',
  });

  const [isRunning, setIsRunning] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [progress, setProgress] = useState<ProgressPayload | null>(null);
  const [results, setResults] = useState<DonePayload | null>(null);

  useEffect(() => {
    const channel = supabase.channel('admin-load-test-progress');

    channel
      .on('broadcast', { event: 'progress' }, ({ payload }) => {
        setProgress(payload as ProgressPayload);
      })
      .on('broadcast', { event: 'done' }, ({ payload }) => {
        setResults(payload as DonePayload);
        setIsRunning(false);
        setProgress(null);
        toast.success(t('admin.loadTest.progressDone'));
      })
      .on('broadcast', { event: 'error' }, ({ payload }) => {
        toast.error(payload.message || 'Load test error');
        setIsRunning(false);
        setProgress(null);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [t]);

  const handleStartTest = async () => {
    if (config.mode === 'full' && config.vus > 2000) {
      setShowConfirm(true);
      return;
    }
    await executeTest();
  };

  const executeTest = async () => {
    setIsRunning(true);
    setProgress(null);
    setResults(null);
    setShowConfirm(false);

    try {
      const { data, error } = await supabase.functions.invoke('admin-load-test', {
        body: config,
      });

      if (error) throw error;
      
      if (!data?.success) {
        throw new Error(data?.message || 'Load test failed');
      }
    } catch (error: any) {
      console.error('Load test error:', error);
      toast.error(error.message || 'Failed to start load test');
      setIsRunning(false);
      setProgress(null);
    }
  };

  const effectiveVus = config.mode === 'test' ? Math.min(config.vus, 50) : config.vus;
  const effectiveRequests = config.mode === 'test' ? Math.min(config.requestsPerUser, 5) : config.requestsPerUser;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{t('admin.loadTest.title')}</h1>
          <p className="text-muted-foreground mt-2">{t('admin.loadTest.description')}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configuration Panel */}
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.loadTest.configTitle')}</CardTitle>
              <CardDescription>{t('admin.loadTest.configDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="baseUrl">{t('admin.loadTest.baseUrlLabel')}</Label>
                <Input
                  id="baseUrl"
                  value={config.baseUrl}
                  onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })}
                  disabled={isRunning}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vus">{t('admin.loadTest.vusLabel')}</Label>
                <Input
                  id="vus"
                  type="number"
                  min="10"
                  max="5000"
                  value={config.vus}
                  onChange={(e) => setConfig({ ...config, vus: parseInt(e.target.value) || 10 })}
                  disabled={isRunning}
                />
                {config.mode === 'test' && (
                  <p className="text-sm text-muted-foreground">
                    {t('admin.loadTest.testModeLimit')}: {effectiveVus}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="requests">{t('admin.loadTest.requestsPerUserLabel')}</Label>
                <Input
                  id="requests"
                  type="number"
                  min="1"
                  max="50"
                  value={config.requestsPerUser}
                  onChange={(e) => setConfig({ ...config, requestsPerUser: parseInt(e.target.value) || 1 })}
                  disabled={isRunning}
                />
                {config.mode === 'test' && (
                  <p className="text-sm text-muted-foreground">
                    {t('admin.loadTest.testModeLimit')}: {effectiveRequests}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="delay">{t('admin.loadTest.delayMsLabel')}</Label>
                <Input
                  id="delay"
                  type="number"
                  min="0"
                  max="5000"
                  value={config.delayMs}
                  onChange={(e) => setConfig({ ...config, delayMs: parseInt(e.target.value) || 0 })}
                  disabled={isRunning}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="scenario">{t('admin.loadTest.scenarioLabel')}</Label>
                <Select
                  value={config.scenario}
                  onValueChange={(value: LoadTestScenario) => setConfig({ ...config, scenario: value })}
                  disabled={isRunning}
                >
                  <SelectTrigger id="scenario">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">{t('admin.loadTest.scenarioA')}</SelectItem>
                    <SelectItem value="B">{t('admin.loadTest.scenarioB')}</SelectItem>
                    <SelectItem value="C">{t('admin.loadTest.scenarioC')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t('admin.loadTest.modeLabel')}</Label>
                <RadioGroup
                  value={config.mode}
                  onValueChange={(value: LoadTestMode) => setConfig({ ...config, mode: value })}
                  disabled={isRunning}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="test" id="test" />
                    <Label htmlFor="test">{t('admin.loadTest.modeTest')}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="full" id="full" />
                    <Label htmlFor="full">{t('admin.loadTest.modeFull')}</Label>
                  </div>
                </RadioGroup>
              </div>

              <Button
                onClick={handleStartTest}
                disabled={isRunning}
                className="w-full"
                size="lg"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('admin.loadTest.progressRunning')}
                  </>
                ) : (
                  <>
                    <PlayCircle className="mr-2 h-4 w-4" />
                    {t('admin.loadTest.startButton')}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Progress & Results Panel */}
          <div className="space-y-6">
            {progress && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('admin.loadTest.progressTitle')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{t('admin.loadTest.progressRunning')}</span>
                      <span>{Math.round(progress.progressPercent)}%</span>
                    </div>
                    <Progress value={progress.progressPercent} />
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-green-600">{progress.success}</div>
                      <div className="text-xs text-muted-foreground">{t('admin.loadTest.statsSuccess')}</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-red-600">{progress.failed}</div>
                      <div className="text-xs text-muted-foreground">{t('admin.loadTest.statsFailed')}</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{progress.totalRequests}</div>
                      <div className="text-xs text-muted-foreground">{t('admin.loadTest.statsTotalRequests')}</div>
                    </div>
                  </div>

                  {progress.lastError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Last Error</AlertTitle>
                      <AlertDescription className="text-xs">
                        {progress.lastError.url} - {progress.lastError.status || 'Network Error'}
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}

            {results && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('admin.loadTest.resultsTitle')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">{t('admin.loadTest.totalTime')}</div>
                      <div className="text-2xl font-bold">{results.totalTimeSec.toFixed(2)}s</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">{t('admin.loadTest.statsTotalRequests')}</div>
                      <div className="text-2xl font-bold">{results.totalRequests}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">{t('admin.loadTest.statsSuccess')}</div>
                      <div className="text-2xl font-bold text-green-600">{results.success}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">{t('admin.loadTest.statsFailed')}</div>
                      <div className="text-2xl font-bold text-red-600">{results.failed}</div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-2">{t('admin.loadTest.latencyStats')}</h4>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-xl font-bold">{results.p50.toFixed(0)}ms</div>
                        <div className="text-xs text-muted-foreground">{t('admin.loadTest.statsP50')}</div>
                      </div>
                      <div>
                        <div className="text-xl font-bold">{results.p95.toFixed(0)}ms</div>
                        <div className="text-xs text-muted-foreground">{t('admin.loadTest.statsP95')}</div>
                      </div>
                      <div>
                        <div className="text-xl font-bold">{results.p99.toFixed(0)}ms</div>
                        <div className="text-xs text-muted-foreground">{t('admin.loadTest.statsP99')}</div>
                      </div>
                    </div>
                  </div>

                  {results.sampleErrors.length > 0 && (
                    <div className="border-t pt-4">
                      <h4 className="font-semibold mb-2">{t('admin.loadTest.sampleErrorsTitle')}</h4>
                      <div className="space-y-2">
                        {results.sampleErrors.map((err, idx) => (
                          <Alert key={idx} variant="destructive">
                            <AlertDescription className="text-xs">
                              <div><strong>URL:</strong> {err.url}</div>
                              {err.status && <div><strong>Status:</strong> {err.status}</div>}
                              {err.error && <div><strong>Error:</strong> {err.error}</div>}
                              {err.bodySample && <div><strong>Body:</strong> {err.bodySample}</div>}
                            </AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admin.loadTest.confirmHighLoadTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('admin.loadTest.confirmHighLoadDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('admin.loadTest.confirmHighLoadCancelButton')}</AlertDialogCancel>
            <AlertDialogAction onClick={executeTest}>
              {t('admin.loadTest.confirmHighLoadConfirmButton')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
