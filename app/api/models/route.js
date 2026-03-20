import { NextResponse } from "next/server";
import { filterLive2DModelEntriesByCharacter } from "@/src/features/viewer/lib/live2dRemoteUtils";
import { getModelIndex } from "@/src/server/live2d/model-index-cache";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const characterId = searchParams.get("characterId");
  const isModified = searchParams.get("isModified") === "true";

  if (!characterId) {
    return NextResponse.json({ error: "Character ID is required" }, { status: 400 });
  }

  try {
    const { data, fetchedAt, branch } = await getModelIndex(isModified);

    const characterModels = filterLive2DModelEntriesByCharacter(data, characterId);

    return NextResponse.json(
      {
        characterId,
        models: characterModels,
      },
      {
        headers: {
          "Cache-Control": "public, max-age=3600, s-maxage=86400",
          ETag: `"${characterId}-${branch}-${fetchedAt}"`,
        },
      },
    );
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch character data" }, { status: 500 });
  }
}
