import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createUserSchema } from '@/lib/validation';
import bcrypt from 'bcryptjs';
import { createAuditLog } from '@/lib/audit';
import { auth } from '@/lib/auth';

// GET /api/admin/users
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json({ users });
  } catch (error) {
    console.error('[API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// POST /api/admin/users
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const body = await request.json();
    const parsed = createUserSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Dữ liệu không hợp lệ', details: parsed.error.flatten() }, { status: 400 });

    const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (existing) return NextResponse.json({ error: 'Email đã tồn tại' }, { status: 400 });

    const hashedPassword = await bcrypt.hash(parsed.data.password, 12);
    const user = await prisma.user.create({
      data: { ...parsed.data, password: hashedPassword },
      select: { id: true, email: true, name: true, role: true, isActive: true },
    });

    await createAuditLog({ userId: session?.user?.id, action: 'CREATE', entity: 'User', entityId: user.id, details: { email: user.email, role: user.role } });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error('[API] Error:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
