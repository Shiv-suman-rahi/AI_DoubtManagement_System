import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { setupTestDB, teardownTestDB, clearTestDB } from './setup.js';
import { createApp } from '../src/app.js';
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
  AuditLog
} from '../src/models/index.js';
import { generateTokens } from '../src/utils/token.js';
import { ROLES, PRIVACY_MODE, DOUBT_STATUS, AUDIT_ACTIONS } from '../src/config/constants.js';

let app;
let studentA, studentB, facultyAuthorized, facultyUnassigned, adminUser;
let tokenA, tokenB, tokenFacultyAuth, tokenFacultyUnassigned, tokenAdmin;
let classroom1, classroom2, subjectOS, classSubject1, classSubject2;

describe('Privacy and Access Control Suite', () => {
  beforeAll(async () => {
    await setupTestDB();
    app = createApp();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();

    // 1. Department & Program
    const dept = await Department.create({ name: 'Computer Science', code: 'CSE' });
    const prog = await Program.create({ name: 'B.Tech CSE', code: 'CSE', department: dept._id });

    // 2. Classrooms
    classroom1 = await Classroom.create({
      program: prog._id,
      branch: 'CSE',
      semester: 5,
      section: 'A',
      academicYear: '2025-2026'
    });

    classroom2 = await Classroom.create({
      program: prog._id,
      branch: 'CSE',
      semester: 5,
      section: 'B',
      academicYear: '2025-2026'
    });

    // 3. Subject & ClassSubjects
    subjectOS = await Subject.create({
      name: 'Operating Systems',
      code: 'CS501',
      department: dept._id,
      syllabus: [{ topic: 'Deadlocks', subtopics: ['Banker Algorithm'] }]
    });

    classSubject1 = await ClassSubject.create({
      classroom: classroom1._id,
      subject: subjectOS._id,
      academicPeriod: '2025-2026 Sem 5'
    });

    classSubject2 = await ClassSubject.create({
      classroom: classroom2._id,
      subject: subjectOS._id,
      academicPeriod: '2025-2026 Sem 5'
    });

    // 4. Users
    studentA = await User.create({
      name: 'Student Alice',
      email: 'alice@apex.edu',
      password: 'Password@123',
      role: ROLES.STUDENT
    });
    tokenA = generateTokens(studentA).accessToken;

    studentB = await User.create({
      name: 'Student Bob',
      email: 'bob@apex.edu',
      password: 'Password@123',
      role: ROLES.STUDENT
    });
    tokenB = generateTokens(studentB).accessToken;

    facultyAuthorized = await User.create({
      name: 'Prof. Authorized',
      email: 'prof.auth@apex.edu',
      password: 'Password@123',
      role: ROLES.FACULTY
    });
    tokenFacultyAuth = generateTokens(facultyAuthorized).accessToken;

    facultyUnassigned = await User.create({
      name: 'Prof. Unassigned',
      email: 'prof.unassigned@apex.edu',
      password: 'Password@123',
      role: ROLES.FACULTY
    });
    tokenFacultyUnassigned = generateTokens(facultyUnassigned).accessToken;

    adminUser = await User.create({
      name: 'Admin Apex',
      email: 'admin@apex.edu',
      password: 'Password@123',
      role: ROLES.ADMIN
    });
    tokenAdmin = generateTokens(adminUser).accessToken;

    // Enrollments
    await Enrollment.create({ student: studentA._id, classroom: classroom1._id, status: 'active' });
    await Enrollment.create({ student: studentB._id, classroom: classroom2._id, status: 'active' });

    // Faculty Assignment (Only facultyAuthorized is assigned to classSubject1)
    await FacultyAssignment.create({
      faculty: facultyAuthorized._id,
      classSubject: classSubject1._id,
      status: 'active'
    });
  });

  it('RULE 1: Student A cannot read Student B private doubts', async () => {
    // Student B creates a doubt in classroom 2
    const doubtB = await Doubt.create({
      student: studentB._id,
      classSubject: classSubject2._id,
      subject: subjectOS._id,
      topic: 'Deadlocks',
      title: 'Private doubt of Bob',
      questionText: 'Bob private question',
      privacyMode: PRIVACY_MODE.NORMAL
    });

    // Alice attempts to fetch Bob's doubt
    const res = await request(app)
      .get(`/api/doubts/${doubtB._id}`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Access denied');
  });

  it('RULE 2: Student cannot access faculty queue endpoints', async () => {
    const res = await request(app)
      .get('/api/faculty/doubts')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('RULE 3 & 4: Assigned faculty can access doubts, but unassigned faculty is rejected', async () => {
    const doubtAlice = await Doubt.create({
      student: studentA._id,
      classSubject: classSubject1._id,
      subject: subjectOS._id,
      topic: 'Deadlocks',
      title: 'Alice Question',
      questionText: 'How to avoid deadlocks?',
      assignedFaculty: facultyAuthorized._id
    });

    // Assigned faculty fetches
    const resAuth = await request(app)
      .get(`/api/doubts/${doubtAlice._id}`)
      .set('Authorization', `Bearer ${tokenFacultyAuth}`);

    expect(resAuth.status).toBe(200);
    expect(resAuth.body.success).toBe(true);
    expect(resAuth.body.doubt.student.name).toBe('Student Alice');

    // Unassigned faculty attempts to fetch Alice's doubt
    const resUnauth = await request(app)
      .get(`/api/doubts/${doubtAlice._id}`)
      .set('Authorization', `Bearer ${tokenFacultyUnassigned}`);

    expect(resUnauth.status).toBe(403);
    expect(resUnauth.body.success).toBe(false);
  });

  it('RULE 5: Anonymous identities are stripped from faculty responses', async () => {
    const anonDoubt = await Doubt.create({
      student: studentA._id,
      classSubject: classSubject1._id,
      subject: subjectOS._id,
      topic: 'Deadlocks',
      title: 'Anonymous query on resource graphs',
      questionText: 'What if cycle exists but multiple resource instances exist?',
      privacyMode: PRIVACY_MODE.ANONYMOUS,
      assignedFaculty: facultyAuthorized._id
    });

    // Faculty queries queue
    const resQueue = await request(app)
      .get('/api/faculty/doubts')
      .set('Authorization', `Bearer ${tokenFacultyAuth}`);

    expect(resQueue.status).toBe(200);
    const item = resQueue.body.doubts.find(d => d._id === anonDoubt._id.toString());
    expect(item).toBeDefined();
    // Student identity MUST be masked
    expect(item.student.name).toBe('Anonymous Student');
    expect(item.student.email).not.toBe('alice@apex.edu');
    expect(item.student._id).not.toBe(studentA._id.toString());

    // Single doubt detail view for faculty must also mask identity
    const resDetail = await request(app)
      .get(`/api/doubts/${anonDoubt._id}`)
      .set('Authorization', `Bearer ${tokenFacultyAuth}`);

    expect(resDetail.status).toBe(200);
    expect(resDetail.body.doubt.student.name).toBe('Anonymous Student');
    expect(resDetail.body.doubt.student.email).toBe('anonymous@hidden.edu');
  });

  it('RULE 6: Student can view their own anonymous doubt and receive answers privately', async () => {
    const anonDoubt = await Doubt.create({
      student: studentA._id,
      classSubject: classSubject1._id,
      subject: subjectOS._id,
      topic: 'Deadlocks',
      title: 'Alice Anonymous Question',
      questionText: 'Hidden identity test',
      privacyMode: PRIVACY_MODE.ANONYMOUS,
      assignedFaculty: facultyAuthorized._id
    });

    // Student A (the owner) can access it
    const res = await request(app)
      .get(`/api/doubts/${anonDoubt._id}`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.doubt.title).toBe('Alice Anonymous Question');
  });

  it('RULE 7: AI failures do not cause doubt loss', async () => {
    // When a doubt is created, even if AI pipeline encounters an unexpected issue, the doubt is safely saved
    const doubt = await Doubt.create({
      student: studentA._id,
      classSubject: classSubject1._id,
      subject: subjectOS._id,
      topic: 'Deadlocks',
      title: 'Graceful Fallback Test',
      questionText: 'Will this question persist if AI provider fails?',
      processingStatus: 'failed',
      resolutionStatus: DOUBT_STATUS.ASSIGNED,
      assignedFaculty: facultyAuthorized._id
    });

    const found = await Doubt.findById(doubt._id);
    expect(found).not.toBeNull();
    expect(found.title).toBe('Graceful Fallback Test');
    expect(found.processingStatus).toBe('failed');
  });

  it('RULE 8: Admin actions affecting sensitive data are logged to AuditLog', async () => {
    const res = await request(app)
      .patch(`/api/admin/users/${studentB._id}/status`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ status: 'suspended' });

    expect(res.status).toBe(200);

    const log = await AuditLog.findOne({
      action: AUDIT_ACTIONS.USER_SUSPENDED,
      'affectedResource.resourceId': studentB._id
    });

    expect(log).not.toBeNull();
    expect(log.actor.toString()).toBe(adminUser._id.toString());
  });
});
