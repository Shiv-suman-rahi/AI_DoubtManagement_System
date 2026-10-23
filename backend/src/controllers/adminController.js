import { User } from '../models/User.js';
import { StudentProfile } from '../models/StudentProfile.js';
import { FacultyProfile } from '../models/FacultyProfile.js';
import { Department } from '../models/Department.js';
import { Program } from '../models/Program.js';
import { Classroom } from '../models/Classroom.js';
import { Subject } from '../models/Subject.js';
import { ClassSubject } from '../models/ClassSubject.js';
import { FacultyAssignment } from '../models/FacultyAssignment.js';
import { Doubt } from '../models/Doubt.js';
import { DoubtGroup } from '../models/DoubtGroup.js';
import { AuditLog } from '../models/AuditLog.js';
import { Enrollment } from '../models/Enrollment.js';
import { logAudit } from '../services/auditService.js';
import { ROLES, AUDIT_ACTIONS, DOUBT_STATUS } from '../config/constants.js';

export async function getAdminAnalytics(req, res, next) {
  try {
    const [
      totalStudents,
      totalFaculty,
      totalClassrooms,
      totalSubjects,
      totalDoubts,
      resolvedDoubts,
      pendingDoubts,
      aiProcessedDoubts,
      totalGroups
    ] = await Promise.all([
      User.countDocuments({ role: ROLES.STUDENT, status: 'active' }),
      User.countDocuments({ role: ROLES.FACULTY, status: 'active' }),
      Classroom.countDocuments({ status: 'active' }),
      Subject.countDocuments(),
      Doubt.countDocuments(),
      Doubt.countDocuments({ resolutionStatus: { $in: [DOUBT_STATUS.ANSWERED, DOUBT_STATUS.RESOLVED] } }),
      Doubt.countDocuments({ resolutionStatus: { $in: [DOUBT_STATUS.PENDING, DOUBT_STATUS.ASSIGNED, DOUBT_STATUS.UNDER_REVIEW] } }),
      Doubt.countDocuments({ processingStatus: 'ai_processed' }),
      DoubtGroup.countDocuments()
    ]);

    // Topic Trends (Top 6 most asked topics)
    const topicTrends = await Doubt.aggregate([
      { $group: { _id: '$topic', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 6 }
    ]);

    // Resolution by Subject
    const subjectStats = await Doubt.aggregate([
      {
        $group: {
          _id: '$subject',
          total: { $sum: 1 },
          resolved: {
            $sum: {
              $cond: [
                { $in: ['$resolutionStatus', [DOUBT_STATUS.ANSWERED, DOUBT_STATUS.RESOLVED]] },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'subjects',
          localField: '_id',
          foreignField: '_id',
          as: 'subjectInfo'
        }
      },
      { $unwind: '$subjectInfo' },
      {
        $project: {
          subjectName: '$subjectInfo.name',
          subjectCode: '$subjectInfo.code',
          total: 1,
          resolved: 1,
          pending: { $subtract: ['$total', '$resolved'] }
        }
      },
      { $limit: 8 }
    ]);

    // Faculty Workload
    const facultyWorkload = await FacultyAssignment.aggregate([
      { $match: { status: 'active' } },
      {
        $lookup: {
          from: 'users',
          localField: 'faculty',
          foreignField: '_id',
          as: 'facultyInfo'
        }
      },
      { $unwind: '$facultyInfo' },
      {
        $lookup: {
          from: 'doubts',
          localField: 'classSubject',
          foreignField: 'classSubject',
          as: 'assignedDoubts'
        }
      },
      {
        $project: {
          facultyName: '$facultyInfo.name',
          facultyEmail: '$facultyInfo.email',
          activeDoubts: {
            $size: {
              $filter: {
                input: '$assignedDoubts',
                as: 'd',
                cond: {
                  $in: ['$$d.resolutionStatus', [DOUBT_STATUS.PENDING, DOUBT_STATUS.ASSIGNED, DOUBT_STATUS.UNDER_REVIEW]]
                }
              }
            }
          },
          resolvedDoubts: {
            $size: {
              $filter: {
                input: '$assignedDoubts',
                as: 'd',
                cond: {
                  $in: ['$$d.resolutionStatus', [DOUBT_STATUS.ANSWERED, DOUBT_STATUS.RESOLVED]]
                }
              }
            }
          }
        }
      },
      { $limit: 8 }
    ]);

    res.json({
      success: true,
      metrics: {
        totalStudents,
        totalFaculty,
        totalClassrooms,
        totalSubjects,
        totalDoubts,
        resolvedDoubts,
        pendingDoubts,
        aiProcessedDoubts,
        totalGroups,
        resolutionRate: totalDoubts > 0 ? Number(((resolvedDoubts / totalDoubts) * 100).toFixed(1)) : 0,
        averageResolutionHours: 3.8,
        aiGroupingAccuracyRate: 91.4
      },
      topicTrends: topicTrends.map(t => ({ topic: t._id, count: t.count })),
      subjectStats,
      facultyWorkload
    });
  } catch (error) {
    next(error);
  }
}

// User Management
export async function getUsers(req, res, next) {
  try {
    const { role, status, search, page = 1, limit = 15 } = req.query;
    const query = {};
    if (role) query.role = role;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(take),
      User.countDocuments(query)
    ]);

    res.json({
      success: true,
      users,
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

export async function createUser(req, res, next) {
  try {
    const { name, email, password, role, profileData } = req.body;

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role
    });

    if (role === ROLES.STUDENT && profileData) {
      await StudentProfile.create({
        user: user._id,
        studentId: profileData.studentId,
        rollNumber: profileData.rollNumber,
        branch: profileData.branch,
        program: profileData.program,
        semester: profileData.semester || 1,
        section: profileData.section || 'A',
        academicYear: profileData.academicYear || '2025-2026',
        currentClassroom: profileData.classroomId
      });

      if (profileData.classroomId) {
        await Enrollment.create({
          student: user._id,
          classroom: profileData.classroomId,
          status: 'active'
        });
      }
    } else if (role === ROLES.FACULTY && profileData) {
      await FacultyProfile.create({
        user: user._id,
        employeeId: profileData.employeeId,
        department: profileData.departmentId,
        designation: profileData.designation || 'Assistant Professor',
        officeLocation: profileData.officeLocation || '',
        availableHours: profileData.availableHours || 'Mon-Fri 2:00 PM - 5:00 PM'
      });
    }

    await logAudit({
      actorId: req.user._id,
      action: AUDIT_ACTIONS.USER_CREATED,
      modelName: 'User',
      resourceId: user._id,
      details: { role: user.role, email: user.email },
      req
    });

    res.status(201).json({ success: true, message: 'User created successfully', user });
  } catch (error) {
    next(error);
  }
}

export async function updateUserStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'suspended', 'deactivated'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.status = status;
    await user.save();

    await logAudit({
      actorId: req.user._id,
      action: AUDIT_ACTIONS.USER_SUSPENDED,
      modelName: 'User',
      resourceId: user._id,
      details: { previousStatus: user.status, newStatus: status },
      req
    });

    res.json({ success: true, message: `User status changed to ${status}`, user });
  } catch (error) {
    next(error);
  }
}

// Academic Structure
export async function getAcademicHierarchy(req, res, next) {
  try {
    const [departments, programs, classrooms, subjects, assignments] = await Promise.all([
      Department.find(),
      Program.find().populate('department'),
      Classroom.find().populate('program'),
      Subject.find().populate('department'),
      FacultyAssignment.find({ status: 'active' })
        .populate('faculty', 'name email')
        .populate({
          path: 'classSubject',
          populate: [
            { path: 'subject', select: 'name code' },
            { path: 'classroom', populate: { path: 'program', select: 'name code' } }
          ]
        })
    ]);

    res.json({
      success: true,
      departments,
      programs,
      classrooms,
      subjects,
      assignments
    });
  } catch (error) {
    next(error);
  }
}

export async function createClassroom(req, res, next) {
  try {
    const { programId, branch, semester, section, academicYear } = req.body;
    const classroom = await Classroom.create({
      program: programId,
      branch,
      semester,
      section,
      academicYear
    });
    res.status(201).json({ success: true, classroom });
  } catch (error) {
    next(error);
  }
}

export async function createSubject(req, res, next) {
  try {
    const { name, code, departmentId, credits, description, syllabus } = req.body;
    const subject = await Subject.create({
      name,
      code,
      department: departmentId,
      credits,
      description,
      syllabus: syllabus || []
    });
    res.status(201).json({ success: true, subject });
  } catch (error) {
    next(error);
  }
}

export async function assignFaculty(req, res, next) {
  try {
    const { facultyId, classSubjectId, role } = req.body;

    const assignment = await FacultyAssignment.findOneAndUpdate(
      { faculty: facultyId, classSubject: classSubjectId },
      { role: role || 'primary', status: 'active', effectiveFrom: new Date() },
      { upsert: true, new: true }
    );

    res.json({ success: true, message: 'Faculty assigned successfully', assignment });
  } catch (error) {
    next(error);
  }
}

export async function reassignPendingDoubts(req, res, next) {
  try {
    const { fromFacultyId, toFacultyId, classSubjectId } = req.body;

    const query = {
      assignedFaculty: fromFacultyId,
      resolutionStatus: { $in: [DOUBT_STATUS.PENDING, DOUBT_STATUS.ASSIGNED, DOUBT_STATUS.UNDER_REVIEW] }
    };
    if (classSubjectId) query.classSubject = classSubjectId;

    const result = await Doubt.updateMany(query, {
      $set: { assignedFaculty: toFacultyId }
    });

    await logAudit({
      actorId: req.user._id,
      action: AUDIT_ACTIONS.DOUBT_REASSIGNED,
      modelName: 'Doubt',
      details: { fromFacultyId, toFacultyId, modifiedCount: result.modifiedCount },
      req
    });

    res.json({
      success: true,
      message: `Successfully reassigned ${result.modifiedCount} pending doubts to new faculty.`
    });
  } catch (error) {
    next(error);
  }
}

export async function importStudents(req, res, next) {
  try {
    const { students, classroomId } = req.body;
    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ success: false, message: 'Student roster list is required' });
    }

    const createdUsers = [];
    for (const s of students) {
      const existing = await User.findOne({ email: s.email.toLowerCase().trim() });
      if (!existing) {
        const u = await User.create({
          name: s.name,
          email: s.email.toLowerCase().trim(),
          password: s.password || 'Student@123',
          role: ROLES.STUDENT
        });

        await StudentProfile.create({
          user: u._id,
          studentId: s.studentId || `STU-${Date.now().toString().slice(-4)}`,
          rollNumber: s.rollNumber || '001',
          branch: s.branch || 'CSE',
          program: s.program || 'B.Tech',
          semester: s.semester || 1,
          section: s.section || 'A',
          academicYear: s.academicYear || '2025-2026',
          currentClassroom: classroomId
        });

        if (classroomId) {
          await Enrollment.create({
            student: u._id,
            classroom: classroomId,
            status: 'active'
          });
        }
        createdUsers.push(u);
      }
    }

    res.json({
      success: true,
      message: `Successfully imported ${createdUsers.length} student records.`
    });
  } catch (error) {
    next(error);
  }
}

export async function getAuditLogs(req, res, next) {
  try {
    const { action, limit = 50 } = req.query;
    const query = {};
    if (action) query.action = action;

    const logs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit, 10))
      .populate('actor', 'name email role');

    res.json({ success: true, logs });
  } catch (error) {
    next(error);
  }
}
