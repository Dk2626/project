"use client";

import { useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Briefcase,
  MapPin,
  Building2,
  Eye,
  EyeOff,
  Search,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { api } from "@/lib/client";
import { usePaginatedList } from "@/lib/usePaginatedList";
import { Pagination } from "@/components/ui/Pagination";
import { SkeletonList } from "@/components/ui/Skeleton";
import type { JobItem } from "@/lib/types";

const JOB_TYPES = ["Full Time", "Part Time", "Internship", "Contract", "Remote"];

const empty = {
  title: "",
  company: "",
  location: "",
  type: "Full Time",
  experience: "",
  salary: "",
  description: "",
  skills: "",
  active: true,
};

type FormState = typeof empty;

export default function AdminJobsPage() {
  const list = usePaginatedList<JobItem>({ path: "/api/jobs", params: { all: "1" } });
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(empty);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = list.reload;

  function openCreate() {
    setForm(empty);
    setEditingId(null);
    setError("");
    setOpen(true);
  }

  function openEdit(job: JobItem) {
    setForm({
      title: job.title,
      company: job.company,
      location: job.location,
      type: job.type,
      experience: job.experience ?? "",
      salary: job.salary ?? "",
      description: job.description ?? "",
      skills: (job.skills ?? []).join(", "),
      active: job.active ?? true,
    });
    setEditingId(job._id);
    setError("");
    setOpen(true);
  }

  async function save() {
    setError("");
    if (!form.title.trim() || !form.company.trim() || !form.location.trim()) {
      setError("Title, company and location are required.");
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, skills: form.skills };
      if (editingId) {
        await api(`/api/jobs/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await api("/api/jobs", { method: "POST", body: JSON.stringify(payload) });
      }
      setOpen(false);
      load();
    } catch (e: any) {
      setError(e?.message ?? "Could not save the job.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this job? Related applications will also be removed.")) return;
    try {
      await api(`/api/jobs/${id}`, { method: "DELETE" });
      list.removeItem((j) => j._id === id);
      list.reload();
    } catch {
      alert("Could not delete the job.");
    }
  }

  async function toggleActive(job: JobItem) {
    try {
      await api(`/api/jobs/${job._id}`, {
        method: "PUT",
        body: JSON.stringify({ active: !job.active }),
      });
      list.patchItem((j) => j._id === job._id, { active: !job.active });
    } catch {
      alert("Could not update the job.");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-dark">Jobs</h1>
          <p className="mt-1 text-sm text-slate-500">Create and manage job postings.</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex h-11 items-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-white hover:bg-primary-hover"
        >
          <Plus className="h-4 w-4" /> Add Job
        </button>
      </div>

      <div className="mt-6 flex justify-end">
        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={list.query}
            onChange={(e) => list.setQuery(e.target.value)}
            placeholder="Search title, company or location"
            className="h-11 w-full rounded-md border border-slate-200 bg-white pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
      </div>

      <div className="mt-5">
        {list.loading ? (
          <SkeletonList rows={5} />
        ) : list.items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <Briefcase className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-4 font-heading text-lg font-semibold text-dark">No jobs yet</p>
            <p className="mt-1 text-sm text-slate-500">Add your first job to get started.</p>
          </div>
        ) : (
          <div
            className={`space-y-3 transition-opacity ${
              list.fetching ? "opacity-60" : ""
            }`}
          >
            {list.items.map((job) => (
            <div
              key={job._id}
              className="flex flex-col gap-4 rounded-xl border border-slate-100 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-primary-light text-primary">
                  <Building2 className="h-5 w-5" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-heading font-semibold text-dark">{job.title}</p>
                    {!job.active && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500">
                    {job.company}
                    {job.postedByRole === "recruiter" && (
                      <span className="ml-2 rounded-full bg-primary-light px-2 py-0.5 text-xs font-medium text-primary">
                        Recruiter
                        {typeof job.postedBy === "object" && job.postedBy
                          ? ` · ${job.postedBy.firstName} ${job.postedBy.lastName}`
                          : ""}
                      </span>
                    )}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-400">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {job.location}
                    </span>
                    <span>{job.type}</span>
                    {job.salary && <span>{job.salary}</span>}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <IconBtn title={job.active ? "Deactivate" : "Activate"} onClick={() => toggleActive(job)}>
                  {job.active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </IconBtn>
                <IconBtn title="Edit" onClick={() => openEdit(job)}>
                  <Pencil className="h-4 w-4" />
                </IconBtn>
                <IconBtn title="Delete" danger onClick={() => remove(job._id)}>
                  <Trash2 className="h-4 w-4" />
                </IconBtn>
              </div>
            </div>
            ))}
          </div>
        )}

        <Pagination
          page={list.page}
          pages={list.pages}
          total={list.total}
          limit={list.limit}
          onPageChange={list.setPage}
          onLimitChange={list.setLimit}
          busy={list.fetching}
          label="jobs"
        />
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editingId ? "Edit Job" : "Add Job"}>
        <div className="space-y-4">
          {error && (
            <p className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Job Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} required />
            <Input label="Company" value={form.company} onChange={(v) => setForm({ ...form, company: v })} required />
            <Input label="Location" value={form.location} onChange={(v) => setForm({ ...form, location: v })} required />
            <Select label="Type" value={form.type} onChange={(v) => setForm({ ...form, type: v })} options={JOB_TYPES} />
            <Input label="Experience" value={form.experience} onChange={(v) => setForm({ ...form, experience: v })} placeholder="e.g. 1-3 years" />
            <Input label="Salary" value={form.salary} onChange={(v) => setForm({ ...form, salary: v })} placeholder="e.g. ₹6-10 LPA" />
          </div>
          <Textarea
            label="Description"
            value={form.description}
            onChange={(v) => setForm({ ...form, description: v })}
            placeholder="Describe the role, responsibilities and requirements."
          />
          <Input
            label="Skills (comma separated)"
            value={form.skills}
            onChange={(v) => setForm({ ...form, skills: v })}
            placeholder="React, TypeScript, SQL"
          />
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/40"
            />
            Active (visible to students)
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setOpen(false)}
              className="h-11 rounded-md border border-slate-200 px-5 text-sm font-medium text-dark hover:bg-light"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="h-11 rounded-md bg-primary px-6 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60"
            >
              {saving ? "Saving…" : editingId ? "Save changes" : "Create job"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function IconBtn({
  children,
  onClick,
  title,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`grid h-9 w-9 place-items-center rounded-md text-slate-500 transition-colors hover:bg-light ${
        danger ? "hover:text-danger" : "hover:text-primary"
      }`}
    >
      {children}
    </button>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="ml-0.5 text-danger">*</span>}
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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
      >
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}

function Textarea({
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
      <label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
        className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
      />
    </div>
  );
}
