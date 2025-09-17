LifeStream - Blood Donation Alert System 🩸
LifeStream is a real-time, web-based blood donation alert system designed to bridge the gap between blood donors and hospitals in emergency situations. It allows potential donors in Pune to register their details and enables authorized hospital staff to send instant SMS alerts to matching donors in a specific area when there's an urgent need for blood.

✨ Key Features
👥 Dual-Mode Interface: Separate, user-friendly tabs for Donor Registration and Hospital Alerts.

🔒 Secure Hospital Access: The emergency alert form is password-protected to prevent misuse and ensure only authorized personnel can send requests.

🎯 Targeted Alerts: Hospitals can filter donors by blood group and specific areas within Pune to notify the most relevant people.

🚀 Instant SMS Notifications: Integrates with the Twilio API to send immediate, life-saving SMS alerts directly to registered donors' phones.

📱 Responsive Design: A clean, modern, and fully responsive UI that works seamlessly on desktops, tablets, and mobile devices.

🌐 Interactive UI: Features an engaging animated background using particles.js for a dynamic user experience.

📞 Smart Phone Field: The donor registration form automatically formats Indian phone numbers and ensures a valid +91 prefix.

🛠️ Tech Stack & Services
Frontend:

HTML5

CSS3 (with custom properties)

JavaScript (ES6+)

Font Awesome (for icons)

particles.js (for background animation)

Backend:

Node.js

Express.js

Database:

MongoDB (with Mongoose ODM)

API Services:

Twilio API (for sending SMS notifications)

🚀 Getting Started
Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

Prerequisites
You will need the following software and services installed/configured:

Node.js & npm: Download Node.js (npm is included)

MongoDB Atlas: A free cloud database account from MongoDB Atlas

Twilio Account: A free or upgraded account from Twilio to get API credentials and a phone number.

Installation & Setup
Clone the repository:

Bash

git clone https://github.com/your-username/lifestream-blood-alert.git
cd lifestream-blood-alert
Install backend dependencies:
Navigate to the backend/src directory and install the required npm packages.

Bash

npm install
Set up Environment Variables:
Create a .env file in the root backend directory (src). This file will store all your secret keys and credentials. Copy the contents of .env.example (if provided) or use the template below.

Ini, TOML

# MongoDB Connection String
MONGODB_URI="your_mongodb_connection_string_here"

# Twilio Credentials
TWILIO_ACCOUNT_SID="your_twilio_account_sid"
TWILIO_AUTH_TOKEN="your_twilio_auth_token"
TWILIO_PHONE_NUMBER="your_twilio_phone_number"

# Hospital Alert Security
HOSPITAL_ALERT_PASSWORD="YourSecretPassword123!"
Run the Server:
Once the variables are set, you can start the backend server.

Bash

npm start
The server will be running on http://localhost:3000 (or the port specified in your configuration).

Access the Application:
Open your web browser and navigate to http://localhost:3000.

⚙️ API Endpoints
The application exposes the following REST API endpoints:

Method	Endpoint	Description
POST	/api/register-donor	Registers a new blood donor in the database.
POST	/api/send-alert	Verifies password and sends SMS alerts to donors.
GET	/api/donors	Retrieves a list of all registered donors.
DELETE	/api/donor/:phone	Deletes a donor from the database by phone number.
GET	/api/health	A health check endpoint to verify server status.

Export to Sheets
🤝 Contributing
Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are greatly appreciated.

Fork the Project

Create your Feature Branch (git checkout -b feature/AmazingFeature)

Commit your Changes (git commit -m 'Add some AmazingFeature')

Push to the Branch (git push origin feature/AmazingFeature)

Open a Pull Request

