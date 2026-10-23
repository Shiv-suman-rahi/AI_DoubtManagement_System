import { Doubt } from '../models/Doubt.js';
import { Enrollment } from '../models/Enrollment.js';
import { ClassSubject } from '../models/ClassSubject.js';
import { FacultyAssignment } from '../models/FacultyAssignment.js';
import { Answer } from '../models/Answer.js';
import { aiService } from '../services/ai/aiService.js';
import { sendNotification } from '../services/socketService.js';
import { logAudit } from '../services/auditService.js';
import { ROLES, PRIVACY_MODE, DOUBT_STATUS, NOTIFICATION_TYPE, AUDIT_ACTIONS } from '../config/constants.js';

export async function submitDoubt(req, res, next) {
  try {
    const studentId = req.user._id;
    const {
      classSubjectId,
      subjectId,
      topic,
      subtopic,
      title,
      questionText,
      privacyMode,
      priority,
      codeSnippet
    } = req.body;

    // 1. Verify ClassSubject exists
    const classSubject = await ClassSubject.findById(classSubjectId);
    if (!classSubject) {
      return res.status(404).json({ success: false, message: 'Class-Subject offering not found' });
    }

    // 2. Validate Student is actively enrolled in this classroom
    const isEnrolled = await Enrollment.findOne({
      student: studentId,
      classroom: classSubject.classroom,
      status: 'active'
    });

    if (!isEnrolled) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not enrolled in the classroom for this subject'
      });
    }

    // 3. Process attachments if uploaded via multer
    const attachments = (req.files || []).map(file => ({
      url: `/uploads/${file.filename}`,
      fileType: file.detectedType || 'document',
      originalName: file.originalname,
      sizeBytes: file.size
    }));

    // 4. Find assigned faculty for this ClassSubject
    const assignment = await FacultyAssignment.findOne({
      classSubject: classSubject._id,
      status: 'active'
    });

    const isAnonymous = privacyMode === PRIVACY_MODE.ANONYMOUS;

    // 5. Create Doubt document
    const doubt = await Doubt.create({
      student: studentId,
      classSubject: classSubject._id,
      subject: subjectId || classSubject.subject,
      topic: topic.trim(),
      subtopic: subtopic ? subtopic.trim() : '',
      title: title.trim(),
      questionText: questionText.trim(),
      attachments,
      codeSnippet: codeSnippet && codeSnippet.code ? codeSnippet : undefined,
      privacyMode: isAnonymous ? PRIVACY_MODE.ANONYMOUS : PRIVACY_MODE.NORMAL,
      priority: priority || 'normal',
      assignedFaculty: assignment ? assignment.faculty : undefined,
      resolutionStatus: DOUBT_STATUS.PENDING
    });

    // 6. Trigger AI Pipeline
    try {
      await aiService.processDoubt(doubt._id);
    } catch (aiErr) {
      console.error('[DoubtController] AI processing pipeline error:', aiErr);
    }

    // Reload populated doubt
    const updatedDoubt = await Doubt.findById(doubt._id)
      .populate('subject', 'name code')
      .populate('group', 'representativeTitle status')
      .populate('assignedFaculty', 'name email');

    // 7. Notify assigned faculty
    if (assignment) {
      const studentLabel = isAnonymous ? 'A student (Anonymous)' : req.user.name;
      await sendNotification({
        recipientId: assignment.faculty,
        eventType: NOTIFICATION_TYPE.DOUBT_ASSIGNED,
        title: `New Doubt: ${doubt.topic}`,
        message: `${studentLabel} submitted a doubt in ${classSubject.academicPeriod}: "${doubt.title}"`,
        relatedResource: {
          modelName: 'Doubt',
          resourceId: doubt._id
        }
      });
    }

    // 8. Audit log
    await logAudit({
      actorId: studentId,
      action: AUDIT_ACTIONS.DOUBT_SUBMITTED,
      modelName: 'Doubt',
      resourceId: doubt._id,
      details: {
        isAnonymous,
        topic: doubt.topic,
        classSubject: classSubject._id
      },
      req
    });

    res.status(201).json({
      success: true,
      message: isAnonymous
        ? 'Doubt submitted successfully in anonymous mode. Your identity is protected.'
        : 'Doubt submitted successfully.',
      doubt: updatedDoubt
    });
  } catch (error) {
    next(error);
  }
}

export async function getMyDoubts(req, res, next) {
  try {
    const studentId = req.user._id;
    const { status, subjectId, page = 1, limit = 10 } = req.query;

    const query = { student: studentId };
    if (status) query.resolutionStatus = status;
    if (subjectId) query.subject = subjectId;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    const [doubts, total] = await Promise.all([
      Doubt.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(take)
        .populate('subject', 'name code')
        .populate('assignedFaculty', 'name')
        .populate('group', 'representativeTitle status'),
      Doubt.countDocuments(query)
    ]);

    res.json({
      success: true,
      doubts,
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

export async function getDoubtById(req, res, next) {
  try {
    const user = req.user;
    const { id } = req.params;

    const doubt = await Doubt.findById(id)
      .populate('subject', 'name code')
      .populate('classSubject')
      .populate('assignedFaculty', 'name email')
      .populate('student', 'name email avatar')
      .populate('group')
      .populate('followUps.sender', 'name role avatar');

    if (!doubt) {
      return res.status(404).json({ success: false, message: 'Doubt not found' });
    }

    // AUTHORIZATION CHECK
    if (user.role === ROLES.STUDENT) {
      // Rule 1 & 2: Students can view their OWN doubts only.
      if (doubt.student._id.toString() !== user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You cannot view private doubts submitted by other students'
        });
      }
    } else if (user.role === ROLES.FACULTY) {
      // Rule 5 & 6: Faculty can only view doubts for assigned classSubjects
      const isAssigned = await FacultyAssignment.findOne({
        faculty: user._id,
        classSubject: doubt.classSubject._id,
        status: 'active'
      });

      if (!isAssigned && doubt.assignedFaculty?._id?.toString() !== user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You are not assigned to teach this class-subject'
        });
      }
    }

    // Retrieve answers (both individual and group answers if assigned to group)
    const answers = await Answer.find({
      $or: [
        { doubt: doubt._id },
        ...(doubt.group ? [{ group: doubt.group._id, approvalStatus: 'published' }] : [])
      ]
    }).populate('author', 'name role avatar');

    // Rule 7: If anonymous submission and accessed by faculty or other roles, strictly strip identity!
    let responseDoubt = doubt.toObject();
    delete responseDoubt.embedding;

    if (doubt.privacyMode === PRIVACY_MODE.ANONYMOUS && user.role !== ROLES.STUDENT) {
      responseDoubt.student = {
        _id: 'anonymous',
        name: 'Anonymous Student',
        email: 'anonymous@hidden.edu',
        isAnonymous: true
      };
    }

    res.json({
      success: true,
      doubt: responseDoubt,
      answers
    });
  } catch (error) {
    next(error);
  }
}

export async function addFollowUp(req, res, next) {
  try {
    const user = req.user;
    const { id } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message content is required' });
    }

    const doubt = await Doubt.findById(id);
    if (!doubt) {
      return res.status(404).json({ success: false, message: 'Doubt not found' });
    }

    const isStudentOwner = doubt.student.toString() === user._id.toString();
    const isFaculty = user.role === ROLES.FACULTY;

    if (!isStudentOwner && !isFaculty && user.role !== ROLES.ADMIN) {
      return res.status(403).json({ success: false, message: 'Access denied to this doubt thread' });
    }

    doubt.followUps.push({
      sender: user._id,
      isFaculty,
      message: message.trim(),
      createdAt: new Date()
    });

    await doubt.save();

    // Notify the other party
    const recipientId = isFaculty ? doubt.student : doubt.assignedFaculty;
    if (recipientId) {
      await sendNotification({
        recipientId,
        eventType: NOTIFICATION_TYPE.FOLLOW_UP_ADDED,
        title: `Follow-up on: ${doubt.title}`,
        message: `${user.name} added a follow-up response.`,
        relatedResource: {
          modelName: 'Doubt',
          resourceId: doubt._id
        }
      });
    }

    res.json({
      success: true,
      message: 'Follow-up sent successfully',
      followUps: doubt.followUps
    });
  } catch (error) {
    next(error);
  }
}

export async function submitFeedback(req, res, next) {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    const doubt = await Doubt.findOne({ _id: id, student: req.user._id });
    if (!doubt) {
      return res.status(404).json({ success: false, message: 'Doubt not found or unauthorized' });
    }

    doubt.feedback = {
      rating: Number(rating),
      comment: comment ? comment.trim() : '',
      submittedAt: new Date()
    };

    await doubt.save();

    res.json({
      success: true,
      message: 'Thank you for your feedback!'
    });
  } catch (error) {
    next(error);
  }
}
