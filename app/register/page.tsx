"use client";

import { useState, type ReactNode, type InputHTMLAttributes } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/client";
import { useAuth } from "@/components/AuthProvider";
import type { AuthUser } from "@/lib/types";
import {
  GraduationCap,
  User,
  Mail,
  Phone,
  Calendar,
  Lock,
  Eye,
  EyeOff,
  Building2,
  BookOpen,
  Star,
  UploadCloud,
  Linkedin,
  Github,
  Video,
  Briefcase,
  Award,
  TrendingUp,
  Users,
  ChevronDown,
  CheckCircle2,
} from "lucide-react";

/* ---------- left-panel content ---------- */

const highlights = [
  { icon: Video, title: "Live Webinars", desc: "Learn from industry experts" },
  { icon: Briefcase, title: "Top Job Opportunities", desc: "Find the right role that fits you" },
  { icon: Award, title: "Certifications", desc: "Boost your skills and stand out" },
  { icon: TrendingUp, title: "Career Growth", desc: "Build, connect and grow your career" },
];

/* ---------- field primitives ---------- */

function Label({ htmlFor, children, required }: { htmlFor: string; children: ReactNode; required?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-slate-700">
      {children}
      {required && <span className="ml-0.5 text-danger">*</span>}
    </label>
  );
}

const fieldBase =
  "h-11 w-full rounded-md border bg-white text-sm text-dark placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  required?: boolean;
  icon?: ReactNode;
  error?: string;
}

function Field({ id, label, required, icon, error, className = "", ...props }: FieldProps) {
  return (
    <div>
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </span>
        )}
        <input
          id={id}
          className={`${fieldBase} ${icon ? "pl-10" : "px-3"} ${
            error ? "border-danger focus:ring-danger/30" : "border-slate-200"
          } pr-3 ${className}`}
          aria-invalid={!!error}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}

interface SelectFieldProps {
  id: string;
  label: string;
  required?: boolean;
  icon?: ReactNode;
  error?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: string[];
}

function SelectField({ id, label, required, icon, error, value, onChange, placeholder, options }: SelectFieldProps) {
  return (
    <div>
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </span>
        )}
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${fieldBase} appearance-none ${icon ? "pl-10" : "px-3"} pr-9 ${
            error ? "border-danger focus:ring-danger/30" : "border-slate-200"
          } ${value ? "text-dark" : "text-slate-400"}`}
          aria-invalid={!!error}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((o) => (
            <option key={o} value={o} className="text-dark">
              {o}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      </div>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div className="mb-5 mt-8 flex items-center gap-3 first:mt-0">
      <h2 className="whitespace-nowrap text-sm font-semibold uppercase tracking-wide text-primary">
        {children}
      </h2>
      <span className="h-px flex-1 bg-slate-100" />
    </div>
  );
}

/* ---------- form state ---------- */

const iconSm = "h-4 w-4";

const emptyErrors = {} as Record<string, string>;

export default function RegisterPage() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dob: "",
    gender: "",
    password: "",
    confirmPassword: "",
    college: "",
    degree: "",
    department: "",
    currentYear: "",
    graduationYear: "",
    cgpa: "",
    linkedin: "",
    github: "",
  });
  const [resumeName, setResumeName] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>(emptyErrors);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  const router = useRouter();
  const { setUser } = useAuth();

  const set = (key: keyof typeof form) => (v: string) =>
    setForm((f) => ({ ...f, [key]: v }));

  const gradYears = Array.from({ length: 8 }, (_, i) => `${2024 + i}`);

  function validate() {
    const e: Record<string, string> = {};
    if (!form.firstName.trim()) e.firstName = "First name is required";
    if (!form.lastName.trim()) e.lastName = "Last name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email";
    if (!form.phone.trim()) e.phone = "Phone number is required";
    if (!form.dob) e.dob = "Date of birth is required";
    if (!form.gender) e.gender = "Please select a gender";
    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 8) e.password = "Use at least 8 characters";
    if (!form.confirmPassword) e.confirmPassword = "Please confirm your password";
    else if (form.confirmPassword !== form.password) e.confirmPassword = "Passwords do not match";
    if (!form.college.trim()) e.college = "College / University is required";
    if (!form.degree) e.degree = "Please select a degree";
    if (!form.department.trim()) e.department = "Department is required";
    if (!form.currentYear) e.currentYear = "Select your current year";
    if (!form.graduationYear) e.graduationYear = "Select graduation year";
    if (!form.cgpa.trim()) e.cgpa = "CGPA / Percentage is required";
    if (!agreed) e.agreed = "Please accept the Terms of Service and Privacy Policy";
    return e;
  }

  async function handleSubmit() {
    setServerError("");
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setSubmitting(true);
    try {
      // Multipart so the resume PDF can be uploaded to S3 on the server.
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (resumeFile) fd.append("resume", resumeFile);

      const data = await api<{ user: AuthUser }>("/api/auth/register", {
        method: "POST",
        body: fd,
      });
      setUser(data.user);
      setSubmitted(true);
      if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
      // Send them to their dashboard shortly after the success confirmation.
      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 1200);
    } catch (err) {
      setServerError(
        err instanceof ApiError ? err.message : "Could not create your account. Please try again."
      );
      if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSubmitting(false);
    }
  }

  function onResumeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setResumeFile(null);
      setResumeName("");
      return;
    }
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setErrors((prev) => ({ ...prev, resume: "Only PDF files are allowed." }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, resume: "File must be 5MB or smaller." }));
      return;
    }
    setErrors((prev) => {
      const { resume, ...rest } = prev;
      return rest;
    });
    setResumeFile(file);
    setResumeName(file.name);
  }

  return (
    <main className="min-h-screen bg-light px-4 py-8 md:py-12">
      <div className="mx-auto grid w-full max-w-6xl overflow-hidden rounded-2xl bg-white shadow-xl lg:grid-cols-12">
        {/* ---------- LEFT: brand panel ---------- */}
        <aside className="relative hidden flex-col justify-between bg-gradient-to-b from-primary-light to-white p-8 lg:col-span-5 lg:flex xl:p-10">
          <div>
            {/* logo */}
            <Link href="/" className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-white shadow-md">
                <GraduationCap className="h-6 w-6" />
              </span>
              <span className="leading-tight">
                <span className="block font-heading text-2xl font-bold text-dark">URAV</span>
                <span className="block text-[10px] font-medium uppercase tracking-[0.25em] text-slate-400">
                  Learn · Grow · Succeed
                </span>
              </span>
            </Link>

            <h1 className="mt-10 font-heading text-3xl font-bold leading-tight text-dark xl:text-[34px]">
              Empowering Careers.
              <br />
              Building Futures.
            </h1>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-600">
              Join URAV and unlock endless opportunities. Learn, connect and grow with a platform
              trusted by thousands of learners and professionals.
            </p>

            <ul className="mt-8 space-y-4">
              {highlights.map(({ icon: Icon, title, desc }) => (
                <li key={title} className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-primary shadow-sm">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block font-heading text-sm font-semibold text-dark">{title}</span>
                    <span className="block text-xs text-slate-500">{desc}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* portrait + trust badge */}
          <div className="relative mt-8">
            <div className="aspect-[5/3] w-full overflow-hidden rounded-xl bg-primary-light shadow-md">
              {/* Dummy placeholder for now — replace src with a real image in /public. */}
              <img
                src="/placeholders/portrait.svg"
                alt="URAV learner — placeholder"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-3 right-3 flex items-center gap-3 rounded-xl bg-primary px-4 py-3 text-white shadow-lg">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/20">
                <Users className="h-5 w-5" />
              </span>
              <span className="leading-tight">
                <span className="block text-[11px] opacity-90">Trusted by</span>
                <span className="block font-heading text-lg font-bold">2.5K+ Users</span>
              </span>
            </div>
          </div>
        </aside>

        {/* ---------- RIGHT: form ---------- */}
        <section className="p-6 sm:p-8 lg:col-span-7 xl:p-10">
          {/* compact brand for small screens */}
          <Link href="/" className="mb-6 flex items-center gap-2 lg:hidden">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-primary text-white">
              <GraduationCap className="h-5 w-5" />
            </span>
            <span className="font-heading text-xl font-bold text-dark">URAV</span>
          </Link>

          <div className="mb-6 flex flex-wrap items-start justify-between gap-2">
            <div>
              <h1 className="font-heading text-2xl font-bold text-dark sm:text-[28px]">
                Student Registration
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Create your student account and start your journey with URAV.
              </p>
            </div>
            <p className="text-sm text-slate-500">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-primary hover:underline">
                Login
              </Link>
            </p>
          </div>

          {submitted && (
            <div className="mb-6 flex items-start gap-3 rounded-lg border border-success/30 bg-success/10 p-4">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
              <div className="text-sm">
                <p className="font-semibold text-dark">Account created</p>
                <p className="text-slate-600">
                  Welcome aboard, {form.firstName}! Taking you to your dashboard…
                </p>
              </div>
            </div>
          )}

          {serverError && (
            <div className="mb-6 flex items-start gap-3 rounded-lg border border-danger/30 bg-danger/10 p-4 text-sm text-danger">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 rotate-45" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Personal Information */}
          <SectionTitle>Personal Information</SectionTitle>
          <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field
              id="firstName"
              label="First Name"
              required
              placeholder="Enter first name"
              icon={<User className={iconSm} />}
              value={form.firstName}
              onChange={(e) => set("firstName")(e.target.value)}
              error={errors.firstName}
            />
            <Field
              id="lastName"
              label="Last Name"
              required
              placeholder="Enter last name"
              icon={<User className={iconSm} />}
              value={form.lastName}
              onChange={(e) => set("lastName")(e.target.value)}
              error={errors.lastName}
            />
            <Field
              id="email"
              label="Email Address"
              required
              type="email"
              placeholder="Enter email address"
              icon={<Mail className={iconSm} />}
              value={form.email}
              onChange={(e) => set("email")(e.target.value)}
              error={errors.email}
            />
            <Field
              id="phone"
              label="Phone Number"
              required
              type="tel"
              placeholder="Enter phone number"
              icon={<Phone className={iconSm} />}
              value={form.phone}
              onChange={(e) => set("phone")(e.target.value)}
              error={errors.phone}
            />
            <Field
              id="dob"
              label="Date of Birth"
              required
              type="date"
              icon={<Calendar className={iconSm} />}
              value={form.dob}
              onChange={(e) => set("dob")(e.target.value)}
              error={errors.dob}
            />
            <SelectField
              id="gender"
              label="Gender"
              required
              placeholder="Select gender"
              value={form.gender}
              onChange={set("gender")}
              options={["Female", "Male", "Non-binary", "Prefer not to say"]}
              error={errors.gender}
            />
          </div>

          {/* Account Security */}
          <SectionTitle>Account Security</SectionTitle>
          <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="password" required>
                Password
              </Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock className={iconSm} />
                </span>
                <input
                  id="password"
                  type={showPw ? "text" : "password"}
                  placeholder="Create a strong password"
                  value={form.password}
                  onChange={(e) => set("password")(e.target.value)}
                  aria-invalid={!!errors.password}
                  className={`${fieldBase} pl-10 pr-10 ${
                    errors.password ? "border-danger focus:ring-danger/30" : "border-slate-200"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPw ? <EyeOff className={iconSm} /> : <Eye className={iconSm} />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-danger">{errors.password}</p>}
            </div>

            <div>
              <Label htmlFor="confirmPassword" required>
                Confirm Password
              </Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock className={iconSm} />
                </span>
                <input
                  id="confirmPassword"
                  type={showConfirmPw ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={form.confirmPassword}
                  onChange={(e) => set("confirmPassword")(e.target.value)}
                  aria-invalid={!!errors.confirmPassword}
                  className={`${fieldBase} pl-10 pr-10 ${
                    errors.confirmPassword ? "border-danger focus:ring-danger/30" : "border-slate-200"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPw((v) => !v)}
                  aria-label={showConfirmPw ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirmPw ? <EyeOff className={iconSm} /> : <Eye className={iconSm} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-danger">{errors.confirmPassword}</p>
              )}
            </div>
          </div>

          {/* Education Information */}
          <SectionTitle>Education Information</SectionTitle>
          <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field
              id="college"
              label="College / University"
              required
              placeholder="Enter college or university"
              icon={<Building2 className={iconSm} />}
              value={form.college}
              onChange={(e) => set("college")(e.target.value)}
              error={errors.college}
            />
            <SelectField
              id="degree"
              label="Degree"
              required
              icon={<GraduationCap className={iconSm} />}
              placeholder="Select your degree"
              value={form.degree}
              onChange={set("degree")}
              options={["B.E / B.Tech", "B.Sc", "B.Com", "B.A", "BBA", "BCA", "M.E / M.Tech", "M.Sc", "MBA", "MCA", "Other"]}
              error={errors.degree}
            />
            <Field
              id="department"
              label="Department / Stream"
              required
              placeholder="Enter department"
              icon={<BookOpen className={iconSm} />}
              value={form.department}
              onChange={(e) => set("department")(e.target.value)}
              error={errors.department}
            />
            <SelectField
              id="currentYear"
              label="Current Year"
              required
              icon={<Calendar className={iconSm} />}
              placeholder="Select current year"
              value={form.currentYear}
              onChange={set("currentYear")}
              options={["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year", "Graduated"]}
              error={errors.currentYear}
            />
            <SelectField
              id="graduationYear"
              label="Graduation Year"
              required
              icon={<Calendar className={iconSm} />}
              placeholder="Select graduation year"
              value={form.graduationYear}
              onChange={set("graduationYear")}
              options={gradYears}
              error={errors.graduationYear}
            />
            <Field
              id="cgpa"
              label="CGPA / Percentage"
              required
              placeholder="Enter CGPA or %"
              icon={<Star className={iconSm} />}
              value={form.cgpa}
              onChange={(e) => set("cgpa")(e.target.value)}
              error={errors.cgpa}
            />
          </div>

          {/* Additional Information */}
          <SectionTitle>Additional Information (Optional)</SectionTitle>
          <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <Label htmlFor="resume">Resume Upload</Label>
              <label
                htmlFor="resume"
                className="flex h-11 cursor-pointer items-center gap-3 rounded-md border border-dashed border-slate-300 px-3 text-sm text-slate-500 transition-colors hover:border-primary hover:bg-primary-light/40"
              >
                <UploadCloud className="h-5 w-5 text-slate-400" />
                <span className="truncate">
                  {resumeName ? (
                    <span className="font-medium text-dark">{resumeName}</span>
                  ) : (
                    <>
                      <span className="font-medium text-dark">Upload Resume</span>
                      <span className="ml-1 text-xs text-slate-400">PDF only (Max 5MB)</span>
                    </>
                  )}
                </span>
              </label>
              <input
                id="resume"
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={onResumeChange}
              />
              {errors.resume && <p className="mt-1 text-xs text-danger">{errors.resume}</p>}
            </div>
            <Field
              id="linkedin"
              label="LinkedIn Profile"
              placeholder="Enter LinkedIn URL"
              icon={<Linkedin className={iconSm} />}
              value={form.linkedin}
              onChange={(e) => set("linkedin")(e.target.value)}
            />
            <Field
              id="github"
              label="GitHub Profile"
              placeholder="Enter GitHub URL"
              icon={<Github className={iconSm} />}
              value={form.github}
              onChange={(e) => set("github")(e.target.value)}
            />
          </div>

          {/* Terms */}
          <div className="mt-6">
            <label className="flex items-start gap-2.5 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/40"
              />
              <span>
                I agree to the{" "}
                <Link href="#" className="font-medium text-primary hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="#" className="font-medium text-primary hover:underline">
                  Privacy Policy
                </Link>
              </span>
            </label>
            {errors.agreed && <p className="mt-1 text-xs text-danger">{errors.agreed}</p>}
          </div>

          {/* Submit */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || submitted}
            className="mt-6 h-12 w-full rounded-md bg-primary font-medium text-white shadow-md transition-colors hover:bg-primary-hover disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2"
          >
            {submitting ? "Creating account…" : "Create Account"}
          </button>
        </section>
      </div>
    </main>
  );
}
