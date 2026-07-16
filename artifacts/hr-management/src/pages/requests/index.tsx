import React, { useState } from 'react';
import { useUser } from '@/contexts/UserContext';
import { 
  useListRequests, 
  useCreateRequest, 
  useUpdateRequestStatus, 
  getListRequestsQueryKey,
  RequestInputType,
  RequestStatusUpdateStatus
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Plus, Check, X, CalendarCheck } from 'lucide-react';

export default function RequestsPage() {
  const { currentUser } = useUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const isEmployee = currentUser.role === 'Employee';
  const queryParams = isEmployee ? { userId: currentUser.id } : {};

  const { data: requests, isLoading } = useListRequests(queryParams, {
    query: {
      queryKey: getListRequestsQueryKey(queryParams)
    }
  });

  const createMutation = useCreateRequest({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListRequestsQueryKey(queryParams) });
        setIsOpen(false);
        setType(RequestInputType.Time_Off);
        setReason('');
        toast({ title: "Request submitted" });
      }
    }
  });

  const updateMutation = useUpdateRequestStatus({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListRequestsQueryKey(queryParams) });
      }
    }
  });

  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<string>(RequestInputType.Time_Off);
  const [reason, setReason] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      data: {
        userId: currentUser.id,
        type: type as any,
        reason
      }
    });
  };

  const handleStatusUpdate = (id: number, status: RequestStatusUpdateStatus) => {
    updateMutation.mutate({
      id,
      data: { status }
    });
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Requests</h1>
          <p className="text-muted-foreground mt-1">
            {isEmployee ? "Manage your time off, equipment, and other requests." : "Review and manage employee requests."}
          </p>
        </div>
        
        {isEmployee && (
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Request
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Submit Request</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Request Type</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={RequestInputType.Time_Off}>Time Off</SelectItem>
                      <SelectItem value={RequestInputType.Equipment}>Equipment</SelectItem>
                      <SelectItem value={RequestInputType.Remote_Work}>Remote Work</SelectItem>
                      <SelectItem value={RequestInputType.Other}>Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reason">Reason / Details</Label>
                  <Textarea 
                    id="reason" 
                    value={reason} 
                    onChange={e => setReason(e.target.value)}
                    placeholder="Provide details for your request..."
                    rows={4}
                    required
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Submitting..." : "Submit"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                {!isEmployee && <TableHead>Employee</TableHead>}
                <TableHead>Type</TableHead>
                <TableHead className="w-[40%]">Details</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                {!isEmployee && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {!isEmployee && <TableCell><Skeleton className="h-4 w-24" /></TableCell>}
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                    {!isEmployee && <TableCell><Skeleton className="h-8 w-20 ml-auto" /></TableCell>}
                  </TableRow>
                ))
              ) : requests?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isEmployee ? 4 : 6} className="h-32 text-center text-muted-foreground">
                    <CalendarCheck className="h-8 w-8 mx-auto mb-2 opacity-20" />
                    No requests found.
                  </TableCell>
                </TableRow>
              ) : (
                requests?.map((req) => (
                  <TableRow key={req.id}>
                    {!isEmployee && (
                      <TableCell className="font-medium text-foreground whitespace-nowrap">
                        {req.userName}
                      </TableCell>
                    )}
                    <TableCell className="whitespace-nowrap font-medium text-muted-foreground">{req.type}</TableCell>
                    <TableCell className="max-w-xs truncate" title={req.reason}>
                      {req.reason}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground text-sm">
                      {format(new Date(req.createdAt), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        req.status === 'Approved' ? 'default' : 
                        req.status === 'Denied' ? 'destructive' : 
                        'secondary'
                      }>
                        {req.status}
                      </Badge>
                    </TableCell>
                    {!isEmployee && (
                      <TableCell className="text-right whitespace-nowrap">
                        {req.status === 'Pending' ? (
                          <div className="flex justify-end gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-primary hover:text-primary hover:bg-primary/10"
                              onClick={() => handleStatusUpdate(req.id, RequestStatusUpdateStatus.Approved)}
                              disabled={updateMutation.isPending}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleStatusUpdate(req.id, RequestStatusUpdateStatus.Denied)}
                              disabled={updateMutation.isPending}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground opacity-50 italic">Closed</span>
                        )}
                      </TableCell>
                    )}
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
