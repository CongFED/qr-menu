import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createTableSchema } from '@/lib/validation';
import { createAuditLog } from '@/lib/audit';
import { auth } from '@/lib/auth';

// GET /api/admin/tables
// Returns all tables with real-time occupancy status (Occupied vs Available)
export async function GET() {
  try {
    const [rawTables, pendingCalls] = await Promise.all([
      prisma.restaurantTable.findMany({
        orderBy: { number: 'asc' },
        include: {
          tableSessions: {
            where: { status: 'ACTIVE' },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          orders: {
            where: {
              status: { notIn: ['COMPLETED', 'CANCELLED'] },
            },
            include: {
              items: {
                include: {
                  product: {
                    select: {
                      image: true,
                    },
                  },
                },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
      }),
      prisma.staffCall.findMany({
        where: {
          status: { in: ['PENDING', 'ACKNOWLEDGED'] },
        },
      }),
    ]);

    const pendingCallsMap = new Map(pendingCalls.map((c) => [c.tableId, c]));

    const tables = rawTables.map((t) => {
      const activeOrders = t.orders;
      const activeSession = t.tableSessions?.[0] || null;
      const isOccupied = activeOrders.length > 0 || activeSession !== null;
      const totalActiveAmount = activeOrders.reduce((sum, o) => sum + o.totalAmount, 0);
      const totalItemCount = activeOrders.reduce(
        (sum, o) => sum + o.items.reduce((iSum, item) => iSum + item.quantity, 0),
        0
      );
      const pendingCall = pendingCallsMap.get(t.id);

      return {
        id: t.id,
        number: t.number,
        name: t.name,
        isActive: t.isActive,
        qrCode: t.qrCode,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
        // Computed table occupancy
        occupancyStatus: !t.isActive
          ? 'INACTIVE'
          : isOccupied
          ? 'OCCUPIED'
          : 'AVAILABLE',
        customerName: activeSession?.customerName || (activeOrders.length > 0 ? activeOrders[0].customerName : null),
        activeSession: activeSession
          ? {
              id: activeSession.id,
              customerName: activeSession.customerName,
              createdAt: activeSession.createdAt,
            }
          : null,
        activeOrderCount: activeOrders.length,
        itemCount: totalItemCount,
        currentBillAmount: totalActiveAmount,
        firstOrderTime: activeOrders.length > 0 ? activeOrders[0].createdAt : activeSession?.createdAt || null,
        activeOrders: activeOrders.map((o) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          customerName: o.customerName,
          status: o.status,
          totalAmount: o.totalAmount,
          createdAt: o.createdAt,
          note: o.note,
          itemCount: o.items.reduce((s, i) => s + i.quantity, 0),
          items: o.items.map((item) => ({
            id: item.id,
            productId: item.productId,
            productName: item.productName,
            productPrice: item.productPrice,
            quantity: item.quantity,
            note: item.note,
            image: item.product?.image || null,
          })),
        })),
        hasPendingCall: Boolean(pendingCall),
        pendingCallTime: pendingCall ? pendingCall.createdAt : null,
      };
    });

    // Overview counts for manager
    const summary = {
      total: tables.length,
      occupied: tables.filter((t) => t.occupancyStatus === 'OCCUPIED').length,
      available: tables.filter((t) => t.occupancyStatus === 'AVAILABLE').length,
      inactive: tables.filter((t) => t.occupancyStatus === 'INACTIVE').length,
      callingStaff: tables.filter((t) => t.hasPendingCall).length,
      inProgressRevenue: tables.reduce((sum, t) => sum + t.currentBillAmount, 0),
    };

    return NextResponse.json({ tables, summary });
  } catch (error) {
    console.error('[API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch tables' }, { status: 500 });
  }
}

// POST /api/admin/tables
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const body = await request.json();
    const parsed = createTableSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const existing = await prisma.restaurantTable.findUnique({
      where: { number: parsed.data.number },
    });
    if (existing) {
      return NextResponse.json({ error: 'Số bàn đã tồn tại' }, { status: 400 });
    }

    const table = await prisma.restaurantTable.create({ data: parsed.data });
    await createAuditLog({
      userId: session?.user?.id,
      action: 'CREATE',
      entity: 'Table',
      entityId: table.id,
      details: { name: table.name, number: table.number },
    });

    return NextResponse.json({ table }, { status: 201 });
  } catch (error) {
    console.error('[API] Error:', error);
    return NextResponse.json({ error: 'Failed to create table' }, { status: 500 });
  }
}
