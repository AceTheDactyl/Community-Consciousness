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
    const healthUrl = `${baseUrl}/api`;
    console.log('🏥 Testing backend connection to:', healthUrl);
    
    const response = await fetch(healthUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      // Add timeout to prevent hanging (if supported)
      ...(typeof AbortSignal !== 'undefined' && AbortSignal.timeout ? 
        { signal: AbortSignal.timeout(10000) } : {})
    });
    
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
    console.error('❌ Backend connection test failed:', {
      error: error instanceof Error ? error.message : error,
      baseUrl: getBaseUrl()
    });
    return false;
  }
};

export const trpcClient = trpc.createClient({
  links: [
    loggerLink({
      enabled: (opts) => {
        // Only enable logging in development and for errors
        const isDev = process.env.NODE_ENV === 'development';
        return isDev;
      },
      // Simplified logger to prevent [object Object] issues
      logger: ({ direction, type, path, input }) => {
        if (direction === 'up') {
          console.log(`>> tRPC ${type} ${path}`);
          if (input && typeof input === 'object') {
            try {
              console.log('Input:', JSON.stringify(input, null, 2));
            } catch {
              console.log('Input: [complex object]');
            }
          }
        } else {
          console.log(`<< tRPC ${type} ${path}`);
        }
      }
    }),
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
      fetch: async (url, options) => {
        console.log('🔗 tRPC request to:', url.toString());
        
        try {
          const response = await fetch(url, {
            ...options,
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              ...options?.headers,
            },
            // Add timeout for web compatibility
            ...(typeof AbortSignal !== 'undefined' && AbortSignal.timeout ? 
              { signal: AbortSignal.timeout(30000) } : {})
          });
          
          console.log('📡 Response:', response.status, response.statusText);
          
          if (!response.ok) {
            let errorText = 'Unknown error';
            try {
              errorText = await response.text();
            } catch {
              console.warn('Could not read error response body');
            }
            
            const errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            console.error('❌ tRPC HTTP error:', {
              status: response.status,
              statusText: response.statusText,
              errorText: errorText.substring(0, 500), // Limit error text length
              url: url.toString()
            });
            
            throw new Error(errorMessage);
          }
          
          return response;
        } catch (error) {
          const errorInfo = {
            message: error instanceof Error ? error.message : String(error),
            url: url.toString(),
            type: error instanceof TypeError ? 'TypeError' : 'Error'
          };
          
          console.error('❌ tRPC fetch failed:', errorInfo);
          
          // Provide more helpful error messages
          if (error instanceof TypeError && error.message.includes('fetch')) {
            throw new Error('Network error: Cannot connect to backend server');
          }
          
          if (error instanceof Error && error.name === 'AbortError') {
            throw new Error('Request timeout: Backend server is not responding');
          }
          
          throw error;
        }
      },
    }),
  ],
});