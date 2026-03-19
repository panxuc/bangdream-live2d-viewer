import { defineHandler } from "nitro";

export default defineHandler(() => {
  return new Response("pong");
});
