import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter, Redirect } from 'wouter';
import { UserProvider } from '@/contexts/UserContext';
import { AppShell } from '@/components/layout/AppShell';

import DashboardPage from '@/pages/dashboard/index';
import AnnouncementsPage from '@/pages/announcements/index';
import RequestsPage from '@/pages/requests/index';
import ClockPage from '@/pages/clock/index';
import SettingsPage from '@/pages/settings/index';

const queryClient = new QueryClient();

function Router() {
  return (
    <AppShell>
      <Switch>
        <Route path="/" component={() => <Redirect to="/dashboard" />} />
        <Route path="/dashboard" component={DashboardPage} />
        <Route path="/announcements" component={AnnouncementsPage} />
        <Route path="/requests" component={RequestsPage} />
        <Route path="/clock" component={ClockPage} />
        <Route path="/settings" component={SettingsPage} />
        <Route component={NotFound} />
      </Switch>
    </AppShell>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </UserProvider>
    </QueryClientProvider>
  );
}

export default App;
