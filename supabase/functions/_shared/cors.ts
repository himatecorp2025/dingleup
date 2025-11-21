// SECURITY: CORS configuration with strict origin validation
// Allows requests only from known trusted origins

const ALLOWED_ORIGINS = [
  'https://wdpxmwsxhckazwxufttk.supabase.co', // Supabase project
  'https://lovable.app',
  'https://*.lovable.app',
  'http://localhost:5173', // Local development
  'http://localhost:3000',  // Alternative dev port
];

export const getCorsHeaders = (origin?: string | null) => {
  // SECURITY: Strict origin validation in production
  const isDevelopment = Deno.env.get('ENVIRONMENT') === 'development';
  
  let allowedOrigin = '*';
  if (!isDevelopment && origin) {
    // Check if origin matches allowed list
    const isAllowed = ALLOWED_ORIGINS.some(allowed => {
      if (allowed.includes('*')) {
        const pattern = allowed.replace('*', '.*');
        return new RegExp(pattern).test(origin);
      }
      return allowed === origin;
    });
    
    allowedOrigin = isAllowed ? origin : 'null';
  }
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': allowedOrigin !== '*' ? 'true' : 'false',
  };
};

export const handleCorsPreflight = (origin?: string | null) => {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(origin)
  });
};
