import { NextResponse } from "next/server";
import { queryCharacters } from "@/src/server/catalog/characters";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const category = searchParams.get("category");

    const result = queryCharacters({ page, limit, category });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "获取角色数据失败" }, { status: 500 });
  }
}
