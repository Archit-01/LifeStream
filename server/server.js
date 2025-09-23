const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const twilio = require('twilio');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../public')));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB Atlas'))
.catch(err => {
    console.error('MongoDB connection error:', err);
    // Exit the application if the database connection fails
    process.exit(1); 
});

// User schema
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    area: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    bloodGroup: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Blood Bank schema
const bloodBankSchema = new mongoose.Schema({
    name: { type: String, required: true },
    address: { type: String, required: true },
    phone: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    area: { type: String, required: true }
});

const BloodBank = mongoose.model('BloodBank', bloodBankSchema);

// Twilio client
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Serve main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Routes
app.post('/api/register-donor', async (req, res) => {
    try {
        const { name, area, phone, bloodGroup } = req.body;
        
        // Validate input
        if (!name || !area || !phone || !bloodGroup) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        
        // Validate phone number format (Indian numbers: +91 followed by 10 digits)
        const phoneRegex = /^\+91\d{10}$/;
        if (!phoneRegex.test(phone)) {
            return res.status(400).json({ message: 'Please enter a valid 10-digit Indian phone number (e.g., +919322659210)' });
        }
        
        // Check if phone number already exists
        const existingUser = await User.findOne({ phone });
        if (existingUser) {
            return res.status(400).json({ message: 'Phone number already registered' });
        }
        
        // Create new user
        const newUser = new User({ name, area, phone, bloodGroup });
        await newUser.save();
        
        res.status(201).json({ message: 'Donor registered successfully' });
    } catch (error) {
        console.error('Registration error:', error);
        
        // Handle duplicate key error (if phone number already exists)
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Phone number already registered' });
        }
        
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/api/send-alert', async (req, res) => {
    try {
        const { hospitalName, area, bloodGroup, additionalInfo, password } = req.body;
        
        // Password validation
        if (!password || password !== process.env.HOSPITAL_ALERT_PASSWORD) {
            return res.status(401).json({ message: 'Invalid password. You are not authorized to send alerts.' });
        }
        
        // Validate other inputs
        if (!hospitalName || !area || !bloodGroup) {
            return res.status(400).json({ message: 'Hospital name, area, and blood group are required' });
        }
        
        // Find donors in the area with matching blood group
        let query = { area };
        if (bloodGroup !== 'Any') {
            query.bloodGroup = bloodGroup;
        }
        if (area === 'All') {
            delete query.area;
        }
        
        const donors = await User.find(query);
        
        if (donors.length === 0) {
            const specificAreaMessage = area === 'All' ? 'in any area' : `in the ${area} area`;
            return res.status(404).json({ message: `No donors found with the required blood group ${specificAreaMessage}.` });
        }
        
        // Send SMS to each donor
        const message = `URGENT: Blood needed at ${hospitalName} in ${area}. Blood type: ${bloodGroup}. ${additionalInfo || ''} Please help if you can.`;
        
        let successfulSends = 0;
        let failedSends = 0;
        const failedNumbers = [];
        
        for (const donor of donors) {
            try {
                await twilioClient.messages.create({
                    body: message,
                    from: process.env.TWILIO_PHONE_NUMBER,
                    to: donor.phone
                });
                console.log(`Message sent to ${donor.phone}`);
                successfulSends++;
            } catch (twilioError) {
                console.error(`Failed to send message to ${donor.phone}:`, twilioError.message);
                failedSends++;
                failedNumbers.push(donor.phone);
                
                if (twilioError.code === 21211) {
                    console.log(`Removing invalid number from database: ${donor.phone}`);
                    await User.deleteOne({ phone: donor.phone });
                }
            }
        }
        
        res.json({ 
            message: `Alert sent to ${successfulSends} donor(s). ${failedSends > 0 ? `${failedSends} failed.` : ''}`, 
            successfulSends,
            failedSends,
            failedNumbers: failedSends > 0 ? failedNumbers : undefined
        });
    } catch (error) {
        console.error('Alert error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Additional API routes for management
app.get('/api/donors', async (req, res) => {
    try {
        const { area, bloodGroup } = req.query;
        let query = {};
        
        if (area && area !== 'All') query.area = area;
        if (bloodGroup && bloodGroup !== 'Any') query.bloodGroup = bloodGroup;
        
        const donors = await User.find(query).sort({ createdAt: -1 });
        res.json(donors);
    } catch (error) {
        console.error('Get donors error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.get('/api/bloodbanks', async (req, res) => {
    try {
        const { area } = req.query;
        let query = {};
        
        if (area && area !== 'All') query.area = area;
        
        const bloodBanks = await BloodBank.find(query);
        res.json(bloodBanks);
    } catch (error) {
        console.error('Get blood banks error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/api/bloodbanks', async (req, res) => {
    try {
        // This endpoint would typically be protected in a real application
        const { name, address, phone, lat, lng, area } = req.body;
        
        // Validate input
        if (!name || !address || !phone || !lat || !lng || !area) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        
        // Check if blood bank already exists
        const existingBank = await BloodBank.findOne({ name, address });
        if (existingBank) {
            return res.status(400).json({ message: 'Blood bank already exists' });
        }
        
        // Create new blood bank
        const newBloodBank = new BloodBank({ name, address, phone, lat, lng, area });
        await newBloodBank.save();
        
        res.status(201).json({ message: 'Blood bank added successfully' });
    } catch (error) {
        console.error('Add blood bank error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.delete('/api/donor/:phone', async (req, res) => {
    try {
        const { phone } = req.params;
        await User.deleteOne({ phone });
        res.json({ message: 'Donor deleted successfully' });
    } catch (error) {
        console.error('Delete donor error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
    });
});

// Initialize sample blood banks if the collection is empty
async function initializeBloodBanks() {
    try {
        const count = await BloodBank.countDocuments();
        if (count === 0) {
            console.log('Initializing sample blood banks...');
            
            const sampleBloodBanks = [
                {
                    name: "Ruby Hall Clinic Blood Bank",
                    address: "40, Sassoon Road, Pune, Maharashtra 411001",
                    phone: "+91-20-26122101",
                    lat: 18.5204,
                    lng: 73.8567,
                    area: "Shivajinagar"
                },
                {
                    name: "KEM Hospital Blood Bank",
                    address: "489, Rasta Peth, Sardar Moodliar Road, Pune, Maharashtra 411011",
                    phone: "+91-20-26122101",
                    lat: 18.5158,
                    lng: 73.8550,
                    area: "Shivajinagar"
                },
                {
                    name: "Sahyadri Hospital Blood Bank",
                    address: "Kothrud, Pune, Maharashtra 411038",
                    phone: "+91-20-67222222",
                    lat: 18.5081,
                    lng: 73.8165,
                    area: "Kothrud"
                },
                {
                    name: "Jehangir Hospital Blood Bank",
                    address: "32, Sasoon Road, Pune, Maharashtra 411001",
                    phone: "+91-20-66819999",
                    lat: 18.5236,
                    lng: 73.8478,
                    area: "Shivajinagar"
                },
                {
                    name: "Sanjeevan Hospital Blood Bank",
                    address: "2, Panchavati, Off Karve Road, Pune, Maharashtra 411037",
                    phone: "+91-20-25447777",
                    lat: 18.5154,
                    lng: 73.8298,
                    area: "Kothrud"
                },
                {
                    name: "Aditya Birla Memorial Hospital Blood Bank",
                    address: "Aditya Birla Hospital Marg, Thergaon, Pimpri-Chinchwad, Maharashtra 411033",
                    phone: "+91-20-30717100",
                    lat: 18.6279,
                    lng: 73.7997,
                    area: "Pimpri"
                },
                {
                    name: "Deenanath Mangeshkar Hospital Blood Bank",
                    address: "Erandwane, Pune, Maharashtra 411004",
                    phone: "+91-20-40151515",
                    lat: 18.5150,
                    lng: 73.8290,
                    area: "Kothrud"
                },
                {
                    name: "Sassoon General Hospital Blood Bank",
                    address: "Sassoon Road, Pune, Maharashtra 411001",
                    phone: "+91-20-26122101",
                    lat: 18.5236,
                    lng: 73.8478,
                    area: "Shivajinagar"
                }
            ];
            
            await BloodBank.insertMany(sampleBloodBanks);
            console.log('Sample blood banks initialized successfully');
        }
    } catch (error) {
        console.error('Error initializing blood banks:', error);
    }
}

// Start server
app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT} to access the application`);
    await initializeBloodBanks();
});
