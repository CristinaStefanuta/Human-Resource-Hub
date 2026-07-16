import React, { useEffect, useState } from 'react';
import { useCurrentUser } from '@/contexts/UserContext';
import {
  useListTimeEntries,
  useCreateTimeEntry,
  useGetTodayTimeEntries,
  useGetWeekTimeEntries,
  useListShifts,
  getListTimeEntriesQueryKey,
  getGetTodayTimeEntriesQueryKey,
  getGetWeekTimeEntriesQueryKey,
  getListShiftsQueryKey,
  TimeEntryInputType,
  TimeEntry
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { format, parseISO, isSameDay } from 'date-fns';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Play, Pause, Square, Clock as ClockIcon, CalendarDays } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ClockPage() {
  const currentUser = useCurrentUser();
  const isEmployee = currentUser.role === 'Employee';

  if (isEmployee) {
    return <EmployeeClockView />;
  }

  return <AdminClockView />;
}

function EmployeeClockView() {
  const currentUser = useCurrentUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const { data: entries, isLoading: entriesLoading } = useListTimeEntries(
    { userId: currentUser.id, date: todayStr },
    { query: { queryKey: getListTimeEntriesQueryKey({ userId: currentUser.id, date: todayStr }) } }
  );

  const { data: weekSummary, isLoading: weekLoading } = useGetWeekTimeEntries(
    { userId: currentUser.id },
    { query: { queryKey: getGetWeekTimeEntriesQueryKey({ userId: currentUser.id }) } }
  );

  const { data: shifts, isLoading: shiftsLoading } = useListShifts(
    { userId: currentUser.id },
    { query: { queryKey: getListShiftsQueryKey({ userId: currentUser.id }) } }
  );

  const createMutation = useCreateTimeEntry({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTimeEntriesQueryKey({ userId: currentUser.id, date: todayStr }) });
        queryClient.invalidateQueries({ queryKey: getGetWeekTimeEntriesQueryKey({ userId: currentUser.id }) });
        toast({ title: "Time logged successfully" });
      }
    }
  });

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Determine current status based on last entry
  const lastEntry = entries && entries.length > 0 ? entries[entries.length - 1] : null;
  const currentStatus = !lastEntry ? 'NotStarted' :
    lastEntry.type === 'ClockIn' || lastEntry.type === 'PauseEnd' ? 'ClockedIn' :
    lastEntry.type === 'PauseStart' ? 'OnPause' : 'ClockedOut';

  const handleAction = (type: TimeEntryInputType) => {
    createMutation.mutate({
      data: {
        userId: currentUser.id,
        type
      }
    });
  };

  const todayHours = weekSummary?.dailyBreakdown.find(d => isSameDay(parseISO(d.date), new Date()))?.hours || 0;
  const targetHours = 8;
  const progressPercent = Math.min((todayHours / targetHours) * 100, 100);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Time & Attendance</h1>
        <p className="text-muted-foreground mt-1">Manage your shifts and daily clock-ins.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="flex flex-col border-primary/20 bg-card overflow-hidden relative shadow-md shadow-primary/5">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 to-primary"></div>
          <CardContent className="flex-1 p-8 flex flex-col items-center justify-center text-center">
            <h2 className="text-6xl font-bold tracking-tighter tabular-nums mb-2">
              {format(currentTime, 'HH:mm')}
            </h2>
            <p className="text-lg text-muted-foreground font-medium mb-8">
              {format(currentTime, 'EEEE, MMMM do')}
            </p>

            <div className="w-full max-w-sm space-y-6">
              <div className="flex justify-center mb-4">
                <Badge variant="outline" className="px-4 py-1.5 text-sm uppercase tracking-wider font-semibold border-border bg-background">
                  Status: <span className={
                    currentStatus === 'ClockedIn' ? 'text-primary ml-2' :
                    currentStatus === 'OnPause' ? 'text-orange-500 ml-2' :
                    'text-muted-foreground ml-2'
                  }>{currentStatus.replace(/([A-Z])/g, ' $1').trim()}</span>
                </Badge>
              </div>

              {entriesLoading ? (
                 <Skeleton className="h-14 w-full rounded-full" />
              ) : currentStatus === 'NotStarted' || currentStatus === 'ClockedOut' ? (
                <Button 
                  size="lg" 
                  className="w-full h-14 text-lg rounded-full" 
                  onClick={() => handleAction(TimeEntryInputType.ClockIn)}
                  disabled={createMutation.isPending}
                >
                  <Play className="mr-2 h-5 w-5 fill-current" />
                  Clock In
                </Button>
              ) : currentStatus === 'ClockedIn' ? (
                <div className="grid grid-cols-2 gap-4">
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="h-14 rounded-full border-2"
                    onClick={() => handleAction(TimeEntryInputType.PauseStart)}
                    disabled={createMutation.isPending}
                  >
                    <Pause className="mr-2 h-5 w-5 fill-current" />
                    Take Break
                  </Button>
                  <Button 
                    size="lg" 
                    variant="destructive" 
                    className="h-14 rounded-full"
                    onClick={() => handleAction(TimeEntryInputType.ClockOut)}
                    disabled={createMutation.isPending}
                  >
                    <Square className="mr-2 h-5 w-5 fill-current" />
                    Clock Out
                  </Button>
                </div>
              ) : (
                <Button 
                  size="lg" 
                  className="w-full h-14 text-lg rounded-full"
                  onClick={() => handleAction(TimeEntryInputType.PauseEnd)}
                  disabled={createMutation.isPending}
                >
                  <Play className="mr-2 h-5 w-5 fill-current" />
                  Resume Shift
                </Button>
              )}
            </div>
          </CardContent>
          <div className="bg-muted/50 border-t border-border px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ClockIcon className="h-4 w-4" />
              <span>Today's Hours</span>
            </div>
            <div className="font-semibold text-lg">{todayHours.toFixed(2)}h / {targetHours}h</div>
          </div>
          <Progress value={progressPercent} className="h-1.5 rounded-none rounded-b-xl" />
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary" />
                This Week's Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              {shiftsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : !shifts || shifts.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground border border-dashed rounded-lg">
                  No shifts scheduled this week.
                </div>
              ) : (
                <div className="space-y-2">
                  {shifts.map(shift => (
                    <div key={shift.id} className="flex justify-between items-center p-3 rounded-md bg-muted/50 border border-border/50">
                      <div className="font-medium">{format(parseISO(shift.date), 'EEEE, MMM d')}</div>
                      <div className="text-sm text-muted-foreground">
                        {shift.startTime} - {shift.endTime}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Today's Activity Log</CardTitle>
            </CardHeader>
            <CardContent>
              {entriesLoading ? (
                <Skeleton className="h-32 w-full" />
              ) : !entries || entries.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground border border-dashed rounded-lg text-sm">
                  No punches yet today.
                </div>
              ) : (
                <div className="relative pl-6 border-l-2 border-border/50 space-y-6 pb-2">
                  {entries.map((entry, idx) => (
                    <div key={entry.id} className="relative">
                      <div className="absolute -left-[31px] bg-background border-2 border-primary rounded-full h-4 w-4 mt-0.5"></div>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium leading-none mb-1">
                            {entry.type === 'ClockIn' ? 'Clocked In' :
                             entry.type === 'ClockOut' ? 'Clocked Out' :
                             entry.type === 'PauseStart' ? 'Break Started' : 'Break Ended'}
                          </p>
                          <p className="text-xs text-muted-foreground">{format(new Date(entry.timestamp), 'h:mm a')}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function AdminClockView() {
  const { data: attendance, isLoading } = useGetTodayTimeEntries({
    query: { queryKey: getGetTodayTimeEntriesQueryKey() }
  });

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Today's Attendance</h1>
        <p className="text-muted-foreground mt-1">Live overview of employee presence.</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>In Since</TableHead>
                <TableHead className="text-right">Hours Today</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-10 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : attendance?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    <ClockIcon className="h-8 w-8 mx-auto mb-2 opacity-20" />
                    No attendance data available today.
                  </TableCell>
                </TableRow>
              ) : (
                attendance?.map((record) => (
                  <TableRow key={record.userId}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {record.userName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-foreground">{record.userName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{record.department || '—'}</TableCell>
                    <TableCell>
                      <Badge variant={
                        record.status === 'ClockedIn' ? 'default' :
                        record.status === 'OnPause' ? 'secondary' :
                        record.status === 'ClockedOut' ? 'outline' : 'outline'
                      } className={record.status === 'ClockedIn' ? 'bg-primary/20 text-primary border-primary/30' : ''}>
                        {record.status.replace(/([A-Z])/g, ' $1').trim()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm tabular-nums">
                      {record.clockInTime ? format(new Date(record.clockInTime), 'h:mm a') : '—'}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {record.hoursWorkedToday ? `${record.hoursWorkedToday.toFixed(2)}h` : '—'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
