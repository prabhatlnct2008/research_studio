import bcrypt from "bcryptjs";

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// Readable temp password for admin-issued accounts (FRD onboarding change:
// password auth with temp passwords the user changes on first sign-in).
export function generateTempPassword(): string {
  const words = ["River", "Maple", "Quartz", "Harbor", "Cobalt", "Linen", "Willow", "Ember"];
  const w = words[Math.floor(Math.random() * words.length)];
  const n = Math.floor(1000 + Math.random() * 9000);
  return `${w}-${n}`;
}
