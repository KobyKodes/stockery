// Usage: node scripts/hash-password.mjs "your password"
// Prints the value to use for ADMIN_PASSWORD_HASH (bcrypt, cost 12).
// In a local .env file every `$` must be escaped as `\$`; the escaped form is
// printed below. On Render's dashboard paste the raw hash as-is.
import bcrypt from "bcryptjs";

const password = process.argv[2];
if (!password) {
  console.error('Usage: node scripts/hash-password.mjs "your password"');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 12);
console.log("Raw hash (for Render):");
console.log(hash);
console.log("\nEscaped for a local .env:");
console.log("ADMIN_PASSWORD_HASH=" + hash.replaceAll("$", "\\$"));
