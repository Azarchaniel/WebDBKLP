import {model, Schema} from 'mongoose'
import {IBoardGame} from "../types";
import {applyFullNameMiddleware, applyNormalizeSearchMiddleware, baseSchema} from "./baseSchema";
import {publishedSchema} from "./published";
import mongoose from "mongoose";

const rangeSchema = new Schema({
    from: {type: Number, required: false},
    to: {type: Number, required: false}
}, { _id: false });

const boardGameSchema = new Schema({
    title: {type: String, required: true},
    image: {type: String, required: false},
    noPlayers: {type: rangeSchema, required: false},
    playTime: {type: rangeSchema, required: false},
    ageRecommendation: {type: rangeSchema, required: false},
    published: {type: publishedSchema, required: false},
    autor: {type: [mongoose.Schema.Types.ObjectId], ref: 'Autor', required: false},
    picture: {type: String, required: false},
    url: {type: String, required: false},
    expansions: [{type: Schema.Types.ObjectId, ref: 'BoardGame', required: false}],
    note: {type: String, required: false},
}, {
    timestamps: true
})

boardGameSchema.add(baseSchema);

boardGameSchema.index({
    "normalizedSearchField.title": "text",
    "normalizedSearchField.published.publisher": "text",
    "normalizedSearchField.autor": "text"
});

applyNormalizeSearchMiddleware(boardGameSchema, ['save', 'updateOne', 'findOneAndUpdate', 'deleteOne', 'findOneAndDelete'], "boardGame");
applyFullNameMiddleware(boardGameSchema, ['save', 'updateOne', 'findOneAndUpdate', 'deleteOne', 'findOneAndDelete']);

export default model<IBoardGame>('BoardGame', boardGameSchema);