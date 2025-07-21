import { NextResponse } from 'next/server';

let infoCache = new Map();
let lastFetchTime = 0;
const CACHE_DURATION = 24 * 60 * 60 * 1000;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const characterId = searchParams.get('characterId');
  const isModified = searchParams.get('isModified') === 'true';

  if (!characterId) {
    return NextResponse.json({ error: 'Character ID is required' }, { status: 400 });
  }

  try {
    const now = Date.now();
    const branch = isModified ? 'live2d-modified' : 'live2d';
    const cacheKey = `${branch}_${characterId}`;
    
    if (!infoCache.has(cacheKey) || now - lastFetchTime > CACHE_DURATION) {
      const response = await fetch(`https://bangdreamr2.haneoka.org/${branch}/_info.json`);
      const data = await response.json();
      
      infoCache.set(cacheKey, data);
      lastFetchTime = now;
    }
    
    const characterModels = Object.entries(infoCache.get(cacheKey))
      .filter(([key]) => key.startsWith(characterId + '_') || key.startsWith('bili_' + characterId + '_'))
      .reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {});

    return NextResponse.json({ 
      characterId,
      models: characterModels 
    }, {
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
        'ETag': `"${characterId}-${branch}-${lastFetchTime}"`
      }
    });
  } catch (error) {
    console.error('Error fetching from Bestdori API:', error);
    return NextResponse.json({ error: 'Failed to fetch character data' }, { status: 500 });
  }
} 