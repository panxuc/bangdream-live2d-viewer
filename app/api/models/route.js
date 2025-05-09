import { NextResponse } from 'next/server';

// 缓存_info.json数据
let infoCache = null;
let lastFetchTime = 0;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24小时的缓存时间

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const characterId = searchParams.get('characterId');

  if (!characterId) {
    return NextResponse.json({ error: 'Character ID is required' }, { status: 400 });
  }

  try {
    // 检查缓存是否有效
    const now = Date.now();
    if (!infoCache || now - lastFetchTime > CACHE_DURATION) {
      const response = await fetch('https://raw.githubusercontent.com/panxuc/bangdream-live2d/refs/heads/main/_info.json');
      infoCache = await response.json();
      lastFetchTime = now;
    }
    
    // 过滤出以指定角色ID开头的键
    const characterModels = Object.entries(infoCache)
      .filter(([key]) => key.startsWith(characterId + '_'))
      .reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {});

    return NextResponse.json({ 
      characterId,
      models: characterModels 
    });
  } catch (error) {
    console.error('Error fetching from Bestdori API:', error);
    return NextResponse.json({ error: 'Failed to fetch character data' }, { status: 500 });
  }
} 