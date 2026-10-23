import { KnowledgeBaseArticle } from '../models/KnowledgeBaseArticle.js';

export async function searchKnowledgeBase(req, res, next) {
  try {
    const { q, subjectId, topic, page = 1, limit = 12 } = req.query;
    const query = {};

    if (subjectId) query.subject = subjectId;
    if (topic) query.topic = topic;

    if (q) {
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { questionSummary: { $regex: q, $options: 'i' } },
        { approvedExplanation: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } }
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    const [articles, total] = await Promise.all([
      KnowledgeBaseArticle.find(query)
        .sort({ helpfulCount: -1, createdAt: -1 })
        .skip(skip)
        .limit(take)
        .populate('subject', 'name code')
        .populate('approvedBy', 'name role'),
      KnowledgeBaseArticle.countDocuments(query)
    ]);

    res.json({
      success: true,
      articles,
      pagination: {
        total,
        page: parseInt(page, 10),
        pages: Math.ceil(total / take)
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getKnowledgeBaseArticle(req, res, next) {
  try {
    const { id } = req.params;
    const article = await KnowledgeBaseArticle.findByIdAndUpdate(
      id,
      { $inc: { viewCount: 1 } },
      { new: true }
    )
      .populate('subject', 'name code')
      .populate('approvedBy', 'name role avatar');

    if (!article) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }

    res.json({ success: true, article });
  } catch (error) {
    next(error);
  }
}

export async function markArticleHelpful(req, res, next) {
  try {
    const { id } = req.params;
    const article = await KnowledgeBaseArticle.findByIdAndUpdate(
      id,
      { $inc: { helpfulCount: 1 } },
      { new: true }
    );
    res.json({ success: true, helpfulCount: article.helpfulCount });
  } catch (error) {
    next(error);
  }
}
