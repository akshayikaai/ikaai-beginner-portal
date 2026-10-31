# Ikaai Academy — Architecture & Technical Specifications

## 1. System Overview
**Ikaai Academy** is an institutional role-based learning and onboarding web application for interns and new joiners at **Ikaai India Research Pvt. Ltd.** It bridges the gap between field research fundamentals, institutional protocols, and data-driven consulting.

---

## 2. Technology Stack & Database Strategy

- **Framework**: Next.js 14+ (App Router) with TypeScript & React 18.
- **Database**: PostgreSQL (Docker-based for local development and production) via Prisma ORM.
  - Development utilizes standard Docker Compose: `docker-compose.yml` with official `postgres:16-alpine`.
  - Prisma Schema provides complete relational integrity, foreign keys, cascade safety, and unique constraints.
  - All progress, quiz scores, and exam submissions are committed and validated against the PostgreSQL database.
- **Authentication & Security**: NextAuth.js (Auth.js) session provider supporting 3 distinct roles:
  - `LEARNER` (Intern or New Joiner)
  - `INSTRUCTOR` (Team Lead / Research Director)
  - `ADMIN` (Academy Director / HR Admin)
- **Token Invalidation on Password Change**: `tokenVersion Int @default(1)` on `User`. **`tokenVersion` is validated on every authenticated request via session/JWT callbacks** against the database or cache. Incrementing `tokenVersion` on password reset/change immediately terminates all active sessions.
- **Progressive Delay & CAPTCHA Rate Limiter**: Shared sliding window limiter backed by Redis (or PostgreSQL fallback table `RateLimitRecord`). Enforces progressive response delay:
  - 1–3 failed login attempts: normal response timing.
  - 4–5 failed attempts: progressive exponential artificial delay (2s to 5s).
  - 6+ failed attempts: CAPTCHA challenge required and temporary 15-minute cool-off.
- **Non-Enumerating Password Reset**: `POST /api/auth/reset-password` generates a one-time cryptographic token in `PasswordResetToken` (1-hour expiry). Regardless of whether the email exists, the API always returns `200 OK: "If an account matches that email, a secure reset link has been dispatched"`, preventing user enumeration attacks.
- **Transactional Email Provider**: Abstracted transactional mailer (Nodemailer / AWS SES / Resend) configured via environment variables for password reset notifications and exam grading alerts.
- **File Upload Security**: Uploaded files receive a cryptographically generated UUID filename, are served with `X-Content-Type-Options: nosniff` headers, validated against a strict MIME whitelist, restricted to 10MB, and support an optional ClamAV/antivirus scan hook before persistence.
- **Archival Safety**: Programmes are never deleted; they carry an `archivedAt DateTime?` flag so historical enrolments, certificates, and metrics are permanently preserved.
- **Typography**: Standardized on Google Fonts `Bricolage Grotesque` (Headings) + `Figtree` (Body).

---

## 3. Complete Prisma Schema (`schema.prisma`)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  LEARNER
  INSTRUCTOR
  ADMIN
}

enum ResourceType {
  PDF
  DOCUMENT
  IMAGE
  VIDEO
}

enum ExamStatus {
  NOT_SUBMITTED
  SUBMITTED
  GRADED
}

enum FeedbackScope {
  PROGRAMME
  MODULE
}

enum EnrollmentStatus {
  ACTIVE
  COMPLETED
  SUSPENDED
}

model User {
  id              String             @id @default(cuid())
  email           String             @unique
  passwordHash    String
  name            String
  avatarUrl       String?
  role            Role               @default(LEARNER)
  department      String             // e.g. "Research", "Data Analyst", "HR", "Field Operations"
  tokenVersion    Int                @default(1) // Checked on EVERY authenticated request
  isAnonymised    Boolean            @default(false)
  anonymisedAt    DateTime?
  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt

  enrollments     Enrollment[]
  instructedProgs ProgrammeInstructor[]
  progressRecords ResourceProgress[]
  quizSubmissions QuizSubmission[]
  examSubmissions ExamSubmission[]
  feedbacks       Feedback[]
  sentMessages    ChatMessage[]      @relation("SentMessages")
  receivedMessages ChatMessage[]     @relation("ReceivedMessages")
  announcements   Announcement[]
  certificates    Certificate[]
  uploadedFiles   FileAsset[]
  consentLogs     ConsentLog[]
  passwordResets  PasswordResetToken[]

  @@index([role])
  @@index([isAnonymised])
}

model PasswordResetToken {
  id        String   @id @default(cuid())
  userId    String
  tokenHash String   @unique
  expiresAt DateTime
  used      Boolean  @default(false)
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([tokenHash])
}

model RateLimitRecord {
  key       String   @id // e.g. "login:ip_or_email"
  count     Int      @default(1)
  expiresAt DateTime

  @@index([expiresAt])
}

model Programme {
  id              String             @id @default(cuid())
  slug            String             @unique
  title           String             // e.g. "HR", "Data Analyst", "Research", "Field Operations"
  tagline         String
  description     String             @db.Text
  colorTag        String             // Hex color: e.g. "#00511E"
  colorBgLight    String             // Hex tint: e.g. "#E1EFE4"
  colorTextLight  String             // Hex contrast text: e.g. "#003D16"
  archivedAt      DateTime?          // Soft archival; programmes are never deleted
  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt

  instructors     ProgrammeInstructor[]
  enrollments     Enrollment[]
  modules         Module[]
  writtenExam     WrittenExam?
  announcements   Announcement[]
  chatMessages    ChatMessage[]
  feedbacks       Feedback[]
  certificates    Certificate[]

  @@index([slug])
  @@index([archivedAt])
}

model ProgrammeInstructor {
  id          String    @id @default(cuid())
  programmeId String
  userId      String
  assignedAt  DateTime  @default(now())

  programme   Programme @relation(fields: [programmeId], references: [id], onDelete: Cascade)
  user        User      @relation(fields: [userId], references: [id], onDelete: Restrict)

  @@unique([programmeId, userId])
}

model Enrollment {
  id           String           @id @default(cuid())
  userId       String
  programmeId  String
  status       EnrollmentStatus @default(ACTIVE)
  enrolledAt   DateTime         @default(now())
  completedAt  DateTime?

  user         User             @relation(fields: [userId], references: [id], onDelete: Restrict)
  programme    Programme        @relation(fields: [programmeId], references: [id], onDelete: Cascade)

  @@unique([userId, programmeId])
  @@index([userId])
  @@index([programmeId])
}

model Module {
  id           String       @id @default(cuid())
  programmeId  String
  sortOrder    Float        @default(1000.0) // Fractional indexing for reorder-safe sorting
  title        String
  description  String       @db.Text
  objectives   String[]     // PostgreSQL scalar array
  createdAt    DateTime     @default(now())

  programme    Programme    @relation(fields: [programmeId], references: [id], onDelete: Cascade)
  resources    Resource[]
  quiz         Quiz?
  faqs         FAQ[]
  feedbacks    Feedback[]

  @@index([programmeId, sortOrder])
}

model Resource {
  id           String             @id @default(cuid())
  moduleId     String
  sortOrder    Float              @default(1000.0) // Fractional indexing
  title        String
  type         ResourceType
  url          String
  fileAssetId  String?
  readingTime  Int                @default(30) // Minimum reading duration in seconds
  summary      String?            @db.Text
  contentHtml  String?            @db.Text     // Preview text/content

  module       Module             @relation(fields: [moduleId], references: [id], onDelete: Cascade)
  fileAsset    FileAsset?         @relation(fields: [fileAssetId], references: [id], onDelete: SetNull)
  progress     ResourceProgress[]

  @@index([moduleId, sortOrder])
}

model ResourceProgress {
  id           String    @id @default(cuid())
  userId       String
  resourceId   String
  completed    Boolean   @default(false)
  startedAt    DateTime? // Recorded strictly by server upon POST /api/progress/resource/start
  completedAt  DateTime?
  secondsSpent Int       @default(0)

  user         User      @relation(fields: [userId], references: [id], onDelete: Restrict)
  resource     Resource  @relation(fields: [resourceId], references: [id], onDelete: Cascade)

  @@unique([userId, resourceId])
  @@index([userId])
}

model Quiz {
  id           String           @id @default(cuid())
  moduleId     String           @unique
  title        String
  instructions String?
  passingScore Int              @default(70) // Percentage

  module       Module           @relation(fields: [moduleId], references: [id], onDelete: Cascade)
  questions    QuizQuestion[]
  submissions  QuizSubmission[]
}

model QuizQuestion {
  id           String   @id @default(cuid())
  quizId       String
  sortOrder    Float    @default(1000.0)
  question     String   @db.Text
  options      String[] // 3-4 multiple-choice options
  correctIndex Int      // Server-side only; never leaked to learners

  quiz         Quiz     @relation(fields: [quizId], references: [id], onDelete: Cascade)

  @@index([quizId, sortOrder])
}

model QuizSubmission {
  id           String   @id @default(cuid())
  userId       String
  quizId       String
  score        Int      // Number of correct answers
  total        Int      // Total questions
  percentage   Float
  attemptNo    Int      @default(1)
  resetCount   Int      @default(0)
  resetById    String?
  resetReason  String?
  submittedAt  DateTime @default(now())

  user         User     @relation(fields: [userId], references: [id], onDelete: Restrict)
  quiz         Quiz     @relation(fields: [quizId], references: [id], onDelete: Cascade)

  @@unique([userId, quizId, attemptNo]) // Scoped to attempt number
  @@index([userId])
}

model FAQ {
  id         String   @id @default(cuid())
  moduleId   String
  sortOrder  Float    @default(1000.0)
  question   String
  answer     String   @db.Text

  module     Module   @relation(fields: [moduleId], references: [id], onDelete: Cascade)

  @@index([moduleId, sortOrder])
}

model WrittenExam {
  id                String           @id @default(cuid())
  programmeId       String           @unique
  title             String
  instructions      String           @db.Text
  passingPercentage Int              @default(60) // Passing percentage of total question marks

  programme         Programme        @relation(fields: [programmeId], references: [id], onDelete: Cascade)
  questions         ExamQuestion[]
  submissions       ExamSubmission[]
}

model ExamQuestion {
  id           String      @id @default(cuid())
  examId       String
  sortOrder    Float       @default(1000.0)
  question     String      @db.Text
  maxMarks     Int         @default(10) // Individual question marks; exam total is sum of maxMarks

  exam         WrittenExam @relation(fields: [examId], references: [id], onDelete: Cascade)

  @@index([examId, sortOrder])
}

model ExamSubmission {
  id          String      @id @default(cuid())
  examId      String
  userId      String
  status      ExamStatus  @default(SUBMITTED)
  answersJson Json        // Array of { questionId: string, answerText: string }
  marks       Int?        // Marks awarded by instructor (out of sum(ExamQuestion.maxMarks))
  feedback    String?     @db.Text
  gradedById  String?
  submittedAt DateTime    @default(now())
  gradedAt    DateTime?

  exam        WrittenExam @relation(fields: [examId], references: [id], onDelete: Cascade)
  user        User        @relation(fields: [userId], references: [id], onDelete: Restrict)

  @@unique([examId, userId]) // Single submission per programme exam
  @@index([userId])
}

model Announcement {
  id          String     @id @default(cuid())
  programmeId String?    // Null for global academy announcements
  authorId    String
  title       String
  content     String     @db.Text
  pinned      Boolean    @default(false)
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  programme   Programme? @relation(fields: [programmeId], references: [id], onDelete: SetNull)
  author      User       @relation(fields: [authorId], references: [id], onDelete: Restrict)

  @@index([programmeId])
}

model ChatMessage {
  id          String     @id @default(cuid())
  programmeId String
  senderId    String
  recipientId String?    // Null for group chat, set for direct instructor messages
  message     String     @db.Text
  createdAt   DateTime   @default(now())

  programme   Programme  @relation(fields: [programmeId], references: [id], onDelete: Cascade)
  sender      User       @relation("SentMessages", fields: [senderId], references: [id], onDelete: Restrict)
  recipient   User?      @relation("ReceivedMessages", fields: [recipientId], references: [id], onDelete: SetNull)

  @@index([programmeId, createdAt])
  @@index([senderId, recipientId])
}

model Feedback {
  id          String        @id @default(cuid())
  programmeId String
  moduleId    String?
  authorId    String        // Retained for Admin audit; omitted for instructors
  scope       FeedbackScope @default(PROGRAMME)
  comments    String        @db.VarChar(2000)
  createdAt   DateTime      @default(now())

  programme   Programme     @relation(fields: [programmeId], references: [id], onDelete: Cascade)
  module      Module?       @relation(fields: [moduleId], references: [id], onDelete: SetNull)
  author      User          @relation(fields: [authorId], references: [id], onDelete: Restrict)

  @@index([programmeId])
}

model Certificate {
  id             String    @id @default(cuid())
  certificateNo  String    @unique // e.g. "IKAAI-ACAD-2026-0042"
  recipientName  String    // Snapshot of learner name at issuance (persists after user anonymisation)
  userId         String
  programmeId    String
  issuedAt       DateTime  @default(now())
  finalGrade     String    // e.g. "A (92%)"
  verificationId String    @unique @default(cuid()) // Public verification token

  user           User      @relation(fields: [userId], references: [id], onDelete: Restrict)
  programme      Programme @relation(fields: [programmeId], references: [id], onDelete: Cascade)

  @@unique([userId, programmeId])
  @@index([certificateNo])
  @@index([verificationId])
}

model FileAsset {
  id           String     @id @default(cuid())
  filename     String     // Original uploaded file name
  storagePath  String     // Randomized UUID storage name on disk/S3
  mimeType     String
  sizeBytes    Int
  uploadedById String
  uploadedAt   DateTime   @default(now())

  uploadedBy   User       @relation(fields: [uploadedById], references: [id], onDelete: Restrict)
  resources    Resource[]

  @@index([uploadedById])
}

model ConsentLog {
  id           String    @id @default(cuid())
  userId       String
  purpose      String    // e.g. "ONBOARDING_TRAINING_2026"
  policyVer    String    // e.g. "v1.0"
  consentedAt  DateTime  @default(now())
  ipAddress    String?   // Redacted upon anonymisation

  user         User      @relation(fields: [userId], references: [id], onDelete: Restrict)

  @@index([userId])
}
```

---

## 4. Source of Truth, Idempotent Timer & Quiz Security

### 1. Server-Side Idempotent Timer Architecture
- **Start Timer (`POST /api/progress/resource/start`)**:
  - Accepts `{ resourceId }`.
  - Verifies learner enrollment in the resource's programme.
  - Queries `ResourceProgress`: if `startedAt` is already set, **it is preserved (idempotent)**; if not set, sets `startedAt = new Date()`.
- **Complete Resource (`POST /api/progress/resource/complete`)**:
  - Accepts `{ resourceId }`. **Ignores any client-supplied timestamp**.
  - Reads stored `ResourceProgress.startedAt` and `Resource.readingTime` (default 30 seconds).
  - Validates:
    $$\text{now} - \text{startedAt} \ge (\text{readingTime} - 2) \times 1000\text{ ms}$$
  - If `startedAt` is absent or insufficient time has elapsed, returns `400 Bad Request`.
  - On success, sets `completed = true`, `completedAt = new Date()`.

### 2. Quiz Security & Resolution of Single-Attempt vs. Certificate Policy
- **Resolution**: Quizzes enforce single-attempt by default. If a learner fails a quiz (`score < passingScore`), an assigned **instructor or administrator can reset one quiz attempt** (`POST /api/quiz/reset`). This increments `attemptNo = 2`, records `resetById` and `resetReason`, allowing the learner a second chance.
- **Learner Quiz Endpoint (`GET /api/quiz/[id]`)**: Selects **only** `{ id, sortOrder, question, options }`. The `correctIndex` field is **never sent to the client**.
- **Instructor/Admin Key Endpoint (`GET /api/quiz/[id]/key`)**: Restricted strictly to instructors assigned to the programme and admins; returns full questions with `correctIndex` for rubric review.
- **Quiz Submission (`POST /api/quiz/submit`)**:
  - Evaluates submitted answers on the server against `QuizQuestion.correctIndex`.
  - Computes score and percentage.
  - Creates the `QuizSubmission` for current `attemptNo`. Subsequent attempts without an explicit reset return `409 Conflict`.

### 3. Exam Total Marks & Passing Rules
- Total exam marks is the exact sum of `ExamQuestion.maxMarks`:
  $$\text{Total Exam Marks} = \sum_{q \in \text{questions}} q.\text{maxMarks}$$
- `WrittenExam.passingPercentage` (default 60%) defines the passing threshold:
  $$\text{Passing Threshold Marks} = \text{Total Exam Marks} \times \frac{\text{passingPercentage}}{100}$$
- In `POST /api/exam/grade`, the instructor submits `marks` ($\le \text{Total Exam Marks}$) and `feedback`. The endpoint records the graded submission.

---

## 5. Certificate Issuance & Public Verification Rules

### 1. Certificate Issuance Rules
A certificate is generated/unlocked if and only if **all three** criteria are satisfied:
1. **100% Resource & Quiz Completion**: Every module resource has `completed = true`, and every module quiz has a passing submission (`percentage >= passingScore`, default 70%, via initial attempt or approved reset).
2. **Written Exam Submitted & Graded**: The programme written exam has `status = GRADED`.
3. **Passing Exam Marks**: The awarded marks satisfy $\text{marks} \ge \text{Passing Threshold Marks}$.

### 2. Public Verification Route: `/verify/[verificationId]`
- **Privacy Rule**: **Never renders user email address** (under any circumstances).
- **Public Output**: Displays `recipientName` (the historical snapshot saved at certificate creation), `programmeTitle`, `issuedAt`, `certificateNo`, and institutional accreditation verification seal.
- **Behavior After User Anonymisation**: Even after a user is anonymised in the database, `/verify/[verificationId]` continues to render the authentic `recipientName` snapshot, verifying the legitimate historical credential without exposing personal email or active identity.
- *Legal Note*: Retaining `recipientName` on `/verify` after a formal DPDP erasure request requires counsel's confirmation regarding credential authenticity vs. right to erasure.

---

## 6. User Exit Anonymisation Policy (Redaction Registry)

Upon account closure or DPDP erasure request, the system executes an in-place anonymisation routine (`isAnonymised = true`, `anonymisedAt = new Date()`):

| Entity / Field | Action on Anonymisation | Preserved / Redacted State |
|:---|:---|:---|
| `User.name` | **Redacted** | Overwritten with `"Former Learner"` |
| `User.email` | **Redacted** | Overwritten with `anonymised-<cuid>@anonymised.invalid` (RFC 2606 reserved TLD) |
| `User.passwordHash` | **Redacted** | Cleared to empty string `""` |
| `User.avatarUrl` | **Redacted** | Set to `null` |
| `User.tokenVersion` | **Updated** | Incremented, immediately terminating any active sessions |
| `ConsentLog.ipAddress` | **Redacted** | Set to `null` |
| `ChatMessage.message` (Direct) | **Redacted** | Direct messages overwritten with `"[Message deleted upon account anonymisation]"` |
| `ChatMessage.message` (Group) | **Anonymised Author** | Author rendered as `"Former Learner"`; cohort discussion text preserved for educational continuity |
| `ExamSubmission.answersJson` | **Scrubbed & Preserved**| Retained for academic accreditation; reviewed and scrubbed of any personal contact markers |
| `Feedback.comments` | **Preserved (Decoupled)**| Constructive feedback comments preserved; `authorId` severed from user profile |
| `Certificate.recipientName` | **Preserved Snapshot** | Persists as issued to validate credential authenticity on `/verify` (subject to counsel's confirmation) |

---

## 7. Endpoint-by-Role Permissions Table & Ownership Checks

Every endpoint enforces authentication, strict role checks, and programme ownership:

| Endpoint | Method | Allowed Roles | Ownership & Field Filtering Rules |
|:---|:---:|:---:|:---|
| `/api/programmes` | GET | All Authenticated | Returns active (non-archived) programmes |
| `/api/admin/programmes` | POST/PUT | `ADMIN` | Create or update programmes; archival via `archivedAt` |
| `/api/modules/[id]` | GET | All Authenticated | Learner must have active `Enrollment`; Instructor must be assigned via `ProgrammeInstructor` |
| `/api/progress/resource/start` | POST | `LEARNER` | Learner must be enrolled in programme; idempotent start |
| `/api/progress/resource/complete`| POST | `LEARNER` | Enforces server-side elapsed duration against stored `startedAt` |
| `/api/quiz/[id]` | GET | `LEARNER` | **Strips `correctIndex`**. Learner must be enrolled |
| `/api/quiz/[id]/key` | GET | `INSTRUCTOR`, `ADMIN` | Returns `correctIndex`; instructor must be assigned to programme |
| `/api/quiz/submit` | POST | `LEARNER` | Single-attempt enforcement; server scores against DB |
| `/api/quiz/reset` | POST | `INSTRUCTOR`, `ADMIN` | Resets failed quiz attempt for a learner with logged reason |
| `/api/exam/submit` | POST | `LEARNER` | Enrolled learner submits written answers |
| `/api/exam/submissions` | GET | `INSTRUCTOR`, `ADMIN` | Lists programme submissions; instructor must be assigned to programme |
| `/api/exam/grade` | POST | `INSTRUCTOR`, `ADMIN` | Assigned instructor inputs marks ($\le \sum \text{maxMarks}$) and feedback |
| `/api/chat` | GET/POST | `LEARNER`, `INSTRUCTOR`| Group chat: must be enrolled or assigned. Direct chat: learner can only message instructor assigned to their enrolled programme |
| `/api/announcements` | GET | All Authenticated | Returns global announcements + announcements for enrolled/assigned programmes |
| `/api/announcements` | POST | `INSTRUCTOR`, `ADMIN` | Assigned instructors and admins can publish |
| `/api/feedback` | POST | `LEARNER` | Anonymous submission scoped to module or programme |
| `/api/feedback/mine` | GET | `LEARNER` | Returns only learner's own feedback history |
| `/api/feedback` | GET | `INSTRUCTOR` | **Author fields omitted by API**. Shows date only (`YYYY-MM-DD`, time stripped). Restricted to assigned programmes |
| `/api/admin/feedback` | GET | `ADMIN` | Full administrative audit view with author details |
| `/api/certificate/[progId]` | GET | `LEARNER`, `ADMIN` | Generated only if 100% completion + graded exam passing threshold |
| `/api/verify/[verificationId]` | GET | Public (No Auth) | Public certificate credential verification (email is never returned) |
| `/api/admin/modules` | POST/PUT/DEL| `ADMIN` | Full CRUD for modules with fractional sorting |
| `/api/admin/resources` | POST/PUT/DEL| `ADMIN` | Full CRUD for module resources and reading timers |
| `/api/admin/quizzes` | POST/PUT/DEL| `ADMIN` | Full CRUD for quizzes and question answer keys |
| `/api/admin/faqs` | POST/PUT/DEL| `ADMIN` | Full CRUD for module FAQs |
| `/api/admin/exams` | POST/PUT/DEL| `ADMIN` | Full CRUD for programme written exam questions |
| `/api/admin/users` | ALL | `ADMIN` | Manage users, roles, and trigger user anonymisation |
| `/api/admin/upload` | POST | `ADMIN`, `INSTRUCTOR` | Validates MIME, generates UUID filename, serves `nosniff` |
| `/api/admin/reports/export` | GET | `ADMIN` | Aggregated progress and CSV export |

---

## 8. Complete Route Map (Next.js App Router)

```
app/
├── (auth)/
│   ├── login/                      # Ikaai branded login with progressive rate-limiting & hero banner
│   └── reset-password/            # Secure non-enumerating token-based password reset
├── (portal)/
│   ├── layout.tsx                  # Responsive shell (Drawer/Sidebar, Programme switcher)
│   ├── dashboard/                  # Enrolled programme overview & next actions
│   ├── programmes/[id]/            # Programme view with fractional-sorted module cards
│   ├── modules/[id]/               # Module view: Objectives, Resources, Timer, Quiz, FAQs
│   ├── exam/[programmeId]/         # Written exam submission & instructor evaluation view
│   ├── chat/                       # Programme channel & direct instructor messaging
│   ├── announcements/              # Rich announcement feed with author role badges
│   ├── feedback/                   # Anonymous feedback form (2000 chars) & personal history
│   ├── grades/                     # Grade report (A-D %, quiz average, exam status)
│   ├── certificate/[progId]/       # Verified ISO 9001:2015-badged Certificate of Completion
│   └── settings/                   # Name, avatar, dark/light theme, notification preferences
├── verify/[verificationId]/        # Public certificate credential verification page
├── admin/
│   ├── layout.tsx                  # Admin workspace navigation
│   ├── programmes/                 # CMS: Programmes, instructors, soft archival
│   ├── modules/                    # CMS: Modules, fractional sortOrder
│   ├── resources/                  # CMS: Resources, reading timers, uploads
│   ├── quizzes/                    # CMS: Quizzes, question answer keys, resets
│   ├── faqs/                       # CMS: Module FAQs
│   ├── exams/                      # CMS: Written exams & question max marks
│   ├── users/                      # User & role management, exit anonymisation
│   ├── feedback/                   # Audit view of feedback with full compliance tracking
│   └── reports/                    # Cohort progress analytics & CSV export
└── api/
    ├── auth/[...nextauth]/         # NextAuth session handlers & tokenVersion check
    ├── auth/reset-password/        # Tokenized non-enumerating password reset
    ├── programmes/                 # Enrolment-checked programme metadata
    ├── modules/[id]/               # Enrolment-checked module details
    ├── progress/resource/start/    # Idempotent start timer recording
    ├── progress/resource/complete/ # Validates elapsed time from DB startedAt
    ├── quiz/[id]/                  # Fetches quiz questions WITHOUT correctIndex
    ├── quiz/[id]/key/              # Instructor/Admin key endpoint WITH correctIndex
    ├── quiz/submit/                # Server-scored single-attempt quiz submission
    ├── quiz/reset/                 # Instructor/Admin single-attempt reset endpoint
    ├── exam/submit/                # Enrolled learner exam submission
    ├── exam/submissions/           # Listing of submissions for assigned instructors
    ├── exam/grade/                 # Assigned instructor exam evaluation
    ├── chat/                       # Programme-scoped chat with recipient relations
    ├── announcements/              # Announcement feed (GET) & publish (POST)
    ├── feedback/                   # Anonymous submission (POST) & assigned instructor view (GET)
    ├── feedback/mine/              # Learner's own feedback history
    ├── certificate/[progId]/       # Certificate generation & issuance check
    ├── verify/[verificationId]/    # Public verification lookup
    ├── admin/programmes/           # Admin programme CRUD
    ├── admin/modules/              # Admin module CRUD
    ├── admin/resources/            # Admin resource CRUD
    ├── admin/quizzes/              # Admin quiz CRUD
    ├── admin/faqs/                 # Admin FAQ CRUD
    ├── admin/exams/                # Admin written exam CRUD
    ├── admin/users/                # Admin user management & anonymisation
    ├── admin/feedback/             # Admin feedback audit view
    ├── admin/upload/               # MIME-validated file upload to FileAsset
    └── admin/reports/export/       # CSV cohort report export
```

---

## 9. Seed Data Scope & Production Safeguards

### Production Guard
```typescript
if (process.env.NODE_ENV === 'production') {
  throw new Error('FATAL: Seeding demo accounts with static passwords is strictly blocked in production environments.');
}
```

### 1. Seed Programmes (4 Fully Populated + 4 Config Placeholders)
1. **HR** (Tag: `#7C3AED`):
   - Modules: Onboarding & Code of Conduct, Talent Acquisition in Impact Sector, Field Staff Payroll & Logistics, People Development & Appraisals.
   - Enrolled: **Sunita Rao** (`hr.learner@ikaaiindia.in`) at **0% progress** (enrolled to validate cross-programme security).
2. **Data Analyst** (Tag: `#0B7285`):
   - Modules: Survey Data Cleaning, Statistical Analysis with SPSS/R, Analytical Dashboards, Triangulation & Quality Checks.
   - Enrolled: **Rahul Verma** (`analyst.learner@ikaaiindia.in`) at **15% progress**.
3. **Research** (Tag: `#00511E`):
   - Modules: Digital Workspace & Security, Company Overview & Culture, Monitoring & Evaluation Basics, Field Data Collection, Data Analysis & Reporting.
   - Enrolled: **Priya Sharma** (`learner@ikaaiindia.in`) at **45% progress**.
4. **Field Operations** (Tag: `#B45309`):
   - Modules: Household Sampling Techniques, Field Safety & Logistics, Tablet Survey Tools & Offline Sync, Community Stakeholder Protocols.
   - Enrolled: **Ananya Sen** (`field.learner@ikaaiindia.in`) at **90% progress** with Written Exam **Submitted** awaiting grading.
5. **Config Placeholders**:
   - `Design` (`#BE185D`)
   - `Social Media` (`#C2410C`)
   - `Business Development` (`#0284C7`)
   - `Content Writing` (`#4338CA`)

### 2. Demo Users & Progress Levels
- **Admin**: Deepak Joshi (`admin@ikaaiindia.in` / `Admin@1234`) — Head of People & Academy Director.
- **Instructor 1**: Dr. Vikram Mehta (`instructor@ikaaiindia.in` / `Instructor@1234`) — Lead Research Methodologist (assigned to Research & Field Operations).
- **Instructor 2**: Neha Kapoor (`hr.instructor@ikaaiindia.in` / `Instructor@1234`) — HR & People Lead (assigned to HR).
- **Learners**:
  - Sunita Rao (`hr.learner@ikaaiindia.in` / `Learner@1234`) — HR (0% completion; baseline test account).
  - Priya Sharma (`learner@ikaaiindia.in` / `Learner@1234`) — Research (45% completion, modules 0-1 complete, 2 in progress).
  - Rahul Verma (`analyst.learner@ikaaiindia.in` / `Learner@1234`) — Data Analyst (15% completion, module 0 complete).
  - Ananya Sen (`field.learner@ikaaiindia.in` / `Learner@1234`) — Field Operations (90% completion, all modules complete, written exam submitted).

---

## 10. Automated Testing Strategy

A dedicated test suite validates all critical invariants:

1. **Timer Elapsed Server Validation**:
   - `test('POST /api/progress/resource/complete fails if startedAt is absent in DB')`: expects `400 Bad Request`.
   - `test('POST /api/progress/resource/start is idempotent and keeps first startedAt')`: calls `/start` at $T$, calls `/start` at $T+5s$; verifies DB `startedAt` remains $T$.
   - `test('POST /api/progress/resource/complete ignores client timestamp and enforces DB duration')`: passes forged `{ startedAt: Date.now() - 60000 }` with DB showing 2s elapsed; expects `400 Bad Request`.
   - `test('POST /api/progress/resource/complete succeeds when server elapsed time >= 28s')`: mocks DB `startedAt = Date.now() - 32000`; expects `200 OK`.
2. **Quiz Security & Server Scoring**:
   - `test('GET /api/quiz/:id for learner strips correctIndex')`: verifies `res.body.questions.every(q => q.correctIndex === undefined)`.
   - `test('GET /api/quiz/:id/key returns correctIndex for assigned instructor and 403 for learner')`: verifies RBAC gate.
   - `test('POST /api/quiz/submit computes score strictly on server and blocks retakes without reset')`: expects `409 Conflict` on second attempt.
   - `test('POST /api/quiz/reset allows second attempt when authorized by instructor')`: verifies `attemptNo = 2` allowed.
3. **Cross-Programme Enrolment & Ownership Check**:
   - `test('Sunita Rao (HR learner) receives 403 when requesting Research module')`: expects `403 Forbidden`.
   - `test('Instructor not assigned to Field Operations receives 403 when grading Field exam')`: expects `403 Forbidden`.
4. **Chat Access Rules**:
   - `test('Learner cannot send direct message to instructor not assigned to their programme')`: expects `403 Forbidden`.
   - `test('Non-enrolled user cannot read or post to programme chat')`: expects `403 Forbidden`.
5. **Certificate Issuance & Verification Privacy**:
   - `test('Certificate issuance rejected if completion < 100% or exam marks < passing threshold')`: expects `400 Bad Request`.
   - `test('GET /verify/:id returns recipientName snapshot and never exposes email address')`: verifies `res.body.email === undefined` and `recipientName` is present.
6. **Progressive Rate Limiting**:
   - `test('4th and 5th failed logins receive artificial progressive delay')`: verifies server delay.
   - `test('6th failed login requires CAPTCHA / cool-off')`: verifies rate limiting gate.
7. **Upload Validation**:
   - `test('Upload of .exe or file > 10MB rejected with 400')`: verifies MIME and size gate.

---

## 11. Data Governance & DPDP Support

This system is **designed to support DPDP compliance** (Digital Personal Data Protection Act, 2023) through technical safeguards:

1. **Notice & Consent Logging (`ConsentLog`)**:
   - Consent dialog presented upon initial login for intern training evaluation and credential verification.
2. **Data Minimization & Redaction on Exit**:
   - Anonymisation routine permanently redacts email, password, and IP address while retaining essential aggregate metrics.
3. **Grievance Redressal Contact (To be confirmed by Ikaai and counsel)**:
   - **Data Protection & Grievance Officer**: *To be confirmed by Ikaai and counsel* (Placeholder: `grievance@ikaaiindia.in`).
   - **Corporate Entity**: Ikaai India Research Pvt. Ltd. (Address: *To be confirmed by Ikaai and counsel*).
   - **Response Timelines**: *To be confirmed by Ikaai and counsel*.
4. **Data Retention Schedule (To be confirmed by Ikaai and counsel)**:
   - Active internship records retained during enrolment and for a period *to be confirmed by Ikaai and counsel* for credential verification, after which anonymisation is executed.
5. **Breach Notification Protocol (To be confirmed by Ikaai and counsel)**:
   - System audit logs track unauthorized access events for reporting to regulatory authorities and data principals within timelines *to be confirmed by Ikaai and counsel*.
