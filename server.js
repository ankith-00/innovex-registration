const express = require('express');
const path = require('path');


const app = express()


// VARIABLES
const PORT = 3000 || env.PORT


const { checkDbConnection } = require('./config/db');
const registrationRoute = require('./routes/registration')


app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Registration
app.use('/', registrationRoute);




app.listen(PORT, () => {
    console.log(`[🟢] SERVER RUNNING ON : http://localhost:${PORT}`);
    checkDbConnection()
})