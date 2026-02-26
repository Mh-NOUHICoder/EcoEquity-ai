import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { getSentinelToken } from "@/lib/sentinelAuth";

async function searchCatalog(params: {
  bbox: string | number[];
  datetime: string;
  collections: string | string[];
  limit: number;
}) {
  const accessToken = await getSentinelToken();
  const { bbox, datetime, collections, limit } = params;

  const catalogResponse = await axios.post(
    "https://services.sentinel-hub.com/api/v1/catalog/1.0.0/search",
    {
      collections: Array.isArray(collections)
        ? collections
        : collections.split(","),
      datetime,
      bbox: Array.isArray(bbox)
        ? bbox
        : bbox.split(",").map((v) => parseFloat(v.trim())),
      limit,
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  return catalogResponse.data;
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const bbox = searchParams.get("bbox");
    const datetime = searchParams.get("datetime");
    const collections = searchParams.get("collections") || "sentinel-2-l2a";
    const limit = parseInt(searchParams.get("limit") || "5", 10);

    if (!bbox || !datetime) {
      return NextResponse.json(
        { message: "Missing required query parameters: bbox, datetime" },
        { status: 400 }
      );
    }

    const data = await searchCatalog({ bbox, datetime, collections, limit });
    return NextResponse.json(data);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bbox, datetime, collections = "sentinel-2-l2a", limit = 5 } = body;

    if (!bbox || !datetime) {
      return NextResponse.json(
        { message: "Missing required body parameters: bbox, datetime" },
        { status: 400 }
      );
    }

    const data = await searchCatalog({ bbox, datetime, collections, limit });
    return NextResponse.json(data);
  } catch (error) {
    return handleError(error);
  }
}

function handleError(error: unknown) {
  let errorMessage = "An unknown error occurred.";
  let status = 500;

  if (axios.isAxiosError(error)) {
    errorMessage = error.response?.data?.message || error.message;
    status = error.response?.status || 500;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  return NextResponse.json({ message: errorMessage }, { status });
}
