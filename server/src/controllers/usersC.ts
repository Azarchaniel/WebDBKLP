import {Response, Request} from 'express';
import {IUser} from '../types';
import User from '../models/user';
import {optionFetchAllExceptDeleted} from '../utils/constants';
import {sortByParam} from "../utils/utils";
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken';

const secretKey = process.env.SECRET_KEY;

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

    const token = jwt.sign({userId: user._id, email: user.email}, secretKey, {
        expiresIn: '1h',
    });

    res.cookie("token", token, {
        httpOnly: false,
        secure: true
    });

    return res.status(200).json({token, userId: user._id});
    //return res.status(200).json({
    //     token,
    //     userId: user._id,
    //     email: user.email,
    //     roles: user.roles, // Example: ['user', 'admin']
    //     expiresIn: 60 * 60, // Expiry in seconds
    // });
}

export {getAllUsers, getUser, loginUser};
