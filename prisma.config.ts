import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "packages/infrastructure/src/database/prisma/schema.prisma",
  migrations: {
    path: "packages/infrastructure/src/database/prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
