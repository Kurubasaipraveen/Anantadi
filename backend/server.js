const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const cors = require('cors');
const { Op } = require('sequelize');
const { User, Video } = require('./models');

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// Authentication middleware
const authenticate = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) return res.status(401).send('Access denied.');

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch {
    res.status(400).send('Invalid token.');
  }
};

// Routes

// User Registration
app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({ username, password: hashedPassword });
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: 'User already exists or invalid input.' });
  }
});

// User Login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ where: { username } });
  if (!user) return res.status(400).send('Invalid credentials.');

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) return res.status(400).send('Invalid credentials.');

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
});

// Upload Video
app.post('/upload', authenticate, async (req, res) => {
  const { title, description, tags, fileSize } = req.body;

  try {
    const video = await Video.create({
      userId: req.user.id,
      title,
      description,
      tags,
      fileSize,
      uploadDate: new Date(),
    });
    res.status(201).send('Video uploaded successfully.');
  } catch (err) {
    res.status(400).send('Error uploading video.');
  }
});

// Get Videos (with filtering and pagination)
app.get('/videos', authenticate, async (req, res) => {
  const { page = 1, limit = 10, title, tags } = req.query;

  const filter = { userId: req.user.id };
  if (title) filter.title = { [Op.iLike]: `%${title}%` };
  if (tags) filter.tags = { [Op.iLike]: `%${tags}%` };

  try {
    const videos = await Video.findAndCountAll({
      where: filter,
      offset: (page - 1) * limit,
      limit: parseInt(limit),
    });

    res.json({
      videos: videos.rows,
      total: videos.count,
    });
  } catch (err) {
    res.status(400).send('Error retrieving videos.');
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
