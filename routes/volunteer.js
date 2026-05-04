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

        await mongoose.connection.asPromise();
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
        res.status(500).json({ success: false, message: "Server Error", error: error.message, stack: error.stack });
    }
});


// DASHBOARD — only protected route, server-side renders all data
router.get('/dashboard', authenticateToken, async (req, res) => {
    try {
        const { uid, event } = req.user;
        const isAdmin = event === 'admin';

        await mongoose.connection.asPromise();
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

        // Normalise _id to plain string so the client receives a consistent hex string
        const serialisable = registrations.map(r => ({ ...r, _id: r._id.toString() }));

        return res.render('dashboard', {
            uid,
            event,
            isAdmin,
            registrations: JSON.stringify(serialisable),
            allEvents: JSON.stringify(allEvents),
            totalCount: registrations.length
        });

    } catch (error) {
        console.error("Dashboard Error:", error);
        res.status(500).send(`Server Error: ${error.message} <br><br> ${error.stack}`);
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
        await mongoose.connection.asPromise();
        const collection = mongoose.connection.db.collection('registration-data');

        const reg = await collection.findOne({ _id: new ObjectId(id) });
        if (!reg) {
            return res.status(404).json({ success: false, message: "Registration not found" });
        }
        
        const wasPresent = reg.attendance === 'present';

        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { attendance: status, attendanceUpdatedAt: new Date() } }
        );

        if (status === 'present' && !wasPresent) {
            const sendMail = require('../utils/mailer');
            const emailToSend = reg.email;
            const nameToSend = reg.teamName || reg.eventName || 'User';
            if (emailToSend) {
                sendMail(emailToSend, nameToSend);
            }
        }

        return res.status(200).json({ success: true, status });

    } catch (error) {
        console.error("Status Update Error:", error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message, stack: error.stack });
    }
});


// UPDATE REGISTRATION INFO — admin can edit all fields (protected)
router.patch('/dashboard/update/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { uid, event } = req.user;
        const isAdmin = event === 'admin';

        // Only admin can use this endpoint
        if (!isAdmin) {
            return res.status(403).json({ success: false, message: 'Forbidden: Admin only' });
        }

        const allowedFields = ['teamName', 'eventName', 'collegeName', 'email', 'phoneNo', 'utrNo', 'attendance', 'members'];
        const updateFields = {};

        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                updateFields[field] = req.body[field];
            }
        });

        if (updateFields.attendance && !['present', 'absent', 'verified', ''].includes(updateFields.attendance)) {
            return res.status(400).json({ success: false, message: 'Invalid attendance value' });
        }

        if (Object.keys(updateFields).length === 0) {
            return res.status(400).json({ success: false, message: 'No valid fields to update' });
        }

        updateFields.lastEditedAt = new Date();
        updateFields.lastEditedBy = uid;

        const { ObjectId } = require('mongodb');
        await mongoose.connection.asPromise();
        const collection = mongoose.connection.db.collection('registration-data');

        const reg = await collection.findOne({ _id: new ObjectId(id) });
        if (!reg) {
            return res.status(404).json({ success: false, message: 'Registration not found' });
        }
        
        const wasPresent = reg.attendance === 'present';

        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updateFields }
        );

        if (updateFields.attendance === 'present' && !wasPresent) {
            const sendMail = require('../utils/mailer');
            const emailToSend = updateFields.email || reg.email;
            const nameToSend = updateFields.teamName || reg.teamName || 'User';
            if (emailToSend) {
                sendMail(emailToSend, nameToSend);
            }
        }

        return res.status(200).json({ success: true, updated: updateFields });

    } catch (error) {
        console.error('Update Registration Error:', error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
});


module.exports = router;