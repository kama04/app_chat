const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../config/db');
const { createJwt } = require('../utils/jwt');

const router = express.Router();

function setAuthCookie(res, token) {
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}

function getFriendlyDatabaseError(error, fallback) {
  if (error.code === 'ECONNREFUSED') {
    return 'Cannot connect to MySQL. Start MySQL on port 3306, then try again.';
  }

  if (error.code === 'ER_BAD_DB_ERROR') {
    return 'Database not found. Run database/schema.sql first.';
  }

  if (error.code === 'ER_ACCESS_DENIED_ERROR') {
    return 'MySQL username or password is incorrect. Check your .env file.';
  }

  return fallback;
}

router.get('/', (req, res) => {
  if (req.cookies.token) {
    return res.redirect('/chat');
  }

  return res.redirect('/login');
});

router.get('/login', (req, res) => {
  res.render('login', {
    title: 'Login',
    authPage: true
  });
});

router.get('/register', (req, res) => {
  res.render('register', {
    title: 'Register',
    authPage: true
  });
});

router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).render('register', {
      title: 'Register',
      authPage: true,
      error: 'Please fill in every field.',
      form: { username, email }
    });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);

    const [result] = await pool.execute(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      [username.trim(), email.trim().toLowerCase(), passwordHash]
    );

    const user = {
      id: result.insertId,
      username: username.trim(),
      email: email.trim().toLowerCase()
    };

    setAuthCookie(res, createJwt(user));
    return res.redirect('/chat');
  } catch (error) {
    console.error('Registration error:', error);
    const duplicate = error.code === 'ER_DUP_ENTRY';

    return res.status(400).render('register', {
      title: 'Register',
      authPage: true,
      error: duplicate
        ? 'That username or email is already registered.'
        : getFriendlyDatabaseError(error, 'Registration failed. Please try again.'),
      form: { username, email }
    });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).render('login', {
      title: 'Login',
      authPage: true,
      error: 'Please enter your email and password.',
      form: { email }
    });
  }

  try {
    const [rows] = await pool.execute(
      'SELECT id, username, email, password_hash FROM users WHERE email = ? LIMIT 1',
      [email.trim().toLowerCase()]
    );

    const user = rows[0];
    const validPassword = user && await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).render('login', {
        title: 'Login',
        authPage: true,
        error: 'Invalid email or password.',
        form: { email }
      });
    }

    setAuthCookie(res, createJwt(user));
    return res.redirect('/chat');
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).render('login', {
      title: 'Login',
      authPage: true,
      error: getFriendlyDatabaseError(error, 'Login failed. Please try again.'),
      form: { email }
    });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/login');
});

router.get('/api/token', (req, res) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: 'Login first to create a JWT.' });
  }

  return res.json({ token });
});

module.exports = router;
