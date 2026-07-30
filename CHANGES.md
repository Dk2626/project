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
