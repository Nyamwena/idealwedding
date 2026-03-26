import jwt from "jsonwebtoken";

export function verifyToken(token: string) {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!);
        return decoded as {
            userId: string;
            email: string;
            role: string;
        };
    } catch (error) {
        return null;
    }
}
