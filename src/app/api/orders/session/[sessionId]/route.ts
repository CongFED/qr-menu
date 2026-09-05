import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/orders/session/[sessionId] - Get orders by session
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;

  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
  }

  try {
    const orders = await prisma.order.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: true,
        table: {
          select: { number: true, name: true },
        },
      },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('[API] Failed to fetch session orders:', error);
    return NextResponse.json({ error: 'Không thể tải đơn hàng' }, { status: 500 });
  }
}
