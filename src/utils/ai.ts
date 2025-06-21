import { API } from '../types';

interface AIProvider {
  name: string;
  getRecommendations: (apiKey: string, subscriptions: API[], budget?: number) => Promise<string>;
}

// Helper function to determine if we should use the proxy
const getApiEndpoint = (provider: string): string => {
  // Use proxy in production or when API endpoint exists
  const isProduction = window.location.hostname !== 'localhost';
  const hasApiEndpoint = window.location.hostname.includes('vercel.app') || isProduction;
  
  if (hasApiEndpoint) {
    return '/api/ai-proxy';
  }
  
  // For local development, we'll still try direct (will fail with CORS)
  return provider === 'openai' 
    ? 'https://api.openai.com/v1/chat/completions'
    : 'https://api.anthropic.com/v1/messages';
};

// OpenAI Provider
const openAIProvider: AIProvider = {
  name: 'OpenAI',
  getRecommendations: async (apiKey: string, subscriptions: API[], budget?: number) => {
    const endpoint = getApiEndpoint('openai');
    const messages = [
      {
        role: 'system',
        content: `You are a subscription optimization assistant. Analyze the user's subscriptions and provide specific alternative services that could replace or improve upon their current subscriptions. Focus on:
1. Suggesting cheaper alternatives that provide similar functionality
2. Identifying services that could be replaced with free alternatives
3. Recommending bundled services that could replace multiple subscriptions
4. Finding better value options in the same category

For each recommendation, mention:
- The specific alternative service name
- How much they could save
- What features they might gain or lose

Be specific with service names and avoid generic advice.`
      },
      {
        role: 'user',
        content: `Here are my current subscriptions: ${JSON.stringify(subscriptions.map(s => ({
          name: s.serviceName,
          description: s.serviceDescription || 'No description provided',
          cost: s.cost,
          billingCycle: s.billingCycle,
          category: s.category,
          subscriptionType: s.subscriptionType
        })))}. ${budget ? `My monthly budget is $${budget}.` : ''} What specific alternative services do you recommend?`
      }
    ];

    const isProxy = endpoint.includes('/api/');
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(isProxy ? {} : { 'Authorization': `Bearer ${apiKey}` }),
      },
      body: JSON.stringify(
        isProxy 
          ? { provider: 'openai', apiKey, messages, model: 'gpt-3.5-turbo' }
          : { model: 'gpt-3.5-turbo', messages, temperature: 0.7, max_tokens: 500 }
      ),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to get AI recommendations' }));
      throw new Error(error.error?.message || error.error || 'Failed to get AI recommendations');
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }
};

// Anthropic Claude Provider
const anthropicProvider: AIProvider = {
  name: 'Anthropic Claude',
  getRecommendations: async (apiKey: string, subscriptions: API[], budget?: number) => {
    const endpoint = getApiEndpoint('anthropic');
    const messages = [
      {
        role: 'user',
        content: `As a subscription optimization assistant, analyze these subscriptions and suggest specific alternative services that could save money or provide better value. For each subscription, recommend concrete alternatives with service names and potential savings: ${JSON.stringify(subscriptions.map(s => ({
          name: s.serviceName,
          description: s.serviceDescription || 'No description provided',
          cost: s.cost,
          billingCycle: s.billingCycle,
          category: s.category,
          subscriptionType: s.subscriptionType
        })))}. ${budget ? `Monthly budget: $${budget}.` : ''}`
      }
    ];

    const isProxy = endpoint.includes('/api/');
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(isProxy ? {} : {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        }),
      },
      body: JSON.stringify(
        isProxy
          ? { provider: 'anthropic', apiKey, messages, model: 'claude-3-haiku-20240307' }
          : { model: 'claude-3-haiku-20240307', max_tokens: 500, messages }
      ),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to get AI recommendations' }));
      throw new Error(error.error?.message || error.error || 'Failed to get AI recommendations');
    }

    const data = await response.json();
    return data.content[0].text;
  }
};

// Export providers
export const aiProviders = {
  openai: openAIProvider,
  anthropic: anthropicProvider,
};

// Storage for AI settings
export const aiStorage = {
  getSettings: () => {
    const settings = localStorage.getItem('subalert_ai_settings');
    return settings ? JSON.parse(settings) : null;
  },
  
  saveSettings: (provider: string, apiKey: string) => {
    // Encrypt the API key for storage
    // TODO: Implement stronger encryption for API keys
    const encrypted = btoa(apiKey); // Basic encoding, you might want stronger encryption
    localStorage.setItem('subalert_ai_settings', JSON.stringify({
      provider,
      apiKey: encrypted,
    }));
  },
  
  clearSettings: () => {
    localStorage.removeItem('subalert_ai_settings');
  },
  
  getApiKey: () => {
    const settings = aiStorage.getSettings();
    return settings ? atob(settings.apiKey) : null;
  }
};