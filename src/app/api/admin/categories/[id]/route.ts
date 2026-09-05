import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { updateCategorySchema } from '@/lib/validation';
import { createAuditLog } from '@/lib/audit';
import { auth } from '@/lib/auth';

// PATCH /api/admin/categories/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await auth();
    const body = await request.json();
    const parsed = updateCategorySchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Dữ liệu không hợp lệ' }, { status: 400 });

    const category = await prisma.category.update({ where: { id }, data: parsed.data });

    await createAuditLog({ userId: session?.user?.id, action: 'UPDATE', entity: 'Category', entityId: id, details: { name: category.name } });

    return NextResponse.json({ category });
  } catch (error) {
    console.error('[API] Error:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

// DELETE /api/admin/categories/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await auth();

    // Check if category has products
    const productCount = await prisma.product.count({ where: { categoryId: id } });
    if (productCount > 0) {
      return NextResponse.json(
        { error: `Không thể xóa danh mục vì còn ${productCount} sản phẩm thuộc danh mục này` },
        { status: 400 }
      );
    }

    await prisma.category.delete({ where: { id } });
    await createAuditLog({ userId: session?.user?.id, action: 'DELETE', entity: 'Category', entityId: id });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Error:', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
