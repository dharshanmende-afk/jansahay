import express from 'express';
import { db } from '../db/database.js';

const router = express.Router();

// GET /api/updates
router.get('/', (req, res) => {
  const updates = db.find('updates', u => u.active !== false);
  const sorted = updates.sort((a, b) => new Date(b.publishedDate) - new Date(a.publishedDate));
  return res.json({
    success: true,
    data: sorted
  });
});

export default router;
