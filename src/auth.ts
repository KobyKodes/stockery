import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

// One admin. Username and bcrypt hash live in env vars; there is no user table.
export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const adminUsername = process.env.ADMIN_USERNAME;
        const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
        if (!adminUsername || !adminPasswordHash) {
          console.error("ADMIN_USERNAME and ADMIN_PASSWORD_HASH must be set. Login is disabled until they are.");
          return null;
        }
        if (credentials.username !== adminUsername) return null;
        const valid = await bcrypt.compare(String(credentials.password ?? ""), adminPasswordHash);
        return valid ? { id: "1", name: "Admin" } : null;
      },
    }),
  ],
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
});
