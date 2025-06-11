import { NextResponse } from 'next/server';

let infoCache = null;
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
    
    if (!infoCache || !infoCache[cacheKey] || now - lastFetchTime > CACHE_DURATION) {
      const response = await fetch(`https://raw.githubusercontent.com/panxuc/bangdream-live2d/${branch}/_info.json`);
      const data = await response.json();
      
      if (!infoCache) {
        infoCache = {};
      }
      infoCache[cacheKey] = data;
      lastFetchTime = now;
    }
    
    const characterModels = Object.entries(infoCache[cacheKey])
      .filter(([key]) => key.startsWith(characterId + '_') || key.startsWith('bili_' + characterId + '_'))
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