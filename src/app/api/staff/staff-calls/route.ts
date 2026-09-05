import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/staff/staff-calls - Get staff calls
export async function GET() {
  try {
    const calls = await prisma.staffCall.findMany({
      orderBy: { createdAt: 'desc' },
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });

    return NextResponse.json({ calls });
  } catch (error) {
    console.error('[API] Failed to fetch staff calls:', error);
    return NextResponse.json({ error: 'Failed to fetch calls' }, { status: 500 });
  }
}
