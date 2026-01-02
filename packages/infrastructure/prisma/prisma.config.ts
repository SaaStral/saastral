import { defineConfig } from "prisma/config";
import "dotenv/config";

export default defineConfig({
  schema: "schema.prisma",
  migrations: {
    path: "migrations",
    seed: "tsx ./prisma/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/saastral',
  },
});
