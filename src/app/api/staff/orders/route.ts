import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/staff/orders - Get all orders for staff
export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        items: true,
        table: { select: { number: true, name: true } },
      },
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('[API] Failed to fetch staff orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}
