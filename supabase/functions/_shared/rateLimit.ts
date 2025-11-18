// SECURITY: Rate limiting utilities for edge functions

export interface RateLimitConfig {
  maxRequests: number;
  windowMinutes: number;
}

// Default rate limits for different operation types
export const RATE_LIMITS = {
  AUTH: { maxRequests: 5, windowMinutes: 15 },          // Login/register attempts
  WALLET: { maxRequests: 30, windowMinutes: 1 },        // Wallet operations
  GAME: { maxRequests: 100, windowMinutes: 1 },         // Game operations
  SOCIAL: { maxRequests: 50, windowMinutes: 1 },        // Friend/message operations
  ADMIN: { maxRequests: 1000, windowMinutes: 1 },       // Admin operations
} as const;

/**
 * Check rate limit using RPC function
 * Returns true if request is allowed, false if rate limit exceeded
 */
export const checkRateLimit = async (
  supabase: any,
  rpcName: string,
  config: RateLimitConfig = RATE_LIMITS.WALLET
): Promise<{ allowed: boolean; remaining?: number }> => {
  try {
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_rpc_name: rpcName,
      p_max_calls: config.maxRequests,
      p_window_minutes: config.windowMinutes,
    });

    if (error) {
      // On error, allow request but log the issue
      console.error('[RateLimit] Check failed:', error);
      return { allowed: true };
    }

    return { allowed: data === true };
  } catch (e) {
    // On exception, allow request to not block users
    console.error('[RateLimit] Exception:', e);
    return { allowed: true };
  }
};

/**
 * Create rate limit error response
 */
export const rateLimitExceeded = (corsHeaders: Record<string, string>) => {
  return new Response(
    JSON.stringify({
      error: 'Rate limit exceeded',
      message: 'Too many requests. Please try again later.',
    }),
    {
      status: 429,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
};
