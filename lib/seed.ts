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
        { name: "tickets:categories:view" },
        { name: "tickets:categories:create" },
        { name: "tickets:categories:edit" },
        { name: "tickets:categories:delete" },
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
        { name: "tenants:leases:view" },
        { name: "tenants:leases:create" },
        { name: "tenants:leases:edit" },
        { name: "employees:view" },
        { name: "employees:create" },
        { name: "employees:edit" },
        { name: "employees:delete" },
        { name: "employees:permissions:view" },
        { name: "employees:permissions:create" },
        { name: "employees:permissions:delete" },
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
          in: [
            "inbox:view",
            "inbox:send",
            "tickets:view",
            "tickets:create",
            "tickets:edit",
            "tickets:delete",
            "tickets:categories:view",
            "tickets:categories:create",
            "tickets:categories:edit",
            "tickets:categories:delete",
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

  const propertiesCount = await prisma.properties.count();
  if (propertiesCount === 0) {
    await prisma.properties.createMany({
      data: [
        { name: "Sunset Villas", address: "100 Sunset Blvd" },
        { name: "Oak Ridge Apartments", address: "200 Oak Ridge Ave" },
      ],
    });
  }

  const properties = await prisma.properties.findMany({
    orderBy: { id: "asc" },
    take: 2,
  });

  const unitsCount = await prisma.units.count();
  if (unitsCount === 0 && properties.length >= 2) {
    await prisma.units.createMany({
      data: [
        { propertyId: properties[0].id, code: "A-101" },
        { propertyId: properties[0].id, code: "A-102" },
        { propertyId: properties[1].id, code: "B-201" },
        { propertyId: properties[1].id, code: "B-202" },
      ],
    });
  }

  const tenantsCount = await prisma.tenants.count();
  if (tenantsCount === 0 && properties.length >= 2) {
    await prisma.tenants.createMany({
      data: [
        {
          propertyId: properties[0].id,
          name: "Alex Peterson",
          address: "100 Sunset Blvd, Unit A-101",
          phoneNumber: "+15550000001",
        },
        {
          propertyId: properties[1].id,
          name: "Jordan Smith",
          address: "200 Oak Ridge Ave, Unit B-201",
          phoneNumber: "+15550000002",
        },
      ],
    });
  }

  const leasesCount = await prisma.leases.count();
  if (leasesCount === 0 && properties.length >= 2) {
    const [p1FirstUnit, p2FirstUnit] = await Promise.all([
      prisma.units.findFirst({ where: { propertyId: properties[0].id }, orderBy: { id: "asc" } }),
      prisma.units.findFirst({ where: { propertyId: properties[1].id }, orderBy: { id: "asc" } }),
    ]);

    const [p1Tenant, p2Tenant] = await Promise.all([
      prisma.tenants.findFirst({ where: { propertyId: properties[0].id }, orderBy: { id: "asc" } }),
      prisma.tenants.findFirst({ where: { propertyId: properties[1].id }, orderBy: { id: "asc" } }),
    ]);

    if (p1FirstUnit && p1Tenant && p2FirstUnit && p2Tenant) {
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setFullYear(endDate.getFullYear() + 1);

      await prisma.leases.createMany({
        data: [
          {
            propertyId: properties[0].id,
            unitId: p1FirstUnit.id,
            tenantId: p1Tenant.id,
            startDate,
            endDate,
            status: "active",
          },
          {
            propertyId: properties[1].id,
            unitId: p2FirstUnit.id,
            tenantId: p2Tenant.id,
            startDate,
            endDate,
            status: "active",
          },
        ],
      });
    }
  }

  const employeesCount = await prisma.employees.count();
  if (employeesCount === 0 && properties.length >= 2) {
    const [dispatcherRole, workerRole] = await Promise.all([
      prisma.role.findUniqueOrThrow({ where: { name: "dispatcher" } }),
      prisma.role.findUniqueOrThrow({ where: { name: "worker" } }),
    ]);

    const hashedPassword = await bcrypt.hash("password123", 10);

    const [employeeAUser, employeeBUser, employeeCUser, employeeDUser] = await prisma.$transaction([
      prisma.users.create({
        data: {
          name: "Mason Brooks",
          email: "mason.brooks@example.com",
          password: hashedPassword,
          roleId: workerRole.id,
        },
      }),
      prisma.users.create({
        data: {
          name: "Ava Reynolds",
          email: "ava.reynolds@example.com",
          password: hashedPassword,
          roleId: dispatcherRole.id,
        },
      }),

      prisma.users.create({
        data: {
          name: "Noah Patel",
          email: "noah.patel@example.com",
          password: hashedPassword,
          roleId: workerRole.id,
        },
      }),
      prisma.users.create({
        data: {
          name: "Sophia Martinez",
          email: "sophia.martinez@example.com",
          password: hashedPassword,
          roleId: dispatcherRole.id,
        },
      }),
    ]);

    const [employeeA, employeeB, employeeC, employeeD] = await prisma.$transaction([
      prisma.employees.create({
        data: {
          userId: employeeAUser.id,
          phoneNumber: "+15550001001",
          address: "1 Service Rd",
        },
      }),
      prisma.employees.create({
        data: {
          userId: employeeBUser.id,
          phoneNumber: "+15550001002",
          address: "2 Service Rd",
        },
      }),
      prisma.employees.create({
        data: {
          userId: employeeCUser.id,
          phoneNumber: "+15550001003",
          address: "3 Service Rd",
        },
      }),
      prisma.employees.create({
        data: {
          userId: employeeDUser.id,
          phoneNumber: "+15550001004",
          address: "4 Service Rd",
        },
      }),
    ]);

    await prisma.employeePermissions.createMany({
      data: [
        { employeeId: employeeA.id, propertyId: properties[0].id },
        { employeeId: employeeB.id, propertyId: properties[0].id },
        { employeeId: employeeC.id, propertyId: properties[1].id },
        { employeeId: employeeD.id, propertyId: properties[1].id },
      ],
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
