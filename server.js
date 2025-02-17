require('dotenv').config(); // Load .env variables

const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5009;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

// Email configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'makssakundak2008@@gmail.com',
        pass: 'ylil uicd dpml diql', // Use the app password, NOT your Gmail password
    },
});

// Booking form submission endpoint
app.post('/submit-booking', (req, res) => {
    const { name, email, service, date } = req.body;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_USER,
        subject: 'New Booking Request',
        text: `Name: ${name}\nEmail: ${email}\nService: ${service}\nPreferred Date: ${date}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
            res.status(500).send('Error submitting booking.');
        } else {
            console.log('Email sent:', info.response);
            res.status(200).send('Booking submitted successfully!');
        }
    });
});


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
