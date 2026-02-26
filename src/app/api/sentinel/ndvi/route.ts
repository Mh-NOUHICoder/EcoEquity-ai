import { NextRequest, NextResponse } from 'next/server';
import { getSentinelToken } from '@/lib/sentinelAuth';

const evalscript = `
//VERSION=3
function setup() {
  return {
    input: ["B04", "B08", "dataMask"],
    output: { id: "default", bands: 2, sampleType: "FLOAT32" }
  };
}
function evaluatePixel(sample) {
  let ndvi = (sample.B08 - sample.B04) / (sample.B08 + sample.B04);
  return [ndvi, sample.dataMask];
}
`;

function getHotZones(ndvi: number): number {
    if (ndvi < 0.2) return 5 + Math.floor(Math.random() * 3);
    if (ndvi < 0.3) return 2 + Math.floor(Math.random() * 2);
    if (ndvi < 0.4) return 1;
    return 0;
}

async function fetchNDVIStats(params: {
  bbox: string | number[];
  from?: string;
  to?: string;
  collection?: string;
}) {
  const accessToken = await getSentinelToken();
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(endDate.getMonth() - 2);
  const defaultFrom = startDate.toISOString().split('.')[0] + 'Z';
  const defaultTo = endDate.toISOString().split('.')[0] + 'Z';

  const { 
    bbox, 
    from = defaultFrom, 
    to = defaultTo,
    collection = 'sentinel-2-l2a' 
  } = params;

  const parsedBbox = Array.isArray(bbox) 
    ? bbox 
    : bbox.split(',').map((v) => parseFloat(v.trim()));

  const requestBody = {
    input: {
      bounds: { bbox: parsedBbox },
      data: [
        {
          type: collection,
          dataFilter: {
            timeRange: { from, to },
            mosaickingOrder: 'leastCC',
          },
        },
      ],
    },
    aggregation: {
      evalscript,
      aggregationInterval: { of: 'P4M' },
      width: 100,
      height: 100,
    },
  };

  const response = await fetch('https://services.sentinel-hub.com/api/v1/statistics', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Sentinel Hub API Error: ${errorText}`);
  }

  const stats = await response.json();
  const meanNdvi = stats.data[0]?.outputs?.default?.bands?.B0?.stats?.mean;

  if (typeof meanNdvi !== 'number') {
    throw new Error('Could not extract mean NDVI from Sentinel Hub response.');
  }

  return {
    avgNDVI: meanNdvi,
    hotZones: getHotZones(meanNdvi),
  };
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const bbox = searchParams.get('bbox');
    const from = searchParams.get('from') || undefined;
    const to = searchParams.get('to') || undefined;

    if (!bbox) {
      return NextResponse.json({ error: 'Missing bbox parameter' }, { status: 400 });
    }

    const data = await fetchNDVIStats({ bbox, from, to });
    return NextResponse.json(data);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bbox, from, to, collection } = body;

    if (!bbox) {
      return NextResponse.json({ error: 'Missing bbox parameter' }, { status: 400 });
    }

    const data = await fetchNDVIStats({ bbox, from, to, collection });
    return NextResponse.json(data);
  } catch (error) {
    return handleError(error);
  }
}

function handleError(error: unknown) {
  const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
  console.error("NDVI API Route Error:", errorMessage);
  return NextResponse.json({ error: errorMessage }, { status: 500 });
}
