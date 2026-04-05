const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express()


// VARIABLES
const PORT = process.env.PORT || 3000


const { checkDbConnection } = require('./config/db');
const registrationRoute = require('./routes/registration')
const volunteerRoutes = require('./routes/volunteer');

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Routes
app.use('/login', volunteerRoutes);
app.use('/', registrationRoute);


app.listen(PORT, () => {
    console.log(`[🟢] SERVER RUNNING ON : http://localhost:${PORT}`);
    checkDbConnection()
})