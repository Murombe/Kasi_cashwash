import { sql, relations } from 'drizzle-orm';
import {
  pgTable,
  varchar,
  text,
  integer,
  decimal,
  boolean,
  timestamp,
  jsonb,
  date,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  profileImageUrl: varchar("profile_image_url", { length: 500 }),
  role: varchar("role", { length: 20 }).default('user'),
  loyaltyPoints: integer("loyalty_points").default(0),
  totalVisits: integer("total_visits").default(0),
  loyaltyTier: varchar("loyalty_tier", { length: 20 }).default('bronze'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Services table
export const services = pgTable("services", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  duration: integer("duration").notNull(), // in minutes
  category: varchar("category", { length: 50 }).default('basic'),
  features: jsonb("features").default([]),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Slots table
export const slots = pgTable("slots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serviceId: varchar("service_id").notNull().references(() => services.id),
  date: varchar("date").notNull(),
  startTime: varchar("start_time").notNull(),
  endTime: varchar("end_time").notNull(),
  isBooked: boolean("is_booked").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Bookings table
export const bookings = pgTable("bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  serviceId: varchar("service_id").notNull().references(() => services.id),
  slotId: varchar("slot_id").notNull().references(() => slots.id),
  vehicleType: varchar("vehicle_type", { length: 50 }).notNull(),
  vehicleBrand: varchar("vehicle_brand", { length: 50 }).notNull(),
  vehicleModel: varchar("vehicle_model", { length: 50 }).notNull(),
  manufacturingYear: integer("manufacturing_year").notNull(),
  registrationPlate: varchar("registration_plate", { length: 20 }).notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: varchar("payment_method", { length: 10 }),
  status: varchar("status", { length: 20 }).default('pending'),
  paymentStatus: varchar("payment_status", { length: 20 }).default('pending'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Reviews table
export const reviews = pgTable("reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  serviceId: varchar("service_id").notNull().references(() => services.id),
  bookingId: varchar("booking_id").notNull().references(() => bookings.id),
  staffId: varchar("staff_id").references(() => staff.id), // Optional - staff member being rated
  rating: integer("rating").notNull(),
  comment: text("comment"),
  photos: jsonb("photos").default([]), // Array of photo URLs
  createdAt: timestamp("created_at").defaultNow(),
});

// Loyalty rewards table
export const loyaltyRewards = pgTable("loyalty_rewards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description").notNull(),
  pointsCost: integer("points_cost").notNull(),
  discountPercentage: integer("discount_percentage"),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }),
  tier: varchar("tier", { length: 20 }).default('bronze'), // bronze, silver, gold, platinum
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Loyalty transactions table
export const loyaltyTransactions = pgTable("loyalty_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  bookingId: varchar("booking_id").references(() => bookings.id),
  rewardId: varchar("reward_id").references(() => loyaltyRewards.id),
  type: varchar("type", { length: 20 }).notNull(), // earned, redeemed, bonus
  pointsChange: integer("points_change").notNull(), // positive for earning, negative for spending
  description: text("description").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Service tracking table for real-time updates
export const serviceTracking = pgTable("service_tracking", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: varchar("booking_id").notNull().references(() => bookings.id),
  status: varchar("status", { length: 30 }).notNull(), // checked_in, in_progress, quality_check, completed
  estimatedCompletionTime: timestamp("estimated_completion_time"),
  actualStartTime: timestamp("actual_start_time"),
  actualEndTime: timestamp("actual_end_time"),
  qrCode: varchar("qr_code", { length: 50 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Admin setup tracking table
export const adminSetup = pgTable("admin_setup", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  isInitialized: boolean("is_initialized").default(false),
  setupToken: varchar("setup_token", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  bookings: many(bookings),
  reviews: many(reviews),
  loyaltyTransactions: many(loyaltyTransactions),
}));

export const servicesRelations = relations(services, ({ many }) => ({
  slots: many(slots),
  bookings: many(bookings),
  reviews: many(reviews),
}));

export const slotsRelations = relations(slots, ({ one, many }) => ({
  service: one(services, {
    fields: [slots.serviceId],
    references: [services.id],
  }),
  bookings: many(bookings),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  user: one(users, {
    fields: [bookings.userId],
    references: [users.id],
  }),
  service: one(services, {
    fields: [bookings.serviceId],
    references: [services.id],
  }),
  slot: one(slots, {
    fields: [bookings.slotId],
    references: [slots.id],
  }),
  review: one(reviews, {
    fields: [bookings.id],
    references: [reviews.bookingId],
  }),
  serviceTracking: one(serviceTracking, {
    fields: [bookings.id],
    references: [serviceTracking.bookingId],
  }),
}));

export const loyaltyRewardsRelations = relations(loyaltyRewards, ({ many }) => ({
  transactions: many(loyaltyTransactions),
}));

export const loyaltyTransactionsRelations = relations(loyaltyTransactions, ({ one }) => ({
  user: one(users, {
    fields: [loyaltyTransactions.userId],
    references: [users.id],
  }),
  booking: one(bookings, {
    fields: [loyaltyTransactions.bookingId],
    references: [bookings.id],
  }),
  reward: one(loyaltyRewards, {
    fields: [loyaltyTransactions.rewardId],
    references: [loyaltyRewards.id],
  }),
}));

export const serviceTrackingRelations = relations(serviceTracking, ({ one }) => ({
  booking: one(bookings, {
    fields: [serviceTracking.bookingId],
    references: [bookings.id],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
  service: one(services, {
    fields: [reviews.serviceId],
    references: [services.id],
  }),
  booking: one(bookings, {
    fields: [reviews.bookingId],
    references: [bookings.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertServiceSchema = createInsertSchema(services).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSlotSchema = createInsertSchema(slots).omit({
  id: true,
  createdAt: true,
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
});

// Auth schemas
export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;
export type Service = typeof services.$inferSelect;
export type InsertSlot = z.infer<typeof insertSlotSchema>;
export type Slot = typeof slots.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookings.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;
export type InsertAdminSetup = typeof adminSetup.$inferInsert;
export type AdminSetup = typeof adminSetup.$inferSelect;
export type LoyaltyReward = typeof loyaltyRewards.$inferSelect;
export type InsertLoyaltyReward = typeof loyaltyRewards.$inferInsert;
export type LoyaltyTransaction = typeof loyaltyTransactions.$inferSelect;
export type InsertLoyaltyTransaction = typeof loyaltyTransactions.$inferInsert;
export type ServiceTracking = typeof serviceTracking.$inferSelect;
export type InsertServiceTracking = typeof serviceTracking.$inferInsert;
export type StaffLeave = typeof staffLeave.$inferSelect;
export type InsertStaffLeave = typeof staffLeave.$inferInsert;

// Password reset tokens table
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  token: varchar("token", { length: 255 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Staff management table
export const staff = pgTable("staff", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  employeeId: varchar("employee_id", { length: 50 }).notNull().unique(),
  position: varchar("position", { length: 100 }).notNull(),
  department: varchar("department", { length: 50 }).notNull(),
  salary: decimal("salary", { precision: 10, scale: 2 }),
  hireDate: date("hire_date").notNull(),
  isActive: boolean("is_active").default(true),
  performanceScore: decimal("performance_score", { precision: 3, scale: 2 }).default('0.00'),
  totalServicesCompleted: integer("total_services_completed").default(0),
  averageServiceTime: integer("average_service_time").default(0), // in minutes
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Staff schedules table
export const staffSchedules = pgTable("staff_schedules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  staffId: varchar("staff_id").notNull().references(() => staff.id),
  date: date("date").notNull(),
  startTime: varchar("start_time", { length: 10 }).notNull(),
  endTime: varchar("end_time", { length: 10 }).notNull(),
  status: varchar("status", { length: 20 }).default('scheduled'), // scheduled, completed, absent, late
  createdAt: timestamp("created_at").defaultNow(),
});

// Staff leave management table
export const staffLeave = pgTable("staff_leave", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  staffId: varchar("staff_id").notNull().references(() => staff.id),
  leaveType: varchar("leave_type", { length: 50 }).notNull(), // Annual Leave, Sick Leave, etc.
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  startTime: varchar("start_time", { length: 10 }), // Optional for partial day leave
  endTime: varchar("end_time", { length: 10 }), // Optional for partial day leave
  reason: text("reason"),
  status: varchar("status", { length: 20 }).default('pending'), // pending, approved, rejected, active, completed
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  isActive: boolean("is_active").default(true), // Currently on this leave
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Inventory categories table
export const inventoryCategories = pgTable("inventory_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Inventory items table
export const inventoryItems = pgTable("inventory_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  categoryId: varchar("category_id").notNull().references(() => inventoryCategories.id),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  sku: varchar("sku", { length: 50 }).notNull().unique(),
  currentStock: integer("current_stock").default(0),
  minimumStock: integer("minimum_stock").default(10),
  maximumStock: integer("maximum_stock").default(100),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  supplier: varchar("supplier", { length: 100 }),
  lastRestocked: timestamp("last_restocked"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Inventory transactions table
export const inventoryTransactions = pgTable("inventory_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  itemId: varchar("item_id").notNull().references(() => inventoryItems.id),
  type: varchar("type", { length: 20 }).notNull(), // in, out, adjustment
  quantity: integer("quantity").notNull(),
  reason: varchar("reason", { length: 100 }),
  staffId: varchar("staff_id").references(() => staff.id),
  relatedBookingId: varchar("related_booking_id").references(() => bookings.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Financial reports table
export const financialReports = pgTable("financial_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reportDate: date("report_date").notNull(),
  reportType: varchar("report_type", { length: 20 }).notNull(), // daily, weekly, monthly, yearly
  totalRevenue: decimal("total_revenue", { precision: 12, scale: 2 }).default('0.00'),
  totalBookings: integer("total_bookings").default(0),
  averageBookingValue: decimal("average_booking_value", { precision: 10, scale: 2 }).default('0.00'),
  taxAmount: decimal("tax_amount", { precision: 12, scale: 2 }).default('0.00'),
  netProfit: decimal("net_profit", { precision: 12, scale: 2 }).default('0.00'),
  topService: varchar("top_service", { length: 100 }),
  topServiceRevenue: decimal("top_service_revenue", { precision: 10, scale: 2 }).default('0.00'),
  createdAt: timestamp("created_at").defaultNow(),
});

// Customer analytics table
export const customerAnalytics = pgTable("customer_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  lifetimeValue: decimal("lifetime_value", { precision: 12, scale: 2 }).default('0.00'),
  averageBookingValue: decimal("average_booking_value", { precision: 10, scale: 2 }).default('0.00'),
  bookingFrequency: integer("booking_frequency").default(0), // days between bookings
  lastVisit: timestamp("last_visit"),
  preferredService: varchar("preferred_service", { length: 100 }),
  customerSegment: varchar("customer_segment", { length: 50 }).default('regular'), // new, regular, vip, premium
  acquisitionChannel: varchar("acquisition_channel", { length: 50 }),
  totalSpent: decimal("total_spent", { precision: 12, scale: 2 }).default('0.00'),
  isVip: boolean("is_vip").default(false),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Service analytics table
export const serviceAnalytics = pgTable("service_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serviceId: varchar("service_id").notNull().references(() => services.id),
  date: date("date").notNull(),
  bookingsCount: integer("bookings_count").default(0),
  revenue: decimal("revenue", { precision: 10, scale: 2 }).default('0.00'),
  averageRating: decimal("average_rating", { precision: 3, scale: 2 }).default('0.00'),
  completionRate: decimal("completion_rate", { precision: 5, scale: 2 }).default('100.00'),
  createdAt: timestamp("created_at").defaultNow(),
});

// Additional type exports for new tables
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = typeof passwordResetTokens.$inferInsert;
export type Staff = typeof staff.$inferSelect;
export type InsertStaff = typeof staff.$inferInsert;
export type StaffSchedule = typeof staffSchedules.$inferSelect;
export type InsertStaffSchedule = typeof staffSchedules.$inferInsert;
export type InventoryCategory = typeof inventoryCategories.$inferSelect;
export type InsertInventoryCategory = typeof inventoryCategories.$inferInsert;
export type InventoryItem = typeof inventoryItems.$inferSelect;
export type InsertInventoryItem = typeof inventoryItems.$inferInsert;
export type InventoryTransaction = typeof inventoryTransactions.$inferSelect;
export type InsertInventoryTransaction = typeof inventoryTransactions.$inferInsert;
export type FinancialReport = typeof financialReports.$inferSelect;
export type InsertFinancialReport = typeof financialReports.$inferInsert;
export type CustomerAnalytics = typeof customerAnalytics.$inferSelect;
export type InsertCustomerAnalytics = typeof customerAnalytics.$inferInsert;
export type ServiceAnalytics = typeof serviceAnalytics.$inferSelect;
export type InsertServiceAnalytics = typeof serviceAnalytics.$inferInsert;