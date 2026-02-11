import { NextResponse } from 'next/server';
import JSZip from 'jszip';
import { Asset2JsonConverter } from "@/src/server/live2d/asset-converter";
import { getLive2DBaseUrl } from "@/src/server/live2d/remote";

async function downloadFile(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  return response.arrayBuffer();
}

function getFileUrl(filePath, baseUrl) {
  if (filePath.startsWith('../')) {
    const dirName = filePath.split('/')[1];
    return `https://bangdreamr2.haneoka.org/live2d/chara/${dirName}_rip/${filePath.replace(`../${dirName}/`, '')}`;
  }
  return baseUrl + filePath;
}

function getZipPath(filePath) {
  if (filePath.startsWith('../')) {
    return filePath.split('/').slice(2).join('/');
  }
  return filePath;
}

function getZipFolderPath(filePath, type) {
  const fileName = getZipPath(filePath);
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
      newMotions[key] = processed.motions[key].map(motion => ({
        ...motion,
        file: getZipFolderPath(motion.file, 'motion')
      }));
    }
    processed.motions = newMotions;
  }

  if (Array.isArray(processed.expressions)) {
    processed.expressions = processed.expressions.map(expression => ({
      ...expression,
      file: getZipFolderPath(expression.file, 'expression')
    })).sort((a, b) => a.name.localeCompare(b.name));
  }

  return processed;
}

export async function GET(request, context) {
  const { model } = await context.params;
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
      zip.folder(folder, { date: new Date(0) });
    });

    if (processedData.model) {
      const modelUrl = getFileUrl(processedData.model, baseUrl);
      const modelBuffer = await downloadFile(modelUrl);
      zip.file(getZipPath(processedData.model), modelBuffer, {
        date: new Date(0)
      });
    }

    if (processedData.physics) {
      const physicsUrl = getFileUrl(processedData.physics, baseUrl);
      const physicsBuffer = await downloadFile(physicsUrl);
      zip.file(getZipPath(processedData.physics), physicsBuffer, {
        date: new Date(0)
      });
    }

    const downloadPromises = [];

    if (Array.isArray(processedData.textures)) {
      processedData.textures.forEach(texture => {
        const textureUrl = getFileUrl(texture, baseUrl);
        downloadPromises.push(
          downloadFile(textureUrl).then(buffer => ({
            path: getZipFolderPath(texture, 'texture'),
            buffer
          }))
        );
      });
    }

    if (processedData.motions) {
      Object.values(processedData.motions).flat().forEach(motion => {
        const motionUrl = getFileUrl(motion.file, baseUrl);
        downloadPromises.push(
          downloadFile(motionUrl).then(buffer => ({
            path: getZipFolderPath(motion.file, 'motion'),
            buffer
          }))
        );
      });
    }

    if (Array.isArray(processedData.expressions)) {
      processedData.expressions.forEach(expression => {
        const expressionUrl = getFileUrl(expression.file, baseUrl);
        downloadPromises.push(
          downloadFile(expressionUrl).then(buffer => ({
            path: getZipFolderPath(expression.file, 'expression'),
            buffer
          }))
        );
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
