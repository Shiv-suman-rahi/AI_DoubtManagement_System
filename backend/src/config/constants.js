/**
 * Application Constants and Enums for AIDMS
 */

export const ROLES = {
  STUDENT: 'student',
  FACULTY: 'faculty',
  ADMIN: 'admin'
};

export const DOUBT_STATUS = {
  PENDING: 'pending',
  AI_PROCESSED: 'ai_processed',
  ASSIGNED: 'assigned',
  UNDER_REVIEW: 'under_review',
  ANSWERED: 'answered',
  RESOLVED: 'resolved',
  REOPENED: 'reopened',
  ESCALATED: 'escalated'
};

export const PRIVACY_MODE = {
  NORMAL: 'normal',
  ANONYMOUS: 'anonymous'
};

export const DOUBT_GROUP_STATUS = {
  SUGGESTED: 'suggested',
  ACTIVE: 'active',
  MERGED: 'merged',
  SPLIT: 'split',
  RESOLVED: 'resolved'
};

export const ROOM_TYPE = {
  COLLEGE: 'college',
  SUBJECT: 'subject',
  CLASSROOM: 'classroom',
  PRIVATE_THREAD: 'private_thread'
};

export const NOTIFICATION_TYPE = {
  DOUBT_ASSIGNED: 'doubt_assigned',
  DOUBT_ANSWERED: 'doubt_answered',
  GROUP_ANSWER_PUBLISHED: 'group_answer_published',
  STATUS_CHANGED: 'status_changed',
  FOLLOW_UP_ADDED: 'follow_up_added',
  CONSULTATION_SCHEDULED: 'consultation_scheduled',
  ANNOUNCEMENT: 'announcement'
};

export const AUDIT_ACTIONS = {
  USER_LOGIN: 'user_login',
  USER_CREATED: 'user_created',
  USER_UPDATED: 'user_updated',
  USER_SUSPENDED: 'user_suspended',
  DOUBT_SUBMITTED: 'doubt_submitted',
  DOUBT_REASSIGNED: 'doubt_reassigned',
  GROUP_SPLIT: 'group_split',
  GROUP_MERGED: 'group_merged',
  ANSWER_PUBLISHED: 'answer_published',
  ANONYMOUS_IDENTITY_ACCESSED: 'anonymous_identity_accessed',
  POLICY_UPDATED: 'policy_updated'
};

export const AI_PROVIDERS = {
  GEMINI: 'gemini',
  OPENAI: 'openai',
  LOCAL: 'local'
};

export const DEFAULT_THRESHOLDS = {
  SIMILARITY_THRESHOLD: 0.78,
  AUTO_GROUP_THRESHOLD: 0.85
};
