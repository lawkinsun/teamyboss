import React, { useState, useEffect, useRef } from 'react';
import { Message } from '@/api/entities';
import { useAuth } from '../auth/AuthProvider';
import { Badge } from '@/components/ui/badge';

export default function MessageBadge() {
  const { currentUser } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const lastCheckTimeRef = useRef(0);
  const errorCountRef = useRef(0);

  useEffect(() => {
    if (!currentUser) return;

    const checkUnreadMessages = async () => {
      try {
        // Skip if we've checked recently (prevent duplicate calls)
        const now = Date.now();
        if (now - lastCheckTimeRef.current < 8000) { // Minimum 8 seconds between checks
          return;
        }
        lastCheckTimeRef.current = now;

        const messages = await Message.list('-created_date', 50); // Reduced API calls
        const unreadMessages = messages.filter(m => 
          (m.recipient_email === currentUser.email || 
           (m.type === 'group' && m.group_members?.includes(currentUser.email))) &&
          m.sender_email !== currentUser.email &&
          !m.is_read
        );
        setUnreadCount(unreadMessages.length);
        errorCountRef.current = 0; // Reset error count on success
      } catch (error) {
        console.error('Error checking unread messages:', error);
        errorCountRef.current++;
      }
    };

    // Dynamic interval based on error count (exponential backoff)
    const getInterval = () => {
      const baseInterval = 10000; // Start with 10 seconds
      const maxInterval = 60000; // Max 1 minute
      const errorMultiplier = Math.min(errorCountRef.current, 5); // Cap at 5x
      return Math.min(baseInterval * Math.pow(1.5, errorMultiplier), maxInterval);
    };

    let timeoutId;
    
    const scheduleNextCheck = () => {
      const interval = getInterval();
      timeoutId = setTimeout(() => {
        checkUnreadMessages().finally(() => {
          scheduleNextCheck(); // Schedule next check after current one completes
        });
      }, interval);
    };

    // Initial check
    checkUnreadMessages().finally(() => {
      scheduleNextCheck();
    });

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [currentUser]);

  if (unreadCount === 0) return null;

  return (
    <Badge className="bg-red-500 text-white ml-2 animate-pulse">
      {unreadCount > 99 ? '99+' : unreadCount}
    </Badge>
  );
}