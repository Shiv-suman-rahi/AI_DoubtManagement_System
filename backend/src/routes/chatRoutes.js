import express from 'express';
import { getRooms, getRoomMessages, createRoom } from '../controllers/chatController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/rooms', getRooms);
router.post('/rooms', createRoom);
router.get('/rooms/:id/messages', getRoomMessages);

export default router;
