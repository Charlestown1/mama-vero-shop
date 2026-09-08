/**
 * Run with: npm run create-admin
 *
 * Creates (or promotes) the first admin account using ADMIN_EMAIL,
 * ADMIN_PASSWORD, and ADMIN_NAME from your .env file. This is the ONLY
 * way to create an admin - regular signup always forces role: 'customer'.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');

async function run() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || 'Admin';

  if (!email || !password) {
    console.error('Please set ADMIN_EMAIL and ADMIN_PASSWORD in your .env file first.');
    process.exit(1);
  }

  await connectDB();

  let user = await User.findOne({ email: email.toLowerCase() });

  if (user) {
    user.role = 'admin';
    await user.save();
    console.log(`Existing user ${email} has been promoted to admin.`);
  } else {
    user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: 'admin',
    });
    console.log(`Admin account created for ${email}.`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
