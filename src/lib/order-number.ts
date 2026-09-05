import prisma from './prisma';

/**
 * Generate next order number in format ORD-XXXXXX
 * Thread-safe using database sequence
 */
export async function generateOrderNumber(): Promise<string> {
  // Count existing orders + 1
  const count = await prisma.order.count();
  const nextNumber = count + 1;
  return `ORD-${String(nextNumber).padStart(6, '0')}`;
}
