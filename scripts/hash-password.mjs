// Usage: node scripts/hash-password.mjs "your password" [--copy]
//
// Prints the value to use for ADMIN_PASSWORD_HASH (bcrypt, cost 12), and
// verifies its own output before printing, so a hash that reaches you is
// known to be well-formed and to match the password given.
//
// A bcrypt hash is exactly 60 characters of ., /, A-Z, a-z and 0-9. If what
// lands in Render has anything else in it - a "?", a "^", a different length
// - it was mangled in transit, not mis-generated. `--copy` puts it straight
// on the clipboard (macOS) to keep it out of the terminal altogether.
//
// In a local .env file every `$` must be escaped as `\$`; the escaped form is
// printed below. On Render's dashboard paste the raw hash as-is.
import bcrypt from "bcryptjs";
import { spawnSync } from "node:child_process";

const args = process.argv.slice(2);
const copy = args.includes("--copy");
const password = args.find((a) => a !== "--copy");

if (!password) {
  console.error('Usage: node scripts/hash-password.mjs "your password" [--copy]');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 12);

// Never hand out a hash without checking it round-trips. This has caught
// nothing so far, and costs one compare - but the failure it guards against
// is indistinguishable from a forgotten password once it is in Render.
if (hash.length !== 60 || !/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(hash) || !bcrypt.compareSync(password, hash)) {
  console.error("Generated hash failed its own check. Do not use it; please report this.");
  process.exit(1);
}

if (copy) {
  const r = spawnSync("pbcopy", { input: hash });
  if (r.error || r.status !== 0) {
    console.error("Could not reach pbcopy; printing instead.\n");
  } else {
    console.log("Hash copied to the clipboard. Paste it into ADMIN_PASSWORD_HASH on Render.");
    console.log(`(${hash.length} characters, starting ${hash.slice(0, 7)} and ending ${hash.slice(-4)}.)`);
    process.exit(0);
  }
}

console.log("Raw hash (for Render):");
console.log(hash);
console.log("\nEscaped for a local .env:");
console.log("ADMIN_PASSWORD_HASH=" + hash.replaceAll("$", "\\$"));
