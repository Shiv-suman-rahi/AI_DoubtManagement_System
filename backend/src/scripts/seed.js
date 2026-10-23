import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB } from '../config/db.js';
import {
  User,
  StudentProfile,
  FacultyProfile,
  Department,
  Program,
  Classroom,
  Subject,
  ClassSubject,
  FacultyAssignment,
  Enrollment,
  Doubt,
  DoubtGroup,
  DoubtGroupItem,
  Answer,
  ChatRoom,
  ChatMessage,
  KnowledgeBaseArticle,
  Notification
} from '../models/index.js';
import { ROLES, DOUBT_STATUS, DOUBT_GROUP_STATUS, PRIVACY_MODE, ROOM_TYPE, NOTIFICATION_TYPE } from '../config/constants.js';
import { aiService } from '../services/ai/aiService.js';

async function seed() {
  try {
    await connectDB();
    console.log('[Seed] Connected to MongoDB. Clearing existing collections...');

    await Promise.all([
      User.deleteMany({}),
      StudentProfile.deleteMany({}),
      FacultyProfile.deleteMany({}),
      Department.deleteMany({}),
      Program.deleteMany({}),
      Classroom.deleteMany({}),
      Subject.deleteMany({}),
      ClassSubject.deleteMany({}),
      FacultyAssignment.deleteMany({}),
      Enrollment.deleteMany({}),
      Doubt.deleteMany({}),
      DoubtGroup.deleteMany({}),
      DoubtGroupItem.deleteMany({}),
      Answer.deleteMany({}),
      ChatRoom.deleteMany({}),
      ChatMessage.deleteMany({}),
      KnowledgeBaseArticle.deleteMany({}),
      Notification.deleteMany({})
    ]);

    console.log('[Seed] Existing collections cleared.');

    // 1. Create Departments
    const deptCSE = await Department.create({
      name: 'Computer Science and Engineering',
      code: 'CSE',
      description: 'Department of Computer Science & Engineering'
    });

    const deptIT = await Department.create({
      name: 'Information Technology',
      code: 'IT',
      description: 'Department of Information Technology'
    });

    // 2. Create Programs
    const progCSE = await Program.create({
      name: 'Bachelor of Technology in Computer Science',
      code: 'BTECH-CSE',
      department: deptCSE._id,
      durationYears: 4
    });

    // 3. Create Classrooms
    const classCSE3A = await Classroom.create({
      program: progCSE._id,
      branch: 'CSE',
      semester: 5,
      section: 'A',
      academicYear: '2025-2026',
      status: 'active'
    });

    const classCSE3B = await Classroom.create({
      program: progCSE._id,
      branch: 'CSE',
      semester: 5,
      section: 'B',
      academicYear: '2025-2026',
      status: 'active'
    });

    // 4. Create Subjects with Syllabi
    const subOS = await Subject.create({
      name: 'Operating Systems',
      code: 'CS501',
      department: deptCSE._id,
      credits: 4,
      description: 'Core concepts in system kernel, processes, threads, memory, and concurrency.',
      syllabus: [
        {
          topic: 'Process Synchronization',
          subtopics: ['Critical Section Problem', 'Semaphores', 'Mutex Locks', 'Monitors']
        },
        {
          topic: 'Deadlocks',
          subtopics: ['Resource Allocation Graphs', 'Banker Algorithm', 'Deadlock Detection', 'Recovery']
        },
        {
          topic: 'Memory Management',
          subtopics: ['Paging', 'Segmentation', 'Virtual Memory', 'Page Replacement Algorithms']
        },
        {
          topic: 'File Systems',
          subtopics: ['File Allocation Methods', 'Directory Implementation', 'Disk Scheduling']
        }
      ]
    });

    const subDBMS = await Subject.create({
      name: 'Database Management Systems',
      code: 'CS502',
      department: deptCSE._id,
      credits: 4,
      description: 'Relational data modeling, SQL optimization, transactions, and indexing.',
      syllabus: [
        {
          topic: 'Relational Algebra and SQL',
          subtopics: ['Complex Joins', 'Subqueries', 'Views', 'Aggregation']
        },
        {
          topic: 'Database Design & Normalization',
          subtopics: ['Functional Dependencies', '1NF/2NF/3NF', 'Boyce-Codd Normal Form (BCNF)']
        },
        {
          topic: 'Transaction Processing & Concurrency',
          subtopics: ['ACID Properties', 'Serializability', 'Two-Phase Locking (2PL)', 'Deadlocks']
        },
        {
          topic: 'Indexing and Hashing',
          subtopics: ['B+ Trees', 'Bitmap Indexes', 'Query Execution Plans']
        }
      ]
    });

    const subCN = await Subject.create({
      name: 'Computer Networks',
      code: 'CS503',
      department: deptCSE._id,
      credits: 4,
      description: 'OSI layers, routing protocols, TCP/UDP mechanisms, and network security.',
      syllabus: [
        {
          topic: 'Transport Layer Protocols',
          subtopics: ['TCP 3-Way Handshake', 'Flow Control (Sliding Window)', 'TCP Congestion Control']
        },
        {
          topic: 'Network Layer & Routing',
          subtopics: ['IPv4 Subnetting & CIDR', 'Distance Vector Routing', 'Link State Routing (OSPF)']
        },
        {
          topic: 'Application Layer',
          subtopics: ['HTTP/HTTPS', 'DNS Resolution Architecture', 'SMTP']
        }
      ]
    });

    // 5. Create ClassSubjects
    const csOS_3A = await ClassSubject.create({
      classroom: classCSE3A._id,
      subject: subOS._id,
      academicPeriod: '2025-2026 Sem 5'
    });

    const csDBMS_3A = await ClassSubject.create({
      classroom: classCSE3A._id,
      subject: subDBMS._id,
      academicPeriod: '2025-2026 Sem 5'
    });

    const csCN_3A = await ClassSubject.create({
      classroom: classCSE3A._id,
      subject: subCN._id,
      academicPeriod: '2025-2026 Sem 5'
    });

    const csOS_3B = await ClassSubject.create({
      classroom: classCSE3B._id,
      subject: subOS._id,
      academicPeriod: '2025-2026 Sem 5'
    });

    // 6. Create Users
    console.log('[Seed] Creating demo users...');

    // Admin
    const adminUser = await User.create({
      name: 'Dr. Rajesh Mehta (Administrator)',
      email: 'admin@apex.edu',
      password: 'Admin@123',
      role: ROLES.ADMIN,
      status: 'active'
    });

    // Faculty
    const facultySharma = await User.create({
      name: 'Prof. Ramesh Sharma',
      email: 'prof.sharma@apex.edu',
      password: 'Faculty@123',
      role: ROLES.FACULTY,
      status: 'active'
    });

    await FacultyProfile.create({
      user: facultySharma._id,
      employeeId: 'FAC-CSE-014',
      department: deptCSE._id,
      designation: 'Associate Professor',
      officeLocation: 'Room 304, Academic Block A',
      availableHours: 'Mon-Thu 2:00 PM - 4:30 PM',
      specializations: ['Operating Systems', 'Distributed Systems']
    });

    const facultyVerma = await User.create({
      name: 'Prof. Sunita Verma',
      email: 'prof.verma@apex.edu',
      password: 'Faculty@123',
      role: ROLES.FACULTY,
      status: 'active'
    });

    await FacultyProfile.create({
      user: facultyVerma._id,
      employeeId: 'FAC-CSE-022',
      department: deptCSE._id,
      designation: 'Assistant Professor',
      officeLocation: 'Room 308, Academic Block A',
      availableHours: 'Tue-Fri 3:00 PM - 5:00 PM',
      specializations: ['Database Systems', 'Cloud Computing']
    });

    // Students
    const studentAarav = await User.create({
      name: 'Aarav Sharma',
      email: 'student.aarav@apex.edu',
      password: 'Student@123',
      role: ROLES.STUDENT,
      status: 'active'
    });

    await StudentProfile.create({
      user: studentAarav._id,
      studentId: 'STU-2023-0101',
      rollNumber: '23CSE041',
      branch: 'CSE',
      program: 'B.Tech CSE',
      semester: 5,
      section: 'A',
      academicYear: '2025-2026',
      currentClassroom: classCSE3A._id
    });

    const studentAnanya = await User.create({
      name: 'Ananya Iyer',
      email: 'student.ananya@apex.edu',
      password: 'Student@123',
      role: ROLES.STUDENT,
      status: 'active'
    });

    await StudentProfile.create({
      user: studentAnanya._id,
      studentId: 'STU-2023-0102',
      rollNumber: '23CSE042',
      branch: 'CSE',
      program: 'B.Tech CSE',
      semester: 5,
      section: 'A',
      academicYear: '2025-2026',
      currentClassroom: classCSE3A._id
    });

    const studentRohan = await User.create({
      name: 'Rohan Deshmukh',
      email: 'student.rohan@apex.edu',
      password: 'Student@123',
      role: ROLES.STUDENT,
      status: 'active'
    });

    await StudentProfile.create({
      user: studentRohan._id,
      studentId: 'STU-2023-0103',
      rollNumber: '23CSE089',
      branch: 'CSE',
      program: 'B.Tech CSE',
      semester: 5,
      section: 'B',
      academicYear: '2025-2026',
      currentClassroom: classCSE3B._id
    });

    // 7. Enrollments
    await Enrollment.create({
      student: studentAarav._id,
      classroom: classCSE3A._id,
      status: 'active'
    });

    await Enrollment.create({
      student: studentAnanya._id,
      classroom: classCSE3A._id,
      status: 'active'
    });

    await Enrollment.create({
      student: studentRohan._id,
      classroom: classCSE3B._id,
      status: 'active'
    });

    // 8. Faculty Assignments
    await FacultyAssignment.create({
      faculty: facultySharma._id,
      classSubject: csOS_3A._id,
      role: 'primary',
      status: 'active'
    });

    await FacultyAssignment.create({
      faculty: facultySharma._id,
      classSubject: csOS_3B._id,
      role: 'primary',
      status: 'active'
    });

    await FacultyAssignment.create({
      faculty: facultyVerma._id,
      classSubject: csDBMS_3A._id,
      role: 'primary',
      status: 'active'
    });

    // 9. Seed Chat Rooms
    const collegeLounge = await ChatRoom.create({
      name: 'Apex Central Academic Lounge',
      roomType: ROOM_TYPE.COLLEGE
    });

    await ChatRoom.create({
      name: 'Operating Systems (CS501) Forum',
      roomType: ROOM_TYPE.SUBJECT,
      subject: subOS._id
    });

    await ChatRoom.create({
      name: 'DBMS (CS502) Forum',
      roomType: ROOM_TYPE.SUBJECT,
      subject: subDBMS._id
    });

    await ChatMessage.create({
      room: collegeLounge._id,
      sender: adminUser._id,
      content: 'Welcome to the AI Doubt Management System (AIDMS). Submit your subject queries anytime with 24/7 AI-guided classification.'
    });

    // 10. Seed Doubts with Semantic Similarity & AI Grouping
    console.log('[Seed] Seeding sample doubts and AI groups...');

    // Doubt 1: Aarav submits doubt on Banker's Algorithm (Normal mode)
    const doubt1 = await Doubt.create({
      student: studentAarav._id,
      classSubject: csOS_3A._id,
      subject: subOS._id,
      topic: 'Deadlocks',
      subtopic: 'Banker Algorithm',
      title: 'How does the Banker Algorithm verify safe states with multiple resources?',
      questionText: 'I understand the Need = Max - Allocation formula, but when checking multiple resource vectors (A, B, C), how does the system decide which process to allocate first if two satisfy Work >= Need?',
      privacyMode: PRIVACY_MODE.NORMAL,
      priority: 'high',
      assignedFaculty: facultySharma._id,
      resolutionStatus: DOUBT_STATUS.PENDING
    });

    await aiService.processDoubt(doubt1._id);

    // Doubt 2: Ananya submits semantically similar doubt (Anonymous mode!)
    const doubt2 = await Doubt.create({
      student: studentAnanya._id,
      classSubject: csOS_3A._id,
      subject: subOS._id,
      topic: 'Deadlocks',
      subtopic: 'Banker Algorithm',
      title: 'Multiple resource vectors Banker algorithm order of execution',
      questionText: 'When testing Banker algorithm for safe sequence, does the order of checking processes affect whether a safe state exists?',
      privacyMode: PRIVACY_MODE.ANONYMOUS,
      priority: 'normal',
      assignedFaculty: facultySharma._id,
      resolutionStatus: DOUBT_STATUS.PENDING
    });

    // Process through AI - should automatically group or suggest group with doubt1!
    await aiService.processDoubt(doubt2._id);

    // Doubt 3: Aarav submits DBMS Normalization doubt (Resolved with Answer)
    const doubt3 = await Doubt.create({
      student: studentAarav._id,
      classSubject: csDBMS_3A._id,
      subject: subDBMS._id,
      topic: 'Database Design & Normalization',
      subtopic: 'Boyce-Codd Normal Form (BCNF)',
      title: 'Distinction between 3NF and BCNF for overlapping candidate keys',
      questionText: 'Can you please provide an intuitive real-world scenario where a table is in 3NF but violates BCNF?',
      privacyMode: PRIVACY_MODE.NORMAL,
      priority: 'normal',
      assignedFaculty: facultyVerma._id,
      resolutionStatus: DOUBT_STATUS.ANSWERED,
      resolvedAt: new Date()
    });

    await aiService.processDoubt(doubt3._id);

    // Faculty answers doubt3
    const ans3 = await Answer.create({
      author: facultyVerma._id,
      doubt: doubt3._id,
      content: `A relation is in 3NF if for every functional dependency X -> A, either X is a superkey OR A is a prime attribute (part of a candidate key).

BCNF removes the second condition: X MUST be a superkey, period.

Real-World Scenario:
Consider a college tutoring service:
(Student, Subject, Tutor)
Candidate keys: (Student, Subject) and (Student, Tutor)
Suppose:
1. Each student is assigned one tutor per subject: (Student, Subject) -> Tutor
2. Each tutor teaches only ONE subject: Tutor -> Subject

Here, Tutor -> Subject is in 3NF because Subject is a prime attribute.
However, Tutor is NOT a superkey on its own! Hence it violates BCNF. To bring it to BCNF, decompose into (Tutor, Subject) and (Student, Tutor).`,
      visibilityScope: 'individual',
      approvalStatus: 'published',
      facultyApproved: true
    });

    // Also publish into Knowledge Base
    await KnowledgeBaseArticle.create({
      title: 'Distinction between 3NF and BCNF with Overlapping Candidate Keys',
      subject: subDBMS._id,
      topic: 'Database Design & Normalization',
      questionSummary: 'Real-world example where a relation satisfies 3NF but violates BCNF.',
      approvedExplanation: ans3.content,
      tags: ['Normalization', '3NF', 'BCNF', 'Database Design'],
      approvedBy: facultyVerma._id,
      sourceAnswer: ans3._id,
      viewCount: 14,
      helpfulCount: 8
    });

    // 11. Notifications
    await Notification.create({
      recipient: studentAarav._id,
      eventType: NOTIFICATION_TYPE.DOUBT_ANSWERED,
      title: 'Answer Received: BCNF vs 3NF',
      message: 'Prof. Sunita Verma answered your doubt on Database Normalization.',
      relatedResource: {
        modelName: 'Doubt',
        resourceId: doubt3._id
      }
    });

    await Notification.create({
      recipient: facultySharma._id,
      eventType: NOTIFICATION_TYPE.DOUBT_ASSIGNED,
      title: 'New Doubt Cohort: Deadlocks',
      message: 'New related doubts submitted for Operating Systems (CS501). AI grouping generated.',
      relatedResource: {
        modelName: 'Doubt',
        resourceId: doubt1._id
      }
    });

    console.log('\n=============================================================');
    console.log('✅ AIDMS Database Successfully Seeded with Realistic College Data!');
    console.log('=============================================================');
    console.log('Demo Credentials:');
    console.log('  👑 Administrator : admin@apex.edu          / Admin@123');
    console.log('  👨‍🏫 Faculty 1     : prof.sharma@apex.edu    / Faculty@123 (OS, CS501)');
    console.log('  👩‍🏫 Faculty 2     : prof.verma@apex.edu     / Faculty@123 (DBMS, CS502)');
    console.log('  👨‍🎓 Student 1 (3A): student.aarav@apex.edu   / Student@123');
    console.log('  👩‍🎓 Student 2 (3A): student.ananya@apex.edu  / Student@123');
    console.log('  👨‍🎓 Student 3 (3B): student.rohan@apex.edu   / Student@123');
    console.log('=============================================================\n');

    process.exit(0);
  } catch (err) {
    console.error('[Seed] Error seeding database:', err);
    process.exit(1);
  }
}

seed();
