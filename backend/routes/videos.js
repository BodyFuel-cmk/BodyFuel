const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

const { authMiddleware } = require('../auth');

const videosPath = path.join(__dirname, '..', 'data', 'videos.json');

function getCatalog() {
  const raw = fs.readFileSync(videosPath, 'utf-8');
  return JSON.parse(raw);
}

/**
 * GET /api/videos — list all videos (optionally filter by category)
 * Query: ?category=strength&search=keyword
 */
router.get('/', authMiddleware, (req, res) => {
  const catalog = getCatalog();
  let videos = [...catalog.videos];
  const { category, search } = req.query;

  if (category) {
    videos = videos.filter(v => v.category === category);
  }
  if (search) {
    const q = search.toLowerCase();
    videos = videos.filter(v =>
      v.title.toLowerCase().includes(q) ||
      v.description.toLowerCase().includes(q) ||
      v.instructor.toLowerCase().includes(q)
    );
  }

  res.json({ videos, categories: catalog.categories });
});

/**
 * GET /api/videos/featured — get featured/trending videos
 */
router.get('/featured', authMiddleware, (req, res) => {
  const catalog = getCatalog();
  const featured = catalog.videos.filter(v => v.featured);
  res.json({ videos: featured, categories: catalog.categories });
});

/**
 * GET /api/videos/:id — get single video details
 */
router.get('/:id', authMiddleware, (req, res) => {
  const catalog = getCatalog();
  const video = catalog.videos.find(v => v.id === req.params.id);

  if (!video) {
    return res.status(404).json({ error: 'Video not found' });
  }

  // Get related videos (same category, excluding current)
  const related = catalog.videos
    .filter(v => v.category === video.category && v.id !== video.id)
    .slice(0, 4);

  res.json({ video, related });
});

module.exports = router;