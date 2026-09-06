import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { sseManager, SSE_CHANNELS, SSE_EVENTS } from '@/lib/sse';
import { createAuditLog } from '@/lib/audit';

// POST /api/admin/tables/[id]/checkout
// Settle all active orders for this table and release the table (available)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = (session.user as { role?: string }).role;
    if (role !== 'ADMIN' && role !== 'STAFF') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    // Support finding table by ID or by number
    const table = await prisma.restaurantTable.findFirst({
      where: {
        OR: [
          { id },
          { number: isNaN(parseInt(id)) ? -1 : parseInt(id) },
        ],
      },
    });

    if (!table) {
      return NextResponse.json({ error: 'Không tìm thấy thông tin bàn' }, { status: 404 });
    }

    // Find all active orders for this table
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
    const activeSessions = await prisma.tableSession.findMany({
      where: {
        tableId: table.id,
        status: 'ACTIVE',
      },
    });

    const sessionIds = Array.from(new Set(activeOrders.map((o) => o.sessionId)));
    const allSessionIds = Array.from(
      new Set([...sessionIds, ...activeSessions.map((s) => s.id)])
    );

    // Perform checkout updates in transaction
    await prisma.$transaction([
      ...(orderIds.length > 0
        ? [
            prisma.order.updateMany({
              where: { id: { in: orderIds } },
              data: { status: 'COMPLETED' },
            }),
          ]
        : []),
      // Complete all active table sessions for this table
      prisma.tableSession.updateMany({
        where: {
          tableId: table.id,
          status: 'ACTIVE',
        },
        data: {
          status: 'COMPLETED',
          endedAt: new Date(),
        },
      }),
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
        tableNumber: table.number,
        settledOrderCount: activeOrders.length,
        totalAmount,
        orderNumbers: activeOrders.map((o) => o.orderNumber),
      },
    });

    // Broadcast SSE update to staff and customers
    sseManager.broadcast(SSE_CHANNELS.STAFF_ORDERS, SSE_EVENTS.ORDER_UPDATED, {
      type: 'TABLE_CHECKOUT',
      tableNumber: table.number,
      tableId: table.id,
      orderIds,
      status: 'COMPLETED',
      totalAmount,
    });

    // Broadcast on session channels & table channel so customer phones clear session
    allSessionIds.forEach((sId) => {
      sseManager.broadcast(`session-${sId}`, 'session_completed', {
        tableNumber: table.number,
        totalAmount,
        message: 'Bàn đã thanh toán hoàn tất. Cảm ơn quý khách!',
      });
    });

    sseManager.broadcast(`table-${table.number}`, 'session_completed', {
      tableNumber: table.number,
      totalAmount,
      message: 'Bàn đã thanh toán hoàn tất. Cảm ơn quý khách!',
    });

    return NextResponse.json({
      success: true,
      tableNumber: table.number,
      tableName: table.name,
      settledOrders: activeOrders.length,
      totalAmount,
    });
  } catch (error) {
    console.error('[API] Admin table checkout error:', error);
    return NextResponse.json(
      { error: 'Không thể xử lý thanh toán bàn. Vui lòng thử lại.' },
      { status: 500 }
    );
  }
}
