import { NextResponse } from 'next/server';
import JSZip from 'jszip';
import { Asset2JsonConverter } from '../../chara/[model]/[...path]/route.js';

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
    return `https://raw.githubusercontent.com/panxuc/bangdream-live2d/live2d/chara/${dirName}_rip/${filePath.replace(`../${dirName}/`, '')}`;
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
    processed.textures = processed.textures.map(texture => getZipFolderPath(texture, 'texture'));
  }

  if (processed.motions) {
    const newMotions = {};
    for (const [key, motionArray] of Object.entries(processed.motions)) {
      newMotions[key] = motionArray.map(motion => ({
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
    }));
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
    const branch = isModified ? 'live2d-modified' : 'live2d';
    const baseUrl = `https://raw.githubusercontent.com/panxuc/bangdream-live2d/${branch}/chara/${model}_rip/`;
    const response = await fetch(baseUrl + 'buildData.asset');

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch data: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const processedData = Asset2JsonConverter.process_file(data, model.replace('_rip', ''));
    const finalData = processModelData(processedData);

    const zip = new JSZip();
    zip.file('model.json', JSON.stringify(finalData), {
      date: new Date(0)
    });

    const folders = ['textures', 'motions', 'expressions'];
    folders.forEach(folder => {
      zip.folder(folder);
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

    if (Array.isArray(processedData.textures)) {
      for (const texture of processedData.textures) {
        const textureUrl = getFileUrl(texture, baseUrl);
        const textureBuffer = await downloadFile(textureUrl);
        zip.file(getZipFolderPath(texture, 'texture'), textureBuffer, {
          date: new Date(0)
        });
      }
    }

    if (processedData.motions) {
      for (const [_, motionArray] of Object.entries(processedData.motions)) {
        for (const motion of motionArray) {
          const motionUrl = getFileUrl(motion.file, baseUrl);
          const motionBuffer = await downloadFile(motionUrl);
          zip.file(getZipFolderPath(motion.file, 'motion'), motionBuffer, {
            date: new Date(0)
          });
        }
      }
    }

    if (Array.isArray(processedData.expressions)) {
      for (const expression of processedData.expressions) {
        const expressionUrl = getFileUrl(expression.file, baseUrl);
        const expressionBuffer = await downloadFile(expressionUrl);
        zip.file(getZipFolderPath(expression.file, 'expression'), expressionBuffer, {
          date: new Date(0)
        });
      }
    }

    const zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: {
        level: 9
      },
      mimeType: 'application/zip',
      comment: 'Generated by `bangdream-live2d-viewer.panxuc.com`',
      date: new Date(0),
      dir: true
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
