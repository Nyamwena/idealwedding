import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

function normalizeName(name: string): string {
  return name.endsWith(".json") ? name : `${name}.json`;
}

export async function readDataFile<T>(
  name: string,
  fallback: T
): Promise<T> {
  const fileName = normalizeName(name);

  try {
    const existing = await prisma.dataFile.findUnique({
      where: { name: fileName },
      select: { data: true },
    });

    if (existing) {
      return existing.data as T;
    }

    await prisma.dataFile.create({
      data: {
        name: fileName,
        data: fallback as Prisma.InputJsonValue,
      },
    });

    return fallback;
  } catch {
    // DB-first persistence only: if unavailable, return in-memory fallback.
    return fallback;
  }
}

export async function writeDataFile<T>(name: string, data: T): Promise<void> {
  const fileName = normalizeName(name);
  await prisma.dataFile.upsert({
    where: { name: fileName },
    update: { data: data as Prisma.InputJsonValue },
    create: {
      name: fileName,
      data: data as Prisma.InputJsonValue,
    },
  });
}
