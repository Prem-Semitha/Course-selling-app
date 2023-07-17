const express = require('express');
const app = express();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
app.use(express.json());

//Mongoose Scemas
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  purchasedCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
});
const adminSchema = new mongoose.Schema({
  username: String,
  password: String,
});

const courseSchema = new mongoose.Schema({
  title: String,
  description: String,
  price: Number,
  imageLink: String,
  published: Boolean,
});

const User = mongoose.model('User', userSchema);
const Admin = mongoose.model('Admin', adminSchema);
const Course = mongoose.model('Course', courseSchema);

const secretKey = 'Pr3m53m1tha';

const generateJwt = (user) => {
  const payload = { username: user.username };
  return jwt.sign(payload, secretKey, { expiresIn: '1h' });
};

const authenticateJwt = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1];

    jwt.verify(token, secretKey, (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }

      req.user = user;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};

mongoose
  .connect
  // secure database;
  ();
// Admin routes
app.post('/admin/signup', async (req, res) => {
  // logic to sign up admin
  const { username, password } = req.body;
  const admin = await Admin.findOne({ username });
  if (admin) {
    res.status(403).json({ message: 'User already exists' });
  } else {
    const newAdmin = new Admin({ username, password });
    await newAdmin.save();
    const token = jwt.sign({ username, role: 'admin' }, secretKey);
    res.json({ message: 'Admin Account have been added', token: token });
  }
});

app.post('/admin/login', async (req, res) => {
  // logic to log in admin
  const { username, password } = req.headers;
  const admin = await Admin.findOne({ username, password });
  if (admin) {
    const token = jwt.sign({ username, role: 'admin' }, secretKey);
    res.json({ message: 'Admin has logged in', token: token });
  } else {
    res.status(403).json({ message: 'admin has failed to login' });
  }
});

app.post('/admin/courses', authenticateJwt, async (req, res) => {
  // logic to create a course
  const course = new Course(req.body);
  await course.save();
  res.json({ message: 'A course has been added', courseId: course.id });
});

app.put('/admin/courses/:courseId', authenticateJwt, async (req, res) => {
  // logic to edit a course
  const course = await Course.findByIdAndUpdate(req.params.courseId, req.body, {
    new: true,
  });
  res.json({ message: 'Your course has been updated' });
});

app.get('/admin/courses', authenticateJwt, async (req, res) => {
  // logic to get all courses
  const course = await Course.find({});
  res.json({ course });
});

app.post('/users/signup', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (user) {
    res.status(403).json({ message: 'User already exists' });
  } else {
    const newUser = new User({ username, password });
    await newUser.save();
    const token = jwt.sign({ username, role: 'user' }, SECRET, {
      expiresIn: '1h',
    });
    res.json({ message: 'User created successfully', token });
  }
});

app.post('/users/login', async (req, res) => {
  const { username, password } = req.headers;
  const user = await User.findOne({ username, password });
  if (user) {
    const token = jwt.sign({ username, role: 'user' }, secretKey, {
      expiresIn: '1h',
    });
    res.json({ message: 'Logged in successfully', token });
  } else {
    res.status(403).json({ message: 'Invalid username or password' });
  }
});

app.get('/users/courses', authenticateJwt, async (req, res) => {
  const courses = await Course.find({ published: true });
  res.json({ courses });
});

app.post('/users/courses/:courseId', authenticateJwt, async (req, res) => {
  const course = await Course.findById(req.params.courseId);
  console.log(course);
  if (course) {
    const user = await User.findOne({ username: req.user.username });
    if (user) {
      user.purchasedCourses.push(course);
      await user.save();
      res.json({ message: 'Course purchased successfully' });
    } else {
      res.status(403).json({ message: 'User not found' });
    }
  } else {
    res.status(404).json({ message: 'Course not found' });
  }
});

app.get('/users/purchasedCourses', authenticateJwt, async (req, res) => {
  const user = await User.findOne({ username: req.user.username }).populate(
    'purchasedCourses'
  ); //this is done to get the whole object otherwise we will get only the id.
  if (user) {
    res.json({ purchasedCourses: user.purchasedCourses || [] });
  } else {
    res.status(403).json({ message: 'User not found' });
  }
});

app.listen(3000, () => {
  console.log('Server is listening on port 3000');
  console.log('database Connected');
});
