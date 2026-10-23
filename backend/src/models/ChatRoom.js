import mongoose from 'mongoose';
import { ROOM_TYPE } from '../config/constants.js';

const chatRoomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    roomType: {
      type: String,
      enum: Object.values(ROOM_TYPE),
      required: true,
      index: true
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      index: true
    },
    classroom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Classroom',
      index: true
    },
    doubt: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doubt',
      index: true
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    status: {
      type: String,
      enum: ['active', 'archived', 'moderated'],
      default: 'active'
    },
    lastMessageAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

chatRoomSchema.index({ roomType: 1, subject: 1, classroom: 1 });

export const ChatRoom = mongoose.model('ChatRoom', chatRoomSchema);
