import { AIProvider } from './aiProvider.js';

// Academic stop words
const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren',
  'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
  'can', 'could', 'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for', 'from',
  'further', 'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him', 'himself',
  'his', 'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself', 'just', 'me', 'more', 'most',
  'my', 'myself', 'no', 'nor', 'not', 'now', 'of', 'off', 'on', 'once', 'only', 'or', 'other',
  'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'she', 'should', 'so', 'some', 'such',
  'than', 'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these', 'they',
  'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'we', 'were',
  'what', 'when', 'where', 'which', 'while', 'who', 'whom', 'why', 'with', 'would', 'you', 'your'
]);

export class LocalAIProvider extends AIProvider {
  /**
   * Tokenize and normalize text
   */
  tokenize(text) {
    if (!text) return [];
    return text
      .toLowerCase()
      .replace(/[^a-z0-9_#+.\s-]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !STOP_WORDS.has(word));
  }

  /**
   * Fast hash to vector index (64-dimensional feature vector)
   */
  hashToken(token, dimensions = 64) {
    let hash = 0;
    for (let i = 0; i < token.length; i++) {
      hash = (hash << 5) - hash + token.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash) % dimensions;
  }

  async classifyQuestion({ text, topic, subjectName }) {
    const tokens = this.tokenize(text);
    const keywords = Array.from(new Set(tokens)).slice(0, 6);

    // Intent detection based on inquiry patterns
    const lower = (text || '').toLowerCase();
    let intent = 'conceptual_explanation';

    if (lower.includes('error') || lower.includes('bug') || lower.includes('exception') || lower.includes('fix') || lower.includes('crash')) {
      intent = 'debugging_troubleshooting';
    } else if (lower.includes('how to') || lower.includes('implement') || lower.includes('example') || lower.includes('code')) {
      intent = 'implementation_guidance';
    } else if (lower.includes('difference between') || lower.includes('compare') || lower.includes('versus') || lower.includes('vs')) {
      intent = 'comparative_analysis';
    } else if (lower.includes('formula') || lower.includes('calculate') || lower.includes('derive') || lower.includes('proof')) {
      intent = 'mathematical_derivation';
    }

    return {
      detectedTopic: topic || (keywords[0] ? keywords[0].toUpperCase() : 'General'),
      intent,
      keywords,
      confidence: 0.88
    };
  }

  async generateEmbedding(text) {
    const dimensions = 64;
    const vector = new Array(dimensions).fill(0);
    const tokens = this.tokenize(text);

    if (tokens.length === 0) {
      return vector;
    }

    // Term frequencies
    const freq = {};
    for (const token of tokens) {
      freq[token] = (freq[token] || 0) + 1;
    }

    for (const [token, count] of Object.entries(freq)) {
      const idx = this.hashToken(token, dimensions);
      // Logarithmic term weighting
      vector[idx] += 1 + Math.log(count);
    }

    // L2 normalize
    const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    if (norm > 0) {
      for (let i = 0; i < dimensions; i++) {
        vector[i] = Number((vector[i] / norm).toFixed(6));
      }
    }

    return vector;
  }

  async generateDraftAnswer({ question, topic, subjectName }) {
    const tokens = this.tokenize(question);
    const keyTerms = tokens.slice(0, 4).join(', ');

    const draft = `### AI Preliminary Explanation

**Subject:** ${subjectName || 'Academic Course'}
**Topic:** ${topic || 'Core Concept'}

**Key Concept Analysis:**
Your question centers around **${topic}**, focusing specifically on ${keyTerms || 'the core mechanism'}.

**Step-by-Step Overview:**
1. **Fundamental Principle:** In ${subjectName}, this concept operates under structured rules and properties.
2. **Key Consideration:** Ensure proper syntax, boundary conditions, or foundational assumptions are satisfied.
3. **Application:** Verify the expected vs. actual behavior through a minimal test case or verification steps.

*Note: This is an automated preliminary synthesis to help you get started. Your course faculty will review and provide detailed personalized guidance.*`;

    return {
      draftAnswer: draft,
      confidence: 0.82
    };
  }
}
