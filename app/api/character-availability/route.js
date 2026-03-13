import { NextResponse } from "next/server";
import { collectAvailableCharacterIds } from "@/src/features/viewer/lib/characterAvailability";
import { filterOutGeneralLive2DModelKeys } from "@/src/features/viewer/lib/live2dRemoteUtils";
import { getModelIndex } from "@/src/server/live2d/model-index-cache";
import { getSpineModelIndex } from "@/src/server/spine/model-index-cache";
import { extractSpineModelIds } from "@/src/server/spine/remote";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const modelType = searchParams.get("modelType");
  const isModified = searchParams.get("isModified") === "true";
  const rulesVersion = searchParams.get("rulesVersion") || "default";

  if (modelType !== "live2d" && modelType !== "spine") {
    return NextResponse.json({ error: "Unsupported modelType" }, { status: 400 });
  }

  try {
    if (modelType === "live2d") {
      const { data, fetchedAt, branch } = await getModelIndex(isModified);
      const availableCharacterIds = Array.from(
        collectAvailableCharacterIds(filterOutGeneralLive2DModelKeys(Object.keys(data))),
      ).sort((a, b) => a - b);

      return NextResponse.json(
        {
          modelType,
          isModified,
          availableCharacterIds,
        },
        {
          headers: {
            "Cache-Control": "public, max-age=3600, s-maxage=86400",
            ETag: `"character-availability-${modelType}-${branch}-${rulesVersion}-${fetchedAt}"`,
          },
        },
      );
    }

    const { data, fetchedAt } = await getSpineModelIndex();
    const availableCharacterIds = Array.from(collectAvailableCharacterIds(extractSpineModelIds(data))).sort((a, b) => a - b);

    return NextResponse.json(
      {
        modelType,
        availableCharacterIds,
      },
      {
        headers: {
          "Cache-Control": "public, max-age=3600, s-maxage=86400",
          ETag: `"character-availability-${modelType}-${rulesVersion}-${fetchedAt}"`,
        },
      },
    );
  } catch {
    return NextResponse.json({ error: "Failed to fetch character availability" }, { status: 500 });
  }
}
