"use client";

import { useState, type ReactNode, type InputHTMLAttributes } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/client";
import { useAuth } from "@/components/AuthProvider";
import { Logo } from "@/components/Logo";
import type { AuthUser } from "@/lib/types";
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Building2,
  Briefcase,
  Globe,
  MapPin,
  Users,
  Linkedin,
  ChevronDown,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  Clock,
} from "lucide-react";

const highlights = [
  { icon: Briefcase, title: "Post Your Own Jobs", desc: "Publish roles straight to the URAV job board" },
  { icon: Users, title: "Applicant Dashboard", desc: "See every student who applies to your roles" },
  { icon: ShieldCheck, title: "Verified Employers", desc: "Each recruiter is reviewed by our team" },
  { icon: CheckCircle2, title: "Track Hiring", desc: "Shortlist, interview and hire in one place" },
];

const INDUSTRIES = [
  "Information Technology",
  "Software Product",
  "Consulting / Services",
  "Manufacturing",
  "Banking & Finance",
  "Healthcare",
  "Education / EdTech",
  "E-commerce / Retail",
  "Staffing / Recruitment",
  "Other",
];

const COMPANY_SIZES = [
  "1-10 employees",
  "11-50 employees",
  "51-200 employees",
  "201-500 employees",
  "501-1000 employees",
  "1000+ employees",
];

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

function SelectField({
  id,
  label,
  required,
  icon,
  error,
  value,
  onChange,
  placeholder,
  options,
}: {
  id: string;
  label: string;
  required?: boolean;
  icon?: ReactNode;
  error?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: string[];
}) {
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

const iconSm = "h-4 w-4";

export default function RecruiterRegisterPage() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    designation: "",
    password: "",
    confirmPassword: "",
    companyName: "",
    companyWebsite: "",
    companyLocation: "",
    industry: "",
    companySize: "",
    companyAbout: "",
    linkedin: "",
  });
  const [agreed, setAgreed] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  const router = useRouter();
  const { setUser } = useAuth();

  const set = (key: keyof typeof form) => (v: string) =>
    setForm((f) => ({ ...f, [key]: v }));

  function validate() {
    const e: Record<string, string> = {};
    if (!form.firstName.trim()) e.firstName = "First name is required";
    if (!form.lastName.trim()) e.lastName = "Last name is required";
    if (!form.email.trim()) e.email = "Work email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email";
    if (!form.phone.trim()) e.phone = "Phone number is required";
    if (!form.designation.trim()) e.designation = "Designation is required";
    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 8) e.password = "Use at least 8 characters";
    if (!form.confirmPassword) e.confirmPassword = "Please confirm your password";
    else if (form.confirmPassword !== form.password) e.confirmPassword = "Passwords do not match";
    if (!form.companyName.trim()) e.companyName = "Company name is required";
    if (!form.companyLocation.trim()) e.companyLocation = "Company location is required";
    if (!form.industry) e.industry = "Please select an industry";
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
      const data = await api<{ user: AuthUser }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ ...form, role: "recruiter" }),
      });
      setUser(data.user);
      setSubmitted(true);
      if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
      setTimeout(() => {
        router.push("/recruiter");
        router.refresh();
      }, 1600);
    } catch (err) {
      setServerError(
        err instanceof ApiError ? err.message : "Could not create your account. Please try again."
      );
      if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-light px-4 py-8 md:py-12">
      <div className="mx-auto grid w-full max-w-6xl overflow-hidden rounded-2xl bg-white shadow-xl lg:grid-cols-12">
        {/* ---------- LEFT: brand panel ---------- */}
        <aside className="relative hidden flex-col justify-between bg-gradient-to-b from-primary-light to-white p-8 lg:col-span-5 lg:flex xl:p-10">
          <div>
            <Link href="/" className="flex items-center gap-3">
              <Logo size={46} />
              <span className="leading-tight">
                <span className="block font-heading text-2xl font-bold text-dark">URAV</span>
                <span className="block text-[10px] font-medium uppercase tracking-[0.25em] text-slate-400">
                  Hire · Connect · Grow
                </span>
              </span>
            </Link>

            <h1 className="mt-10 font-heading text-3xl font-bold leading-tight text-dark xl:text-[34px]">
              Hire the right
              <br />
              talent, faster.
            </h1>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-600">
              Register as a recruiter to post jobs on URAV and reach thousands of school and
              college students actively looking for opportunities.
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

          <div className="mt-8 flex items-start gap-3 rounded-xl bg-white p-4 shadow-sm">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-warning/10 text-warning">
              <Clock className="h-5 w-5" />
            </span>
            <span className="leading-snug">
              <span className="block font-heading text-sm font-semibold text-dark">
                One-time verification
              </span>
              <span className="block text-xs text-slate-500">
                Our admin team reviews every recruiter account before job posting is enabled.
              </span>
            </span>
          </div>
        </aside>

        {/* ---------- RIGHT: form ---------- */}
        <section className="p-6 sm:p-8 lg:col-span-7 xl:p-10">
          <Link href="/" className="mb-6 flex items-center gap-2 lg:hidden">
            <Logo size={32} />
            <span className="font-heading text-xl font-bold text-dark">URAV</span>
          </Link>

          <div className="mb-5 flex flex-wrap items-start justify-between gap-2">
            <div>
              <h1 className="font-heading text-2xl font-bold text-dark sm:text-[28px]">
                Recruiter Registration
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Create your employer account and start hiring with URAV.
              </p>
            </div>
            <p className="text-sm text-slate-500">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-primary hover:underline">
                Login
              </Link>
            </p>
          </div>

          {/* Role switch */}
          <div className="mb-6 grid grid-cols-2 gap-3 sm:max-w-md">
            <Link
              href="/register"
              className="flex h-11 items-center justify-center rounded-md border border-slate-200 bg-white text-sm font-medium text-slate-600 transition-colors hover:border-primary/40"
            >
              I&apos;m a Student
            </Link>
            <span className="flex h-11 items-center justify-center rounded-md border border-primary bg-primary-light text-sm font-medium text-primary">
              I&apos;m a Recruiter
            </span>
          </div>

          {/* Approval notice */}
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
            <p className="text-slate-700">
              After you register, an admin has to approve your account before you can post jobs.
              You&apos;ll be able to log in right away and see your approval status on your
              dashboard.
            </p>
          </div>

          {submitted && (
            <div className="mb-6 flex items-start gap-3 rounded-lg border border-success/30 bg-success/10 p-4">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
              <div className="text-sm">
                <p className="font-semibold text-dark">Account created</p>
                <p className="text-slate-600">
                  Thanks {form.firstName}! Your account is now waiting for admin approval — taking
                  you to your dashboard…
                </p>
              </div>
            </div>
          )}

          {serverError && (
            <div className="mb-6 flex items-start gap-3 rounded-lg border border-danger/30 bg-danger/10 p-4 text-sm text-danger">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Contact person */}
          <SectionTitle>Your Details</SectionTitle>
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
              label="Work Email"
              required
              type="email"
              placeholder="Enter work email"
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
              id="designation"
              label="Designation"
              required
              placeholder="e.g. HR Manager"
              icon={<Briefcase className={iconSm} />}
              value={form.designation}
              onChange={(e) => set("designation")(e.target.value)}
              error={errors.designation}
            />
            <Field
              id="linkedin"
              label="LinkedIn Profile"
              placeholder="Enter LinkedIn URL"
              icon={<Linkedin className={iconSm} />}
              value={form.linkedin}
              onChange={(e) => set("linkedin")(e.target.value)}
            />
          </div>

          {/* Security */}
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

          {/* Company */}
          <SectionTitle>Company Information</SectionTitle>
          <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field
              id="companyName"
              label="Company Name"
              required
              placeholder="Enter company name"
              icon={<Building2 className={iconSm} />}
              value={form.companyName}
              onChange={(e) => set("companyName")(e.target.value)}
              error={errors.companyName}
            />
            <Field
              id="companyLocation"
              label="Location"
              required
              placeholder="e.g. Chennai, India"
              icon={<MapPin className={iconSm} />}
              value={form.companyLocation}
              onChange={(e) => set("companyLocation")(e.target.value)}
              error={errors.companyLocation}
            />
            <Field
              id="companyWebsite"
              label="Website"
              placeholder="https://example.com"
              icon={<Globe className={iconSm} />}
              value={form.companyWebsite}
              onChange={(e) => set("companyWebsite")(e.target.value)}
            />
            <SelectField
              id="industry"
              label="Industry"
              required
              icon={<Briefcase className={iconSm} />}
              placeholder="Select industry"
              value={form.industry}
              onChange={set("industry")}
              options={INDUSTRIES}
              error={errors.industry}
            />
            <SelectField
              id="companySize"
              label="Company Size"
              icon={<Users className={iconSm} />}
              placeholder="Select company size"
              value={form.companySize}
              onChange={set("companySize")}
              options={COMPANY_SIZES}
            />
          </div>

          <div className="mt-4">
            <Label htmlFor="companyAbout">About the Company</Label>
            <textarea
              id="companyAbout"
              rows={4}
              placeholder="Tell students what your company does."
              value={form.companyAbout}
              onChange={(e) => set("companyAbout")(e.target.value)}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
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
                I confirm I am authorised to hire on behalf of this company and agree to the{" "}
                <Link href="/terms" className="font-medium text-primary hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="font-medium text-primary hover:underline">
                  Privacy Policy
                </Link>
              </span>
            </label>
            {errors.agreed && <p className="mt-1 text-xs text-danger">{errors.agreed}</p>}
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || submitted}
            className="mt-6 h-12 w-full rounded-md bg-primary font-medium text-white shadow-md transition-colors hover:bg-primary-hover disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2"
          >
            {submitting ? "Creating account…" : "Create Recruiter Account"}
          </button>
        </section>
      </div>
    </main>
  );
}
