import { NextResponse } from "next/server";
import { getSpineDownloadPackage } from "@/src/server/spine/download-package";

export async function GET(request, context) {
  const { model } = await context.params;

  if (!model) {
    return NextResponse.json({ error: "Model parameter is required" }, { status: 400 });
  }

  try {
    const downloadPackage = await getSpineDownloadPackage({ model });
    return NextResponse.json({
      fileName: downloadPackage.fileName,
      sizeBytes: downloadPackage.sizeBytes,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch Spine download info" },
      { status: error.status || 500 },
    );
  }
}
