"use client";

import { useEffect, useRef, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Images,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Monitor,
  Smartphone,
  Upload,
  Sparkles,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { SkeletonList } from "@/components/ui/Skeleton";
import { FormTextarea } from "@/components/ui/Form";
import { useAuth } from "@/components/AuthProvider";
import { api } from "@/lib/client";
import type { HeroSlideItem } from "@/lib/types";

const empty = {
  title: "",
  description: "",
  textTone: "light" as "light" | "dark",
  active: true,
};
type FormState = typeof empty;

export default function AdminHeroPage() {
  const { user } = useAuth();
  const isSuper = user?.role === "superadmin";

  const [slides, setSlides] = useState<HeroSlideItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<HeroSlideItem | null>(null);
  const [form, setForm] = useState<FormState>(empty);
  const [desktopFile, setDesktopFile] = useState<File | null>(null);
  const [mobileFile, setMobileFile] = useState<File | null>(null);
  const [dropMobile, setDropMobile] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);

  function load() {
    setLoading(true);
    api<HeroSlideItem[]>("/api/hero-slides?all=1")
      .then(setSlides)
      .catch(() => setSlides([]))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  function openCreate() {
    setForm(empty);
    setEditing(null);
    setDesktopFile(null);
    setMobileFile(null);
    setDropMobile(false);
    setError("");
    setOpen(true);
  }

  function openEdit(slide: HeroSlideItem) {
    setForm({
      title: slide.title,
      description: slide.description ?? "",
      textTone: slide.textTone === "dark" ? "dark" : "light",
      active: slide.active !== false,
    });
    setEditing(slide);
    setDesktopFile(null);
    setMobileFile(null);
    setDropMobile(false);
    setError("");
    setOpen(true);
  }

  async function save() {
    setError("");
    if (!form.title.trim()) {
      setError("Give the slide a title.");
      return;
    }
    if (!editing && !desktopFile) {
      setError("Choose a desktop image for the slide.");
      return;
    }

    const fd = new FormData();
    fd.append("title", form.title.trim());
    fd.append("description", form.description.trim());
    fd.append("textTone", form.textTone);
    fd.append("active", String(form.active));
    if (desktopFile) fd.append("desktopImage", desktopFile);
    if (mobileFile) fd.append("mobileImage", mobileFile);
    if (dropMobile && !mobileFile) fd.append("removeMobileImage", "true");

    setSaving(true);
    try {
      await api(
        editing ? `/api/hero-slides/${editing._id}` : "/api/hero-slides",
        { method: editing ? "PUT" : "POST", body: fd }
      );
      setOpen(false);
      load();
    } catch (e: any) {
      setError(e?.message ?? "Could not save the slide.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(slide: HeroSlideItem) {
    try {
      await api(`/api/hero-slides/${slide._id}`, {
        method: "PUT",
        body: JSON.stringify({ active: slide.active === false }),
      });
      load();
    } catch (e: any) {
      alert(e?.message ?? "Could not update the slide.");
    }
  }

  async function remove(slide: HeroSlideItem) {
    if (
      !confirm(
        `Delete "${slide.title.replace(
          /\n/g,
          " "
        )}"? Its images are removed from the bucket too.`
      )
    )
      return;
    try {
      await api(`/api/hero-slides/${slide._id}`, { method: "DELETE" });
      setSlides((p) => p.filter((s) => s._id !== slide._id));
    } catch (e: any) {
      alert(e?.message ?? "Could not delete the slide.");
    }
  }

  async function move(from: number, to: number) {
    if (to < 0 || to >= slides.length) return;
    const next = [...slides];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setSlides(next); // optimistic — the list re-renders immediately
    setBusy(true);
    try {
      await api("/api/hero-slides/reorder", {
        method: "PUT",
        body: JSON.stringify({ ids: next.map((s) => s._id) }),
      });
    } catch (e: any) {
      alert(e?.message ?? "Could not save the new order.");
      load();
    } finally {
      setBusy(false);
    }
  }

  async function loadDefaults() {
    setBusy(true);
    try {
      await api("/api/hero-slides/seed", { method: "POST" });
      load();
    } catch (e: any) {
      alert(e?.message ?? "Could not load the default slides.");
    } finally {
      setBusy(false);
    }
  }

  if (!isSuper) {
    return (
      <div className="rounded-xl border border-slate-100 bg-white p-12 text-center shadow-sm">
        <Images className="mx-auto h-10 w-10 text-slate-300" />
        <p className="mt-4 font-heading text-lg font-semibold text-dark">
          Superadmin access required
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Only a superadmin can change the homepage slider.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-dark">
            Home slider
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            The slides at the top of the homepage. They play in the order below.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex h-11 items-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-white hover:bg-primary-hover"
        >
          <Plus className="h-4 w-4" /> Add slide
        </button>
      </div>

      <div className="mt-6 space-y-3">
        {loading ? (
          <SkeletonList rows={3} />
        ) : slides.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <Images className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-4 font-heading text-lg font-semibold text-dark">
              The homepage is showing the built-in slides
            </p>
            <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
              Add your own slide to replace them, or copy the built-in ones into
              the dashboard so you can edit their wording and images.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                onClick={openCreate}
                className="inline-flex h-11 items-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-white hover:bg-primary-hover"
              >
                <Plus className="h-4 w-4" /> Add slide
              </button>
              <button
                onClick={loadDefaults}
                disabled={busy}
                className="inline-flex h-11 items-center gap-2 rounded-md border border-slate-200 px-5 text-sm font-medium text-dark hover:bg-light disabled:opacity-60"
              >
                <Sparkles className="h-4 w-4" /> Copy the built-in slides
              </button>
            </div>
          </div>
        ) : (
          slides.map((slide, i) => (
            <div
              key={slide._id}
              className="flex flex-col gap-4 rounded-xl border border-slate-100 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-start gap-4">
                <div className="flex shrink-0 gap-2">
                  <Thumb
                    src={slide.desktopImageUrl}
                    label="Desktop"
                    className="h-16 w-28"
                  />
                  <Thumb
                    src={slide.mobileImageUrl || slide.desktopImageUrl}
                    label={slide.mobileImageUrl ? "Mobile" : "Mobile (same)"}
                    className="h-16 w-12"
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-heading font-semibold text-dark">
                      {slide.title.replace(/\n/g, " ")}
                    </p>
                    {slide.active === false && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                        Hidden
                      </span>
                    )}
                  </div>
                  {slide.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                      {slide.description}
                    </p>
                  )}
                  <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-400">
                    <span>Position {i + 1}</span>
                    <span>
                      {slide.textTone === "dark" ? "Dark copy" : "White copy"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <IconBtn
                  title="Move up"
                  disabled={i === 0 || busy}
                  onClick={() => move(i, i - 1)}
                >
                  <ArrowUp className="h-4 w-4" />
                </IconBtn>
                <IconBtn
                  title="Move down"
                  disabled={i === slides.length - 1 || busy}
                  onClick={() => move(i, i + 1)}
                >
                  <ArrowDown className="h-4 w-4" />
                </IconBtn>
                <IconBtn
                  title={
                    slide.active === false
                      ? "Show on the site"
                      : "Hide from the site"
                  }
                  onClick={() => toggleActive(slide)}
                >
                  {slide.active === false ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <EyeOff className="h-4 w-4" />
                  )}
                </IconBtn>
                <IconBtn title="Edit" onClick={() => openEdit(slide)}>
                  <Pencil className="h-4 w-4" />
                </IconBtn>
                <IconBtn title="Delete" danger onClick={() => remove(slide)}>
                  <Trash2 className="h-4 w-4" />
                </IconBtn>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit slide" : "Add slide"}
      >
        <div className="space-y-4">
          {error && (
            <p className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}

          <FormTextarea
            label="Title"
            value={form.title}
            onChange={(v) => setForm({ ...form, title: v })}
            rows={2}
            placeholder={"Empowering Careers.\nBuilding Futures."}
          />
          <p className="-mt-2 text-xs text-slate-400">
            Press Enter for a line break — the slider keeps it.
          </p>

          <FormTextarea
            label="Description"
            value={form.description}
            onChange={(v) => setForm({ ...form, description: v })}
            placeholder="One or two sentences under the title."
          />

          <ImageField
            label="Website image"
            hint="Shown on tablets and desktops. Wide crop works best — around 1600×620."
            icon={<Monitor className="h-4 w-4" />}
            file={desktopFile}
            existing={editing?.desktopImageUrl}
            onPick={setDesktopFile}
          />

          <ImageField
            label="Mobile image"
            hint="Shown on phones. Taller crop — around 800×1000. Leave empty to reuse the website image."
            icon={<Smartphone className="h-4 w-4" />}
            file={mobileFile}
            existing={dropMobile ? undefined : editing?.mobileImageUrl}
            onPick={(f) => {
              setMobileFile(f);
              if (f) setDropMobile(false);
            }}
            onClear={
              editing?.mobileImageUrl && !mobileFile && !dropMobile
                ? () => setDropMobile(true)
                : undefined
            }
          />

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Text colour
            </label>
            <select
              value={form.textTone}
              onChange={(e) =>
                setForm({
                  ...form,
                  textTone: e.target.value as "light" | "dark",
                })
              }
              className="h-11 w-full rounded-md border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="light">White — for dark images</option>
              <option value="dark">Navy — for light images</option>
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/40"
            />
            Show this slide on the homepage
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
              {saving ? "Saving…" : editing ? "Save changes" : "Add slide"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/** File picker with a live preview of the chosen (or already stored) image. */
function ImageField({
  label,
  hint,
  icon,
  file,
  existing,
  onPick,
  onClear,
}: {
  label: string;
  hint: string;
  icon: React.ReactNode;
  file: File | null;
  existing?: string;
  onPick: (file: File | null) => void;
  onClear?: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  // Object URLs have to be revoked or the blob stays in memory.
  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const shown = preview ?? existing ?? null;

  return (
    <div>
      <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-700">
        {icon} {label}
      </label>
      <div className="flex items-center gap-4 rounded-md border border-dashed border-slate-300 p-3">
        <div className="grid h-16 w-24 shrink-0 place-items-center overflow-hidden rounded bg-light">
          {shown ? (
            <img src={shown} alt="" className="h-full w-full object-cover" />
          ) : (
            <Images className="h-5 w-5 text-slate-300" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-slate-500">{hint}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => inputRef.current?.click()}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-medium text-dark hover:bg-light"
            >
              <Upload className="h-3.5 w-3.5" />
              {shown ? "Replace" : "Choose image"}
            </button>
            {file && (
              <span className="truncate text-xs text-slate-500">
                {file.name}
              </span>
            )}
            {!file && onClear && (
              <button
                onClick={onClear}
                className="text-xs font-medium text-danger hover:underline"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
        className="hidden"
        onChange={(e) => onPick(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}

function Thumb({
  src,
  label,
  className,
}: {
  src: string;
  label: string;
  className: string;
}) {
  return (
    <div className="text-center">
      <div className={`overflow-hidden rounded-md bg-light ${className}`}>
        <img src={src} alt="" className="h-full w-full object-cover" />
      </div>
      <p className="mt-1 text-[10px] text-slate-400">{label}</p>
    </div>
  );
}

function IconBtn({
  children,
  onClick,
  title,
  danger,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`grid h-9 w-9 place-items-center rounded-md text-slate-500 transition-colors hover:bg-light disabled:opacity-30 disabled:hover:bg-transparent ${
        danger ? "hover:text-danger" : "hover:text-primary"
      }`}
    >
      {children}
    </button>
  );
}
