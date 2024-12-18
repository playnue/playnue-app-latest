import { NhostClient } from "@nhost/nextjs";

export const nhost = new NhostClient({
  subdomain: NEXT_PUBLIC_NHOST_SUBDOMAIN,
  region: NEXT_PUBLIC_NHOST_REGION,
})
