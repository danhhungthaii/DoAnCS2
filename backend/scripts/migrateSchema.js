/**
 * Migration Script - Update Database Schema
 * @description Adds new fields to existing collections for Phase 1 features
 * 
 * Run this script: node backend/scripts/migrateSchema.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Student = require('../models/Student');
const Event = require('../models/Event');
const Attendance = require('../models/Attendance');

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

/**
 * Update Students with default points
 */
const updateStudents = async () => {
  console.log('\n📚 Updating Students...');
  
  try {
    const result = await Student.updateMany(
      { totalPoints: { $exists: false } }, // Students without totalPoints field
      {
        $set: {
          totalPoints: 0,
          pointsHistory: []
        }
      }
    );
    
    console.log(`✅ Updated ${result.modifiedCount} students with default points`);
  } catch (error) {
    console.error('❌ Error updating students:', error);
  }
};

/**
 * Update Events with default points and counters
 */
const updateEvents = async () => {
  console.log('\n🎯 Updating Events...');
  
  try {
    const result = await Event.updateMany(
      { points: { $exists: false } }, // Events without points field
      {
        $set: {
          points: 5,
          pointsDescription: 'Điểm thưởng cho việc tham dự sự kiện',
          registeredCount: 0,
          attendedCount: 0,
          verifiedCount: 0
        }
      }
    );
    
    console.log(`✅ Updated ${result.modifiedCount} events with default points`);
    
    // Recalculate attendance counts for existing events
    const events = await Event.find();
    for (const event of events) {
      const registeredCount = await Attendance.countDocuments({ 
        event: event._id, 
        status: 'registered' 
      });
      
      const attendedCount = await Attendance.countDocuments({ 
        event: event._id, 
        status: { $in: ['present', 'late'] } 
      });
      
      const verifiedCount = await Attendance.countDocuments({ 
        event: event._id, 
        verificationStatus: 'approved' 
      });
      
      await Event.updateOne(
        { _id: event._id },
        {
          $set: {
            registeredCount,
            attendedCount,
            verifiedCount
          }
        }
      );
    }
    
    console.log(`✅ Recalculated attendance counts for ${events.length} events`);
  } catch (error) {
    console.error('❌ Error updating events:', error);
  }
};

/**
 * Update Attendances with default verification status
 */
const updateAttendances = async () => {
  console.log('\n✅ Updating Attendances...');
  
  try {
    // Set default verification status for existing attendances
    const result = await Attendance.updateMany(
      { verificationStatus: { $exists: false } },
      {
        $set: {
          verificationStatus: 'approved', // Existing attendances are auto-approved
          pointsAwarded: 0
        }
      }
    );
    
    console.log(`✅ Updated ${result.modifiedCount} attendances with verification status`);
    
    // Set registeredAt for status = 'registered'
    const registeredResult = await Attendance.updateMany(
      { 
        status: 'registered',
        registeredAt: { $exists: false }
      },
      {
        $set: {
          registeredAt: new Date()
        }
      }
    );
    
    console.log(`✅ Set registeredAt for ${registeredResult.modifiedCount} registrations`);
  } catch (error) {
    console.error('❌ Error updating attendances:', error);
  }
};

/**
 * Award points retroactively for approved attendances
 */
const awardRetroactivePoints = async () => {
  console.log('\n🏆 Awarding retroactive points...');
  
  try {
    const approvedAttendances = await Attendance.find({
      verificationStatus: 'approved',
      pointsAwarded: 0
    }).populate('event student');
    
    let pointsAwarded = 0;
    
    for (const attendance of approvedAttendances) {
      if (!attendance.event || !attendance.student) continue;
      
      const points = attendance.event.points || 5;
      
      // Create StudentPoints record
      const StudentPoints = require('../models/StudentPoints');
      
      try {
        await StudentPoints.create({
          student: attendance.student._id,
          event: attendance.event._id,
          points: points,
          basePoints: points,
          bonusPoints: 0,
          type: 'attendance',
          reason: `Điểm danh ${attendance.event.title}`,
          earnedAt: attendance.checkInTime || new Date()
        });
        
        // Update student total points
        await Student.updateOne(
          { _id: attendance.student._id },
          {
            $inc: { totalPoints: points },
            $push: {
              pointsHistory: {
                event: attendance.event._id,
                points: points,
                earnedAt: attendance.checkInTime || new Date()
              }
            }
          }
        );
        
        // Update attendance
        await Attendance.updateOne(
          { _id: attendance._id },
          {
            $set: {
              pointsAwarded: points,
              pointsAwardedAt: new Date()
            }
          }
        );
        
        pointsAwarded++;
      } catch (error) {
        // Skip duplicates
        if (error.code === 11000) {
          console.log(`  ⏭️  Skipped duplicate: ${attendance.student.studentCode} - ${attendance.event.title}`);
        } else {
          throw error;
        }
      }
    }
    
    console.log(`✅ Awarded points to ${pointsAwarded} attendances`);
  } catch (error) {
    console.error('❌ Error awarding retroactive points:', error);
  }
};

/**
 * Main migration function
 */
const migrate = async () => {
  console.log('🚀 Starting Database Migration...\n');
  console.log('=' .repeat(50));
  
  await connectDB();
  
  await updateStudents();
  await updateEvents();
  await updateAttendances();
  await awardRetroactivePoints();
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ Migration completed successfully!\n');
  
  await mongoose.connection.close();
  console.log('🔒 Database connection closed');
  process.exit(0);
};

// Run migration
migrate().catch((error) => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});
