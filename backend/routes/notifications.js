import { Router } from 'express';
import db from '../db/database.js';
import { verifyToken } from '../middleware/auth.js';

const router = Router();

router.get('/', verifyToken, (req, res) => {
  const notifications = db.prepare(`
    SELECT n.id, n.type, n.is_read, n.created_at,
           m.id as message_id, m.content, m.type as message_type,
           m.urgency, m.urgency_reason,
           m.channel_id, m.receiver_id,
           u.id as sender_id, u.username as sender_username
    FROM notifications n
    JOIN messages m ON m.id = n.message_id
    JOIN users u ON u.id = m.sender_id
    WHERE n.user_id = ?
    ORDER BY n.is_read ASC, n.created_at DESC
    LIMIT 100
  `).all(req.user.id);
  res.json(notifications);
});

router.patch('/read-all', verifyToken, (req, res) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.user.id);
  res.json({ success: true });
});

router.patch('/read-by-context', verifyToken, (req, res) => {
  const { type, targetId } = req.body;
  if (!type || !targetId) return res.status(400).json({ error: 'type and targetId required' });

  if (type === 'channel') {
    db.prepare(`
      UPDATE notifications SET is_read = 1
      WHERE user_id = ? AND is_read = 0 AND message_id IN (
        SELECT id FROM messages WHERE channel_id = ?
      )
    `).run(req.user.id, targetId);
  } else if (type === 'dm') {
    db.prepare(`
      UPDATE notifications SET is_read = 1
      WHERE user_id = ? AND is_read = 0 AND message_id IN (
        SELECT id FROM messages WHERE type = 'dm' AND sender_id = ?
      )
    `).run(req.user.id, targetId);
  } else {
    return res.status(400).json({ error: 'type must be channel or dm' });
  }

  res.json({ success: true });
});

router.patch('/:id/read', verifyToken, (req, res) => {
  const result = db.prepare(
    'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?'
  ).run(req.params.id, req.user.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
});

export default router;
