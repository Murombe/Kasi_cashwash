import bcrypt from 'bcryptjs';
import { db } from "./db";
import { users, services, slots, bookings, reviews, staff } from "@shared/schema";
import { sql } from "drizzle-orm";

async function seed() {
  console.log("🌱 Seeding database...");

  try {
    // Clear existing data (in order due to foreign key constraints)
    await db.delete(reviews);
    await db.delete(bookings);
    await db.delete(slots);
    await db.delete(services);
    await db.delete(staff);
    await db.delete(users);
    console.log("✅ Cleared existing data");

    // Create admin user with password
    const adminPassword = await bcrypt.hash('admin123', 12);
    const adminUser = await db
      .insert(users)
      .values({
        email: "admin@aquashine.co.za",
        password: adminPassword,
        firstName: "Admin",
        lastName: "User",
        role: "admin",
        phone: "+27 11 123 4567",
        address: "123 Admin Street, Johannesburg, 2001",
      })
      .returning();

    console.log("✅ Admin user created (admin@aquashine.co.za / admin123)");

    // Create regular test user
    const userPassword = await bcrypt.hash('user123', 12);
    const regularUser = await db
      .insert(users)
      .values({
        email: "user@example.com",
        password: userPassword,
        firstName: "John",
        lastName: "Doe",
        role: "user",
        phone: "+27 11 987 6543",
        address: "456 Oak Ave, Cape Town, 8001",
      })
      .returning();

    console.log("✅ Regular user created (user@example.com / user123)");

    // Create staff users and staff records
    const staffUsers = [];
    const staffData = [
      {
        email: "thabo.molefe@aquashine.co.za",
        firstName: "Thabo",
        lastName: "Molefe",
        phone: "+27 11 456 7890",
        position: "Senior Staff",
        employeeId: "AS001"
      },
      {
        email: "nomsa.dlamini@aquashine.co.za",
        firstName: "Nomsa",
        lastName: "Dlamini",
        phone: "+27 11 567 8901",
        position: "Team Leader",
        employeeId: "AS002"
      },
      {
        email: "khwezi.murombe@aquashine.co.za",
        firstName: "Khwezi",
        lastName: "Murombe",
        phone: "+27 83 322 018",
        position: "Senior Staff",
        employeeId: "AS003"
      }
    ];

    // Create staff user accounts
    for (const staffInfo of staffData) {
      const staffPassword = await bcrypt.hash('staff123', 12);
      const staffUser = await db
        .insert(users)
        .values({
          email: staffInfo.email,
          password: staffPassword,
          firstName: staffInfo.firstName,
          lastName: staffInfo.lastName,
          role: "user",
          phone: staffInfo.phone,
          address: "AquaShine Car Wash, Johannesburg",
        })
        .returning();

      staffUsers.push({ ...staffUser[0], ...staffInfo });
    }

    // Create staff records
    for (const staffUser of staffUsers) {
      await db
        .insert(staff)
        .values({
          userId: staffUser.id,
          employeeId: staffUser.employeeId,
          position: staffUser.position,
          department: "Operations",
          hireDate: "2024-01-15",
          isActive: true,
          performanceScore: 8.5,
          totalServicesCompleted: 150,
          averageServiceTime: 45,
        });
    }

    console.log("✅ Staff members created");

    // Create services with ZAR pricing
    const servicesData = [
      {
        name: "Basic Wash",
        description: "Essential exterior wash with soap and rinse. Perfect for regular maintenance.",
        price: "149.99",
        duration: 30,
        category: "basic",
        features: ["Exterior wash", "Soap treatment", "Water rinse", "Basic dry"],
        isActive: true,
      },
      {
        name: "Premium Wash & Wax",
        description: "Complete exterior treatment with premium wax protection and tire shine.",
        price: "299.99",
        duration: 60,
        category: "premium",
        features: ["Premium wash", "Wax protection", "Tire shine", "Interior vacuum", "Dashboard clean"],
        isActive: true,
      },
      {
        name: "Ultimate Detail",
        description: "Full service detailing with interior deep clean and exterior polish.",
        price: "549.99",
        duration: 120,
        category: "detailing",
        features: ["Complete detail", "Interior deep clean", "Exterior polish", "Engine bay clean", "Leather treatment", "Paint protection"],
        isActive: true,
      },
      {
        name: "Express Wash",
        description: "Quick 15-minute wash for busy schedules. External wash only.",
        price: "99.99",
        duration: 15,
        category: "basic",
        features: ["Quick exterior wash", "Rinse", "Speed dry"],
        isActive: true,
      },
      {
        name: "Interior Clean",
        description: "Deep interior cleaning with vacuum, upholstery treatment, and detailing.",
        price: "199.99",
        duration: 45,
        category: "premium",
        features: ["Interior vacuum", "Upholstery clean", "Dashboard detail", "Glass cleaning", "Air freshener"],
        isActive: true,
      },
      {
        name: "Luxury Spa Treatment",
        description: "The ultimate car care experience with premium products and hand finish.",
        price: "799.99",
        duration: 180,
        category: "detailing",
        features: ["Hand wash", "Clay bar treatment", "Paint correction", "Ceramic coating", "Full interior detail", "Engine detail"],
        isActive: true,
      }
    ];

    const createdServices = await db
      .insert(services)
      .values(servicesData)
      .returning();

    console.log("✅ Services created");

    // Create time slots for the next 30 days
    const slotsData = [];
    const today = new Date();

    for (let day = 1; day <= 30; day++) {
      const date = new Date(today);
      date.setDate(today.getDate() + day);
      const dateString = date.toISOString().split('T')[0];

      // Create slots for each service (8 AM to 6 PM, every 2 hours)
      const times = [
        { start: "08:00", end: "10:00" },
        { start: "10:00", end: "12:00" },
        { start: "12:00", end: "14:00" },
        { start: "14:00", end: "16:00" },
        { start: "16:00", end: "18:00" },
      ];

      for (const service of createdServices) {
        for (const time of times) {
          slotsData.push({
            serviceId: service.id,
            date: dateString,
            startTime: time.start,
            endTime: time.end,
            isBooked: false,
          });
        }
      }
    }

    await db.insert(slots).values(slotsData);
    console.log("✅ Time slots created");

    // Skip reviews for now (they require bookings to exist first)

    console.log('\n📋 Test Credentials:');
    console.log('Admin: admin@aquashine.co.za / admin123');
    console.log('User:  user@example.com / user123');

    console.log("🎉 Database seeded successfully!");

  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

export default seed;

// Run the seed function
console.log('🚀 Starting seed process...');
seed()
  .then(() => {
    console.log('✅ Seeding completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });