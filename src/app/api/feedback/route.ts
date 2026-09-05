import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createFeedbackSchema } from '@/lib/validation';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';

// POST /api/feedback - Customer sends feedback
export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const { success } = rateLimit(`feedback:${ip}`, 5, 60000);
  if (!success) return rateLimitResponse();

  try {
    const body = await request.json();
    const parsed = createFeedbackSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Dữ liệu không hợp lệ', details: parsed.error.flatten() }, { status: 400 });
    }

    const feedback = await prisma.feedback.create({
      data: parsed.data,
    });

    return NextResponse.json({ feedback, success: true }, { status: 201 });
  } catch (error) {
    console.error('[API] Failed to submit feedback:', error);
    return NextResponse.json({ error: 'Không thể gửi đánh giá' }, { status: 500 });
  }
}
