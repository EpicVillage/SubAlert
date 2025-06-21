// Example Vercel Edge Function for AI recommendations
// Place this in /api/recommendations.js

export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { userSubscriptions, budget } = await request.json();

    // Call AI API (example with OpenAI)
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a subscription optimization assistant. Analyze user subscriptions and recommend cost-saving alternatives or better value options.'
          },
          {
            role: 'user',
            content: `Current subscriptions: ${JSON.stringify(userSubscriptions)}. Monthly budget: $${budget}. Suggest optimizations.`
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    const data = await response.json();
    
    return new Response(JSON.stringify({
      recommendations: data.choices[0].message.content
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to get recommendations' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}