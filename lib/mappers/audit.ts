import { prisma } from "@/lib/prisma";

export type AuditUser = {
  id: number;
  name: string;
};

type AuditFields = {
  createdBy: number | null;
  updatedBy: number | null;
};

export type AuditMapped<T extends AuditFields> = Omit<T, "createdBy" | "updatedBy"> & {
  createdBy: AuditUser | null;
  updatedBy: AuditUser | null;
};

export async function mapAuditUsers<T extends AuditFields>(rows: T[]): Promise<AuditMapped<T>[]> {
  if (rows.length === 0) {
    return [];
  }

  const userIds = [
    ...new Set(rows.flatMap((row) => [row.createdBy, row.updatedBy]).filter((id): id is number => id !== null)),
  ];

  if (userIds.length === 0) {
    return rows.map((row) => ({
      ...row,
      createdBy: null,
      updatedBy: null,
    }));
  }

  const users = await prisma.users.findMany({
    where: { id: { in: userIds } },
    select: {
      id: true,
      name: true,
    },
  });

  const userMap = new Map(users.map((user) => [user.id, user]));

  return rows.map((row) => ({
    ...row,
    createdBy: row.createdBy !== null ? (userMap.get(row.createdBy) ?? null) : null,
    updatedBy: row.updatedBy !== null ? (userMap.get(row.updatedBy) ?? null) : null,
  }));
}
