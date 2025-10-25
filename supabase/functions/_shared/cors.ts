// SECURITY: Shared CORS configuration for all edge functions
// Uses environment-based origin restrictions with strict validation

export const getCorsHeaders = (origin?: string | null) => {
  // SECURITY: Strict origin whitelist - only allow specific domains
  const allowedOrigins = [
    Deno.env.get("ALLOWED_ORIGIN_1"),
    Deno.env.get("ALLOWED_ORIGIN_2"),
    'http://localhost:8080',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:8080',
    'http://127.0.0.1:5173',
  ].filter(Boolean) as string[];

  // SECURITY: Exact match or subdomain validation
  const isAllowed = origin && allowedOrigins.some(allowed => {
    // Exact match
    if (origin === allowed) return true;
    
    // Allow subdomains of allowed origin
    const allowedDomain = allowed.replace(/^https?:\/\//, '');
    return origin.endsWith('.' + allowedDomain);
  });
  
  return {
    // SECURITY FIX: Never use wildcard (*) - only allow verified origins
    'Access-Control-Allow-Origin': isAllowed ? origin : (Deno.env.get("ALLOWED_ORIGIN_1") || 'https://lovable.app'),
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
    'Access-Control-Max-Age': '86400', // 24 hours
    'Access-Control-Allow-Credentials': 'true',
  };
};

export const handleCorsPreflight = (origin?: string | null) => {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(origin)
  });
};
