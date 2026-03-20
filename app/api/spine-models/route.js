import { NextResponse } from "next/server";
import { getSpineModelIndex } from "@/src/server/spine/model-index-cache";
import { extractSpineModelIds, filterSpineModelIdsByCharacter } from "@/src/server/spine/remote";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const characterId = searchParams.get("characterId");

  try {
    const { data, fetchedAt } = await getSpineModelIndex();
    const modelIds = filterSpineModelIdsByCharacter(extractSpineModelIds(data), characterId);

    return NextResponse.json(
      {
        characterId,
        models: modelIds,
      },
      {
        headers: {
          "Cache-Control": "public, max-age=3600, s-maxage=86400",
          ETag: `"spine-${characterId || "all"}-${fetchedAt}"`,
        },
      },
    );
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch Spine model list" }, { status: 500 });
  }
}
