import { PrismaClient } from "@prisma/client";

// Prisma 7+ requires moving the DB connection here
export const prisma = new PrismaClient({
  adapter: {
    type: "postgresql",
    url: process.env.DATABASE_URL,
  },
});
