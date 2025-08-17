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
    console.error('❌ Backend connection test failed:', error instanceof Error ? error.message : 'Unknown error');
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
          console.log('📤 Request options:', {
            method: options?.method || 'GET',
            headers: options?.headers,
            body: options?.body ? 'Present' : 'None'
          });
          
          // Create timeout promise
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Request timeout')), 10000); // Increased timeout
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
          
          console.log('📡 tRPC response:', {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
            url: response.url
          });
          
          if (!response.ok) {
            let errorText = 'Unknown error';
            let errorData = null;
            
            try {
              const contentType = response.headers.get('content-type');
              if (contentType?.includes('application/json')) {
                errorData = await response.json();
                errorText = JSON.stringify(errorData, null, 2);
              } else {
                errorText = await response.text();
              }
            } catch (parseError) {
              console.warn('Failed to parse error response:', parseError);
            }
            
            console.error('❌ tRPC HTTP error:', {
              status: response.status,
              statusText: response.statusText,
              url: url,
              errorText: errorText.substring(0, 200)
            });
            
            // Provide specific error messages based on status
            if (response.status === 404) {
              throw new Error(`tRPC endpoint not found: ${url}\nCheck if backend server is running and routes are properly configured`);
            } else if (response.status === 500) {
              throw new Error(`Backend server error (500)\nError details: ${errorText.substring(0, 200)}`);
            } else if (response.status === 405) {
              throw new Error(`Method not allowed (405): ${options?.method || 'GET'} ${url}`);
            } else if (response.status >= 400 && response.status < 500) {
              throw new Error(`Client error ${response.status}: ${response.statusText}\nDetails: ${errorText.substring(0, 200)}`);
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
            throw new Error(`Network error: Cannot connect to backend server at ${getBaseUrl()}\nMake sure the backend is running and accessible`);
          } else if (errorMessage.includes('timeout')) {
            throw new Error(`Request timeout: Backend server not responding within 10 seconds\nURL: ${url}`);
          } else if (errorMessage.includes('ECONNREFUSED')) {
            throw new Error(`Connection refused: Backend server not running at ${getBaseUrl()}`);
          }
          
          throw error;
        }
      },
    }),
  ],
});