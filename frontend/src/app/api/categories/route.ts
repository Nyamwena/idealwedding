import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

// GET ALL CATEGORIES (Public)
export async function GET() {
    try {
        const categories = await prisma.category.findMany({
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(categories);
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to fetch categories" },
            { status: 500 }
        );
    }
}

// CREATE CATEGORY (Admin only)
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
                { error: "Admins only" },
                { status: 403 }
            );
        }

        const { name, slug } = await req.json();

        const category = await prisma.category.create({
            data: { name, slug },
        });

        return NextResponse.json(category);

    } catch (error) {
        return NextResponse.json(
            { error: "Failed to create category" + error},
            { status: 500 }
        );
    }
}
