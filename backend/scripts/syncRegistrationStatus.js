require('dotenv').config();
const mongoose = require('mongoose');
const Registration = require('../models/Registration');
const Attendance = require('../models/Attendance');
require('../models/Student');
require('../models/Event');

async function sync() {
  await mongoose.connect(process.env.MONGODB_URI);

  const attendancePairs = await Attendance.aggregate([
    {
      $group: {
        _id: {
          event: '$event',
          student: '$student'
        },
        latestCheckIn: { $max: '$checkInTime' }
      }
    }
  ]);

  let updated = 0;
  for (const row of attendancePairs) {
    const result = await Registration.findOneAndUpdate(
      {
        event: row._id.event,
        student: row._id.student,
        status: { $ne: 'cancelled' }
      },
      {
        status: 'attended',
        notes: 'Dong bo tu du lieu diem danh'
      }
    );

    if (result) {
      updated += 1;
    }
  }

  const sv002 = await Registration.find()
    .populate('student', 'studentCode fullName')
    .populate('event', 'title')
    .sort({ updatedAt: -1 })
    .limit(50);

  console.log('sync_result', {
    attendancePairs: attendancePairs.length,
    registrationsUpdated: updated
  });

  const sv002Rows = sv002
    .filter((r) => r.student && r.student.studentCode === 'SV002')
    .map((r) => ({
      studentCode: r.student.studentCode,
      fullName: r.student.fullName,
      event: r.event ? r.event.title : null,
      status: r.status,
      updatedAt: r.updatedAt
    }));

  console.log('sv002_rows', sv002Rows);

  await mongoose.disconnect();
}

sync().catch(async (error) => {
  console.error(error);
  try {
    await mongoose.disconnect();
  } catch (_) {
    // ignore
  }
  process.exit(1);
});
