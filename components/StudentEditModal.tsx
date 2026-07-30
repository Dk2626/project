"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { ResumeUpload } from "@/components/ResumeUpload";
import { api } from "@/lib/client";
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
const YEARS = [
  "1st Year",
  "2nd Year",
  "3rd Year",
  "4th Year",
  "5th Year",
  "Graduated",
];

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
      <label className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </label>
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
  email: string;
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

function toForm(s: StudentRecord): Form {
  return {
    firstName: s.firstName ?? "",
    lastName: s.lastName ?? "",
    email: s.email ?? "",
    phone: s.phone ?? "",
    dob: s.dob ?? "",
    gender: s.gender ?? "",
    studentType: (s.studentType as Form["studentType"]) ?? "College Student",
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

/**
 * Full edit form for a student record — superadmin only.
 *
 * Unlike the student's own profile editor, email is editable here so a
 * superadmin can correct a mistyped login address. The API re-checks the
 * caller's role and the email's uniqueness before saving.
 */
export function StudentEditModal({
  student,
  open,
  onClose,
  onSaved,
}: {
  student: StudentRecord | null;
  open: boolean;
  onClose: () => void;
  onSaved: (updated: StudentRecord) => void;
}) {
  const [form, setForm] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open && student) {
      setForm(toForm(student));
      setError("");
    }
  }, [open, student]);

  const setField = (key: keyof Form) => (v: string) =>
    setForm((f) => (f ? { ...f, [key]: v } : f));

  async function save() {
    if (!form || !student) return;
    setError("");

    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError("First name and last name are required.");
      return;
    }
    if (!form.email.trim()) {
      setError("Email is required.");
      return;
    }

    setSaving(true);
    try {
      const updated = await api<StudentRecord>(
        `/api/admin/students/${student._id}`,
        { method: "PUT", body: JSON.stringify(form) }
      );
      onSaved(updated);
      onClose();
    } catch (e: any) {
      setError(e?.message ?? "Could not save these changes.");
    } finally {
      setSaving(false);
    }
  }

  const isSchool = form?.studentType === "School Student";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        student
          ? `Edit ${student.firstName} ${student.lastName}`
          : "Edit student"
      }
    >
      {form && student && (
        <div className="space-y-5">
          {error && (
            <p className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}

          {/* Personal */}
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
              label="Email"
              type="email"
              value={form.email}
              onChange={setField("email")}
            />
            <Text
              label="Phone"
              value={form.phone}
              onChange={setField("phone")}
            />
            <Text
              label="Date of Birth"
              type="date"
              value={form.dob}
              onChange={setField("dob")}
            />
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
              {isSchool ? (
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

          {/* CV */}
          <div className="border-t border-slate-100 pt-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
              CV
            </p>
            <ResumeUpload
              endpoint={`/api/admin/students/${student._id}/resume`}
              resumeUrl={student.resumeUrl}
              onUpdated={onSaved}
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              onClick={onClose}
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
  );
}
