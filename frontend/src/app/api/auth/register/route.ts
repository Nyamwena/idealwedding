import { NextRequest, NextResponse } from "next/server";

const AUTH_SERVICE_URL =
  process.env.AUTH_SERVICE_URL ||
  process.env.NEXT_PUBLIC_AUTH_SERVICE_URL ||
  "http://localhost:3002";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, firstName, lastName, role } = body;

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { message: "Email, password, firstname and lastname are required" },
        { status: 400 },
      );
    }

    const response = await fetch(`${AUTH_SERVICE_URL}/api/v1/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, firstName, lastName, role }),
    });

    const json = await response.json();
    if (!response.ok) {
      return NextResponse.json(
        { message: json.message || "Registration failed" },
        { status: response.status },
      );
    }

    const { user, accessToken, refreshToken } = json.data || {};
    const nextResponse = NextResponse.json(
      {
        message: json.message || "Registration successful",
        token: accessToken,
        user,
      },
      { status: 201 },
    );

    if (accessToken) {
      nextResponse.cookies.set("token", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      });
    }

    if (refreshToken) {
      nextResponse.cookies.set("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      });
    }

    return nextResponse;
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}