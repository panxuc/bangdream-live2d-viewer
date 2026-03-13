import { NextResponse } from "next/server";
import { getSpineModelDescriptor } from "./model-descriptor-cache";

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

    const remoteUrl =
      (requestedPath === descriptorRecord.skeletonFileName ? descriptorRecord.skeletonRemoteUrl : null) ||
      descriptorRecord.pageUrlMap[requestedPath];

    if (!remoteUrl) {
      return NextResponse.json({ error: "Requested Spine asset was not found" }, { status: 404 });
    }

    const response = await fetch(remoteUrl);
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
