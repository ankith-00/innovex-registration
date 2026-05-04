const nodemailer = require("nodemailer");
require('dotenv').config();

const user = process.env.GMAIL_USER;
const pass = process.env.GMAIL_APP_PASSWORD;

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: user,
        pass: pass,
    }
});

async function sendMail(to, name) {
    console.log(to);

    try {
        const info = await transporter.sendMail({
            from: user,
            to: to,
            subject: 'Welcome to Innovex 2.0',
            text: `Dear ${name},\n\nGreetings!\n\nWe are delighted to confirm your participation in Innovex 2.0, the second edition of our inter-college tech fest. On behalf of the organizing team, we warmly welcome you and are excited to have you join us for this dynamic and innovative event.\n\nInnovex 2.0 aims to bring together talented students from various institutions to showcase creativity, technical skills, and collaboration. We are confident that your participation will add great value to the event and make it even more engaging.\n\n\nWe look forward to your participation and wish you a fantastic experience at Innovex 2.0.\n\nRegards,\nAnkith Kumar\nwww.ankith.dev\n`
        });
        console.log('Test Mail Sent To:', to, '| Message ID:', info.messageId);
    } catch (error) {
        console.error('Error While Sending Test Mail:', error);
    }
}

module.exports = sendMail;