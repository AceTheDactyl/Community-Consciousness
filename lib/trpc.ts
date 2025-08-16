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
            setTimeout(() => reject(new Error('Request timeout')), 10000);
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
            const errorText = await response.text().catch(() => 'Unknown error');
            console.error('❌ tRPC HTTP error:', {
              status: response.status,
              statusText: response.statusText,
              body: errorText
            });
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          return response;
        } catch (error) {
          console.error('❌ tRPC fetch error:', error instanceof Error ? error.message : String(error));
          
          // Provide more helpful error messages
          if (error instanceof TypeError && error.message.includes('fetch')) {
            throw new Error('Network error: Cannot connect to backend server');
          }
          
          throw error;
        }
      },
    }),
  ],
});