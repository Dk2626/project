"use client";

import { useEffect, useState } from "react";
import {
  User as UserIcon,
  Mail,
  Phone,
  Building2,
  GraduationCap,
  BookOpen,
  Calendar,
  Star,
  Pencil,
  Lock,
  Linkedin,
  Github,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { api } from "@/lib/client";
import { useAuth } from "@/components/AuthProvider";
import type { StudentRecord } from "@/lib/types";

const GRAD_YEARS = Array.from({ length: 10 }, (_, i) => `${2022 + i}`);
const GENDERS = ["Female", "Male", "Non-binary", "Prefer not to say"];
const CLASS_GRADES = ["6th", "7th", "8th", "9th", "10th", "11th", "12th"];
const BOARDS = ["CBSE", "ICSE", "State Board", "IB", "IGCSE", "NIOS", "Other"];
const STREAMS = ["Science", "Commerce", "Arts / Humanities", "Not applicable"];
const DEGREES = [
  "B.E / B.Tech",
  "B.Sc",
  "B.Com",
  "B.A",
  "BBA",
  "BCA",
  "M.E / M.Tech",
  "M.Sc",
  "MBA",
  "MCA",
  "Other",
];
const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year", "Graduated"];

function Meta({ icon: Icon, label, value }: { icon: any; label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-slate-400">{label}</p>
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
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
      <input
        type={type}
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
      <label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
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

type EditForm = {
  firstName: string;
  lastName: string;
  phone: string;
  dob: string;
  gender: string;
  studentType: "School Student" | "College Student";
  college: string;
  degree: string;
  department: string;
  currentYear: string;
  schoolName: string;
  classGrade: string;
  board: string;
  schoolStream: string;
  graduationYear: string;
  cgpa: string;
  linkedin: string;
  github: string;
};

function toForm(s: StudentRecord): EditForm {
  return {
    firstName: s.firstName ?? "",
    lastName: s.lastName ?? "",
    phone: s.phone ?? "",
    dob: s.dob ?? "",
    gender: s.gender ?? "",
    studentType: (s.studentType as EditForm["studentType"]) ?? "College Student",
    college: s.college ?? "",
    degree: s.degree ?? "",
    department: s.department ?? "",
    currentYear: s.currentYear ?? "",
    schoolName: s.schoolName ?? "",
    classGrade: s.classGrade ?? "",
    board: s.board ?? "",
    schoolStream: s.schoolStream ?? "",
    graduationYear: s.graduationYear ?? "",
    cgpa: s.cgpa ?? "",
    linkedin: s.linkedin ?? "",
    github: s.github ?? "",
  };
}

export function ProfileCard() {
  const { refresh } = useAuth();
  const [profile, setProfile] = useState<StudentRecord | null>(null);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<EditForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api<StudentRecord>("/api/profile")
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

  const setField =
    (key: keyof EditForm) => (v: string) =>
      setForm((f) => (f ? { ...f, [key]: v } : f));

  async function save() {
    if (!form) return;
    setError("");
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError("First name and last name are required.");
      return;
    }
    setSaving(true);
    try {
      const updated = await api<StudentRecord>("/api/profile", {
        method: "PUT",
        body: JSON.stringify(form),
      });
      setProfile(updated);
      setOpen(false);
      // Name may have changed — refresh the session so the greeting updates.
      refresh();
    } catch (e: any) {
      setError(e?.message ?? "Could not save your changes.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="h-48 animate-pulse rounded-xl bg-white" />;
  }
  if (!profile) return null;

  const isSchool = profile.studentType === "School Student";
  const editingIsSchool = form?.studentType === "School Student";

  return (
    <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary-light font-heading font-semibold text-primary">
            {(profile.firstName?.[0] ?? "?").toUpperCase()}
          </span>
          <div>
            <p className="font-heading font-semibold text-dark">
              {profile.firstName} {profile.lastName}
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

        <button
          onClick={openEdit}
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-primary/40 hover:text-primary"
        >
          <Pencil className="h-3.5 w-3.5" /> Edit profile
        </button>
      </div>

      {/* Details */}
      <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-slate-100 pt-4 sm:grid-cols-3 lg:grid-cols-4">
        {isSchool ? (
          <>
            <Meta icon={Building2} label="School" value={profile.schoolName} />
            <Meta icon={GraduationCap} label="Class" value={profile.classGrade} />
            <Meta icon={BookOpen} label="Board" value={profile.board} />
            <Meta icon={BookOpen} label="Stream" value={profile.schoolStream} />
            <Meta icon={Calendar} label="Completion Year" value={profile.graduationYear} />
            <Meta icon={Star} label="Percentage / Grade" value={profile.cgpa} />
          </>
        ) : (
          <>
            <Meta icon={Building2} label="College" value={profile.college} />
            <Meta icon={GraduationCap} label="Degree" value={profile.degree} />
            <Meta icon={BookOpen} label="Department" value={profile.department} />
            <Meta icon={Calendar} label="Current Year" value={profile.currentYear} />
            <Meta icon={Calendar} label="Graduation Year" value={profile.graduationYear} />
            <Meta icon={Star} label="CGPA / %" value={profile.cgpa} />
          </>
        )}
        <Meta icon={UserIcon} label="Gender" value={profile.gender} />
      </div>

      {/* ---------------- Edit modal ---------------- */}
      <Modal open={open} onClose={() => setOpen(false)} title="Edit your profile">
        {form && (
          <div className="space-y-5">
            {error && (
              <p className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
            )}

            {/* Email — locked, unique identifier */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
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
                Your email is your account login and can't be changed here.
              </p>
            </div>

            {/* Personal */}
            <div className="grid gap-x-4 gap-y-4 sm:grid-cols-2">
              <Text label="First Name" value={form.firstName} onChange={setField("firstName")} />
              <Text label="Last Name" value={form.lastName} onChange={setField("lastName")} />
              <Text
                label="Phone"
                value={form.phone}
                onChange={setField("phone")}
                placeholder="Phone number"
              />
              <Text label="Date of Birth" type="date" value={form.dob} onChange={setField("dob")} />
              <Select
                label="Gender"
                value={form.gender}
                onChange={setField("gender")}
                options={GENDERS}
                placeholder="Select gender"
              />
              <Select
                label="Student Type"
                value={form.studentType}
                onChange={setField("studentType")}
                options={["School Student", "College Student"]}
                placeholder="Select type"
              />
            </div>

            {/* Education */}
            <div className="border-t border-slate-100 pt-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Education
              </p>
              <div className="grid gap-x-4 gap-y-4 sm:grid-cols-2">
                {editingIsSchool ? (
                  <>
                    <Text
                      label="School Name"
                      value={form.schoolName}
                      onChange={setField("schoolName")}
                    />
                    <Select
                      label="Class / Grade"
                      value={form.classGrade}
                      onChange={setField("classGrade")}
                      options={CLASS_GRADES}
                      placeholder="Select class"
                    />
                    <Select
                      label="Board"
                      value={form.board}
                      onChange={setField("board")}
                      options={BOARDS}
                      placeholder="Select board"
                    />
                    <Select
                      label="Stream (11th / 12th)"
                      value={form.schoolStream}
                      onChange={setField("schoolStream")}
                      options={STREAMS}
                      placeholder="Select stream"
                    />
                    <Select
                      label="Completion Year"
                      value={form.graduationYear}
                      onChange={setField("graduationYear")}
                      options={GRAD_YEARS}
                      placeholder="Select year"
                    />
                    <Text
                      label="Percentage / Grade"
                      value={form.cgpa}
                      onChange={setField("cgpa")}
                    />
                  </>
                ) : (
                  <>
                    <Text
                      label="College / University"
                      value={form.college}
                      onChange={setField("college")}
                    />
                    <Select
                      label="Degree"
                      value={form.degree}
                      onChange={setField("degree")}
                      options={DEGREES}
                      placeholder="Select degree"
                    />
                    <Text
                      label="Department / Stream"
                      value={form.department}
                      onChange={setField("department")}
                    />
                    <Select
                      label="Current Year"
                      value={form.currentYear}
                      onChange={setField("currentYear")}
                      options={YEARS}
                      placeholder="Select year"
                    />
                    <Select
                      label="Graduation Year"
                      value={form.graduationYear}
                      onChange={setField("graduationYear")}
                      options={GRAD_YEARS}
                      placeholder="Select year"
                    />
                    <Text
                      label="CGPA / Percentage"
                      value={form.cgpa}
                      onChange={setField("cgpa")}
                    />
                  </>
                )}
              </div>
            </div>

            {/* Links */}
            <div className="border-t border-slate-100 pt-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Links
              </p>
              <div className="grid gap-x-4 gap-y-4 sm:grid-cols-2">
                <Text
                  label="LinkedIn"
                  value={form.linkedin}
                  onChange={setField("linkedin")}
                  placeholder="https://linkedin.com/in/…"
                />
                <Text
                  label="GitHub"
                  value={form.github}
                  onChange={setField("github")}
                  placeholder="https://github.com/…"
                />
              </div>
            </div>

            {/* Actions */}
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
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60"
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
