import { Env } from './types';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'POST' && url.pathname === '/api/shorten') {
      return handleShortenRequest(request, env);
    } else if (request.method === 'GET' && url.pathname.length > 1) {
      return handleRedirect(request, env);
    }

    return new Response('Not Found', { status: 404 });
  },
};

async function handleShortenRequest(request: Request, env: Env): Promise<Response> {
  const { url } = await request.json();

  if (!url) {
    return new Response('Missing URL', { status: 400 });
  }

  const shortId = generateShortId();
  await env.URL_SHORTENER.put(shortId, url);

  const shortUrl = `${new URL(request.url).origin}/${shortId}`;

  return new Response(JSON.stringify({ shortUrl }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

async function handleRedirect(request: Request, env: Env): Promise<Response> {
  const shortId = new URL(request.url).pathname.slice(1);
  const longUrl = await env.URL_SHORTENER.get(shortId);

  if (!longUrl) {
    return new Response('Not Found', { status: 404 });
  }

  return Response.redirect(longUrl, 301);
}

function generateShortId(): string {
  return Math.random().toString(36).substring(2, 8);
}