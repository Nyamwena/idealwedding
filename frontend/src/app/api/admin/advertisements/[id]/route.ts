import { NextRequest, NextResponse } from 'next/server';
import { readDataFile, writeDataFile } from '@/lib/dataFileStore';

// Helper function to read advertisements
function readAdvertisements() {
  return readDataFile<any>('advertisements.json', { bannerAds: [], adSenseConfig: null });
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
    
    const advertisements = await readAdvertisements();
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
        Object.keys(data).forEach(key => {
          if (data[key] !== undefined) {
            ad[key] = data[key];
          }
        });
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
