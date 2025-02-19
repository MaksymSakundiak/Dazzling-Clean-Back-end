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
    const {
        name, email, service, date,
        homeType, cleaningType, squareFeet, bedrooms, bathrooms, halfBathrooms,
        people, pets, floorType, cleaningLevels, frequency, howOften, dust,
        additionalServices, hearAbout, comments, city, province, postalCode
    } = req.body;

    // Validate required fields
    const requiredFields = [
        'name', 'email', 'service', 'date',
        'homeType', 'cleaningType', 'squareFeet', 'bedrooms', 'bathrooms',
        'halfBathrooms', 'people', 'pets', 'floorType', 'cleaningLevels',
        'city', 'province', 'postalCode'
    ];

    for (const field of requiredFields) {
        if (!req.body[field]) {
            return res.status(400).json({ error: `All fields are required. Missing: ${field}` });
        }
    }

    // Backend validation: Ensure the date is today or later
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize time to avoid timezone issues

    if (selectedDate < today) {
        return res.status(400).json({ error: "You cannot select a past date." });
    }

    console.log("Valid booking request received:", req.body);

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_USER,
        subject: 'New Booking Request',
        html: `
        <h1>New Booking Request</h1>
        <table>
            <tr><th>Field</th><th>Value</th></tr>
            <tr><td>Name</td><td>${name}</td></tr>
            <tr><td>Email</td><td>${email}</td></tr>
            <tr><td>Service</td><td>${service}</td></tr>
            <tr><td>Preferred Date</td><td>${date}</td></tr>
            <tr><td>Home Type</td><td>${homeType}</td></tr>
            <tr><td>Cleaning Type</td><td>${cleaningType}</td></tr>
            <tr><td>Square Feet</td><td>${squareFeet}</td></tr>
            <tr><td>Bedrooms</td><td>${bedrooms}</td></tr>
            <tr><td>Bathrooms</td><td>${bathrooms}</td></tr>
            <tr><td>Half Bathrooms</td><td>${halfBathrooms}</td></tr>
            <tr><td>Number of People</td><td>${people}</td></tr>
            <tr><td>Number of Pets</td><td>${pets}</td></tr>
            <tr><td>Floor Type</td><td>${floorType}</td></tr>
            <tr><td>Cleaning Levels</td><td>${cleaningLevels}</td></tr>
            <tr><td>Frequency</td><td>${frequency}</td></tr>
            <tr><td>How Often</td><td>${howOften}</td></tr>
            <tr><td>Dust Level</td><td>${dust}</td></tr>
            <tr><td>Additional Services</td><td>${additionalServices || 'None'}</td></tr>
            <tr><td>How Did You Hear About Us</td><td>${hearAbout}</td></tr>
            <tr><td>Comments & Questions</td><td>${comments || 'None'}</td></tr>
            <tr><td>City</td><td>${city}</td></tr>
            <tr><td>Province</td><td>${province}</td></tr>
            <tr><td>Postal Code</td><td>${postalCode}</td></tr>
        </table>
        `,
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