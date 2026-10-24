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
import { ROLES, AUDIT_ACTIONS, DOUBT_STATUS, DOUBT_GROUP_STATUS } from '../config/constants.js';

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
    const userIds = users.map(user => user._id);
    const [studentProfiles, facultyProfiles] = await Promise.all([
      StudentProfile.find({ user: { $in: userIds } })
        .populate({ path: 'currentClassroom', populate: { path: 'program' } })
        .populate('programRef')
        .populate('department'),
      FacultyProfile.find({ user: { $in: userIds } }).populate('department')
    ]);
    const profilesByUser = new Map(
      [...studentProfiles, ...facultyProfiles].map(profile => [profile.user.toString(), profile])
    );
    const usersWithProfiles = users.map(user => ({
      ...user.toObject(),
      profile: profilesByUser.get(user._id.toString()) || null
    }));

    res.json({
      success: true,
      users: usersWithProfiles,
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
    const normalizedEmail = typeof email === 'string' ? email.toLowerCase().trim() : '';
    if (!name?.trim() || !normalizedEmail || !password || !Object.values(ROLES).includes(role)) {
      return res.status(400).json({ success: false, message: 'Name, email, password, and a valid role are required' });
    }
    if (name.trim().length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({ success: false, message: 'Enter a valid email and a name of 120 characters or fewer' });
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Initial password must be at least 8 characters long' });
    }

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    let classroom = null;
    let program = null;
    let department = null;
    if (role === ROLES.STUDENT) {
      if (!profileData?.studentId?.trim() || !profileData?.rollNumber?.trim()) {
        return res.status(400).json({ success: false, message: 'Student ID and roll number are required' });
      }
      if (profileData.studentId.trim().length > 40 || profileData.rollNumber.trim().length > 40) {
        return res.status(400).json({ success: false, message: 'Student ID and roll number must be 40 characters or fewer' });
      }
      const profileExists = await StudentProfile.findOne({
        $or: [
          { studentId: profileData.studentId.trim().toUpperCase() },
          { rollNumber: profileData.rollNumber.trim() }
        ]
      });
      if (profileExists) {
        return res.status(409).json({ success: false, message: 'Student ID or roll number is already registered' });
      }
      if (profileData.classroomId) {
        classroom = await Classroom.findOne({ _id: profileData.classroomId, status: 'active' })
          .populate({ path: 'program', populate: { path: 'department' } });
        if (!classroom?.program) {
          return res.status(400).json({ success: false, message: 'Select a valid active classroom' });
        }
        if (profileData.programId && profileData.programId !== classroom.program._id.toString()) {
          return res.status(400).json({ success: false, message: 'Classroom does not belong to the selected program' });
        }
        if (profileData.departmentId && profileData.departmentId !== classroom.program.department?._id?.toString()) {
          return res.status(400).json({ success: false, message: 'Classroom does not belong to the selected department' });
        }
      } else if (profileData.programId) {
        program = await Program.findById(profileData.programId).populate('department');
        if (!program) {
          return res.status(400).json({ success: false, message: 'Select a valid program' });
        }
        if (profileData.departmentId && profileData.departmentId !== program.department?._id?.toString()) {
          return res.status(400).json({ success: false, message: 'Program does not belong to the selected department' });
        }
      } else if (profileData.departmentId) {
        department = await Department.findById(profileData.departmentId);
        if (!department) return res.status(400).json({ success: false, message: 'Select a valid department' });
      }
    } else if (role === ROLES.FACULTY) {
      if (!profileData?.employeeId?.trim() || !profileData?.departmentId || !profileData?.designation?.trim()) {
        return res.status(400).json({ success: false, message: 'Faculty ID, department, and designation are required' });
      }
      if (profileData.employeeId.trim().length > 40 || profileData.designation.trim().length > 80) {
        return res.status(400).json({ success: false, message: 'Faculty ID must be at most 40 characters and designation at most 80 characters' });
      }
      const [department, duplicateEmployee] = await Promise.all([
        Department.findById(profileData.departmentId),
        FacultyProfile.findOne({ employeeId: profileData.employeeId.trim().toUpperCase() })
      ]);
      if (!department) return res.status(400).json({ success: false, message: 'Select a valid department' });
      if (duplicateEmployee) return res.status(409).json({ success: false, message: 'Faculty ID is already registered' });
    }

    let user;
    try {
      user = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        password,
        role
      });

      if (role === ROLES.STUDENT) {
        await StudentProfile.create({
          user: user._id,
          studentId: profileData.studentId.trim(),
          rollNumber: profileData.rollNumber.trim(),
          academicProfileStatus: classroom ? 'complete' : 'pending',
          department: classroom?.program?.department?._id || program?.department?._id || department?._id,
          programRef: classroom?.program?._id || program?._id,
          program: classroom?.program?.name || program?.name,
          branch: classroom?.branch,
          semester: classroom?.semester,
          studyYear: classroom ? Math.ceil(classroom.semester / 2) : undefined,
          section: classroom?.section,
          academicYear: classroom?.academicYear,
          admissionYear: profileData.admissionYear ? Number(profileData.admissionYear) : undefined,
          currentClassroom: classroom?._id
        });

        if (classroom) {
          await Enrollment.create({ student: user._id, classroom: classroom._id, status: 'active' });
        }
      } else if (role === ROLES.FACULTY) {
        await FacultyProfile.create({
          user: user._id,
          employeeId: profileData.employeeId.trim(),
          department: profileData.departmentId,
          designation: profileData.designation.trim(),
          academicTitle: profileData.academicTitle?.trim() || '',
          officeLocation: profileData.officeLocation?.trim() || '',
          availableHours: profileData.availableHours?.trim() || 'Mon-Fri 2:00 PM - 5:00 PM'
        });
      }
    } catch (error) {
      if (user) {
        await Promise.all([
          StudentProfile.deleteOne({ user: user._id }),
          FacultyProfile.deleteOne({ user: user._id }),
          Enrollment.deleteMany({ student: user._id }),
          User.deleteOne({ _id: user._id })
        ]);
      }
      throw error;
    }

    await logAudit({
      actorId: req.user._id,
      action: AUDIT_ACTIONS.USER_CREATED,
      modelName: 'User',
      resourceId: user._id,
      details: { role: user.role, email: user.email, academicProfileStatus: classroom ? 'complete' : role === ROLES.STUDENT ? 'pending' : undefined },
      req
    });

    res.status(201).json({ success: true, message: 'User created successfully', user });
  } catch (error) {
    next(error);
  }
}

export async function updateUser(req, res, next) {
    try {
      const { id } = req.params;
      const { name, email, profileData } = req.body;
      const user = await User.findById(id);
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });

      if (name !== undefined) {
        if (typeof name !== 'string' || !name.trim()) {
          return res.status(400).json({ success: false, message: 'Name cannot be empty' });
        }
        user.name = name.trim();
      }
      if (email !== undefined) {
        const normalizedEmail = typeof email === 'string' ? email.toLowerCase().trim() : '';
        if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
          return res.status(400).json({ success: false, message: 'Enter a valid email address' });
        }
        const emailConflict = await User.findOne({ email: normalizedEmail, _id: { $ne: user._id } });
        if (emailConflict) return res.status(409).json({ success: false, message: 'Email already registered' });
        user.email = normalizedEmail;
      }

      let profile;
      if (user.role === ROLES.STUDENT && profileData) {
        profile = await StudentProfile.findOne({ user: user._id });
        if (!profile) return res.status(404).json({ success: false, message: 'Student profile not found' });
        const studentId = profileData.studentId?.trim().toUpperCase();
        const rollNumber = profileData.rollNumber?.trim();
        if (!studentId || !rollNumber) {
          return res.status(400).json({ success: false, message: 'Student ID and roll number are required' });
        }
        const duplicate = await StudentProfile.findOne({
          user: { $ne: user._id },
          $or: [{ studentId }, { rollNumber }]
        });
        if (duplicate) return res.status(409).json({ success: false, message: 'Student ID or roll number is already registered' });

        const classroom = profileData.classroomId
          ? await Classroom.findOne({ _id: profileData.classroomId, status: 'active' })
              .populate({ path: 'program', populate: { path: 'department' } })
          : null;
        if (profileData.classroomId && !classroom?.program) {
          return res.status(400).json({ success: false, message: 'Select a valid active classroom' });
        }
        let selectedProgram = null;
        let selectedDepartment = null;
        if (classroom) {
          if (profileData.programId && profileData.programId !== classroom.program._id.toString()) {
            return res.status(400).json({ success: false, message: 'Classroom does not belong to the selected program' });
          }
          if (profileData.departmentId && profileData.departmentId !== classroom.program.department?._id?.toString()) {
            return res.status(400).json({ success: false, message: 'Classroom does not belong to the selected department' });
          }
        } else if (profileData.programId) {
          selectedProgram = await Program.findById(profileData.programId).populate('department');
          if (!selectedProgram) return res.status(400).json({ success: false, message: 'Select a valid program' });
          if (profileData.departmentId && profileData.departmentId !== selectedProgram.department?._id?.toString()) {
            return res.status(400).json({ success: false, message: 'Program does not belong to the selected department' });
          }
        } else if (profileData.departmentId) {
          selectedDepartment = await Department.findById(profileData.departmentId);
          if (!selectedDepartment) return res.status(400).json({ success: false, message: 'Select a valid department' });
        }

        profile.studentId = studentId;
        profile.rollNumber = rollNumber;
        profile.admissionYear = profileData.admissionYear || undefined;
        if (classroom) {
          const previousClassroomId = profile.currentClassroom?.toString();
          profile.currentClassroom = classroom._id;
          profile.programRef = classroom.program._id;
          profile.department = classroom.program.department?._id;
          profile.program = classroom.program.name;
          profile.branch = classroom.branch;
          profile.semester = classroom.semester;
          profile.studyYear = Math.ceil(classroom.semester / 2);
          profile.section = classroom.section;
          profile.academicYear = classroom.academicYear;
          profile.academicProfileStatus = 'complete';
          if (previousClassroomId !== classroom._id.toString()) {
            await Enrollment.updateMany(
              { student: user._id, status: 'active' },
              { $set: { status: 'transferred' } }
            );
            await Enrollment.findOneAndUpdate(
              { student: user._id, classroom: classroom._id },
              { $set: { status: 'active', effectiveFrom: new Date() } },
              { upsert: true, new: true, setDefaultsOnInsert: true }
            );

            const [newOfferings, unresolvedDoubts] = await Promise.all([
              ClassSubject.find({ classroom: classroom._id, status: 'active' }),
              Doubt.find({
                student: user._id,
                group: null,
                resolutionStatus: { $in: [DOUBT_STATUS.PENDING, DOUBT_STATUS.ASSIGNED, DOUBT_STATUS.UNDER_REVIEW] }
              })
            ]);
            const offeringsBySubject = new Map(newOfferings.map(offering => [offering.subject.toString(), offering]));
            for (const doubt of unresolvedDoubts) {
              const offering = offeringsBySubject.get(doubt.subject.toString());
              if (!offering) continue;
              const facultyAssignment = await FacultyAssignment.findOne({ classSubject: offering._id, status: 'active' });
              doubt.originalClassSubject = doubt.originalClassSubject || doubt.classSubject;
              doubt.classSubject = offering._id;
              doubt.assignedFaculty = facultyAssignment?.faculty;
              await doubt.save();
            }
          }
        } else {
          if (profile.currentClassroom && profileData.clearClassroom === true) {
            profile.currentClassroom = undefined;
            profile.academicProfileStatus = 'pending';
            profile.branch = undefined;
            profile.program = undefined;
            profile.semester = undefined;
            profile.studyYear = undefined;
            profile.section = undefined;
            profile.academicYear = undefined;
            await Enrollment.updateMany(
              { student: user._id, status: 'active' },
              { $set: { status: 'transferred' } }
            );
          }
          profile.programRef = selectedProgram?._id;
          profile.department = selectedProgram?.department?._id || selectedDepartment?._id;
          profile.program = selectedProgram?.name;
        }
        await profile.save();
      } else if (user.role === ROLES.FACULTY && profileData) {
        profile = await FacultyProfile.findOne({ user: user._id });
        if (!profile) return res.status(404).json({ success: false, message: 'Faculty profile not found' });
        const employeeId = profileData.employeeId?.trim().toUpperCase();
        if (!employeeId || !profileData.designation?.trim() || !profileData.departmentId) {
          return res.status(400).json({ success: false, message: 'Faculty ID, department, and designation are required' });
        }
        const [department, duplicate] = await Promise.all([
          Department.findById(profileData.departmentId),
          FacultyProfile.findOne({ employeeId, user: { $ne: user._id } })
        ]);
        if (!department) return res.status(400).json({ success: false, message: 'Select a valid department' });
        if (duplicate) return res.status(409).json({ success: false, message: 'Faculty ID is already registered' });
        profile.employeeId = employeeId;
        profile.department = department._id;
        profile.designation = profileData.designation.trim();
        profile.academicTitle = profileData.academicTitle?.trim() || '';
        profile.officeLocation = profileData.officeLocation?.trim() || '';
        profile.availableHours = profileData.availableHours?.trim() || profile.availableHours;
        await profile.save();
      }

      await user.save();
      await logAudit({
        actorId: req.user._id,
        action: AUDIT_ACTIONS.USER_UPDATED,
        modelName: 'User',
        resourceId: user._id,
        details: { updatedFields: Object.keys(req.body), role: user.role },
        req
      });

      res.json({ success: true, user });
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

    const previousStatus = user.status;
    user.status = status;
    await user.save();

    await logAudit({
      actorId: req.user._id,
      action: AUDIT_ACTIONS.USER_SUSPENDED,
      modelName: 'User',
      resourceId: user._id,
      details: { previousStatus, newStatus: status },
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
    const [departments, programs, classrooms, subjects, classSubjects, assignments] = await Promise.all([
      Department.find(),
      Program.find().populate('department'),
      Classroom.find().populate({ path: 'program', populate: { path: 'department' } }),
      Subject.find().populate('department'),
      ClassSubject.find({ status: 'active' })
        .populate('subject')
        .populate({ path: 'classroom', populate: { path: 'program', populate: { path: 'department' } } }),
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
      classSubjects,
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
    if (role && !['primary', 'co-faculty', 'ta'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid assignment role' });
    }
    const validation = await validateFacultyAssignment(facultyId, classSubjectId);
    if (validation.error) {
      return res.status(validation.status).json({ success: false, message: validation.error });
    }

    const assignment = await FacultyAssignment.findOneAndUpdate(
      { faculty: facultyId, classSubject: classSubjectId },
      { role: role || 'primary', status: 'active', effectiveFrom: new Date() },
      { upsert: true, new: true }
    );

    await logAudit({
      actorId: req.user._id,
      action: AUDIT_ACTIONS.USER_UPDATED,
      modelName: 'FacultyAssignment',
      resourceId: assignment._id,
      details: { facultyId, classSubjectId, status: 'active', role: assignment.role },
      req
    });

    res.json({ success: true, message: 'Faculty assigned successfully', assignment });
  } catch (error) {
    next(error);
  }
}

async function validateFacultyAssignment(facultyId, classSubjectId) {
  if (!facultyId || !classSubjectId) {
    return { status: 400, error: 'Faculty and class-subject offering are required' };
  }
  const [faculty, classSubject] = await Promise.all([
    User.findOne({ _id: facultyId, role: ROLES.FACULTY, status: 'active' }),
    ClassSubject.findOne({ _id: classSubjectId, status: 'active' })
      .populate('subject')
  ]);
  if (!faculty) return { status: 400, error: 'Select an active faculty account' };
  if (!classSubject?.subject) return { status: 400, error: 'Select an active class-subject offering' };

  const profile = await FacultyProfile.findOne({ user: faculty._id });
  if (profile && profile.department.toString() !== classSubject.subject.department.toString()) {
    return { status: 400, error: 'Faculty department must match the subject department' };
  }
  return { faculty, classSubject };
}

export async function getFacultyAssignmentsAdmin(req, res, next) {
  try {
    const { status = 'active', search, departmentId, programId, branch, semester, section, subjectId, academicYear } = req.query;
    const query = {};
    if (status !== 'all') query.status = status;
    const assignments = await FacultyAssignment.find(query)
      .sort({ updatedAt: -1 })
      .populate('faculty', 'name email status')
      .populate({
        path: 'classSubject',
        populate: [
          { path: 'subject', select: 'name code department', populate: { path: 'department', select: 'name code' } },
          { path: 'classroom', populate: { path: 'program', select: 'name code department' } }
        ]
      });

    const normalizedSearch = search?.trim().toLowerCase();
    const filteredAssignments = assignments.filter(assignment => {
      const classSubject = assignment.classSubject;
      const classroom = classSubject?.classroom;
      const program = classroom?.program;
      const subject = classSubject?.subject;
      if (departmentId && program?.department?.toString() !== departmentId
        && subject?.department?._id?.toString() !== departmentId) return false;
      if (programId && program?._id?.toString() !== programId) return false;
      if (branch && classroom?.branch !== branch) return false;
      if (semester && String(classroom?.semester) !== String(semester)) return false;
      if (section && classroom?.section !== section) return false;
      if (subjectId && subject?._id?.toString() !== subjectId) return false;
      if (academicYear && classroom?.academicYear !== academicYear) return false;
      if (normalizedSearch) {
        const text = [
          assignment.faculty?.name,
          assignment.faculty?.email,
          subject?.name,
          subject?.code,
          classroom?.branch,
          classroom?.section,
          program?.name,
          program?.code
        ].join(' ').toLowerCase();
        if (!text.includes(normalizedSearch)) return false;
      }
      return !!classSubject;
    });
    res.json({ success: true, assignments: filteredAssignments });
  } catch (error) {
    next(error);
  }
}

export async function updateFacultyAssignment(req, res, next) {
  try {
    if (req.body.role && !['primary', 'co-faculty', 'ta'].includes(req.body.role)) {
      return res.status(400).json({ success: false, message: 'Invalid assignment role' });
    }
    if (req.body.status && !['active', 'inactive'].includes(req.body.status)) {
      return res.status(400).json({ success: false, message: 'Invalid assignment status' });
    }
    const assignment = await FacultyAssignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ success: false, message: 'Faculty assignment not found' });

    const nextFacultyId = req.body.facultyId || assignment.faculty.toString();
    const nextClassSubjectId = req.body.classSubjectId || assignment.classSubject.toString();
    const validation = await validateFacultyAssignment(nextFacultyId, nextClassSubjectId);
    if (validation.error) {
      return res.status(validation.status).json({ success: false, message: validation.error });
    }

    const identityChanged = nextFacultyId !== assignment.faculty.toString()
      || nextClassSubjectId !== assignment.classSubject.toString();
    const previousFacultyId = assignment.faculty;
    const previousClassSubjectId = assignment.classSubject;
    let updatedAssignment = assignment;

    if (identityChanged) {
      const existing = await FacultyAssignment.findOne({
        faculty: nextFacultyId,
        classSubject: nextClassSubjectId,
        _id: { $ne: assignment._id }
      });
      if (existing && existing.status === 'active') {
        return res.status(409).json({ success: false, message: 'That faculty assignment already exists' });
      }
      assignment.status = 'reassigned';
      assignment.effectiveTo = new Date();
      await assignment.save();

      updatedAssignment = existing || new FacultyAssignment({
        faculty: nextFacultyId,
        classSubject: nextClassSubjectId
      });
      updatedAssignment.role = req.body.role || assignment.role;
      updatedAssignment.status = req.body.status || 'active';
      updatedAssignment.effectiveFrom = new Date();
      updatedAssignment.effectiveTo = undefined;
      await updatedAssignment.save();

      const replacement = updatedAssignment.status === 'active'
        && nextClassSubjectId === previousClassSubjectId.toString()
        ? updatedAssignment.faculty
        : (await FacultyAssignment.findOne({
          classSubject: previousClassSubjectId,
          status: 'active',
          _id: { $ne: assignment._id }
        }))?.faculty || null;
      const unresolved = [
        DOUBT_STATUS.PENDING,
        DOUBT_STATUS.ASSIGNED,
        DOUBT_STATUS.UNDER_REVIEW
      ];
      await Doubt.updateMany(
        { classSubject: previousClassSubjectId, assignedFaculty: previousFacultyId, resolutionStatus: { $in: unresolved } },
        { $set: { assignedFaculty: replacement } }
      );
      await DoubtGroup.updateMany(
        {
          classSubject: previousClassSubjectId,
          assignedFaculty: previousFacultyId,
          status: { $in: [DOUBT_GROUP_STATUS.ACTIVE, DOUBT_GROUP_STATUS.SUGGESTED] }
        },
        { $set: { assignedFaculty: replacement } }
      );
    } else {
      if (req.body.role) updatedAssignment.role = req.body.role;
      if (req.body.status && ['active', 'inactive'].includes(req.body.status)) {
        updatedAssignment.status = req.body.status;
        updatedAssignment.effectiveTo = req.body.status === 'active' ? undefined : new Date();
      }
      await updatedAssignment.save();
      if (updatedAssignment.status !== 'active') {
        const otherActiveAssignment = await FacultyAssignment.findOne({
          classSubject: previousClassSubjectId,
          status: 'active',
          _id: { $ne: updatedAssignment._id }
        });
        await Doubt.updateMany(
          {
            classSubject: previousClassSubjectId,
            assignedFaculty: previousFacultyId,
            resolutionStatus: { $in: [DOUBT_STATUS.PENDING, DOUBT_STATUS.ASSIGNED, DOUBT_STATUS.UNDER_REVIEW] }
          },
          { $set: { assignedFaculty: otherActiveAssignment?.faculty || null } }
        );
      }
    }

    await logAudit({
      actorId: req.user._id,
      action: AUDIT_ACTIONS.USER_UPDATED,
      modelName: 'FacultyAssignment',
      resourceId: updatedAssignment._id,
      details: {
        previousFacultyId,
        previousClassSubjectId,
        facultyId: updatedAssignment.faculty,
        classSubjectId: updatedAssignment.classSubject,
        status: updatedAssignment.status
      },
      req
    });
    res.json({ success: true, assignment: updatedAssignment });
  } catch (error) {
    next(error);
  }
}

export async function deactivateFacultyAssignment(req, res, next) {
  try {
    const assignment = await FacultyAssignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ success: false, message: 'Faculty assignment not found' });
    if (assignment.status !== 'inactive') {
      assignment.status = 'inactive';
      assignment.effectiveTo = new Date();
      await assignment.save();

      const otherActiveAssignment = await FacultyAssignment.findOne({
        classSubject: assignment.classSubject,
        status: 'active',
        _id: { $ne: assignment._id }
      });
      await Doubt.updateMany(
        {
          classSubject: assignment.classSubject,
          assignedFaculty: assignment.faculty,
          resolutionStatus: { $in: [DOUBT_STATUS.PENDING, DOUBT_STATUS.ASSIGNED, DOUBT_STATUS.UNDER_REVIEW] }
        },
        { $set: { assignedFaculty: otherActiveAssignment?.faculty || null } }
      );
    }

    await logAudit({
      actorId: req.user._id,
      action: AUDIT_ACTIONS.USER_UPDATED,
      modelName: 'FacultyAssignment',
      resourceId: assignment._id,
      details: { facultyId: assignment.faculty, classSubjectId: assignment.classSubject, status: assignment.status },
      req
    });
    res.json({ success: true, assignment });
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
