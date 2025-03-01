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

// Function to calculate pricing
function calculatePricing(homeType, cleaningType, squareFeet, bedrooms, bathrooms) {
    let totalPrice = 0;

    // Pricing logic for House, Apartment, Townhouse
    if (homeType === 'House' || homeType === 'Apartment' || homeType === 'Townhouse') {
        totalPrice = bedrooms * 100; // $100 per bedroom
        totalPrice += bathrooms * 20; // $20 per bathroom
    }
    // Pricing logic for Office, Condo
    else if (homeType === 'Office' || homeType === 'Condo') {
        totalPrice = squareFeet * 0.40; // $0.40 per square foot
    }

    // Add 15% for Deep Cleaning
    if (cleaningType === 'Deep Cleaning') {
        totalPrice *= 1.15;
    }

    // Add 13% tax
    const priceAfterTax = totalPrice * 1.13;

    return {
        totalPrice: totalPrice.toFixed(2),
        priceAfterTax: priceAfterTax.toFixed(2),
    };
}

app.post('/submit-contact', (req, res) => {
    const { name, email, message } = req.body;

    // Validate required fields
    if (!name || !email || !message) {
        return res.status(400).json({ error: "All fields are required." });
    }

    console.log("Contact form submission received:", req.body);

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_USER,
        subject: 'New Contact Form Submission',
        text: `
        Name: ${name}
        Email: ${email}
        Message: ${message}
        `,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
            return res.status(500).json({ error: "Error submitting contact form. Please try again later." });
        } else {
            console.log('Email sent successfully:', info.response);
            return res.status(200).json({ message: "Message sent successfully!" });
        }
    });
});

app.post('/submit-booking', (req, res) => {
    const {
        name, email, service, date,
        homeType, cleaningType, squareFeet, bedrooms, bathrooms, halfBathrooms,
        floorType, cleaningLevels, frequency, howOften, dust,
        additionalServices, hearAbout, comments, city, province, postalCode
    } = req.body;

    // Split additionalServices into an array
    const additionalServicesList = additionalServices ? additionalServices.split(',') : [];

    // Update required fields
    const requiredFields = [
        'name', 'email', 'service', 'date',
        'homeType', 'cleaningType', 'squareFeet', 'bedrooms',
        'floorType', 'cleaningLevels',
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

    // Calculate pricing
    const { totalPrice, priceAfterTax } = calculatePricing(homeType, cleaningType, squareFeet, bedrooms, bathrooms || 0);

    console.log("Valid booking request received:", req.body);

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_USER,
        subject: 'New Booking Request',
        text: `
        Name: ${name}
        Email: ${email}
        Service: ${service}
        Preferred Date: ${date}
        Home Type: ${homeType}
        Cleaning Type: ${cleaningType}
        Square Feet: ${squareFeet}
        Bedrooms: ${bedrooms}
        Bathrooms: ${bathrooms || 'Not specified'}
        Half Bathrooms: ${halfBathrooms || 'Not specified'}
        Floor Type: ${floorType}
        Cleaning Levels: ${cleaningLevels}
        Frequency: ${frequency}
        How Often: ${howOften || 'Not specified'}
        Dust Level: ${dust}
        Additional Services: ${additionalServicesList.join(', ') || 'None'}
        How Did You Hear About Us: ${hearAbout || 'Not specified'}
        Comments & Questions: ${comments || 'None'}
        City: ${city}
        Province: ${province}
        Postal Code: ${postalCode}
        Price Before Tax: $${totalPrice}
        Price After Tax (13%): $${priceAfterTax}
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