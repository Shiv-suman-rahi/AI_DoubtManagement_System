import { Server } from 'socket.io';
import { verifyAccessToken } from '../utils/token.js';
import { User } from '../models/User.js';
import { Enrollment } from '../models/Enrollment.js';
import { FacultyAssignment } from '../models/FacultyAssignment.js';
import { ClassSubject } from '../models/ClassSubject.js';
import { Doubt } from '../models/Doubt.js';
import { ChatRoom } from '../models/ChatRoom.js';
import { ChatMessage } from '../models/ChatMessage.js';
import { Notification } from '../models/Notification.js';
import { ROLES, ROOM_TYPE, NOTIFICATION_TYPE } from '../config/constants.js';

let io = null;

export function initSocketIO(httpServer, allowedOrigins) {
  io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true
    },
    pingTimeout: 30000,
    pingInterval: 10000
  });

  // Socket Authentication Middleware
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(' ')[1] ||
        socket.handshake.query?.token;

      if (!token) {
        return next(new Error('Authentication error: Token required'));
      }

      const decoded = verifyAccessToken(token);
      if (!decoded) {
        return next(new Error('Authentication error: Invalid or expired token'));
      }

      const user = await User.findById(decoded.userId);
      if (!user || user.status !== 'active') {
        return next(new Error('Authentication error: User inactive or unauthorized'));
      }

      socket.user = user;
      next();
    } catch (err) {
      next(new Error(`Authentication error: ${err.message}`));
    }
  });

  io.on('connection', socket => {
    const user = socket.user;
    console.log(`[Socket] User connected: ${user.name} (${user.role}) - Socket ID: ${socket.id}`);

    // Join user's personal notification room
    socket.join(`user:${user._id.toString()}`);

    // Room Authorization & Joining
    socket.on('join_room', async ({ roomId, roomType, targetId }, callback) => {
      try {
        const chatRoom = roomId ? await ChatRoom.findById(roomId) : null;
        if (roomId && !chatRoom) {
          if (callback) callback({ success: false, message: 'Chat room not found' });
          return;
        }
        const actualRoomType = chatRoom?.roomType || roomType;
        const actualTargetId = chatRoom
          ? chatRoom.subject || chatRoom.classroom || chatRoom.doubt || chatRoom._id
          : targetId;
        const isAuthorized = await verifyRoomAccess(user, actualRoomType, actualTargetId);
        if (!isAuthorized) {
          if (callback) callback({ success: false, message: 'Unauthorized room access' });
          socket.emit('error_message', { message: 'Access denied for requested room' });
          return;
        }

        const roomKey = chatRoom ? `room:${chatRoom._id}` : `${actualRoomType}:${actualTargetId}`;
        socket.join(roomKey);
        console.log(`[Socket] ${user.name} joined room ${roomKey}`);

        if (callback) callback({ success: true, room: roomKey });
      } catch (err) {
        console.error('[Socket] join_room error:', err);
        if (callback) callback({ success: false, message: err.message });
      }
    });

    socket.on('leave_room', ({ roomKey }) => {
      if (roomKey) {
        socket.leave(roomKey);
        console.log(`[Socket] ${user.name} left room ${roomKey}`);
      }
    });

    // Chat Messaging with DB persistence and authorization check
    socket.on('send_message', async ({ roomId, content, attachments }, callback) => {
      try {
        if (!content || !content.trim()) {
          if (callback) callback({ success: false, message: 'Message content cannot be empty' });
          return;
        }

        const room = await ChatRoom.findById(roomId);
        if (!room) {
          if (callback) callback({ success: false, message: 'Chat room not found' });
          return;
        }

        // Verify sender is authorized for this room
        const authorized = await verifyRoomAccess(user, room.roomType, room.subject || room.classroom || room.doubt || room._id);
        if (!authorized) {
          if (callback) callback({ success: false, message: 'Unauthorized to send message in this room' });
          return;
        }

        // Persist message
        const chatMsg = await ChatMessage.create({
          room: room._id,
          sender: user._id,
          content: content.trim(),
          attachments: attachments || []
        });

        const populatedMsg = await ChatMessage.findById(chatMsg._id).populate('sender', 'name email role avatar');

        // Update room last activity
        room.lastMessageAt = new Date();
        await room.save();

        // Broadcast to everyone in room
        io.to(`room:${room._id.toString()}`).emit('new_message', populatedMsg);

        if (callback) callback({ success: true, message: populatedMsg });
      } catch (err) {
        console.error('[Socket] send_message error:', err);
        if (callback) callback({ success: false, message: err.message });
      }
    });

    // Typing Indicators
    socket.on('typing_start', async ({ roomId }) => {
      const room = await ChatRoom.findById(roomId);
      if (!room) return;
      const target = room.subject || room.classroom || room.doubt || room._id;
      if (!await verifyRoomAccess(user, room.roomType, target)) return;
      socket.to(`room:${room._id}`).emit('user_typing', {
        userId: user._id,
        userName: user.name
      });
    });

    socket.on('typing_stop', async ({ roomId }) => {
      const room = await ChatRoom.findById(roomId);
      if (!room) return;
      const target = room.subject || room.classroom || room.doubt || room._id;
      if (!await verifyRoomAccess(user, room.roomType, target)) return;
      socket.to(`room:${room._id}`).emit('user_stop_typing', {
        userId: user._id
      });
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] User disconnected: ${user.name}`);
    });
  });

  return io;
}

export function getIO() {
  return io;
}

/**
 * Server-Side Room Access Verification
 */
export async function verifyRoomAccess(user, roomType, targetId) {
  if (user.role === ROLES.ADMIN) return true;

  if (roomType === ROOM_TYPE.COLLEGE) return true;

  if (roomType === ROOM_TYPE.CLASSROOM) {
    if (user.role === ROLES.STUDENT) {
      const enrolled = await Enrollment.findOne({
        student: user._id,
        classroom: targetId,
        status: 'active'
      });
      return !!enrolled;
    }
    if (user.role === ROLES.FACULTY) {
      // Find any classSubject in this classroom assigned to this faculty
      const classSubjects = await ClassSubject.find({ classroom: targetId, status: 'active' });
      const csIds = classSubjects.map(cs => cs._id);
      const assignment = await FacultyAssignment.findOne({
        faculty: user._id,
        classSubject: { $in: csIds },
        status: 'active'
      });
      return !!assignment;
    }
  }

  if (roomType === ROOM_TYPE.SUBJECT) {
    if (user.role === ROLES.STUDENT) {
      // Check if student belongs to a classroom offering this subject
      const enrollments = await Enrollment.find({ student: user._id, status: 'active' });
      const classroomIds = enrollments.map(e => e.classroom);
      const classSubject = await ClassSubject.findOne({
        subject: targetId,
        classroom: { $in: classroomIds },
        status: 'active'
      });
      return !!classSubject;
    }
    if (user.role === ROLES.FACULTY) {
      const classSubjects = await ClassSubject.find({ subject: targetId, status: 'active' });
      const csIds = classSubjects.map(cs => cs._id);
      const assignment = await FacultyAssignment.findOne({
        faculty: user._id,
        classSubject: { $in: csIds },
        status: 'active'
      });
      return !!assignment;
    }
  }

  if (roomType === ROOM_TYPE.PRIVATE_THREAD) {
    const doubt = await Doubt.findById(targetId);
    if (!doubt) return false;
    if (doubt.student.toString() === user._id.toString()) return true;
    if (user.role !== ROLES.FACULTY) return false;
    return Boolean(await FacultyAssignment.exists({
      faculty: user._id,
      classSubject: doubt.classSubject,
      status: 'active'
    }));
  }

  return false;
}

/**
 * Send real-time notification to a specific user
 */
export async function sendNotification({ recipientId, eventType, title, message, relatedResource }) {
  try {
    const notification = await Notification.create({
      recipient: recipientId,
      eventType,
      title,
      message,
      relatedResource
    });

    if (io) {
      io.to(`user:${recipientId.toString()}`).emit('notification', notification);
    }

    return notification;
  } catch (err) {
    console.error('[Notification] Failed to send notification:', err);
  }
}
