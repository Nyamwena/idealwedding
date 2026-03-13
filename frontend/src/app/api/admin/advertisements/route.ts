import { NextRequest, NextResponse } from 'next/server';
import { readDataFile, writeDataFile } from '@/lib/dataFileStore';

// Helper function to read advertisements
function readAdvertisements() {
  return readDataFile<any>('advertisements.json', {
    bannerAds: [],
    adSenseConfig: {
      enabled: false,
      clientId: '',
      adSlots: {
        header: '',
        sidebar: '',
        footer: '',
        content: ''
      },
      revenue: 0,
      impressions: 0,
      clicks: 0,
      lastUpdated: new Date().toISOString()
    }
  });
}

// Helper function to write advertisements
function writeAdvertisements(data: any) {
  return writeDataFile('advertisements.json', data);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    
    const data = await readAdvertisements();
    
    if (type === 'bannerAds') {
      return NextResponse.json({
        success: true,
        data: data.bannerAds || []
      });
    } else if (type === 'adSenseConfig') {
      return NextResponse.json({
        success: true,
        data: data.adSenseConfig || {}
      });
    }
    
    return NextResponse.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Error fetching advertisements:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch advertisements'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, ...data } = body;
    
    const advertisements = await readAdvertisements();
    
    if (type === 'bannerAd') {
      const newAd = {
        id: `a${Date.now()}`,
        ...data,
        clicks: 0,
        impressions: 0,
        ctr: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      advertisements.bannerAds = advertisements.bannerAds || [];
      advertisements.bannerAds.unshift(newAd);
      
      await writeAdvertisements(advertisements);
      
      return NextResponse.json({
        success: true,
        data: newAd,
        message: 'Banner ad created successfully'
      });
    } else if (type === 'adSenseConfig') {
      advertisements.adSenseConfig = {
        ...advertisements.adSenseConfig,
        ...data,
        lastUpdated: new Date().toISOString()
      };
      
      await writeAdvertisements(advertisements);
      
      return NextResponse.json({
        success: true,
        data: advertisements.adSenseConfig,
        message: 'AdSense configuration updated successfully'
      });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Invalid type'
    }, { status: 400 });
  } catch (error) {
    console.error('Error creating/updating advertisement:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create/update advertisement'
    }, { status: 500 });
  }
}
