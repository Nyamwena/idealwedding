import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export function middleware(request: NextRequest) {
    const token = request.cookies.get("auth_token")?.value;

    if (!token) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

        if (
            request.nextUrl.pathname.startsWith("/admin") &&
            decoded.role !== "ADMIN"
        ) {
            return NextResponse.redirect(new URL("/dashboard", request.url));
        }

        return NextResponse.next();
    } catch {
        return NextResponse.redirect(new URL("/login", request.url));
    }
}

export const config = {
    matcher: ["/admin/:path*"],
};
