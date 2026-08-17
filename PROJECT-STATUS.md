# 🌊 NeerNetra — Project Status & Handoff Summary

## 1. Data Sources
- **`server/data/monthly_records_seed.json`**: Synthetic/seed historical records for 10 NMC zones (NRW%, MLD supplied, tanker count, supply hours).
- **MongoDB `monthlyrecords`**: Hybrid collection containing initial seed data (`is_synthetic: true`) and live worker uploads (`is_synthetic: false`).
- **MongoDB `users`**: Account store for authorized NMC field workers.

## 2. Working Features vs. Placeholders / Gaps
- **Working**:
  - JWT Authentication & session handling (`/api/auth/login`, `/api/auth/me`).
  - City-wide 10 NMC Zone Overview dashboard with risk status badges (<30% Optimal, 30–45% Moderate, >45% High Risk).
  - Executive AI Briefing aggregating zone metrics via Google Gemini API (with rule-based offline fallback).
  - Zone Detail view with interactive Recharts, Least-Squares Linear Regression trend forecasting, and 45% threshold alerts.
  - New Monthly Log submission form with 20% automated jump validation and DB persistence.
  - Data Provenance Badges (`Demo data` vs `Worker upload`).
- **Placeholder / Not Built**:
  - Interactive GIS / spatial map visualization.
  - Multi-role RBAC permissions (e.g. Admin vs Field Worker views).

## 3. Required Environment Variables
- `PORT`
- `MONGO_URI`
- `JWT_SECRET`
- `GEMINI_API_KEY` *(value shared separately, not in this file)*

## 4. Demo Login Credentials
- **Username:** `nmcworker1`
- **Password:** `password123`
