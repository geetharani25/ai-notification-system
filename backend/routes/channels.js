import { Router } from 'express';
import db from '../db/database.js';
import { verifyToken } from '../middleware/auth.js';

const router = Router();

router.get('/', verifyToken, (req, res) => {
  const channels = db.prepare('SELECT * FROM channels ORDER BY name').all();
  res.json(channels);
});

router.post('/', verifyToken, (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  try {
    const result = db.prepare(
      'INSERT INTO channels (name, description, created_by) VALUES (?, ?, ?)'
    ).run(name.trim().toLowerCase(), description || null, req.user.id);
    const channel = db.prepare('SELECT * FROM channels WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(channel);
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Channel name already exists' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', verifyToken, (req, res) => {
  const channel = db.prepare('SELECT * FROM channels WHERE id = ?').get(req.params.id);
  if (!channel) return res.status(404).json({ error: 'Channel not found' });
  res.json(channel);
});

export default router;
