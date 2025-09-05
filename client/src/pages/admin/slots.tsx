import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../hooks/useAuth";
import { useEffect } from "react";
import { useToast } from "../../hooks/use-toast";
import Sidebar from "../../components/admin/Sidebar";
import { GlassCard } from "../../components/ui/glass-card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Badge } from "../../components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog";
import { apiRequest } from "../../lib/queryClient";
import { isUnauthorizedError } from "../../lib/authUtils";
import { Clock, Plus, Trash2, Calendar, Car, Search, Filter } from "lucide-react";

interface Service {
  id: string;
  name: string;
  duration: number;
}

interface Slot {
  id: string;
  serviceId: string;
  date: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
  createdAt: string;
  service?: Service;
}

interface NewSlotData {
  serviceId: string;
  date: string;
  startTime: string;
  endTime: string;
}

const generateTimeOptions = () => {
  const options = [];
  for (let hour = 8; hour <= 18; hour++) {
    const time24 = hour.toString().padStart(2, '0') + ':00';
    options.push(time24);
    if (hour < 18) {
      const halfHour = hour.toString().padStart(2, '0') + ':30';
      options.push(halfHour);
    }
  }
  return options;
};

export default function AdminSlots() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newSlotData, setNewSlotData] = useState<NewSlotData>({
    serviceId: "",
    date: "",
    startTime: "",
    endTime: "",
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

  const { data: services } = useQuery({
    queryKey: ["/api/services"],
    enabled: isAuthenticated && user?.role === 'admin',
  });

  const { data: slots, isLoading: slotsLoading } = useQuery({
    queryKey: ["/api/slots/all"],
    enabled: isAuthenticated && user?.role === 'admin',
  });

  const createSlotMutation = useMutation({
    mutationFn: async (data: NewSlotData) => {
      return apiRequest("POST", "/api/slots", data);
    },
    onSuccess: () => {
      toast({
        title: "Slot Created",
        description: "New time slot has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/slots/all"] });
      setIsCreateDialogOpen(false);
      setNewSlotData({
        serviceId: "",
        date: "",
        startTime: "",
        endTime: "",
      });
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
        description: error.message || "Failed to create slot.",
        variant: "destructive",
      });
    },
  });

  const deleteSlotMutation = useMutation({
    mutationFn: async (slotId: string) => {
      return apiRequest("DELETE", `/api/slots/${slotId}`);
    },
    onSuccess: () => {
      toast({
        title: "Slot Deleted",
        description: "Time slot has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/slots/all"] });
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
        description: error.message || "Failed to delete slot.",
        variant: "destructive",
      });
    },
  });

  const handleCreateSlot = () => {
    if (!newSlotData.serviceId || !newSlotData.date || !newSlotData.startTime || !newSlotData.endTime) {
      toast({
        title: "Missing Information",
        description: "Please fill in all slot details.",
        variant: "destructive",
      });
      return;
    }
    createSlotMutation.mutate(newSlotData);
  };

  const handleDeleteSlot = (slotId: string, isBooked: boolean) => {
    if (isBooked) {
      toast({
        title: "Cannot Delete",
        description: "Cannot delete a slot that has been booked.",
        variant: "destructive",
      });
      return;
    }
    deleteSlotMutation.mutate(slotId);
  };

  const allSlots = (slots as Slot[]) || [];
  const filteredSlots = allSlots.filter((slot: Slot) => {
    const matchesSearch = slot.service?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         slot.date.includes(searchQuery) ||
                         slot.startTime.includes(searchQuery);
    const matchesService = serviceFilter === "all" || slot.serviceId === serviceFilter;
    const matchesDate = !dateFilter || slot.date === dateFilter;

    return matchesSearch && matchesService && matchesDate;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-800 to-teal-800 flex items-center justify-center">
        <div className="glass-effect p-8 rounded-3xl">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <div className="text-foreground text-lg font-semibold">Loading...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-800 to-teal-800">
      <Sidebar />

      <main className="ml-64 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gradient mb-2">Time Slot Management</h1>
          <p className="text-muted-foreground">Create, manage, and delete available time slots for services</p>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              placeholder="Search slots..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="glass-effect border-border pl-10"
              data-testid="input-search-slots"
            />
          </div>

          <Select value={serviceFilter} onValueChange={setServiceFilter}>
            <SelectTrigger className="glass-effect border-border w-48" data-testid="select-service-filter">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by service" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Services</SelectItem>
              {(services as Service[])?.map((service: Service) => (
                <SelectItem key={service.id} value={service.id}>
                  {service.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="glass-effect border-border w-48"
            data-testid="input-date-filter"
          />

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="ripple-effect bg-gradient-to-r from-primary to-accent text-primary-foreground"
                data-testid="button-create-slot"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Slot
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-effect border-border">
              <DialogHeader>
                <DialogTitle className="text-gradient">Create New Time Slot</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="service">Service</Label>
                  <Select
                    value={newSlotData.serviceId}
                    onValueChange={(value) => setNewSlotData({...newSlotData, serviceId: value})}
                  >
                    <SelectTrigger className="glass-effect border-border" data-testid="select-new-slot-service">
                      <SelectValue placeholder="Select service" />
                    </SelectTrigger>
                    <SelectContent>
                      {(services as Service[])?.map((service: Service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name} ({service.duration} min)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={newSlotData.date}
                    onChange={(e) => setNewSlotData({...newSlotData, date: e.target.value})}
                    className="glass-effect border-border"
                    data-testid="input-new-slot-date"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startTime">Start Time</Label>
                    <Select
                      value={newSlotData.startTime}
                      onValueChange={(value) => setNewSlotData({...newSlotData, startTime: value})}
                    >
                      <SelectTrigger className="glass-effect border-border" data-testid="select-new-slot-start-time">
                        <SelectValue placeholder="Select start time" />
                      </SelectTrigger>
                      <SelectContent>
                        {generateTimeOptions().map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="endTime">End Time</Label>
                    <Select
                      value={newSlotData.endTime}
                      onValueChange={(value) => setNewSlotData({...newSlotData, endTime: value})}
                    >
                      <SelectTrigger className="glass-effect border-border" data-testid="select-new-slot-end-time">
                        <SelectValue placeholder="Select end time" />
                      </SelectTrigger>
                      <SelectContent>
                        {generateTimeOptions().map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  onClick={handleCreateSlot}
                  disabled={createSlotMutation.isPending}
                  className="w-full ripple-effect bg-gradient-to-r from-primary to-accent text-primary-foreground"
                  data-testid="button-save-slot"
                >
                  {createSlotMutation.isPending ? "Creating..." : "Create Slot"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Slots List */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Time Slots ({filteredSlots.length})</h2>
          </div>

          {slotsLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="glass-effect p-4 rounded-xl animate-pulse">
                  <div className="flex justify-between items-center">
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded w-48"></div>
                      <div className="h-3 bg-muted rounded w-32"></div>
                    </div>
                    <div className="h-8 bg-muted rounded w-24"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredSlots.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Time Slots Found</h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery || serviceFilter !== "all" || dateFilter
                  ? "No slots match your current filters."
                  : "Create your first time slot to get started."}
              </p>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="ripple-effect bg-gradient-to-r from-primary to-accent text-primary-foreground">
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Slot
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSlots.map((slot: Slot) => (
                <div
                  key={slot.id}
                  className="glass-effect p-4 rounded-xl hover:bg-white/5 transition-all duration-300"
                  data-testid={`slot-${slot.id}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${slot.isBooked ? 'bg-red-400' : 'bg-green-400'}`}></div>
                        <div>
                          <div className="font-semibold flex items-center space-x-2">
                            <Calendar className="w-4 h-4" />
                            <span>{slot.date}</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {slot.startTime} - {slot.endTime}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <Car className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{slot.service?.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {slot.service?.duration} minutes
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <Badge
                        className={slot.isBooked ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"}
                      >
                        {slot.isBooked ? 'Booked' : 'Available'}
                      </Badge>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSlot(slot.id, slot.isBooked)}
                        disabled={slot.isBooked || deleteSlotMutation.isPending}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        data-testid={`button-delete-slot-${slot.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </main>
    </div>
  );
}