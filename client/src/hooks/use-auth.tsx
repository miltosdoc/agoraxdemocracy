import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { RegisterUser, LoginUser, User as SelectUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getTranslationFunction } from "@/hooks/use-translation";
const t = getTranslationFunction();

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SelectUser, Error, LoginUser>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, RegisterUser>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | undefined, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginUser) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (data: SelectUser & { returnTo?: string }) => {
      // Extract returnTo from response if it exists
      const { returnTo, ...user } = data;
      
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: t('general.success'),
        description: t("Login successful"),
        variant: "default",
      });
      
      // Redirect to returnTo URL if provided
      if (returnTo) {
        // Use relative path without domain for internal navigation
        const path = returnTo.startsWith('http') ? 
          new URL(returnTo).pathname : 
          returnTo;
          
        console.log('Login successful, redirecting to:', path);
        
        // Force a hard redirect to the path
        window.location.href = path.startsWith('/') ? path : `/${path}`;
      }
    },
    onError: (error: Error) => {
      toast({
        title: t('general.error'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: RegisterUser) => {
      const res = await apiRequest("POST", "/api/register", credentials);
      return await res.json();
    },
    onSuccess: (data: SelectUser & { returnTo?: string }) => {
      // Extract returnTo from response if it exists
      const { returnTo, ...user } = data;
      
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: t('general.success'),
        description: t("Registration successful"),
        variant: "default",
      });
      
      // Redirect to returnTo URL if provided
      if (returnTo) {
        // Use relative path without domain for internal navigation
        const path = returnTo.startsWith('http') ? 
          new URL(returnTo).pathname : 
          returnTo;
          
        console.log('Registration successful, redirecting to:', path);
        
        // Force a hard redirect to the path
        window.location.href = path.startsWith('/') ? path : `/${path}`;
      }
    },
    onError: (error: Error) => {
      toast({
        title: t('general.error'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      window.location.href = "/";
      toast({
        title: t('general.success'),
        description: t('auth.logout'),
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('general.error'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
