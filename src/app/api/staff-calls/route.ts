import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createStaffCallSchema } from '@/lib/validation';
import { sseManager, SSE_CHANNELS, SSE_EVENTS } from '@/lib/sse';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';

// POST /api/staff-calls - Customer calls staff
export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const { success } = rateLimit(`staff-call:${ip}`, 3, 120000); // 3 calls per 2 minutes
  if (!success) return rateLimitResponse();

  try {
    const body = await request.json();
    const parsed = createStaffCallSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ' },
        { status: 400 }
      );
    }

    const { tableNumber, customerName, sessionId } = parsed.data;

    // Verify table
    const table = await prisma.restaurantTable.findUnique({
      where: { number: tableNumber },
    });

    if (!table || !table.isActive) {
      return NextResponse.json({ error: 'Bàn không tồn tại' }, { status: 400 });
    }

    // Check for existing pending call from same session
    const existingCall = await prisma.staffCall.findFirst({
      where: {
        sessionId,
        status: 'PENDING',
      },
    });

    if (existingCall) {
      return NextResponse.json(
        { error: 'Bạn đã gọi nhân viên. Vui lòng chờ.' },
        { status: 409 }
      );
    }

    const staffCall = await prisma.staffCall.create({
      data: {
        tableId: table.id,
        tableName: table.name,
        tableNumber: table.number,
        customerName,
        sessionId,
        status: 'PENDING',
      },
    });

    // Broadcast to staff
    sseManager.broadcast(SSE_CHANNELS.STAFF_CALLS, SSE_EVENTS.NEW_STAFF_CALL, {
      id: staffCall.id,
      tableName: staffCall.tableName,
      tableNumber: staffCall.tableNumber,
      customerName: staffCall.customerName,
      status: staffCall.status,
      createdAt: staffCall.createdAt,
    });

    return NextResponse.json({ staffCall }, { status: 201 });
  } catch (error) {
    console.error('[API] Failed to create staff call:', error);
    return NextResponse.json({ error: 'Không thể gọi nhân viên. Vui lòng thử lại.' }, { status: 500 });
  }
}
