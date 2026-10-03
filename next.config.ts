import type { NextConfig } from "next";
import { withBotId } from "botid/next/config";

const nextConfig: NextConfig = {
  /* config options here */
};

// BotID adds the proxy rewrites its browser check needs.
export default withBotId(nextConfig);
