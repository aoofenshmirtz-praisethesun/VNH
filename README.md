# 🌊 NeerNetra — NMC Zone Water Monitoring System

**NeerNetra** is a full MERN stack web application built for **Nagpur Municipal Corporation (NMC)** water supply workers and engineers to monitor Non-Revenue Water (NRW%) losses, visualize linear regression trend predictions, upload monthly zone logs with automated jump validation, and generate operational AI summaries using Google Gemini API.

![NeerNetra Banner](https://img.shields.io/badge/NMC-Water%20Monitoring-0284c7?style=for-the-badge&logo=droplet)
![Tech Stack](https://img.shields.io/badge/Stack-MERN%20%2B%20Vite%20%2B%20Gemini%20AI-38bdf8?style=for-the-badge)

---

## ✨ Features

- 🏙️ **City-Wide Executive AI Briefing:** High-level dashboard analysis identifying top critical high-loss zones and recommending emergency 24-hour municipal action items.
- 📊 **10 NMC Zone Overview:** Real-time NRW% tracking across all 10 Nagpur municipal zones with visual status indicators (<30% Optimal, 30-45% Moderate, >45% High Risk).
- 📈 **NRW% Trend History & Linear Regression:** Interactive Recharts line graphs with 45% critical loss threshold markers and least-squares linear trend predictions for upcoming months.
- ⚡ **Google Gemini AI Integration (`gemini-1.5-flash`):** Custom operational summaries and actionable field recommendations for municipal workers (with smart offline fallback).
- 🏷️ **Data Provenance Badges:** Clear visual distinction between `Demo data` (`is_synthetic: true`) and verified `Worker upload` (`is_synthetic: false`).
- ⚠️ **Automated Jump Validation:** Warns workers whenever a newly entered NRW% value differs from recent recorded entries by more than 20 percentage points.
- 🔐 **JWT Worker Authentication:** Secure login system (`nmcworker1` / `password123`).

---

## 🛠️ Tech Stack

- **Frontend:** React 18 (Vite), React Router v7, Recharts, Lucide Icons, Modern 2026 Glassmorphic CSS.
- **Backend:** Node.js, Express.js, Mongoose, JWT Auth, BcryptJS, Axios.
- **Database:** MongoDB (Local / Atlas support with automatic `mongodb-memory-server` zero-config fallback).
- **AI Engine:** Google Gemini API (`gemini-1.5-flash` REST API).

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js (v18+ recommended)
- Git

### 2. Environment Setup
Create a `.env` file in the root directory:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/neernetra
JWT_SECRET=neernetra_super_secret_jwt_key_2026
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Installation & Database Seeding

```bash
# Clone the repository
git clone <YOUR_REPO_URL>
cd NEERNETRA

# Install backend dependencies & seed database
cd server
npm install
npm run seed

# Install frontend dependencies
cd ../client
npm install
```

### 4. Running the Application

In two separate terminals:

```bash
# Terminal 1: Backend Server (Port 5000)
cd server
npm start

# Terminal 2: Frontend App (Port 3000)
cd client
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## 🔑 Demo Credentials

- **Username:** `nmcworker1`
- **Password:** `password123`

---

## 🗺️ Monitored NMC Zones

1. ASHI NAGAR
2. DHANTOLI
3. DHARAMPETH
4. GANDHIBAGH
5. HANUMAN NAGAR
6. LAKADGANJ
7. LaxmiNagar
8. MANGALWARI
9. NEHRU NAGAR
10. SATRANJIPURA

---

## 📄 License
Developed for Nagpur Municipal Corporation (NMC) Water Supply Management.
