import { StudentProfile } from '../models/StudentProfile.js';
import { Enrollment } from '../models/Enrollment.js';
import { ClassSubject } from '../models/ClassSubject.js';
import { Classroom } from '../models/Classroom.js';
import { Doubt } from '../models/Doubt.js';
import { KnowledgeBaseArticle } from '../models/KnowledgeBaseArticle.js';
import { logAudit } from '../services/auditService.js';
import { AUDIT_ACTIONS, DOUBT_STATUS, ROLES } from '../config/constants.js';

export async function getStudentProfile(req, res, next) {
  try {
    const profile = await StudentProfile.findOne({ user: req.user._id })
      .populate({ path: 'currentClassroom', populate: { path: 'program' } })
      .populate('programRef')
      .populate('department');

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    res.json({ success: true, profile });
  } catch (error) {
    next(error);
  }
}

export async function completeInitialAcademicSelection(req, res, next) {
  try {
    if (req.user.role !== ROLES.STUDENT) {
      return res.status(403).json({ success: false, message: 'Only the student can submit their initial class selection' });
    }

    const profile = await StudentProfile.findOne({ user: req.user._id });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }
    if (profile.academicProfileStatus !== 'pending' || profile.initialSelectionCompletedAt) {
      return res.status(409).json({ success: false, message: 'Initial academic selection can only be submitted once' });
    }

    const classroom = await Classroom.findOne({ _id: req.body.classroomId, status: 'active' })
      .populate({ path: 'program', populate: { path: 'department' } });
    if (!classroom || !classroom.program) {
      return res.status(400).json({ success: false, message: 'Select a valid active classroom' });
    }
    if (profile.programRef && profile.programRef.toString() !== classroom.program._id.toString()) {
      return res.status(400).json({ success: false, message: 'Selected classroom is outside the assigned program' });
    }
    if (profile.department && profile.department.toString() !== classroom.program.department?._id?.toString()) {
      return res.status(400).json({ success: false, message: 'Selected classroom is outside the assigned department' });
    }

    const selectedAt = new Date();
    const previousEnrollments = await Enrollment.find({ student: req.user._id })
      .select('classroom status effectiveFrom');
    const previousTargetEnrollment = previousEnrollments.find(
      enrollment => enrollment.classroom.toString() === classroom._id.toString()
    );
    const previousProgramRef = profile.programRef;
    const previousDepartment = profile.department;
    const previousProgram = profile.program;
    const claimedProfile = await StudentProfile.findOneAndUpdate(
      {
        _id: profile._id,
        academicProfileStatus: 'pending',
        initialSelectionCompletedAt: { $exists: false }
      },
      {
        $set: {
          programRef: classroom.program._id,
          department: classroom.program.department?._id,
          program: classroom.program.name,
          branch: classroom.branch,
          semester: classroom.semester,
          studyYear: Math.ceil(classroom.semester / 2),
          section: classroom.section,
          academicYear: classroom.academicYear,
          currentClassroom: classroom._id,
          academicProfileStatus: 'complete',
          initialSelectionCompletedAt: selectedAt
        }
      },
      { new: true, runValidators: true }
    );
    if (!claimedProfile) {
      return res.status(409).json({ success: false, message: 'Initial academic selection can only be submitted once' });
    }

    try {
      await Enrollment.updateMany(
        { student: req.user._id, status: 'active' },
        { $set: { status: 'transferred' } }
      );
      await Enrollment.findOneAndUpdate(
        { student: req.user._id, classroom: classroom._id },
        { $set: { status: 'active', effectiveFrom: new Date() } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    } catch (error) {
      await StudentProfile.updateOne(
        { _id: profile._id, initialSelectionCompletedAt: selectedAt },
        {
          $set: {
            academicProfileStatus: 'pending',
            programRef: previousProgramRef,
            department: previousDepartment,
            program: previousProgram
          },
          $unset: {
            branch: 1,
            semester: 1,
            studyYear: 1,
            section: 1,
            academicYear: 1,
            currentClassroom: 1,
            initialSelectionCompletedAt: 1
          }
        }
      );
      await Enrollment.updateMany(
        { student: req.user._id, status: 'active' },
        { $set: { status: 'inactive' } }
      );
      for (const enrollment of previousEnrollments) {
        await Enrollment.updateOne(
          { _id: enrollment._id },
          { $set: { status: enrollment.status, effectiveFrom: enrollment.effectiveFrom } }
        );
      }
      if (!previousTargetEnrollment) {
        await Enrollment.deleteOne({ student: req.user._id, classroom: classroom._id });
      }
      throw error;
    }

    await logAudit({
      actorId: req.user._id,
      action: AUDIT_ACTIONS.USER_UPDATED,
      modelName: 'StudentProfile',
      resourceId: claimedProfile._id,
      details: { initialClassroomSelection: classroom._id },
      req
    });

    const updatedProfile = await StudentProfile.findById(claimedProfile._id)
      .populate({ path: 'currentClassroom', populate: { path: 'program' } })
      .populate('department');
    res.json({ success: true, profile: updatedProfile });
  } catch (error) {
    next(error);
  }
}

export async function getStudentClassOptions(req, res, next) {
  try {
    const profile = await StudentProfile.findOne({ user: req.user._id });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }
    if (profile.academicProfileStatus !== 'pending') {
      return res.status(409).json({ success: false, message: 'Initial academic selection is already complete' });
    }

    const classrooms = await Classroom.find({ status: 'active' })
      .sort({ academicYear: -1, semester: 1, section: 1 })
      .populate({ path: 'program', populate: { path: 'department' } });
    const eligibleClassrooms = classrooms.filter(classroom => {
      if (profile.programRef && profile.programRef.toString() !== classroom.program?._id?.toString()) return false;
      if (profile.department && profile.department.toString() !== classroom.program?.department?._id?.toString()) return false;
      return true;
    });

    res.json({ success: true, classrooms: eligibleClassrooms });
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
    const profile = await StudentProfile.findOne({ user: studentId })
      .populate({ path: 'currentClassroom', populate: { path: 'program' } })
      .populate('programRef')
      .populate('department');
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
    const classSubjects = await ClassSubject.find({ classroom: { $in: classroomIds }, status: 'active' });
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
        activeClassesCount: enrollments.length,
        activeSubjectsCount: classSubjects.length
      },
      profile,
      recentDoubts,
      recommendedArticles
    });
  } catch (error) {
    next(error);
  }
}
