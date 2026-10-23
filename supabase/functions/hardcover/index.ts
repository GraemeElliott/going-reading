// Forwards read-only GraphQL queries to the Hardcover API so the token stays
// on the server (Hardcover doesn't allow tokens in browser code).
//
// Setup:
//   npx supabase secrets set HARDCOVER_TOKEN=<token with only the read:catalog scope>
//   npx supabase functions deploy hardcover

const HARDCOVER_URL = 'https://api.hardcover.app/v1/graphql';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  // Hardcover shows tokens with a "Bearer " prefix; accept it either way
  const token = Deno.env.get('HARDCOVER_TOKEN')?.replace(/^Bearer\s+/i, '');
  if (!token) {
    return json({ error: 'HARDCOVER_TOKEN is not set' }, 500);
  }

  let body: { query?: unknown; variables?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  // Reads only. The token's read:catalog scope blocks writes as well.
  if (typeof body.query !== 'string' || !/^\s*query\b/.test(body.query)) {
    return json({ error: 'Only GraphQL queries are allowed' }, 400);
  }

  const response = await fetch(HARDCOVER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'User-Agent': 'going-reading (personal reading tracker)',
    },
    body: JSON.stringify({ query: body.query, variables: body.variables ?? {} }),
  });

  return new Response(await response.text(), {
    status: response.status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
