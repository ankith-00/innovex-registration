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
        const TeamMembers = registrationData.members || registrationData['members[]'];

        const data = {
            eventName: registrationData.eventName,
            collegeName: registrationData.collegeName,
            teamName: registrationData.teamName,
            email: registrationData.email,
            phoneNo: registrationData.phoneNo,
            registrationFee: registrationData.registrationFee,
            utrNo: registrationData.utrNo,
            members: Array.isArray(TeamMembers) ? TeamMembers : [TeamMembers],
            submittedAt: new Date()
        };

        await mongoose.connection.asPromise();
        const collection = mongoose.connection.db.collection('registration-data');
        const result = await collection.insertOne(data);

        res.status(200).json({
            status: result.acknowledged,
            message: "Registered Successfully"
        });
    } catch (error) {
        console.error("Registration Error:", error);
        res.status(500).json({ message: "Server Error", error: error.message, stack: error.stack });
    }
});

module.exports = router;