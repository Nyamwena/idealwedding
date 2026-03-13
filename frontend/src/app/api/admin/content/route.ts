import { NextRequest, NextResponse } from 'next/server';
import { readDataFile, writeDataFile } from '@/lib/dataFileStore';

export async function GET() {
  try {
    const content = await readDataFile<any[]>('content.json', []);
    
    return NextResponse.json({
      success: true,
      data: content,
      message: 'Content retrieved successfully'
    });
  } catch (error) {
    console.error('Error reading content:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve content' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const newContent = await request.json();
    
    const content = await readDataFile<any[]>('content.json', []);
    
    // Generate new ID
    const newId = `c${Date.now()}`;
    
    // Create new content item
    const contentItem = {
      id: newId,
      ...newContent,
      views: 0,
      publishDate: newContent.status === 'published' ? new Date().toISOString().split('T')[0] : '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      slug: newContent.slug || newContent.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      tags: newContent.tags || [],
      metaDescription: newContent.metaDescription || newContent.content?.substring(0, 160) || ''
    };
    
    // Add to content array
    content.push(contentItem);
    
    await writeDataFile('content.json', content);
    
    return NextResponse.json({
      success: true,
      data: contentItem,
      message: 'Content created successfully'
    });
  } catch (error) {
    console.error('Error creating content:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create content' },
      { status: 500 }
    );
  }
}
