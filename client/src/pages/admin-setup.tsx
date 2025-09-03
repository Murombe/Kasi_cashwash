import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlassCard } from "@/components/ui/glass-card";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, Loader2 } from "lucide-react";

const adminSetupSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type AdminSetupForm = z.infer<typeof adminSetupSchema>;

export default function AdminSetup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);

  const form = useForm<AdminSetupForm>({
    resolver: zodResolver(adminSetupSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
    },
  });

  // Check if admin is already setup
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const response = await fetch('/api/admin/setup/status');
        const { isInitialized } = await response.json();

        if (isInitialized) {
          toast({
            title: "Admin Already Setup",
            description: "Admin has already been configured. Redirecting to login.",
            variant: "destructive",
          });
          setLocation('/auth/login');
        } else {
          setIsCheckingStatus(false);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsCheckingStatus(false);
      }
    };

    checkAdminStatus();
  }, [setLocation, toast]);

  const setupMutation = useMutation({
    mutationFn: async (data: Omit<AdminSetupForm, 'confirmPassword'>) => {
      const response = await apiRequest("POST", "/api/admin/setup", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Admin Setup Complete!",
        description: "Your administrator account has been created successfully.",
      });
      // Redirect to login page after setup
      setTimeout(() => {
        setLocation('/auth/login');
      }, 2000);
    },
    onError: (error: any) => {
      toast({
        title: "Setup Failed",
        description: error.message || "Failed to create admin account",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AdminSetupForm) => {
    const { confirmPassword, ...setupData } = data;
    setupMutation.mutate(setupData);
  };

  if (isCheckingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-800 to-teal-800">
        <GlassCard className="p-8 text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
          <div className="text-lg font-semibold">Checking admin status...</div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-800 to-teal-800 p-4">
      <GlassCard className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-primary to-accent rounded-2xl flex items-center justify-center mb-4 mx-auto">
            <ShieldCheck className="text-2xl text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gradient mb-2">
            Admin Setup
          </h1>
          <p className="text-muted-foreground">
            Create your administrator account for AquaShine
          </p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                placeholder="John"
                data-testid="input-first-name"
                {...form.register("firstName")}
                className="glass-effect border-border bg-white/90 text-gray-900"
              />
              {form.formState.errors.firstName && (
                <p className="text-sm text-red-400">{form.formState.errors.firstName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                placeholder="Doe"
                data-testid="input-last-name"
                {...form.register("lastName")}
                className="glass-effect border-border bg-white/90 text-gray-900"
              />
              {form.formState.errors.lastName && (
                <p className="text-sm text-red-400">{form.formState.errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Admin Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@aquashine.co.za"
              data-testid="input-email"
              {...form.register("email")}
              className="glass-effect border-border bg-white/90 text-gray-900"
            />
            {form.formState.errors.email && (
              <p className="text-sm text-red-400">{form.formState.errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter secure password (min 8 chars)"
              data-testid="input-password"
              {...form.register("password")}
              className="glass-effect border-border bg-white/90 text-gray-900"
            />
            {form.formState.errors.password && (
              <p className="text-sm text-red-400">{form.formState.errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              data-testid="input-confirm-password"
              {...form.register("confirmPassword")}
              className="glass-effect border-border bg-white/90 text-gray-900"
            />
            {form.formState.errors.confirmPassword && (
              <p className="text-sm text-red-400">{form.formState.errors.confirmPassword.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full ripple-effect bg-gradient-to-r from-primary to-accent text-primary-foreground"
            disabled={setupMutation.isPending}
            data-testid="button-setup-admin"
          >
            {setupMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Setting up...
              </>
            ) : (
              "Create Admin Account"
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            This is a one-time setup for your AquaShine system
          </p>
        </div>
      </GlassCard>
    </div>
  );
}