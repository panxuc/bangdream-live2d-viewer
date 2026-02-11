import { NextResponse } from 'next/server';
import { categories } from "@/src/server/catalog/categories";

export async function GET() {
    try {
        return NextResponse.json({
            categories,
            total: categories.length
        });
    } catch (error) {
        return NextResponse.json(
            { error: '获取分类数据失败' },
            { status: 500 }
        );
    }
}
