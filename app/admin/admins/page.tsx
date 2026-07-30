"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  ShieldAlert,
  Plus,
  Search,
  Mail,
  Phone,
  Trash2,
  KeyRound,
  Eye,
  EyeOff,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Pagination } from "@/components/ui/Pagination";
import { SkeletonRecordList } from "@/components/ui/Skeleton";
import { api } from "@/lib/client";
import { useAuth } from "@/components/AuthProvider";
import { usePaginatedList } from "@/lib/usePaginatedList";
import type { AdminRecord } from "@/lib/types";

function formatDate(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
}

const EMPTY_FORM = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
};

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
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
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-md border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
      />
    </div>
  );
}

export default function AdminAdminsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const isSuper = user?.role === "superadmin";

  const list = usePaginatedList<AdminRecord>({ path: "/api/admin/admins" });

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [resetFor, setResetFor] = useState<AdminRecord | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  // Ordinary admins have no business here — the API would refuse them
  // anyway, but bounce them to the overview rather than show an error.
  useEffect(() => {
    if (!authLoading && user && !isSuper) router.replace("/admin");
  }, [authLoading, user, isSuper, router]);

  const setField = (key: keyof typeof EMPTY_FORM) => (v: string) =>
    setForm((f) => ({ ...f, [key]: v }));

  function openCreate() {
    setForm({ ...EMPTY_FORM });
    setError("");
    setShowPassword(false);
    setCreateOpen(true);
  }

  async function createAdmin() {
    setError("");
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError("First and last name are required.");
      return;
    }
    if (!form.email.trim()) {
      setError("Email is required.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setSaving(true);
    try {
      await api<AdminRecord>("/api/admin/admins", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setCreateOpen(false);
      list.reload();
    } catch (e: any) {
      setError(e?.message ?? "Could not create this admin.");
    } finally {
      setSaving(false);
    }
  }

  async function resetPassword() {
    if (!resetFor) return;
    setError("");
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setSaving(true);
    try {
      await api(`/api/admin/admins/${resetFor._id}`, {
        method: "PUT",
        body: JSON.stringify({ password: newPassword }),
      });
      setResetFor(null);
      setNewPassword("");
    } catch (e: any) {
      setError(e?.message ?? "Could not reset the password.");
    } finally {
      setSaving(false);
    }
  }

  async function removeAdmin(admin: AdminRecord) {
    if (
      !confirm(
        `Remove ${admin.firstName} ${admin.lastName}? They will lose access to the admin dashboard immediately.`
      )
    )
      return;

    setBusyId(admin._id);
    try {
      await api(`/api/admin/admins/${admin._id}`, { method: "DELETE" });
      list.removeItem((a) => a._id === admin._id);
      list.reload();
    } catch (e: any) {
      alert(e?.message ?? "Could not remove this admin.");
    } finally {
      setBusyId(null);
    }
  }

  if (authLoading || !isSuper) {
    return <SkeletonRecordList rows={3} fields={3} />;
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-dark">Admins</h1>
          <p className="mt-1 text-sm text-slate-500">
            Create and manage admin accounts. Only a superadmin can see this
            screen.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex h-11 shrink-0 items-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-white hover:bg-primary-hover"
        >
          <Plus className="h-4 w-4" /> Create admin
        </button>
      </div>

      <div className="mt-5 flex items-start gap-3 rounded-lg border border-primary/20 bg-primary-light/60 px-4 py-3 text-sm text-slate-700">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p>
          New accounts are always created at the <strong>admin</strong> tier.
          The superadmin tier is set directly in the database, so it can never
          be granted through this screen.
        </p>
      </div>

      <div className="mt-6 flex justify-end">
        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={list.query}
            onChange={(e) => list.setQuery(e.target.value)}
            placeholder="Search name or email"
            className="h-11 w-full rounded-md border border-slate-200 bg-white pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
      </div>

      <div className="mt-5">
        {list.loading ? (
          <SkeletonRecordList rows={3} fields={3} />
        ) : list.items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <ShieldAlert className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-4 font-heading text-lg font-semibold text-dark">
              No admins match that search
            </p>
          </div>
        ) : (
          <div
            className={`space-y-3 transition-opacity ${
              list.fetching ? "opacity-60" : ""
            }`}
          >
            {list.items.map((a) => {
              const superRow = a.role === "superadmin";
              const self = a._id === user?.id;
              return (
                <div
                  key={a._id}
                  className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-4">
                      <span
                        className={`grid h-11 w-11 shrink-0 place-items-center rounded-full font-heading font-semibold ${
                          superRow
                            ? "bg-primary text-white"
                            : "bg-primary-light text-primary"
                        }`}
                      >
                        {(a.firstName?.[0] ?? "?").toUpperCase()}
                      </span>
                      <div>
                        <p className="font-heading font-semibold text-dark">
                          {a.firstName} {a.lastName}
                          {self && (
                            <span className="ml-2 text-xs font-normal text-slate-400">
                              (you)
                            </span>
                          )}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <Mail className="h-3 w-3" /> {a.email}
                          </span>
                          {a.phone && (
                            <span className="inline-flex items-center gap-1">
                              <Phone className="h-3 w-3" /> {a.phone}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-slate-400">
                          Added {formatDate(a.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                          superRow
                            ? "bg-primary text-white"
                            : "bg-primary-light text-primary"
                        }`}
                      >
                        <ShieldCheck className="h-3 w-3" />
                        {superRow ? "Superadmin" : "Admin"}
                      </span>

                      {!superRow && (
                        <>
                          <button
                            onClick={() => {
                              setResetFor(a);
                              setNewPassword("");
                              setError("");
                            }}
                            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-600 hover:border-primary/40 hover:text-primary"
                          >
                            <KeyRound className="h-4 w-4" /> Reset password
                          </button>
                          <button
                            disabled={busyId === a._id}
                            onClick={() => removeAdmin(a)}
                            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-600 hover:border-danger/40 hover:text-danger disabled:opacity-60"
                          >
                            <Trash2 className="h-4 w-4" /> Remove
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
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
          label="admins"
        />
      </div>

      {/* ---------------- Create admin ---------------- */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create an admin"
      >
        <div className="space-y-5">
          {error && (
            <p className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}

          <div className="grid gap-x-4 gap-y-4 sm:grid-cols-2">
            <Field
              label="First Name"
              required
              value={form.firstName}
              onChange={setField("firstName")}
            />
            <Field
              label="Last Name"
              required
              value={form.lastName}
              onChange={setField("lastName")}
            />
            <Field
              label="Email"
              required
              type="email"
              value={form.email}
              onChange={setField("email")}
              placeholder="name@urav.com"
            />
            <Field
              label="Phone"
              value={form.phone}
              onChange={setField("phone")}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Temporary password<span className="ml-0.5 text-danger">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => setField("password")(e.target.value)}
                placeholder="At least 8 characters"
                className="h-11 w-full rounded-md border border-slate-200 px-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-md text-slate-400 hover:bg-light hover:text-dark"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Share this with them and ask them to change it after their first
              login.
            </p>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              onClick={() => setCreateOpen(false)}
              disabled={saving}
              className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-light disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              onClick={createAdmin}
              disabled={saving}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60"
            >
              {saving ? "Creating…" : "Create admin"}
            </button>
          </div>
        </div>
      </Modal>

      {/* ---------------- Reset password ---------------- */}
      <Modal
        open={Boolean(resetFor)}
        onClose={() => setResetFor(null)}
        title={`Reset password${
          resetFor ? ` — ${resetFor.firstName} ${resetFor.lastName}` : ""
        }`}
      >
        <div className="space-y-5">
          {error && (
            <p className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}
          <Field
            label="New password"
            required
            type="password"
            value={newPassword}
            onChange={setNewPassword}
            placeholder="At least 8 characters"
          />
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              onClick={() => setResetFor(null)}
              disabled={saving}
              className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-light disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              onClick={resetPassword}
              disabled={saving}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60"
            >
              {saving ? "Saving…" : "Set password"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
