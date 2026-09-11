// Usage: node scripts/check-password-hash.mjs '<hash>'
//        node scripts/check-password-hash.mjs '<hash>' 'the password'
//
// Checks that a value is a well-formed ADMIN_PASSWORD_HASH before it goes
// into Render, because a malformed one fails in ways that read like a wrong
// password: bcryptjs returns a silent false for anything that is not exactly
// 60 characters, and throws "Illegal salt length" when it is 60 characters
// but carries a character the bcrypt alphabet does not have. Pass the
// password as a second argument to also confirm it actually matches.
import bcrypt from "bcryptjs";

const raw = process.argv[2];
const password = process.argv[3];

if (!raw) {
  console.error("Usage: node scripts/check-password-hash.mjs '<hash>' ['password']");
  process.exit(1);
}

const problems = [];
const show = (s) => JSON.stringify(s);

if (raw !== raw.trim()) problems.push(`Surrounding whitespace or a newline: starts ${show(raw.slice(0, 3))}, ends ${show(raw.slice(-3))}.`);
if (/^["']|["']$/.test(raw.trim())) problems.push("Wrapped in quotes. Render stores the value literally - paste it bare.");
if (raw.includes("\\$")) problems.push("Contains backslash-escaped dollars. That form is only for a local .env file; Render wants the raw hash.");

const hash = raw.trim().replace(/^["']|["']$/g, "");

if (!/^\$2[aby]\$\d{2}\$/.test(hash)) {
  problems.push(`Does not start with a bcrypt prefix like $2b$12$. Got ${show(hash.slice(0, 7))}.`);
} else if (hash.length !== 60) {
  problems.push(`Wrong length: ${hash.length} characters, not 60. bcryptjs returns false for this without an error, which looks exactly like a wrong password.`);
} else {
  // The alphabet bcrypt's own base64 uses. Decoding stops at the first
  // character outside it, which is what produces "Illegal salt length".
  const body = hash.slice(7);
  const bad = [...body].findIndex((c) => !/[./A-Za-z0-9]/.test(c));
  if (bad !== -1) {
    problems.push(
      `Character ${bad + 8} of the hash is ${show(body[bad])}, which is not in the bcrypt alphabet (. / A-Z a-z 0-9). ` +
        `Decoding stops there, so the salt comes out short and bcryptjs throws "Illegal salt length".`,
    );
  }
}

if (problems.length) {
  console.error("This value will not work:\n");
  for (const p of problems) console.error("  - " + p);
  process.exit(1);
}

try {
  await bcrypt.compare("probe", hash);
} catch (e) {
  console.error("This value will not work:\n\n  - bcrypt rejected it: " + e.message);
  process.exit(1);
}

console.log(`Well-formed: ${hash.slice(0, 7)} + 22-character salt + 31-character digest, 60 characters total.`);

if (password !== undefined) {
  console.log((await bcrypt.compare(password, hash)) ? "That password matches this hash." : "That password does NOT match this hash.");
}
