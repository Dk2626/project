/**
 * Seed an admin user directly against MongoDB (no server needed).
 *
 * Usage:
 *   node scripts/seed-admin.mjs                       # uses defaults below
 *   ADMIN_EMAIL=you@urav.com ADMIN_PASSWORD=Secret123 node scripts/seed-admin.mjs
 *
 * Requires MONGODB_URI to be set (it reads .env.local automatically if present).
 */
import { readFileSync } from "node:fs";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// Minimal .env.local loader (so you don't need dotenv installed).
try {
  const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  for (const line of env.split("\n")) {
    const m = line.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]])
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch {
  /* no .env.local — rely on real environment */
}

const MONGODB_URI = process.env.MONGODB_URI;
console.log("MONGODB_URI", MONGODB_URI);
if (!MONGODB_URI) {
  console.error(
    "MONGODB_URI is not set. Add it to .env.local or the environment."
  );
  process.exit(1);
}

const email = (process.env.ADMIN_EMAIL || "admin@urav.com").toLowerCase();
const password = process.env.ADMIN_PASSWORD || "Admin@12345";

const userSchema = new mongoose.Schema(
  {
    firstName: String,
    lastName: String,
    email: { type: String, unique: true },
    password: String,
    role: String,
  },
  { timestamps: true, strict: false }
);
const User = mongoose.models.User || mongoose.model("User", userSchema);

await mongoose.connect(MONGODB_URI);
const hash = await bcrypt.hash(password, 10);

const existing = await User.findOne({ email });
if (existing) {
  existing.role = "admin";
  if (process.env.ADMIN_PASSWORD) existing.password = hash;
  await existing.save();
  console.log(`Updated existing user ${email} -> admin.`);
} else {
  await User.create({
    firstName: "URAV",
    lastName: "Admin",
    email,
    password: hash,
    role: "admin",
  });
  console.log(`Created admin ${email}.`);
}

console.log(`\nLogin with:\n  email:    ${email}\n  password: ${password}\n`);
await mongoose.disconnect();
process.exit(0);
