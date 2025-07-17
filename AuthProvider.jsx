import React, { createContext, useState, useEffect, useContext } from 'react';
import { User } from '@/api/entities';
import { format } from 'date-fns';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authStatus, setAuthStatus] = useState('loading'); // loading, loggedIn, loggedOut, pendingApproval

  const checkUserStatus = async () => {
    try {
      let user = await User.me();
      
      // Centralized list of admin emails
      const adminEmails = ['lawkinsun@gmail.com', 'timlaw@sevengoodlook.com', 'angela@sevengoodlook.com', 'timltc01@yahoo.com.hk'];

      if (user) {
        const userIsAdmin = adminEmails.includes(user.email.toLowerCase());

        // If the user is an admin but their role isn't set, update it.
        if (userIsAdmin && user.role !== 'admin') {
            await User.updateMyUserData({
              approved: true,
              role: 'admin',
              approval_date: user.approval_date || format(new Date(), 'yyyy-MM-dd')
            });
            user = await User.me(); // Refetch user to get the updated role
        }
        
        if (user.approved) {
          setCurrentUser(user);
          // Set admin status based on the final user role from the database
          setIsAdmin(user.role === 'admin');
          setAuthStatus('loggedIn');
        } else {
          setCurrentUser(user);
          setAuthStatus('pendingApproval');
        }
      } else {
        setAuthStatus('loggedOut');
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      setAuthStatus('loggedOut');
    }
  };

  useEffect(() => {
    checkUserStatus();
  }, []);

  const value = { currentUser, isAdmin, authStatus, refetchUser: checkUserStatus };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};