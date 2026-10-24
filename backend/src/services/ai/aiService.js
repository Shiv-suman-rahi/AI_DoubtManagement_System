import { env } from '../../config/env.js';
import { AI_PROVIDERS, DOUBT_STATUS, DOUBT_GROUP_STATUS } from '../../config/constants.js';
import { GeminiAIProvider } from './geminiProvider.js';
import { OpenAIProvider } from './openaiProvider.js';
import { LocalAIProvider } from './localProvider.js';
import { Doubt } from '../../models/Doubt.js';
import { DoubtGroup } from '../../models/DoubtGroup.js';
import { DoubtGroupItem } from '../../models/DoubtGroupItem.js';
import { ClassSubject } from '../../models/ClassSubject.js';
import { FacultyAssignment } from '../../models/FacultyAssignment.js';
import { Subject } from '../../models/Subject.js';

class AIService {
  constructor() {
    this.provider = this.initProvider();
  }

  initProvider() {
    switch (env.AI_PROVIDER) {
      case AI_PROVIDERS.GEMINI:
        return new GeminiAIProvider();
      case AI_PROVIDERS.OPENAI:
        return new OpenAIProvider();
      case AI_PROVIDERS.LOCAL:
      default:
        return new LocalAIProvider();
    }
  }

  cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) return 0;
    const len = Math.min(vecA.length, vecB.length);
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < len; i++) {
      dot += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Main AI Processing Pipeline for a newly submitted doubt
   */
  async processDoubt(doubtId) {
    const doubt = await Doubt.findById(doubtId)
      .populate('classSubject')
      .populate('subject');

    if (!doubt) {
      console.warn(`[AIService] Doubt not found: ${doubtId}`);
      return null;
    }

    try {
      const fullText = `${doubt.topic} ${doubt.subtopic || ''} ${doubt.title} ${doubt.questionText}`;
      const subjectName = doubt.subject?.name || 'General';

      // 1. Classification
      const classification = await this.provider.classifyQuestion({
        text: fullText,
        topic: doubt.topic,
        subjectName
      });

      // 2. Generate Embedding
      const embedding = await this.provider.generateEmbedding(fullText);
      doubt.embedding = embedding;
      doubt.aiClassification = {
        detectedTopic: classification.detectedTopic,
        intent: classification.intent,
        confidence: classification.confidence,
        suggestedGroupKeywords: classification.keywords,
        processedAt: new Date()
      };

      // 3. Find assigned faculty for this classSubject
      let assignedFacultyId = doubt.assignedFaculty;
      if (!assignedFacultyId) {
        const assignment = await FacultyAssignment.findOne({
          classSubject: doubt.classSubject._id,
          status: 'active'
        });
        if (assignment) {
          assignedFacultyId = assignment.faculty;
          doubt.assignedFaculty = assignedFacultyId;
        }
      }

      // 4. Semantic Search against existing active groups for this ClassSubject & Subject
      const activeGroups = await DoubtGroup.find({
        classSubject: doubt.classSubject._id,
        subject: doubt.subject._id,
        status: { $in: [DOUBT_GROUP_STATUS.ACTIVE, DOUBT_GROUP_STATUS.SUGGESTED] }
      });

      let bestMatchGroup = null;
      let highestSimilarity = 0;

      for (const group of activeGroups) {
        // Find the representative doubt for the group
        const groupItems = await DoubtGroupItem.find({ group: group._id }).populate({
          path: 'doubt',
          select: '+embedding'
        });

        for (const item of groupItems) {
          if (item.doubt && item.doubt.embedding && item.doubt.embedding.length > 0) {
            const sim = this.cosineSimilarity(embedding, item.doubt.embedding);
            if (sim > highestSimilarity) {
              highestSimilarity = sim;
              bestMatchGroup = group;
            }
          }
        }
      }

      const autoThreshold = env.AUTO_GROUP_THRESHOLD || 0.85;
      const reviewThreshold = env.SIMILARITY_THRESHOLD || 0.78;

      let targetGroup = null;

      if (bestMatchGroup && highestSimilarity >= autoThreshold) {
        // High similarity match: Automatically attach to existing group
        targetGroup = bestMatchGroup;
        await DoubtGroupItem.create({
          group: targetGroup._id,
          doubt: doubt._id,
          matchConfidence: Number(highestSimilarity.toFixed(4)),
          reviewStatus: 'auto_matched'
        });

        doubt.group = targetGroup._id;
        doubt.resolutionStatus = DOUBT_STATUS.ASSIGNED;
        console.log(`[AIService] Auto-grouped doubt ${doubt._id} into group ${targetGroup._id} (Score: ${highestSimilarity.toFixed(4)})`);
      } else if (bestMatchGroup && highestSimilarity >= reviewThreshold) {
        // Moderate similarity match: Suggest match for faculty review
        targetGroup = bestMatchGroup;
        await DoubtGroupItem.create({
          group: targetGroup._id,
          doubt: doubt._id,
          matchConfidence: Number(highestSimilarity.toFixed(4)),
          reviewStatus: 'faculty_review_required'
        });

        doubt.group = targetGroup._id;
        doubt.resolutionStatus = DOUBT_STATUS.UNDER_REVIEW;
        console.log(`[AIService] Suggested grouping for doubt ${doubt._id} into group ${targetGroup._id} (Score: ${highestSimilarity.toFixed(4)})`);
      } else {
        // Below threshold: Create a new DoubtGroup with this doubt as the representative question
        const newGroup = await DoubtGroup.create({
          classSubject: doubt.classSubject._id,
          subject: doubt.subject._id,
          topic: doubt.topic,
          representativeTitle: doubt.title,
          representativeQuestion: doubt.questionText,
          status: DOUBT_GROUP_STATUS.ACTIVE,
          similarityMetadata: {
            modelVersion: env.AI_PROVIDER,
            averageConfidence: 1.0,
            matchingKeywords: classification.keywords || [],
            reasoning: 'Primary representative question for topic cohort'
          },
          assignedFaculty: assignedFacultyId
        });

        await DoubtGroupItem.create({
          group: newGroup._id,
          doubt: doubt._id,
          matchConfidence: 1.0,
          reviewStatus: 'faculty_confirmed'
        });

        doubt.group = newGroup._id;
        doubt.resolutionStatus = DOUBT_STATUS.ASSIGNED;
        targetGroup = newGroup;
        console.log(`[AIService] Created new DoubtGroup ${newGroup._id} for doubt ${doubt._id}`);
      }

      // 5. Generate AI Preliminary Draft Answer
      const draftRes = await this.provider.generateDraftAnswer({
        question: doubt.questionText,
        topic: doubt.topic,
        subjectName
      });

      doubt.aiDraftAnswer = {
        content: draftRes.draftAnswer,
        model: env.AI_PROVIDER,
        confidence: draftRes.confidence,
        generatedAt: new Date()
      };

      doubt.processingStatus = 'ai_processed';
      await doubt.save();

      return {
        doubt,
        group: targetGroup,
        highestSimilarity
      };
    } catch (error) {
      console.error(`[AIService] Error processing doubt ${doubtId}:`, error);
      // Safe fallback: never lose the doubt
      doubt.processingStatus = 'failed';
      doubt.resolutionStatus = DOUBT_STATUS.ASSIGNED;
      await doubt.save();
      return { doubt, error: error.message };
    }
  }
}

export const aiService = new AIService();
