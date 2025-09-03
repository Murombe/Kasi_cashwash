import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/admin/Sidebar";
import { GlassCard } from "@/components/ui/glass-card";
import { FloatingCard } from "@/components/ui/floating-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Plus, Edit, Trash2, Car, Clock, DollarSign, Tag } from "lucide-react";

interface Service {
  id: string;
  name: string;
  description: string;
  price: string;
  duration: number;
  category: string;
  features?: string[];
  isActive: boolean;
}

export default function AdminServices() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    duration: "",
    category: "basic",
    features: "",
  });

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'admin')) {
      toast({
        title: "Unauthorized",
        description: "Admin access required. Redirecting...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    }
  }, [isAuthenticated, user, isLoading, toast]);

  const { data: services, isLoading: servicesLoading } = useQuery({
    queryKey: ["/api/services"],
    enabled: isAuthenticated && user?.role === 'admin',
  });

  const createServiceMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/services", data);
    },
    onSuccess: () => {
      toast({
        title: "Service Created",
        description: "New service has been added successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      closeModal();
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to create service.",
        variant: "destructive",
      });
    },
  });

  const updateServiceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return apiRequest("PUT", `/api/services/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Service Updated",
        description: "Service has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      closeModal();
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to update service.",
        variant: "destructive",
      });
    },
  });

  const deleteServiceMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/services/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Service Deleted",
        description: "Service has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to delete service.",
        variant: "destructive",
      });
    },
  });

  const openModal = (service?: Service) => {
    if (service) {
      setEditingService(service);
      setFormData({
        name: service.name,
        description: service.description,
        price: service.price,
        duration: service.duration.toString(),
        category: service.category,
        features: service.features?.join(", ") || "",
      });
    } else {
      setEditingService(null);
      setFormData({
        name: "",
        description: "",
        price: "",
        duration: "",
        category: "basic",
        features: "",
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingService(null);
    setFormData({
      name: "",
      description: "",
      price: "",
      duration: "",
      category: "basic",
      features: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const serviceData = {
      name: formData.name,
      description: formData.description,
      price: formData.price,
      duration: parseInt(formData.duration),
      category: formData.category,
      features: formData.features ? formData.features.split(",").map(f => f.trim()).filter(f => f) : [],
      isActive: true,
    };

    if (editingService) {
      updateServiceMutation.mutate({ id: editingService.id, data: serviceData });
    } else {
      createServiceMutation.mutate(serviceData);
    }
  };

  const handleDelete = (service: Service) => {
    if (window.confirm(`Are you sure you want to delete "${service.name}"?`)) {
      deleteServiceMutation.mutate(service.id);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'premium':
        return <Tag className="text-primary" />;
      case 'detailing':
        return <Car className="text-accent" />;
      default:
        return <Car className="text-green-500" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'premium':
        return 'bg-primary/20 text-primary';
      case 'detailing':
        return 'bg-accent/20 text-accent';
      default:
        return 'bg-green-500/20 text-green-500';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <GlassCard className="p-8">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <div className="text-lg font-semibold">Loading...</div>
        </GlassCard>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <GlassCard className="p-12 max-w-md mx-auto text-center">
          <div className="text-xl font-semibold mb-4">Unauthorized Access</div>
          <div className="text-muted-foreground">Admin privileges required</div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Sidebar />
      
      <div className="ml-64 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">
              <span className="text-gradient">Service Management</span>
            </h1>
            <p className="text-muted-foreground">
              Manage car wash services, pricing, and availability
            </p>
          </div>
          <Button
            onClick={() => openModal()}
            className="ripple-effect bg-gradient-to-r from-primary to-accent text-primary-foreground"
            data-testid="button-add-service"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Service
          </Button>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <GlassCard className="p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-primary to-accent rounded-xl flex items-center justify-center mb-4 mx-auto">
              <Car className="text-white" />
            </div>
            <div className="text-2xl font-bold text-gradient" data-testid="total-services">
              {services?.length || 0}
            </div>
            <div className="text-sm text-muted-foreground">Total Services</div>
          </GlassCard>

          <GlassCard className="p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-secondary to-primary rounded-xl flex items-center justify-center mb-4 mx-auto">
              <Tag className="text-white" />
            </div>
            <div className="text-2xl font-bold text-gradient">
              {services?.filter((s: Service) => s.isActive).length || 0}
            </div>
            <div className="text-sm text-muted-foreground">Active Services</div>
          </GlassCard>

          <GlassCard className="p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-accent to-secondary rounded-xl flex items-center justify-center mb-4 mx-auto">
              <DollarSign className="text-white" />
            </div>
            <div className="text-2xl font-bold text-gradient">
              R{Math.round(services?.reduce((avg: number, s: Service) => avg + parseFloat(s.price), 0) / (services?.length || 1)) || 0}
            </div>
            <div className="text-sm text-muted-foreground">Avg. Price</div>
          </GlassCard>

          <GlassCard className="p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-primary rounded-xl flex items-center justify-center mb-4 mx-auto">
              <Clock className="text-white" />
            </div>
            <div className="text-2xl font-bold text-gradient">
              {Math.round(services?.reduce((avg: number, s: Service) => avg + s.duration, 0) / (services?.length || 1)) || 0} min
            </div>
            <div className="text-sm text-muted-foreground">Avg. Duration</div>
          </GlassCard>
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {servicesLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <GlassCard key={i} className="p-6 animate-pulse">
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-muted rounded-2xl"></div>
                  <div className="h-6 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-full"></div>
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                  <div className="flex space-x-2">
                    <div className="h-8 bg-muted rounded w-16"></div>
                    <div className="h-8 bg-muted rounded w-16"></div>
                  </div>
                </div>
              </GlassCard>
            ))
          ) : services?.length === 0 ? (
            <div className="col-span-full text-center py-16">
              <GlassCard className="p-12 max-w-md mx-auto">
                <Car className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No services found</h3>
                <p className="text-muted-foreground mb-6">
                  Get started by creating your first car wash service
                </p>
                <Button
                  onClick={() => openModal()}
                  className="ripple-effect bg-gradient-to-r from-primary to-accent text-primary-foreground"
                >
                  Create Service
                </Button>
              </GlassCard>
            </div>
          ) : (
            services?.map((service: Service) => (
              <FloatingCard key={service.id} className="p-6" data-testid={`service-card-${service.id}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-primary to-accent rounded-xl flex items-center justify-center">
                    {getCategoryIcon(service.category)}
                  </div>
                  <Badge className={getCategoryColor(service.category)}>
                    {service.category}
                  </Badge>
                </div>

                <h3 className="text-xl font-bold mb-2" data-testid={`service-name-${service.id}`}>
                  {service.name}
                </h3>
                <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                  {service.description}
                </p>

                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl font-bold text-gradient" data-testid={`service-price-${service.id}`}>
                    R{service.price}
                  </span>
                  <div className="flex items-center space-x-1 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm" data-testid={`service-duration-${service.id}`}>
                      {service.duration} min
                    </span>
                  </div>
                </div>

                {service.features && service.features.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1">
                      {service.features.slice(0, 3).map((feature, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                      {service.features.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{service.features.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openModal(service)}
                    className="flex-1 glass-effect border-border hover:bg-white/20"
                    data-testid={`button-edit-${service.id}`}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(service)}
                    className="glass-effect border-destructive text-destructive hover:bg-destructive/20"
                    data-testid={`button-delete-${service.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </FloatingCard>
            ))
          )}
        </div>

        {/* Service Modal */}
        <Dialog open={isModalOpen} onOpenChange={closeModal}>
          <DialogContent className="glass-effect border-border max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingService ? 'Edit Service' : 'Create New Service'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Service Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="glass-effect border-border"
                    placeholder="e.g., Premium Car Wash"
                    required
                    data-testid="input-service-name"
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger className="glass-effect border-border" data-testid="select-service-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="detailing">Detailing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="price">Price (ZAR)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    className="glass-effect border-border"
                    placeholder="29.99"
                    required
                    data-testid="input-service-price"
                  />
                </div>

                <div>
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                    className="glass-effect border-border"
                    placeholder="45"
                    required
                    data-testid="input-service-duration"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="glass-effect border-border"
                  placeholder="Describe the service and what's included..."
                  rows={3}
                  required
                  data-testid="textarea-service-description"
                />
              </div>

              <div>
                <Label htmlFor="features">Features (comma-separated)</Label>
                <Input
                  id="features"
                  value={formData.features}
                  onChange={(e) => setFormData(prev => ({ ...prev, features: e.target.value }))}
                  className="glass-effect border-border"
                  placeholder="Exterior wash, Wax protection, Tire shine"
                  data-testid="input-service-features"
                />
              </div>

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeModal}
                  className="glass-effect border-border hover:bg-white/20"
                  data-testid="button-cancel-service"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createServiceMutation.isPending || updateServiceMutation.isPending}
                  className="ripple-effect bg-gradient-to-r from-primary to-accent text-primary-foreground"
                  data-testid="button-save-service"
                >
                  {createServiceMutation.isPending || updateServiceMutation.isPending
                    ? 'Saving...'
                    : editingService
                    ? 'Update Service'
                    : 'Create Service'
                  }
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
