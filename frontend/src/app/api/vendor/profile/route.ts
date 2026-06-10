import { NextRequest, NextResponse } from 'next/server';
import { readDataFile, writeDataFile } from '@/lib/dataFileStore';
import { requireApprovedVendor } from '@/lib/requireApprovedVendor';
import { createDefaultProfileForVendor } from '@/lib/vendorProfileDefaults';
import { findVendorProfileIndex, findVendorProfile } from '@/lib/vendorProfileScope';
import { findVendorBySessionEmail } from '@/lib/vendorLeadScope';
import { getVendorCategories } from '@/lib/vendorCategories';
import { resolveVendorProfileApproval } from '@/lib/vendorApprovalSync';

async function readProfiles() {
    return readDataFile<any[]>('vendor-profiles.json', []);
}

/** Client cannot switch vendor row via body. */
function stripVendorIdentityFromBody(body: Record<string, unknown>) {
    const {
        id: _i,
        userId: _u,
        approvalStatus: _as,
        isApproved: _ia,
        ...rest
    } = body;
    return rest;
}

async function syncVendorCatalogCategories(
    session: { userId: string; email: string },
    categories: string[],
) {
    if (categories.length === 0) return;
    const vendors = await readDataFile<any[]>('vendors.json', []);
    const catalogVendor = findVendorBySessionEmail(vendors, {
        userId: session.userId,
        email: session.email,
        vendorId: `vendor_${session.userId}`,
    });
    if (!catalogVendor) return;
    const idx = vendors.findIndex((v: any) => String(v.id) === String(catalogVendor.id));
    if (idx < 0) return;
    vendors[idx] = {
        ...vendors[idx],
        categories,
        category: categories[0] || vendors[idx].category || '',
    };
    await writeDataFile('vendors.json', vendors);
}

export async function GET(request: NextRequest) {
    try {
        const auth = await requireApprovedVendor(request);
        if (!auth.ok) return auth.response;
        const session = auth.session;

        const data = await readProfiles();
        let profile = findVendorProfile(data, session);

        const vendors = await readDataFile<any[]>('vendors.json', []);
        const catalogVendor = findVendorBySessionEmail(vendors, session);

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

        const serviceCategories = getVendorCategories(catalogVendor, profile);
        profile = {
            ...profile,
            serviceCategories,
        };

        profile = await resolveVendorProfileApproval(session, profile, data);

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
        const auth = await requireApprovedVendor(request);
        if (!auth.ok) return auth.response;
        const session = auth.session;

        const body = (await request.json()) as Record<string, unknown>;
        const safePatch = stripVendorIdentityFromBody(body);
        const data = await readProfiles();
        let index = findVendorProfileIndex(data, session);
        const current =
            index >= 0 ? data[index] : createDefaultProfileForVendor(session.userId, session.email);

        const merged = {
            ...current,
            ...safePatch,
        };
        const vendors = await readDataFile<any[]>('vendors.json', []);
        const catalogVendor = findVendorBySessionEmail(vendors, {
            userId: session.userId,
            email: session.email,
            vendorId: session.vendorId,
        });
        const serviceCategories = getVendorCategories(catalogVendor, merged);

        const updated = {
            ...merged,
            serviceCategories,
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
        await syncVendorCatalogCategories(session, serviceCategories);

        const withApproval = await resolveVendorProfileApproval(session, updated, data);

        return NextResponse.json({
            success: true,
            data: withApproval,
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
