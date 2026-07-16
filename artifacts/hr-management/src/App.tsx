import { useEffect, useRef } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, Router as WouterRouter, useLocation, Redirect } from 'wouter';
import { ClerkProvider, SignIn, SignUp, Show, useClerk, useAuth } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { useQueryClient } from '@tanstack/react-query';

import { UserProvider, useUser } from '@/contexts/UserContext';
import { AppShell } from '@/components/layout/AppShell';

import DashboardPage from '@/pages/dashboard/index';
import AnnouncementsPage from '@/pages/announcements/index';
import RequestsPage from '@/pages/requests/index';
import ClockPage from '@/pages/clock/index';
import SettingsPage from '@/pages/settings/index';
import SignInPage from '@/pages/sign-in/index';
import SignUpPage from '@/pages/sign-up/index';

const queryClient = new QueryClient();

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl =
  import.meta.env.VITE_CLERK_PROXY_URL ||
  `${window.location.origin}${basePath}/api/__clerk`;


if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY');
}

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || '/'
    : path;
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: 'clerk',
  options: {
    logoPlacement: 'inside' as const,
    logoLinkUrl: basePath || '/',
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: 'hsl(20 80% 45%)',
    colorForeground: 'hsl(20 15% 15%)',
    colorMutedForeground: 'hsl(20 10% 45%)',
    colorDanger: 'hsl(0 84% 60%)',
    colorBackground: 'hsl(36 20% 97%)',
    colorInput: 'hsl(36 15% 88%)',
    colorInputForeground: 'hsl(20 15% 15%)',
    colorNeutral: 'hsl(36 10% 90%)',
    fontFamily: 'Inter, sans-serif',
    borderRadius: '0.5rem',
  },
  elements: {
    rootBox: 'w-full flex justify-center',
    cardBox: 'bg-white dark:bg-[hsl(20_10%_15%)] rounded-2xl w-[440px] max-w-full overflow-hidden border border-border shadow-lg',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none',
    footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: 'text-2xl font-semibold text-foreground',
    headerSubtitle: 'text-muted-foreground',
    socialButtonsBlockButtonText: 'text-foreground',
    formFieldLabel: 'text-foreground font-medium',
    footerActionLink: 'text-primary hover:text-primary/90 font-medium',
    footerActionText: 'text-muted-foreground',
    dividerText: 'text-muted-foreground',
    identityPreviewEditButton: 'text-primary',
    formFieldSuccessText: 'text-green-600',
    alertText: 'text-foreground',
    logoBox: 'mb-4',
    logoImage: 'h-10 w-10',
    socialButtonsBlockButton: 'border-border hover:bg-muted',
    formButtonPrimary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    formFieldInput: 'bg-input text-input-foreground border-border focus:ring-ring',
    footerAction: 'text-sm',
    dividerLine: 'bg-border',
    alert: 'bg-destructive/10 text-destructive border-destructive/20',
    otpCodeFieldInput: 'bg-input text-foreground border-border',
    formFieldRow: 'gap-4',
    main: 'w-full',
  },
};

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const clientQueryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        clientQueryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, clientQueryClient]);

  return null;
}

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isSignedIn) {
    return <Redirect to="/sign-in" />;
  }

  return <AppShell>{children}</AppShell>;
}

function HomeRedirect() {
  const { isSignedIn, isLoaded } = useAuth();
  if (!isLoaded) return null;
  if (isSignedIn) return <Redirect to="/dashboard" />;
  return <Redirect to="/sign-in" />;
}

function Router() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: 'Welcome back to PeopleHub',
            subtitle: 'Sign in to continue',
          },
        },
        signUp: {
          start: {
            title: 'Create your PeopleHub account',
            subtitle: 'Join your team today',
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <UserProvider>
          <TooltipProvider>
            <ClerkQueryClientCacheInvalidator />
            <Switch>
              <Route path="/" component={HomeRedirect} />
              <Route path="/sign-in/*?" component={SignInPage} />
              <Route path="/sign-up/*?" component={SignUpPage} />
              <Route path="/dashboard">
                <AuthenticatedLayout>
                  <DashboardPage />
                </AuthenticatedLayout>
              </Route>
              <Route path="/announcements">
                <AuthenticatedLayout>
                  <AnnouncementsPage />
                </AuthenticatedLayout>
              </Route>
              <Route path="/requests">
                <AuthenticatedLayout>
                  <RequestsPage />
                </AuthenticatedLayout>
              </Route>
              <Route path="/clock">
                <AuthenticatedLayout>
                  <ClockPage />
                </AuthenticatedLayout>
              </Route>
              <Route path="/settings">
                <AuthenticatedLayout>
                  <SettingsPage />
                </AuthenticatedLayout>
              </Route>
              <Route>
                <AuthenticatedLayout>
                  <div className="p-8 text-center">
                    <h1 className="text-2xl font-bold mb-2">Page not found</h1>
                    <p className="text-muted-foreground">This page does not exist.</p>
                  </div>
                </AuthenticatedLayout>
              </Route>
            </Switch>
            <Toaster />
          </TooltipProvider>
        </UserProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <Router />
    </WouterRouter>
  );
}

export default App;
