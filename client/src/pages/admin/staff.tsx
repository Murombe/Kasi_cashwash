import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Sidebar from "@/components/admin/Sidebar";
import {
  UserCheck,
  Plus,
  Edit,
  Trash2,
  Star,
  Clock,
  Users,
  Calendar,
  TrendingUp
} from "lucide-react";

export default function Staff() {
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [isSchedulingLeave, setIsSchedulingLeave] = useState(false);
  const [isEditingStaff, setIsEditingStaff] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [selectedRole, setSelectedRole] = useState("");
  const [customRoleInput, setCustomRoleInput] = useState(false);
  const [selectedLeaveReason, setSelectedLeaveReason] = useState("");
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const { data: staffList, isLoading, error } = useQuery({
    queryKey: ["/api/staff"],
    retry: false,
    enabled: isAuthenticated && user?.role === 'admin', // Only fetch if properly authenticated
  });

  const { data: staffAnalytics } = useQuery({
    queryKey: ["/api/staff/analytics"],
    retry: false,
    enabled: isAuthenticated && user?.role === 'admin',
  });

  // Debug logging
  console.log('Staff query result:', { staffList, isLoading, error });
  console.log('Token in localStorage:', localStorage.getItem('token') ? 'Present' : 'Missing');
  console.log('Auth status:', { isAuthenticated, user, userRole: user?.role });

  // Show loading while auth is being checked
  if (authLoading) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-slate-950 via-slate-800 to-teal-800">
        <Sidebar />
        <div className="flex-1 ml-64 p-8">
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
            <span className="ml-4 text-lg">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  // Check if user is admin
  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-slate-950 via-slate-800 to-teal-800">
        <Sidebar />
        <div className="flex-1 ml-64 p-8">
          <GlassCard className="p-8 text-center">
            <h1 className="text-2xl font-bold text-gradient mb-4">Access Denied</h1>
            <p className="text-muted-foreground mb-6">
              You need to be logged in as an admin to access staff management.
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Authentication Status: {isAuthenticated ? 'Logged in' : 'Not logged in'}</p>
              <p>User Role: {user?.role || 'None'}</p>
              <p>Required Role: admin</p>
            </div>
            <Button
              onClick={() => window.location.href = '/'}
              className="glass-button mt-6"
            >
              Go to Home
            </Button>
          </GlassCard>
        </div>
      </div>
    );
  }

  const deleteStaffMutation = useMutation({
    mutationFn: async (staffId: number) => {
      return apiRequest('DELETE', `/api/staff/${staffId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      toast({
        title: "Success",
        description: "Staff member removed successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove staff member",
        variant: "destructive"
      });
    }
  });

  const handleDeleteStaff = (staffId: number) => {
    if (confirm('Are you sure you want to remove this staff member?')) {
      deleteStaffMutation.mutate(staffId);
    }
  };

  const addStaffMutation = useMutation({
    mutationFn: async (staffData: any) => {
      console.log('Sending staff data to API:', staffData);
      return apiRequest('POST', '/api/staff', staffData);
    },
    onSuccess: (data) => {
      console.log('Staff added successfully:', data);
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      setIsAddingStaff(false);
      setSelectedRole(""); // Reset role selection
      setCustomRoleInput(false); // Reset custom role input
      toast({
        title: "Success",
        description: "Staff member added successfully",
      });
    },
    onError: (error: any) => {
      console.error('Error adding staff:', error);
      let errorMessage = "Failed to add staff member.";

      if (error.message?.includes('401')) {
        errorMessage = "Authentication failed. Please refresh and try again.";
      } else if (error.message?.includes('400')) {
        errorMessage = "Invalid data provided. Please check all fields.";
      } else if (error.message?.includes('Email already exists')) {
        errorMessage = "This email is already registered.";
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  });

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedRole) {
      toast({
        title: "Missing Role",
        description: "Please select a staff role.",
        variant: "destructive"
      });
      return;
    }

    const formData = new FormData(e.target as HTMLFormElement);
    const staffData = {
      name: (formData.get('name') as string)?.trim(),
      role: selectedRole?.trim(),
      email: (formData.get('email') as string)?.trim(),
      phone: (formData.get('phone') as string)?.trim(),
      employeeId: `EMP${Date.now()}`,
      department: 'Operations',
      isActive: true
    };

    // Additional validation
    if (!staffData.name || !staffData.role || !staffData.email || !staffData.phone) {
      console.error('Form validation failed:', staffData);
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    console.log('Adding staff with data:', staffData);
    console.log('Current user:', user);
    console.log('Token exists:', !!localStorage.getItem('token'));

    addStaffMutation.mutate(staffData);
  };

  const scheduleLeave = useMutation({
    mutationFn: async ({ staffId, leaveData }: { staffId: number, leaveData: any }) => {
      console.log('Making API call to schedule leave:', `/api/staff/${staffId}/leave`, leaveData);
      return apiRequest('POST', `/api/staff/${staffId}/leave`, leaveData);
    },
    onSuccess: (data) => {
      console.log('Leave scheduled successfully:', data);
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      setIsSchedulingLeave(false);
      setSelectedStaff(null);
      toast({
        title: "Success",
        description: "Leave scheduled successfully",
      });
    },
    onError: (error) => {
      console.error('Leave scheduling failed:', error);
      toast({
        title: "Error",
        description: `Failed to schedule leave: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  const handleScheduleLeave = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const startDate = formData.get('startDate');
    const endDate = formData.get('endDate');
    const startTime = formData.get('startTime');
    const endTime = formData.get('endTime');

    const leaveData = {
      leaveType: selectedLeaveReason,
      startDate: startDate,
      endDate: endDate,
      startTime: startTime || null,
      endTime: endTime || null,
      reason: `Scheduled ${selectedLeaveReason}`
    };

    console.log('Scheduling leave with data:', leaveData);
    console.log('Selected staff:', selectedStaff);

    scheduleLeave.mutate({ staffId: selectedStaff.id, leaveData });
    setSelectedLeaveReason(""); // Reset form
  };

  const markAsActive = useMutation({
    mutationFn: async (staffId: number) => {
      return apiRequest('PUT', `/api/staff/${staffId}`, { status: 'active' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      toast({
        title: "Success",
        description: "Staff member marked as active",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update staff status",
        variant: "destructive"
      });
    }
  });

  const handleMarkAsActive = (staffId: number) => {
    // Find the staff member and their current leave
    const staff = staffData.find((s: any) => s.id === staffId);
    if (staff?.currentLeave) {
      returnFromLeave.mutate({
        staffId: staffId,
        leaveId: staff.currentLeave.id
      });
    }
  };

  const returnFromLeave = useMutation({
    mutationFn: async ({ staffId, leaveId }: { staffId: number, leaveId: string }) => {
      return apiRequest('PUT', `/api/staff/${staffId}/leave/${leaveId}/return`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      toast({
        title: "Success",
        description: "Staff member marked as returned from leave",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to mark staff return",
        variant: "destructive"
      });
    }
  });

  const editStaffMutation = useMutation({
    mutationFn: async (staffData: any) => {
      return apiRequest('PUT', `/api/staff/${selectedStaff.id}`, staffData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      setIsEditingStaff(false);
      setSelectedStaff(null);
      toast({
        title: "Success",
        description: "Staff member updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update staff: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  const handleEditStaff = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const staffData = {
      name: formData.get('name'),
      role: formData.get('role'),
      email: formData.get('email'),
      phone: formData.get('phone'),
    };

    console.log('Editing staff with data:', staffData);
    editStaffMutation.mutate(staffData);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-slate-950 via-slate-800 to-teal-800">
        <Sidebar />
        <div className="flex-1 ml-64 p-8">
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  // Show only real data from API, or empty array if no data yet
  const staffData = Array.isArray(staffList) ? staffList : [];

  const staffStats = [
    {
      title: "Total Staff",
      value: staffData.length,
      icon: Users,
      color: "text-blue-500"
    },
    {
      title: "Active Today",
      value: staffData.filter(s => s.status === 'active').length,
      icon: UserCheck,
      color: "text-green-500"
    },
    {
      title: "Avg Rating",
      value: (staffData.reduce((acc, s) => acc + (s.rating || 0), 0) / staffData.length).toFixed(1),
      icon: Star,
      color: "text-yellow-500"
    },
    {
      title: "Services Today",
      value: 28,
      icon: TrendingUp,
      color: "text-purple-500"
    }
  ];

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-950 via-slate-800 to-teal-800">
      <Sidebar />
      <div className="flex-1 ml-64 p-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-gradient mb-2">Staff Management</h1>
              <p className="text-muted-foreground">Manage your team and track performance</p>
            </div>
            <Button
              onClick={() => setIsAddingStaff(true)}
              className="glass-button"
              data-testid="button-add-staff"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Staff Member
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {staffStats.map((stat, index) => (
              <GlassCard key={index} className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold text-foreground" data-testid={`stat-${stat.title.toLowerCase().replace(' ', '-')}`}>
                      {stat.value}
                    </p>
                  </div>
                  <stat.icon className={`w-8 h-8 ${stat.color}`} />
                </div>
              </GlassCard>
            ))}
          </div>

          {/* Staff List */}
          <GlassCard className="p-6">
            <h3 className="text-xl font-semibold mb-6 flex items-center">
              <UserCheck className="w-5 h-5 mr-2 text-primary" />
              Team Members
            </h3>

            <div className="space-y-4">
              {staffData.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No staff members found. Add some team members to get started!</p>
                </div>
              ) : (
                staffData.map((staff) => (
                <div key={staff.id} className="p-4 glass-effect rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold">
                          {staff.name.split(' ').map((n: string) => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground" data-testid={`staff-name-${staff.id}`}>
                          {staff.name}
                        </h4>
                        <p className="text-sm text-muted-foreground">{staff.role}</p>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-xs text-muted-foreground">{staff.email}</span>
                          <span className="text-xs text-muted-foreground">{staff.phone}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <div className="flex items-center justify-center">
                          <Star className="w-4 h-4 text-yellow-500 mr-1" />
                          <span className="font-semibold text-yellow-500" data-testid={`staff-rating-${staff.id}`}>
                            {staff.rating}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">Rating</p>
                      </div>

                      <div className="text-center">
                        <p className="font-semibold text-foreground" data-testid={`staff-services-${staff.id}`}>
                          {staff.servicesCompleted}
                        </p>
                        <p className="text-xs text-muted-foreground">Services</p>
                      </div>

                      <div className="text-center">
                        <Badge
                          variant={staff.status === 'active' ? 'default' : 'secondary'}
                          className={`capitalize
                            ${staff.status === 'active'
                              ? 'bg-green-500/20 text-green-300 border-green-500/30'
                              : staff.status === 'on leave'
                              ? 'bg-orange-500/20 text-orange-300 border-orange-500/30'
                              : 'bg-gray-500/20 text-gray-300 border-gray-500/30'
                            }
                          `}
                          data-testid={`staff-status-${staff.id}`}
                        >
                          {staff.status}
                        </Badge>
                      </div>

                      <div className="flex items-center space-x-2">
                        {staff.status === 'on leave' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="glass-effect text-green-500 hover:text-green-600"
                            onClick={() => handleMarkAsActive(staff.id)}
                            disabled={markAsActive.isPending}
                            data-testid={`button-return-${staff.id}`}
                          >
                            <UserCheck className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="glass-effect text-orange-500 hover:text-orange-600"
                            onClick={() => {
                              setSelectedStaff(staff);
                              setIsSchedulingLeave(true);
                            }}
                            data-testid={`button-schedule-leave-${staff.id}`}
                          >
                            <Calendar className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="glass-effect"
                          onClick={() => {
                            setSelectedStaff(staff);
                            setIsEditingStaff(true);
                          }}
                          data-testid={`button-edit-${staff.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="glass-effect text-red-500 hover:text-red-600"
                          onClick={() => handleDeleteStaff(staff.id)}
                          disabled={deleteStaffMutation.isPending}
                          data-testid={`button-delete-${staff.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="flex items-center text-sm text-muted-foreground mb-2">
                      <Clock className="w-4 h-4 mr-2" />
                      Schedule: {staff.schedule}
                    </div>

                    {/* Leave Details */}
                    {staff.status === 'on leave' && staff.currentLeave && (
                      <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 mt-2">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-orange-300">
                              {staff.currentLeave.leaveType}
                            </p>
                            <p className="text-xs text-orange-200 mt-1">
                              {staff.currentLeave.startDate} to {staff.currentLeave.endDate}
                              {staff.currentLeave.startTime && staff.currentLeave.endTime &&
                                ` (${staff.currentLeave.startTime} - ${staff.currentLeave.endTime})`
                              }
                            </p>
                            {staff.currentLeave.reason && (
                              <p className="text-xs text-orange-200 mt-1">
                                {staff.currentLeave.reason}
                              </p>
                            )}
                          </div>
                          <div className="ml-3">
                            <Button
                              size="sm"
                              className="glass-button bg-green-600/20 hover:bg-green-600/30 text-green-300 border border-green-500/30"
                              onClick={() => returnFromLeave.mutate({
                                staffId: staff.id,
                                leaveId: staff.currentLeave.id
                              })}
                              disabled={returnFromLeave.isPending}
                              data-testid={`button-return-staff-${staff.id}`}
                            >
                              {returnFromLeave.isPending ? 'Processing...' : 'Mark as Returned'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                ))
              )}
            </div>
          </GlassCard>

          {/* Performance Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GlassCard className="p-6">
              <h3 className="text-xl font-semibold mb-4">Top Performers</h3>
              <div className="space-y-3">
                {staffData
                  .sort((a, b) => b.rating - a.rating)
                  .slice(0, 3)
                  .map((staff, index) => (
                    <div key={staff.id} className="flex items-center justify-between p-3 glass-effect rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-500'
                        }`}>
                          {index + 1}
                        </div>
                        <span className="font-medium">{staff.name}</span>
                      </div>
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-500 mr-1" />
                        <span className="font-semibold">{staff.rating}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <h3 className="text-xl font-semibold mb-4">Schedule Overview</h3>
              <div className="space-y-3">
                {staffData.map((staff) => (
                  <div key={staff.id} className="flex items-center justify-between p-3 glass-effect rounded-lg">
                    <span className="font-medium">{staff.name}</span>
                    <div className="flex items-center space-x-2">
                      <Badge variant={staff.status === 'active' ? 'default' : 'secondary'}>
                        {staff.status}
                      </Badge>
                      <span className="text-sm text-muted-foreground">{staff.schedule}</span>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>

          {/* Add Staff Modal */}
          <Dialog open={isAddingStaff} onOpenChange={setIsAddingStaff}>
            <DialogContent className="glass-effect border border-border/50">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-gradient">Add Staff Member</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddStaff} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name" className="text-foreground">Full Name</Label>
                    <Input
                      id="name"
                      name="name"
                      required
                      className="glass-effect"
                      placeholder="Enter full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="role" className="text-foreground">Role</Label>
                    {customRoleInput ? (
                      <div className="space-y-2">
                        <Input
                          value={selectedRole}
                          onChange={(e) => setSelectedRole(e.target.value)}
                          placeholder="Enter custom role"
                          className="glass-effect"
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setCustomRoleInput(false);
                            setSelectedRole("");
                          }}
                          className="text-muted-foreground"
                        >
                          Back to predefined roles
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Select value={selectedRole} onValueChange={setSelectedRole} required>
                          <SelectTrigger className="glass-effect">
                            <SelectValue placeholder="Staff Role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Staff Member">Staff Member</SelectItem>
                            <SelectItem value="Senior Staff">Senior Staff</SelectItem>
                            <SelectItem value="Team Leader">Team Leader</SelectItem>
                            <SelectItem value="Supervisor">Supervisor</SelectItem>
                            <SelectItem value="Manager">Manager</SelectItem>
                            <SelectItem value="Assistant Manager">Assistant Manager</SelectItem>
                            <SelectItem value="Shift Leader">Shift Leader</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setCustomRoleInput(true)}
                          className="text-primary w-full"
                        >
                          + Add custom role
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email" className="text-foreground">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      className="glass-effect"
                      placeholder="Enter email address"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-foreground">Phone</Label>
                    <Input
                      id="phone"
                      name="phone"
                      required
                      className="glass-effect"
                      placeholder="+27 11 123 4567"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddingStaff(false)}
                    className="glass-effect"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="glass-button"
                    disabled={addStaffMutation.isPending}
                  >
                    {addStaffMutation.isPending ? 'Adding...' : 'Add Staff Member'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Schedule Leave Modal */}
          <Dialog open={isSchedulingLeave} onOpenChange={setIsSchedulingLeave}>
            <DialogContent className="glass-effect border border-border/50">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-gradient">
                  Schedule Leave - {selectedStaff?.name}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleScheduleLeave} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate" className="text-foreground">Start Date</Label>
                    <Input
                      id="startDate"
                      name="startDate"
                      type="date"
                      required
                      className="glass-effect"
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate" className="text-foreground">End Date</Label>
                    <Input
                      id="endDate"
                      name="endDate"
                      type="date"
                      required
                      className="glass-effect"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startTime" className="text-foreground">Start Time (Optional)</Label>
                    <Input
                      id="startTime"
                      name="startTime"
                      type="time"
                      className="glass-effect"
                      placeholder="09:00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="endTime" className="text-foreground">End Time (Optional)</Label>
                    <Input
                      id="endTime"
                      name="endTime"
                      type="time"
                      className="glass-effect"
                      placeholder="17:00"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="reason" className="text-foreground">Leave Reason</Label>
                  <Select value={selectedLeaveReason} onValueChange={setSelectedLeaveReason} required>
                    <SelectTrigger className="glass-effect">
                      <SelectValue placeholder="Select leave reason" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Annual Leave">Annual Leave</SelectItem>
                      <SelectItem value="Sick Leave">Sick Leave</SelectItem>
                      <SelectItem value="Personal Leave">Personal Leave</SelectItem>
                      <SelectItem value="Emergency Leave">Emergency Leave</SelectItem>
                      <SelectItem value="Study Leave">Study Leave</SelectItem>
                      <SelectItem value="Maternity/Paternity Leave">Maternity/Paternity Leave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsSchedulingLeave(false)}
                    className="glass-effect"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="glass-button"
                    disabled={scheduleLeave.isPending}
                  >
                    {scheduleLeave.isPending ? 'Scheduling...' : 'Schedule Leave'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Edit Staff Modal */}
          <Dialog open={isEditingStaff} onOpenChange={setIsEditingStaff}>
            <DialogContent className="glass-effect border border-border/50">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-gradient">
                  Edit Staff - {selectedStaff?.name}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleEditStaff} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="editName" className="text-foreground">Full Name</Label>
                    <Input
                      id="editName"
                      name="name"
                      defaultValue={selectedStaff?.name}
                      required
                      className="glass-effect"
                    />
                  </div>
                  <div>
                    <Label htmlFor="editRole" className="text-foreground">Role</Label>
                    <Input
                      id="editRole"
                      name="role"
                      defaultValue={selectedStaff?.role}
                      required
                      className="glass-effect"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="editEmail" className="text-foreground">Email</Label>
                    <Input
                      id="editEmail"
                      name="email"
                      type="email"
                      defaultValue={selectedStaff?.email}
                      required
                      className="glass-effect"
                    />
                  </div>
                  <div>
                    <Label htmlFor="editPhone" className="text-foreground">Phone</Label>
                    <Input
                      id="editPhone"
                      name="phone"
                      type="tel"
                      defaultValue={selectedStaff?.phone}
                      required
                      className="glass-effect"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditingStaff(false)}
                    className="glass-effect"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="glass-button"
                    disabled={editStaffMutation.isPending}
                  >
                    {editStaffMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

        </div>
      </div>
    </div>
  );
}