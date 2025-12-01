// Performance Monitoring - Centralized Metrics & Logging Helper
// Provides structured JSON logging, timing measurements, and DB query counting

export type MetricsContext = {
  functionName: string;
  requestId: string;          // correlation ID for tracing
  userId?: string | null;     // authenticated user ID
  startTime: number;          // Date.now() at function start
  dbQueryCount: number;       // manually incremented DB query counter
  extra: Record<string, unknown>; // stage timings and custom metrics
};

export type MetricsOptions = {
  functionName: string;
  userId?: string | null;
};

/**
 * Initialize metrics context at function start
 */
export function startMetrics(opts: MetricsOptions): MetricsContext {
  return {
    functionName: opts.functionName,
    requestId: crypto.randomUUID(),
    userId: opts.userId ?? null,
    startTime: Date.now(),
    dbQueryCount: 0,
    extra: {},
  };
}

/**
 * Measure execution time of a named stage
 * Adds `${stageName}_ms` to context.extra
 */
export async function measureStage<T>(
  ctx: MetricsContext,
  stageName: string,
  fn: () => Promise<T>,
): Promise<T> {
  const stageStart = Date.now();
  try {
    const result = await fn();
    const elapsed = Date.now() - stageStart;
    const currentValue = (ctx.extra[`${stageName}_ms`] as number | undefined) ?? 0;
    ctx.extra[`${stageName}_ms`] = currentValue + elapsed;
    return result;
  } catch (error) {
    const elapsed = Date.now() - stageStart;
    const currentValue = (ctx.extra[`${stageName}_ms`] as number | undefined) ?? 0;
    ctx.extra[`${stageName}_ms`] = currentValue + elapsed;
    throw error;
  }
}

/**
 * Increment DB query counter
 */
export function incDbQuery(ctx: MetricsContext, by: number = 1) {
  ctx.dbQueryCount += by;
}

type LogLevel = 'info' | 'error';

function logStructured(level: LogLevel, payload: Record<string, unknown>) {
  const base = {
    ts: new Date().toISOString(),
    level,
  };
  // Structured JSON for Supabase log explorer filtering
  const logLine = JSON.stringify({ ...base, ...payload });
  
  if (level === 'error') {
    console.error(logLine);
  } else {
    console.log(logLine);
  }
}

/**
 * Log successful operation with timing and metrics
 */
export function logSuccess(ctx: MetricsContext, extra: Record<string, unknown> = {}) {
  const totalElapsed = Date.now() - ctx.startTime;
  logStructured('info', {
    function: ctx.functionName,
    request_id: ctx.requestId,
    user_id: ctx.userId,
    status: 'success',
    elapsed_ms: totalElapsed,
    db_queries_count: ctx.dbQueryCount,
    ...ctx.extra,
    ...extra,
  });
}

/**
 * Log error with timing and context
 * IMPORTANT: Do not log PII (PIN, password, email, card data)
 */
export function logError(
  ctx: MetricsContext,
  error: unknown,
  extra: Record<string, unknown> = {},
) {
  const totalElapsed = Date.now() - ctx.startTime;
  const err = error as { message?: string; stack?: string; code?: string };

  logStructured('error', {
    function: ctx.functionName,
    request_id: ctx.requestId,
    user_id: ctx.userId,
    status: 'error',
    elapsed_ms: totalElapsed,
    db_queries_count: ctx.dbQueryCount,
    error_message: err?.message ?? String(error),
    error_code: err?.code,
    error_stack: err?.stack,
    ...ctx.extra,
    ...extra,
  });
}

/**
 * Sampling for high-frequency success logs (5% sample rate)
 * Use only for success logs, NEVER for error logs
 */
export function shouldSampleSuccessLog(): boolean {
  return Math.random() < 0.05; // 5% sampling rate
}
