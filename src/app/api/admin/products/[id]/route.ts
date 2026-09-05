import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { updateProductSchema } from '@/lib/validation';
import { createAuditLog } from '@/lib/audit';
import { auth } from '@/lib/auth';

// PATCH /api/admin/products/[id] - Update product
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const session = await auth();
    const body = await request.json();
    const parsed = updateProductSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Dữ liệu không hợp lệ' }, { status: 400 });
    }

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Món không tồn tại' }, { status: 404 });
    }

    const product = await prisma.product.update({
      where: { id },
      data: parsed.data,
    });

    // Audit log with old/new values for price changes
    const details: Record<string, unknown> = { name: product.name };
    if (parsed.data.price !== undefined && parsed.data.price !== existing.price) {
      details.priceChange = { from: existing.price, to: parsed.data.price };
    }

    await createAuditLog({
      userId: session?.user?.id,
      action: 'UPDATE',
      entity: 'Product',
      entityId: id,
      details,
    });

    return NextResponse.json({ product });
  } catch (error) {
    console.error('[API] Error:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

// DELETE /api/admin/products/[id] - Delete product (soft: set isAvailable=false)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const session = await auth();

    // Check if product has order items
    const orderItemCount = await prisma.orderItem.count({ where: { productId: id } });

    if (orderItemCount > 0) {
      // Soft delete - just hide it
      await prisma.product.update({ where: { id }, data: { isAvailable: false } });
    } else {
      await prisma.product.delete({ where: { id } });
    }

    await createAuditLog({
      userId: session?.user?.id,
      action: 'DELETE',
      entity: 'Product',
      entityId: id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Error:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
