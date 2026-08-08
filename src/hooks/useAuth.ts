"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api, {
  clearAdminAuthTokens,
  hasAdminAuthSession,
  setAdminAuthTokens,
} from "@/lib/api";
import { ADMIN_ROLES } from "@/lib/constants";
import { AUTH_ENDPOINTS } from "@/lib/endpoints";

export type User = {
  user_id: string;
  tenant_id: string;
  email: string;
  first_name: string;
  last_name: string;
  roles: string[];
  modules: string[];
};

function hasAdminRole(roles: string[] | undefined | null): boolean {
  if (!roles || roles.length === 0) return false;
  const allowed = ADMIN_ROLES as readonly string[];
  return roles.some((r) => allowed.includes(r));
}

type UseAuthOptions = {
  autoFetch?: boolean;
};

export function useAuth({ autoFetch = true }: UseAuthOptions = {}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(autoFetch);
  const router = useRouter();

  const fetchUser = useCallback(async () => {
    if (!hasAdminAuthSession()) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get(AUTH_ENDPOINTS.ME);
      const userData = data.data;
      if (!hasAdminRole(userData.roles)) {
        clearAdminAuthTokens();
        setUser(null);
        setLoading(false);
        router.push("/login");
        return;
      }
      setUser(userData);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!autoFetch) return;
    fetchUser();
  }, [autoFetch, fetchUser]);

  const login = useCallback(
    async (email: string, password: string) => {
      const { data } = await api.post(AUTH_ENDPOINTS.LOGIN, { email, password });
      const tokens = data.data;
      setAdminAuthTokens(tokens);

      // Fetch user info and validate role
      const meResponse = await api.get(AUTH_ENDPOINTS.ME);
      const userData = meResponse.data.data;

      if (!hasAdminRole(userData.roles)) {
        clearAdminAuthTokens();
        throw new Error("ACCESS_DENIED");
      }

      setUser(userData);
      router.push("/");
    },
    [router]
  );

  const logout = useCallback(() => {
    clearAdminAuthTokens();
    setUser(null);
    router.push("/login");
  }, [router]);

  return { user, loading, login, logout };
}
