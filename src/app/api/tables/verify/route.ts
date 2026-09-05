import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/tables/verify?number=12
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const number = parseInt(searchParams.get('number') || '');

  if (!number || number <= 0) {
    return NextResponse.json({ error: 'Số bàn không hợp lệ' }, { status: 400 });
  }

  const table = await prisma.restaurantTable.findUnique({
    where: { number },
    select: { id: true, number: true, name: true, isActive: true },
  });

  if (!table || !table.isActive) {
    return NextResponse.json({ error: 'Bàn không tồn tại' }, { status: 404 });
  }

  return NextResponse.json({ table });
}
