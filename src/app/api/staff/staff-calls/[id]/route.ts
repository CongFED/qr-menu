import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { updateStaffCallSchema } from '@/lib/validation';
import { sseManager, SSE_CHANNELS, SSE_EVENTS } from '@/lib/sse';

// PATCH /api/staff/staff-calls/[id] - Update staff call status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = updateStaffCallSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Trạng thái không hợp lệ' }, { status: 400 });
    }

    const updated = await prisma.staffCall.update({
      where: { id },
      data: { status: parsed.data.status },
    });

    sseManager.broadcast(SSE_CHANNELS.STAFF_CALLS, SSE_EVENTS.STAFF_CALL_UPDATED, updated);

    return NextResponse.json({ call: updated });
  } catch (error) {
    console.error('[API] Failed to update staff call:', error);
    return NextResponse.json({ error: 'Không thể cập nhật' }, { status: 500 });
  }
}
