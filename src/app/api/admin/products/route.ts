import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createProductSchema } from '@/lib/validation';
import { createAuditLog } from '@/lib/audit';
import { auth } from '@/lib/auth';

// GET /api/admin/products - List all products
export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: [{ category: { sortOrder: 'asc' } }, { sortOrder: 'asc' }],
      include: { category: { select: { id: true, name: true } } },
    });
    return NextResponse.json({ products });
  } catch (error) {
    console.error('[API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

// POST /api/admin/products - Create product
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const body = await request.json();
    const parsed = createProductSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Dữ liệu không hợp lệ', details: parsed.error.flatten() }, { status: 400 });
    }

    const product = await prisma.product.create({ data: parsed.data });

    await createAuditLog({
      userId: session?.user?.id,
      action: 'CREATE',
      entity: 'Product',
      entityId: product.id,
      details: { name: product.name, price: product.price },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error('[API] Error:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
