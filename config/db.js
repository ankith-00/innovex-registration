require('dotenv').config();
const mongoose = require('mongoose');

const mongoURI = process.env.MONGO_URI;

async function checkDbConnection() {
    try {
        await mongoose.connect(mongoURI);
        console.log('[🟢] MongoDB Connected');
    } catch (error) {
        console.error("[🔴] DB not connected.");
        console.log(error.message);
    }
}

module.exports = { mongoose, checkDbConnection };