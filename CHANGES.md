# URAV — change summary

Everything below is implemented, typechecks clean (`npx tsc --noEmit`) and
builds (`next build`).

---

## 1 & 2 · Superadmin role, and superadmin-only admin creation

**Roles are now:** `student | recruiter | admin | superadmin`

- `models/User.ts` — enum extended; added compound indexes
  (`role + createdAt`, `role + approvalStatus + createdAt`) so the paginated
  admin lists stay fast.
- `lib/api.ts` — two guards:
  - `requireAdmin()` → admin **or** superadmin
  - `requireSuperAdmin()` → superadmin only

  Both re-read the role **from MongoDB**, not from the JWT. The role you
  already changed in the database therefore takes effect immediately — no
  logout/login needed. `/api/auth/me` does the same top-up.
- `isAdminRole()` replaces every `role === "admin"` comparison across the
  API and the layouts, so superadmins aren't locked out of normal admin work.

**New endpoints (superadmin only):**

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/admin/admins` | List admins + superadmins (paginated, searchable) |
| POST | `/api/admin/admins` | Create an admin |
| PUT | `/api/admin/admins/[id]` | Edit name/phone, or reset password |
| DELETE | `/api/admin/admins/[id]` | Remove an admin |

**New screen:** `/admin/admins` — create modal, password reset, remove.
The sidebar link is hidden for ordinary admins (`superOnly` flag in
`app/admin/layout.tsx`), and a "Superadmin" badge shows under the logo.

> New accounts are **hardcoded to the `admin` tier**. The superadmin tier is
> only settable directly in the database, so a second superadmin can never be
> minted through the UI. `DELETE` also refuses to touch a superadmin row or
> your own account.

---

## 3 · Student details editable in the admin dashboard

- `GET /api/admin/students/[id]` — any admin
- `PUT /api/admin/students/[id]` — **superadmin only**
- `DELETE /api/admin/students/[id]` — **superadmin only**; also removes their
  applications and deletes their CV from S3

Email *is* editable here (unlike the student's own `/api/profile`, where it's
locked) so you can fix a mistyped login — with a validity + uniqueness check.
Password and role stay non-editable.

**UI:** `components/StudentEditModal.tsx`, wired to Edit / Delete buttons on
`/admin/students` that only render for superadmins.

---

## 4 & 5 · CV update — student side and admin side — with old-file cleanup

- `lib/s3.ts` — added `deleteFromS3()`, `deleteResume()` and `keyFromUrl()`.
  That last one recovers an object key by parsing the stored URL, so records
  created before `resumeKey` existed can still be cleaned up.
- `lib/resume.ts` — shared replace logic used by both endpoints.

**Ordering is deliberate:** upload the new file → save the new pointer →
*then* delete the old object. If the upload or the DB write fails, the student
still has their existing CV. Worst case is one orphaned file; never a student
left with no resume. Cleanup failures are logged, not thrown — a dead S3
delete must not fail the user's upload.

| Method | Route | Who |
|---|---|---|
| POST / DELETE | `/api/profile/resume` | The signed-in user, their own CV |
| POST / DELETE | `/api/admin/students/[id]/resume` | Any admin, on a student's behalf |

**UI:** `components/ResumeUpload.tsx` — full layout in the student profile
card, compact inline version in each admin student row. PDF only, 5MB cap,
validated client- and server-side.

---

## 6 · Recruiters edit their own profile

- `/api/profile` PUT now picks its whitelist by role:
  - **student** → the existing education fields
  - **recruiter** → name, phone, designation, company name / website /
    location / industry / size / about, LinkedIn
  - **admin** → name, phone

  `approvalStatus` is deliberately absent from the recruiter list — a
  recruiter can never approve themselves; only an admin can flip it.
- **New:** `components/RecruiterProfileCard.tsx` and `/recruiter/profile`,
  plus the "My Profile" sidebar entry. Their approval state is displayed as a
  read-only badge.

---

## 7 · Pagination (server-side)

`lib/api.ts` gained `pageParams()`, `paginated()` and `searchFilter()`.

**Backwards compatible by design:** a route returns the envelope
`{ items, total, page, limit, pages }` **only when `?page=` is present**.
Without it the response shape is unchanged — so every public-website
component keeps working untouched.

Paginated + server-side searched: **students, recruiters, applications, jobs,
admins.** Search and tab filtering moved out of the browser and into MongoDB,
so the dashboard downloads one page at a time instead of the whole table.

- `lib/usePaginatedList.ts` — debounced search (350ms), stale-response
  guarding (a slow earlier request can't overwrite a newer one), and an
  automatic reset to page 1 whenever a filter or the search term changes.
  Page changes dim the existing rows rather than re-flashing the skeleton.
- `components/ui/Pagination.tsx` — page numbers with ellipsis collapsing,
  a per-page selector (10/25/50/100), and a "Showing 1–10 of 84" line.
- Tab counts come back from the API alongside the page, so they stay accurate
  across pages rather than counting only what's loaded.
- Applications search spans applicant *and* job/webinar — those live in other
  collections, so the route resolves matching ids first, then constrains the
  query (combined with `$and` so a recruiter's own-jobs scoping is preserved).

---

## 8 · Shimmer loading states

`components/ui/Skeleton.tsx` — a real gradient sweep (`animate-shimmer`,
keyframes in `tailwind.config.ts`), not `animate-pulse`, which reads as a
flashing box. Composed variants: `SkeletonStats`, `SkeletonRecordList`,
`SkeletonList`, `SkeletonTable`, `SkeletonProfile`, `SkeletonText`,
`SkeletonPage`. Shapes mirror the real content, so the layout doesn't jump
when data lands. `prefers-reduced-motion` degrades it to a static tint.

**Every `animate-pulse` in the codebase is gone.** Applied to: both dashboard
layouts, admin overview / students / recruiters / recruiter detail /
applications / jobs / webinars, student dashboard, recruiter overview / jobs /
applicants, public jobs list + detail, webinars, and the navbar.

---

## Before you deploy

1. **IAM:** the bucket policy needs `s3:DeleteObject` alongside `s3:PutObject`,
   or the CV cleanup will silently no-op (it logs and continues by design).
2. **Existing CVs** uploaded before this change have no `resumeKey`. They're
   handled by `keyFromUrl()`, which assumes the standard
   `https://<bucket>.s3.<region>.amazonaws.com/<key>` or path-style form. If
   you serve resumes through a CDN, set `AWS_S3_PUBLIC_BASE_URL` and confirm
   the parse works before relying on the cleanup.
3. **Your superadmin session:** since `/api/auth/me` now reads the role from
   the database, the Admins link should appear on your next page load without
   a re-login.

## Not done

Recruiter applicants and recruiter jobs are still filtered client-side —
per-recruiter datasets are small, and the API already supports `?page=` if you
want them switched over. Say the word.

---

## Student consultation form

A student (or a logged-out visitor) can send a consultation request from
`/consultation`; admins **and** superadmins read and reply to them at
`/admin/consultations`.

**New model:** `models/Consultation.ts`

| Field | Notes |
|---|---|
| `user` | Set only when a signed-in **student** submits — this is what links a request to a student record and lets them see the reply |
| `name` / `email` / `phone` | Stored on the document so a logged-out visitor is still contactable |
| `studentType`, `institution` | School / College / Other + where they study |
| `topic`, `preferredMode`, `preferredTime` | Career Guidance, Course Selection, … / Email, Phone Call, Video Call / free text |
| `message` | Required, 10–4000 characters |
| `status` | `New → In Progress → Responded → Closed` |
| `response` | The team's reply — **visible to the student** |
| `internalNote` | Admin-only, never returned by the student endpoint |
| `handledBy`, `respondedAt` | Who last touched it, and when a reply was written |

Indexed on `status + createdAt` and `createdAt` so the admin list paginates
without a collection scan.

**New endpoints:**

| Method | Route | Access | Purpose |
|---|---|---|---|
| POST | `/api/consultations` | public | Submit a request |
| GET | `/api/consultations` | logged in | The student's own requests (internal note stripped) |
| GET | `/api/admin/consultations` | admin + superadmin | Paginated, searchable, `?status=` filtered, with tab counts |
| GET | `/api/admin/consultations/[id]` | admin + superadmin | One request in full |
| PATCH | `/api/admin/consultations/[id]` | admin + superadmin | Status, reply, internal note |
| DELETE | `/api/admin/consultations/[id]` | **superadmin only** | Remove a request |

POST is deliberately open so someone can ask a question before registering.
It still validates name / email / message length, and refuses a second
request from the same address inside 60 seconds so a double-click doesn't
duplicate the row. An admin or recruiter submitting the form is **not**
linked via `user` — only students are.

**New screens:**

- `/consultation` — public page: the form (pre-filled from the profile when
  signed in) plus **My requests**, which shows each request's status and the
  team's reply. The requests block only renders for a signed-in student.
- `/admin/consultations` — tabs (All / New / In Progress / Responded /
  Closed) with live counts, debounced server-side search across name, email,
  phone, institution, message and topic, and the shared `Pagination` control.
  Each card has an inline status dropdown, a reply box, an internal note box,
  a `mailto:` shortcut and — for a registered sender — a link straight to
  their CV. Saving a non-empty reply flips the status to **Responded**
  automatically unless the request is already Closed. Delete shows only for
  a superadmin.

**Wiring:**

- `app/admin/layout.tsx` — "Consultations" sidebar entry (both admin tiers).
- `lib/data.ts` — "Consultation" added to the public navbar.
- `app/api/admin/stats/route.ts` — returns `consultations` and
  `newConsultations`.
- `app/admin/page.tsx` — a Consultations stat tile, a banner when unanswered
  requests are waiting, and a summary card.
- `app/dashboard/page.tsx` — a CTA pointing students at `/consultation`.
- `components/StatusBadge.tsx` — colours for the four consultation statuses.
- `lib/types.ts` — `ConsultationRecord`, `ConsultationStatus`.

---

## 8 · Homepage hero is now a managed slider

`components/Hero.tsx` was a single hardcoded panel. It is now a slider whose
slides live in MongoDB and whose images live in S3, managed from a
**superadmin-only** dashboard screen.

**Each slide holds:** a title (line breaks preserved), a description, up to
two buttons (label + link), a **website image**, a **mobile image**, a text
colour, a display position and a show/hide flag.

### New model — `models/HeroSlide.ts`

| Field | Notes |
|---|---|
| `title` | Required. `\n` renders as a line break in the slider. |
| `description` | Optional paragraph under the title. |
| `ctaLabel` / `ctaHref` | Filled navy button. Renders only when both are set. |
| `secondaryCtaLabel` / `secondaryCtaHref` | Outline button, same rule. |
| `desktopImageUrl` / `desktopImageKey` | Required. Used from `md` (768px) up. |
| `mobileImageUrl` / `mobileImageKey` | Optional. Used below 768px; falls back to the desktop image. |
| `textTone` | `light` (white copy + dark scrim) or `dark` (navy copy + light scrim). |
| `order` | Ascending display position; ties break on `createdAt`. |
| `active` | Hidden slides stay in the dashboard but leave the site. |

Indexed on `{ active, order, createdAt }` — the homepage query hits it directly.

The **key** is stored alongside every URL so replacing an image can delete the
old object from the bucket instead of leaking it.

### New endpoints

| Method | Route | Who |
|---|---|---|
| GET | `/api/hero-slides` | Public — active slides in order |
| GET | `/api/hero-slides?all=1` | Public — includes hidden ones (dashboard) |
| POST | `/api/hero-slides` | **Superadmin** — multipart create |
| PUT | `/api/hero-slides/[id]` | **Superadmin** — multipart (image change) or JSON (fields only) |
| DELETE | `/api/hero-slides/[id]` | **Superadmin** — also deletes both images from S3 |
| PUT | `/api/hero-slides/reorder` | **Superadmin** — `{ ids: [...] }`, position becomes `order` |
| POST | `/api/hero-slides/seed` | **Superadmin** — copies the built-in defaults into the DB |

Ordering is sent as the whole list rather than as a two-row swap, so a
half-applied reorder can't leave two slides fighting over one position.

On an image replace the upload happens **first**, the new URL is saved, and
only then is the old object deleted — a failure mid-way leaves the slide with
its previous picture rather than none.

### S3 — `lib/s3.ts`, `lib/heroImages.ts`

- `uploadToS3` / `deleteFromS3` / `keyFromUrl` / `isS3Configured` now take an
  optional bucket, so hero images can go to their **own** bucket while resumes
  stay where they are. Existing callers are untouched.
- `AWS_S3_HERO_BUCKET` — optional. Falls back to `AWS_S3_BUCKET`; either way
  the images are keyed under the `hero/` prefix.
- `AWS_S3_HERO_PUBLIC_BASE_URL` — optional CloudFront/custom domain.
- `validateImage()` — JPG / PNG / WebP / AVIF / GIF, 8MB cap.
- Hero uploads get `Cache-Control: public, max-age=31536000, immutable`. Safe
  because every key carries a UUID, so a replacement is always a new URL.

The hero bucket must be **publicly readable** (marketing images are loaded by
every visitor's browser). Minimal policy for just the `hero/` prefix:

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "PublicReadHeroImages",
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::YOUR_HERO_BUCKET/hero/*"
  }]
}
```

The IAM user needs `s3:PutObject` and `s3:DeleteObject` on the same prefix.

### Default slides

`lib/heroDefaults.ts` holds three slides that render when the collection is
empty, so the homepage is never blank on a fresh install:

1. **Empowering Careers. Building Futures.** — the existing
   `/hero-students.webp` photo and the original copy.
2. **Webinars** — `/public/hero/default-webinars-*.svg` (new, brand navy).
3. **Jobs** — `/public/hero/default-jobs-*.svg` (new, brand navy).

Each has a desktop and a mobile variant. They are plain files, not database
rows — the dashboard shows a **"Copy the built-in slides"** button that inserts
them as editable rows when you want to keep the layout but change the wording.

### The slider — `components/Hero.tsx`

- Full-bleed banner: `540px` on phones, `500px` on tablets, `580px` on large
  screens, with the copy over a gradient scrim.
- `<picture>` with a `(max-width: 767px)` source, so a phone downloads **only**
  the mobile image and a desktop **only** the wide one.
- Autoplays every 6s; pauses on hover, on focus within, and when the tab is in
  the background.
- Arrows (desktop), dots, left/right keys, and touch swipe.
- Honours `prefers-reduced-motion` — no autoplay, no slide transition.
- Only the first slide uses `<h1>`; the rest use `<h2>` styled the same, so the
  page keeps exactly one h1.
- Inactive slides are `aria-hidden` and their buttons are `tabIndex={-1}`, so
  tabbing doesn't wander into off-screen links. A visually-hidden live region
  announces the current slide.
- Shimmer skeleton while the slides load, matching the rest of the site.
- The two headline numbers from the old hero (**120+ webinars**, **2.5K+
  placed**) are kept as a small card row tucked under the slider. They're still
  hardcoded — delete the `<Stat>` block in `Hero.tsx` if you don't want them.

### New screen — `/admin/hero` ("Home slider")

Superadmin-only, hidden from ordinary admins via the `superOnly` flag in
`app/admin/layout.tsx` (the API enforces the same rule server-side). Ordinary
admins who navigate to the URL directly get an access notice.

Each row shows a desktop and a mobile thumbnail side by side, the title,
description, position, buttons and text colour, with controls to move up/down,
hide/show, edit and delete. The add/edit modal has both image pickers with live
previews, a "Remove" action on the mobile image to fall back to the desktop
one, and size hints (≈1600×620 wide, ≈800×1000 tall).
