import {Response, Request} from 'express';
import {IUser} from '../types';
import User from '../models/user';

const getAllUsers = async (req: Request, res: Response): Promise<void> => {
    try {
        const users: IUser[] = await User.find()
        res.status(200).json({users: users})
    } catch (error) {
        res.status(400);
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

// TODO: frontend

// const addUser = async (req: Request, res: Response): Promise<void> => {
//     const {firstName, lastName, hashedPassword} = req.body;
//     try {
//         const user: IUser = new User({
//             firstName: firstName,
//             lastName: lastName,
//             hashedPassword: hashedPassword
//         });
//
//         const newUser: IUser = await user.save()
//         const allUsers: IUser[] = await User.find()
//
//         res.status(201).json({message: 'User added', user: newUser, users: allUsers})
//     } catch (error) {
//         throw error
//     }
// }
//
// const updateUser = async (req: Request, res: Response): Promise<void> => {
//     try {
//         const {
//             params: {id},
//             body,
//         } = req
//         const updateUser: IUser | null = await User.findByIdAndUpdate(
//             {_id: id},
//             body
//         )
//         const allUsers: IUser[] = await User.find()
//         res.status(200).json({
//             message: 'User updated',
//             user: updateUser,
//             users: allUsers,
//         })
//     } catch (error) {
//         throw error
//     }
// }
//
// const deleteUser = async (req: Request, res: Response): Promise<void> => {
//     try {
//         const {
//             params: {id},
//             body,
//         } = req
//         const deletedUser: IUser | null = await User.findByIdAndUpdate(
//             {_id: id},
//             {
//                 ...body,
//                 isDeleted: true
//             }
//         )
//         const allUsers: IUser[] = await User.find()
//         res.status(200).json({
//             message: 'User deleted',
//             user: deletedUser,
//             users: allUsers,
//         })
//     } catch (error) {
//         throw error
//     }
// }

export {getAllUsers, getUser};
