import { NextResponse } from 'next/server';

const categories = [
    "Poppin'Party",
    "Afterglow", 
    "Hello, Happy World!",
    "Pastel*Palettes",
    "Roselia",
    "Morfonica",
    "RAISE A SUILEN",
    "MyGO!!!!!",
    "Ave Mujica",
    "CRYCHIC",
    "Sumimi",
    "Glitter*Green",
    "CHiSPA",
    "Marmalade",
    "ViVidCanvas",
    "幼年",
    "工作人员",
    "家人朋友",
    "男性",
    "非人类",
    "其他"
];

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