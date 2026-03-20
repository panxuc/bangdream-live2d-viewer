import { NextResponse } from "next/server";
import { getDownloadPackage, getDownloadResponseHeaders } from "@/src/server/live2d/download-package";

async function handleZipRequest(request, context) {
  const { model } = await context.params;
  const { searchParams } = new URL(request.url);
  const isModified = searchParams.get("isModified") === "true";

  if (!model) {
    return NextResponse.json({ error: "Model parameter is required" }, { status: 400 });
  }

  try {
    const downloadPackage = await getDownloadPackage({ model, isModified });
    return new NextResponse(downloadPackage.zipBuffer, {
      headers: getDownloadResponseHeaders(downloadPackage),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to process data" },
      { status: error.status || 500 },
    );
  }
}

export async function GET(request, context) {
  return handleZipRequest(request, context);
}
