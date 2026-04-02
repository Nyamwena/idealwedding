import { NextRequest, NextResponse } from 'next/server';
import { readDataFile, writeDataFile } from '@/lib/dataFileStore';
import { getVendorSession } from '@/lib/vendorSession';
import { createDefaultProfileForVendor } from '@/lib/vendorProfileDefaults';
import { findVendorProfileIndex, findVendorProfile } from '@/lib/vendorProfileScope';

async function readProfiles() {
    return readDataFile<any[]>('vendor-profiles.json', []);
}

/** Client cannot switch vendor row via body. */
function stripVendorIdentityFromBody(body: Record<string, unknown>) {
    const { id: _i, userId: _u, ...rest } = body;
    return rest;
}

export async function GET(request: NextRequest) {
    try {
        const session = await getVendorSession(request);
        if (!session) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized vendor access' },
                { status: 401 },
            );
        }

        const data = await readProfiles();
        let profile = findVendorProfile(data, session);

        if (!profile) {
            profile = createDefaultProfileForVendor(session.userId, session.email);
            data.push(profile);
            await writeDataFile('vendor-profiles.json', data);
        } else {
            const idx = findVendorProfileIndex(data, session);
            if (idx >= 0 && String(data[idx].userId || '') !== session.userId) {
                data[idx] = { ...data[idx], userId: session.userId };
                profile = data[idx];
                await writeDataFile('vendor-profiles.json', data);
            }
        }

        return NextResponse.json({ success: true, data: profile });
    } catch (error) {
        console.error('Error reading vendor profile:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to read vendor profile data' },
            { status: 500 },
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const session = await getVendorSession(request);
        if (!session) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized vendor access' },
                { status: 401 },
            );
        }

        const body = (await request.json()) as Record<string, unknown>;
        const safePatch = stripVendorIdentityFromBody(body);
        const data = await readProfiles();
        let index = findVendorProfileIndex(data, session);
        const current =
            index >= 0 ? data[index] : createDefaultProfileForVendor(session.userId, session.email);

        const updated = {
            ...current,
            ...safePatch,
            id: current.id,
            userId: session.userId,
            lastUpdated: new Date().toISOString(),
        };

        if (index >= 0) {
            data[index] = updated;
        } else {
            data.push(updated);
        }

        await writeDataFile('vendor-profiles.json', data);

        return NextResponse.json({
            success: true,
            data: updated,
            message: 'Vendor profile updated successfully',
        });
    } catch (error) {
        console.error('Error updating vendor profile:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update vendor profile' },
            { status: 500 },
        );
    }
}
