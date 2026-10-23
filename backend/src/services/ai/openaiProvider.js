import { AIProvider } from './aiProvider.js';
import { LocalAIProvider } from './localProvider.js';
import { env } from '../../config/env.js';

export class OpenAIProvider extends AIProvider {
  constructor() {
    super();
    this.fallback = new LocalAIProvider();
    this.apiKey = env.AI_API_KEY;
    this.model = env.AI_MODEL || 'gpt-4o-mini';
  }

  async classifyQuestion(params) {
    if (!this.apiKey) return this.fallback.classifyQuestion(params);
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content: 'Classify the academic doubt. Respond in JSON: { detectedTopic, intent, keywords, confidence }'
            },
            {
              role: 'user',
              content: `Subject: ${params.subjectName}, Topic: ${params.topic}, Doubt: ${params.text}`
            }
          ]
        })
      });
      if (!res.ok) throw new Error(`OpenAI API error: ${res.statusText}`);
      const data = await res.json();
      return JSON.parse(data.choices[0].message.content);
    } catch (err) {
      console.warn(`[OpenAIProvider] Falling back to local: ${err.message}`);
      return this.fallback.classifyQuestion(params);
    }
  }

  async generateEmbedding(text) {
    if (!this.apiKey) return this.fallback.generateEmbedding(text);
    try {
      const res = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small',
          input: text
        })
      });
      if (!res.ok) throw new Error(`OpenAI Embedding error: ${res.statusText}`);
      const data = await res.json();
      return data.data[0].embedding;
    } catch (err) {
      return this.fallback.generateEmbedding(text);
    }
  }

  async generateDraftAnswer(params) {
    if (!this.apiKey) return this.fallback.generateDraftAnswer(params);
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are an academic TA assistant explaining student doubts.'
            },
            {
              role: 'user',
              content: `Subject: ${params.subjectName}, Topic: ${params.topic}, Question: ${params.question}`
            }
          ]
        })
      });
      if (!res.ok) throw new Error(`OpenAI Chat error: ${res.statusText}`);
      const data = await res.json();
      return {
        draftAnswer: data.choices[0].message.content,
        confidence: 0.92
      };
    } catch (err) {
      return this.fallback.generateDraftAnswer(params);
    }
  }
}
