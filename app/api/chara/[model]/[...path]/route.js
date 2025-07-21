import { NextResponse } from 'next/server';

export class Asset2JsonConverter {
  static process_bundle_file(bundle, currentPath) {
    if (!bundle) return null;
    
    const bundle_name = bundle?.bundleName || "";
    let file_name = bundle?.fileName || "";
    
    if (bundle_name.startsWith("live2d/chara/")) {
      const bundleBaseName = bundle_name.split('/').pop().replace('_rip', '');
      if (bundleBaseName !== currentPath) {
        const prefix = `../${bundle_name.split('/').pop()}`;
        file_name = `${prefix}/${file_name}`;
      }
    }
    if (file_name.endsWith(".bytes")) {
      file_name = file_name.replace(".bytes", "");
    }
    return file_name;
  }

  static process_key_items(items, currentPath, key) {
    if (Array.isArray(items)) {
      return items.map(item => {
        if (typeof item === 'object') {
          const processed = this.process_bundle_file(item, currentPath);
          if (key === 'textures' && !processed.endsWith('.png')) {
            return processed + '.png';
          }
          return processed;
        }
        return item;
      }).filter(Boolean);
    } else if (typeof items === 'object') {
      return this.process_bundle_file(items, currentPath);
    }
    return items;
  }

  static process_motions(motions, currentPath) {
    if (!Array.isArray(motions)) return {};
    
    const processed = motions.map(item => {
      if (typeof item === 'object' && 'bundleName' in item && 'fileName' in item) {
        return this.process_bundle_file(item, currentPath);
      }
      return item;
    }).filter(Boolean);
    
    return Object.fromEntries(
      processed.map(v => {
        const name = v.split('/').pop().replace(".mtn", "");
        return [name, [{ file: v }]];
      }).sort((a, b) => a[0].localeCompare(b[0]))
    );
  }

  static process_expressions(expressions, currentPath) {
    if (!Array.isArray(expressions)) return [];
    
    const processed = expressions.map(item => {
      if (typeof item === 'object' && 'bundleName' in item && 'fileName' in item) {
        const file_name = this.process_bundle_file(item, currentPath);
        const name = file_name.split('/').pop().replace(".exp.json", "");
        return { name, file: file_name };
      }
      return item;
    }).filter(Boolean);
    
    return processed.sort((a, b) => a.name.localeCompare(b.name));
  }

  static process_file(data, currentPath) {
    if (!data || !data.Base) {
      throw new Error('Invalid data format: missing Base object');
    }
    
    const base_data = data.Base;
    
    ["model", "physics", "textures"].forEach(key => {
      if (key in base_data) {
        base_data[key] = this.process_key_items(base_data[key], currentPath, key);
      }
    });

    if (Array.isArray(base_data.motions)) {
      base_data.motions = this.process_motions(base_data.motions, currentPath);
    }

    if (Array.isArray(base_data.expressions)) {
      base_data.expressions = this.process_expressions(base_data.expressions, currentPath);
    }

    const keysToRemove = ["m_GameObject", "m_Enabled", "m_Script", "m_Name", "transition", "praramGeneralA", "paramLoop"];
    keysToRemove.forEach(key => {
      if (key in base_data) {
        delete base_data[key];
      }
    });

    return base_data;
  }
}

export async function GET(request, context) {
  const { model, path } = context.params;
  
  if (!model) {
    return NextResponse.json({ error: 'Model parameter is required' }, { status: 400 });
  }

  const filePath = path ? path.join('/') : '';
  const currentPath = model.replace('_rip', '');
  const fullUrl = `https://bangdreamr2.haneoka.org/live2d/chara/${model}_rip/${filePath}`;

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
