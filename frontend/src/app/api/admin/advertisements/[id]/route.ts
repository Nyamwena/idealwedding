import { NextRequest, NextResponse } from 'next/server';
import { readDataFile, writeDataFile } from '@/lib/dataFileStore';

// Helper function to read advertisements
function readAdvertisements() {
  return readDataFile<any>('advertisements.json', { bannerAds: [], adSenseConfig: null });
}

function readVendors() {
  return readDataFile<any[]>('vendors.json', []);
}

// Helper function to write advertisements
function writeAdvertisements(data: any) {
  return writeDataFile('advertisements.json', data);
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const advertisements = await readAdvertisements();
    const ad = advertisements.bannerAds.find((a: any) => a.id === params.id);
    
    if (!ad) {
      return NextResponse.json({
        success: false,
        error: 'Advertisement not found'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      data: ad
    });
  } catch (error) {
    console.error('Error fetching advertisement:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch advertisement'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { action, ...data } = body;
    
    const [advertisements, vendors] = await Promise.all([readAdvertisements(), readVendors()]);
    const adIndex = advertisements.bannerAds.findIndex((a: any) => a.id === params.id);
    
    if (adIndex === -1) {
      return NextResponse.json({
        success: false,
        error: 'Advertisement not found'
      }, { status: 404 });
    }
    
    const ad = advertisements.bannerAds[adIndex];
    
    // Update advertisement based on action
    switch (action) {
      case 'update_status':
        if (!data.status) {
          return NextResponse.json({
            success: false,
            error: 'Status is required for update_status action'
          }, { status: 400 });
        }
        if (String(data.status) === 'active' && !String(ad.vendorId || '').trim()) {
          return NextResponse.json({
            success: false,
            error: 'Ad cannot be active without a linked vendor'
          }, { status: 400 });
        }
        ad.status = data.status;
        ad.updatedAt = new Date().toISOString();
        break;
        
      case 'update_performance':
        if (data.clicks !== undefined) ad.clicks = data.clicks;
        if (data.impressions !== undefined) ad.impressions = data.impressions;
        if (data.ctr !== undefined) ad.ctr = data.ctr;
        ad.updatedAt = new Date().toISOString();
        break;
        
      case 'update_details':
        if (data.vendorId !== undefined) {
          const vendorId = String(data.vendorId || '').trim();
          if (!vendorId) {
            return NextResponse.json({
              success: false,
              error: 'vendorId is required. Ads must be linked to a vendor.'
            }, { status: 400 });
          }
          const vendor = vendors.find((v: any) => String(v.id) === vendorId);
          if (!vendor) {
            return NextResponse.json({
              success: false,
              error: 'Linked vendor not found'
            }, { status: 400 });
          }
          data.vendorId = vendorId;
          if (!data.advertiser) data.advertiser = String(vendor.name || '');
          if (!data.advertiserEmail) data.advertiserEmail = String(vendor.email || '');
          if (!data.category) data.category = String(vendor.category || '');
        }
        Object.keys(data).forEach(key => {
          if (data[key] !== undefined) {
            ad[key] = data[key];
          }
        });
        if (!String(ad.vendorId || '').trim()) {
          return NextResponse.json({
            success: false,
            error: 'vendorId is required. Ads must be linked to a vendor.'
          }, { status: 400 });
        }
        if (String(ad.status) === 'active') {
          const linkedVendor = vendors.find((v: any) => String(v.id) === String(ad.vendorId));
          if (!linkedVendor) {
            return NextResponse.json({
              success: false,
              error: 'Active ad has invalid vendor link'
            }, { status: 400 });
          }
        }
        ad.updatedAt = new Date().toISOString();
        break;
        
      default:
        // Update all provided fields
        Object.keys(data).forEach(key => {
          if (data[key] !== undefined) {
            ad[key] = data[key];
          }
        });
        ad.updatedAt = new Date().toISOString();
    }
    
    advertisements.bannerAds[adIndex] = ad;
    await writeAdvertisements(advertisements);
    
    return NextResponse.json({
      success: true,
      data: ad,
      message: 'Advertisement updated successfully'
    });
  } catch (error) {
    console.error('Error updating advertisement:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update advertisement'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const advertisements = await readAdvertisements();
    const adIndex = advertisements.bannerAds.findIndex((a: any) => a.id === params.id);
    
    if (adIndex === -1) {
      return NextResponse.json({
        success: false,
        error: 'Advertisement not found'
      }, { status: 404 });
    }
    
    const deletedAd = advertisements.bannerAds[adIndex];
    advertisements.bannerAds.splice(adIndex, 1);
    await writeAdvertisements(advertisements);
    
    return NextResponse.json({
      success: true,
      data: deletedAd,
      message: 'Advertisement deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting advertisement:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete advertisement'
    }, { status: 500 });
  }
}
