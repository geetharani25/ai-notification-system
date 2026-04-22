import jwt from 'jsonwebtoken';
import db from '../db/database.js';
import { classifyUrgency } from '../services/aiClassifier.js';

const connectedUsers = new Map(); // userId -> Set<socketId>

function getUserSocket(userId) {
  return `user:${userId}`;
}

function channelRoom(channelId) {
  return `channel:${channelId}`;
}

function broadcastPresence(io, userId, status) {
  io.emit('user_presence', { userId, status });
}

export function registerSocketHandlers(io) {
  io.on('connection', (socket) => {
    let authenticated = false;

    const authTimeout = setTimeout(() => {
      if (!authenticated) socket.disconnect(true);
    }, 10000);

    socket.on('authenticate', (data) => {
      try {
        const user = jwt.verify(data?.token, process.env.JWT_SECRET);
        socket.userId = user.id;
        socket.username = user.username;
        authenticated = true;
        clearTimeout(authTimeout);

        socket.join(getUserSocket(user.id));

        if (!connectedUsers.has(user.id)) connectedUsers.set(user.id, new Set());
        connectedUsers.get(user.id).add(socket.id);

        const onlineUserIds = [...connectedUsers.keys()];
        socket.emit('authenticated', { success: true, userId: user.id, onlineUserIds });
        broadcastPresence(io, user.id, 'online');
      } catch {
        socket.emit('error', { message: 'Authentication failed' });
        socket.disconnect(true);
      }
    });

    socket.on('join_channel', ({ channelId }) => {
      if (!authenticated) return;
      socket.join(channelRoom(channelId));
    });

    socket.on('leave_channel', ({ channelId }) => {
      socket.leave(channelRoom(channelId));
    });

    socket.on('send_dm', ({ receiverId, content }) => {
      if (!authenticated || !receiverId || !content?.trim()) return;

      try {
        const result = db.prepare(
          "INSERT INTO messages (type, content, sender_id, receiver_id) VALUES ('dm', ?, ?, ?)"
        ).run(content.trim(), socket.userId, receiverId);

        const message = db.prepare(`
          SELECT m.*, u.username as sender_username
          FROM messages m JOIN users u ON u.id = m.sender_id
          WHERE m.id = ?
        `).get(result.lastInsertRowid);

        io.to(getUserSocket(receiverId)).emit('new_dm', { message });
        io.to(getUserSocket(socket.userId)).emit('new_dm', { message });

        const notifResult = db.prepare(
          "INSERT INTO notifications (user_id, message_id, type) VALUES (?, ?, 'dm')"
        ).run(receiverId, message.id);

        const notification = db.prepare(`
          SELECT n.id, n.type, n.is_read, n.created_at,
                 m.id as message_id, m.content, m.type as message_type,
                 m.urgency, m.channel_id, m.receiver_id,
                 u.id as sender_id, u.username as sender_username
          FROM notifications n
          JOIN messages m ON m.id = n.message_id
          JOIN users u ON u.id = m.sender_id
          WHERE n.id = ?
        `).get(notifResult.lastInsertRowid);

        io.to(getUserSocket(receiverId)).emit('notification', { notification });
      } catch (err) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('send_channel_message', ({ channelId, content }) => {
      if (!authenticated || !channelId || !content?.trim()) return;

      try {
        const result = db.prepare(
          "INSERT INTO messages (type, content, sender_id, channel_id) VALUES ('channel', ?, ?, ?)"
        ).run(content.trim(), socket.userId, channelId);

        const message = db.prepare(`
          SELECT m.*, u.username as sender_username
          FROM messages m JOIN users u ON u.id = m.sender_id
          WHERE m.id = ?
        `).get(result.lastInsertRowid);

        io.to(channelRoom(channelId)).emit('new_channel_message', { message });

        // Fan-out notifications to all users except sender
        const recipients = db.prepare('SELECT id FROM users WHERE id != ?').all(socket.userId);
        const insertNotif = db.prepare(
          "INSERT INTO notifications (user_id, message_id, type) VALUES (?, ?, 'broadcast')"
        );
        const getNotif = db.prepare(`
          SELECT n.id, n.type, n.is_read, n.created_at,
                 m.id as message_id, m.content, m.type as message_type,
                 m.urgency, m.channel_id, m.receiver_id,
                 u.id as sender_id, u.username as sender_username
          FROM notifications n
          JOIN messages m ON m.id = n.message_id
          JOIN users u ON u.id = m.sender_id
          WHERE n.id = ?
        `);

        for (const recipient of recipients) {
          const nr = insertNotif.run(recipient.id, message.id);
          const notification = getNotif.get(nr.lastInsertRowid);
          io.to(getUserSocket(recipient.id)).emit('notification', { notification });
        }

        // Async AI classification — does not block the response
        classifyUrgency(content.trim()).then(({ urgency, reason }) => {
          db.prepare('UPDATE messages SET urgency = ?, urgency_reason = ? WHERE id = ?')
            .run(urgency, reason, message.id);
          io.to(channelRoom(channelId)).emit('message_classified', {
            messageId: message.id,
            urgency,
            reason
          });
          // Also update existing notifications so future fetches include urgency
          // (The message row is updated so JOINs in notifications query will reflect it)
        }).catch(() => {});
      } catch {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('typing_start', ({ targetId, type }) => {
      if (!authenticated) return;
      const room = type === 'channel' ? channelRoom(targetId) : getUserSocket(targetId);
      socket.to(room).emit('typing_indicator', { userId: socket.userId, username: socket.username, targetId, type, isTyping: true });
    });

    socket.on('typing_stop', ({ targetId, type }) => {
      if (!authenticated) return;
      const room = type === 'channel' ? channelRoom(targetId) : getUserSocket(targetId);
      socket.to(room).emit('typing_indicator', { userId: socket.userId, username: socket.username, targetId, type, isTyping: false });
    });

    socket.on('disconnect', () => {
      clearTimeout(authTimeout);
      if (socket.userId) {
        const sockets = connectedUsers.get(socket.userId);
        if (sockets) {
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            connectedUsers.delete(socket.userId);
            broadcastPresence(io, socket.userId, 'offline');
          }
        }
      }
    });
  });
}
