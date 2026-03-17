import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  const roles = await prisma.role.count();
  if (roles === 0) {
    await prisma.role.createMany({
      data: [{ name: "super-admin" }, { name: "dispatcher" }, { name: "worker" }],
    });
  }

  const permissions = await prisma.permission.count();
  if (permissions === 0) {
    await prisma.permission.createMany({
      data: [
        { name: "dashboard:view" },
        { name: "inbox:view" },
        { name: "inbox:send" },
        { name: "whatsapp:view" },
        { name: "whatsapp:create" },
        { name: "whatsapp:edit" },
        { name: "whatsapp:delete" },
        { name: "tickets:view" },
        { name: "tickets:create" },
        { name: "tickets:edit" },
        { name: "tickets:delete" },
        { name: "tickets:assigned" },
        { name: "properties:view" },
        { name: "properties:create" },
        { name: "properties:edit" },
        { name: "properties:delete" },
        { name: "units:view" },
        { name: "units:create" },
        { name: "units:edit" },
        { name: "units:delete" },
        { name: "tenants:view" },
        { name: "tenants:create" },
        { name: "tenants:edit" },
        { name: "tenants:delete" },
        { name: "employees:view" },
        { name: "employees:create" },
        { name: "employees:edit" },
        { name: "employees:delete" },
      ],
    });
  }

  const rolePermissions = await prisma.rolePermissions.count();

  if (rolePermissions === 0) {
    const dispatcherRole = await prisma.role.findUniqueOrThrow({
      where: {
        name: "dispatcher",
      },
    });
    const dispatcherPermissions = await prisma.permission.findMany({
      where: {
        name: {
          in: ["inbox:view", "inbox:send", "tickets:view", "tickets:create", "tickets:edit", "tickets:delete"],
        },
      },
    });
    await prisma.rolePermissions.createMany({
      data: dispatcherPermissions.map((permission) => ({ roleId: dispatcherRole.id, permissionId: permission.id })),
    });

    const workerRole = await prisma.role.findUniqueOrThrow({
      where: {
        name: "worker",
      },
    });
    const workerPermissions = await prisma.permission.findMany({
      where: {
        name: {
          in: ["tickets:assigned"],
        },
      },
    });
    await prisma.rolePermissions.createMany({
      data: workerPermissions.map((permission) => ({ roleId: workerRole.id, permissionId: permission.id })),
    });
  }

  const superAdmin = await prisma.users.findFirst({
    where: {
      email: process.env.ADMIN_EMAIL,
      role: {
        name: "super-admin",
      },
    },
  });

  if (!superAdmin) {
    const superAdminRole = await prisma.role.findUniqueOrThrow({
      where: {
        name: "super-admin",
      },
    });

    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD as string, 10);
    await prisma.users.create({
      data: {
        name: "Admin",
        email: process.env.ADMIN_EMAIL as string,
        password: hashedPassword,
        roleId: superAdminRole.id,
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
