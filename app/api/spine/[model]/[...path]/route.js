import { handleSpineAssetRequest } from "@/src/server/spine/route-handler";

export async function GET(request, context) {
  return handleSpineAssetRequest(context);
}
