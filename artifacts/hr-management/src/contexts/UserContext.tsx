import React, { createContext, useContext } from 'react';
import { useAuth, useUser as useClerkUser } from '@clerk/react';
import { useGetMe, User } from '@workspace/api-client-react';

interface UserContextType {
  currentUser: User | null;
  isLoading: boolean;
  isSignedIn: boolean;
  isAdmin: boolean;
  switchUser: (role: "Admin" | "Employee") => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();
  const { user: clerkUser } = useClerkUser();
  const { data: me, isLoading } = useGetMe({
    query: {
      queryKey: ['me'],
      enabled: isLoaded && isSignedIn === true,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  });

  const switchUser = () => {
    // No-op in real auth. Role is managed server-side.
  };

  const value: UserContextType = {
    currentUser: me ?? null,
    isLoading: isLoaded && isSignedIn ? isLoading : false,
    isSignedIn: isLoaded ? isSignedIn === true : false,
    isAdmin: me?.role === 'Admin',
    switchUser,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

export function useCurrentUser(): User {
  const { currentUser, isLoading } = useUser();
  if (isLoading) {
    throw new Error('useCurrentUser called while user is still loading');
  }
  if (!currentUser) {
    throw new Error('useCurrentUser called without an authenticated user');
  }
  return currentUser;
}
