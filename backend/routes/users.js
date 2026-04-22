import { Router } from 'express';
import db from '../db/database.js';
import { verifyToken } from '../middleware/auth.js';

const router = Router();

router.get('/', verifyToken, (req, res) => {
  const users = db.prepare('SELECT id, username, email, created_at FROM users ORDER BY username').all();
  res.json(users);
});

export default router;
