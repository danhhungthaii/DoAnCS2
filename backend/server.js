const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const socketIo = require('socket.io');
const connectDB = require('./config/db');
const fs = require('fs');
const util = require('util');
const logFile = fs.createWriteStream(__dirname + '/debug.log', { flags: 'w' });
const logStdout = process.stdout;

console.log = function (d) {
  logFile.write(util.format(d) + '\n');
  logStdout.write(util.format(d) + '\n');
};
console.error = console.log;

console.log('DEBUG: Server script started');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = socketIo(server, {
  cors: {
    origin: '*', // Allow all origins for Socket.IO (mobile + web)
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" } // Allow cross-origin images
})); // Security headers
// CORS configuration for web and mobile
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Allow specific origins
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://10.0.2.2:5000', // Android emulator
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1 || origin.startsWith('http://10.0.2.2') || origin.startsWith('http://192.168.')) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all for development
    }
  },
  credentials: true,
}));

// Middleware to handle ngrok browser warning
app.use((req, res, next) => {
  // Add headers to bypass ngrok warning page
  res.setHeader('ngrok-skip-browser-warning', 'true');
  next();
});

app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(morgan('dev')); // Logging

// Serve uploaded files (banners)
app.use('/uploads', express.static('uploads'));

// Serve APK downloads
app.use('/downloads', express.static('public/downloads'));

// Make io accessible to routes
app.set('io', io);

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Attendance QR API Server is running!',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      events: '/api/events',
      students: '/api/students',
      attendances: '/api/attendances',
      ai: '/api/ai',
    }
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is healthy',
    data: { status: 'UP' }
  });
});

// APK Download Info API
app.get('/api/app/info', (req, res) => {
  const fs = require('fs');
  const path = require('path');
  const apkPath = path.join(__dirname, 'public', 'downloads', 'AttendanceQR.apk');
  
  if (fs.existsSync(apkPath)) {
    const stats = fs.statSync(apkPath);
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    res.json({
      success: true,
      data: {
        available: true,
        filename: 'AttendanceQR.apk',
        version: '1.0.0',
        size: fileSizeInMB + ' MB',
        downloadUrl: '/downloads/AttendanceQR.apk',
        lastModified: stats.mtime,
      }
    });
  } else {
    res.json({
      success: false,
      message: 'APK file not available yet',
      data: {
        available: false,
      }
    });
  }
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/events', require('./routes/events'));
app.use('/api/students', require('./routes/students'));
app.use('/api/attendances', require('./routes/attendances'));
app.use('/api/registrations', require('./routes/registrations'));
app.use('/api/admin/suspicious-activities', require('./routes/suspiciousActivity'));
app.use('/api/ai', require('./routes/ai'));

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Admin joins admin room for notifications
  socket.on('join-admin-room', () => {
    socket.join('admin-room');
    console.log(`Admin ${socket.id} joined admin-room`);
  });

  // Student joins personal room for notifications
  socket.on('join-student', (studentId) => {
    socket.join(`student-${studentId}`);
    console.log(`Student ${socket.id} joined student-${studentId}`);
  });

  // Join event room
  socket.on('join-event', (eventId) => {
    socket.join(`event-${eventId}`);
    console.log(`Client ${socket.id} joined event-${eventId}`);
  });

  // Leave event room
  socket.on('leave-event', (eventId) => {
    socket.leave(`event-${eventId}`);
    console.log(`Client ${socket.id} left event-${eventId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running on http://0.0.0.0:${PORT}`);
  console.log(`📡 Socket.IO is ready for real-time connections`);
  console.log(`🌐 CORS enabled for mobile apps (Android/iOS)`);
});

module.exports = { app, io };
