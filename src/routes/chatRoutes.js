const express = require('express');
const pool = require('../config/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/chat', requireAuth, async (req, res) => {
  res.render('chat', {
    title: 'Chat',
    user: req.user,
    token: req.cookies.token
  });
});

module.exports = router;
