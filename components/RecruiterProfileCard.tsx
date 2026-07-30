"use client";

import { useEffect, useState } from "react";
import {
  Mail,
  Phone,
  Building2,
  Briefcase,
  MapPin,
  Globe,
  Users,
  Pencil,
  Lock,
  Linkedin,
  BadgeCheck,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { SkeletonProfile } from "@/components/ui/Skeleton";
import { api } from "@/lib/client";
import { useAuth } from "@/components/AuthProvider";
import type { RecruiterRecord, ApprovalStatus } from "@/lib/types";

const COMPANY_SIZES = [
  "1-10",
  "11-50",
  "51-200",
  "201-500",
  "501-1000",
  "1000+",
];

const INDUSTRIES = [
  "Information Technology",
  "Consulting",
  "Finance / Banking",
  "Manufacturing",
  "Healthcare",
  "Education",
  "Retail / E-commerce",
  "Logistics",
  "Media",
  "Other",
];

function Meta({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value?: string;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-slate-400">
          {label}
        </p>
        <p className="truncate text-sm font-medium text-dark">{value}</p>
      </div>
    </div>
  );
}

function Text({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-md border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
      />
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
      >
        <option value="">{placeholder ?? "Select"}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

type Form = {
  firstName: string;
  lastName: string;
  phone: string;
  designation: string;
  companyName: string;
  companyWebsite: string;
  companyLocation: string;
  industry: string;
  companySize: string;
  companyAbout: string;
  linkedin: string;
};

function toForm(r: RecruiterRecord): Form {
  return {
    firstName: r.firstName ?? "",
    lastName: r.lastName ?? "",
    phone: r.phone ?? "",
    designation: r.designation ?? "",
    companyName: r.companyName ?? "",
    companyWebsite: r.companyWebsite ?? "",
    companyLocation: r.companyLocation ?? "",
    industry: r.industry ?? "",
    companySize: r.companySize ?? "",
    companyAbout: r.companyAbout ?? "",
    linkedin: r.linkedin ?? "",
  };
}

function ApprovalBadge({ status }: { status?: ApprovalStatus }) {
  const map: Record<string, string> = {
    approved: "bg-success/10 text-success",
    pending: "bg-warning/10 text-warning",
    rejected: "bg-danger/10 text-danger",
  };
  const label =
    status === "approved"
      ? "Approved"
      : status === "rejected"
      ? "Access revoked"
      : "Pending approval";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
        map[status ?? "pending"]
      }`}
    >
      <BadgeCheck className="h-3 w-3" />
      {label}
    </span>
  );
}

/**
 * Lets a recruiter maintain their own contact and company details.
 *
 * Their approval status is shown but never editable — only an admin can
 * change it, and the API ignores it if it's sent.
 */
export function RecruiterProfileCard() {
  const { refresh } = useAuth();
  const [profile, setProfile] = useState<RecruiterRecord | null>(null);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api<RecruiterRecord>("/api/profile")
      .then(setProfile)
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, []);

  function openEdit() {
    if (!profile) return;
    setForm(toForm(profile));
    setError("");
    setOpen(true);
  }

  const setField = (key: keyof Form) => (v: string) =>
    setForm((f) => (f ? { ...f, [key]: v } : f));

  async function save() {
    if (!form) return;
    setError("");

    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError("First name and last name are required.");
      return;
    }
    if (!form.companyName.trim()) {
      setError("Company name is required.");
      return;
    }

    setSaving(true);
    try {
      const updated = await api<RecruiterRecord>("/api/profile", {
        method: "PUT",
        body: JSON.stringify(form),
      });
      setProfile(updated);
      setOpen(false);
      // Name / company may have changed — refresh the session-derived UI.
      refresh();
    } catch (e: any) {
      setError(e?.message ?? "Could not save your changes.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <SkeletonProfile />;
  if (!profile) return null;

  return (
    <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-primary-light text-primary">
            <Building2 className="h-5 w-5" />
          </span>
          <div>
            <p className="font-heading font-semibold text-dark">
              {profile.companyName || "Your company"}
            </p>
            <p className="text-sm text-slate-500">
              {profile.firstName} {profile.lastName}
              {profile.designation ? ` · ${profile.designation}` : ""}
            </p>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
              {profile.email && (
                <span className="inline-flex items-center gap-1">
                  <Mail className="h-3 w-3" /> {profile.email}
                </span>
              )}
              {profile.phone && (
                <span className="inline-flex items-center gap-1">
                  <Phone className="h-3 w-3" /> {profile.phone}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ApprovalBadge status={profile.approvalStatus} />
          <button
            onClick={openEdit}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-primary/40 hover:text-primary"
          >
            <Pencil className="h-3.5 w-3.5" /> Edit profile
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-slate-100 pt-4 sm:grid-cols-3 lg:grid-cols-4">
        <Meta
          icon={Briefcase}
          label="Designation"
          value={profile.designation}
        />
        <Meta
          icon={MapPin}
          label="Location"
          value={profile.companyLocation}
        />
        <Meta icon={Briefcase} label="Industry" value={profile.industry} />
        <Meta icon={Users} label="Company Size" value={profile.companySize} />
        <Meta icon={Globe} label="Website" value={profile.companyWebsite} />
        <Meta icon={Linkedin} label="LinkedIn" value={profile.linkedin} />
      </div>

      {profile.companyAbout && (
        <div className="mt-4 border-t border-slate-100 pt-4">
          <p className="text-[11px] uppercase tracking-wide text-slate-400">
            About the company
          </p>
          <p className="mt-1 whitespace-pre-line text-sm text-slate-600">
            {profile.companyAbout}
          </p>
        </div>
      )}

      {/* ---------------- Edit modal ---------------- */}
      <Modal open={open} onClose={() => setOpen(false)} title="Edit your profile">
        {form && (
          <div className="space-y-5">
            {error && (
              <p className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
                {error}
              </p>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Email
              </label>
              <div className="relative">
                <input
                  value={profile.email ?? ""}
                  readOnly
                  disabled
                  className="h-11 w-full cursor-not-allowed rounded-md border border-slate-200 bg-slate-50 px-3 pr-9 text-sm text-slate-500"
                />
                <Lock className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Your email is your account login and can&apos;t be changed here.
              </p>
            </div>

            <div className="grid gap-x-4 gap-y-4 sm:grid-cols-2">
              <Text
                label="First Name"
                value={form.firstName}
                onChange={setField("firstName")}
              />
              <Text
                label="Last Name"
                value={form.lastName}
                onChange={setField("lastName")}
              />
              <Text
                label="Phone"
                value={form.phone}
                onChange={setField("phone")}
              />
              <Text
                label="Your Designation"
                value={form.designation}
                onChange={setField("designation")}
                placeholder="e.g. Talent Acquisition Lead"
              />
            </div>

            <div className="border-t border-slate-100 pt-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Company
              </p>
              <div className="grid gap-x-4 gap-y-4 sm:grid-cols-2">
                <Text
                  label="Company Name"
                  value={form.companyName}
                  onChange={setField("companyName")}
                />
                <Text
                  label="Location"
                  value={form.companyLocation}
                  onChange={setField("companyLocation")}
                  placeholder="City, State"
                />
                <Select
                  label="Industry"
                  value={form.industry}
                  onChange={setField("industry")}
                  options={INDUSTRIES}
                  placeholder="Select industry"
                />
                <Select
                  label="Company Size"
                  value={form.companySize}
                  onChange={setField("companySize")}
                  options={COMPANY_SIZES}
                  placeholder="Select size"
                />
                <Text
                  label="Website"
                  value={form.companyWebsite}
                  onChange={setField("companyWebsite")}
                  placeholder="https://…"
                />
                <Text
                  label="LinkedIn"
                  value={form.linkedin}
                  onChange={setField("linkedin")}
                  placeholder="https://linkedin.com/company/…"
                />
              </div>

              <div className="mt-4">
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  About the company
                </label>
                <textarea
                  value={form.companyAbout}
                  onChange={(e) => setField("companyAbout")(e.target.value)}
                  rows={4}
                  placeholder="A short description shown alongside your job postings."
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                onClick={() => setOpen(false)}
                disabled={saving}
                className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-light disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
