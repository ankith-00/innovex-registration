const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const router = express.Router();
const authenticateToken = require('../middlewares/auth');

const { mongoose } = require('../config/db');

// RENDER LOGIN FORM
router.get('/', (req, res) => {
    res.render('volunteerLogin', { currentPage: '/login' });
});


// LOGIN HANDLER
router.post('/', async (req, res) => {
    try {
        const { uid, password } = req.body;

        const collection = mongoose.connection.db.collection('volunteers');
        const user = await collection.findOne({ uid: uid });

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        // Encode uid + event in JWT (event === 'admin' means full access)
        const payload = {
            uid: user.uid,
            event: user.event
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });

        return res.status(200).json({
            success: true,
            message: "Logged in successfully",
            token: token,
            event: user.event
        });

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
});


// DASHBOARD — only protected route, server-side renders all data
router.get('/dashboard', authenticateToken, async (req, res) => {
    try {
        const { uid, event } = req.user;
        const isAdmin = event === 'admin';

        const collection = mongoose.connection.db.collection('registration-data');

        let registrations;
        if (isAdmin) {
            // Admin: all registrations, newest first
            registrations = await collection.find({}).sort({ submittedAt: -1 }).toArray();
        } else {
            // Volunteer: only their assigned event, newest first
            registrations = await collection.find({ eventName: event }).sort({ submittedAt: -1 }).toArray();
        }

        // Unique event names for admin filter dropdown
        const allEvents = isAdmin
            ? [...new Set(registrations.map(r => r.eventName).filter(Boolean))].sort()
            : [event];

        return res.render('dashboard', {
            uid,
            event,
            isAdmin,
            registrations: JSON.stringify(registrations),
            allEvents: JSON.stringify(allEvents),
            totalCount: registrations.length
        });

    } catch (error) {
        console.error("Dashboard Error:", error);
        res.status(500).send("Server Error");
    }
});

// STATUS UPDATE — mark a registration present or absent (protected)
router.patch('/dashboard/status/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'present' or 'absent'

        if (!['present', 'absent'].includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status value" });
        }

        const { ObjectId } = require('mongodb');
        const collection = mongoose.connection.db.collection('registration-data');

        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { attendance: status, attendanceUpdatedAt: new Date() } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ success: false, message: "Registration not found" });
        }

        return res.status(200).json({ success: true, status });

    } catch (error) {
        console.error("Status Update Error:", error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
});


module.exports = router;