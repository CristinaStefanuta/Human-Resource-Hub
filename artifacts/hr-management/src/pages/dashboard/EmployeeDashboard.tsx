import React from 'react';
import { useUser } from '@/contexts/UserContext';
import { useGetEmployeeDashboard } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Clock, Calendar, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function EmployeeDashboardView() {
  const { currentUser } = useUser();
  const { data: dashboard, isLoading } = useGetEmployeeDashboard({ userId: currentUser.id }, {
    query: {
      enabled: !!currentUser.id,
      queryKey: ['employeeDashboard', currentUser.id]
    }
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-96 md:col-span-2 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (!dashboard) return null;

  const chartData = [
    { name: 'Approved', value: dashboard.requestStats.approved, color: 'hsl(var(--primary))' },
    { name: 'Pending', value: dashboard.requestStats.pending, color: 'hsl(var(--chart-2))' },
    { name: 'Denied', value: dashboard.requestStats.denied, color: 'hsl(var(--destructive))' },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Hours This Week</CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{dashboard.hoursThisWeek.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground mt-1">Target: 40h</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Daily Hours</CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{dashboard.avgDailyHours.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground mt-1">Last 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Requests</CardTitle>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{dashboard.requestStats.pending}</div>
            <p className="text-xs text-muted-foreground mt-1">Requires admin approval</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Requests</CardTitle>
            <CardDescription>Your latest submitted requests and their status.</CardDescription>
          </CardHeader>
          <CardContent>
            {dashboard.recentRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                <CheckCircle className="h-8 w-8 mb-3 opacity-20" />
                <p>No recent requests</p>
              </div>
            ) : (
              <div className="space-y-4">
                {dashboard.recentRequests.slice(0, 5).map(req => (
                  <div key={req.id} className="flex items-center justify-between p-4 border border-border rounded-lg bg-card/50">
                    <div>
                      <p className="font-medium text-sm">{req.type}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1 max-w-[200px] md:max-w-md">{req.reason}</p>
                    </div>
                    <Badge variant={req.status === 'Approved' ? 'default' : req.status === 'Denied' ? 'destructive' : 'secondary'}>
                      {req.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Requests Summary</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            {chartData.length === 0 ? (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">No data</div>
            ) : (
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                    />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
