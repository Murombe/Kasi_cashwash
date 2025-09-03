import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        return null; // Return null instead of throwing error
      }

      const response = await fetch("/api/auth/user", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        // If unauthorized, remove invalid token
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("token");
        }
        return null; // Return null instead of throwing error
      }

      return response.json();
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const logout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout,
  };
}
