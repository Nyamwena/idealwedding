import { NextRequest, NextResponse } from 'next/server';
import { readDataFile, writeDataFile } from '@/lib/dataFileStore';

function readReports() {
  return readDataFile<any>('advanced-reports.json', {
    vendorPerformance: [],
    creditConsumption: [],
    topCategories: [],
    customQueries: []
  });
}

export async function GET(request: NextRequest) {
  try {
    const data = await readReports();
    
    return NextResponse.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error reading advanced reports:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to read advanced reports data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, query } = body;
    const data = await readReports();
    
    if (action === 'addCustomQuery') {
      const newQuery = {
        id: Date.now().toString(),
        name: query.name,
        description: query.description,
        category: query.category,
        parameters: query.parameters,
        results: [],
        createdAt: new Date().toISOString(),
        lastRun: new Date().toISOString()
      };
      
      data.customQueries.push(newQuery);
      
      await writeDataFile('advanced-reports.json', data);
      
      return NextResponse.json({
        success: true,
        data: newQuery
      });
    }
    
    if (action === 'generateReport') {
      // Simulate report generation based on query parameters
      const reportData = generateReportData(query);
      
      // Update the query's results and lastRun
      const queryIndex = data.customQueries.findIndex((q: any) => q.id === query.id);
      if (queryIndex !== -1) {
        data.customQueries[queryIndex].results = reportData;
        data.customQueries[queryIndex].lastRun = new Date().toISOString();
      }
      
      await writeDataFile('advanced-reports.json', data);
      
      return NextResponse.json({
        success: true,
        data: reportData
      });
    }
    
    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error processing advanced reports request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

function generateReportData(query: any) {
  // Simulate generating report data based on query parameters
  const mockData = [];
  const categories = ['Catering', 'Photography', 'Florist', 'Venue', 'Entertainment'];
  const statuses = ['active', 'pending', 'completed'];
  
  for (let i = 0; i < 10; i++) {
    mockData.push({
      id: i + 1,
      name: `Sample ${query.category} Item ${i + 1}`,
      category: categories[i % categories.length],
      status: statuses[i % statuses.length],
      value: Math.floor(Math.random() * 10000) + 1000,
      date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      rating: Math.floor(Math.random() * 5) + 1
    });
  }
  
  return mockData;
}
