import { NextResponse } from 'next/server';

export class Asset2JsonConverter {
  // 提取为静态常量，避免重复创建
  static IGNORED_KEYS = new Set([
    "m_GameObject", "m_Enabled", "m_Script", "m_Name", 
    "transition", "praramGeneralA", "paramLoop"
  ]);

  /**
   * 核心路径处理逻辑
   */
  static process_bundle_file(bundle, currentPath) {
    if (!bundle?.bundleName || !bundle?.fileName) return null;

    const { bundleName, fileName } = bundle;
    // 获取文件名（不含扩展名）
    let finalFileName = fileName.replace(/\.bytes$/, "");
    
    // 只有特定目录才需要处理相对路径逻辑
    if (bundleName.startsWith("live2d/chara/")) {
      const bundleBaseName = bundleName.substring(bundleName.lastIndexOf('/') + 1);
      const cleanBaseName = bundleBaseName.replace('_rip', '');

      if (cleanBaseName.endsWith('_general')) {
        // 处理通用资源 (../../chara/xxx)
        finalFileName = `../../chara/${bundleBaseName}/${finalFileName}`;
      } else if (cleanBaseName !== currentPath) {
        // 处理引用其他角色的资源 (../xxx)
        finalFileName = `../${bundleBaseName}/${finalFileName}`;
      }
    }

    return finalFileName;
  }

  /**
   * 通用数组/对象处理 (用于 model, physics, textures)
   * 增加了 suffix 参数用于处理 texture 的 .png 后缀需求
   */
  static process_common_items(items, currentPath, suffix = "") {
    if (Array.isArray(items)) {
      return items
        .map(item => {
          if (typeof item === 'object') {
            const path = this.process_bundle_file(item, currentPath);
            // 如果有路径且需要后缀（如 .png），且当前没有后缀，则添加
            if (path && suffix && !path.endsWith(suffix)) {
              return path + suffix;
            }
            return path;
          }
          return item;
        })
        .filter(Boolean);
    } else if (typeof items === 'object') {
      return this.process_bundle_file(items, currentPath);
    }
    return items;
  }

  /**
   * 处理动作文件
   * 优化：一次遍历完成 map 和 filter，最后统一排序
   */
  static process_motions(motions, currentPath) {
    if (!Array.isArray(motions)) return {};

    const entries = motions.reduce((acc, item) => {
      // 确保 item 是对象且包含必要字段
      if (typeof item === 'object') {
        const path = this.process_bundle_file(item, currentPath);
        if (path) {
          const name = path.substring(path.lastIndexOf('/') + 1).replace(".mtn", "");
          acc.push([name, [{ file: path }]]);
        }
      }
      return acc;
    }, []);

    // 排序并转换为对象
    entries.sort((a, b) => a[0].localeCompare(b[0]));
    return Object.fromEntries(entries);
  }

  /**
   * 处理表情文件
   */
  static process_expressions(expressions, currentPath) {
    if (!Array.isArray(expressions)) return [];

    const processed = expressions.reduce((acc, item) => {
      if (typeof item === 'object') {
        const file = this.process_bundle_file(item, currentPath);
        if (file) {
          const name = file.substring(file.lastIndexOf('/') + 1).replace(".exp.json", "");
          acc.push({ name, file });
        }
      }
      return acc;
    }, []);

    return processed.sort((a, b) => a.name.localeCompare(b.name));
  }

  static process_file(data, currentPath) {
    // 使用 Optional Chaining 简化检查
    if (!data?.Base) {
      throw new Error('Invalid data format: missing Base object');
    }

    // 浅拷贝 Base 对象，避免直接修改原始 data (Immutability 建议)
    const base_data = { ...data.Base };

    // 1. 处理基础属性 (Model, Physics, Textures)
    if (base_data.model) {
      base_data.model = this.process_common_items(base_data.model, currentPath);
    }
    if (base_data.physics) {
      base_data.physics = this.process_common_items(base_data.physics, currentPath);
    }
    if (base_data.textures) {
      // 传入 .png 后缀需求
      base_data.textures = this.process_common_items(base_data.textures, currentPath, '.png');
    }

    // 2. 处理复杂属性 (Motions, Expressions)
    if (base_data.motions) {
      base_data.motions = this.process_motions(base_data.motions, currentPath);
    }
    if (base_data.expressions) {
      base_data.expressions = this.process_expressions(base_data.expressions, currentPath);
    }

    // 3. 清理无用字段
    // 使用 Object.keys 遍历并 delete，比预定义数组更安全，或者使用解构过滤
    Object.keys(base_data).forEach(key => {
      if (this.IGNORED_KEYS.has(key)) {
        delete base_data[key];
      }
    });

    return base_data;
  }
}

export async function GET(request, context) {
  const { model, path } = await context.params;
  
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
