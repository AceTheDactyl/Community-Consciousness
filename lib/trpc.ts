import { createTRPCReact } from "@trpc/react-query";
import { httpLink, loggerLink } from "@trpc/client";
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
    console.log('🏥 Testing backend connection to:', `${baseUrl}/api`);
    
    const response = await fetch(`${baseUrl}/api`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Backend health check passed:', data);
      return true;
    } else {
      console.error('❌ Backend health check failed:', response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.error('❌ Backend connection test failed:', error);
    return false;
  }
};

export const trpcClient = trpc.createClient({
  links: [
    loggerLink({
      enabled: (opts) =>
        process.env.NODE_ENV === 'development' ||
        (opts.direction === 'down' && opts.result instanceof Error),
    }),
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
      fetch: async (url, options) => {
        console.log('🔗 tRPC request:', url);
        
        // Test backend connection first if this is the first request
        const urlString = typeof url === 'string' ? url : url.toString();
        if (!urlString.includes('health-checked')) {
          const isHealthy = await testBackendConnection();
          if (!isHealthy) {
            throw new Error('Backend server is not responding. Please check if the server is running.');
          }
        }
        
        try {
          const response = await fetch(url, {
            ...options,
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              ...options?.headers,
            },
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ tRPC response error:', response.status, response.statusText, errorText);
            throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
          }
          
          console.log('✅ tRPC response success:', response.status);
          return response;
        } catch (error) {
          console.error('❌ tRPC fetch error:', error);
          
          // Provide more helpful error messages
          if (error instanceof TypeError && error.message.includes('fetch')) {
            throw new Error('Network error: Cannot connect to backend server. Please check your internet connection and ensure the server is running.');
          }
          
          throw error;
        }
      },
    }),
  ],
});