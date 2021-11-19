"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUser = exports.deleteUser = exports.updateUser = exports.addUser = exports.getAllUsers = void 0;
const user_1 = __importDefault(require("../models/user"));
const getAllUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield user_1.default.find();
        res.status(200).json({ users: users });
    }
    catch (error) {
        res.status(400);
        throw error;
    }
});
exports.getAllUsers = getAllUsers;
const getUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield user_1.default.findById(req.params.id);
        const allUsers = yield user_1.default.find();
        res.status(200).json({ user: user, allUsers: allUsers });
    }
    catch (err) {
        throw err;
    }
});
exports.getUser = getUser;
const addUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { firstName, lastName, hashedPassword } = req.body;
    try {
        const user = new user_1.default({
            firstName: firstName,
            lastName: lastName,
            hashedPassword: hashedPassword
        });
        const newUser = yield user.save();
        const allUsers = yield user_1.default.find();
        res.status(201).json({ message: 'User added', user: newUser, users: allUsers });
    }
    catch (error) {
        throw error;
    }
});
exports.addUser = addUser;
const updateUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { params: { id }, body, } = req;
        const updateUser = yield user_1.default.findByIdAndUpdate({ _id: id }, body);
        const allUsers = yield user_1.default.find();
        res.status(200).json({
            message: 'User updated',
            user: updateUser,
            users: allUsers,
        });
    }
    catch (error) {
        throw error;
    }
});
exports.updateUser = updateUser;
const deleteUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { params: { id }, body, } = req;
        const deletedUser = yield user_1.default.findByIdAndUpdate({ _id: id }, Object.assign(Object.assign({}, body), { isDeleted: true }));
        const allUsers = yield user_1.default.find();
        res.status(200).json({
            message: 'User deleted',
            user: deletedUser,
            users: allUsers,
        });
    }
    catch (error) {
        throw error;
    }
});
exports.deleteUser = deleteUser;
