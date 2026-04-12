import { NextRequest, NextResponse } from 'next/server';
import { readDataFile, writeDataFile } from '@/lib/dataFileStore';
import { getAuthenticatedUserFromRequest } from '@/lib/auth';

const FILE = 'user-planning-blobs.json';

type PlanningStore = {
  users: Record<string, { parts: Record<string, string>; updatedAt: string }>;
};

async function readStore(): Promise<PlanningStore> {
  return readDataFile<PlanningStore>(FILE, { users: {} });
}

async function writeStore(store: PlanningStore): Promise<void> {
  await writeDataFile(FILE, store);
}

/** GET — load all planning JSON blobs for the signed-in user (same keys as localStorage). */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const id = String(user.id);
    const store = await readStore();
    const row = store.users[id];
    return NextResponse.json({
      success: true,
      data: { parts: row?.parts ?? {} },
      updatedAt: row?.updatedAt ?? null,
    });
  } catch (error) {
    console.error('[planning-storage GET]', error);
    return NextResponse.json({ success: false, error: 'Failed to load planning data' }, { status: 500 });
  }
}

/** PUT — replace planning blobs for this user (full snapshot from client localStorage). */
export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthenticatedUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const id = String(user.id);
    const body = await request.json();
    const parts = body?.parts as Record<string, string> | undefined;
    if (!parts || typeof parts !== 'object') {
      return NextResponse.json({ success: false, error: 'Invalid body' }, { status: 400 });
    }
    const store = await readStore();
    store.users[id] = { parts, updatedAt: new Date().toISOString() };
    await writeStore(store);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[planning-storage PUT]', error);
    return NextResponse.json({ success: false, error: 'Failed to save planning data' }, { status: 500 });
  }
}
