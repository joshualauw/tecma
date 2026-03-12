import { UserRole } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  const admin = await prisma.users.findFirst({
    where: {
      email: process.env.ADMIN_EMAIL,
      role: UserRole.super_admin,
    },
  });

  if (!admin) {
    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD as string, 10);
    await prisma.users.create({
      data: {
        name: "Admin",
        email: process.env.ADMIN_EMAIL as string,
        password: hashedPassword,
        role: UserRole.super_admin,
      },
    });
  }

  console.log("🌱 Database seeded successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
