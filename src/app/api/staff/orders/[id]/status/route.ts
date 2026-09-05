import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { updateOrderStatusSchema } from '@/lib/validation';
import { ORDER_STATUS_TRANSITIONS, type OrderStatus } from '@/lib/constants';
import { createAuditLog } from '@/lib/audit';
import { sseManager, SSE_CHANNELS, SSE_EVENTS } from '@/lib/sse';
import { auth } from '@/lib/auth';

// PATCH /api/staff/orders/[id]/status - Update order status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const session = await auth();
    const body = await request.json();
    const parsed = updateOrderStatusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Trạng thái không hợp lệ' }, { status: 400 });
    }

    const { status: newStatus } = parsed.data;

    // Get current order
    const order = await prisma.order.findUnique({
      where: { id },
      include: { table: true, items: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Đơn hàng không tồn tại' }, { status: 404 });
    }

    // Validate status transition
    const validTransitions = ORDER_STATUS_TRANSITIONS[order.status as OrderStatus] || [];
    if (!validTransitions.includes(newStatus as OrderStatus)) {
      return NextResponse.json(
        { error: `Không thể chuyển từ "${order.status}" sang "${newStatus}"` },
        { status: 400 }
      );
    }

    // Update status
    const updated = await prisma.order.update({
      where: { id },
      data: { status: newStatus },
      include: { table: true, items: true },
    });

    // Audit log
    await createAuditLog({
      userId: session?.user?.id,
      action: 'STATUS_CHANGE',
      entity: 'Order',
      entityId: id,
      details: { from: order.status, to: newStatus, orderNumber: order.orderNumber },
    });

    // Broadcast update via SSE
    sseManager.broadcast(SSE_CHANNELS.STAFF_ORDERS, SSE_EVENTS.ORDER_UPDATED, {
      id: updated.id,
      status: updated.status,
      orderNumber: updated.orderNumber,
    });

    // Also broadcast to customer channel
    sseManager.broadcast(SSE_CHANNELS.CUSTOMER_ORDERS, SSE_EVENTS.ORDER_STATUS_CHANGED, {
      id: updated.id,
      status: updated.status,
      orderNumber: updated.orderNumber,
      sessionId: updated.sessionId,
    });

    return NextResponse.json({ order: updated });
  } catch (error) {
    console.error('[API] Failed to update order status:', error);
    return NextResponse.json({ error: 'Không thể cập nhật trạng thái' }, { status: 500 });
  }
}
