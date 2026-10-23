/**
 * Abstract AI Provider Interface
 */
export class AIProvider {
  /**
   * Classify a doubt's intent, keywords, and detected topic
   * @param {Object} params
   * @param {string} params.text
   * @param {string} params.topic
   * @param {string} params.subjectName
   * @returns {Promise<{ detectedTopic: string, intent: string, keywords: string[], confidence: number }>}
   */
  async classifyQuestion(params) {
    throw new Error('classifyQuestion must be implemented by subclass');
  }

  /**
   * Generate vector embedding for text
   * @param {string} text
   * @returns {Promise<number[]>}
   */
  async generateEmbedding(text) {
    throw new Error('generateEmbedding must be implemented by subclass');
  }

  /**
   * Generate an initial AI draft answer to help faculty or student
   * @param {Object} params
   * @param {string} params.question
   * @param {string} params.topic
   * @param {string} params.subjectName
   * @returns {Promise<{ draftAnswer: string, confidence: number }>}
   */
  async generateDraftAnswer(params) {
    throw new Error('generateDraftAnswer must be implemented by subclass');
  }
}
