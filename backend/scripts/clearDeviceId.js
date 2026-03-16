// Clear deviceId from student to allow login from new device
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Student = require('../models/Student');

dotenv.config();

const clearDeviceId = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get student code from command line argument
    const studentCode = process.argv[2] || 'SV001';

    // Find and update student
    const student = await Student.findOne({ studentCode: studentCode.toUpperCase() });
    
    if (!student) {
      console.log(`Student ${studentCode} not found!`);
      process.exit(1);
    }

    console.log(`\nStudent: ${student.studentCode} (${student.fullName})`);
    console.log(`Current deviceId: ${student.deviceId || 'None'}`);
    
    // Clear deviceId
    student.deviceId = null;
    await student.save();
    
    console.log(`\n✅ DeviceId cleared for ${studentCode}`);
    console.log(`Student can now login from any device`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

clearDeviceId();
