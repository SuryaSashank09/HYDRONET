# 💧 HydroNet — Community Rainwater Monitoring Network
> **By BitBusters** | MERN Stack Civic-Tech Platform

HydroNet is a mobile-first civic platform enabling citizens and authorities to collaboratively monitor rainwater harvesting structures using geospatial mapping, community reporting, and predictive analytics.

---

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18
- MongoDB (local or [Atlas](https://mongodb.com/atlas) free tier)

### 1. Install All Dependencies

```bash
# From project root
npm run install-all
```

### 2. Configure the Server

```bash
cd server
cp .env.example .env
# Open .env and set your MONGO_URI
```

### 3. Seed Sample Data (Recommended)

```bash
cd server
node seed.js
```

Populates 8 real structures around Hyderabad + 4 demo users.

### 4. Start Development

```bash
# From project root
npm run dev
```

| Service | URL |
|---------|-----|
| React Client | http://localhost:3000 |
| Express API  | http://localhost:5000 |

---

## 🔑 Demo Accounts

| Role              | Email                    | Password    | Access |
|-------------------|--------------------------|-------------|--------|
| Admin             | admin@hydronet.com       | admin123!   | Everything |
| Municipal Officer | ravi@example.com         | password123 | Dashboard + Validate |
| NGO               | ananya@ngo.com           | password123 | Dashboard |
| Citizen           | priya@example.com        | password123 | Map + Report |

---

## 📁 Project Structure

```
hydronet/
├── server/                        # Express + MongoDB API
│   ├── models/
│   │   ├── User.js                # Roles, eco scores, badges, rank progression
│   │   ├── Structure.js           # Geospatial model (2dsphere index)
│   │   └── Report.js              # Reports with validation workflow
│   ├── routes/
│   │   ├── auth.js                # Register, login, /me (JWT)
│   │   ├── structures.js          # CRUD + geo near + stats
│   │   ├── reports.js             # Submit + validate + eco scoring
│   │   ├── dashboard.js           # Analytics + maintenance alerts + water impact
│   │   ├── leaderboard.js         # Top eco-contributors
│   │   └── upload.js              # Multer image upload endpoint
│   ├── middleware/
│   │   ├── auth.js                # JWT protect + RBAC authorize
│   │   ├── errorHandler.js        # Global Express error handler
│   │   └── upload.js              # Multer config (5MB, images only)
│   ├── seed.js                    # Sample data seeder
│   └── index.js                   # Express entry point
│
└── client/                        # React 18 SPA
    └── src/
        ├── context/
        │   └── AuthContext.js     # Global auth state + JWT management
        ├── hooks/
        │   └── useApi.js          # useApi + useMutation data hooks
        ├── components/Common/
        │   ├── Sidebar.js         # Responsive nav (mobile hamburger)
        │   ├── Toast.js           # Notification system
        │   ├── ErrorBoundary.js   # Per-page error boundary
        │   └── ImageUploader.js   # Drag-and-drop photo upload
        ├── utils/
        │   ├── api.js             # Axios instance with JWT interceptors
        │   └── helpers.js         # Constants, formatters, type maps
        └── pages/
            ├── AuthPages.js           # Login + Register
            ├── MapPage.js             # Leaflet dark map with live markers
            ├── StructuresPage.js      # Grid list + status/type filters
            ├── StructureDetailPage.js # Tabbed detail: info, reports, map
            ├── ReportPage.js          # Step-by-step report with photo upload
            ├── DashboardPage.js       # Admin charts + KPI + pending queue
            ├── ValidationPage.js      # Officer one-click verify/reject
            ├── LeaderboardPage.js     # Podium + full rankings
            ├── ImpactPage.js          # Predictive water impact engine
            ├── ProfilePage.js         # Eco score, rank progress, badges
            ├── OtherPages.js          # My Reports + Add Structure
            └── NotFoundPage.js        # 404 + LoadingScreen
```

---

## ✨ Features

### FR-1: Geospatial Harvesting Map ✅
- Leaflet dark map (CartoDB Dark tiles)
- Circles sized by storage capacity
- Status colour-coded markers (green/amber/red/purple)
- Popup with type, status, capacity, "View Details" button
- Filter by status + type from the header

### FR-2: Citizen Reporting System ✅
- 7 condition categories, each with eco-point value shown live
- 4 severity levels (Low → Critical)
- Drag-and-drop photo upload (up to 3 images)
- Auto eco-points award on submission
- Animated success screen with points earned + new rank

### FR-3: Smart Maintenance Dashboard ✅
- KPI metric cards: total structures, functional %, pending reports, users
- Water impact cards: capacity, water saved, groundwater recharge
- 7-day report activity bar chart
- Status breakdown pie/donut chart
- Pending reports table with one-click navigate to validation
- Predictive impact panel (harvest, recharge, CO₂, families)

### FR-4: Predictive Water Impact Engine ✅
- Monthly area chart (harvest vs recharge, driven by rainfall patterns)
- Environmental equivalents: trees, CO₂ kg, showers saved, Olympic pools
- Methodology note (transparent model explanation)

### Gamification ✅
- 5 ranks: 🌱 Seedling → 🌿 Sapling → 🛡️ Guardian → 🏆 Champion → ⭐ Legend
- 4 badges: First Drop, Rain Watcher, Hydro Hero, Water Champion
- Leaderboard with animated gold/silver/bronze podium
- Profile page with rank progress bar showing pts to next rank

### Structure Detail Page ✅
- 3 tabs: Overview (metrics + mini-map), Reports history, Full map
- Officer controls: inline status change dropdown, Verify button
- Report a structure directly from its detail page

### Role-Based Access Control ✅
| Role | Map | Report | Dashboard | Validate | Add Structure |
|------|-----|--------|-----------|----------|---------------|
| Citizen | ✅ | ✅ | ❌ | ❌ | ✅ |
| NGO | ✅ | ✅ | ✅ (read) | ❌ | ✅ |
| Officer | ✅ | ✅ | ✅ | ✅ | ✅ |
| Admin | ✅ | ✅ | ✅ | ✅ | ✅ + Delete |

---

## 🔌 API Reference

### Auth
| Method | Endpoint | Body / Notes |
|--------|----------|------|
| POST | /api/auth/register | `{ name, email, password, role?, location? }` |
| POST | /api/auth/login | `{ email, password }` |
| GET | /api/auth/me | Bearer token required |

### Structures
| Method | Endpoint | Notes |
|--------|----------|-------|
| GET | /api/structures | `?status=&type=&city=&lat=&lng=&radius=&limit=` |
| GET | /api/structures/stats/summary | Aggregate counts + totals |
| GET | /api/structures/:id | Populates reports + reporter |
| POST | /api/structures | Auth required |
| PUT | /api/structures/:id | Officer+ only |
| PATCH | /api/structures/:id/verify | Officer+ only |
| DELETE | /api/structures/:id | Admin only |

### Reports
| Method | Endpoint | Notes |
|--------|----------|-------|
| GET | /api/reports | Citizens see own; officers see all. `?status=&structureId=` |
| POST | /api/reports | Awards eco points, unlocks badges |
| GET | /api/reports/:id | Auth required |
| PATCH | /api/reports/:id/validate | `{ validationStatus, adminNotes }` — Officer+ |

### Dashboard (Officer+)
| Method | Endpoint |
|--------|----------|
| GET | /api/dashboard/overview |
| GET | /api/dashboard/maintenance-alerts |
| GET | /api/dashboard/water-impact |

### Other
| Method | Endpoint |
|--------|----------|
| GET | /api/leaderboard | `?limit=&city=` |
| POST | /api/upload/image | Single image — `multipart/form-data` field: `image` |
| POST | /api/upload/images | Up to 5 — field: `images` |
| GET | /api/health | Server health check |

---

## 🎨 Design System

| Token | Value |
|-------|-------|
| Background | `#0a0f1a` |
| Surface | `#111d35` |
| Accent Teal | `#0ea5e9` |
| Accent Emerald | `#10b981` |
| Accent Amber | `#f59e0b` |
| Accent Rose | `#f43f5e` |
| Font Display | Syne (Google Fonts) |
| Font Body | DM Sans (Google Fonts) |
| Map Tiles | CartoDB Dark Matter |

---

*Built with ❤️ for sustainable urban water management by BitBusters*
