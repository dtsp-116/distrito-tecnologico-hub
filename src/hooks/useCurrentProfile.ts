"use client";

import { useEffect, useState } from "react";

interface CurrentProfile {
  role: "admin" | "editor" | "user" | null;
  isLoading: boolean;
}

export function useCurrentProfile(): CurrentProfile {
  const [role, setRole] = useState<"admin" | "editor" | "user" | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await fetch("/api/auth/profile");
        if (!response.ok) {
          setRole(null);
          return;
        }
        const data = (await response.json()) as { role?: "admin" | "editor" | "user" };
        setRole(data.role ?? null);
      } finally {
        setIsLoading(false);
      }
    };

    void loadProfile();
  }, []);

  return { role, isLoading };
}
