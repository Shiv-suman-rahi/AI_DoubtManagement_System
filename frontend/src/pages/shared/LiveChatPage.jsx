import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSocket } from '../../context/SocketContext.jsx';
import { Navbar } from '../../components/common/Navbar.jsx';
import {
  MessageSquare,
  Send,
  Users,
  Hash,
  Sparkles,
  Smile,
  Paperclip,
  CheckCheck
} from 'lucide-react';

export function LiveChatPage() {
  const { user } = useAuth();
  const { socket, connected } = useSocket();

  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // 1. Fetch authorized rooms
  useEffect(() => {
    async function loadRooms() {
      try {
        const res = await api.get('/chat/rooms');
        if (res.data.success) {
          setRooms(res.data.rooms);
          if (res.data.rooms.length > 0) {
            setActiveRoom(res.data.rooms[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load chat rooms:', err);
      } finally {
        setLoadingRooms(false);
      }
    }
    loadRooms();
  }, []);

  // 2. Load messages and join active room on socket
  useEffect(() => {
    if (!activeRoom) return;

    async function loadMessages() {
      setLoadingMessages(true);
      try {
        const res = await api.get(`/chat/rooms/${activeRoom._id}/messages`);
        if (res.data.success) {
          setMessages(res.data.messages);
        }
      } catch (err) {
        console.error('Failed to load room messages:', err);
      } finally {
        setLoadingMessages(false);
      }
    }
    loadMessages();

    if (socket && connected) {
      socket.emit('join_room', { roomId: activeRoom._id, roomType: activeRoom.roomType }, ack => {
        if (ack?.success) {
          console.log(`[Chat] Joined room ${activeRoom.name}`);
        }
      });
    }

    return () => {
      if (socket && connected) {
        socket.emit('leave_room', { roomKey: `room:${activeRoom._id}` });
      }
    };
  }, [activeRoom?._id, socket, connected]);

  // 3. Socket event listeners for incoming messages & typing
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = msg => {
      if (msg.room === activeRoom?._id) {
        setMessages(prev => [...prev, msg]);
      }
    };

    const handleUserTyping = ({ userId, userName }) => {
      setTypingUsers(prev => new Set(prev).add(userName));
    };

    const handleUserStopTyping = ({ userId }) => {
      setTypingUsers(prev => {
        const updated = new Set(prev);
        // Clean up
        return new Set();
      });
    };

    socket.on('new_message', handleNewMessage);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_stop_typing', handleUserStopTyping);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stop_typing', handleUserStopTyping);
    };
  }, [socket, activeRoom?._id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleInputChange = e => {
    setMessageText(e.target.value);
    if (!socket || !activeRoom) return;

    socket.emit('typing_start', { roomId: activeRoom._id });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing_stop', { roomId: activeRoom._id });
    }, 2000);
  };

  const handleSendMessage = e => {
    e.preventDefault();
    if (!messageText.trim() || !socket || !activeRoom) return;

    socket.emit(
      'send_message',
      {
        roomId: activeRoom._id,
        content: messageText.trim()
      },
      ack => {
        if (!ack?.success) {
          alert(ack?.message || 'Failed to deliver message');
        }
      }
    );

    setMessageText('');
    socket.emit('typing_stop', { roomId: activeRoom._id });
  };

  return (
    <div className="flex-1 h-screen bg-slate-50 flex flex-col overflow-hidden">
      <Navbar
        title="Live Academic Discussion Forum"
        subtitle="Real-time multi-room channels for peer discussion and faculty office hours"
      />

      <div className="flex-1 flex overflow-hidden max-w-7xl mx-auto w-full p-4 md:p-6 gap-6">
        {/* Left: Rooms Navigation */}
        <div className="w-72 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col shrink-0 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <span className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-brand-600" /> Channels
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 font-bold text-slate-600">
              {rooms.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loadingRooms ? (
              <div className="p-4 space-y-2 animate-pulse">
                <div className="h-10 bg-slate-100 rounded-xl"></div>
                <div className="h-10 bg-slate-100 rounded-xl"></div>
              </div>
            ) : (
              rooms.map(room => (
                <button
                  key={room._id}
                  onClick={() => setActiveRoom(room)}
                  className={`w-full text-left p-3 rounded-xl text-xs font-semibold flex items-center space-x-2.5 transition-all ${
                    activeRoom?._id === room._id
                      ? 'bg-brand-50 text-brand-700 border border-brand-200 shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Hash className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="truncate">{room.name}</span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right: Active Room Chat Area */}
        <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          {/* Room Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-brand-100 text-brand-700 rounded-lg">
                <Hash className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">{activeRoom?.name || 'Channel'}</h3>
                <p className="text-[11px] text-slate-400">Authenticated Campus Academic Discussion</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[11px] text-slate-500 font-medium">Socket Connected</span>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {loadingMessages ? (
              <div className="text-center p-8 text-xs text-slate-400">Loading conversation history...</div>
            ) : messages.length === 0 ? (
              <div className="text-center p-12 text-xs text-slate-400 space-y-2">
                <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-semibold text-slate-700">No messages in this channel yet.</p>
                <p>Be the first to post a question or academic insight!</p>
              </div>
            ) : (
              messages.map(msg => {
                const isMe = msg.sender?._id === user?._id;
                return (
                  <div
                    key={msg._id}
                    className={`flex items-start space-x-3 ${isMe ? 'flex-row-reverse space-x-reverse' : ''}`}
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs shrink-0">
                      {msg.sender?.name?.charAt(0) || 'U'}
                    </div>

                    <div className={`max-w-md ${isMe ? 'items-end' : ''}`}>
                      <div className="flex items-center space-x-2 text-[10px] text-slate-400 mb-1">
                        <span className="font-bold text-slate-700">{msg.sender?.name}</span>
                        <span className="px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded uppercase font-semibold text-[9px]">
                          {msg.sender?.role}
                        </span>
                        <span>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div
                        className={`p-3 rounded-2xl text-xs leading-relaxed ${
                          isMe
                            ? 'bg-brand-600 text-white rounded-tr-none shadow-sm'
                            : 'bg-slate-100 text-slate-800 rounded-tl-none'
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Typing indicator */}
          {typingUsers.size > 0 && (
            <div className="px-6 py-1 text-[11px] text-slate-400 italic">
              {Array.from(typingUsers).join(', ')} is typing...
            </div>
          )}

          {/* Message Input Box */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 flex items-center gap-3">
            <input
              type="text"
              placeholder={`Message #${activeRoom?.name || 'channel'}...`}
              value={messageText}
              onChange={handleInputChange}
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none"
            />
            <button
              type="submit"
              disabled={!messageText.trim()}
              className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-40 flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
