import { handleOnLive2DAssetRequest } from "@/src/server/live2d-on/route-handler";

export async function GET(_request, context) {
  return handleOnLive2DAssetRequest(context);
}
