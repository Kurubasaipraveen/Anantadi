const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const cors = require('cors');
const { Sequelize, DataTypes, Op } = require('sequelize');

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// Initialize Sequelize
const sequelize = new Sequelize(process.env.DB_URI, {
  dialect: 'postgres', // or 'mysql', 'sqlite' depending on your database
  logging: false,
});

// Define Models
const User = sequelize.define('User', {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

const Video = sequelize.define('Video', {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING,
  },
  tags: {
    type: DataTypes.STRING,
  },
  fileSize: {
    type: DataTypes.FLOAT,
  },
  uploadDate: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.NOW,
  },
});

// Relationships
User.hasMany(Video, { foreignKey: 'userId' });
Video.belongsTo(User, { foreignKey: 'userId' });

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

// Sync Database and Start Server
const PORT = process.env.PORT || 5000;
sequelize
  .sync()
  .then(() => {
    console.log('Database synchronized');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => console.error('Database synchronization failed:', err));
