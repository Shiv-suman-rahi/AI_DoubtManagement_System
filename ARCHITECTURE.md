# AIDMS Architecture & Access-Control Specification

The **AI Doubt Management System (AIDMS)** is designed around strict institutional boundaries, semantic AI grouping, multi-class faculty routing, and privacy preservation.

---

## 1. System Architecture Diagram

```mermaid
flowchart TD
    Client["Client Devices (Desktop, Tablet, Mobile)"]
    Web["React.js + Vite + Tailwind UI"]
    
    subgraph Gateway ["Express 4 & Socket.IO Gateway"]
        AuthMid["JWT Auth & Role Enforcement Middleware"]
        RateMid["Rate Limiter & Brute-Force Shields"]
        UploadMid["Multer Safe Storage & Attachment Validator"]
    end
    
    subgraph CoreServices ["Core Application Services"]
        DoubtSvc["Doubt Processing Controller"]
        AISvc["AI Doubt Engine & Vector Clustering"]
        SocketSvc["Authorized Room Multiplexer"]
        AuditSvc["Immutable Audit Logger"]
    end

    subgraph AIProviders ["AI Provider Abstraction"]
        Gemini["Google Gemini 1.5"]
        OpenAI["OpenAI GPT-4o-mini"]
        LocalTFIDF["Local Cosine & Intent Fallback Engine"]
    end

    subgraph Database ["Persistence Layer"]
        MongoDB[("MongoDB Atlas / Local Mongoose Models")]
    end

    Client --> Web
    Web --> Gateway
    Gateway --> CoreServices
    AISvc --> AIProviders
    CoreServices --> Database
```

---

## 2. Academic Hierarchy

The database schema strictly adheres to the institutional structure:

```
College (Apex Institute of Technology)
└── Department (Computer Science & Engineering)
    └── Program (B.Tech Computer Science)
        └── Classroom (CSE Sem 5 Section A, 2025-2026)
            ├── Student Enrollment (Aarav, Ananya)
            └── ClassSubject Offering (CS501 - Operating Systems)
                ├── Syllabus Topics & Subtopics (Deadlocks -> Banker's Algorithm)
                └── Faculty Assignment (Prof. Ramesh Sharma)
```

- **Independent Offerings:** Subjects are not rigidly bound to a single classroom. The `ClassSubject` entity independently links classrooms and subjects.
- **Dedicated Faculty Assignments:** The `FacultyAssignment` model specifies which faculty member teaches which subject in which class during which academic period.

---

## 3. AI Doubt Classification & Semantic Grouping Pipeline

```mermaid
sequenceDiagram
    autonumber
    actor Student
    participant API as Express API
    participant AI as AI Engine
    participant DB as MongoDB
    actor Faculty

    Student->>API: Submit Doubt (Title, Question, Topic, PrivacyMode)
    API->>DB: Save Doubt (Status: Pending)
    API->>AI: Trigger Semantic Processing Pipeline
    AI->>AI: Tokenize, Classify Intent & Compute 64D Vector Embedding
    AI->>DB: Query Active Groups in this ClassSubject
    alt Cosine Similarity >= 0.85 (Auto Group)
        AI->>DB: Attach to Existing DoubtGroup (Review: auto_matched)
    else Cosine Similarity >= 0.78 (Suggested Group)
        AI->>DB: Attach to Existing DoubtGroup (Review: faculty_review_required)
    else Cosine Similarity < 0.78 (New Group)
        AI->>DB: Create new DoubtGroup with Doubt as Representative Question
    end
    AI->>AI: Generate Preliminary Concept Synthesis Draft
    AI->>DB: Update Doubt (Status: AI Processed, Assigned)
    AI->>Faculty: Emit Socket.IO Alert (New Cohort Doubt Assigned)
```

---

## 4. Privacy & Access Control Matrix

| Role | Own Doubts | Class Cohort Doubts | Anonymous Submitter Identity | Cross-Class Doubts | Shared Faculty Explanations | Administrative Logs |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Student** | Full Access | No (Forbidden) | Hidden (Never returned) | No | View Approved Answers | No |
| **Faculty (Assigned)** | Full Access | Full Access | **Masked** (`Anonymous Student`) | No (Forbidden) | Author & Publish | No |
| **Faculty (Unassigned)** | No | No (403 Forbidden) | No (403 Forbidden) | No | Search Knowledge Base | No |
| **Administrator** | Audit Access | Audit Access | Policy Audited (Logged) | Managed | Full Management | Full Access |

### Critical Privacy Guarantees
1. **Server-Side Masking:** When a doubt is submitted in `anonymous` mode, the student's reference is preserved internally for ownership and private answers, but the server strips all identifying fields (`student._id`, `name`, `email`, `avatar`) from every faculty-facing API response and socket broadcast.
2. **Resource-Level Route Protection:** Students attempting to view other students' doubts by ID receive HTTP 403 Forbidden.
3. **Faculty Scope Enforcement:** Faculty members can only query or answer doubts belonging to their explicitly assigned `ClassSubject` combinations.
4. **Permanent Question Preservation:** When doubts are clustered into groups, original questions are permanently preserved. Faculty answers delivered to a group notify each linked student privately.
