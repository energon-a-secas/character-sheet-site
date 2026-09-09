import type { AuthConfig } from "convex/server";

/** Clerk Frontend API URL (same for all Neorgon tools). Update if you change Clerk apps. */
const CLERK_JWT_ISSUER = "https://clerk.neorgon.com";

export default {
  providers: [
    {
      domain: CLERK_JWT_ISSUER,
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;
