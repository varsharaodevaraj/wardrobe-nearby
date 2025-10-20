<div align="center">
  <img src="https://placehold.co/600x300/E0BBE4/4A235A/png?text=DrobeBy" alt="DrobeBy Banner">
  <h1>DrobeBy 🛍️📱</h1>
  <p><b>Rent. Sell. Discover.</b></p>
  <p>A community-based, peer-to-peer marketplace for renting and selling items, built with React Native and Node.js.</p>
</div>

---

## 📋 Table of Contents

- [✨ Key Features](#-key-features)
- [🚀 Tech Stack](#-tech-stack)
- [📲 Demo & Installation](#-demo--installation)
- [🛠️ Local Development Setup](#️-local-development-setup)
- [📂 Project Structure](#-project-structure)
- [📄 License](#-license)

---

## ✨ Key Features

- 🔐 **User Authentication**  
  Secure registration and login using **JWT (JSON Web Tokens)**.

- 📦 **Item Listings**  
  Users can list items for rent or sale, with name, description, category, price, and multiple photos.

- 🏘️ **Community-Based Filtering**  
  Discover items from users within your college or local area.

- 💬 **Real-Time Chat**  
  WebSocket-powered messaging built with **Socket.IO** for instant communication.

- 🔄 **Rental & Sales System**  
  Complete rental lifecycle: request, accept/decline, and manage transactions.

- ❤️ **Wishlist**  
  Save favorite items for quick access later.

- 👤 **Profile Management**  
  View and manage your listings, profile info, and transaction history.

---

## 🚀 Tech Stack

### 📱 Frontend (Mobile App)

- **Framework:** React Native (Expo)
- **Navigation:** React Navigation (Stack & Tabs)
- **State Management:** React Context API
- **HTTP Client:** `fetch` API
- **Real-Time:** `socket.io-client`
- **Camera/Gallery Access:** `expo-image-picker`

### 🖥️ Backend (Server)

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (via Mongoose)
- **Authentication:** JSON Web Tokens (JWT), bcrypt
- **Real-Time Communication:** Socket.IO
- **Deployment:** Render
- **CI/CD:** GitHub Push Triggers (Automated Deployments)

---

## 📲 Demo & Installation

> The backend API is live on **Render**. The mobile app is available via an Android `.apk`.

### 🔗 Android Installation

Scan the QR code below (replace with real QR screenshot from EAS):

<img width="308" height="298" alt="Screenshot 2025-10-20 at 3 49 35 PM" src="https://github.com/user-attachments/assets/952a2081-a2d2-4b70-906d-509f69487ba7" />

> Scanning this QR code will download the `.apk` file.  
> ⚠️ You may need to enable "Install from unknown sources" on your Android device.

---

## 🛠️ Local Development Setup

You’ll need two terminals for the backend and frontend.

### 1️⃣ Backend (Express + MongoDB)

```bash
# Navigate to server folder
cd wardrobe-nearby/WardrobeNearby-Server

# Install dependencies
npm install

# Create your environment config
cp .env.example .env
# Then edit .env to include:
# MONGO_URI=your_mongodb_uri
# JWT_SECRET=your_jwt_secret

# Start server
npm start
