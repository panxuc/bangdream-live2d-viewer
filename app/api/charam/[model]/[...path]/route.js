import { NextResponse } from "next/server";
import { createLive2DAssetResponse } from "@/src/server/live2d/proxy-route";

export async function GET(_request, context) {
  const { model, path } = await context.params;

  if (!model) {
    return NextResponse.json({ error: "Model parameter is required" }, { status: 400 });
  }

  try {
    const result = await createLive2DAssetResponse({ model, path, isModified: true });

    if (!result.ok) {
      return NextResponse.json(result.body, { status: result.status });
    }

    if (result.isJson) {
      return NextResponse.json(result.body, { headers: result.headers });
    }

    return new NextResponse(result.body, { headers: result.headers });
  } catch (error) {
    return NextResponse.json({ error: `Failed to fetch data: ${error.message}` }, { status: 500 });
  }
}
