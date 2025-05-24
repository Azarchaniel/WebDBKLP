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
    parent: [{type: Schema.Types.ObjectId, ref: 'BoardGame', required: false}],
    children: [{type: Schema.Types.ObjectId, ref: 'BoardGame', required: false}],
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

boardGameSchema.post('save', async function(doc) {
    // id board game was saved with parent field, find parent and add this board game to its children
    if (doc.parent && doc.parent.length > 0) {
        await mongoose.model('BoardGame').findOneAndUpdate(
            { _id: { $in: doc.parent } },
            { $addToSet: { children: doc._id } }
        );
    }
});

boardGameSchema.pre('findOneAndUpdate', async function() {
    // if parent was deleted remove also it's children
    const update = this.getUpdate();

    // Check if this is a soft delete operation (setting deletedAt)
    if (update && typeof update === 'object' && "deletedAt" in update && update.deletedAt) {
        const query = this.getQuery();
        const id = query._id;

        // Cascade the soft delete to children
        await mongoose.model('BoardGame').updateMany(
            { parent: { $in: [id] } },
            { deletedAt: update.deletedAt }
        );

        // Remove this board game's ID from all parents' children arrays
        await mongoose.model('BoardGame').updateMany(
            { children: id },
            { $pull: { children: id } }
        );
    }
});
applyNormalizeSearchMiddleware(boardGameSchema, ['save', 'updateOne', 'findOneAndUpdate', 'deleteOne', 'findOneAndDelete'], "boardGame");
applyFullNameMiddleware(boardGameSchema, ['save', 'updateOne', 'findOneAndUpdate', 'deleteOne', 'findOneAndDelete']);

export default model<IBoardGame>('BoardGame', boardGameSchema);