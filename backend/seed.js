require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const connectDB = require('./config/db');

const seedUsers = async () => {
  try {
    await connectDB();

    // Clear existing users
    await User.deleteMany();

    const createdUsers = await User.insertMany([
      {
        name: 'Test User',
        email: 'test@example.com'
      }
    ]);

    console.log('User Seeded Successfully!');
    console.log('Use this User ID in your frontend: ', createdUsers[0]._id.toString());
    process.exit();
  } catch (error) {
    console.error('Error with data import', error);
    process.exit(1);
  }
};

seedUsers();
