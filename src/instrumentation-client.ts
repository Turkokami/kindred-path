// Vercel BotID: attaches an invisible browser check to these requests; src/lib/guard.ts verifies it.
import { initBotId } from "botid/client/core";

initBotId({
  protect: [
    { path: "/api/chat", method: "POST" },
    { path: "/api/tts", method: "POST" },
    { path: "/api/summary", method: "POST" },
    { path: "/api/summary/email", method: "POST" },
    { path: "/api/places", method: "GET" },
  ],
});
