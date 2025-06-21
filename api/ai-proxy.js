export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { provider, apiKey, messages, model } = await request.json();

    let apiUrl;
    let headers;
    let body;

    if (provider === 'openai') {
      apiUrl = 'https://api.openai.com/v1/chat/completions';
      headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      };
      body = JSON.stringify({
        model: model || 'gpt-3.5-turbo',
        messages,
        temperature: 0.7,
        max_tokens: 500,
      });
    } else if (provider === 'anthropic') {
      apiUrl = 'https://api.anthropic.com/v1/messages';
      headers = {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      };
      body = JSON.stringify({
        model: model || 'claude-3-haiku-20240307',
        messages,
        max_tokens: 500,
      });
    } else {
      return new Response('Invalid provider', { status: 400 });
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body,
    });

    const data = await response.json();

    if (!response.ok) {
      return new Response(JSON.stringify({ error: data.error || 'API request failed' }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}