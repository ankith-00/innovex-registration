const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const router = express.Router();
const authenticateToken = require('../middlewares/auth');

const { mongoose } = require('../config/db')

// RENDER FORM
router.get('/', (req, res) => {
    res.render('volunteerLogin', { currentPage: '/login' })

});


// LOGIN HANDLER
router.post('/', async (req, res) => {
    try {
        const { uid, password } = req.body;

        const collection = mongoose.connection.db.collection('volunteers');
        const volunteer = await collection.findOne({ uid });

        if (!volunteer) {
            return res.status(401).json({ success: false, message: "Invalid Credentials" });
        }

        const isMatch = await bcrypt.compare(password, volunteer.password);

        if (isMatch) {
            const payload = { id: volunteer._id, uid: volunteer.uid };
            const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

            res.status(200).json({
                success: true,
                message: "Login Successful",
                token: accessToken
            });
        } else {
            res.status(401).json({ success: false, message: "Invalid Credentials" });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
});


// Protected Routes
router.get('/dashboard', authenticateToken, (req, res) => {
    res.json({ message: `Welcome to the dashboard, ${req.user.uid}` });
});

module.exports = router;