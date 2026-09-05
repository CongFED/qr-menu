import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/admin/dashboard - Dashboard stats & Live Table Status
export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalOrders,
      newOrders,
      processingOrders,
      completedOrders,
      todayRevenue,
      topProducts,
      rawTables,
      pendingCalls,
    ] = await Promise.all([
      prisma.order.count({ where: { createdAt: { gte: today } } }),
      prisma.order.count({ where: { status: 'NEW', createdAt: { gte: today } } }),
      prisma.order.count({
        where: {
          status: { in: ['CONFIRMED', 'PREPARING', 'READY'] },
          createdAt: { gte: today },
        },
      }),
      prisma.order.count({ where: { status: 'COMPLETED', createdAt: { gte: today } } }),
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { createdAt: { gte: today }, status: { not: 'CANCELLED' } },
      }),
      prisma.orderItem.groupBy({
        by: ['productName'],
        _sum: { quantity: true },
        where: { order: { createdAt: { gte: today }, status: { not: 'CANCELLED' } } },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),
      prisma.restaurantTable.findMany({
        orderBy: { number: 'asc' },
        include: {
          orders: {
            where: {
              status: { notIn: ['COMPLETED', 'CANCELLED'] },
            },
            include: {
              items: true,
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

    const tableStatuses = rawTables.map((t) => {
      const activeOrders = t.orders;
      const isOccupied = activeOrders.length > 0;
      const totalActiveAmount = activeOrders.reduce((sum, o) => sum + o.totalAmount, 0);
      const totalItems = activeOrders.reduce(
        (sum, o) => sum + o.items.reduce((iSum, i) => iSum + i.quantity, 0),
        0
      );
      const pendingCall = pendingCallsMap.get(t.id);

      return {
        id: t.id,
        number: t.number,
        name: t.name,
        isActive: t.isActive,
        occupancyStatus: !t.isActive
          ? 'INACTIVE'
          : isOccupied
          ? 'OCCUPIED'
          : 'AVAILABLE',
        customerName: isOccupied ? activeOrders[0].customerName : null,
        activeOrderCount: activeOrders.length,
        itemCount: totalItems,
        currentBillAmount: totalActiveAmount,
        firstOrderTime: isOccupied ? activeOrders[0].createdAt : null,
        hasPendingCall: Boolean(pendingCall),
      };
    });

    const tableSummary = {
      total: tableStatuses.length,
      occupied: tableStatuses.filter((t) => t.occupancyStatus === 'OCCUPIED').length,
      available: tableStatuses.filter((t) => t.occupancyStatus === 'AVAILABLE').length,
      inactive: tableStatuses.filter((t) => t.occupancyStatus === 'INACTIVE').length,
      callingStaff: tableStatuses.filter((t) => t.hasPendingCall).length,
      inProgressRevenue: tableStatuses.reduce((sum, t) => sum + t.currentBillAmount, 0),
    };

    return NextResponse.json({
      stats: {
        totalOrders,
        newOrders,
        processingOrders,
        completedOrders,
        todayRevenue: todayRevenue._sum.totalAmount || 0,
        topProducts: topProducts.map((p) => ({
          name: p.productName,
          quantity: p._sum.quantity || 0,
        })),
        tableSummary,
        tables: tableStatuses,
      },
    });
  } catch (error) {
    console.error('[API] Dashboard error:', error);
    return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 });
  }
}
