import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_RORK_API_BASE_URL) {
    console.log('🌐 Using configured API base URL:', process.env.EXPO_PUBLIC_RORK_API_BASE_URL);
    return process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  }

  // Default to local development server
  if (typeof window !== 'undefined') {
    // Web environment - use current origin
    const baseUrl = window.location.origin;
    console.log('🌐 Using web origin as base URL:', baseUrl);
    return baseUrl;
  } else {
    // Mobile environment - use localhost with tunnel
    const baseUrl = 'http://localhost:8081';
    console.log('🌐 Using mobile localhost as base URL:', baseUrl);
    return baseUrl;
  }
};

// Health check function to test backend connectivity
export const testBackendConnection = async (): Promise<boolean> => {
  try {
    const baseUrl = getBaseUrl();
    const healthUrl = `${baseUrl}/api`;
    console.log('🏥 Testing backend connection to:', healthUrl);
    
    // Create timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Connection timeout')), 5000);
    });
    
    const fetchPromise = fetch(healthUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    
    const response = await Promise.race([fetchPromise, timeoutPromise]);
    
    console.log('🏥 Health check response:', response.status, response.statusText);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Backend health check passed:', data);
      return true;
    } else {
      console.error('❌ Backend health check failed:', {
        status: response.status,
        statusText: response.statusText,
        url: healthUrl
      });
      return false;
    }
  } catch (error) {
    console.error('❌ Backend connection test failed:', error instanceof Error ? error.message : String(error));
    return false;
  }
};

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
      fetch: async (url, options) => {
        try {
          console.log('🔗 tRPC request to:', url);
          
          // Create timeout promise
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Request timeout')), 8000); // Reduced timeout
          });
          
          const fetchPromise = fetch(url, {
            ...options,
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Cache-Control': 'no-cache',
              ...options?.headers,
            },
          });
          
          const response = await Promise.race([fetchPromise, timeoutPromise]);
          
          console.log('📡 tRPC response:', response.status, response.statusText);
          
          if (!response.ok) {
            let errorText = 'Unknown error';
            try {
              errorText = await response.text();
            } catch {
              // Ignore text parsing errors
            }
            
            console.error('❌ tRPC HTTP error:', {
              status: response.status,
              statusText: response.statusText,
              url: url,
              body: errorText.substring(0, 200) // Limit error text length
            });
            
            // Provide specific error messages based on status
            if (response.status === 404) {
              throw new Error('tRPC endpoint not found - check backend routing');
            } else if (response.status === 500) {
              throw new Error('Backend server error - check server logs');
            } else if (response.status >= 400 && response.status < 500) {
              throw new Error(`Client error ${response.status}: ${response.statusText}`);
            } else {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
          }
          
          return response;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error('❌ tRPC fetch error:', errorMessage);
          
          // Provide more helpful error messages
          if (error instanceof TypeError && errorMessage.includes('fetch')) {
            throw new Error('Network error: Cannot connect to backend server');
          } else if (errorMessage.includes('timeout')) {
            throw new Error('Request timeout: Backend server not responding');
          } else if (errorMessage.includes('ECONNREFUSED')) {
            throw new Error('Connection refused: Backend server not running');
          }
          
          throw error;
        }
      },
    }),
  ],
});