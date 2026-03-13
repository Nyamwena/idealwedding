import { NextRequest, NextResponse } from 'next/server';
import { readDataFile, writeDataFile } from '@/lib/dataFileStore';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    const content = await readDataFile<any[]>('content.json', []);
    
    // Find specific content item
    const contentItem = content.find((item: any) => item.id === id);
    
    if (!contentItem) {
      return NextResponse.json(
        { success: false, error: 'Content not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: contentItem,
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

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const updates = await request.json();
    
    const content = await readDataFile<any[]>('content.json', []);
    
    // Find content item index
    const contentIndex = content.findIndex((item: any) => item.id === id);
    
    if (contentIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Content not found' },
        { status: 404 }
      );
    }
    
    // Update content item
    content[contentIndex] = {
      ...content[contentIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
      publishDate: updates.status === 'published' && !content[contentIndex].publishDate 
        ? new Date().toISOString().split('T')[0] 
        : content[contentIndex].publishDate
    };
    
    await writeDataFile('content.json', content);
    
    return NextResponse.json({
      success: true,
      data: content[contentIndex],
      message: 'Content updated successfully'
    });
  } catch (error) {
    console.error('Error updating content:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update content' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    const content = await readDataFile<any[]>('content.json', []);
    
    // Find content item index
    const contentIndex = content.findIndex((item: any) => item.id === id);
    
    if (contentIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Content not found' },
        { status: 404 }
      );
    }
    
    // Remove content item
    const deletedContent = content.splice(contentIndex, 1)[0];
    
    await writeDataFile('content.json', content);
    
    return NextResponse.json({
      success: true,
      data: deletedContent,
      message: 'Content deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting content:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete content' },
      { status: 500 }
    );
  }
}
