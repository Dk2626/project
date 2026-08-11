import { connectDB } from "@/lib/db";
import { User } from "@/models/User";

/**
 * One place for "look this email up in the users collection".
 *
 * Every route used to hand-roll `User.findOne({ email })` with its own
 * lowercasing/trimming, which meant an address typed as "  Ravi@Gmail.com "
 * matched in one place and missed in another. These helpers normalise the
 * address the same way the schema does (`lowercase: true, trim: true`) so a
 * lookup always hits the unique index on `email`.
 */

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Lowercase + trim, exactly like the schema stores it. */
export function normalizeEmail(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value);
}

/**
 * Find a user by email address.
 *
 * @param email  raw input from the client — normalised here.
 * @param select optional projection, e.g. "+password" or "_id firstName".
 * @returns the Mongoose document, or `null` when nobody uses that address.
 */
export async function findByEmail(
  email: unknown,
  select?: string
): Promise<any | null> {
  const address = normalizeEmail(email);
  if (!address) return null;

  await connectDB();

  const query = User.findOne({ email: address });
  if (select) query.select(select);
  return query.exec();
}

/**
 * Cheap "is this address taken?" check — reads only `_id` and returns a plain
 * object, so it's the right call for register / edit clash checks.
 */
export async function findIdByEmail(
  email: unknown
): Promise<{ _id: any } | null> {
  const address = normalizeEmail(email);
  if (!address) return null;

  await connectDB();
  return User.findOne({ email: address }).select("_id").lean<{ _id: any }>();
}

/** True when an account already exists with this address. */
export async function emailExists(email: unknown): Promise<boolean> {
  return (await findIdByEmail(email)) !== null;
}
