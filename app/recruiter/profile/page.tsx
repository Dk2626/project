"use client";

import { RecruiterProfileCard } from "@/components/RecruiterProfileCard";

export default function RecruiterProfilePage() {
  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-dark">My Profile</h1>
      <p className="mt-1 text-sm text-slate-500">
        Keep your contact and company details up to date — they appear
        alongside every job you post.
      </p>

      <div className="mt-6">
        <RecruiterProfileCard />
      </div>
    </div>
  );
}
