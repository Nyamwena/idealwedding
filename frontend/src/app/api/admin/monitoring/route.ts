import { NextRequest, NextResponse } from 'next/server';
import { readDataFile, writeDataFile } from '@/lib/dataFileStore';

// Helper function to read system monitoring data
function readMonitoringData() {
  return readDataFile<any>('system-monitoring.json', {
    lastUpdated: new Date().toISOString(),
    systemHealth: {
      apiGateway: { status: 'healthy', uptime: 99.9 },
      database: { status: 'healthy', uptime: 99.8 },
      paymentService: { status: 'warning', uptime: 98.5 },
      emailService: { status: 'healthy', uptime: 99.7 }
    },
    metrics: {
      activeVendors: 0,
      activeUsers: 0,
      creditsUsedToday: 0,
      leadsGenerated: 0,
      systemUptime: 99.8,
      responseTime: 245
    },
    vendorActivities: [],
    creditUsage: [],
    leadGeneration: []
  });
}

// Helper function to update monitoring data
async function updateMonitoringData() {
  try {
    const currentData = await readMonitoringData();
    if (!currentData) return null;
    
    // Simulate real-time updates
    const updatedData = {
      ...currentData,
      lastUpdated: new Date().toISOString(),
      metrics: {
        ...currentData.metrics,
        // Simulate some variation in metrics
        creditsUsedToday: Math.floor(Math.random() * 200) + 100,
        leadsGenerated: Math.floor(Math.random() * 50) + 20,
        responseTime: Math.floor(Math.random() * 100) + 200
      },
      systemHealth: {
        ...currentData.systemHealth,
        // Simulate system health changes
        apiGateway: { 
          status: Math.random() > 0.1 ? 'healthy' : 'warning', 
          uptime: 99.9 - Math.random() * 0.5 
        },
        database: { 
          status: Math.random() > 0.05 ? 'healthy' : 'warning', 
          uptime: 99.8 - Math.random() * 0.3 
        },
        paymentService: { 
          status: Math.random() > 0.2 ? 'healthy' : 'warning', 
          uptime: 98.5 + Math.random() * 1.0 
        },
        emailService: { 
          status: Math.random() > 0.08 ? 'healthy' : 'warning', 
          uptime: 99.7 - Math.random() * 0.2 
        }
      }
    };
    
    await writeDataFile('system-monitoring.json', updatedData);
    return updatedData;
  } catch (error) {
    console.error('Error updating monitoring data:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const refresh = searchParams.get('refresh') === 'true';
    
    let data = await readMonitoringData();
    
    if (refresh || !data) {
      data = await updateMonitoringData();
    }
    
    if (!data) {
      return NextResponse.json({
        success: false,
        error: 'Failed to load monitoring data'
      }, { status: 500 });
    }
    
    if (type === 'metrics') {
      return NextResponse.json({
        success: true,
        data: data.metrics
      });
    } else if (type === 'systemHealth') {
      return NextResponse.json({
        success: true,
        data: data.systemHealth
      });
    } else if (type === 'vendorActivities') {
      return NextResponse.json({
        success: true,
        data: data.vendorActivities
      });
    } else if (type === 'creditUsage') {
      return NextResponse.json({
        success: true,
        data: data.creditUsage
      });
    } else if (type === 'leadGeneration') {
      return NextResponse.json({
        success: true,
        data: data.leadGeneration
      });
    }
    
    return NextResponse.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Error fetching monitoring data:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch monitoring data'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;
    
    if (action === 'refresh') {
      const updatedData = await updateMonitoringData();
      
      if (!updatedData) {
        return NextResponse.json({
          success: false,
          error: 'Failed to refresh monitoring data'
        }, { status: 500 });
      }
      
      return NextResponse.json({
        success: true,
        data: updatedData,
        message: 'Monitoring data refreshed successfully'
      });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Invalid action'
    }, { status: 400 });
  } catch (error) {
    console.error('Error updating monitoring data:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update monitoring data'
    }, { status: 500 });
  }
}
