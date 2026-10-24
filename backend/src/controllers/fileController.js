import fs from 'fs';
import path from 'path';
import { env } from '../config/env.js';
import { Answer } from '../models/Answer.js';
import { ChatMessage } from '../models/ChatMessage.js';
import { ChatRoom } from '../models/ChatRoom.js';
import { Doubt } from '../models/Doubt.js';
import { DoubtGroup } from '../models/DoubtGroup.js';
import { DoubtGroupItem } from '../models/DoubtGroupItem.js';
import { FacultyAssignment } from '../models/FacultyAssignment.js';
import { logAudit } from '../services/auditService.js';
import { verifyRoomAccess } from '../services/socketService.js';
import { AUDIT_ACTIONS, ROLES } from '../config/constants.js';

const uploadDirectory = path.resolve(process.cwd(), env.UPLOAD_DIR);

function attachmentUrls(filename) {
  return [`/uploads/${filename}`, `/api/files/${filename}`];
}

async function canAccessDoubt(user, doubt) {
  if (user.role === ROLES.ADMIN) return true;
  if (user.role === ROLES.STUDENT) return doubt.student.toString() === user._id.toString();
  if (user.role === ROLES.FACULTY) {
    return Boolean(await FacultyAssignment.exists({
      faculty: user._id,
      classSubject: doubt.classSubject,
      status: 'active'
    }));
  }
  return false;
}

async function canAccessGroup(user, group) {
  if (user.role === ROLES.ADMIN) return true;
  if (user.role === ROLES.FACULTY) {
    return Boolean(await FacultyAssignment.exists({
      faculty: user._id,
      classSubject: group.classSubject,
      status: 'active'
    }));
  }
  if (user.role === ROLES.STUDENT) {
    const items = await DoubtGroupItem.find({ group: group._id }).populate('doubt', 'student');
    return items.some(item => item.doubt?.student?.toString() === user._id.toString());
  }
  return false;
}

export async function getProtectedAttachment(req, res, next) {
  try {
    const { filename } = req.params;
    if (!filename || path.basename(filename) !== filename || filename.includes('\0')) {
      return res.status(400).json({ success: false, message: 'Invalid attachment name' });
    }

    const urls = attachmentUrls(filename);
    let authorized = false;
    let anonymousAccess = false;

    const doubt = await Doubt.findOne({ 'attachments.url': { $in: urls } });
    if (doubt) {
      authorized = await canAccessDoubt(req.user, doubt);
      anonymousAccess = doubt.privacyMode === 'anonymous';
    } else {
      const answer = await Answer.findOne({ 'attachments.url': { $in: urls } });
      if (answer && answer.approvalStatus === 'published') {
        if (answer.doubt) {
          const relatedDoubt = await Doubt.findById(answer.doubt);
          if (relatedDoubt) {
            authorized = await canAccessDoubt(req.user, relatedDoubt);
            anonymousAccess = relatedDoubt.privacyMode === 'anonymous';
          }
        } else if (answer.group) {
          const group = await DoubtGroup.findById(answer.group);
          if (group) {
            authorized = await canAccessGroup(req.user, group);
            if (req.user.role === ROLES.ADMIN) {
              const anonymousItems = await DoubtGroupItem.find({
                group: group._id,
              }).populate({ path: 'doubt', match: { privacyMode: 'anonymous' } });
              anonymousAccess = anonymousItems.some(item => item.doubt);
            }
          }
        }
      } else {
        const chatMessage = await ChatMessage.findOne({ 'attachments.url': { $in: urls } });
        if (chatMessage) {
          const room = await ChatRoom.findById(chatMessage.room);
          if (room) {
            const target = room.subject || room.classroom || room.doubt || room._id;
            authorized = await verifyRoomAccess(req.user, room.roomType, target);
          }
        }
      }
    }

    if (!authorized) {
      return res.status(403).json({ success: false, message: 'You are not authorized to access this attachment' });
    }

    const filePath = path.resolve(uploadDirectory, filename);
    if (path.dirname(filePath) !== uploadDirectory || !fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Attachment not found' });
    }

    if (anonymousAccess && req.user.role === ROLES.ADMIN) {
      await logAudit({
        actorId: req.user._id,
        action: AUDIT_ACTIONS.ANONYMOUS_IDENTITY_ACCESSED,
        modelName: 'Attachment',
        details: { filename },
        req
      });
    }

    return res.download(filePath, filename, error => {
      if (error && !res.headersSent) next(error);
    });
  } catch (error) {
    next(error);
  }
}
