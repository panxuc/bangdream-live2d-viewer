import { NextResponse } from "next/server";
import { getDownloadPackage } from "@/src/server/live2d/download-package";

export async function GET(request, context) {
  const { model } = await context.params;
  const { searchParams } = new URL(request.url);
  const isModified = searchParams.get("isModified") === "true";

  if (!model) {
    return NextResponse.json({ error: "Model parameter is required" }, { status: 400 });
  }

  try {
    const downloadPackage = await getDownloadPackage({ model, isModified });
    return NextResponse.json({
      fileName: downloadPackage.fileName,
      sizeBytes: downloadPackage.sizeBytes,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch download info" },
      { status: error.status || 500 },
    );
  }
}
