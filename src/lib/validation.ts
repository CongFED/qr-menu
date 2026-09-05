import { z } from 'zod';

// ============================================
// Customer Session
// ============================================

export const customerSessionSchema = z.object({
  customerName: z
    .string()
    .min(1, 'Vui lòng nhập tên')
    .max(100, 'Tên quá dài')
    .trim(),
  tableNumber: z
    .number({ message: 'Vui lòng nhập số bàn' })
    .int('Số bàn phải là số nguyên')
    .positive('Số bàn không hợp lệ'),
});

// ============================================
// Order
// ============================================

export const orderItemSchema = z.object({
  productId: z.string().min(1),
  productName: z.string().min(1),
  productPrice: z.number().int().nonnegative(),
  quantity: z.number().int().positive('Số lượng phải lớn hơn 0'),
  note: z.string().max(500).optional().nullable(),
});

export const createOrderSchema = z.object({
  customerName: z.string().min(1, 'Tên khách không được để trống').max(100).trim(),
  tableNumber: z.number().int().positive(),
  sessionId: z.string().min(1),
  note: z.string().max(1000).optional().nullable(),
  items: z.array(orderItemSchema).min(1, 'Đơn hàng phải có ít nhất 1 món'),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['NEW', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED', 'COMPLETED', 'CANCELLED']),
});

// ============================================
// Staff Call
// ============================================

export const createStaffCallSchema = z.object({
  tableNumber: z.number().int().positive(),
  customerName: z.string().min(1).max(100).trim(),
  sessionId: z.string().min(1),
});

export const updateStaffCallSchema = z.object({
  status: z.enum(['ACKNOWLEDGED', 'RESOLVED']),
});

// ============================================
// Product (Admin)
// ============================================

export const createProductSchema = z.object({
  name: z.string().min(1, 'Tên món không được để trống').max(200).trim(),
  price: z.number().int().nonnegative('Giá không được âm'),
  description: z.string().max(1000).optional().nullable(),
  categoryId: z.string().min(1, 'Danh mục không được để trống'),
  isAvailable: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
  image: z.string().optional().nullable(),
});

export const updateProductSchema = createProductSchema.partial();

// ============================================
// Category (Admin)
// ============================================

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Tên danh mục không được để trống').max(100).trim(),
  slug: z.string().min(1).max(100).trim().optional(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const updateCategorySchema = createCategorySchema.partial();

// ============================================
// Table (Admin)
// ============================================

export const createTableSchema = z.object({
  number: z.number().int().positive('Số bàn phải lớn hơn 0'),
  name: z.string().min(1, 'Tên bàn không được để trống').max(100).trim(),
  isActive: z.boolean().default(true),
});

export const updateTableSchema = createTableSchema.partial();

// ============================================
// User (Admin)
// ============================================

export const createUserSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  name: z.string().min(1, 'Tên không được để trống').max(100).trim(),
  password: z.string().min(6, 'Mật khẩu ít nhất 6 ký tự'),
  role: z.enum(['ADMIN', 'STAFF']),
});

// ============================================
// Feedback
// ============================================

export const createFeedbackSchema = z.object({
  orderId: z.string().min(1),
  customerName: z.string().min(1).max(100),
  tableNumber: z.number().int().positive(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional().nullable(),
});

// ============================================
// Auth
// ============================================

export const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(1, 'Mật khẩu không được để trống'),
});

// ============================================
// Types derived from schemas
// ============================================

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type OrderItemInput = z.infer<typeof orderItemSchema>;
export type CreateStaffCallInput = z.infer<typeof createStaffCallSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CreateTableInput = z.infer<typeof createTableSchema>;
export type UpdateTableInput = z.infer<typeof updateTableSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type CreateFeedbackInput = z.infer<typeof createFeedbackSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
