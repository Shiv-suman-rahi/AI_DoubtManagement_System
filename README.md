# AI Doubt Management System (AIDMS) for Colleges

A full-stack, production-oriented web application built for institutional academic doubt resolution, AI-assisted semantic grouping, multi-class faculty workload routing, real-time discussions, and student privacy preservation.

---

## 🌟 Key Highlights & Features

- **Multi-Role Dashboards:**
  - **Student Workspace:** Personalized welcome, academic enrollment card, real metrics, Ask Doubt form with syllabus-driven topic pickers, normal & anonymous submission modes, code snippet editor, attachment uploader, and private follow-up threads.
  - **Faculty Operations Hub:** Multi-class doubt queue with status filters, student identity masking for anonymous submissions, AI Doubt Groups manager with one-click group answers, group splitting & merging, and workload analytics.
  - **Administrator Console:** Institutional analytics with interactive Recharts diagrams, user directory with account suspension controls, bulk student roster import, academic hierarchy management, faculty assignment editor, pending doubts reassignment, and immutable audit logs.
- **Core AI Pipeline:**
  - Pluggable AI service interface supporting **Google Gemini**, **OpenAI**, and built-in **Local Heuristic / TF-IDF Vector & Cosine Fallback**.
  - Automatically classifies question intent (conceptual, debugging, mathematical, comparative).
  - Calculates vector embeddings and evaluates semantic similarity against existing class-subject cohorts.
  - Auto-groups questions meeting the confidence threshold ($\ge 0.85$) and flags uncertain matches ($\ge 0.78$) for faculty review.
  - **Zero Data Loss Guarantee:** AI failures never drop doubts; questions gracefully route to the assigned faculty queue.
- **Strict Privacy & Access Control:**
  - Anonymous submissions are completely stripped of student identity in all faculty-facing REST endpoints and Socket.IO payloads.
  - Students are strictly prohibited from viewing other students' private doubts or submitter identities.
  - Faculty members are restricted to subjects and classes they are officially authorized to teach.
- **Real-Time Communication:**
  - Socket.IO authenticated and room-authorized channels: College Academic Lounge, Subject Forums, Classroom Rooms, and private threads.
  - Real-time in-app notifications and live typing indicators.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, React Router DOM v6, Axios, Socket.IO Client, Lucide React, Recharts |
| **Backend** | Node.js, Express.js, MongoDB / Mongoose, Socket.IO, Helmet, CORS, Rate Limiting, Multer, bcryptjs, JWT |
| **AI Engine** | Abstract Provider Interface with Gemini 1.5, OpenAI GPT-4o-mini, and Local Cosine / TF-IDF Vectorizer |
| **Testing** | Vitest, React Testing Library, Supertest, In-Memory MongoDB Test DB |
| **API Docs** | Swagger / OpenAPI 3.0 UI at `/api/docs` |

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- Node.js (v18+ or v24+)
- MongoDB (Local instance or MongoDB Atlas URI)

### 2. Installation
Install root, backend, and frontend dependencies:
```bash
npm install
npm --prefix backend install
npm --prefix frontend install
```

### 3. Environment Configuration
The `.env.example` files in both `backend` and `frontend` contain pre-configured defaults:

**Backend (`backend/.env`):**
```env
PORT=5000
NODE_ENV=development
CLIENT_URLS=http://localhost:5173,http://localhost:3000
MONGODB_URI=mongodb://127.0.0.1:27017/aidms
JWT_ACCESS_SECRET=aidms_super_secure_jwt_access_secret_key_2026_production
JWT_REFRESH_SECRET=aidms_super_secure_jwt_refresh_secret_key_2026_production
AI_PROVIDER=local
SIMILARITY_THRESHOLD=0.78
AUTO_GROUP_THRESHOLD=0.85
```

**Frontend (`frontend/.env`):**
```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

### 4. Database Seeding
Populate the database with realistic college academic hierarchy, demo courses, users, doubts, and AI groups:
```bash
npm run seed
```

### 5. Running the Application
In separate terminal sessions:

**Start Backend API & Socket Server:**
```bash
npm --prefix backend run dev
```
*(Server listens on `http://localhost:5000` with Swagger UI at `http://localhost:5000/api/docs`)*

**Start Frontend Development Server:**
```bash
npm --prefix frontend run dev
```
*(Frontend UI loads at `http://localhost:5173`)*

---

## 👥 Demo Institutional Accounts

| Role | Email | Password | Assigned Context |
| :--- | :--- | :--- | :--- |
| **👑 Administrator** | `admin@apex.edu` | `Admin@123` | Institutional Analytics, Audit Logs, Structure |
| **👨‍🏫 Faculty 1** | `prof.sharma@apex.edu` | `Faculty@123` | Operating Systems (CS501) - CSE Sem 5A & 5B |
| **👩‍🏫 Faculty 2** | `prof.verma@apex.edu` | `Faculty@123` | Database Management (CS502) - CSE Sem 5A |
| **👨‍🎓 Student 1** | `student.aarav@apex.edu` | `Student@123` | B.Tech CSE, Sem 5, Section A |
| **👩‍🎓 Student 2** | `student.ananya@apex.edu` | `Student@123` | B.Tech CSE, Sem 5, Section A |
| **👨‍🎓 Student 3** | `student.rohan@apex.edu` | `Student@123` | B.Tech CSE, Sem 5, Section B |

*(Tip: The login screen contains 1-click demo credential pills for fast switching).*

---

## 🧪 Running the Test Suite

Run all automated unit, integration, and security tests:
```bash
npm test
```

### Test Coverage Highlights
- ✅ **RULE 1:** Student A cannot view Student B's private doubts (403 Forbidden).
- ✅ **RULE 2:** Students cannot access faculty queue endpoints.
- ✅ **RULE 3 & 4:** Assigned faculty can view identified doubts; unassigned faculty is rejected.
- ✅ **RULE 5:** Anonymous student identities are stripped from all faculty responses and sockets.
- ✅ **RULE 6:** Students can view and receive answers to their own anonymous submissions.
- ✅ **RULE 7:** AI failures do not cause doubt loss (fail-safe persistence).
- ✅ **RULE 8:** Sensitive administrative modifications are logged to `AuditLog`.
- ✅ **AI Grouping:** Semantic similarity clustering attaches related inquiries without deleting originals.
- ✅ **Batch Resolution:** Publishing a shared answer resolves all linked student doubts and dispatches individual notifications.
- ✅ **Frontend Rendering:** Status badges, priority indicators, and responsive routing navigation.
