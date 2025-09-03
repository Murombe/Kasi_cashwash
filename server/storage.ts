import {
  users,
  services,
  slots,
  bookings,
  reviews,
  adminSetup,
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
  getSlotsByService(serviceId: string, date?: string): Promise<Slot[]>;
  getAvailableSlots(serviceId?: string, date?: string): Promise<Slot[]>;
  createSlot(slot: InsertSlot): Promise<Slot>;
  updateSlotBookingStatus(slotId: string, isBooked: boolean): Promise<Slot>;

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
    return await db.select().from(bookings).orderBy(desc(bookings.createdAt));
  }

  async getUserBookings(userId: string): Promise<Booking[]> {
    return await db
      .select()
      .from(bookings)
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
        paymentStatus: bookings.paymentStatus,
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

  async getAllBookings(): Promise<Booking[]> {
    return await db.select().from(bookings).orderBy(desc(bookings.createdAt));
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
    const totalReviews = await db.select({ count: sql<number>`count(*)` }).from(reviews);

    // Get revenue (sum of service prices for completed bookings)
    const revenueResult = await db
      .select({
        total: sql<number>`COALESCE(SUM(CAST(${bookings.totalAmount} AS numeric)), 0)`
      })
      .from(bookings)
      .where(eq(bookings.paymentStatus, 'completed'));

    // Get recent bookings
    const recentBookings = await db
      .select()
      .from(bookings)
      .orderBy(desc(bookings.createdAt))
      .limit(5);

    // Get booking status distribution
    const bookingsByStatus = await db
      .select({
        status: bookings.status,
        count: sql<number>`count(*)`
      })
      .from(bookings)
      .groupBy(bookings.status);

    return {
      totalUsers: totalUsers[0]?.count || 0,
      totalBookings: totalBookings[0]?.count || 0,
      totalServices: totalServices[0]?.count || 0,
      totalReviews: totalReviews[0]?.count || 0,
      totalRevenue: revenueResult[0]?.total || 0,
      recentBookings,
      bookingsByStatus
    };
  }

  async getSalesData(startDate?: string, endDate?: string): Promise<any> {
    let conditions: any[] = [];

    if (startDate && endDate) {
      conditions.push(sql`DATE(${bookings.createdAt}) BETWEEN ${startDate} AND ${endDate}`);
    } else if (startDate) {
      conditions.push(sql`DATE(${bookings.createdAt}) >= ${startDate}`);
    } else if (endDate) {
      conditions.push(sql`DATE(${bookings.createdAt}) <= ${endDate}`);
    }

    const salesData = await db
      .select({
        id: bookings.id,
        date: bookings.createdAt,
        customerEmail: users.email,
        customerName: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
        serviceName: services.name,
        servicePrice: services.price,
        totalAmount: bookings.totalAmount,
        status: bookings.status,
        paymentStatus: bookings.paymentStatus,
        vehicleInfo: sql<string>`CONCAT(${bookings.vehicleBrand}, ' ', ${bookings.vehicleModel}, ' ', ${bookings.manufacturingYear})`,
      })
      .from(bookings)
      .innerJoin(users, eq(bookings.userId, users.id))
      .innerJoin(services, eq(bookings.serviceId, services.id))
      .where(conditions.length > 0 ? and(...conditions) : sql`1=1`)
      .orderBy(desc(bookings.createdAt));

    // Calculate summary statistics
    const totalSales = salesData.reduce((sum, booking) =>
      sum + (parseFloat(booking.totalAmount) || 0), 0
    );

    const completedSales = salesData.filter(booking =>
      booking.paymentStatus === 'completed'
    );

    const completedRevenue = completedSales.reduce((sum, booking) =>
      sum + (parseFloat(booking.totalAmount) || 0), 0
    );

    return {
      salesData,
      summary: {
        totalBookings: salesData.length,
        completedBookings: completedSales.length,
        totalRevenue: totalSales,
        completedRevenue: completedRevenue,
        averageOrderValue: salesData.length > 0 ? totalSales / salesData.length : 0
      }
    };
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


}

export const storage = new DatabaseStorage();