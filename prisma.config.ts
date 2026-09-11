import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Migrations need a direct (unpooled) connection: PgBouncer runs in
    // transaction mode, so the session-level advisory lock `migrate deploy`
    // takes never settles and the command dies with P1002. Neon's unpooled
    // host is the pooled one without the `-pooler` suffix.
    url: process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"],
  },
});
