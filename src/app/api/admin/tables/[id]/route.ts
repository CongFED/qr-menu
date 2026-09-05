import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { updateTableSchema } from '@/lib/validation';
import { createAuditLog } from '@/lib/audit';
import { auth } from '@/lib/auth';

// PATCH /api/admin/tables/[id]
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const session = await auth();
    const body = await request.json();
    const parsed = updateTableSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Dữ liệu không hợp lệ' }, { status: 400 });

    const table = await prisma.restaurantTable.update({ where: { id }, data: parsed.data });
    await createAuditLog({ userId: session?.user?.id, action: 'UPDATE', entity: 'Table', entityId: id });

    return NextResponse.json({ table });
  } catch (error) {
    console.error('[API] Error:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

// DELETE /api/admin/tables/[id]
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const session = await auth();
    // Soft delete
    await prisma.restaurantTable.update({ where: { id }, data: { isActive: false } });
    await createAuditLog({ userId: session?.user?.id, action: 'DELETE', entity: 'Table', entityId: id });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Error:', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
