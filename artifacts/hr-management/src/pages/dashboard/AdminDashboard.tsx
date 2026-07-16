import React from 'react';
import { useGetAdminDashboard } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Users, Activity, Clock, FileText, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function AdminDashboardView() {
  const { data: dashboard, isLoading } = useGetAdminDashboard({
    query: {
      queryKey: ['adminDashboard']
    }
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-96 lg:col-span-2 rounded-xl" />
        <Skeleton className="h-96 lg:col-span-2 rounded-xl" />
      </div>
    );
  }

  if (!dashboard) return null;

  const barChartData = dashboard.requestsByType.map(r => ({
    name: r.type,
    count: r.count
  }));

  const pieChartData = dashboard.attendanceOverview.map(a => ({
    name: a.status.replace(/([A-Z])/g, ' $1').trim(),
    value: a.count,
    color: a.status === 'ClockedIn' ? 'hsl(var(--primary))' : 
           a.status === 'OnPause' ? 'hsl(var(--chart-2))' :
           a.status === 'ClockedOut' ? 'hsl(var(--muted-foreground))' : 'hsl(var(--chart-3))'
  })).filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{dashboard.totalEmployees}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Today</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{dashboard.activeTodayCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Currently clocked in</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Hours/Emp</CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{dashboard.avgHoursPerEmployee.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground mt-1">This week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Requests</CardTitle>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{dashboard.requestStats.pending}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting approval</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Requests By Type</CardTitle>
            <CardDescription>Volume of requests broken down by category.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-4">
              {barChartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground">No data</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} tickMargin={10} />
                    <YAxis axisLine={false} tickLine={false} fontSize={12} allowDecimals={false} />
                    <Tooltip 
                      cursor={{ fill: 'hsl(var(--muted)/0.5)' }}
                      contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }}
                    />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Today's Attendance</CardTitle>
            <CardDescription>Live snapshot of employee statuses.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
               {pieChartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground">No data</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }}
                    />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Requests Requiring Action</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dashboard.recentRequests.length === 0 ? (
               <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                <CheckCircle className="h-8 w-8 mb-3 opacity-20" />
                <p>All caught up!</p>
              </div>
            ) : (
              dashboard.recentRequests.map(req => (
                <div key={req.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-border rounded-lg bg-card/50 gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{req.userName}</span>
                      <span className="text-muted-foreground text-sm">•</span>
                      <span className="font-medium text-sm text-primary">{req.type}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{req.reason}</p>
                  </div>
                  <Badge variant={req.status === 'Approved' ? 'default' : req.status === 'Denied' ? 'destructive' : 'secondary'}>
                    {req.status}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
