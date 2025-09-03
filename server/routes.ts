import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { authenticateToken, requireAdmin, generateToken, hashPassword, comparePassword } from "./auth";
// import { setupAuth, isAuthenticated } from "./replitAuth"; // For Replit deployment
import { insertServiceSchema, insertSlotSchema, insertBookingSchema, insertReviewSchema, registerSchema, loginSchema } from "@shared/schema";
import { z } from "zod";
import Stripe from "stripe";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function registerRoutes(app: Express): Promise<Server> {
  // For local development, comment out Replit auth and uncomment JWT auth below
  // await setupAuth(app); // For Replit deployment only

  // JWT Auth routes for local development
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await storage.getUserByEmail(email);

      if (!user || !(await comparePassword(password, user.password))) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const token = generateToken({ id: user.id!, email: user.email!, role: user.role! });
      res.json({ user, token });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/auth/user', authenticateToken, async (req, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.get('/api/auth/logout', (req, res) => {
    res.json({ message: 'Logged out successfully' });
  });

  app.post('/api/auth/register', async (req, res) => {
    try {
      const validatedData = registerSchema.parse(req.body);

      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      const hashedPassword = await hashPassword(validatedData.password);
      const user = await storage.createUser({
        ...validatedData,
        password: hashedPassword,
        role: 'user',
      });

      const token = generateToken({ id: user.id!, email: user.email!, role: user.role! });
      res.status(201).json({ user, token });
    } catch (error) {
      console.error('Registration error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid data', errors: error.errors });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Admin setup routes (no JWT required for initial setup)
  app.get('/api/admin/setup/status', async (req, res) => {
    try {
      const isInitialized = await storage.checkAdminInitialized();
      res.json({ isInitialized });
    } catch (error) {
      console.error("Error checking admin setup status:", error);
      res.status(500).json({ message: "Failed to check admin setup status" });
    }
  });

  app.post('/api/admin/setup', async (req, res) => {
    try {
      // Check if admin is already initialized
      const isInitialized = await storage.checkAdminInitialized();
      if (isInitialized) {
        return res.status(400).json({ message: "Admin already initialized" });
      }

      const { email, password, firstName, lastName } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password required" });
      }

      // Check if any user with this email exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create admin user
      const admin = await storage.createUser({
        email,
        password: hashedPassword,
        firstName: firstName || 'Admin',
        lastName: lastName || 'User',
        role: 'admin',
        phone: '+27 11 123 4567',
        address: '123 Admin Street, Johannesburg, 2001',
      });

      // Mark admin as initialized
      await storage.initializeAdmin({
        isInitialized: true,
        setupToken: null,
      });

      // Remove password from response
      const { password: _, ...adminResponse } = admin;

      res.status(201).json({
        message: "Admin setup completed successfully",
        admin: adminResponse,
      });
    } catch (error) {
      console.error("Error setting up admin:", error);
      res.status(500).json({ message: "Failed to setup admin" });
    }
  });

  // Auth routes (no JWT required)
  app.post('/api/auth/register', async (req, res) => {
    try {
      const validatedData = registerSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash password
      const hashedPassword = await hashPassword(validatedData.password);

      // Create user
      const user = await storage.createUser({
        ...validatedData,
        password: hashedPassword,
      });

      // Remove password from response
      const { password, ...userResponse } = user;

      // Generate token
      const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role || 'user',
      });

      res.status(201).json({
        user: userResponse,
        token,
      });
    } catch (error) {
      console.error("Error registering user:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to register user" });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const validatedData = loginSchema.parse(req.body);

      // Find user
      const user = await storage.getUserByEmail(validatedData.email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Check password
      const isValidPassword = await comparePassword(validatedData.password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Remove password from response
      const { password, ...userResponse } = user;

      // Generate token
      const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role || 'user',
      });

      res.json({
        user: userResponse,
        token,
      });
    } catch (error) {
      console.error("Error logging in user:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to login" });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    // For JWT-based auth, logout is handled client-side by removing the token
    // This endpoint exists for consistency and future session-based auth if needed
    res.json({ message: "Logged out successfully" });
  });

  app.get('/api/auth/user', authenticateToken, async (req, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password, ...userResponse } = user;
      res.json(userResponse);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Service routes
  app.get('/api/services', async (req, res) => {
    try {
      const services = await storage.getAllServices();
      res.json(services);
    } catch (error) {
      console.error("Error fetching services:", error);
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });

  app.get('/api/services/:id', async (req, res) => {
    try {
      const service = await storage.getService(req.params.id);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      res.json(service);
    } catch (error) {
      console.error("Error fetching service:", error);
      res.status(500).json({ message: "Failed to fetch service" });
    }
  });

  app.post('/api/services', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const validatedData = insertServiceSchema.parse(req.body);
      const service = await storage.createService(validatedData);
      res.status(201).json(service);
    } catch (error) {
      console.error("Error creating service:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create service" });
    }
  });

  app.put('/api/services/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const updates = insertServiceSchema.partial().parse(req.body);
      const service = await storage.updateService(req.params.id, updates);
      res.json(service);
    } catch (error) {
      console.error("Error updating service:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update service" });
    }
  });

  app.delete('/api/services/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
      await storage.deleteService(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting service:", error);
      res.status(500).json({ message: "Failed to delete service" });
    }
  });

  // Slot routes
  app.get('/api/slots', async (req, res) => {
    try {
      const { serviceId, date } = req.query;
      const slots = await storage.getAvailableSlots(
        serviceId as string,
        date as string
      );
      res.json(slots);
    } catch (error) {
      console.error("Error fetching slots:", error);
      res.status(500).json({ message: "Failed to fetch slots" });
    }
  });

  // Get available slots for a specific service (used by booking modal)
  app.get('/api/slots/availability/:serviceId', async (req, res) => {
    try {
      const { serviceId } = req.params;
      const availableSlots = await storage.getAvailableSlots(serviceId);

      // Format slots for frontend consumption
      const formattedSlots = availableSlots.map(slot => ({
        id: slot.id,
        serviceId: slot.serviceId,
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        isBooked: slot.isBooked
      }));

      res.json(formattedSlots);
    } catch (error) {
      console.error("Error fetching slot availability:", error);
      res.status(500).json({ message: "Failed to fetch slot availability" });
    }
  });

  app.get('/api/slots/all', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const slots = await storage.getAllSlots();
      res.json(slots);
    } catch (error) {
      console.error("Error fetching all slots:", error);
      res.status(500).json({ message: "Failed to fetch slots" });
    }
  });

  app.post('/api/slots', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const validatedData = insertSlotSchema.parse(req.body);
      const slot = await storage.createSlot(validatedData);
      res.status(201).json(slot);
    } catch (error) {
      console.error("Error creating slot:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create slot" });
    }
  });

  app.delete('/api/slots/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
      await storage.deleteSlot(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting slot:", error);
      res.status(500).json({ message: "Failed to delete slot" });
    }
  });

  // Booking routes
  app.get('/api/bookings', authenticateToken, async (req, res) => {
    try {
      const bookings = req.user!.role === 'admin'
        ? await storage.getAllBookings()
        : await storage.getUserBookings(req.user!.id);
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.get('/api/bookings/:id', authenticateToken, async (req, res) => {
    try {
      const booking = await storage.getBooking(req.params.id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Check if user owns booking or is admin
      if (booking.userId !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(booking);
    } catch (error) {
      console.error("Error fetching booking:", error);
      res.status(500).json({ message: "Failed to fetch booking" });
    }
  });

  app.post('/api/bookings', authenticateToken, async (req, res) => {
    try {
      const validatedData = insertBookingSchema.parse(req.body);
      const bookingData = {
        ...validatedData,
        userId: req.user!.id,
      };

      const booking = await storage.createBooking(bookingData);

      // Update slot as booked
      await storage.updateSlotBookingStatus(booking.slotId, true);

      res.status(201).json(booking);
    } catch (error) {
      console.error("Error creating booking:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create booking" });
    }
  });

  app.put('/api/bookings/:id/status', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { status } = req.body;
      const booking = await storage.updateBookingStatus(req.params.id, status);
      res.json(booking);
    } catch (error) {
      console.error("Error updating booking status:", error);
      res.status(500).json({ message: "Failed to update booking status" });
    }
  });

  app.put('/api/bookings/:id/payment-status', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { paymentStatus } = req.body;
      const booking = await storage.updateBookingPaymentStatus(req.params.id, paymentStatus);
      res.json(booking);
    } catch (error) {
      console.error("Error updating payment status:", error);
      res.status(500).json({ message: "Failed to update payment status" });
    }
  });

  // Review routes
  app.get('/api/reviews', async (req, res) => {
    try {
      const { serviceId } = req.query;
      const reviews = serviceId
        ? await storage.getServiceReviews(serviceId as string)
        : await storage.getAllReviews();
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  app.post('/api/reviews', authenticateToken, async (req, res) => {
    try {
      const validatedData = insertReviewSchema.parse(req.body);
      const reviewData = {
        ...validatedData,
        userId: req.user!.id,
      };

      const review = await storage.createReview(reviewData);
      res.status(201).json(review);
    } catch (error) {
      console.error("Error creating review:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create review" });
    }
  });

  // Stripe payment routes
  app.post("/api/create-payment-intent", authenticateToken, async (req, res) => {
    try {
      const { amount, paymentMethod, bookingId } = req.body;

      if (paymentMethod === 'cash') {
        // For cash payments, just confirm the booking
        if (bookingId) {
          await storage.updateBookingPaymentMethod(bookingId, 'cash');
          await storage.updateBookingPaymentStatus(bookingId, 'pending');
          await storage.updateBookingStatus(bookingId, 'confirmed');
        }
        return res.json({
          clientSecret: null,
          paymentMethod: 'cash',
          message: 'Booking confirmed for cash payment'
        });
      }

      // For card payments, create Stripe payment intent
      if (bookingId) {
        await storage.updateBookingPaymentMethod(bookingId, 'card');
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert ZAR to cents
        currency: "zar", // South African Rand
        metadata: {
          bookingId: bookingId || '',
          userId: req.user!.id,
        },
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
        paymentMethod: 'card'
      });
    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ message: "Error creating payment intent: " + error.message });
    }
  });

  app.post("/api/confirm-payment", authenticateToken, async (req, res) => {
    try {
      const { paymentIntentId, bookingId } = req.body;

      // Verify payment with Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent.status === 'succeeded') {
        // Update booking payment status
        await storage.updateBookingPaymentStatus(bookingId, 'completed');
        res.json({ success: true });
      } else {
        res.status(400).json({ message: "Payment not completed" });
      }
    } catch (error: any) {
      res.status(500).json({ message: "Error confirming payment: " + error.message });
    }
  });

  // Admin routes
  app.get('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Remove passwords from response
      const safeUsers = users.map(({ password, ...user }) => user);
      res.json(safeUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const validatedData = registerSchema.parse(req.body);
      const { role = 'user' } = req.body;

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash password
      const hashedPassword = await hashPassword(validatedData.password);

      // Create user with specified role
      const user = await storage.createUser({
        ...validatedData,
        password: hashedPassword,
        role: role,
      });

      // Remove password from response
      const { password, ...userResponse } = user;
      res.status(201).json(userResponse);
    } catch (error) {
      console.error("Error creating user:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.put('/api/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { role } = req.body;
      const user = await storage.updateUserRole(req.params.id, role);
      const { password, ...userResponse } = user;
      res.json(userResponse);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete('/api/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
      // Prevent deleting yourself
      if (req.params.id === req.user!.id) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }

      await storage.deleteUser(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  app.get('/api/admin/analytics', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const analytics = await storage.getAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  app.get('/api/admin/sales-export', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { format, startDate, endDate } = req.query;
      const salesData = await storage.getSalesData(startDate as string, endDate as string);

      if (format === 'excel') {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Sales Data');

        // Add headers
        worksheet.columns = [
          { header: 'Date', key: 'date', width: 15 },
          { header: 'Customer', key: 'customerName', width: 20 },
          { header: 'Email', key: 'customerEmail', width: 25 },
          { header: 'Service', key: 'serviceName', width: 20 },
          { header: 'Vehicle', key: 'vehicleInfo', width: 20 },
          { header: 'Amount (ZAR)', key: 'totalAmount', width: 15 },
          { header: 'Status', key: 'status', width: 15 },
          { header: 'Payment Status', key: 'paymentStatus', width: 15 }
        ];

        // Add data
        salesData.salesData.forEach((row: any) => {
          worksheet.addRow({
            date: new Date(row.date).toLocaleDateString(),
            customerName: row.customerName,
            customerEmail: row.customerEmail,
            serviceName: row.serviceName,
            vehicleInfo: row.vehicleInfo,
            totalAmount: `R${row.totalAmount}`,
            status: row.status,
            paymentStatus: row.paymentStatus
          });
        });

        // Add summary
        worksheet.addRow({});
        worksheet.addRow({ date: 'SUMMARY' });
        worksheet.addRow({ date: 'Total Bookings:', customerName: salesData.summary.totalBookings });
        worksheet.addRow({ date: 'Completed Bookings:', customerName: salesData.summary.completedBookings });
        worksheet.addRow({ date: 'Total Revenue:', customerName: `R${salesData.summary.totalRevenue.toFixed(2)}` });
        worksheet.addRow({ date: 'Completed Revenue:', customerName: `R${salesData.summary.completedRevenue.toFixed(2)}` });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=sales-report-${new Date().toISOString().split('T')[0]}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();

      } else if (format === 'pdf') {
        const doc = new PDFDocument();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=sales-report-${new Date().toISOString().split('T')[0]}.pdf`);

        doc.pipe(res);

        // Title
        doc.fontSize(20).text('AquaShine Sales Report', 50, 50);
        doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`, 50, 80);

        // Summary
        let yPos = 120;
        doc.fontSize(16).text('Summary', 50, yPos);
        yPos += 30;
        doc.fontSize(12);
        doc.text(`Total Bookings: ${salesData.summary.totalBookings}`, 50, yPos);
        doc.text(`Completed Bookings: ${salesData.summary.completedBookings}`, 50, yPos + 20);
        doc.text(`Total Revenue: R${salesData.summary.totalRevenue.toFixed(2)}`, 50, yPos + 40);
        doc.text(`Completed Revenue: R${salesData.summary.completedRevenue.toFixed(2)}`, 50, yPos + 60);

        // Data table header
        yPos += 100;
        doc.fontSize(14).text('Detailed Sales Data', 50, yPos);
        yPos += 30;

        // Simple table-like layout
        salesData.salesData.slice(0, 20).forEach((row: any, index: number) => {
          if (yPos > 700) {
            doc.addPage();
            yPos = 50;
          }

          doc.fontSize(10);
          doc.text(`${new Date(row.date).toLocaleDateString()} | ${row.customerName} | ${row.serviceName} | R${row.totalAmount}`, 50, yPos);
          yPos += 20;
        });

        if (salesData.salesData.length > 20) {
          doc.text(`... and ${salesData.salesData.length - 20} more records`, 50, yPos);
        }

        doc.end();

      } else {
        res.json(salesData);
      }
    } catch (error) {
      console.error("Error exporting sales data:", error);
      res.status(500).json({ message: "Failed to export sales data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}