import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const AUTH_SERVICE_URL =
  process.env.AUTH_SERVICE_URL ||
  process.env.NEXT_PUBLIC_AUTH_SERVICE_URL ||
  "http://localhost:3002";

export async function GET() {
    try {
        const cookieStore = cookies();
        const token = cookieStore.get("token")?.value;

        if (!token) {
            return NextResponse.json(
                { message: "Not authenticated" },
                { status: 401 }
            );
        }

        const response = await fetch(`${AUTH_SERVICE_URL}/api/v1/users/profile`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        const json = await response.json();
        if (!response.ok) {
            return NextResponse.json(
                { message: json.message || "User not found" },
                { status: 401 }
            );
        }

        return NextResponse.json(json.data || json);

    } catch (error) {
        return NextResponse.json(
            { message: "Invalid token" },
            { status: 401 }
        );
    }
}
