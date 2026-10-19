const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express()


// VARIABLES
const PORT = process.env.PORT || 3000


const { checkDbConnection } = require('./config/db');
const registrationRoute = require('./routes/registration')
const volunteerRoutes = require('./routes/volunteer');
const certificateRoutes = require('./routes/certificate');

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use('/public', express.static(path.join(__dirname, 'public/website')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Routes
app.use('/login', volunteerRoutes);
app.use('/certificate', certificateRoutes);
app.use('/registration', registrationRoute);

// Website — served on /
app.get('/style.css', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/website/style.css'));
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/website/index.html'));
});


app.listen(PORT, () => {
    console.log(`[🟢] SERVER RUNNING ON : http://localhost:${PORT}`);
    checkDbConnection()
})