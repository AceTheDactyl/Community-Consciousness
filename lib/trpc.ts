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
      enabled: (opts) =>
        process.env.NODE_ENV === 'development' ||
        (opts.direction === 'down' && opts.result instanceof Error),
    }),
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
      fetch: async (url, options) => {
        console.log('🔗 tRPC request to:', url);
        console.log('🔗 Request options:', {
          method: options?.method,
          headers: options?.headers,
          body: options?.body ? 'present' : 'none'
        });
        
        try {
          const response = await fetch(url, {
            ...options,
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              ...options?.headers,
            },
          });
          
          console.log('📡 Response status:', response.status, response.statusText);
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ tRPC response error:', {
              status: response.status,
              statusText: response.statusText,
              errorText,
              url: url.toString()
            });
            throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
          }
          
          console.log('✅ tRPC response success');
          return response;
        } catch (error) {
          console.error('❌ tRPC fetch error:', {
            error: error instanceof Error ? error.message : error,
            url: url.toString(),
            stack: error instanceof Error ? error.stack : undefined
          });
          
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