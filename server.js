require('dotenv').config(); // Load environment variables

const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5009;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors({
    origin: '*', // Change to your frontend URL if needed
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
}));

// Email configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // Using .env variables correctly
        pass: process.env.EMAIL_PASS, // Secure app password
    },
});

// Booking form submission endpoint
app.post('/submit-booking', (req, res) => {
    const { name, email, service, date } = req.body;

    // Validate request data
    if (!name || !email || !service || !date) {
        return res.status(400).json({ error: "All fields are required." });
    }

    console.log("Received booking request:", req.body); // Debugging log

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_USER,
        subject: 'New Booking Request',
        text: `Name: ${name}\nEmail: ${email}\nService: ${service}\nPreferred Date: ${date}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
            return res.status(500).json({ error: "Error submitting booking. Please try again later." });
        } else {
            console.log('Email sent successfully:', info.response);
            return res.status(200).json({ message: "Booking submitted successfully!" });
        }
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
});
