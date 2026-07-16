import React, { useState } from 'react';
import { useCurrentUser } from '@/contexts/UserContext';
import { useListAnnouncements, useCreateAnnouncement, useDeleteAnnouncement, getListAnnouncementsQueryKey } from '@workspace/api-client-react';
import type { Announcement } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { Trash2, Plus, Megaphone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AnnouncementsPage() {
  const currentUser = useCurrentUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: announcements, isLoading } = useListAnnouncements({
    query: { queryKey: getListAnnouncementsQueryKey() }
  });

  const createMutation = useCreateAnnouncement({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAnnouncementsQueryKey() });
        setIsOpen(false);
        setTitle('');
        setContent('');
        toast({ title: "Announcement published" });
      }
    }
  });

  const deleteMutation = useDeleteAnnouncement({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAnnouncementsQueryKey() });
        toast({ title: "Announcement removed" });
      }
    }
  });

  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [viewOpen, setViewOpen] = useState(false);

  const handleView = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setViewOpen(true);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      data: {
        title,
        content,
        authorId: currentUser.id
      }
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Announcements</h1>
          <p className="text-muted-foreground mt-1">Company news and updates.</p>
        </div>
        
        {currentUser.role === 'Admin' && (
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Post
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create Announcement</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input 
                    id="title" 
                    value={title} 
                    onChange={e => setTitle(e.target.value)} 
                    placeholder="Enter an engaging title"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">Content (HTML supported)</Label>
                  <Textarea 
                    id="content" 
                    value={content} 
                    onChange={e => setContent(e.target.value)}
                    placeholder="<p>Write your update here...</p>"
                    rows={6}
                    required
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Publishing..." : "Publish"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="space-y-6">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="w-full">
              <CardHeader>
                <Skeleton className="h-6 w-1/3 mb-2" />
                <Skeleton className="h-4 w-1/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))
        ) : announcements?.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-xl border border-border">
             <Megaphone className="h-10 w-10 text-muted-foreground mx-auto mb-4 opacity-50" />
             <h3 className="text-lg font-medium text-foreground">No announcements</h3>
             <p className="text-muted-foreground mt-1">It is quiet in here.</p>
          </div>
        ) : (
          announcements?.map((announcement) => (
            <Card 
              key={announcement.id} 
              className="overflow-hidden cursor-pointer hover:bg-muted/40 transition-colors"
              onClick={() => handleView(announcement)}
            >
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div className="flex gap-4">
                    <Avatar className="h-10 w-10 mt-1">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {(announcement.authorName || 'A').charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-xl leading-tight">{announcement.title}</CardTitle>
                      <CardDescription className="mt-1 flex items-center gap-2">
                        <span className="font-medium text-foreground">{announcement.authorName}</span>
                        <span>•</span>
                        <span>{format(new Date(announcement.createdAt), 'MMM d, yyyy h:mm a')}</span>
                      </CardDescription>
                    </div>
                  </div>
                  {currentUser.role === 'Admin' && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-muted-foreground hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Are you sure you want to delete this announcement?')) {
                          deleteMutation.mutate({ id: announcement.id });
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div 
                  className="prose prose-sm md:prose-base dark:prose-invert max-w-none text-muted-foreground line-clamp-4"
                  dangerouslySetInnerHTML={{ __html: announcement.content }}
                />
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-xl leading-tight pr-8">{selectedAnnouncement?.title}</DialogTitle>
            <CardDescription className="flex items-center gap-2 mt-2">
              <span className="font-medium text-foreground">{selectedAnnouncement?.authorName}</span>
              <span>•</span>
              <span>{selectedAnnouncement && format(new Date(selectedAnnouncement.createdAt), 'MMM d, yyyy h:mm a')}</span>
            </CardDescription>
          </DialogHeader>
          <div className="py-2">
            <div 
              className="prose prose-sm md:prose-base dark:prose-invert max-w-none text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: selectedAnnouncement?.content || '' }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
