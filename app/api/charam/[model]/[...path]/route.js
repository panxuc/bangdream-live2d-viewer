import { NextResponse } from 'next/server';
import { Asset2JsonConverter } from '../../../chara/[model]/[...path]/route.js';

export async function GET(request, context) {
  const { model, path } = await context.params;

  if (!model) {
    return NextResponse.json({ error: 'Model parameter is required' }, { status: 400 });
  }

  const filePath = path ? path.join('/') : '';
  const currentPath = model.replace('_rip', '');
  const fullUrl = `https://bangdreamr2.haneoka.org/live2d-modified/chara/${model}_rip/${filePath}`;

  try {
    const response = await fetch(fullUrl);

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch data: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    if (filePath === 'buildData.asset') {
      const data = await response.json();
      const processedData = Asset2JsonConverter.process_file(data, currentPath);
      return NextResponse.json(processedData, {
        headers: {
          'Cache-Control': 'public, max-age=3600, s-maxage=86400'
        }
      });
    }

    const contentType = response.headers.get('content-type');
    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        'content-type': contentType || 'application/octet-stream',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400'
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to fetch data: ${error.message}` },
      { status: 500 }
    );
  }
}
