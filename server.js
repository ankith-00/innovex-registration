const express = require('express');
const path = require('path');

const app = express()


app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));



app.get('/', (req, res) => {
    res.render('login', { currentPage: '/' })
})

app.get('/register', (req, res) => {
    res.render('register', { currentPage: '/register' })
})





app.listen(3000, () => {
    console.log('SERVER RUNNING . . . ')
})