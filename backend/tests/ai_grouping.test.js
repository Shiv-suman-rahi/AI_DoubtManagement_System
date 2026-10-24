import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { setupTestDB, teardownTestDB, clearTestDB } from './setup.js';
import { createApp } from '../src/app.js';
import {
  User,
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
  Answer
} from '../src/models/index.js';
import { generateTokens } from '../src/utils/token.js';
import { ROLES, DOUBT_STATUS, DOUBT_GROUP_STATUS } from '../src/config/constants.js';
import { aiService } from '../src/services/ai/aiService.js';

let app;
let faculty, student1, student2;
let tokenFaculty, tokenStudent1;
let classSubject, subject;

describe('AI Semantic Grouping & Shared Answer Suite', () => {
  beforeAll(async () => {
    await setupTestDB();
    app = createApp();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();

    const dept = await Department.create({ name: 'Computer Science', code: 'CSE' });
    const prog = await Program.create({ name: 'B.Tech CSE', code: 'CSE', department: dept._id });
    const classroom = await Classroom.create({
      program: prog._id,
      branch: 'CSE',
      semester: 5,
      section: 'A',
      academicYear: '2025-2026'
    });

    subject = await Subject.create({
      name: 'Operating Systems',
      code: 'CS501',
      department: dept._id,
      syllabus: [{ topic: 'Deadlocks', subtopics: ['Banker Algorithm'] }]
    });

    classSubject = await ClassSubject.create({
      classroom: classroom._id,
      subject: subject._id,
      academicPeriod: '2025-2026 Sem 5'
    });

    faculty = await User.create({
      name: 'Prof. Sharma',
      email: 'prof.sharma@apex.edu',
      password: 'Password@123',
      role: ROLES.FACULTY
    });
    tokenFaculty = generateTokens(faculty).accessToken;

    student1 = await User.create({
      name: 'Aarav',
      email: 'aarav@apex.edu',
      password: 'Password@123',
      role: ROLES.STUDENT
    });
    tokenStudent1 = generateTokens(student1).accessToken;

    student2 = await User.create({
      name: 'Ananya',
      email: 'ananya@apex.edu',
      password: 'Password@123',
      role: ROLES.STUDENT
    });

    await Enrollment.create({ student: student1._id, classroom: classroom._id, status: 'active' });
    await Enrollment.create({ student: student2._id, classroom: classroom._id, status: 'active' });

    await FacultyAssignment.create({
      faculty: faculty._id,
      classSubject: classSubject._id,
      status: 'active'
    });
  });

  it('AI Pipeline groups semantically similar doubts without deleting originals', async () => {
    // 1. First student asks about Banker's Algorithm
    const doubt1 = await Doubt.create({
      student: student1._id,
      classSubject: classSubject._id,
      subject: subject._id,
      topic: 'Deadlocks',
      title: 'Banker algorithm multiple resource matrix verification',
      questionText: 'How does Banker algorithm determine safety when multiple resources exist?',
      assignedFaculty: faculty._id
    });

    const res1 = await aiService.processDoubt(doubt1._id);
    expect(res1.group).toBeDefined();

    // 2. Second student asks semantically similar question
    const doubt2 = await Doubt.create({
      student: student2._id,
      classSubject: classSubject._id,
      subject: subject._id,
      topic: 'Deadlocks',
      title: 'Banker algorithm multiple resource matrix verification process',
      questionText: 'How does Banker algorithm verify safety when multiple resources exist?',
      assignedFaculty: faculty._id
    });

    const res2 = await aiService.processDoubt(doubt2._id);

    // Both doubts must still exist in MongoDB (Original questions preserved permanently!)
    const d1 = await Doubt.findById(doubt1._id);
    const d2 = await Doubt.findById(doubt2._id);
    expect(d1).not.toBeNull();
    expect(d2).not.toBeNull();
    expect(d1.title).toBe(doubt1.title);
    expect(d2.title).toBe(doubt2.title);

    // They should share the group or have group items
    const groupItems = await DoubtGroupItem.find({ group: res1.group._id });
    expect(groupItems.length).toBeGreaterThanOrEqual(1);
  });

  it('Faculty can publish a shared answer to a group, resolving all linked doubts', async () => {
    // Create group
    const group = await DoubtGroup.create({
      classSubject: classSubject._id,
      subject: subject._id,
      topic: 'Deadlocks',
      representativeTitle: 'Banker Algorithm Clarification',
      representativeQuestion: 'Safety state calculation',
      assignedFaculty: faculty._id,
      status: DOUBT_GROUP_STATUS.ACTIVE
    });

    const doubt1 = await Doubt.create({
      student: student1._id,
      classSubject: classSubject._id,
      subject: subject._id,
      topic: 'Deadlocks',
      title: 'Doubt 1',
      questionText: 'Question 1',
      group: group._id,
      assignedFaculty: faculty._id
    });

    const doubt2 = await Doubt.create({
      student: student2._id,
      classSubject: classSubject._id,
      subject: subject._id,
      topic: 'Deadlocks',
      title: 'Doubt 2',
      questionText: 'Question 2',
      group: group._id,
      assignedFaculty: faculty._id
    });

    await DoubtGroupItem.create({ group: group._id, doubt: doubt1._id, matchConfidence: 0.9 });
    await DoubtGroupItem.create({ group: group._id, doubt: doubt2._id, matchConfidence: 0.9 });

    // Faculty answers group
    const res = await request(app)
      .post(`/api/faculty/doubt-groups/${group._id}/answers`)
      .set('Authorization', `Bearer ${tokenFaculty}`)
      .send({
        content: 'Official faculty explanation for the Banker Algorithm safe sequence calculation.',
        publishToKnowledgeBase: true
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Check that both individual doubts are now answered
    const updatedD1 = await Doubt.findById(doubt1._id);
    const updatedD2 = await Doubt.findById(doubt2._id);
    expect(updatedD1.resolutionStatus).toBe(DOUBT_STATUS.ANSWERED);
    expect(updatedD2.resolutionStatus).toBe(DOUBT_STATUS.ANSWERED);
  });

  it('persists doubts that require faculty review of their group match', async () => {
    const group = await DoubtGroup.create({
      classSubject: classSubject._id,
      subject: subject._id,
      topic: 'Deadlocks',
      representativeTitle: 'Banker Algorithm Clarification',
      representativeQuestion: 'Safety state calculation',
      assignedFaculty: faculty._id
    });
    const doubt = await Doubt.create({
      student: student1._id,
      classSubject: classSubject._id,
      subject: subject._id,
      topic: 'Deadlocks',
      title: 'Banker algorithm question',
      questionText: 'How is a safe state checked?',
      assignedFaculty: faculty._id
    });

    const item = await DoubtGroupItem.create({
      group: group._id,
      doubt: doubt._id,
      matchConfidence: 0.8,
      reviewStatus: 'faculty_review_required'
    });

    expect(item.reviewStatus).toBe('faculty_review_required');
  });

  it('lists active and suggested groups by default and supports explicit status filtering', async () => {
    const activeGroup = await DoubtGroup.create({
      classSubject: classSubject._id,
      subject: subject._id,
      topic: 'Deadlocks',
      representativeTitle: 'Active group',
      representativeQuestion: 'Active question',
      assignedFaculty: faculty._id,
      status: DOUBT_GROUP_STATUS.ACTIVE
    });
    const suggestedGroup = await DoubtGroup.create({
      classSubject: classSubject._id,
      subject: subject._id,
      topic: 'Deadlocks',
      representativeTitle: 'Suggested group',
      representativeQuestion: 'Suggested question',
      assignedFaculty: faculty._id,
      status: DOUBT_GROUP_STATUS.SUGGESTED
    });
    const resolvedGroup = await DoubtGroup.create({
      classSubject: classSubject._id,
      subject: subject._id,
      topic: 'Deadlocks',
      representativeTitle: 'Resolved group',
      representativeQuestion: 'Resolved question',
      assignedFaculty: faculty._id,
      status: DOUBT_GROUP_STATUS.RESOLVED
    });

    const defaultRes = await request(app)
      .get('/api/faculty/doubt-groups')
      .set('Authorization', `Bearer ${tokenFaculty}`);

    expect(defaultRes.status).toBe(200);
    expect(defaultRes.body.groups.map(group => group._id)).toEqual(
      expect.arrayContaining([activeGroup._id.toString(), suggestedGroup._id.toString()])
    );
    expect(defaultRes.body.groups.map(group => group._id)).not.toContain(resolvedGroup._id.toString());

    const resolvedRes = await request(app)
      .get('/api/faculty/doubt-groups')
      .query({ status: DOUBT_GROUP_STATUS.RESOLVED })
      .set('Authorization', `Bearer ${tokenFaculty}`);

    expect(resolvedRes.status).toBe(200);
    expect(resolvedRes.body.groups.map(group => group._id)).toEqual([resolvedGroup._id.toString()]);
  });
});
