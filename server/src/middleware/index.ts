import jwt, { JwtPayload } from "jsonwebtoken";
import type { NextFunction, Request, Response } from "express";

interface CustomVerificationResponse extends Response {
    userData?: {
        userId: string;
        role?: string;
    };
}

const userVerification = (req: Request, res: Response, next: NextFunction) => {
    const token = req?.headers?.authorization?.split(" ")[1];

    if (!token) return res.status(401).send("Unauthorized");

    if (!`${process.env.SECRET_KEY}`) throw "Secret key not found";
    const decodedToken: JwtPayload = jwt.verify(token!, `${process.env.SECRET_KEY}`) as JwtPayload;

    (res as CustomVerificationResponse).userData = { userId: decodedToken.userId, role: decodedToken.role };

    next();
}

const blockGuest = (req: Request, res: Response, next: NextFunction) => {
    const token = req?.headers?.authorization?.split(" ")[1];
    if (!token) return next();
    try {
        const decoded = jwt.verify(token, `${process.env.SECRET_KEY}`) as JwtPayload;
        if (decoded.role === 'guest') {
            return res.status(403).json({ message: 'Guest users cannot modify data' });
        }
    } catch {
        // Invalid token — userVerification handles this already
    }
    next();
}

export { userVerification, blockGuest };