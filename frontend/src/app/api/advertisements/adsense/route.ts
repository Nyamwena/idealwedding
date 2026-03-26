import { NextResponse } from 'next/server';
import { readDataFile } from '@/lib/dataFileStore';

export async function GET() {
  try {
    const data = await readDataFile<any>('advertisements.json', {
      adSenseConfig: {
        enabled: false,
        clientId: '',
        publisherId: '',
        testMode: true,
        adSlots: { header: '', sidebar: '', footer: '', content: '' },
        adsTxtSnippet: '',
        scriptTag: '',
      },
    });

    return NextResponse.json({
      success: true,
      data: data.adSenseConfig || {
        enabled: false,
        clientId: '',
        publisherId: '',
        testMode: true,
        adSlots: { header: '', sidebar: '', footer: '', content: '' },
        adsTxtSnippet: '',
        scriptTag: '',
      },
    });
  } catch (error) {
    console.error('Error in GET /api/advertisements/adsense:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load AdSense settings' },
      { status: 500 },
    );
  }
}
