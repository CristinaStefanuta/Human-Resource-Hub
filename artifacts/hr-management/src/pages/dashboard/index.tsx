import React from 'react';
import { useUser } from '@/contexts/UserContext';
import { EmployeeDashboardView } from './EmployeeDashboard';
import { AdminDashboardView } from './AdminDashboard';

export default function DashboardPage() {
  const { currentUser } = useUser();

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Good morning, {currentUser.name.split(' ')[0]}.
        </h1>
        <p className="text-muted-foreground mt-1">Here is what is happening today.</p>
      </div>

      {currentUser.role === 'Admin' ? (
        <AdminDashboardView />
      ) : (
        <EmployeeDashboardView />
      )}
    </div>
  );
}
