import { NextResponse } from "next/server";
import { getSpineModelDescriptor } from "./model-descriptor-cache";
import { fetchBangDreamR2Object } from "@/src/server/r2/bangdream-r2";

export async function handleSpineAssetRequest(context) {
  const { model, path } = await context.params;
  const requestedPath = Array.isArray(path) ? decodeURIComponent(path.join("/")) : "";

  if (!model) {
    return NextResponse.json({ error: "Model parameter is required" }, { status: 400 });
  }

  try {
    const descriptorRecord = await getSpineModelDescriptor(model);

    if (!requestedPath || requestedPath === "buildData.asset") {
      return NextResponse.json(descriptorRecord.descriptor, {
        headers: descriptorRecord.headers.json,
      });
    }

    if (requestedPath === descriptorRecord.atlasFileName) {
      return new NextResponse(descriptorRecord.atlasText, {
        headers: descriptorRecord.headers.text,
      });
    }

    const objectKey =
      (requestedPath === descriptorRecord.skeletonFileName ? descriptorRecord.skeletonKey : null) ||
      descriptorRecord.pageKeyMap[requestedPath];

    if (!objectKey) {
      return NextResponse.json({ error: "Requested Spine asset was not found" }, { status: 404 });
    }

    const response = await fetchBangDreamR2Object(objectKey);
    if (!response.ok) {
      return NextResponse.json({ error: `Failed to fetch asset: ${response.status}` }, { status: response.status });
    }

    const contentType = response.headers.get("content-type") || descriptorRecord.headers.binary["content-type"];
    const body = await response.arrayBuffer();
    return new NextResponse(body, {
      headers: {
        ...descriptorRecord.headers.binary,
        "content-type": contentType,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: `Failed to fetch Spine data: ${error.message}` }, { status: 500 });
  }
}
