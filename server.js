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
function calculatePricing(serviceType, homeType, cleaningType, squareFeet, bedrooms, bathrooms, additionalServices) {
    let totalPrice = 0;

    // Pricing logic for Residential and Move-In/Move-Out Cleaning
    if (serviceType === 'Residential Cleaning' || serviceType === 'Move-In/Move-Out Cleaning') {
        if (homeType === 'House' || homeType === 'Apartment' || homeType === 'Townhouse') {
            totalPrice = bedrooms * 90; // $90 per bedroom
            totalPrice += (bathrooms || 0) * 10; // $20 per bathroom
        }
    }
    // Pricing logic for Commercial Cleaning
    else if (serviceType === 'Commercial Cleaning') {
        if (homeType === 'Office' || homeType === 'Condo') {
            totalPrice = squareFeet * 0.30; // $0.30 per square foot
        }
    }
    // Pricing logic for Post-Construction Cleaning
    else if (serviceType === 'Post-Construction Cleaning') {
        if (homeType === 'House' || homeType === 'Townhouse' || homeType === 'Apartment' || homeType === 'Condo' || homeType === 'Office') {
            totalPrice = squareFeet * 0.30; // $0.30 per square foot
        }
    }

    // Add 15% for Deep Cleaning
    if (cleaningType === 'Deep Cleaning') {
        totalPrice *= 1.15;
    }

    // Add pricing for additional services
    if (additionalServices) {
        const services = additionalServices.split(',');
        services.forEach(service => {
            if (service === 'Oven inside' || service === 'Refrigerator inside') {
                totalPrice += 20; // $20 for each additional service
            }
        });
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
        name, email, serviceType, date,
        homeType, cleaningType, squareFeet, bedrooms, bathrooms,
        floorType, frequency, howOften, dust,
        additionalServices, hearAbout, comments, city, province, postalCode
    } = req.body;

    // Split additionalServices into an array
    const additionalServicesList = additionalServices ? additionalServices.split(',') : [];

    // Define required fields based on service type
    let requiredFields = ['name', 'email', 'serviceType', 'date', 'homeType', 'cleaningType', 'floorType', 'city', 'province', 'postalCode'];

    if (serviceType === 'Residential Cleaning' || serviceType === 'Move-In/Move-Out Cleaning') {
        requiredFields.push('bedrooms', 'bathrooms');
    } else if (serviceType === 'Commercial Cleaning' || serviceType === 'Post-Construction Cleaning') {
        requiredFields.push('squareFeet');
    }

    // Validate required fields
    for (const field of requiredFields) {
        if (!req.body[field]) {
            return res.status(400).json({ error: `All fields are required. Missing: ${field}` });
        }
    }

    // Validate date
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
        return res.status(400).json({ error: "You cannot select a past date." });
    }

    // Calculate pricing
    const { totalPrice, priceAfterTax } = calculatePricing(serviceType, homeType, cleaningType, squareFeet, bedrooms, bathrooms || 0, additionalServices);

    console.log("Valid booking request received:", req.body);

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_USER,
        subject: 'New Booking Request',
        text: `
        Name: ${name}
        Email: ${email}
        Service: ${serviceType}
        Preferred Date: ${date}
        Home Type: ${homeType}
        Cleaning Type: ${cleaningType}
        Square Feet: ${squareFeet || 'Not specified'}
        Bedrooms: ${bedrooms || 'Not specified'}
        Bathrooms: ${bathrooms || 'Not specified'}
        Floor Type: ${floorType}
        Frequency: ${frequency || 'Not specified'}
        How Often: ${howOften || 'Not specified'}
        Dust Level: ${dust || 'Not specified'}
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