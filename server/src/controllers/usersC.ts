import {Response, Request} from 'express';
import {CustomJwtPayload, IUser} from '../types';
import User from '../models/user';
import {optionFetchAllExceptDeleted} from '../utils/constants';
import {sortByParam} from "../utils/utils";
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken';

const secretKey = process.env.SECRET_KEY;
const refreshKey = process.env.REFRESH_TOKEN_SECRET;

const getAllUsers = async (_: Request, res: Response): Promise<void> => {
    try {
        const users: IUser[] = await User.find(optionFetchAllExceptDeleted)
        res.status(200).json({users: sortByParam(users, "firstName")})
    } catch (error) {
        res.status(500);
        throw error
    }
}

const getUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const user: IUser | null = await User.findById(req.params.id);
        const allUsers: IUser[] = await User.find()
        res.status(200).json({user: user, allUsers: allUsers})
    } catch (err) {
        throw err;
    }
}

const loginUser = async (req: Request, res: Response): Promise<Response> => {
    // https://jsfiddle.net/Azarchaniel/4gvexLyt/7/ - to create or verify pass
    const {email, password} = req.body.params;

    if (!email || !password) {
        console.error(`All fields are required! Email: ${email}, password: ${password}`)
        return res.status(403).json({message: 'All fields are required'})
    }

    const user = await User.findOne({email});

    if (!user) {
        console.error("User not found", email);
        return res.status(403).json({message: "Auth has failed"});
    }

    const passwordMatch = await bcrypt.compare(password, user?.hashedPassword);

    if (!passwordMatch) {
        console.error("Passwords do not match");
        return res.status(403).json({error: 'Authentication failed'});
    }

    if (!secretKey) {
        console.error("Secret key not found");
        return res.status(500).json({message: 'An internal server issue occurred, try again later'});
    }

    if (!refreshKey) {
        console.error("Refresh key not found");
    }

    const token = jwt.sign({userId: user._id, email: user.email}, secretKey, {
        expiresIn: '1h',
    });

    const refreshToken = jwt.sign(
        { userId: user._id },
        refreshKey!,
        { expiresIn: '7d' } // Long-lived
    );


    res.cookie("token", token, {
        httpOnly: false,
        secure: true
    });

    return res.status(200).json({token, refreshToken, userId: user._id});
    //return res.status(200).json({
    //     token,
    //     userId: user._id,
    //     email: user.email,
    //     roles: user.roles, // Example: ['user', 'admin']
    //     expiresIn: 60 * 60, // Expiry in seconds
    // });
}

const refreshToken = async (req: Request, res: Response): Promise<Response> => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(400).json({ message: 'Refresh token is required' });
    }

    try {
        // Verify the refresh token
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET!) as CustomJwtPayload;
        if (!decoded) return res.status(401).json({ message: 'Invalid refresh token' });

        // Issue a new access token
        const newAccessToken = jwt.sign(
            { userId: decoded.userId },
            process.env.ACCESS_TOKEN_SECRET!,
            { expiresIn: '15m' }
        );

        // Optionally, issue a new refresh token
        const newRefreshToken = jwt.sign(
            { userId: decoded.userId },
            process.env.REFRESH_TOKEN_SECRET!,
            { expiresIn: '7d' }
        );

        return res.status(200).json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
    } catch (error) {
        console.error("Error while refreshing token", error);
        return res.status(500).json({ message: 'Internal server error' });
    }

}

export {getAllUsers, getUser, loginUser, refreshToken};
