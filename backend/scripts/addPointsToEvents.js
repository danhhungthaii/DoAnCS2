/**
 * Script to add/update points for events
 * @description Manually set points for specific events
 * 
 * Run: node backend/scripts/addPointsToEvents.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Event = require('../models/Event');

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
 * Define points for different event types
 */
const EVENT_POINTS_CONFIG = {
  // Workshop events - higher points
  workshop: {
    points: 10,
    description: 'Workshop thực hành - Điểm cao'
  },
  // Seminar/Conference
  seminar: {
    points: 8,
    description: 'Hội thảo/Seminar - Điểm khá'
  },
  // Regular meetings
  regular: {
    points: 5,
    description: 'Sự kiện thường - Điểm chuẩn'
  },
  // Small events
  small: {
    points: 3,
    description: 'Sự kiện nhỏ - Điểm thấp'
  }
};

/**
 * Update all events with default points
 */
const updateAllEvents = async () => {
  console.log('\n🎯 Updating event points...\n');
  
  try {
    const events = await Event.find();
    
    for (const event of events) {
      let pointsConfig;
      
      // Determine points based on event title/description
      const title = event.title.toLowerCase();
      
      if (title.includes('workshop') || title.includes('thực hành')) {
        pointsConfig = EVENT_POINTS_CONFIG.workshop;
      } else if (title.includes('seminar') || title.includes('hội thảo') || title.includes('conference')) {
        pointsConfig = EVENT_POINTS_CONFIG.seminar;
      } else if (title.includes('meetup') || title.includes('gặp mặt')) {
        pointsConfig = EVENT_POINTS_CONFIG.small;
      } else {
        pointsConfig = EVENT_POINTS_CONFIG.regular;
      }
      
      await Event.updateOne(
        { _id: event._id },
        {
          $set: {
            points: pointsConfig.points,
            pointsDescription: pointsConfig.description
          }
        }
      );
      
      console.log(`✅ ${event.title}`);
      console.log(`   📊 ${pointsConfig.points} điểm - ${pointsConfig.description}\n`);
    }
    
    console.log(`✅ Updated ${events.length} events`);
  } catch (error) {
    console.error('❌ Error updating events:', error);
  }
};

/**
 * Update specific events by ID
 */
const updateSpecificEvents = async () => {
  // Example: Set specific points for specific events
  const customEvents = [
    // Add your custom event updates here
    // { eventId: '65abc...', points: 15, description: 'VIP Event' }
  ];
  
  if (customEvents.length === 0) {
    console.log('ℹ️  No custom event updates defined');
    return;
  }
  
  console.log('\n🎯 Updating specific events...\n');
  
  for (const custom of customEvents) {
    try {
      await Event.updateOne(
        { _id: custom.eventId },
        {
          $set: {
            points: custom.points,
            pointsDescription: custom.description
          }
        }
      );
      
      console.log(`✅ Updated event ${custom.eventId}`);
      console.log(`   📊 ${custom.points} điểm\n`);
    } catch (error) {
      console.error(`❌ Error updating event ${custom.eventId}:`, error.message);
    }
  }
};

/**
 * Display summary
 */
const displaySummary = async () => {
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY\n');
  
  const events = await Event.find().sort({ points: -1 });
  
  const grouped = {
    high: events.filter(e => e.points >= 10),
    medium: events.filter(e => e.points >= 5 && e.points < 10),
    low: events.filter(e => e.points < 5)
  };
  
  console.log(`🔥 High Points (≥10): ${grouped.high.length} events`);
  grouped.high.forEach(e => {
    console.log(`   - ${e.title}: ${e.points} điểm`);
  });
  
  console.log(`\n📘 Medium Points (5-9): ${grouped.medium.length} events`);
  grouped.medium.forEach(e => {
    console.log(`   - ${e.title}: ${e.points} điểm`);
  });
  
  console.log(`\n📗 Low Points (<5): ${grouped.low.length} events`);
  grouped.low.forEach(e => {
    console.log(`   - ${e.title}: ${e.points} điểm`);
  });
  
  console.log('\n' + '='.repeat(60));
};

/**
 * Main function
 */
const main = async () => {
  console.log('🚀 Adding Points to Events...\n');
  console.log('=' .repeat(60));
  
  await connectDB();
  
  await updateAllEvents();
  await updateSpecificEvents();
  await displaySummary();
  
  console.log('\n✅ Completed!\n');
  
  await mongoose.connection.close();
  console.log('🔒 Database connection closed');
  process.exit(0);
};

// Run
main().catch((error) => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
