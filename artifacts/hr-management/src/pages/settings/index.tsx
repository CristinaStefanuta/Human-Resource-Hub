import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useCurrentUser } from '@/contexts/UserContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export default function SettingsPage() {
  const currentUser = useCurrentUser();

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account and preferences.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your basic account information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border border-border">
              <AvatarFallback className="bg-primary/10 text-primary text-lg">
                {currentUser.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-lg font-medium text-foreground">{currentUser.name}</p>
              <p className="text-sm text-muted-foreground">{currentUser.email}</p>
              <div className="mt-2">
                <Badge variant={currentUser.role === 'Admin' ? 'default' : 'secondary'}>
                  {currentUser.role}
                </Badge>
              </div>
            </div>
          </div>
          <Separator />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Department</p>
              <p className="font-medium text-foreground">{currentUser.department || 'Not set'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Shift Preferences</p>
              <p className="font-medium text-foreground">{currentUser.shiftPreferences || 'Not set'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>Customize your PeopleHub experience.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            More settings will be added here soon. Check back later.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
