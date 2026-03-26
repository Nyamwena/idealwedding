import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";



function generateSlug(title: string) {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
}


export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);

        const page = Number(searchParams.get("page")) || 1;
        const limit = Number(searchParams.get("limit")) || 6;
        const skip = (page - 1) * limit;

        const category = searchParams.get("category");
        const featured = searchParams.get("featured");

        const whereCondition: any = {
            published: true,
            ...(category && { category: { slug: category } }),
            ...(featured && { featured: true }),
        };

        const [news, total] = await Promise.all([
            prisma.news.findMany({
                where: whereCondition,
                include: {
                    author: {
                        select: {
                            firstName: true,
                            lastName: true,
                        },
                    },
                    category: true,
                },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
            prisma.news.count({
                where: whereCondition,
            }),
        ]);

        return NextResponse.json({
            data: news,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });

    } catch (error) {
        return NextResponse.json(
            { error: "Failed to fetch blog" },
            { status: 500 }
        );
    }
}



export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get("authorization");

        if (!authHeader) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.split(" ")[1];
        const decoded = await verifyToken(token);

        if (!decoded || decoded.role !== "ADMIN") {
            return NextResponse.json(
                { error: "Forbidden - Admins only" },
                { status: 403 }
            );
        }

        const { title, content, imageUrl, categoryId, featured } =
            await req.json();
        const slug = generateSlug(title);


        const news = await prisma.news.create({
            data: {
                title,
                content,
                slug,
                imageUrl,
                featured: featured || false,
                authorId: Number(decoded.id),
                categoryId: Number(categoryId),
            },
        });

        return NextResponse.json(news);

    } catch (error) {
        return NextResponse.json(
            { error: "Failed to create blog "  + error  },
            { status: 500 }
        );
    }
}

