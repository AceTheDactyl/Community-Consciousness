import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  // Debug environment variables
  console.log('🔍 Environment check:', {
    EXPO_PUBLIC_RORK_API_BASE_URL: process.env.EXPO_PUBLIC_RORK_API_BASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    isWeb: typeof window !== 'undefined',
    windowOrigin: typeof window !== 'undefined' ? window.location.origin : 'N/A'
  });

  // Always ignore external URLs in development - force local development
  if (process.env.EXPO_PUBLIC_RORK_API_BASE_URL) {
    const envUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
    // Skip ALL external URLs in development
    if (envUrl.includes('rorktest.dev') || envUrl.includes('dev-') || envUrl.includes('https://') || envUrl.includes('http://') && !envUrl.includes('localhost')) {
      console.log('🙅 Ignoring external environment URL in development:', envUrl);
      console.log('🔧 Forcing local development mode');
    } else if (envUrl.includes('localhost') || envUrl.includes('127.0.0.1')) {
      console.log('🌐 Using local API base URL:', envUrl);
      return envUrl;
    }
  }

  // For web environment, use current origin
  if (typeof window !== 'undefined') {
    const baseUrl = window.location.origin;
    console.log('🌐 Using web origin as base URL:', baseUrl);
    return baseUrl;
  } else {
    // Mobile environment - use localhost
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
    const errorDetails = {
      message: error instanceof Error ? error.message : 'Unknown error',
      name: error instanceof Error ? error.name : 'Unknown',
      stack: error instanceof Error ? error.stack?.substring(0, 300) : 'No stack trace'
    };
    console.error('❌ Backend connection test failed:', JSON.stringify(errorDetails, null, 2));
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
            headers: options?.headers ? JSON.stringify(options.headers, null, 2) : 'None',
            body: options?.body ? 'Present' : 'None'
          });
          
          // Create timeout promise with longer timeout for development
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Request timeout')), 15000); // 15 second timeout
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
            headers: JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2),
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
            
            console.error('❌ tRPC HTTP error:', JSON.stringify({
              status: response.status,
              statusText: response.statusText,
              url: url,
              errorText: errorText.substring(0, 200)
            }, null, 2));
            
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
          const errorDetails = {
            message: errorMessage,
            name: error instanceof Error ? error.name : 'Unknown',
            stack: error instanceof Error ? error.stack?.substring(0, 500) : 'No stack trace',
            url: url
          };
          console.error('❌ tRPC fetch error:', JSON.stringify(errorDetails, null, 2));
          
          // Provide more helpful error messages
          if (error instanceof TypeError && errorMessage.includes('fetch')) {
            throw new Error(`Network error: Cannot connect to backend server at ${getBaseUrl()}\nMake sure the backend is running and accessible`);
          } else if (errorMessage.includes('timeout')) {
            throw new Error(`Request timeout: Backend server not responding within 15 seconds\nURL: ${url}`);
          } else if (errorMessage.includes('ECONNREFUSED')) {
            throw new Error(`Connection refused: Backend server not running at ${getBaseUrl()}`);
          }
          
          throw error;
        }
      },
    }),
  ],
});