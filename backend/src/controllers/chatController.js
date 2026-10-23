import { ChatRoom } from '../models/ChatRoom.js';
import { ChatMessage } from '../models/ChatMessage.js';
import { Enrollment } from '../models/Enrollment.js';
import { ClassSubject } from '../models/ClassSubject.js';
import { FacultyAssignment } from '../models/FacultyAssignment.js';
import { verifyRoomAccess } from '../services/socketService.js';
import { ROOM_TYPE, ROLES } from '../config/constants.js';

export async function getRooms(req, res, next) {
  try {
    const user = req.user;

    // College-wide room is always accessible
    let collegeRoom = await ChatRoom.findOne({ roomType: ROOM_TYPE.COLLEGE });
    if (!collegeRoom) {
      collegeRoom = await ChatRoom.create({
        name: 'College Academic Lounge',
        roomType: ROOM_TYPE.COLLEGE
      });
    }

    let subjectRooms = [];
    if (user.role === ROLES.STUDENT) {
      const enrollments = await Enrollment.find({ student: user._id, status: 'active' });
      const classroomIds = enrollments.map(e => e.classroom);
      const classSubjects = await ClassSubject.find({ classroom: { $in: classroomIds } }).populate('subject');
      const subjectIds = classSubjects.map(cs => cs.subject._id);

      subjectRooms = await ChatRoom.find({
        roomType: ROOM_TYPE.SUBJECT,
        subject: { $in: subjectIds }
      }).populate('subject', 'name code');
    } else if (user.role === ROLES.FACULTY) {
      const assignments = await FacultyAssignment.find({ faculty: user._id, status: 'active' }).populate('classSubject');
      const subjectIds = assignments.map(a => a.classSubject?.subject).filter(Boolean);

      subjectRooms = await ChatRoom.find({
        roomType: ROOM_TYPE.SUBJECT,
        subject: { $in: subjectIds }
      }).populate('subject', 'name code');
    } else {
      // Admin sees all subject rooms
      subjectRooms = await ChatRoom.find({ roomType: ROOM_TYPE.SUBJECT }).populate('subject', 'name code');
    }

    res.json({
      success: true,
      rooms: [collegeRoom, ...subjectRooms]
    });
  } catch (error) {
    next(error);
  }
}

export async function getRoomMessages(req, res, next) {
  try {
    const { id } = req.params;
    const { limit = 50, before } = req.query;

    const room = await ChatRoom.findById(id);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Chat room not found' });
    }

    // Verify user authorization for this room
    const target = room.subject || room.classroom || room.doubt || room._id;
    const isAuthorized = await verifyRoomAccess(req.user, room.roomType, target);
    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: 'Access denied: You are not authorized for this chat room' });
    }

    const query = { room: room._id };
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await ChatMessage.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit, 10))
      .populate('sender', 'name email role avatar');

    res.json({
      success: true,
      messages: messages.reverse()
    });
  } catch (error) {
    next(error);
  }
}

export async function createRoom(req, res, next) {
  try {
    const { name, roomType, subjectId, classroomId } = req.body;
    const room = await ChatRoom.create({
      name,
      roomType,
      subject: subjectId,
      classroom: classroomId
    });
    res.status(201).json({ success: true, room });
  } catch (error) {
    next(error);
  }
}
