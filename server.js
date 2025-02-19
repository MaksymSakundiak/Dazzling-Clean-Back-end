require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5009;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
}));

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

app.post('/submit-booking', (req, res) => {

    const {
        fullName, email, service, date,
        homeType, cleaningType, squareFeet, bedrooms, bathrooms, halfBathrooms,
        people, pets, floorType, cleaningLevels, frequency, howOften, dust,
        additionalServices, hearAbout, comments, city, province, postalCode
    } = req.body;

    const requiredFields = [
        'fullName', 'email', 'service', 'date',
        'homeType', 'cleaningType', 'squareFeet', 'bedrooms', 'bathrooms',
        'halfBathrooms', 'people', 'pets', 'floorType', 'cleaningLevels',
        'city', 'province', 'postalCode'
    ];

    for (const field of requiredFields) {
        if (!req.body[field]) {
            return res.status(400).json({ error: `All fields are required. Missing: ${field}` });
        }
    }

    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
        return res.status(400).json({ error: "You cannot select a past date." });
    }


    console.log("Valid booking request received:", req.body);

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_USER,
        subject: 'New Booking Request',
        text: `
        Full Name: ${fullName}
        Email: ${email}
        Service: ${service}
        Preferred Date: ${date}
        Home Type: ${homeType}
        Cleaning Type: ${cleaningType}
        Square Feet: ${squareFeet}
        Bedrooms: ${bedrooms}
        Bathrooms: ${bathrooms}
        Half Bathrooms: ${halfBathrooms}
        Number of People: ${people}
        Number of Pets: ${pets}
        Floor Type: ${floorType}
        Cleaning Levels: ${cleaningLevels}
        Frequency: ${frequency}
        How Often: ${howOften}
        Dust Level: ${dust}
        Additional Services: ${additionalServices || 'None'}
        How Did You Hear About Us: ${hearAbout}
        Comments & Questions: ${comments || 'None'}
        City: ${city}
        Province: ${province}
        Postal Code: ${postalCode}
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

app.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
});