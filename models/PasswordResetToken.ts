import mongoose, { Schema, model, models, type InferSchemaType } from "mongoose";

/**
 * One row per "forgot my password" request.
 *
 * The raw token only ever exists in the email that went out — what we keep
 * here is its SHA-256 hash, exactly like a password. So a leaked database
 * dump can't be used to take over accounts.
 *
 * Rows delete themselves: the TTL index on `expiresAt` has Mongo drop each
 * document the moment it expires, so this collection never needs sweeping.
 */
const passwordResetTokenSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    /** SHA-256 hex digest of the token sent in the email. */
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    /** Set when the link is spent — a reset link works exactly once. */
    usedAt: { type: Date },
  },
  { timestamps: true }
);

// expireAfterSeconds: 0 means "delete when expiresAt is reached".
passwordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type PasswordResetTokenDoc = InferSchemaType<
  typeof passwordResetTokenSchema
> & { _id: mongoose.Types.ObjectId };

export const PasswordResetToken =
  models.PasswordResetToken ||
  model("PasswordResetToken", passwordResetTokenSchema);
