import { NextResponse } from "next/server";
import { createOnLive2DAssetResponse } from "./proxy-route";

export async function handleOnLive2DAssetRequest(context) {
  const { model, path } = await context.params;

  if (!model) {
    return NextResponse.json({ error: "Model parameter is required" }, { status: 400 });
  }

  try {
    const result = await createOnLive2DAssetResponse({ model, path });

    if (!result.ok) {
      return NextResponse.json(result.body, { status: result.status });
    }

    if (result.isJson) {
      return NextResponse.json(result.body, { headers: result.headers });
    }

    return new NextResponse(result.body, { headers: result.headers });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to fetch ON data: ${error.message}` },
      { status: error.status || 500 },
    );
  }
}
