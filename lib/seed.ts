import { AVAILABLE_PERMISSIONS } from "@/lib/constants";
import { prisma } from "@/lib/db/prisma";
import bcrypt from "bcryptjs";

async function main() {
  const roles = await prisma.role.count();
  if (roles === 0) {
    await prisma.role.createMany({
      data: [{ name: "super-admin" }, { name: "dispatcher" }, { name: "worker" }, { name: "manager" }],
    });
  }

  const permissions = await prisma.permission.count();
  if (permissions === 0) {
    await prisma.permission.createMany({
      data: AVAILABLE_PERMISSIONS.map((permission) => ({ name: permission })),
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
          in: [
            "inbox:view",
            "inbox:send",
            "tickets:view",
            "tickets:create",
            "tickets:edit",
            "tickets:delete",
            "tickets-progress:view",
            "tickets-progress:create",
            "tickets-progress:edit",
            "tickets-categories:view",
            "tickets-categories:create",
            "tickets-categories:edit",
            "tickets-categories:delete",
          ],
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
          in: ["tickets:view", "tickets-progress:view", "tickets-progress:create", "tickets-progress:edit"],
        },
      },
    });
    await prisma.rolePermissions.createMany({
      data: workerPermissions.map((permission) => ({ roleId: workerRole.id, permissionId: permission.id })),
    });

    const managerRole = await prisma.role.findUniqueOrThrow({
      where: {
        name: "manager",
      },
    });
    const managerPermissions = await prisma.permission.findMany({
      where: {
        name: {
          in: [
            "units:view",
            "units:create",
            "units:edit",
            "units:delete",
            "tenants:view",
            "tenants:create",
            "tickets:view",
            "tickets-progress:view",
            "tenants:edit",
            "tenants:delete",
            "tenants-leases:view",
            "tenants-leases:create",
            "tenants-leases:edit",
          ],
        },
      },
    });
    await prisma.rolePermissions.createMany({
      data: managerPermissions.map((permission) => ({ roleId: managerRole.id, permissionId: permission.id })),
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
