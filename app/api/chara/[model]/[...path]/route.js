import { handleLive2DAssetRequest } from "@/src/server/live2d/route-handler";

export async function GET(_request, context) {
  return handleLive2DAssetRequest(context, false);
}
