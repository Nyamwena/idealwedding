import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
    req: Request,
    { params }: { params: { slug: string } }
) {
    try {
        const news = await prisma.news.findUnique({
            where: { slug: params.slug },
            include: {
                author: {
                    select: {
                        firstName: true,
                        lastName: true,
                    },
                },
                category: true,
            },
        });

        if (!news) {
            return NextResponse.json(
                { error: "News not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(news);

    } catch (error) {
        return NextResponse.json(
            { error: "Failed to fetch blog" },
            { status: 500 }
        );
    }
}
