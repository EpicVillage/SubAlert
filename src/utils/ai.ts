import { API } from '../types';

interface AIProvider {
  name: string;
  getRecommendations: (apiKey: string, subscriptions: API[], budget?: number) => Promise<string>;
  getFeatureComparison: (apiKey: string, api: API) => Promise<any>;
}

// Helper function to validate and fix AI response
const validateComparisonResponse = (data: any): any => {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid response structure');
  }
  
  // Fix alternatives if present
  if (data.alternatives && Array.isArray(data.alternatives)) {
    data.alternatives = data.alternatives.map((alt: any) => {
      // Fix billingCycle if it's not valid
      if (alt.billingCycle !== 'monthly' && alt.billingCycle !== 'yearly') {
        alt.billingCycle = 'monthly'; // Default to monthly
      }
      
      // Ensure savings is a number
      if (typeof alt.savings === 'string') {
        alt.savings = parseFloat(alt.savings) || 0;
      }
      if (typeof alt.savings !== 'number') {
        alt.savings = 0;
      }
      
      // Ensure cost is a number
      if (typeof alt.cost === 'string') {
        alt.cost = parseFloat(alt.cost) || 0;
      }
      
      return alt;
    });
  }
  
  return data;
};

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
  },

  getFeatureComparison: async (apiKey: string, api: API) => {
    const endpoint = getApiEndpoint('openai');
    const messages = [
      {
        role: 'system',
        content: `You are a feature comparison expert. Analyze the given service and provide comparisons with exactly 2 alternatives. 

CRITICAL: Return ONLY the JSON object below, nothing else. No explanations, no markdown, no code blocks, just raw JSON.

The response must be exactly this structure:
{
  "currentService": {
    "name": "string",
    "features": ["string", "string", "string"],
    "cost": 0,
    "billingCycle": "monthly"
  },
  "alternatives": [
    {
      "name": "string",
      "cost": 0,
      "billingCycle": "monthly",
      "features": [
        {
          "name": "string",
          "current": true,
          "alternative": true,
          "importance": "high"
        }
      ],
      "pros": ["string", "string"],
      "cons": ["string", "string"],
      "savings": 0,
      "recommendation": "string"
    }
  ]
}

Rules:
- Return ONLY valid JSON, no explanations or text
- Use boolean true/false (not "true" or "false" strings)
- Use numbers like 50 not "50" for cost and savings
- billingCycle must be exactly "monthly" or "yearly" only
- importance must be exactly "high", "medium", or "low"
- If free, use cost: 0 and billingCycle: "monthly"
- savings should be a percentage number (0-100)
- Include 3-5 features per alternative
- Ensure JSON is properly formatted with correct commas and brackets`
      },
      {
        role: 'user',
        content: `Compare this service with alternatives:
Name: ${api.serviceName}
Description: ${api.serviceDescription || 'No description provided'}
Website: ${api.website || 'No website provided'}
Cost: $${api.cost || 0}/${api.billingCycle || 'monthly'}
Category: ${api.category}
Type: ${api.subscriptionType}

Remember: Return ONLY the JSON object, no other text.`
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
          ? { provider: 'openai', apiKey, messages, model: 'gpt-3.5-turbo', max_tokens: 2000 }
          : { model: 'gpt-3.5-turbo', messages, temperature: 0.3, max_tokens: 2000 }
      ),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to get comparison' }));
      throw new Error(error.error?.message || error.error || 'Failed to get comparison');
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Parse the JSON response
    try {
      // First, try to clean the content
      let cleanContent = content.trim();
      
      // Remove any markdown code blocks
      cleanContent = cleanContent.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      
      // Remove any leading/trailing whitespace
      cleanContent = cleanContent.trim();
      
      // Try to parse
      const parsed = JSON.parse(cleanContent);
      return validateComparisonResponse(parsed);
    } catch (e) {
      // If parsing fails, try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          let extractedJson = jsonMatch[0];
          
          // Check if JSON seems truncated (doesn't end with })
          if (!extractedJson.trim().endsWith('}')) {
            // Try to fix truncated JSON by closing open structures
            const openBraces = (extractedJson.match(/\{/g) || []).length;
            const closeBraces = (extractedJson.match(/\}/g) || []).length;
            const openBrackets = (extractedJson.match(/\[/g) || []).length;
            const closeBrackets = (extractedJson.match(/\]/g) || []).length;
            
            // Add missing brackets/braces
            extractedJson += ']'.repeat(Math.max(0, openBrackets - closeBrackets));
            extractedJson += '}'.repeat(Math.max(0, openBraces - closeBraces));
            
            console.warn('JSON appears truncated, attempted to fix');
          }
          
          const parsed = JSON.parse(extractedJson);
          return validateComparisonResponse(parsed);
        } catch (e2) {
          console.error('Failed to parse extracted JSON:', jsonMatch[0]);
          throw new Error(`JSON parsing failed: ${e2 instanceof Error ? e2.message : String(e2)}`);
        }
      }
      console.error('Failed to parse AI response:', content);
      console.error('Parse error:', e);
      // Try to provide more specific error
      if (content.includes('```')) {
        throw new Error('AI returned markdown-formatted code. Please try again.');
      }
      throw new Error(`Failed to parse AI response: ${e instanceof Error ? e.message : String(e)}`);
    }
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
  },

  getFeatureComparison: async (apiKey: string, api: API) => {
    const endpoint = getApiEndpoint('anthropic');
    const messages = [
      {
        role: 'user',
        content: `As a feature comparison expert, analyze this service and provide detailed comparisons with 2-3 alternatives. Return ONLY valid JSON without any markdown formatting or explanatory text.

The response must be exactly this structure with real values:
{
  "currentService": {
    "name": "string",
    "features": ["string array"],
    "cost": 0,
    "billingCycle": "monthly"
  },
  "alternatives": [
    {
      "name": "string",
      "cost": 0,
      "billingCycle": "monthly",
      "features": [
        {
          "name": "string",
          "current": true,
          "alternative": true,
          "importance": "high"
        }
      ],
      "pros": ["string array"],
      "cons": ["string array"],
      "savings": 0,
      "recommendation": "string"
    }
  ]
}

Service to analyze:
Name: ${api.serviceName}
Description: ${api.serviceDescription || 'No description provided'}
Website: ${api.website || 'No website provided'}
Cost: $${api.cost || 0}/${api.billingCycle || 'monthly'}
Category: ${api.category}
Type: ${api.subscriptionType}`
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
          ? { provider: 'anthropic', apiKey, messages, model: 'claude-3-haiku-20240307', max_tokens: 2000 }
          : { model: 'claude-3-haiku-20240307', max_tokens: 2000, messages }
      ),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to get comparison' }));
      throw new Error(error.error?.message || error.error || 'Failed to get comparison');
    }

    const data = await response.json();
    const content = data.content[0].text;
    
    // Parse the JSON response
    try {
      // First, try to clean the content
      let cleanContent = content.trim();
      
      // Remove any markdown code blocks
      cleanContent = cleanContent.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      
      // Remove any leading/trailing whitespace
      cleanContent = cleanContent.trim();
      
      // Try to parse
      const parsed = JSON.parse(cleanContent);
      return validateComparisonResponse(parsed);
    } catch (e) {
      // If parsing fails, try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          let extractedJson = jsonMatch[0];
          
          // Check if JSON seems truncated (doesn't end with })
          if (!extractedJson.trim().endsWith('}')) {
            // Try to fix truncated JSON by closing open structures
            const openBraces = (extractedJson.match(/\{/g) || []).length;
            const closeBraces = (extractedJson.match(/\}/g) || []).length;
            const openBrackets = (extractedJson.match(/\[/g) || []).length;
            const closeBrackets = (extractedJson.match(/\]/g) || []).length;
            
            // Add missing brackets/braces
            extractedJson += ']'.repeat(Math.max(0, openBrackets - closeBrackets));
            extractedJson += '}'.repeat(Math.max(0, openBraces - closeBraces));
            
            console.warn('JSON appears truncated, attempted to fix');
          }
          
          const parsed = JSON.parse(extractedJson);
          return validateComparisonResponse(parsed);
        } catch (e2) {
          console.error('Failed to parse extracted JSON:', jsonMatch[0]);
          throw new Error(`JSON parsing failed: ${e2 instanceof Error ? e2.message : String(e2)}`);
        }
      }
      console.error('Failed to parse AI response:', content);
      console.error('Parse error:', e);
      // Try to provide more specific error
      if (content.includes('```')) {
        throw new Error('AI returned markdown-formatted code. Please try again.');
      }
      throw new Error(`Failed to parse AI response: ${e instanceof Error ? e.message : String(e)}`);
    }
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