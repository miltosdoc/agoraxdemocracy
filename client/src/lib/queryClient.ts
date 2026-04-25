import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { ApiError } from "./api";
export { ApiError };

// Custom error type for API errors

// Function to parse and format the error response
async function parseErrorResponse(res: Response): Promise<ApiError> {
  let errorMessage = res.statusText;
  let errorDetails = undefined;
  
  try {
    // Try to parse the response as JSON
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const errorData = await res.json();
      
      // Extract the error message
      if (errorData.message) {
        errorMessage = errorData.message;
      }
      
      // Extract validation errors if present
      if (errorData.errors) {
        errorDetails = errorData.errors;
      }
    } else {
      // If not JSON, just use the text
      errorMessage = await res.text();
    }
  } catch (e) {
    // If we can't parse the response, use a generic error message
    console.error("Error parsing error response:", e);
    errorMessage = "An error occurred. Please try again later.";
  }
  
  return new ApiError(res.status, errorMessage, errorDetails);
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    throw await parseErrorResponse(res);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    let url = queryKey[0] as string;
    
    // If there's a second element in queryKey (filters/params), convert to query string
    if (queryKey[1] && typeof queryKey[1] === 'object') {
      const params = new URLSearchParams();
      Object.entries(queryKey[1] as Record<string, any>).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
      const queryString = params.toString();
      if (queryString) {
        url += '?' + queryString;
      }
    }
    
    const res = await fetch(url, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
