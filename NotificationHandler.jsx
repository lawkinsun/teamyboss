import React, { useEffect, useRef } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { Message } from '@/api/entities';

export default function NotificationHandler() {
  const { currentUser } = useAuth();
  const lastMessageCountRef = useRef(0);
  const notificationSoundRef = useRef(null);
  const lastCheckTimeRef = useRef(0);
  const errorCountRef = useRef(0);

  useEffect(() => {
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Create notification sound (using a data URL for a simple beep)
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      notificationSoundRef.current = {
        play: () => {
          try {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            osc.connect(gain);
            gain.connect(audioContext.destination);
            osc.frequency.setValueAtTime(800, audioContext.currentTime);
            gain.gain.setValueAtTime(0.1, audioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            osc.start(audioContext.currentTime);
            osc.stop(audioContext.currentTime + 0.3);
          } catch (e) {
            console.log('Audio play failed:', e);
          }
        }
      };
    } catch (e) {
      console.log('Audio context creation failed:', e);
    }
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    const checkForNewMessages = async () => {
      try {
        // Skip if we've checked recently (prevent duplicate calls)
        const now = Date.now();
        if (now - lastCheckTimeRef.current < 8000) { // Minimum 8 seconds between checks
          return;
        }
        lastCheckTimeRef.current = now;

        const messages = await Message.list('-created_date', 30); // Reduced from 50 to 30
        const myMessages = messages.filter(m => 
          (m.recipient_email === currentUser.email || 
           (m.type === 'group' && m.group_members?.includes(currentUser.email))) &&
          m.sender_email !== currentUser.email
        );

        if (lastMessageCountRef.current === 0) {
          lastMessageCountRef.current = myMessages.length;
          errorCountRef.current = 0; // Reset error count on success
          return;
        }

        if (myMessages.length > lastMessageCountRef.current) {
          const newMessages = myMessages.slice(0, myMessages.length - lastMessageCountRef.current);
          
          // Show desktop notification for each new message
          newMessages.forEach(message => {
            if ('Notification' in window && Notification.permission === 'granted') {
              const notification = new Notification(`💬 ${message.sender_name}`, {
                body: message.content.substring(0, 100) + (message.content.length > 100 ? '...' : ''),
                icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTIiIGZpbGw9IiNmNTllMGIiLz4KPHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeD0iMTYiIHk9IjE2Ij4KPHBhdGggZD0iTTIxIDExLjVhOC4zOCA4LjM4IDAgMCAxLS45IDMuOCA4IDggMCAwIDEtNy42IDUuNyA4LjM4IDguMzggMCAwIDEtMy44LS45TDMgMjFsMS45LTUuN2E4IDggMCAwIDEgLjktMTQuMSA4IDggMCAwIDEgMTQuMSAwIDggOCAwIDAgMSAwIC4zeiIgc3Ryb2tlPSIjMWUyOTNiIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4KPC9zdmc+',
                tag: `message-${message.id}`,
                requireInteraction: false
              });

              notification.onclick = () => {
                window.focus();
                window.location.href = '/Messages';
                notification.close();
              };

              setTimeout(() => notification.close(), 5000);
            }

            // Play notification sound
            if (notificationSoundRef.current) {
              notificationSoundRef.current.play();
            }
          });

          lastMessageCountRef.current = myMessages.length;
        }
        
        errorCountRef.current = 0; // Reset error count on success
      } catch (error) {
        console.error('Error checking for new messages:', error);
        errorCountRef.current++;
        
        // If we hit rate limits, slow down even more
        if (error.message?.includes('429') || error.message?.includes('Rate limit')) {
          errorCountRef.current += 2; // Penalize rate limit errors more
        }
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
        checkForNewMessages().finally(() => {
          scheduleNextCheck(); // Schedule next check after current one completes
        });
      }, interval);
    };

    // Initial check
    checkForNewMessages().finally(() => {
      scheduleNextCheck();
    });

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [currentUser]);

  return null; // This component doesn't render anything
}