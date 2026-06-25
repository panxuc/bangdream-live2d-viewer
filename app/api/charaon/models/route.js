import { NextResponse } from "next/server";
import { getOnLive2DModelIndex } from "@/src/server/live2d-on/model-index-cache";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const characterId = searchParams.get("characterId");

  if (!characterId) {
    return NextResponse.json({ error: "Character ID is required" }, { status: 400 });
  }

  try {
    const { models, fetchedAt } = await getOnLive2DModelIndex(characterId);

    return NextResponse.json(
      {
        characterId,
        models,
      },
      {
        headers: {
          "Cache-Control": "public, max-age=60, s-maxage=300",
          ETag: `"on-models-${characterId}-${fetchedAt}"`,
        },
      },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch ON models" },
      { status: error.status || 500 },
    );
  }
}
