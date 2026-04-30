// prisma.config.ts refactor
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // For db push / migrate, we MUST use the direct connection
    url: process.env["DIRECT_URL"] || process.env["DATABASE_URL"],
  },
});
