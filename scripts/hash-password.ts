// Generate a bcrypt hash for the single admin password.
//   npx tsx scripts/hash-password.ts "your-password"
// Prints a ready-to-paste line for .env.local with the `$` escaped, because
// Next's env loader expands unescaped `$` and would mangle the hash.
import bcrypt from "bcryptjs";

const password = process.argv[2];

if (!password) {
  console.error('Usage: npx tsx scripts/hash-password.ts "<your-password>"');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 12);
const escaped = hash.replace(/\$/g, "\\$");

console.log("\nPaste this line into .env.local ($ are escaped for Next):\n");
console.log(`ADMIN_PASSWORD_HASH="${escaped}"`);
console.log("");
