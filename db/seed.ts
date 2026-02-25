import "dotenv/config";
import { users } from "./schema";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import bcrypt from "bcryptjs";

async function seed() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required");
  }

  const existingAdmin = await db.select().from(users).where(eq(users.email, adminEmail)).limit(1);

  if (existingAdmin.length > 0) {
    console.log("Admin user already exists, skipping seed...");
    return;
  }

  await db.insert(users).values({
    name: "Administrator",
    email: adminEmail,
    password: await bcrypt.hash(adminPassword, 10),
    role: "super-admin",
  });

  console.log("✓ Admin user seeded successfully");
  process.exit(0);
}

seed().catch((error) => {
  console.error("Error seeding database:", error);
  process.exit(1);
});
