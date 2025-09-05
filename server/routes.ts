import type { Express } from "express";
import { createServer, type Server } from "http";
import crypto from "crypto";
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

  // Password reset routes
  app.post('/api/auth/forgot-password', async (req, res) => {
    try {
      const { email } = req.body;
      const user = await storage.getUserByEmail(email);

      if (!user) {
        // Don't reveal whether email exists for security
        return res.json({ message: 'If an account with that email exists, a reset link has been sent.' });
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      await storage.createPasswordResetToken(user.id!, resetToken);

      // In a real app, you'd send an email here
      console.log(`Password reset token for ${email}: ${resetToken}`);

      res.json({ message: 'If an account with that email exists, a reset link has been sent.' });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/auth/reset-password', async (req, res) => {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({ message: 'Token and new password are required' });
      }

      const resetToken = await storage.getPasswordResetToken(token);

      if (!resetToken) {
        return res.status(400).json({ message: 'Invalid or expired reset token' });
      }

      // Hash new password
      const hashedPassword = await hashPassword(newPassword);

      // Update user password
      await storage.updateUserPassword(resetToken.userId, hashedPassword);

      // Mark token as used
      await storage.markTokenAsUsed(resetToken.id);

      res.json({ message: 'Password successfully reset' });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
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

  // Add logout route at /api/logout for consistency with common patterns
  app.get('/api/logout', (req, res) => {
    // For JWT-based auth, logout is handled client-side by removing the token
    // This endpoint redirects to home page after clearing client-side state
    res.redirect('/');
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
      const { slots, ...serviceData } = req.body;
      const validatedData = insertServiceSchema.parse(serviceData);
      const service = await storage.createService(validatedData);

      // Create associated slots if provided
      if (slots && slots.length > 0) {
        for (const slot of slots) {
          try {
            await storage.createSlot({
              serviceId: service.id,
              date: slot.date,
              startTime: slot.startTime,
              endTime: slot.endTime,
              isBooked: false,
            });
          } catch (slotError) {
            console.error("Error creating slot:", slotError);
            // Continue with other slots even if one fails
          }
        }
      }

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

  // Admin route to update booking status
  app.put('/api/bookings/:id/status', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { status } = req.body;
      const booking = await storage.updateBookingStatus(req.params.id, status);

      // If booking is completed and payment is completed, trigger service completion processing
      if (status === 'completed' && booking.paymentStatus === 'completed') {
        await storage.processServiceCompletion(req.params.id);
      }

      res.json(booking);
    } catch (error) {
      console.error("Error updating booking status:", error);
      res.status(500).json({ message: "Failed to update booking status" });
    }
  });

  // User route to cancel their own booking
  app.put('/api/bookings/:id/cancel', authenticateToken, async (req, res) => {
    try {
      const bookingId = req.params.id;
      const userId = req.user!.id;

      // Check if the booking belongs to the user
      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      if (booking.userId !== userId) {
        return res.status(403).json({ message: "You can only cancel your own bookings" });
      }

      // Only allow cancellation of pending or confirmed bookings
      if (booking.status !== 'pending' && booking.status !== 'confirmed') {
        return res.status(400).json({ message: "Cannot cancel this booking" });
      }

      const updatedBooking = await storage.updateBookingStatus(bookingId, 'cancelled');

      // Free up the slot
      await storage.updateSlotBookingStatus(booking.slotId, false);

      res.json(updatedBooking);
    } catch (error) {
      console.error("Error cancelling booking:", error);
      res.status(500).json({ message: "Failed to cancel booking" });
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

  // Auto-cancellation endpoint for no-shows
  app.post('/api/bookings/auto-cancel-late', async (req, res) => {
    try {
      const currentTime = new Date();

      // Get all confirmed bookings
      const bookings = await storage.getAllBookings();
      const autoCancelledBookings = [];

      for (const booking of bookings) {
        if (booking.status !== 'confirmed' && booking.status !== 'pending') continue;

        // Get the slot information for this booking
        const slot = await storage.getSlot(booking.slotId);
        if (!slot?.date || !slot?.startTime) continue;

        const serviceDateTime = new Date(`${slot.date}T${slot.startTime}`);
        const minutesDiff = Math.floor((currentTime.getTime() - serviceDateTime.getTime()) / (1000 * 60));

        // Auto-cancel if more than 15 minutes late
        if (minutesDiff > 15) {
          await storage.updateBookingStatus(booking.id, 'cancelled');
          await storage.updateSlotBookingStatus(booking.slotId, false);
          autoCancelledBookings.push(booking.id);
        }
      }

      res.json({
        message: `Auto-cancelled ${autoCancelledBookings.length} late bookings`,
        cancelledBookings: autoCancelledBookings
      });
    } catch (error) {
      console.error("Error auto-cancelling late bookings:", error);
      res.status(500).json({ message: "Failed to auto-cancel late bookings" });
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

  // Get staff ratings endpoint for customers
  app.get("/api/staff/public", async (req, res) => {
    try {
      const staffRecords = await storage.getAllStaff();

      // Get public staff info with ratings for customer selection - filter out staff on leave
      const availableStaff = [];
      for (const staff of staffRecords) {
        if (!staff.isActive) continue;
        const activeLeave = await storage.getActiveStaffLeave(staff.id);
        if (!activeLeave) { // Only include if not on leave
          availableStaff.push(staff);
        }
      }

      const staffWithRatings = await Promise.all(
        availableStaff.map(async (staff) => {
            const user = await storage.getUser(staff.userId);
            const staffReviews = await storage.getReviewsByStaffId(staff.id);
            const avgRating = staffReviews.length > 0
              ? staffReviews.reduce((sum, review) => sum + review.rating, 0) / staffReviews.length
              : 5.0;

            return {
              id: staff.id,
              name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
              role: staff.position,
              rating: Number(avgRating.toFixed(1)),
              reviewCount: staffReviews.length,
              servicesCompleted: staff.totalServicesCompleted || 0
            };
          })
      );

      res.json(staffWithRatings);
    } catch (error) {
      console.error("Error fetching public staff:", error);
      res.status(500).json({ message: "Failed to fetch staff" });
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

  // Loyalty Program Routes
  app.get('/api/user/loyalty', authenticateToken, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        loyaltyPoints: user.loyaltyPoints || 0,
        totalVisits: user.totalVisits || 0,
        loyaltyTier: user.loyaltyTier || 'bronze'
      });
    } catch (error) {
      console.error("Error fetching user loyalty data:", error);
      res.status(500).json({ message: "Failed to fetch loyalty data" });
    }
  });

  app.get('/api/loyalty/rewards', async (req, res) => {
    try {
      const rewards = await storage.getLoyaltyRewards();
      res.json(rewards || []);
    } catch (error) {
      console.error("Error fetching loyalty rewards:", error);
      res.status(500).json({ message: "Failed to fetch rewards" });
    }
  });

  app.get('/api/loyalty/transactions', authenticateToken, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const transactions = await storage.getUserLoyaltyTransactions(userId);
      res.json(transactions || []);
    } catch (error) {
      console.error("Error fetching loyalty transactions:", error);
      res.status(500).json({ message: "Failed to fetch loyalty transactions" });
    }
  });

  app.post('/api/loyalty/redeem', authenticateToken, async (req, res) => {
    try {
      const userId = req.user?.id;
      const { rewardId } = req.body;

      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const result = await storage.redeemLoyaltyReward(userId, rewardId);
      res.json(result);
    } catch (error: any) {
      console.error("Error redeeming loyalty reward:", error);
      res.status(400).json({ message: error.message || "Failed to redeem reward" });
    }
  });

  // Enhanced analytics endpoints
  app.get('/api/admin/analytics', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const analytics = await storage.getAnalytics();
      const servicePopularity = await storage.getServicePopularityTrends();

      const enhancedAnalytics = {
        revenue: {
          total: (analytics.totalRevenue || 0).toString(),
          daily: Math.floor((analytics.totalRevenue || 0) / 30).toString(), // Approximate daily
          monthly: (analytics.totalRevenue || 0).toString(),
          growth: '12.5' // Mock growth percentage
        },
        customers: {
          total: analytics.totalUsers || 0,
          vip: Math.floor((analytics.totalUsers || 0) * 0.15), // 15% VIP
          new: Math.floor((analytics.totalUsers || 0) * 0.1), // 10% new
          retention: '85.2' // Mock retention percentage
        },
        services: {
          popular: servicePopularity,
          trends: []
        },
        staff: {
          performance: [
            { name: 'John Smith', score: '4.8', services: 45 },
            { name: 'Sarah Johnson', score: '4.6', services: 38 },
            { name: 'Mike Wilson', score: '4.9', services: 52 }
          ],
          schedules: [
            { name: 'John Smith', status: 'present', hours: 8 },
            { name: 'Sarah Johnson', status: 'present', hours: 6 },
            { name: 'Mike Wilson', status: 'late', hours: 8 }
          ]
        }
      };

      res.json(enhancedAnalytics);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      res.status(500).json({ message: 'Failed to fetch analytics' });
    }
  });

  app.get('/api/admin/customer-segmentation', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const segments = await storage.getCustomerSegmentation();
      res.json(segments);
    } catch (error) {
      console.error('Error fetching customer segmentation:', error);
      res.status(500).json({ message: 'Failed to fetch customer segmentation' });
    }
  });

  app.get('/api/admin/inventory/low-stock', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const lowStockItems = await storage.getLowStockItems();
      res.json(lowStockItems);
    } catch (error) {
      console.error('Error fetching low stock items:', error);
      res.status(500).json({ message: 'Failed to fetch low stock items' });
    }
  });

  // Export reports
  app.post('/api/admin/export-report', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { type } = req.body;

      if (type === 'pdf') {
        const doc = new PDFDocument();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="analytics-report.pdf"');

        doc.pipe(res);

        doc.fontSize(20).text('Business Analytics Report', 100, 100);
        doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`, 100, 130);

        const rawAnalytics = await storage.getAnalytics();
        doc.text(`Total Revenue: R${rawAnalytics.totalRevenue || 0}`, 100, 160);
        doc.text(`Total Customers: ${rawAnalytics.totalUsers || 0}`, 100, 180);
        doc.text(`Total Bookings: ${rawAnalytics.totalBookings || 0}`, 100, 200);

        doc.end();
      } else if (type === 'excel') {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Analytics');

        worksheet.columns = [
          { header: 'Metric', key: 'metric', width: 20 },
          { header: 'Value', key: 'value', width: 15 }
        ];

        const rawAnalytics = await storage.getAnalytics();
        worksheet.addRow({ metric: 'Total Revenue', value: `R${rawAnalytics.totalRevenue || 0}` });
        worksheet.addRow({ metric: 'Total Customers', value: rawAnalytics.totalUsers || 0 });
        worksheet.addRow({ metric: 'Total Bookings', value: rawAnalytics.totalBookings || 0 });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="analytics-report.xlsx"');

        await workbook.xlsx.write(res);
        res.end();
      } else {
        res.status(400).json({ message: 'Invalid export type' });
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      res.status(500).json({ message: 'Failed to export report' });
    }
  });

  // Staff management API endpoints
  app.get('/api/staff', authenticateToken, requireAdmin, async (req, res) => {
    try {
      console.log('Fetching all staff records...');
      const staffRecords = await storage.getAllStaff();
      console.log(`Found ${staffRecords.length} staff records`);

      // Get user info for each staff member
      const staffWithUserInfo = await Promise.all(
        staffRecords.map(async (staff) => {
          try {
            console.log(`Processing staff member ${staff.id}`);
            const user = await storage.getUser(staff.userId);
            console.log(`User found for staff ${staff.id}:`, user ? 'Yes' : 'No');

            // Calculate actual rating from reviews
            let staffReviews = [];
            let avgRating = 5.0;
            try {
              staffReviews = await storage.getReviewsByStaffId(staff.id);
              avgRating = staffReviews.length > 0
                ? staffReviews.reduce((sum, review) => sum + review.rating, 0) / staffReviews.length
                : 5.0;
            } catch (reviewError) {
              console.log(`Could not fetch reviews for staff ${staff.id}:`, reviewError instanceof Error ? reviewError.message : String(reviewError));
            }

            // Check if staff is currently on leave
            const activeLeave = await storage.getActiveStaffLeave(staff.id);
            console.log(`Active leave for staff ${staff.id}:`, activeLeave ? 'Yes' : 'No');

            let currentStatus = 'inactive';

            if (staff.isActive) {
              if (activeLeave) {
                currentStatus = 'on leave';
              } else {
                currentStatus = 'active';
              }
            }

            return {
              id: staff.id,
              name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
              role: staff.position,
              email: user?.email,
              phone: user?.phone,
              employeeId: staff.employeeId,
              status: currentStatus,
              rating: Number(avgRating.toFixed(1)),
              servicesCompleted: staff.totalServicesCompleted || 0,
              schedule: 'Mon-Fri 9AM-5PM', // Default schedule
              currentLeave: activeLeave ? {
                id: activeLeave.id,
                leaveType: activeLeave.leaveType,
                startDate: activeLeave.startDate,
                endDate: activeLeave.endDate,
                startTime: activeLeave.startTime,
                endTime: activeLeave.endTime,
                reason: activeLeave.reason
              } : null
            };
          } catch (staffError) {
            console.error(`Error processing staff member ${staff.id}:`, staffError);
            throw staffError;
          }
        })
      );

      console.log(`Successfully processed ${staffWithUserInfo.length} staff members`);
      res.json(staffWithUserInfo);
    } catch (error) {
      console.error('Error fetching staff:', error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      if (error instanceof Error) {
        console.error('Full error details:', error.message, error.stack);
      }
      res.status(500).json({ message: 'Failed to fetch staff: ' + errorMsg });
    }
  });

  app.post('/api/staff', authenticateToken, requireAdmin, async (req, res) => {
    try {
      console.log('Staff creation request body:', req.body);
      const { name, role, email, phone, employeeId, department } = req.body;

      // Basic validation
      if (!name || !role || !email || !phone) {
        console.log('Validation failed - missing fields:', { name: !!name, role: !!role, email: !!email, phone: !!phone });
        return res.status(400).json({ message: 'All fields are required: name, role, email, and phone' });
      }

      // Check if email already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'Email already exists' });
      }

      // First create a user account for the staff member
      const hashedPassword = await hashPassword('defaultPassword123'); // Default password they can change later
      const userData = {
        email,
        password: hashedPassword,
        firstName: name.split(' ')[0] || name,
        lastName: name.split(' ').slice(1).join(' ') || '',
        phone,
        role: 'staff'
      };

      const newUser = await storage.createUser(userData);

      // Then create the staff record linked to the user
      const staffData = {
        userId: newUser.id,
        employeeId: employeeId || `EMP${Date.now()}`,
        position: role,
        department: department || 'Operations',
        hireDate: new Date().toISOString().split('T')[0], // Today's date
        isActive: true
      };

      const staff = await storage.createStaff(staffData);

      // Return combined data for the frontend
      const staffWithUserInfo = {
        id: staff.id,
        name,
        role,
        email,
        phone,
        employeeId: staff.employeeId,
        status: staff.isActive ? 'active' : 'inactive',
        rating: 5.0, // Default rating
        servicesCompleted: 0,
        schedule: 'Mon-Fri 9AM-5PM' // Default schedule
      };

      res.json(staffWithUserInfo);
    } catch (error) {
      console.error('Error creating staff:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('duplicate key') || errorMessage.includes('unique constraint')) {
        return res.status(400).json({ message: 'Email or Employee ID already exists' });
      }
      const errorMsg = error instanceof Error ? error.message : String(error);
      res.status(500).json({ message: 'Failed to create staff member: ' + errorMsg });
    }
  });

  app.put('/api/staff/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
      console.log('Updating staff:', req.params.id, req.body);

      const { name, role, email, phone } = req.body;

      // Update staff record
      const staffUpdates = {
        position: role
      };

      const staff = await storage.updateStaff(req.params.id, staffUpdates);

      // Also update user record if name, email or phone changed
      if (name || email || phone) {
        const user = await storage.getUser(staff.userId);
        if (user) {
          const userUpdates: any = {};
          if (name) {
            const nameParts = name.split(' ');
            userUpdates.firstName = nameParts[0] || name;
            userUpdates.lastName = nameParts.slice(1).join(' ') || '';
          }
          if (email) userUpdates.email = email;
          if (phone) userUpdates.phone = phone;

          if (Object.keys(userUpdates).length > 0) {
            await storage.updateUser(user.id, userUpdates);
          }
        }
      }

      res.json(staff);
    } catch (error) {
      console.error('Error updating staff:', error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      res.status(500).json({ message: 'Failed to update staff: ' + errorMsg });
    }
  });

  // Staff leave management endpoints
  app.post('/api/staff/:id/leave', authenticateToken, requireAdmin, async (req, res) => {
    try {
      console.log('Creating leave for staff:', req.params.id);
      console.log('Request body:', req.body);

      const { leaveType, startDate, endDate, startTime, endTime, reason } = req.body;

      const leaveData = {
        staffId: req.params.id,
        leaveType,
        startDate,
        endDate,
        startTime: startTime || null,
        endTime: endTime || null,
        reason,
        status: 'active' // Immediately active
      };

      console.log('Creating leave with data:', leaveData);
      const leave = await storage.createStaffLeave(leaveData);
      console.log('Leave created successfully:', leave);
      res.json(leave);
    } catch (error) {
      console.error('Error creating staff leave:', error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      res.status(500).json({ message: 'Failed to schedule leave: ' + errorMsg });
    }
  });

  app.put('/api/staff/:staffId/leave/:leaveId/return', authenticateToken, requireAdmin, async (req, res) => {
    try {
      // Mark staff as returned from leave
      const leave = await storage.updateStaffLeave(req.params.leaveId, {
        status: 'completed',
        isActive: false
      });
      res.json(leave);
    } catch (error) {
      console.error('Error marking staff return:', error);
      res.status(500).json({ message: 'Failed to mark staff return' });
    }
  });

  app.get('/api/staff/:id/leave-history', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const leaveHistory = await storage.getStaffLeaveHistory(req.params.id);
      res.json(leaveHistory);
    } catch (error) {
      console.error('Error fetching leave history:', error);
      res.status(500).json({ message: 'Failed to fetch leave history' });
    }
  });

  app.delete('/api/staff/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
      await storage.deleteStaff(req.params.id);
      res.json({ message: 'Staff member deactivated successfully' });
    } catch (error) {
      console.error('Error deleting staff:', error);
      res.status(500).json({ message: 'Failed to delete staff' });
    }
  });

  // Inventory management API endpoints
  app.get('/api/inventory/items', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const items = await storage.getAllInventoryItems();
      res.json(items);
    } catch (error) {
      console.error('Error fetching inventory items:', error);
      res.status(500).json({ message: 'Failed to fetch inventory items' });
    }
  });

  app.post('/api/inventory/items', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const item = await storage.createInventoryItem(req.body);
      res.json(item);
    } catch (error) {
      console.error('Error creating inventory item:', error);
      res.status(500).json({ message: 'Failed to create inventory item' });
    }
  });

  app.put('/api/inventory/items/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const item = await storage.updateInventoryItem(req.params.id, req.body);
      res.json(item);
    } catch (error) {
      console.error('Error updating inventory item:', error);
      res.status(500).json({ message: 'Failed to update inventory item' });
    }
  });

  app.get('/api/inventory/categories', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const categories = await storage.getAllInventoryCategories();
      res.json(categories);
    } catch (error) {
      console.error('Error fetching inventory categories:', error);
      res.status(500).json({ message: 'Failed to fetch inventory categories' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}