import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createCategorySchema } from '@/lib/validation';
import { createAuditLog } from '@/lib/audit';
import { auth } from '@/lib/auth';

// GET /api/admin/categories
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { products: true } } },
    });
    return NextResponse.json({ categories });
  } catch (error) {
    console.error('[API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

// POST /api/admin/categories
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const body = await request.json();
    const parsed = createCategorySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Dữ liệu không hợp lệ', details: parsed.error.flatten() }, { status: 400 });
    }

    // Auto-generate slug if not provided
    const slug = parsed.data.slug || parsed.data.name
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd').replace(/Đ/g, 'D')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const category = await prisma.category.create({
      data: { ...parsed.data, slug },
    });

    await createAuditLog({
      userId: session?.user?.id,
      action: 'CREATE',
      entity: 'Category',
      entityId: category.id,
      details: { name: category.name },
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error('[API] Error:', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
