import { NextRequest, NextResponse } from 'next/server';
import { readDataFile, writeDataFile } from '@/lib/dataFileStore';

// Helper function to read audit logs
function readAuditLogs() {
  return readDataFile<any[]>('audit-logs.json', [
    {
      id: 'a1',
      user: 'admin@idealweddings.com',
      action: 'LOGIN',
      resource: 'Authentication',
      details: 'Successful admin login',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      timestamp: new Date().toISOString(),
      status: 'success'
    }
  ]);
}

// Helper function to write audit logs
function writeAuditLogs(logs: any[]) {
  return writeDataFile('audit-logs.json', logs);
}

// Helper function to create audit log entry
async function createAuditLog(action: string, resource: string, details: string, user: string = 'admin@idealweddings.com') {
  const log = {
    id: `a${Date.now()}`,
    user,
    action,
    resource,
    details,
    ipAddress: '192.168.1.100', // In production, get from request
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', // In production, get from request
    timestamp: new Date().toISOString(),
    status: 'success'
  };
  
  const logs = await readAuditLogs();
  logs.unshift(log);
  await writeAuditLogs(logs);
  return log;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const status = searchParams.get('status');
    const user = searchParams.get('user');
    const limit = parseInt(searchParams.get('limit') || '100');
    
    let logs = await readAuditLogs();
    
    // Apply filters
    if (action && action !== 'all') {
      logs = logs.filter(log => log.action === action);
    }
    
    if (status && status !== 'all') {
      logs = logs.filter(log => log.status === status);
    }
    
    if (user && user !== 'all') {
      logs = logs.filter(log => log.user.toLowerCase().includes(user.toLowerCase()));
    }
    
    // Apply limit
    logs = logs.slice(0, limit);
    
    return NextResponse.json({
      success: true,
      data: logs,
      total: logs.length
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch audit logs'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, resource, details, user } = body;
    
    if (!action || !resource || !details) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: action, resource, details'
      }, { status: 400 });
    }
    
    const log = await createAuditLog(action, resource, details, user);
    
    return NextResponse.json({
      success: true,
      data: log,
      message: 'Audit log created successfully'
    });
  } catch (error) {
    console.error('Error creating audit log:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create audit log'
    }, { status: 500 });
  }
}
