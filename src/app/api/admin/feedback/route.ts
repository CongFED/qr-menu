import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET /api/admin/feedback - Admin gets all feedback
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || (session.user as { role: string }).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const feedbacks = await prisma.feedback.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ feedbacks });
  } catch (error) {
    console.error('[API] Failed to fetch feedback:', error);
    return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 });
  }
}
