import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createOrderSchema } from '@/lib/validation';
import { generateOrderNumber } from '@/lib/order-number';
import { createAuditLog } from '@/lib/audit';
import { sseManager, SSE_CHANNELS, SSE_EVENTS } from '@/lib/sse';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';

// POST /api/orders - Create a new order
export async function POST(request: NextRequest) {
  // Rate limit by IP
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const { success } = rateLimit(`order:${ip}`, 5, 60000); // 5 orders per minute
  if (!success) return rateLimitResponse();

  try {
    const body = await request.json();
    const parsed = createOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { customerName, tableNumber, sessionId, note, items } = parsed.data;

    // Verify table exists
    const table = await prisma.restaurantTable.findUnique({
      where: { number: tableNumber },
    });

    if (!table || !table.isActive) {
      return NextResponse.json({ error: 'Bàn không tồn tại' }, { status: 400 });
    }

    // Verify all products exist and are available, get current prices
    const productIds = items.map((item) => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    // Validate each item
    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        return NextResponse.json(
          { error: `Món "${item.productName}" không tồn tại` },
          { status: 400 }
        );
      }
      if (!product.isAvailable) {
        return NextResponse.json(
          { error: `Món "${product.name}" đã hết hàng` },
          { status: 400 }
        );
      }
    }

    // Generate order number
    const orderNumber = await generateOrderNumber();

    // Calculate total from server-side prices (don't trust client prices)
    const orderItems = items.map((item) => {
      const product = productMap.get(item.productId)!;
      return {
        productId: item.productId,
        productName: product.name, // Snapshot from DB
        productPrice: product.price, // Snapshot from DB
        quantity: item.quantity,
        note: item.note || null,
      };
    });

    const totalAmount = orderItems.reduce(
      (sum, item) => sum + item.productPrice * item.quantity,
      0
    );

    // Create order with items in a transaction
    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerName,
        tableId: table.id,
        sessionId,
        status: 'NEW',
        totalAmount,
        note: note || null,
        items: {
          create: orderItems,
        },
      },
      include: {
        items: true,
        table: true,
      },
    });

    // Audit log
    await createAuditLog({
      action: 'CREATE',
      entity: 'Order',
      entityId: order.id,
      details: { orderNumber, customerName, tableNumber, totalAmount, itemCount: items.length },
    });

    // Broadcast to staff via SSE
    sseManager.broadcast(SSE_CHANNELS.STAFF_ORDERS, SSE_EVENTS.NEW_ORDER, {
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      table: { number: table.number, name: table.name },
      status: order.status,
      totalAmount: order.totalAmount,
      items: order.items,
      createdAt: order.createdAt,
    });

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    console.error('[API] Failed to create order:', error);
    return NextResponse.json({ error: 'Không thể tạo đơn hàng. Vui lòng thử lại.' }, { status: 500 });
  }
}
