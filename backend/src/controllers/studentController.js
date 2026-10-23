import { StudentProfile } from '../models/StudentProfile.js';
import { Enrollment } from '../models/Enrollment.js';
import { ClassSubject } from '../models/ClassSubject.js';
import { Doubt } from '../models/Doubt.js';
import { KnowledgeBaseArticle } from '../models/KnowledgeBaseArticle.js';
import { DOUBT_STATUS } from '../config/constants.js';

export async function getStudentProfile(req, res, next) {
  try {
    const profile = await StudentProfile.findOne({ user: req.user._id }).populate({
      path: 'currentClassroom',
      populate: { path: 'program' }
    });

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    res.json({ success: true, profile });
  } catch (error) {
    next(error);
  }
}

export async function getStudentClasses(req, res, next) {
  try {
    const enrollments = await Enrollment.find({
      student: req.user._id,
      status: 'active'
    }).populate({
      path: 'classroom',
      populate: { path: 'program' }
    });

    res.json({
      success: true,
      classes: enrollments.map(e => e.classroom).filter(Boolean)
    });
  } catch (error) {
    next(error);
  }
}

export async function getStudentSubjects(req, res, next) {
  try {
    // 1. Get student's active enrollments
    const enrollments = await Enrollment.find({
      student: req.user._id,
      status: 'active'
    });

    const classroomIds = enrollments.map(e => e.classroom);

    // 2. Find ClassSubjects for these classrooms
    const classSubjects = await ClassSubject.find({
      classroom: { $in: classroomIds },
      status: 'active'
    }).populate('subject');

    // Return unique subjects with classSubject reference
    const subjects = classSubjects.map(cs => ({
      classSubjectId: cs._id,
      classroomId: cs.classroom,
      subjectId: cs.subject._id,
      name: cs.subject.name,
      code: cs.subject.code,
      credits: cs.subject.credits,
      description: cs.subject.description,
      syllabus: cs.subject.syllabus || []
    }));

    res.json({ success: true, subjects });
  } catch (error) {
    next(error);
  }
}

export async function getStudentDashboard(req, res, next) {
  try {
    const studentId = req.user._id;

    // 1. Profile and active enrollment
    const profile = await StudentProfile.findOne({ user: studentId }).populate('currentClassroom');
    const enrollments = await Enrollment.find({ student: studentId, status: 'active' });
    const classroomIds = enrollments.map(e => e.classroom);

    // 2. Doubt metrics
    const [totalSubmitted, answeredCount, pendingCount, recentDoubts] = await Promise.all([
      Doubt.countDocuments({ student: studentId }),
      Doubt.countDocuments({
        student: studentId,
        resolutionStatus: { $in: [DOUBT_STATUS.ANSWERED, DOUBT_STATUS.RESOLVED] }
      }),
      Doubt.countDocuments({
        student: studentId,
        resolutionStatus: { $in: [DOUBT_STATUS.PENDING, DOUBT_STATUS.UNDER_REVIEW, DOUBT_STATUS.ASSIGNED] }
      }),
      Doubt.find({ student: studentId })
        .sort({ createdAt: -1 })
        .limit(6)
        .populate('subject', 'name code')
        .populate('assignedFaculty', 'name')
    ]);

    // 3. Recommended explanations from knowledge base for enrolled subjects
    const classSubjects = await ClassSubject.find({ classroom: { $in: classroomIds } });
    const subjectIds = classSubjects.map(cs => cs.subject);

    const recommendedArticles = await KnowledgeBaseArticle.find({
      subject: { $in: subjectIds }
    })
      .limit(4)
      .populate('subject', 'name code');

    res.json({
      success: true,
      stats: {
        totalSubmitted,
        answeredCount,
        pendingCount,
        activeClassesCount: enrollments.length
      },
      profile,
      recentDoubts,
      recommendedArticles
    });
  } catch (error) {
    next(error);
  }
}
