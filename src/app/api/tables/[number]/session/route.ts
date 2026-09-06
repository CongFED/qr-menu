import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sseManager, SSE_CHANNELS, SSE_EVENTS } from '@/lib/sse';
import { auth } from '@/lib/auth';

// GET /api/tables/[number]/session
// Check if table currently has an active dining session
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ number: string }> }
) {
  try {
    const { number } = await params;
    const tableNumber = parseInt(number);

    if (isNaN(tableNumber) || tableNumber <= 0) {
      return NextResponse.json({ error: 'Số bàn không hợp lệ' }, { status: 400 });
    }

    const table = await prisma.restaurantTable.findUnique({
      where: { number: tableNumber },
    });

    if (!table) {
      return NextResponse.json({ error: 'Bàn không tồn tại' }, { status: 404 });
    }

    if (!table.isActive) {
      return NextResponse.json({ error: 'Bàn đang tạm ngưng phục vụ' }, { status: 400 });
    }

    // Check for an active table session
    const activeSession = await prisma.tableSession.findFirst({
      where: {
        tableNumber,
        status: 'ACTIVE',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (activeSession) {
      return NextResponse.json({
        hasActiveSession: true,
        session: {
          sessionId: activeSession.id,
          customerName: activeSession.customerName,
          tableNumber: table.number,
          tableId: table.id,
          tableName: table.name,
          createdAt: activeSession.createdAt,
        },
        table: {
          id: table.id,
          number: table.number,
          name: table.name,
          isActive: table.isActive,
        },
      });
    }

    // Check if table has active orders from prior sessions without TableSession
    const activeOrder = await prisma.order.findFirst({
      where: {
        tableId: table.id,
        status: { notIn: ['COMPLETED', 'CANCELLED'] },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (activeOrder) {
      const recoveredSession = await prisma.tableSession.create({
        data: {
          id: activeOrder.sessionId,
          tableId: table.id,
          tableNumber: table.number,
          customerName: activeOrder.customerName,
          status: 'ACTIVE',
        },
      });

      return NextResponse.json({
        hasActiveSession: true,
        session: {
          sessionId: recoveredSession.id,
          customerName: recoveredSession.customerName,
          tableNumber: table.number,
          tableId: table.id,
          tableName: table.name,
          createdAt: recoveredSession.createdAt,
        },
        table: {
          id: table.id,
          number: table.number,
          name: table.name,
          isActive: table.isActive,
        },
      });
    }

    return NextResponse.json({
      hasActiveSession: false,
      table: {
        id: table.id,
        number: table.number,
        name: table.name,
        isActive: table.isActive,
      },
    });
  } catch (error) {
    console.error('[API] Failed to get table session:', error);
    return NextResponse.json({ error: 'Lỗi kiểm tra phiên bàn' }, { status: 500 });
  }
}

// POST /api/tables/[number]/session
// Create or join an active session for a table
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ number: string }> }
) {
  try {
    const { number } = await params;
    const tableNumber = parseInt(number);

    if (isNaN(tableNumber) || tableNumber <= 0) {
      return NextResponse.json({ error: 'Số bàn không hợp lệ' }, { status: 400 });
    }

    const body = await request.json();
    const customerName = typeof body.customerName === 'string' ? body.customerName.trim() : '';

    if (!customerName) {
      return NextResponse.json({ error: 'Vui lòng nhập tên của bạn' }, { status: 400 });
    }

    const table = await prisma.restaurantTable.findUnique({
      where: { number: tableNumber },
    });

    if (!table || !table.isActive) {
      return NextResponse.json({ error: 'Bàn không khả dụng' }, { status: 400 });
    }

    // Check if session already exists (e.g. created concurrently by someone at the same table)
    const existingActive = await prisma.tableSession.findFirst({
      where: {
        tableNumber,
        status: 'ACTIVE',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existingActive) {
      return NextResponse.json({
        success: true,
        isJoined: true,
        session: {
          sessionId: existingActive.id,
          customerName: existingActive.customerName,
          tableNumber: table.number,
          tableId: table.id,
          tableName: table.name,
          createdAt: existingActive.createdAt,
        },
      });
    }

    // Create a new active session
    const newSession = await prisma.tableSession.create({
      data: {
        tableId: table.id,
        tableNumber: table.number,
        customerName,
        status: 'ACTIVE',
      },
    });

    // Notify staff/admin dashboard via SSE that a table has been opened
    sseManager.broadcast(SSE_CHANNELS.STAFF_ORDERS, SSE_EVENTS.ORDER_UPDATED, {
      type: 'TABLE_OPENED',
      tableNumber: table.number,
      tableName: table.name,
      customerName,
      sessionId: newSession.id,
    });

    return NextResponse.json(
      {
        success: true,
        isJoined: false,
        session: {
          sessionId: newSession.id,
          customerName: newSession.customerName,
          tableNumber: table.number,
          tableId: table.id,
          tableName: table.name,
          createdAt: newSession.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[API] Failed to create table session:', error);
    return NextResponse.json({ error: 'Không thể tạo phiên bàn' }, { status: 500 });
  }
}

// DELETE /api/tables/[number]/session
// Manually close/clear table session (Staff/Admin)
export async function DELETE(
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

    const table = await prisma.restaurantTable.findUnique({
      where: { number: tableNumber },
    });

    if (!table) {
      return NextResponse.json({ error: 'Bàn không tồn tại' }, { status: 404 });
    }

    const activeSessions = await prisma.tableSession.findMany({
      where: {
        tableNumber,
        status: 'ACTIVE',
      },
    });

    if (activeSessions.length > 0) {
      await prisma.tableSession.updateMany({
        where: {
          tableNumber,
          status: 'ACTIVE',
        },
        data: {
          status: 'COMPLETED',
          endedAt: new Date(),
        },
      });

      // Broadcast to customers that session has been ended
      activeSessions.forEach((s) => {
        sseManager.broadcast(`session-${s.id}`, 'session_completed', {
          tableNumber,
          message: 'Bàn đã được hoàn tất / trả bàn.',
        });
      });
    }

    // Broadcast table update to staff
    sseManager.broadcast(SSE_CHANNELS.STAFF_ORDERS, SSE_EVENTS.ORDER_UPDATED, {
      type: 'TABLE_RELEASED',
      tableNumber,
    });

    return NextResponse.json({
      success: true,
      message: `Đã đóng phiên của bàn ${tableNumber}`,
    });
  } catch (error) {
    console.error('[API] Failed to close table session:', error);
    return NextResponse.json({ error: 'Không thể đóng phiên bàn' }, { status: 500 });
  }
}
