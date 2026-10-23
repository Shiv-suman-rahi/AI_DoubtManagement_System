import { FacultyAssignment } from '../models/FacultyAssignment.js';
import { ClassSubject } from '../models/ClassSubject.js';
import { Doubt } from '../models/Doubt.js';
import { DoubtGroup } from '../models/DoubtGroup.js';
import { DoubtGroupItem } from '../models/DoubtGroupItem.js';
import { Answer } from '../models/Answer.js';
import { KnowledgeBaseArticle } from '../models/KnowledgeBaseArticle.js';
import { sendNotification } from '../services/socketService.js';
import { logAudit } from '../services/auditService.js';
import { DOUBT_STATUS, DOUBT_GROUP_STATUS, NOTIFICATION_TYPE, AUDIT_ACTIONS, PRIVACY_MODE } from '../config/constants.js';

export async function getFacultyAssignments(req, res, next) {
  try {
    const facultyId = req.user._id;

    const assignments = await FacultyAssignment.find({
      faculty: facultyId,
      status: 'active'
    }).populate({
      path: 'classSubject',
      populate: [
        { path: 'subject', select: 'name code credits syllabus' },
        { path: 'classroom', populate: { path: 'program', select: 'name code' } }
      ]
    });

    res.json({ success: true, assignments });
  } catch (error) {
    next(error);
  }
}

export async function getFacultyDashboard(req, res, next) {
  try {
    const facultyId = req.user._id;

    // Get assigned classSubjects
    const assignments = await FacultyAssignment.find({ faculty: facultyId, status: 'active' });
    const classSubjectIds = assignments.map(a => a.classSubject);

    const [
      pendingDoubtsCount,
      resolvedDoubtsCount,
      suggestedGroupsCount,
      awaitingReviewCount,
      recentDoubts,
      activeGroups
    ] = await Promise.all([
      Doubt.countDocuments({
        classSubject: { $in: classSubjectIds },
        resolutionStatus: { $in: [DOUBT_STATUS.PENDING, DOUBT_STATUS.ASSIGNED] }
      }),
      Doubt.countDocuments({
        classSubject: { $in: classSubjectIds },
        resolutionStatus: { $in: [DOUBT_STATUS.ANSWERED, DOUBT_STATUS.RESOLVED] }
      }),
      DoubtGroup.countDocuments({
        classSubject: { $in: classSubjectIds },
        status: DOUBT_GROUP_STATUS.SUGGESTED
      }),
      Doubt.countDocuments({
        classSubject: { $in: classSubjectIds },
        resolutionStatus: DOUBT_STATUS.UNDER_REVIEW
      }),
      Doubt.find({ classSubject: { $in: classSubjectIds } })
        .sort({ createdAt: -1 })
        .limit(8)
        .populate('subject', 'name code')
        .populate('student', 'name email avatar')
        .populate('group', 'representativeTitle status'),
      DoubtGroup.find({
        classSubject: { $in: classSubjectIds },
        status: { $in: [DOUBT_GROUP_STATUS.ACTIVE, DOUBT_GROUP_STATUS.SUGGESTED] }
      })
        .sort({ updatedAt: -1 })
        .limit(5)
        .populate('subject', 'name code')
    ]);

    // Mask anonymous students in recent doubts
    const safeRecentDoubts = recentDoubts.map(d => {
      const obj = d.toObject();
      if (obj.privacyMode === PRIVACY_MODE.ANONYMOUS) {
        obj.student = { _id: 'anonymous', name: 'Anonymous Student', email: 'anonymous@hidden.edu', isAnonymous: true };
      }
      return obj;
    });

    res.json({
      success: true,
      stats: {
        pendingDoubtsCount,
        resolvedDoubtsCount,
        suggestedGroupsCount,
        awaitingReviewCount,
        activeAssignmentsCount: assignments.length,
        averageResponseTimeHours: 4.2
      },
      recentDoubts: safeRecentDoubts,
      activeGroups
    });
  } catch (error) {
    next(error);
  }
}

export async function getFacultyDoubts(req, res, next) {
  try {
    const facultyId = req.user._id;
    const { subjectId, classSubjectId, status, topic, priority, page = 1, limit = 15 } = req.query;

    // Faculty can only view doubts for assigned classSubjects
    const assignments = await FacultyAssignment.find({ faculty: facultyId, status: 'active' });
    const classSubjectIds = assignments.map(a => a.classSubject);

    const query = { classSubject: { $in: classSubjectIds } };
    if (classSubjectId) query.classSubject = classSubjectId;
    if (subjectId) query.subject = subjectId;
    if (status) query.resolutionStatus = status;
    if (topic) query.topic = topic;
    if (priority) query.priority = priority;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    const [doubts, total] = await Promise.all([
      Doubt.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(take)
        .populate('subject', 'name code')
        .populate('student', 'name email avatar')
        .populate('group', 'representativeTitle status')
        .populate({
          path: 'classSubject',
          populate: { path: 'classroom', populate: { path: 'program', select: 'name code' } }
        }),
      Doubt.countDocuments(query)
    ]);

    // Mask anonymous student identities
    const safeDoubts = doubts.map(d => {
      const obj = d.toObject();
      delete obj.embedding;
      if (obj.privacyMode === PRIVACY_MODE.ANONYMOUS) {
        obj.student = { _id: 'anonymous', name: 'Anonymous Student', email: 'anonymous@hidden.edu', isAnonymous: true };
      }
      return obj;
    });

    res.json({
      success: true,
      doubts: safeDoubts,
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

export async function getFacultyDoubtGroups(req, res, next) {
  try {
    const facultyId = req.user._id;
    const { subjectId, status } = req.query;

    const assignments = await FacultyAssignment.find({ faculty: facultyId, status: 'active' });
    const classSubjectIds = assignments.map(a => a.classSubject);

    const query = { classSubject: { $in: classSubjectIds } };
    if (subjectId) query.subject = subjectId;
    if (status) query.status = status;

    const groups = await DoubtGroup.find(query)
      .sort({ updatedAt: -1 })
      .populate('subject', 'name code')
      .populate('sharedAnswer')
      .populate({
        path: 'classSubject',
        populate: { path: 'classroom', populate: { path: 'program', select: 'name code' } }
      });

    // Attach item count to each group
    const enrichedGroups = await Promise.all(
      groups.map(async grp => {
        const count = await DoubtGroupItem.countDocuments({ group: grp._id });
        return {
          ...grp.toObject(),
          doubtCount: count
        };
      })
    );

    res.json({ success: true, groups: enrichedGroups });
  } catch (error) {
    next(error);
  }
}

export async function getFacultyDoubtGroupById(req, res, next) {
  try {
    const { id } = req.params;
    const group = await DoubtGroup.findById(id)
      .populate('subject', 'name code')
      .populate('sharedAnswer')
      .populate({
        path: 'classSubject',
        populate: { path: 'classroom', populate: { path: 'program', select: 'name code' } }
      });

    if (!group) {
      return res.status(404).json({ success: false, message: 'Doubt group not found' });
    }

    // Get all linked items with doubts
    const items = await DoubtGroupItem.find({ group: group._id }).populate({
      path: 'doubt',
      populate: { path: 'student', select: 'name email avatar' }
    });

    // Mask anonymous students in group items
    const safeItems = items.map(item => {
      const itObj = item.toObject();
      if (itObj.doubt) {
        delete itObj.doubt.embedding;
        if (itObj.doubt.privacyMode === PRIVACY_MODE.ANONYMOUS) {
          itObj.doubt.student = {
            _id: 'anonymous',
            name: 'Anonymous Student',
            email: 'anonymous@hidden.edu',
            isAnonymous: true
          };
        }
      }
      return itObj;
    });

    res.json({
      success: true,
      group,
      items: safeItems
    });
  } catch (error) {
    next(error);
  }
}

export async function answerDoubtGroup(req, res, next) {
  try {
    const facultyId = req.user._id;
    const { id } = req.params;
    const { content, attachments, publishToKnowledgeBase } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Answer content cannot be empty' });
    }

    const group = await DoubtGroup.findById(id).populate('classSubject').populate('subject');
    if (!group) {
      return res.status(404).json({ success: false, message: 'Doubt group not found' });
    }

    // 1. Create shared answer
    const answer = await Answer.create({
      author: facultyId,
      group: group._id,
      content: content.trim(),
      attachments: attachments || [],
      visibilityScope: 'group_students',
      approvalStatus: 'published',
      facultyApproved: true
    });

    // 2. Link answer to group & mark group resolved
    group.sharedAnswer = answer._id;
    group.status = DOUBT_GROUP_STATUS.RESOLVED;
    group.resolvedAt = new Date();
    await group.save();

    // 3. Find all linked doubts and mark them answered
    const items = await DoubtGroupItem.find({ group: group._id }).populate('doubt');
    for (const item of items) {
      if (item.doubt) {
        item.doubt.resolutionStatus = DOUBT_STATUS.ANSWERED;
        item.doubt.resolvedAt = new Date();
        await item.doubt.save();

        // 4. Notify each student individually without cross-leaking identities
        await sendNotification({
          recipientId: item.doubt.student,
          eventType: NOTIFICATION_TYPE.GROUP_ANSWER_PUBLISHED,
          title: `Answer Published: ${group.topic}`,
          message: `Your faculty has published an official explanation for your doubt: "${item.doubt.title}"`,
          relatedResource: {
            modelName: 'Doubt',
            resourceId: item.doubt._id
          }
        });
      }
    }

    // 5. Optional publish to knowledge base
    if (publishToKnowledgeBase) {
      await KnowledgeBaseArticle.create({
        title: group.representativeTitle,
        subject: group.subject._id,
        topic: group.topic,
        questionSummary: group.representativeQuestion,
        approvedExplanation: content.trim(),
        tags: [group.topic, 'Faculty Approved'],
        approvedBy: facultyId,
        sourceAnswer: answer._id
      });
    }

    await logAudit({
      actorId: facultyId,
      action: AUDIT_ACTIONS.ANSWER_PUBLISHED,
      modelName: 'DoubtGroup',
      resourceId: group._id,
      details: { answeredDoubtsCount: items.length, publishToKnowledgeBase },
      req
    });

    res.json({
      success: true,
      message: `Answer successfully published to all ${items.length} students in this group!`,
      answer,
      group
    });
  } catch (error) {
    next(error);
  }
}

export async function answerSingleDoubt(req, res, next) {
  try {
    const facultyId = req.user._id;
    const { id } = req.params;
    const { content, attachments } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Answer content is required' });
    }

    const doubt = await Doubt.findById(id);
    if (!doubt) {
      return res.status(404).json({ success: false, message: 'Doubt not found' });
    }

    const answer = await Answer.create({
      author: facultyId,
      doubt: doubt._id,
      content: content.trim(),
      attachments: attachments || [],
      visibilityScope: 'individual',
      approvalStatus: 'published',
      facultyApproved: true
    });

    doubt.resolutionStatus = DOUBT_STATUS.ANSWERED;
    doubt.resolvedAt = new Date();
    await doubt.save();

    await sendNotification({
      recipientId: doubt.student,
      eventType: NOTIFICATION_TYPE.DOUBT_ANSWERED,
      title: `Answer Received: ${doubt.title}`,
      message: `${req.user.name} answered your doubt in ${doubt.topic}.`,
      relatedResource: {
        modelName: 'Doubt',
        resourceId: doubt._id
      }
    });

    res.json({
      success: true,
      message: 'Answer delivered to student successfully.',
      answer
    });
  } catch (error) {
    next(error);
  }
}

export async function splitDoubtGroup(req, res, next) {
  try {
    const { id } = req.params; // groupId
    const { doubtId } = req.body;

    const group = await DoubtGroup.findById(id);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });

    const doubt = await Doubt.findById(doubtId);
    if (!doubt) return res.status(404).json({ success: false, message: 'Doubt not found' });

    // Remove from existing group
    await DoubtGroupItem.deleteOne({ group: group._id, doubt: doubt._id });

    // Create a new separate group for this doubt
    const newGroup = await DoubtGroup.create({
      classSubject: doubt.classSubject,
      subject: doubt.subject,
      topic: doubt.topic,
      representativeTitle: doubt.title,
      representativeQuestion: doubt.questionText,
      status: DOUBT_GROUP_STATUS.ACTIVE,
      similarityMetadata: {
        modelVersion: 'faculty-split',
        averageConfidence: 1.0,
        reasoning: 'Faculty split this doubt into an independent concept group'
      },
      assignedFaculty: req.user._id
    });

    await DoubtGroupItem.create({
      group: newGroup._id,
      doubt: doubt._id,
      matchConfidence: 1.0,
      reviewStatus: 'faculty_confirmed'
    });

    doubt.group = newGroup._id;
    await doubt.save();

    await logAudit({
      actorId: req.user._id,
      action: AUDIT_ACTIONS.GROUP_SPLIT,
      modelName: 'DoubtGroup',
      resourceId: group._id,
      details: { splitDoubtId: doubtId, newGroupId: newGroup._id },
      req
    });

    res.json({
      success: true,
      message: 'Doubt successfully split into a new group',
      newGroup
    });
  } catch (error) {
    next(error);
  }
}

export async function mergeDoubtGroups(req, res, next) {
  try {
    const { sourceGroupId, targetGroupId } = req.body;

    if (!sourceGroupId || !targetGroupId || sourceGroupId === targetGroupId) {
      return res.status(400).json({ success: false, message: 'Distinct source and target groups required' });
    }

    const [sourceGroup, targetGroup] = await Promise.all([
      DoubtGroup.findById(sourceGroupId),
      DoubtGroup.findById(targetGroupId)
    ]);

    if (!sourceGroup || !targetGroup) {
      return res.status(404).json({ success: false, message: 'One or both groups not found' });
    }

    // Move all items from source to target
    const items = await DoubtGroupItem.find({ group: sourceGroup._id });
    for (const item of items) {
      // Check if target already has it
      const exists = await DoubtGroupItem.findOne({ group: targetGroup._id, doubt: item.doubt });
      if (!exists) {
        await DoubtGroupItem.create({
          group: targetGroup._id,
          doubt: item.doubt,
          matchConfidence: item.matchConfidence,
          reviewStatus: 'faculty_confirmed'
        });
      }
      await Doubt.findByIdAndUpdate(item.doubt, { group: targetGroup._id });
      await DoubtGroupItem.deleteOne({ _id: item._id });
    }

    sourceGroup.status = DOUBT_GROUP_STATUS.MERGED;
    await sourceGroup.save();

    await logAudit({
      actorId: req.user._id,
      action: AUDIT_ACTIONS.GROUP_MERGED,
      modelName: 'DoubtGroup',
      resourceId: targetGroup._id,
      details: { sourceGroupId, targetGroupId, itemsMovedCount: items.length },
      req
    });

    res.json({
      success: true,
      message: `Successfully merged ${items.length} doubts into target group.`,
      targetGroup
    });
  } catch (error) {
    next(error);
  }
}

export async function updateDoubtStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!Object.values(DOUBT_STATUS).includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid doubt status' });
    }

    const doubt = await Doubt.findById(id);
    if (!doubt) return res.status(404).json({ success: false, message: 'Doubt not found' });

    doubt.resolutionStatus = status;
    if (status === DOUBT_STATUS.RESOLVED || status === DOUBT_STATUS.ANSWERED) {
      doubt.resolvedAt = new Date();
    }
    await doubt.save();

    await sendNotification({
      recipientId: doubt.student,
      eventType: NOTIFICATION_TYPE.STATUS_CHANGED,
      title: `Status Updated: ${doubt.title}`,
      message: `Your doubt status changed to: ${status.toUpperCase()}`,
      relatedResource: {
        modelName: 'Doubt',
        resourceId: doubt._id
      }
    });

    res.json({ success: true, message: `Status updated to ${status}`, doubt });
  } catch (error) {
    next(error);
  }
}
