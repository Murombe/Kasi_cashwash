import {
  users,
  services,
  slots,
  bookings,
  reviews,
  adminSetup,
  loyaltyRewards,
  loyaltyTransactions,
  serviceTracking,
  passwordResetTokens,
  staff,
  staffSchedules,
  staffLeave,
  inventoryCategories,
  inventoryItems,
  inventoryTransactions,
  financialReports,
  customerAnalytics,
  serviceAnalytics,
  type User,
  type UpsertUser,
  type Service,
  type InsertService,
  type Slot,
  type InsertSlot,
  type Booking,
  type InsertBooking,
  type Review,
  type InsertReview,
  type AdminSetup,
  type InsertAdminSetup,
  type LoyaltyReward,
  type InsertLoyaltyReward,
  type LoyaltyTransaction,
  type InsertLoyaltyTransaction,
  type ServiceTracking,
  type InsertServiceTracking,
  type PasswordResetToken,
  type InsertPasswordResetToken,
  type Staff,
  type InsertStaff,
  type StaffSchedule,
  type InsertStaffSchedule,
  type StaffLeave,
  type InsertStaffLeave,
  type InventoryCategory,
  type InsertInventoryCategory,
  type InventoryItem,
  type InsertInventoryItem,
  type InventoryTransaction,
  type InsertInventoryTransaction,
  type FinancialReport,
  type InsertFinancialReport,
  type CustomerAnalytics,
  type InsertCustomerAnalytics,
  type ServiceAnalytics,
  type InsertServiceAnalytics,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: Omit<UpsertUser, 'id'>): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Service operations
  getAllServices(): Promise<Service[]>;
  getService(id: string): Promise<Service | undefined>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: string, updates: Partial<InsertService>): Promise<Service>;
  deleteService(id: string): Promise<void>;

  // Slot operations
  getSlot(id: string): Promise<Slot | undefined>;
  getSlotsByService(serviceId: string, date?: string): Promise<Slot[]>;
  getAvailableSlots(serviceId?: string, date?: string): Promise<Slot[]>;
  createSlot(slot: InsertSlot): Promise<Slot>;
  updateSlotBookingStatus(slotId: string, isBooked: boolean): Promise<Slot>;
  getAllSlots(): Promise<Slot[]>;
  deleteSlot(id: string): Promise<void>;

  // Booking operations
  getAllBookings(): Promise<Booking[]>;
  getUserBookings(userId: string): Promise<Booking[]>;
  getBooking(id: string): Promise<Booking | undefined>;
  createBooking(booking: InsertBooking & { userId: string }): Promise<Booking>;
  updateBookingStatus(id: string, status: string): Promise<Booking>;
  updateBookingPaymentStatus(id: string, status: string): Promise<Booking>;
  updateBookingPaymentMethod(id: string, method: string): Promise<Booking>;

  // Review operations
  getServiceReviews(serviceId: string): Promise<Review[]>;
  getAllReviews(): Promise<Review[]>;
  getReviewsByStaffId(staffId: string): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;

  // Admin operations
  getAllUsers(): Promise<User[]>;
  updateUserRole(id: string, role: string): Promise<User>;
  deleteUser(id: string): Promise<void>;
  getAnalytics(): Promise<any>;
  getSalesData(startDate?: string, endDate?: string): Promise<any>;

  // Admin setup operations
  getAdminSetup(): Promise<AdminSetup | undefined>;
  initializeAdmin(setupData: InsertAdminSetup): Promise<AdminSetup>;
  checkAdminInitialized(): Promise<boolean>;

  // Loyalty operations
  getLoyaltyRewards(): Promise<LoyaltyReward[]>;
  getUserLoyaltyTransactions(userId: string): Promise<LoyaltyTransaction[]>;
  redeemLoyaltyReward(userId: string, rewardId: string): Promise<any>;
  awardLoyaltyPoints(userId: string, points: number, description: string, bookingId?: string): Promise<void>;
  updateUserLoyaltyTier(userId: string): Promise<void>;
  getUserById(userId: string): Promise<User | undefined>;

  // Service tracking operations
  getServiceTracking(bookingId: string): Promise<ServiceTracking | undefined>;
  createServiceTracking(tracking: InsertServiceTracking): Promise<ServiceTracking>;
  updateServiceTracking(id: string, updates: Partial<InsertServiceTracking>): Promise<ServiceTracking>;

  // Password reset operations
  createPasswordResetToken(userId: string, token: string): Promise<PasswordResetToken>;
  getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  markTokenAsUsed(tokenId: string): Promise<void>;
  updateUserPassword(userId: string, hashedPassword: string): Promise<User>;

  // Staff management operations
  getAllStaff(): Promise<Staff[]>;
  getStaff(id: string): Promise<Staff | undefined>;
  getStaffByEmployeeId(employeeId: string): Promise<Staff | undefined>;
  createStaff(staff: InsertStaff): Promise<Staff>;
  updateStaff(id: string, updates: Partial<InsertStaff>): Promise<Staff>;
  deleteStaff(id: string): Promise<void>;

  // Staff schedule operations
  getStaffSchedules(staffId?: string, date?: string): Promise<StaffSchedule[]>;
  createStaffSchedule(schedule: InsertStaffSchedule): Promise<StaffSchedule>;
  updateStaffSchedule(id: string, updates: Partial<InsertStaffSchedule>): Promise<StaffSchedule>;
  deleteStaffSchedule(id: string): Promise<void>;

  // Staff leave operations
  createStaffLeave(leave: InsertStaffLeave): Promise<StaffLeave>;
  getActiveStaffLeave(staffId: string): Promise<StaffLeave | undefined>;
  updateStaffLeave(id: string, updates: Partial<InsertStaffLeave>): Promise<StaffLeave>;
  getStaffLeaveHistory(staffId: string): Promise<StaffLeave[]>;

  // Inventory operations
  getAllInventoryCategories(): Promise<InventoryCategory[]>;
  createInventoryCategory(category: InsertInventoryCategory): Promise<InventoryCategory>;
  getAllInventoryItems(): Promise<InventoryItem[]>;
  getInventoryItem(id: string): Promise<InventoryItem | undefined>;
  createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem>;
  updateInventoryItem(id: string, updates: Partial<InsertInventoryItem>): Promise<InventoryItem>;
  getLowStockItems(): Promise<InventoryItem[]>;
  createInventoryTransaction(transaction: InsertInventoryTransaction): Promise<InventoryTransaction>;
  getInventoryTransactions(itemId?: string): Promise<InventoryTransaction[]>;

  // Financial reporting operations
  getFinancialReports(reportType?: string, startDate?: string, endDate?: string): Promise<FinancialReport[]>;
  createFinancialReport(report: InsertFinancialReport): Promise<FinancialReport>;
  generateDailyReport(date: string): Promise<FinancialReport>;

  // Customer analytics operations
  getCustomerAnalytics(userId?: string): Promise<CustomerAnalytics[]>;
  updateCustomerAnalytics(userId: string, analytics: Partial<InsertCustomerAnalytics>): Promise<CustomerAnalytics>;
  getVipCustomers(): Promise<CustomerAnalytics[]>;
  getCustomerSegmentation(): Promise<{ segment: string; count: number; totalValue: string }[]>;

  // Service analytics operations
  getServiceAnalytics(serviceId?: string, startDate?: string, endDate?: string): Promise<ServiceAnalytics[]>;
  updateServiceAnalytics(serviceId: string, date: string, data: Partial<InsertServiceAnalytics>): Promise<ServiceAnalytics>;
  getServicePopularityTrends(): Promise<{ serviceName: string; bookingsCount: number; revenue: string }[]>;

  // Auto reward allocation
  processServiceCompletion(bookingId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: Omit<UpsertUser, 'id'>): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Service operations
  async getAllServices(): Promise<Service[]> {
    return await db.select().from(services).orderBy(asc(services.price));
  }

  async getService(id: string): Promise<Service | undefined> {
    const [service] = await db.select().from(services).where(eq(services.id, id));
    return service;
  }

  async createService(serviceData: InsertService): Promise<Service> {
    const [service] = await db
      .insert(services)
      .values(serviceData)
      .returning();
    return service;
  }

  async updateService(id: string, updates: Partial<InsertService>): Promise<Service> {
    const [service] = await db
      .update(services)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(services.id, id))
      .returning();
    return service;
  }

  async deleteService(id: string): Promise<void> {
    await db.delete(services).where(eq(services.id, id));
  }

  // Slot operations
  async getSlot(id: string): Promise<Slot | undefined> {
    const [slot] = await db.select().from(slots).where(eq(slots.id, id));
    return slot;
  }

  async getSlotsByService(serviceId: string, date?: string): Promise<Slot[]> {
    if (date) {
      return await db.select().from(slots).where(and(
        eq(slots.serviceId, serviceId),
        eq(slots.date, date)
      )).orderBy(asc(slots.date), asc(slots.startTime));
    }

    return await db.select().from(slots)
      .where(eq(slots.serviceId, serviceId))
      .orderBy(asc(slots.date), asc(slots.startTime));
  }

  async getAvailableSlots(serviceId?: string, date?: string): Promise<Slot[]> {
    const conditions = [eq(slots.isBooked, false)];

    if (serviceId) {
      conditions.push(eq(slots.serviceId, serviceId));
    }

    if (date) {
      conditions.push(eq(slots.date, date));
    }

    return await db.select().from(slots)
      .where(and(...conditions))
      .orderBy(asc(slots.date), asc(slots.startTime));
  }

  async createSlot(slotData: InsertSlot): Promise<Slot> {
    const [slot] = await db
      .insert(slots)
      .values(slotData)
      .returning();
    return slot;
  }

  async updateSlotBookingStatus(slotId: string, isBooked: boolean): Promise<Slot> {
    const [slot] = await db
      .update(slots)
      .set({ isBooked })
      .where(eq(slots.id, slotId))
      .returning();
    return slot;
  }

  async getAllSlots(): Promise<Slot[]> {
    return await db.select().from(slots).orderBy(asc(slots.date), asc(slots.startTime));
  }

  async deleteSlot(id: string): Promise<void> {
    await db.delete(slots).where(eq(slots.id, id));
  }

  // Booking operations
  async getAllBookings(): Promise<Booking[]> {
    const result = await db
      .select({
        id: bookings.id,
        userId: bookings.userId,
        serviceId: bookings.serviceId,
        slotId: bookings.slotId,
        vehicleType: bookings.vehicleType,
        vehicleBrand: bookings.vehicleBrand,
        vehicleModel: bookings.vehicleModel,
        manufacturingYear: bookings.manufacturingYear,
        registrationPlate: bookings.registrationPlate,
        status: bookings.status,
        totalAmount: bookings.totalAmount,
        paymentMethod: sql<string>`bookings.payment_method`,
        paymentStatus: sql<string>`bookings.payment_status`,
        createdAt: bookings.createdAt,
        updatedAt: bookings.updatedAt,
        service: {
          name: services.name,
          price: services.price,
          duration: services.duration,
        },
        slot: {
          date: slots.date,
          startTime: slots.startTime,
          endTime: slots.endTime,
        },
        user: {
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        },
      })
      .from(bookings)
      .leftJoin(services, eq(bookings.serviceId, services.id))
      .leftJoin(slots, eq(bookings.slotId, slots.id))
      .leftJoin(users, eq(bookings.userId, users.id))
      .orderBy(desc(bookings.createdAt));

    return result;
  }

  async getUserBookings(userId: string): Promise<Booking[]> {
    return await db
      .select({
        id: bookings.id,
        userId: bookings.userId,
        serviceId: bookings.serviceId,
        slotId: bookings.slotId,
        vehicleType: bookings.vehicleType,
        vehicleBrand: bookings.vehicleBrand,
        vehicleModel: bookings.vehicleModel,
        manufacturingYear: bookings.manufacturingYear,
        registrationPlate: bookings.registrationPlate,
        status: bookings.status,
        totalAmount: bookings.totalAmount,
        paymentMethod: sql<string>`bookings.payment_method`,
        paymentStatus: sql<string>`bookings.payment_status`,
        createdAt: bookings.createdAt,
        updatedAt: bookings.updatedAt,
        service: {
          name: services.name,
          price: services.price,
          duration: services.duration,
        },
        slot: {
          date: slots.date,
          startTime: slots.startTime,
          endTime: slots.endTime,
        },
        user: {
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        },
      })
      .from(bookings)
      .leftJoin(services, eq(bookings.serviceId, services.id))
      .leftJoin(slots, eq(bookings.slotId, slots.id))
      .leftJoin(users, eq(bookings.userId, users.id))
      .where(eq(bookings.userId, userId))
      .orderBy(desc(bookings.createdAt));
  }

  async getBooking(id: string): Promise<Booking | undefined> {
    const [booking] = await db
      .select({
        id: bookings.id,
        userId: bookings.userId,
        serviceId: bookings.serviceId,
        slotId: bookings.slotId,
        vehicleType: bookings.vehicleType,
        vehicleBrand: bookings.vehicleBrand,
        vehicleModel: bookings.vehicleModel,
        manufacturingYear: bookings.manufacturingYear,
        registrationPlate: bookings.registrationPlate,
        status: bookings.status,
        totalAmount: bookings.totalAmount,
        paymentMethod: sql<string>`bookings.payment_method`,
        paymentStatus: sql<string>`bookings.payment_status`,
        createdAt: bookings.createdAt,
        updatedAt: bookings.updatedAt,
        service: {
          name: services.name,
          price: services.price,
          duration: services.duration,
        },
        slot: {
          date: slots.date,
          startTime: slots.startTime,
          endTime: slots.endTime,
        },
      })
      .from(bookings)
      .leftJoin(services, eq(bookings.serviceId, services.id))
      .leftJoin(slots, eq(bookings.slotId, slots.id))
      .where(eq(bookings.id, id));
    return booking;
  }

  async createBooking(bookingData: InsertBooking & { userId: string }): Promise<Booking> {
    const [booking] = await db
      .insert(bookings)
      .values(bookingData)
      .returning();
    return booking;
  }

  async updateBookingStatus(id: string, status: string): Promise<Booking> {
    const [booking] = await db
      .update(bookings)
      .set({ status, updatedAt: new Date() })
      .where(eq(bookings.id, id))
      .returning();
    return booking;
  }

  async updateBookingPaymentStatus(id: string, paymentStatus: string): Promise<Booking> {
    const [booking] = await db
      .update(bookings)
      .set({ paymentStatus, updatedAt: new Date() })
      .where(eq(bookings.id, id))
      .returning();
    return booking;
  }

  async updateBookingPaymentMethod(id: string, paymentMethod: string): Promise<Booking> {
    const [booking] = await db
      .update(bookings)
      .set({ paymentMethod, updatedAt: new Date() })
      .where(eq(bookings.id, id))
      .returning();
    return booking;
  }

  // Review operations
  async getServiceReviews(serviceId: string): Promise<Review[]> {
    return await db
      .select()
      .from(reviews)
      .where(eq(reviews.serviceId, serviceId))
      .orderBy(desc(reviews.createdAt));
  }

  async getAllReviews(): Promise<Review[]> {
    return await db.select().from(reviews).orderBy(desc(reviews.createdAt));
  }

  async getReviewsByStaffId(staffId: string): Promise<Review[]> {
    return await db.select().from(reviews).where(eq(reviews.staffId, staffId)).orderBy(desc(reviews.createdAt));
  }

  async createReview(reviewData: InsertReview): Promise<Review> {
    const [review] = await db
      .insert(reviews)
      .values(reviewData)
      .returning();
    return review;
  }

  // Admin operations
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUserRole(id: string, role: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async getAnalytics(): Promise<any> {
    // Get total counts
    const totalUsers = await db.select({ count: sql<number>`count(*)` }).from(users);
    const totalBookings = await db.select({ count: sql<number>`count(*)` }).from(bookings);
    const totalServices = await db.select({ count: sql<number>`count(*)` }).from(services);
    const totalRevenue = await db.select({
      total: sql<number>`coalesce(sum(cast(total_amount as decimal)), 0)`
    }).from(bookings).where(eq(bookings.status, 'completed'));

    // Get booking status counts
    const pendingBookings = await db.select({ count: sql<number>`count(*)` })
      .from(bookings)
      .where(eq(bookings.status, 'pending'));
    const confirmedBookings = await db.select({ count: sql<number>`count(*)` })
      .from(bookings)
      .where(eq(bookings.status, 'confirmed'));
    const completedBookings = await db.select({ count: sql<number>`count(*)` })
      .from(bookings)
      .where(eq(bookings.status, 'completed'));
    const cancelledBookings = await db.select({ count: sql<number>`count(*)` })
      .from(bookings)
      .where(eq(bookings.status, 'cancelled'));

    return {
      totalUsers: totalUsers[0]?.count || 0,
      totalBookings: totalBookings[0]?.count || 0,
      totalServices: totalServices[0]?.count || 0,
      totalRevenue: totalRevenue[0]?.total || 0,
      pendingBookings: pendingBookings[0]?.count || 0,
      confirmedBookings: confirmedBookings[0]?.count || 0,
      completedBookings: completedBookings[0]?.count || 0,
      cancelledBookings: cancelledBookings[0]?.count || 0,
    };
  }

  async getSalesData(startDate?: string, endDate?: string): Promise<any> {
    let conditions = [eq(bookings.status, 'completed')];

    if (startDate) {
      conditions.push(sql`${bookings.createdAt} >= ${startDate}`);
    }

    if (endDate) {
      conditions.push(sql`${bookings.createdAt} <= ${endDate}`);
    }

    const salesData = await db
      .select({
        date: sql<string>`date(${bookings.createdAt})`,
        revenue: sql<number>`sum(cast(${bookings.totalAmount} as decimal))`,
        count: sql<number>`count(*)`,
      })
      .from(bookings)
      .where(and(...conditions))
      .groupBy(sql`date(${bookings.createdAt})`)
      .orderBy(sql`date(${bookings.createdAt})`);

    return salesData;
  }

  // Admin setup operations
  async getAdminSetup(): Promise<AdminSetup | undefined> {
    const [setup] = await db.select().from(adminSetup).limit(1);
    return setup;
  }

  async initializeAdmin(setupData: InsertAdminSetup): Promise<AdminSetup> {
    const [setup] = await db
      .insert(adminSetup)
      .values(setupData)
      .returning();
    return setup;
  }

  async checkAdminInitialized(): Promise<boolean> {
    const setup = await this.getAdminSetup();
    return setup?.isInitialized || false;
  }

  // Loyalty operations
  async getUserById(userId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    return user;
  }

  async getLoyaltyRewards(): Promise<LoyaltyReward[]> {
    const rewards = await db.select().from(loyaltyRewards)
      .where(eq(loyaltyRewards.isActive, true))
      .orderBy(asc(loyaltyRewards.pointsCost));
    return rewards;
  }

  async getUserLoyaltyTransactions(userId: string): Promise<LoyaltyTransaction[]> {
    const transactions = await db.select().from(loyaltyTransactions)
      .where(eq(loyaltyTransactions.userId, userId))
      .orderBy(desc(loyaltyTransactions.createdAt))
      .limit(50);
    return transactions;
  }

  async redeemLoyaltyReward(userId: string, rewardId: string): Promise<any> {
    const user = await this.getUserById(userId);
    const [reward] = await db.select().from(loyaltyRewards).where(eq(loyaltyRewards.id, rewardId));

    if (!user) throw new Error("User not found");
    if (!reward) throw new Error("Reward not found");
    if (!reward.isActive) throw new Error("Reward is not active");
    if ((user.loyaltyPoints || 0) < reward.pointsCost) {
      throw new Error("Insufficient points");
    }

    // Deduct points from user
    await db.update(users)
      .set({ loyaltyPoints: (user.loyaltyPoints || 0) - reward.pointsCost })
      .where(eq(users.id, userId));

    // Record the transaction
    await db.insert(loyaltyTransactions).values({
      userId,
      rewardId,
      type: 'redeemed',
      pointsChange: -reward.pointsCost,
      description: `Redeemed: ${reward.name}`,
    });

    return { success: true, reward };
  }

  async awardLoyaltyPoints(userId: string, points: number, description: string, bookingId?: string): Promise<void> {
    const user = await this.getUserById(userId);
    if (!user) throw new Error("User not found");

    const newPoints = (user.loyaltyPoints || 0) + points;
    const newVisits = (user.totalVisits || 0) + (bookingId ? 1 : 0);

    // Update user points and visits
    await db.update(users)
      .set({
        loyaltyPoints: newPoints,
        totalVisits: newVisits
      })
      .where(eq(users.id, userId));

    // Record the transaction
    await db.insert(loyaltyTransactions).values({
      userId,
      bookingId: bookingId || null,
      type: 'earned',
      pointsChange: points,
      description,
    });

    // Update tier if necessary
    await this.updateUserLoyaltyTier(userId);
  }

  async updateUserLoyaltyTier(userId: string): Promise<void> {
    const user = await this.getUserById(userId);
    if (!user) return;

    const points = user.loyaltyPoints || 0;
    let newTier = 'bronze';

    if (points >= 2000) newTier = 'platinum';
    else if (points >= 1000) newTier = 'gold';
    else if (points >= 500) newTier = 'silver';

    if (newTier !== user.loyaltyTier) {
      await db.update(users)
        .set({ loyaltyTier: newTier })
        .where(eq(users.id, userId));

      // Award bonus points for tier upgrade
      const bonusPoints = newTier === 'silver' ? 50 : newTier === 'gold' ? 100 : newTier === 'platinum' ? 200 : 0;
      if (bonusPoints > 0) {
        await db.insert(loyaltyTransactions).values({
          userId,
          type: 'bonus',
          pointsChange: bonusPoints,
          description: `Tier upgrade bonus: Welcome to ${newTier.charAt(0).toUpperCase() + newTier.slice(1)}!`,
        });

        await db.update(users)
          .set({ loyaltyPoints: points + bonusPoints })
          .where(eq(users.id, userId));
      }
    }
  }

  // Password reset operations
  async createPasswordResetToken(userId: string, token: string): Promise<PasswordResetToken> {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry

    const [resetToken] = await db
      .insert(passwordResetTokens)
      .values({
        userId,
        token,
        expiresAt,
      })
      .returning();

    return resetToken;
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    const [resetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(and(
        eq(passwordResetTokens.token, token),
        eq(passwordResetTokens.used, false),
        sql`${passwordResetTokens.expiresAt} > NOW()`
      ));

    return resetToken;
  }

  async markTokenAsUsed(tokenId: string): Promise<void> {
    await db
      .update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.id, tokenId));
  }

  async updateUserPassword(userId: string, hashedPassword: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();

    return user;
  }

  // Staff management operations
  async getAllStaff(): Promise<Staff[]> {
    return await db.select().from(staff).where(eq(staff.isActive, true));
  }

  async getStaff(id: string): Promise<Staff | undefined> {
    const [staffMember] = await db.select().from(staff).where(eq(staff.id, id));
    return staffMember;
  }

  async getStaffByEmployeeId(employeeId: string): Promise<Staff | undefined> {
    const [staffMember] = await db.select().from(staff).where(eq(staff.employeeId, employeeId));
    return staffMember;
  }

  async createStaff(staffData: InsertStaff): Promise<Staff> {
    const [staffMember] = await db
      .insert(staff)
      .values(staffData)
      .returning();
    return staffMember;
  }

  async updateStaff(id: string, updates: Partial<InsertStaff>): Promise<Staff> {
    const [staffMember] = await db
      .update(staff)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(staff.id, id))
      .returning();
    return staffMember;
  }

  async deleteStaff(id: string): Promise<void> {
    await db
      .update(staff)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(staff.id, id));
  }

  // Staff schedule operations
  async getStaffSchedules(staffId?: string, date?: string): Promise<StaffSchedule[]> {
    let query = db.select().from(staffSchedules);

    if (staffId && date) {
      query = query.where(and(
        eq(staffSchedules.staffId, staffId),
        eq(staffSchedules.date, date)
      ));
    } else if (staffId) {
      query = query.where(eq(staffSchedules.staffId, staffId));
    } else if (date) {
      query = query.where(eq(staffSchedules.date, date));
    }

    return await query;
  }

  async createStaffSchedule(scheduleData: InsertStaffSchedule): Promise<StaffSchedule> {
    const [schedule] = await db
      .insert(staffSchedules)
      .values(scheduleData)
      .returning();
    return schedule;
  }

  async updateStaffSchedule(id: string, updates: Partial<InsertStaffSchedule>): Promise<StaffSchedule> {
    const [schedule] = await db
      .update(staffSchedules)
      .set(updates)
      .where(eq(staffSchedules.id, id))
      .returning();
    return schedule;
  }

  async deleteStaffSchedule(id: string): Promise<void> {
    await db.delete(staffSchedules).where(eq(staffSchedules.id, id));
  }

  // Staff leave operations
  async createStaffLeave(leaveData: InsertStaffLeave): Promise<StaffLeave> {
    const [leave] = await db
      .insert(staffLeave)
      .values(leaveData)
      .returning();
    return leave;
  }

  async getActiveStaffLeave(staffId: string): Promise<StaffLeave | undefined> {
    const today = new Date().toISOString().split('T')[0];
    console.log(`Checking active leave for staff ${staffId} on ${today}`);

    const [leave] = await db
      .select()
      .from(staffLeave)
      .where(
        and(
          eq(staffLeave.staffId, staffId),
          eq(staffLeave.status, 'active'),
          lte(staffLeave.startDate, today),
          gte(staffLeave.endDate, today)
        )
      )
      .limit(1);

    console.log(`Found leave for staff ${staffId}:`, leave);
    return leave;
  }

  async updateStaffLeave(id: string, updates: Partial<InsertStaffLeave>): Promise<StaffLeave> {
    const [leave] = await db
      .update(staffLeave)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(staffLeave.id, id))
      .returning();
    return leave;
  }

  async getStaffLeaveHistory(staffId: string): Promise<StaffLeave[]> {
    return await db
      .select()
      .from(staffLeave)
      .where(eq(staffLeave.staffId, staffId))
      .orderBy(desc(staffLeave.createdAt));
  }

  // Auto reward allocation - this triggers when a service is completed and paid
  async processServiceCompletion(bookingId: string): Promise<void> {
    const booking = await this.getBooking(bookingId);
    if (!booking || booking.paymentStatus !== 'completed') return;

    const service = await this.getService(booking.serviceId);
    if (!service) return;

    // Calculate points based on service price (1 point per R10 spent)
    const points = Math.floor(parseFloat(service.price) / 10);

    // Award loyalty points
    await this.awardLoyaltyPoints(
      booking.userId,
      points,
      `Points earned from ${service.name} service`,
      bookingId
    );

    // Update user analytics
    await this.updateCustomerAnalytics(booking.userId, {
      lastVisit: new Date(),
      totalSpent: sql`${customerAnalytics.totalSpent} + ${service.price}`,
    });

    // Update service analytics for today
    const today = new Date().toISOString().split('T')[0];
    await this.updateServiceAnalytics(booking.serviceId, today, {
      bookingsCount: sql`${serviceAnalytics.bookingsCount} + 1`,
      revenue: sql`${serviceAnalytics.revenue} + ${service.price}`,
    });
  }

  // Remaining implementation methods will be added in next update...
  // Inventory operations (placeholder implementations)
  async getAllInventoryCategories(): Promise<InventoryCategory[]> {
    return await db.select().from(inventoryCategories);
  }

  async createInventoryCategory(category: InsertInventoryCategory): Promise<InventoryCategory> {
    const [result] = await db.insert(inventoryCategories).values(category).returning();
    return result;
  }

  async getAllInventoryItems(): Promise<InventoryItem[]> {
    return await db.select().from(inventoryItems).where(eq(inventoryItems.isActive, true));
  }

  async getInventoryItem(id: string): Promise<InventoryItem | undefined> {
    const [item] = await db.select().from(inventoryItems).where(eq(inventoryItems.id, id));
    return item;
  }

  async createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem> {
    const [result] = await db.insert(inventoryItems).values(item).returning();
    return result;
  }

  async updateInventoryItem(id: string, updates: Partial<InsertInventoryItem>): Promise<InventoryItem> {
    const [result] = await db.update(inventoryItems).set(updates).where(eq(inventoryItems.id, id)).returning();
    return result;
  }

  async getLowStockItems(): Promise<InventoryItem[]> {
    return await db.select().from(inventoryItems).where(sql`${inventoryItems.currentStock} <= ${inventoryItems.minimumStock}`);
  }

  async createInventoryTransaction(transaction: InsertInventoryTransaction): Promise<InventoryTransaction> {
    const [result] = await db.insert(inventoryTransactions).values(transaction).returning();
    return result;
  }

  async getInventoryTransactions(itemId?: string): Promise<InventoryTransaction[]> {
    let query = db.select().from(inventoryTransactions);
    if (itemId) {
      query = query.where(eq(inventoryTransactions.itemId, itemId));
    }
    return await query.orderBy(desc(inventoryTransactions.createdAt));
  }

  // Financial reporting operations (placeholder implementations)
  async getFinancialReports(reportType?: string, startDate?: string, endDate?: string): Promise<FinancialReport[]> {
    let query = db.select().from(financialReports);
    if (reportType) {
      query = query.where(eq(financialReports.reportType, reportType));
    }
    return await query.orderBy(desc(financialReports.reportDate));
  }

  async createFinancialReport(report: InsertFinancialReport): Promise<FinancialReport> {
    const [result] = await db.insert(financialReports).values(report).returning();
    return result;
  }

  async generateDailyReport(date: string): Promise<FinancialReport> {
    // This would calculate metrics for a specific date
    const report = {
      reportDate: date,
      reportType: 'daily',
      totalRevenue: '0.00',
      totalBookings: 0,
      averageBookingValue: '0.00',
      taxAmount: '0.00',
      netProfit: '0.00',
    };
    return await this.createFinancialReport(report);
  }

  // Customer analytics operations (placeholder implementations)
  async getCustomerAnalytics(userId?: string): Promise<CustomerAnalytics[]> {
    let query = db.select().from(customerAnalytics);
    if (userId) {
      query = query.where(eq(customerAnalytics.userId, userId));
    }
    return await query;
  }

  async updateCustomerAnalytics(userId: string, analytics: Partial<InsertCustomerAnalytics>): Promise<CustomerAnalytics> {
    const [result] = await db
      .insert(customerAnalytics)
      .values({ userId, ...analytics } as InsertCustomerAnalytics)
      .onConflictDoUpdate({
        target: customerAnalytics.userId,
        set: { ...analytics, updatedAt: new Date() }
      })
      .returning();
    return result;
  }

  async getVipCustomers(): Promise<CustomerAnalytics[]> {
    return await db.select().from(customerAnalytics).where(eq(customerAnalytics.isVip, true));
  }

  async getCustomerSegmentation(): Promise<{ segment: string; count: number; totalValue: string }[]> {
    const result = await db
      .select({
        segment: customerAnalytics.customerSegment,
        count: sql<number>`count(*)`,
        totalValue: sql<string>`sum(${customerAnalytics.totalSpent})`
      })
      .from(customerAnalytics)
      .groupBy(customerAnalytics.customerSegment);

    return result;
  }

  // Service analytics operations (placeholder implementations)
  async getServiceAnalytics(serviceId?: string, startDate?: string, endDate?: string): Promise<ServiceAnalytics[]> {
    let query = db.select().from(serviceAnalytics);
    if (serviceId) {
      query = query.where(eq(serviceAnalytics.serviceId, serviceId));
    }
    return await query.orderBy(desc(serviceAnalytics.date));
  }

  async updateServiceAnalytics(serviceId: string, date: string, data: Partial<InsertServiceAnalytics>): Promise<ServiceAnalytics> {
    const [result] = await db
      .insert(serviceAnalytics)
      .values({ serviceId, date, ...data } as InsertServiceAnalytics)
      .onConflictDoUpdate({
        target: [serviceAnalytics.serviceId, serviceAnalytics.date],
        set: data
      })
      .returning();
    return result;
  }

  async getServicePopularityTrends(): Promise<{ serviceName: string; bookingsCount: number; revenue: string }[]> {
    const result = await db
      .select({
        serviceName: services.name,
        bookingsCount: sql<number>`sum(${serviceAnalytics.bookingsCount})`,
        revenue: sql<string>`sum(${serviceAnalytics.revenue})`
      })
      .from(serviceAnalytics)
      .innerJoin(services, eq(serviceAnalytics.serviceId, services.id))
      .groupBy(services.name)
      .orderBy(sql`sum(${serviceAnalytics.bookingsCount}) desc`);

    return result;
  }

  // Service tracking operations
  async getServiceTracking(bookingId: string): Promise<ServiceTracking | undefined> {
    const [tracking] = await db.select().from(serviceTracking).where(eq(serviceTracking.bookingId, bookingId));
    return tracking;
  }

  async createServiceTracking(tracking: InsertServiceTracking): Promise<ServiceTracking> {
    const [result] = await db.insert(serviceTracking).values(tracking).returning();
    return result;
  }

  async updateServiceTracking(id: string, updates: Partial<InsertServiceTracking>): Promise<ServiceTracking> {
    const [result] = await db.update(serviceTracking).set(updates).where(eq(serviceTracking.id, id)).returning();
    return result;
  }
}

export const storage = new DatabaseStorage();