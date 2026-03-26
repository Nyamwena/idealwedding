import { NextRequest, NextResponse } from 'next/server';
import { readDataFile, writeDataFile } from '@/lib/dataFileStore';

// Helper function to read settings
function readSettings() {
  return readDataFile<any>('settings.json', {
    platformName: 'Ideal Weddings',
    platformEmail: 'admin@idealweddings.com',
    maxFileSize: '10',
    allowRegistration: true,
    requireEmailVerification: true,
    maintenanceMode: false,
    analyticsEnabled: true,
    notificationsEnabled: true,
    commissionRate: 10,
    currency: 'USD',
    timezone: 'UTC',
    maxUsers: 1000,
    maxVendors: 500,
    emailSmtpHost: '',
    emailSmtpPort: 587,
    emailSmtpUser: '',
    emailSmtpPassword: '',
    lastUpdated: new Date().toISOString(),
    updatedBy: 'admin@idealweddings.com'
  });
}

// Helper function to write settings
function writeSettings(settings: any) {
  settings.lastUpdated = new Date().toISOString();
  settings.updatedBy = 'admin@idealweddings.com';
  return writeDataFile('settings.json', settings);
}

export async function GET() {
  try {
    const settings = await readSettings();
    
    if (!settings) {
      return NextResponse.json({
        success: false,
        error: 'Failed to read settings'
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch settings'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const currentSettings = await readSettings();
    
    if (!currentSettings) {
      return NextResponse.json({
        success: false,
        error: 'Failed to read current settings'
      }, { status: 500 });
    }
    
    // Merge new settings with current settings
    const updatedSettings = {
      ...currentSettings,
      ...body,
      lastUpdated: new Date().toISOString(),
      updatedBy: 'admin@idealweddings.com'
    };
    
    await writeSettings(updatedSettings);
    
    return NextResponse.json({
      success: true,
      data: updatedSettings,
      message: 'Settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update settings'
    }, { status: 500 });
  }
}
