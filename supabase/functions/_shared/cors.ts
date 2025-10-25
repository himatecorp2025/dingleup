// SECURITY: Shared CORS configuration for all edge functions
// Uses environment-based origin restrictions instead of wildcard

export const getCorsHeaders = (origin?: string | null) => {
  // In production, verify origin against allowed domains
  const allowedOrigins = [
    Deno.env.get("ALLOWED_ORIGIN_1"),
    Deno.env.get("ALLOWED_ORIGIN_2"),
    'http://localhost:8080',
    'http://localhost:5173',
    'http://localhost:3000',
  ].filter(Boolean);

  // Check if origin is in allowed list
  const isAllowed = origin && allowedOrigins.some(allowed => origin.includes(allowed as string));
  
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : '*', // Fallback to * for backwards compatibility
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
    'Access-Control-Max-Age': '86400', // 24 hours
  };
};

export const handleCorsPreflight = () => {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders()
  });
};