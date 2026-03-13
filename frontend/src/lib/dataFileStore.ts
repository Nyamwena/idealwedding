import fs from "fs";
import path from "path";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const LEGACY_DATA_DIR = path.join(process.cwd(), "data");

function normalizeName(name: string): string {
  return name.endsWith(".json") ? name : `${name}.json`;
}

function readLegacyFile<T>(fileName: string, fallback: T): T {
  const legacyPath = path.join(LEGACY_DATA_DIR, fileName);
  if (!fs.existsSync(legacyPath)) return fallback;

  try {
    const content = fs.readFileSync(legacyPath, "utf8");
    return JSON.parse(content) as T;
  } catch {
    return fallback;
  }
}

function writeLegacyFile(fileName: string, value: unknown): void {
  const legacyPath = path.join(LEGACY_DATA_DIR, fileName);
  try {
    if (!fs.existsSync(LEGACY_DATA_DIR)) {
      fs.mkdirSync(LEGACY_DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(legacyPath, JSON.stringify(value, null, 2));
  } catch {
    // Keep writes best-effort only.
  }
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

    const seeded = readLegacyFile(fileName, fallback);

    await prisma.dataFile.create({
      data: {
        name: fileName,
        data: seeded as Prisma.InputJsonValue,
      },
    });

    return seeded;
  } catch {
    // Safety fallback if DB is unavailable.
    return readLegacyFile(fileName, fallback);
  }
}

export async function writeDataFile<T>(name: string, data: T): Promise<void> {
  const fileName = normalizeName(name);

  try {
    await prisma.dataFile.upsert({
      where: { name: fileName },
      update: { data: data as Prisma.InputJsonValue },
      create: {
        name: fileName,
        data: data as Prisma.InputJsonValue,
      },
    });
  } finally {
    // Keep legacy file mirrored for compatibility/rollback.
    writeLegacyFile(fileName, data);
  }
}
