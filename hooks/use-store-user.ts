import { useEffect, useState } from "react";
import { useConvexAuth, useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

/**
 * Ensures the current Clerk user has a corresponding Convex `users` document.
 * Returns hydrated auth state that only reports authenticated once the user
 * has been stored.
 */
export function useStoreUserEffect() {
  const { isAuthenticated, isLoading: isConvexLoading } = useConvexAuth();
  const { user, isLoaded: isClerkLoaded } = useUser();
  const storeUser = useMutation(api.users.store);

  const [userId, setUserId] = useState<Id<"users"> | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !isClerkLoaded) {
      setUserId(null);
      return;
    }

    let cancelled = false;

    async function run() {
      const id = await storeUser();
      if (!cancelled) {
        setUserId(id);
      }
    }

    run().catch((error) => {
      console.error("Failed to store user", error);
      if (!cancelled) {
        setUserId(null);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isClerkLoaded, storeUser, user?.id]);

  return {
    isLoading: isConvexLoading || (!isClerkLoaded && isAuthenticated) || (isAuthenticated && userId === null),
    isAuthenticated: isAuthenticated && userId !== null,
    userId,
  };
}

