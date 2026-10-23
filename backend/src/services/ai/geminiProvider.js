import { AIProvider } from './aiProvider.js';
import { LocalAIProvider } from './localProvider.js';
import { env } from '../../config/env.js';

export class GeminiAIProvider extends AIProvider {
  constructor() {
    super();
    this.fallback = new LocalAIProvider();
    this.apiKey = env.AI_API_KEY;
    this.model = env.AI_MODEL || 'gemini-1.5-flash';
  }

  async classifyQuestion(params) {
    if (!this.apiKey) {
      return this.fallback.classifyQuestion(params);
    }

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
      const prompt = `Analyze this college student academic doubt:
Subject: ${params.subjectName}
Topic: ${params.topic}
Question: ${params.text}

Respond in strictly valid JSON without markdown fences:
{
  "detectedTopic": "short topic name",
  "intent": "conceptual_explanation | debugging_troubleshooting | implementation_guidance | comparative_analysis",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "confidence": 0.95
}`;

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, responseMimeType: 'application/json' }
        })
      });

      if (!res.ok) {
        throw new Error(`Gemini API error: ${res.statusText}`);
      }

      const data = await res.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      return JSON.parse(rawText);
    } catch (err) {
      console.warn(`[GeminiProvider] Falling back to local provider: ${err.message}`);
      return this.fallback.classifyQuestion(params);
    }
  }

  async generateEmbedding(text) {
    if (!this.apiKey) {
      return this.fallback.generateEmbedding(text);
    }

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${env.EMBEDDING_MODEL}:embedContent?key=${this.apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: `models/${env.EMBEDDING_MODEL}`,
          content: { parts: [{ text }] }
        })
      });

      if (!res.ok) throw new Error(`Gemini Embedding API error: ${res.statusText}`);
      const data = await res.json();
      return data.embedding.values;
    } catch (err) {
      console.warn(`[GeminiProvider] Falling back to local embedding: ${err.message}`);
      return this.fallback.generateEmbedding(text);
    }
  }

  async generateDraftAnswer(params) {
    if (!this.apiKey) {
      return this.fallback.generateDraftAnswer(params);
    }

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
      const prompt = `You are an expert college teaching assistant. Provide a clear, step-by-step academic explanation for this doubt:
Subject: ${params.subjectName}
Topic: ${params.topic}
Question: ${params.question}

Guidelines:
- Explain the foundational concept step by step.
- Include a concise illustrative example.
- Acknowledge that the course professor will provide final official feedback.`;

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2 }
        })
      });

      if (!res.ok) throw new Error(`Gemini API error: ${res.statusText}`);
      const data = await res.json();
      const draft = data.candidates?.[0]?.content?.parts?.[0]?.text;
      return { draftAnswer: draft, confidence: 0.9 };
    } catch (err) {
      console.warn(`[GeminiProvider] Falling back to local draft answer: ${err.message}`);
      return this.fallback.generateDraftAnswer(params);
    }
  }
}
