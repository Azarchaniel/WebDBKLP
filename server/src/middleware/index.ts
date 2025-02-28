import jwt, {JwtPayload} from "jsonwebtoken";
import type {NextFunction, Request, Response} from "express";

const userVerification  = (req: Request, res: Response, next: NextFunction) => {
    const token = req?.headers?.authorization?.split(" ")[1];

    if (!token) res.status(401).send("Unauthorized");

    if (!process.env.SECRET_KEY) throw "Secret key not found";
    const decodedToken: JwtPayload = jwt.verify(token!, process.env.SECRET_KEY) as JwtPayload;

    (res as any).userData = { userId: decodedToken.userId };

    next();
}

export {userVerification};