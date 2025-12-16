import { z } from "zod";

export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  role: z.enum(["ADMIN", "USER"] as const),
  isActive: z.boolean(),
  // Optional IBAN field (may be null or absent for older users)
  iban: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const categorySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  isActive: z.boolean(),
  type: z.enum(['CAFE', 'RESTAURANT']).optional(),
  // optional discount percent introduced to support category-level discounts
  discountPercent: z.number().optional(),
  iconId: z.string().nullable().optional(),
  iconPath: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const productImageSchema = z.object({
  url: z.string(),
  publicId: z.string().optional(),
});

export const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  // Keep originalPrice and discountPercent so client can render discounts
  originalPrice: z.number().optional(),
  discountPercent: z.number().optional(),
  price: z.number(),
  categoryId: z.string(),
  category: categorySchema.optional(),
  images: z.array(productImageSchema),
  options: z
    .array(
      z.object({
        id: z.number(),
        name: z.string(),
        additionalPrice: z.number(),
        isAvailable: z.boolean(),
      }),
    )
    .optional(),
  isAvailable: z.boolean(),
  soldCount: z.number().optional(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const inventorySchema = z.object({
  id: z.string(),
  productId: z.string(),
  quantity: z.number(),
  minThreshold: z.number(),
  lastUpdated: z.string(),
});

export const orderItemSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  productId: z.string(),
  quantity: z.number(),
  unitPrice: z.number(),
  totalPrice: z.number().optional(),
  product: productSchema.optional(),
  // Keep server-provided snapshot fields (name and images) so UI can render them
  productName: z.string().optional(),
  productImages: z.array(productImageSchema).optional(),
});

export const orderSchema = z.object({
  id: z.string(),
  tableNumber: z.string(),
  status: z.enum([
    "PENDING",
    "CONFIRMED",
    "DELIVERED",
    "PAID",
    "CANCELLED",
  ] as const),
  // Payment method may be absent for legacy orders; keep optional
  paymentMethod: z.enum(["ONLINE", "COD"] as const).optional(),
  // Tracking code is optional and may be null
  trackingCode: z.string().nullable().optional(),
  totalAmount: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
  items: z.array(orderItemSchema).optional(),
  notes: z.string().nullable().optional(),
});

export const returnSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  userId: z.string(),
  reason: z.string(),
  status: z.enum(["REQUESTED", "APPROVED", "REJECTED", "COMPLETED"] as const),
  refundAmount: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
  order: orderSchema.optional(),
});

export const authTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});

export const paginatedResponseSchema = <T>(itemSchema: z.ZodSchema<T>) =>
  z.object({
    data: z.array(itemSchema),
    total: z.number(),
    skip: z.number(),
    take: z.number(),
  });

export const bannerSchema = z.object({
  id: z.string(),
  title: z.string().optional().nullable(),
  caption: z.string().nullable().optional(),
  imageUrl: z.string(),
  order: z.number(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Form validation schemas
export const loginSchema = z.object({
  email: z.string().email("ایمیل معتبر وارد کنید"),
  password: z.string().min(6, "رمز عبور باید حداقل ۶ کاراکتر باشد"),
});

export const registerSchema = z.object({
  email: z.string().email("ایمیل معتبر وارد کنید"),
  password: z.string().min(6, "رمز عبور باید حداقل ۶ کاراکتر باشد"),
  firstName: z.string().min(1, "نام الزامی است"),
  lastName: z.string().min(1, "نام خانوادگی الزامی است"),
  role: z.enum(["ADMIN", "USER"] as const).default("USER"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "رمز عبور فعلی الزامی است"),
  newPassword: z.string().min(6, "رمز عبور جدید باید حداقل ۶ کاراکتر باشد"),
});

export const addressSchema = z.object({
  province: z.string().min(1, "استان الزامی است"),
  city: z.string().min(1, "شهر الزامی است"),
  street: z.string().min(1, "آدرس الزامی است"),
  postalCode: z.string().min(1, "کدپستی الزامی است"),
  phone: z.string().min(1, "تلفن الزامی است"),
});
