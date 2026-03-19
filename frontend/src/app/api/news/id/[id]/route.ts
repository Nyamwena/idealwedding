import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

interface Params {
    params: {
        id: string;
    };
}

// ✅ GET SINGLE NEWS
export async function GET(req: Request, { params }: Params) {
    try {
        const news = await prisma.news.findUnique({
            where: { id: params.id },
            include: {
                author: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
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
            { error: "Failed to fetch blog" + error },
            { status: 500 }
        );
    }
}

// ✅ UPDATE NEWS (Admin only)
export async function PUT(req: Request, { params }: Params) {
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

        const { title, content, imageUrl, published } = await req.json();

        const updatedNews = await prisma.news.update({
            where: { id: params.id },
            data: {
                title,
                content,
                imageUrl,
                published,
            },
        });

        return NextResponse.json(updatedNews);
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to update blog" },
            { status: 500 }
        );
    }
}
// ✅ DELETE NEWS (Admin only)
export async function DELETE(req: Request, { params }: Params) {
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

        await prisma.news.delete({
            where: { id: params.id },
        });

        return NextResponse.json({ message: "News deleted successfully" });
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to delete blog" },
            { status: 500 }
        );
    }
}
