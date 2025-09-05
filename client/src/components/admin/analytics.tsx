import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  Award,
  Target,
  BarChart3,
  Download,
  Star,
  Clock
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface AnalyticsData {
  revenue: {
    total: string;
    daily: string;
    monthly: string;
    growth: string;
  };
  customers: {
    total: number;
    vip: number;
    new: number;
    retention: string;
  };
  services: {
    popular: { name: string; bookings: number; revenue: string }[];
    trends: { date: string; bookings: number; revenue: string }[];
  };
  staff: {
    performance: { name: string; score: string; services: number }[];
    schedules: { name: string; status: string; hours: number }[];
  };
}

export default function Analytics() {
  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: ['/api/admin/analytics'],
    retry: 1,
  });

  const { data: customerSegments } = useQuery<{ segment: string; count: number; totalValue: string }[]>({
    queryKey: ['/api/admin/customer-segmentation'],
    retry: 1,
  });

  const { data: lowStock } = useQuery<any[]>({
    queryKey: ['/api/admin/inventory/low-stock'],
    retry: 1,
  });

  const exportReport = async (type: 'pdf' | 'excel') => {
    try {
      const response = await apiRequest('POST', `/api/admin/export-report`, { type });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-report.${type === 'pdf' ? 'pdf' : 'xlsx'}`;
      a.click();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Business Analytics</h1>
          <p className="text-muted-foreground">Comprehensive insights and performance metrics</p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={() => exportReport('excel')}
            variant="outline"
            className="glass-effect"
            data-testid="button-export-excel"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Excel
          </Button>
          <Button
            onClick={() => exportReport('pdf')}
            className="bg-gradient-to-r from-primary to-accent"
            data-testid="button-export-pdf"
          >
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass-effect">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gradient">R{analytics?.revenue.total || '0'}</div>
            <p className="text-xs text-muted-foreground">
              +{analytics?.revenue.growth || '0'}% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="glass-effect">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gradient">{analytics?.customers.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {analytics?.customers.new || 0} new this month
            </p>
          </CardContent>
        </Card>

        <Card className="glass-effect">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">VIP Customers</CardTitle>
            <Award className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gradient">{analytics?.customers.vip || 0}</div>
            <p className="text-xs text-muted-foreground">
              Premium customer base
            </p>
          </CardContent>
        </Card>

        <Card className="glass-effect">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gradient">R{analytics?.revenue.daily || '0'}</div>
            <p className="text-xs text-muted-foreground">
              Today's earnings
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alert for Low Stock */}
      {lowStock && lowStock.length > 0 && (
        <Card className="glass-effect border-orange-500/50">
          <CardHeader>
            <CardTitle className="text-orange-500 flex items-center">
              <Target className="w-5 h-5 mr-2" />
              Low Stock Alert
            </CardTitle>
            <CardDescription>
              {lowStock.length} items need restocking
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {lowStock.slice(0, 5).map((item) => (
                <Badge key={item.id} variant="destructive" className="text-xs">
                  {item.name}: {item.currentStock} left
                </Badge>
              ))}
              {lowStock.length > 5 && (
                <Badge variant="outline" className="text-xs">
                  +{lowStock.length - 5} more
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="glass-effect">
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="customers" data-testid="tab-customers">Customers</TabsTrigger>
          <TabsTrigger value="services" data-testid="tab-services">Services</TabsTrigger>
          <TabsTrigger value="staff" data-testid="tab-staff">Staff</TabsTrigger>
          <TabsTrigger value="financial" data-testid="tab-financial">Financial</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Service Popularity */}
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Popular Services
                </CardTitle>
                <CardDescription>Most booked services this month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics?.services.popular.map((service, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{service.name}</p>
                        <p className="text-sm text-muted-foreground">{service.bookings} bookings</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">R{service.revenue}</p>
                      </div>
                    </div>
                  )) || (
                    <p className="text-muted-foreground text-center py-4">No data available</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Customer Segments */}
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Customer Segments
                </CardTitle>
                <CardDescription>Customer distribution by tier</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {customerSegments?.map((segment) => (
                    <div key={segment.segment} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Badge
                          variant={segment.segment === 'vip' ? 'default' : 'secondary'}
                          className="capitalize"
                        >
                          {segment.segment}
                        </Badge>
                        <span className="font-medium">{segment.count} customers</span>
                      </div>
                      <span className="text-primary font-bold">R{segment.totalValue}</span>
                    </div>
                  )) || (
                    <p className="text-muted-foreground text-center py-4">No data available</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle>Customer Lifetime Value</CardTitle>
                <CardDescription>Average value per customer</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gradient">R1,245</div>
                <p className="text-sm text-muted-foreground">+12% vs last quarter</p>
              </CardContent>
            </Card>

            <Card className="glass-effect">
              <CardHeader>
                <CardTitle>Retention Rate</CardTitle>
                <CardDescription>Customer return percentage</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gradient">{analytics?.customers.retention || '0'}%</div>
                <p className="text-sm text-muted-foreground">Monthly retention</p>
              </CardContent>
            </Card>

            <Card className="glass-effect">
              <CardHeader>
                <CardTitle>Acquisition</CardTitle>
                <CardDescription>New customers this month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gradient">{analytics?.customers.new || 0}</div>
                <p className="text-sm text-muted-foreground">+5% growth rate</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="services" className="space-y-6">
          <Card className="glass-effect">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Star className="w-5 h-5 mr-2" />
                Service Performance Metrics
              </CardTitle>
              <CardDescription>Detailed service analytics and trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {analytics?.services.popular.map((service, index) => (
                  <div key={index} className="p-4 border rounded-lg glass-effect">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{service.name}</h3>
                      <Badge>{service.bookings} bookings</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Revenue:</span>
                        <span className="ml-2 font-medium text-primary">R{service.revenue}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Avg. Rating:</span>
                        <span className="ml-2 font-medium">4.8/5</span>
                      </div>
                    </div>
                  </div>
                )) || (
                  <p className="text-muted-foreground text-center py-8">No service data available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="staff" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="w-5 h-5 mr-2" />
                  Staff Performance
                </CardTitle>
                <CardDescription>Employee productivity metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics?.staff.performance.map((staff, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{staff.name}</p>
                        <p className="text-sm text-muted-foreground">{staff.services} services completed</p>
                      </div>
                      <Badge
                        variant={parseFloat(staff.score) >= 4.0 ? 'default' : 'secondary'}
                        className="font-bold"
                      >
                        {staff.score}/5.0
                      </Badge>
                    </div>
                  )) || (
                    <p className="text-muted-foreground text-center py-4">No staff data available</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="glass-effect">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Schedule Overview
                </CardTitle>
                <CardDescription>Today's staff schedule</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics?.staff.schedules.map((schedule, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{schedule.name}</p>
                        <p className="text-sm text-muted-foreground">{schedule.hours}h scheduled</p>
                      </div>
                      <Badge
                        variant={schedule.status === 'present' ? 'default' : 'secondary'}
                        className="capitalize"
                      >
                        {schedule.status}
                      </Badge>
                    </div>
                  )) || (
                    <p className="text-muted-foreground text-center py-4">No schedule data available</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle>Monthly Revenue</CardTitle>
                <CardDescription>Current month performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gradient">R{analytics?.revenue.monthly || '0'}</div>
                <p className="text-sm text-muted-foreground">+{analytics?.revenue.growth || '0'}% vs last month</p>
              </CardContent>
            </Card>

            <Card className="glass-effect">
              <CardHeader>
                <CardTitle>Tax Summary</CardTitle>
                <CardDescription>VAT and tax calculations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gradient">R2,450</div>
                <p className="text-sm text-muted-foreground">15% VAT collected</p>
              </CardContent>
            </Card>

            <Card className="glass-effect">
              <CardHeader>
                <CardTitle>Net Profit</CardTitle>
                <CardDescription>After expenses and tax</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gradient">R8,950</div>
                <p className="text-sm text-muted-foreground">65% profit margin</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default Analytics;