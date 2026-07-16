import React, { createContext, useContext, useState } from 'react';
import { User, UserRole } from '@workspace/api-client-react';

const MOCK_ADMIN: User = {
  id: 1,
  name: "Sarah Chen",
  role: UserRole.Admin,
  email: "sarah.chen@company.com",
  department: "HR"
};

const MOCK_EMPLOYEE: User = {
  id: 2,
  name: "Marcus Webb",
  role: UserRole.Employee,
  email: "marcus.webb@company.com",
  department: "Engineering"
};

interface UserContextType {
  currentUser: User;
  switchUser: (role: "Admin" | "Employee") => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User>(MOCK_EMPLOYEE);

  const switchUser = (role: "Admin" | "Employee") => {
    setCurrentUser(role === "Admin" ? MOCK_ADMIN : MOCK_EMPLOYEE);
  };

  return (
    <UserContext.Provider value={{ currentUser, switchUser }}>
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
