const mongoose = require('mongoose');
const Student = require('./models/Student');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const students = await Student.find().select('_id studentCode fullName').limit(10);
  console.log('Students in DB:');
  students.forEach(s => console.log(`  ${s.studentCode} - ${s.fullName} (ID: ${s._id})`));
  
  // Check the specific student ID from app
  const oldId = '69a9908a39066ea04622d9cd';
  const oldStudent = await Student.findById(oldId);
  console.log(`\nChecking old ID ${oldId}:`, oldStudent ? 'Found' : 'NOT FOUND');
  
  process.exit();
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
