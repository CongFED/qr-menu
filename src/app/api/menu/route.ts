import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/menu - Public endpoint for customer menu
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        products: {
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            name: true,
            price: true,
            image: true,
            description: true,
            isAvailable: true,
            sortOrder: true,
            categoryId: true,
          },
        },
      },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('[API] Failed to fetch menu:', error);
    return NextResponse.json({ error: 'Không thể tải menu' }, { status: 500 });
  }
}
