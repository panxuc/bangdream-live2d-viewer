import { NextResponse } from "next/server";
import {
  getSpineDownloadPackage,
  getSpineDownloadResponseHeaders,
} from "@/src/server/spine/download-package";

export async function GET(request, context) {
  const { model } = await context.params;

  if (!model) {
    return NextResponse.json({ error: "Model parameter is required" }, { status: 400 });
  }

  try {
    const downloadPackage = await getSpineDownloadPackage({ model });
    return new NextResponse(downloadPackage.zipBuffer, {
      headers: getSpineDownloadResponseHeaders(downloadPackage),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to process Spine download" },
      { status: error.status || 500 },
    );
  }
}
