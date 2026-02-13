import { NextResponse } from 'next/server';
import JSZip from 'jszip';
import { Asset2JsonConverter } from "@/src/server/live2d/asset-converter";
import { getLive2DBaseUrl } from "@/src/server/live2d/remote";

const isNonEmptyString = (value) => typeof value === "string" && value.length > 0;

async function downloadFile(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  return response.arrayBuffer();
}

function getFileUrl(filePath, baseUrl) {
  if (!isNonEmptyString(filePath)) {
    return null;
  }
  if (filePath.startsWith('../')) {
    const dirName = filePath.split('/')[1];
    return `https://bangdreamr2.haneoka.org/live2d/chara/${dirName}_rip/${filePath.replace(`../${dirName}/`, '')}`;
  }
  return baseUrl + filePath;
}

function getZipPath(filePath) {
  if (!isNonEmptyString(filePath)) {
    return null;
  }
  if (filePath.startsWith('../')) {
    return filePath.split('/').slice(2).join('/');
  }
  return filePath;
}

function getZipFolderPath(filePath, type) {
  const fileName = getZipPath(filePath);
  if (!fileName) {
    return null;
  }
  switch (type) {
    case 'texture':
      return `textures/${fileName}`;
    case 'motion':
      return `motions/${fileName}`;
    case 'expression':
      return `expressions/${fileName}`;
    default:
      return fileName;
  }
}

function processModelData(data) {
  const processed = { ...data };

  if (processed.model) {
    processed.model = getZipPath(processed.model);
  }

  if (processed.physics) {
    processed.physics = getZipPath(processed.physics);
  }

  if (Array.isArray(processed.textures)) {
    processed.textures = processed.textures.map(texture => getZipFolderPath(texture, 'texture')).sort();
  }

  if (processed.motions) {
    const newMotions = {};
    const sortedKeys = Object.keys(processed.motions).sort();
    for (const key of sortedKeys) {
      if (!Array.isArray(processed.motions[key])) continue;
      const nextList = processed.motions[key]
        .map((motion) => {
          if (!motion?.file) return null;
          const mappedFile = getZipFolderPath(motion.file, 'motion');
          if (!mappedFile) return null;
          return {
            ...motion,
            file: mappedFile,
          };
        })
        .filter(Boolean);

      if (nextList.length > 0) {
        newMotions[key] = nextList;
      }
    }
    processed.motions = newMotions;
  }

  if (Array.isArray(processed.expressions)) {
    processed.expressions = processed.expressions
      .map((expression) => {
        if (!expression?.file) return null;
        const mappedFile = getZipFolderPath(expression.file, 'expression');
        if (!mappedFile) return null;
        return {
          ...expression,
          file: mappedFile,
        };
      })
      .filter(Boolean)
      .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
  }

  return processed;
}

export async function GET(request, context) {
  const { model } = context.params;
  const { searchParams } = new URL(request.url);
  const isModified = searchParams.get('isModified') === 'true';

  if (!model) {
    return NextResponse.json({ error: 'Model parameter is required' }, { status: 400 });
  }

  try {
    const baseUrl = getLive2DBaseUrl({ isModified, model });
    const response = await fetch(baseUrl + 'buildData.asset');

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch data: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const processedData = Asset2JsonConverter.processFile(data, model.replace('_rip', ''));
    const finalData = processModelData(processedData);

    const zip = new JSZip();
    zip.file('model.json', JSON.stringify(finalData, null, 2), {
      date: new Date(0)
    });

    const folders = ['textures', 'motions', 'expressions'];
    folders.forEach(folder => {
      zip.folder(folder);
    });

    if (processedData.model) {
      const modelUrl = getFileUrl(processedData.model, baseUrl);
      const zipPath = getZipPath(processedData.model);
      if (!modelUrl || !zipPath) {
        throw new Error("Invalid model file path");
      }
      const modelBuffer = await downloadFile(modelUrl);
      zip.file(zipPath, modelBuffer, {
        date: new Date(0)
      });
    }

    if (processedData.physics) {
      const physicsUrl = getFileUrl(processedData.physics, baseUrl);
      const zipPath = getZipPath(processedData.physics);
      if (!physicsUrl || !zipPath) {
        throw new Error("Invalid physics file path");
      }
      const physicsBuffer = await downloadFile(physicsUrl);
      zip.file(zipPath, physicsBuffer, {
        date: new Date(0)
      });
    }

    const downloadPromises = [];
    const queuedZipPaths = new Set();
    const enqueueDownload = (sourcePath, type) => {
      const sourceUrl = getFileUrl(sourcePath, baseUrl);
      const zipPath = getZipFolderPath(sourcePath, type);
      if (!sourceUrl || !zipPath || queuedZipPaths.has(zipPath)) {
        return;
      }

      queuedZipPaths.add(zipPath);
      downloadPromises.push(
        downloadFile(sourceUrl).then((buffer) => ({
          path: zipPath,
          buffer,
        })),
      );
    };

    if (Array.isArray(processedData.textures)) {
      processedData.textures.forEach((texture) => enqueueDownload(texture, "texture"));
    }

    if (processedData.motions) {
      Object.values(processedData.motions).flat().forEach((motion) => {
        if (motion?.file) {
          enqueueDownload(motion.file, "motion");
        }
      });
    }

    if (Array.isArray(processedData.expressions)) {
      processedData.expressions.forEach((expression) => {
        if (expression?.file) {
          enqueueDownload(expression.file, "expression");
        }
      });
    }

    const downloadResults = await Promise.all(downloadPromises);
    downloadResults.forEach(({ path, buffer }) => {
      zip.file(path, buffer, { date: new Date(0) });
    });

    const zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: {
        level: 6
      },
      mimeType: 'application/zip',
      comment: 'Generated by live2d.haneoka.org',
      date: new Date(0)
    });

    return new NextResponse(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${model}.zip"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to process data: ${error.message}` },
      { status: 500 }
    );
  }
}
