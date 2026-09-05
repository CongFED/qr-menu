import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { sseManager, SSE_CHANNELS, SSE_EVENTS } from '@/lib/sse';
import { createAuditLog } from '@/lib/audit';

// POST /api/staff/tables/[number]/checkout
// Completes and settles all active orders for a table (Closing the dining session)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ number: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { number } = await params;
    const tableNumber = parseInt(number);

    if (isNaN(tableNumber)) {
      return NextResponse.json({ error: 'Số bàn không hợp lệ' }, { status: 400 });
    }

    // Find table
    const table = await prisma.restaurantTable.findUnique({
      where: { number: tableNumber },
    });

    if (!table) {
      return NextResponse.json({ error: 'Không tìm thấy bàn' }, { status: 404 });
    }

    // Find all active orders for this table (not COMPLETED and not CANCELLED)
    const activeOrders = await prisma.order.findMany({
      where: {
        tableId: table.id,
        status: {
          notIn: ['COMPLETED', 'CANCELLED'],
        },
      },
      include: {
        items: true,
      },
    });

    const totalAmount = activeOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const orderIds = activeOrders.map((o) => o.id);
    const sessionIds = Array.from(new Set(activeOrders.map((o) => o.sessionId)));

    // Mark all active orders as COMPLETED in a transaction
    await prisma.$transaction([
      ...(orderIds.length > 0
        ? [
            prisma.order.updateMany({
              where: {
                id: { in: orderIds },
              },
              data: {
                status: 'COMPLETED',
              },
            }),
          ]
        : []),
      // Resolve any pending staff calls for this table
      prisma.staffCall.updateMany({
        where: {
          tableId: table.id,
          status: { in: ['PENDING', 'ACKNOWLEDGED'] },
        },
        data: {
          status: 'RESOLVED',
        },
      }),
    ]);

    // Audit log
    await createAuditLog({
      action: 'STATUS_CHANGE',
      entity: 'TableCheckout',
      entityId: table.id,
      userId: (session.user as { id?: string }).id,
      details: {
        tableName: table.name,
        tableNumber,
        settledOrderCount: activeOrders.length,
        totalAmount,
        orderNumbers: activeOrders.map((o) => o.orderNumber),
      },
    });

    // Broadcast SSE update to staff and customers
    sseManager.broadcast(SSE_CHANNELS.STAFF_ORDERS, SSE_EVENTS.ORDER_UPDATED, {
      type: 'TABLE_CHECKOUT',
      tableNumber,
      orderIds,
      status: 'COMPLETED',
      totalAmount,
    });

    // Notify customer session
    sessionIds.forEach((sId) => {
      sseManager.broadcast(`session-${sId}`, 'session_completed', {
        tableNumber,
        totalAmount,
        message: 'Bàn đã thanh toán hoàn tất. Cảm ơn quý khách!',
      });
    });

    return NextResponse.json({
      success: true,
      tableNumber,
      tableName: table.name,
      settledOrders: activeOrders.length,
      totalAmount,
    });
  } catch (error) {
    console.error('[API] Table checkout failed:', error);
    return NextResponse.json(
      { error: 'Không thể thanh toán bàn. Vui lòng thử lại.' },
      { status: 500 }
    );
  }
}
