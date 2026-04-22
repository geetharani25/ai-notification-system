import { Router } from 'express';
import db from '../db/database.js';
import { verifyToken } from '../middleware/auth.js';

const router = Router();

router.get('/channel/:channelId', verifyToken, (req, res) => {
  const { channelId } = req.params;
  const { limit = 50, before } = req.query;
  const cap = Math.min(Number(limit), 100);

  let query = `
    SELECT m.*, u.username as sender_username
    FROM messages m
    JOIN users u ON u.id = m.sender_id
    WHERE m.channel_id = ? AND m.type = 'channel'
  `;
  const params = [channelId];
  if (before) { query += ' AND m.id < ?'; params.push(before); }
  query += ' ORDER BY m.created_at DESC LIMIT ?';
  params.push(cap);

  const rows = db.prepare(query).all(...params);
  res.json(rows.reverse());
});

router.get('/dm/:userId', verifyToken, (req, res) => {
  const me = req.user.id;
  const them = req.params.userId;
  const { limit = 50, before } = req.query;
  const cap = Math.min(Number(limit), 100);

  let query = `
    SELECT m.*, u.username as sender_username
    FROM messages m
    JOIN users u ON u.id = m.sender_id
    WHERE m.type = 'dm'
      AND ((m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?))
  `;
  const params = [me, them, them, me];
  if (before) { query += ' AND m.id < ?'; params.push(before); }
  query += ' ORDER BY m.created_at DESC LIMIT ?';
  params.push(cap);

  const rows = db.prepare(query).all(...params);
  res.json(rows.reverse());
});

export default router;
