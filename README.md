DrobeBy 🛍️📱

Rent. Sell. Discover.

A community-based, peer-to-peer marketplace for renting and selling items, built with React Native and Node.js.

✨ Key Features

User Authentication: Secure user registration and login using JWT (JSON Web Tokens).

Item Listings: Users can list items for rent or sale, including details like name, description, category, price, and multiple photos.

Community-Based Filtering: Discover items exclusively from users within your college or local community.

Real-Time Chat: Instantly communicate with other users to ask questions or coordinate transactions using a WebSocket-powered chat built with Socket.IO.

Rental & Sales System: A full-fledged system to request rentals or purchases, which the owner can then accept or decline.

Wishlist: Save favorite items to a personal wishlist for later.

Profile Management: Users can view and manage their own item listings and transaction history.

🚀 Tech Stack

This is a full-stack MERN project, consisting of a mobile client and a backend server.

Frontend (Mobile App)

Framework: React Native (with Expo)

Navigation: React Navigation (Stack & Tabs)

State Management: React Context API

HTTP Client: fetch API for communicating with the backend

Real-Time Client: socket.io-client

Permissions & Hardware: expo-image-picker for camera and gallery access

Backend (Server)

Framework: Node.js with Express.js

Database: MongoDB (with Mongoose)

Authentication: JSON Web Tokens (JWT)

Real-Time Communication: Socket.IO

Deployment: Render (for the live server)

CI/CD: Automated deployments triggered by GitHub pushes.

📲 Demo & Installation

The backend API is live and deployed on Render. You can install the Android application on your device by scanning the QR code below.

Note to User: You will need to replace the placeholder image below with a screenshot of the QR code from your EAS Build Page.

Scanning this QR code will download the .apk file. You may need to enable "Install from unknown sources" on your Android device.

🛠️ Local Development Setup

To run this project locally, you will need two terminal windows.

1. Backend Server (WardrobeNearby-Server)

# Navigate to the server directory
cd wardrobe-nearby/WardrobeNearby-Server

# Install dependencies
npm install

# Create a .env file based on the .env.example
# Add your MongoDB connection string and a JWT secret
# MONGO_URI=your_mongodb_uri
# JWT_SECRET=your_jwt_secret

# Start the server
npm start


The server will be running on http://localhost:3000.

2. Frontend Client (React Native)

# Navigate to the root project directory
cd wardrobe-nearby

# Install dependencies
npm install

# Start the Metro bundler for Expo Go
# You will need an Android/iOS simulator or a physical device with the Expo Go app
npm start


📂 Project Structure

The repository is a monorepo containing both the client and server code.

/ (root): Contains the React Native (Expo) mobile application.

/WardrobeNearby-Server: Contains the Node.js, Express, and MongoDB backend server.

📄 License

This project is licensed under the MIT License.
