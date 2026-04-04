const express = require('express');
const router = express.Router();

const { mongoose } = require('../config/db');

// RENDER FORM
router.get('/', (req, res) => {
    res.render('registration', { currentPage: '/' })
});


// RECIEVE DATA
router.post('/register', async (req, res) => {
    try {
        const registrationData = req.body;

        // Insert to MongoDB
        const collection = mongoose.connection.db.collection('registration-data');
        const result = await collection.insertOne({
            ...registrationData,
            submittedAt: new Date()
        });
        res.status(200).json({ status: result.acknowledged, message: "Registered Sucessfully" });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }

})

module.exports = router;