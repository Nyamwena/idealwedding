import fs from "fs/promises";
import path from "path";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

function normalizeName(name: string): string {
  return name.endsWith(".json") ? name : `${name}.json`;
}

/** If MySQL is down, misconfigured, or the socket hangs, Prisma can stall indefinitely; cap wait time so API routes still respond. */
const PRISMA_OP_TIMEOUT_MS = 5_000;

async function readDataFileFromDisk<T>(fileName: string): Promise<T | null> {
  try {
    const filePath = path.join(process.cwd(), "data", fileName);
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function writeDataFileToDisk<T>(fileName: string, data: T): Promise<void> {
  const dir = path.join(process.cwd(), "data");
  await fs.mkdir(dir, { recursive: true });
  const filePath = path.join(dir, fileName);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
}

async function withPrismaTimeout<T>(operation: string, promise: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`Prisma ${operation} timed out after ${PRISMA_OP_TIMEOUT_MS}ms`)),
          PRISMA_OP_TIMEOUT_MS,
        );
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function readDataFile<T>(
  name: string,
  fallback: T
): Promise<T> {
  const fileName = normalizeName(name);

  try {
    const existing = await withPrismaTimeout(
      "findUnique",
      prisma.dataFile.findUnique({
        where: { name: fileName },
        select: { data: true },
      }),
    );

    if (existing) {
      return existing.data as T;
    }

    await withPrismaTimeout(
      "create",
      prisma.dataFile.create({
        data: {
          name: fileName,
          data: fallback as Prisma.InputJsonValue,
        },
      }),
    );

    return fallback;
  } catch {
    // Prefer repo `data/*.json` when DB is unavailable (common in local dev with wrong DATABASE_URL).
    const fromDisk = await readDataFileFromDisk<T>(fileName);
    if (fromDisk !== null) return fromDisk;
    return fallback;
  }
}

export async function writeDataFile<T>(name: string, data: T): Promise<void> {
  const fileName = normalizeName(name);
  try {
    await withPrismaTimeout(
      "upsert",
      prisma.dataFile.upsert({
        where: { name: fileName },
        update: { data: data as Prisma.InputJsonValue },
        create: {
          name: fileName,
          data: data as Prisma.InputJsonValue,
        },
      }),
    );
  } catch {
    try {
      await writeDataFileToDisk(fileName, data);
    } catch {
      // Best-effort persistence when DB and disk both fail.
    }
  }
}
