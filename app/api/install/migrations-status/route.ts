import { NextRequest, NextResponse } from 'next/server';
import { getMigrationStatus } from '@/lib/migration-verify';

export async function GET(request: NextRequest) {
  try {
    const status = getMigrationStatus();
    
    return NextResponse.json({
      allComplete: status.allComplete,
      completedTables: status.completedTables,
      missingTables: status.missingTables,
      completedCount: status.completedTables.length,
      missingCount: status.missingTables.length,
      totalTables: status.completedTables.length + status.missingTables.length,
    });
  } catch (error) {
    console.error('[v0] Migration status error:', error);
    return NextResponse.json(
      { error: 'Failed to get migration status', details: String(error) },
      { status: 500 }
    );
  }
}
