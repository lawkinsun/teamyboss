import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Create a client with authentication required
export const base44 = createClient({
  appId: "6870bc89ffef1b0fe6c54bd4", 
  requiresAuth: true // Ensure authentication is required for all operations
});
