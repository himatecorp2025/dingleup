// Simplified permissive CORS for web app functions
// Always allow browser calls from the app preview and production

export const getCorsHeaders = (_origin?: string | null) => {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'true',
  };
};

export const handleCorsPreflight = (_origin?: string | null) => {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders('*')
  });
};
