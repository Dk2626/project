# URAV — Careers Platform (Next.js full-stack)

Students register (with a resume PDF), log in, browse jobs and webinars, and apply.
Admins post jobs and webinars and see every applicant with a live status they control.

## What's included

- **Authentication** — email/password signup and login, passwords hashed with bcrypt,
  sessions stored in a signed **JWT httpOnly cookie**. Two roles: `student` and `admin`.
- **MongoDB** via Mongoose — users, jobs, webinars and applications.
- **Resume upload to AWS S3** — the PDF is uploaded server-side and the resulting
  **S3 URL is stored in MongoDB** on the user record and snapshotted onto each application.
- **Admin dashboard** — add / edit / delete jobs and webinars, and view the full list
  of students who applied, with resume links and a status dropdown.
- **Student dashboard** — shows the jobs applied to and webinars registered for, each
  with its current status.
- **Login-gated applying** — the Apply / Register button sends logged-out users to
  `/login?redirect=...` and returns them to finish applying.

## Tech stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- MongoDB + Mongoose
- AWS S3 (`@aws-sdk/client-s3`)
- bcryptjs + jsonwebtoken

## 1. Install

```bash
npm install
```

## 2. Configure environment

Copy `.env.example` to `.env.local` and fill it in:

```bash
cp .env.example .env.local
```

| Variable | What it's for |
| --- | --- |
| `MONGODB_URI` | MongoDB connection string (local or Atlas) |
| `JWT_SECRET` | Long random string for signing sessions — `openssl rand -base64 48` |
| `AWS_REGION` / `AWS_S3_BUCKET` | Your S3 bucket and its region |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | IAM credentials with `s3:PutObject` on the bucket |
| `AWS_S3_PUBLIC_BASE_URL` | *(optional)* CDN/custom domain in front of the bucket |
| `AWS_S3_HERO_BUCKET` | *(optional)* Public bucket for the homepage hero slider images **only** — defaults to `AWS_S3_BUCKET` |
| `AWS_S3_HERO_PUBLIC_BASE_URL` | *(optional)* CDN/custom domain in front of the hero bucket |
| `AWS_S3_WEBINAR_BUCKET` | *(optional)* Public bucket for webinar cover images — defaults to `AWS_S3_BUCKET` |
| `AWS_S3_WEBINAR_PUBLIC_BASE_URL` | *(optional)* CDN/custom domain in front of the webinar bucket |
| `ADMIN_SETUP_KEY` | Secret used once to create the first admin (see below) |
| `APP_URL` | Public site URL used to build password-reset links, e.g. `https://uravctc.com` |
| `SMTP_HOST` / `SMTP_PORT` | Mail server, e.g. `smtp.gmail.com` / `587` |
| `SMTP_USER` / `SMTP_PASS` | Mailbox login — for Gmail this is an **app password**, not the account password |
| `MAIL_FROM` | *(optional)* From header, e.g. `URAV <no-reply@uravctc.com>` — defaults to `SMTP_USER` |

### S3 bucket setup (so resume links open)

Resumes are uploaded with their `Content-Type`. To let the stored URLs open in a
browser, either make objects public-readable via a bucket policy, or serve them
through CloudFront and set `AWS_S3_PUBLIC_BASE_URL`. A minimal read policy for the
`resumes/` prefix:

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "PublicReadResumes",
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::YOUR_BUCKET/resumes/*"
  }]
}
```

The current flow uploads server-side, so S3 CORS isn't required for uploading.

## 3. Run

```bash
npm run dev      # http://localhost:3000
npm run build && npm start   # production
```

## 4. Create the first admin

**Option A — script (no server needed):**

```bash
ADMIN_EMAIL=you@urav.com ADMIN_PASSWORD='StrongPass123' node scripts/seed-admin.mjs
```

**Option B — seed endpoint** (also seeds sample jobs/webinars if the collections are empty):

```bash
curl -X POST http://localhost:3000/api/admin/seed \
  -H "x-setup-key: <your ADMIN_SETUP_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"email":"you@urav.com","password":"StrongPass123"}'
```

Then log in at `/login`. Admins land on `/admin`; students land on `/dashboard`.
Default seed admin if you send no body: `admin@urav.com` / `Admin@12345`.

## Routes

Pages: `/` · `/login` · `/register` · `/jobs` · `/jobs/[id]` · `/webinars` ·
`/dashboard` (student) · `/admin`, `/admin/jobs`, `/admin/webinars`, `/admin/applications`

API (all under `/api`):

| Method + path | Access | Purpose |
| --- | --- | --- |
| `POST /auth/register` | public | create student, upload resume to S3, log in |
| `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` | public | session management |
| `GET /jobs`, `GET /jobs/[id]` | public | list / view jobs |
| `POST /jobs`, `PUT/DELETE /jobs/[id]` | admin | manage jobs |
| `GET /webinars`, `GET /webinars/[id]` | public | list / view webinars |
| `POST /webinars`, `PUT/DELETE /webinars/[id]` | admin | manage webinars |
| `POST /applications` | student | apply to a job / register for a webinar |
| `GET /applications` | auth | student sees own; admin sees all |
| `PUT /applications/[id]` | admin | update status |
| `DELETE /applications/[id]` | owner/admin | withdraw / remove |
| `GET /admin/stats` | admin | dashboard counts |
| `POST /admin/seed` | setup key | bootstrap admin + samples |

## How the pieces fit

```
Browser ──> Next.js Route Handlers (nodejs runtime)
                |            |
                |            +-- Mongoose --> MongoDB   (users, jobs, webinars, applications)
                |            +-- AWS SDK  --> S3        (resume PDFs; URL saved in MongoDB)
                +-- httpOnly JWT cookie (role: student | admin)

middleware.ts guards /dashboard and /admin (redirects logged-out users);
API routes enforce the real auth + role checks (requireUser / requireAdmin).
```

## Security notes

- Passwords are bcrypt-hashed; the field is `select:false` so it never leaves the DB by accident.
- The session token is httpOnly (JS can't read it), `secure` in production, `sameSite=lax`.
- AWS credentials live only on the server; uploads never expose them to the browser.
- Every mutating endpoint re-checks the session server-side — the client guards are UX only.
- Unique indexes prevent a user from applying to the same job/webinar twice.

## Structure

```
app/
  api/...            route handlers (auth, jobs, webinars, applications, admin)
  login, register    auth pages
  jobs, jobs/[id]    job list + detail
  webinars           webinar list
  dashboard          student's applications + status
  admin/...          admin shell, overview, jobs, webinars, applications
components/           Navbar (auth-aware), ApplyButton, StatusBadge, AuthProvider, ui/*
lib/
  db.ts              cached Mongoose connection
  s3.ts              S3 upload + PDF validation
  auth.ts            hashing, JWT, session helpers
  api.ts             response envelope + auth guards
  client.ts, types.ts  client fetch wrapper + shared types
models/              User, Job, Webinar, Application
middleware.ts        route protection
scripts/seed-admin.mjs
```
