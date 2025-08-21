import { Schema, Document, Query } from 'mongoose';
import { normalizeSearchFields, stringifyName } from "../utils/utils";

export interface IBase extends Document {
    deletedAt?: Date;
    normalizedSearchField?: any;
    updatedAt?: Date;
    createdAt?: Date;
    fullName?: string;
}

export const baseSchema = new Schema<IBase>({
    deletedAt: { type: Date, required: false },
    normalizedSearchField: { type: JSON, required: false },
    fullName: { type: String, required: false }
}, { timestamps: true });

/**
 * Middleware for normalizing search fields.
 *
 * @param {string} modelName - The name of the model.
 * @returns {Function} - The middleware function.
 */
export const normalizeSearchMiddleware = (modelName: string) => {
    return async function (this: Document | Query<any, any>, next: any) {
        try {
            let docInstance = this;

            if (Array.isArray(docInstance)) {
                docInstance = docInstance[0];
            }

            if (docInstance instanceof Document) {
                // For `save` middleware
                const normalizedFields = await normalizeSearchFields(docInstance, modelName);
                (docInstance as any).normalizedSearchField = normalizedFields;
            } else {
                // @ts-ignore
                const updateQuery = this.getUpdate();

                // Fetch the current document
                // @ts-ignore
                const doc = await this.model.findOne(this.getQuery());

                // Merge old doc with updateQuery to get the new state
                const mergedDoc = doc ? { ...doc.toObject(), ...updateQuery } : updateQuery;

                // Normalize using the merged document
                const normalizedFields = await normalizeSearchFields(mergedDoc, modelName);

                // @ts-ignore
                this.setUpdate({
                    ...updateQuery,
                    normalizedSearchField: normalizedFields
                });
            }
        } catch (error) {
            console.error(`Error in middleware when normalizing ${modelName}`, error);
            next();
        }

        next();
    };
};

/**
 * Middleware for updating updatedAt.
 *
 * @returns {Function} - The middleware function.
 */
export const updateAtMiddleware = () => {
    return function (this: Query<any, any>, next: any) {
        this.set({ updatedAt: new Date() });
        next();
    };
};

/**
 * Middleware for creating fullName.
 *
 * @returns {Function} - The middleware function.
 */
export const fullNameMiddleware = () => {
    return async function (this: Document | Query<any, any>, next: any) {
        try {
            const docInstance = this;

            if (docInstance instanceof Document) {
                (docInstance as any).fullName = stringifyName(docInstance);
            } else {
                // @ts-ignore
                const updateQuery = this.getUpdate();

                // Fetch the current document (if needed) to normalize fields
                // @ts-ignore
                const doc = await this.model.findOne(this.getQuery());

                if (doc) {
                    // @ts-ignore
                    this.setUpdate({
                        ...updateQuery,
                        fullName: stringifyName(doc),
                    });
                }
            }
        } catch (error) {
            console.error(`Error in middleware when creating fullName`, error);
            next();
        }

        next();
    };
};

/**
 * Applies the updateAtMiddleware to the specified hooks.
 *
 * @param {Schema} schema - The Mongoose schema.
 * @param {string[]} hooks - The hooks to apply the middleware to.
 */
export const applyUpdateAtMiddleware = (schema: Schema, hooks: string[]) => {
    hooks.forEach((hook: any) => {
        schema.pre(hook, updateAtMiddleware());
    });
};

/**
 * Applies the normalizeSearchMiddleware to the specified hooks.
 *
 * @param {Schema} schema - The Mongoose schema.
 * @param {string[]} hooks - The hooks to apply the middleware to.
 * @param {string} modelName - The name of the model.
 */
export const applyNormalizeSearchMiddleware = (schema: Schema, hooks: string[], modelName: string) => {
    hooks.forEach((hook: any) => {
        schema.pre(hook, normalizeSearchMiddleware(modelName));
    });
};

/**
 * Applies the fullNameMiddleware to the specified hooks.
 *
 * @param {Schema} schema - The Mongoose schema.
 * @param {string[]} hooks - The hooks to apply the middleware to.
 */
export const applyFullNameMiddleware = (schema: Schema, hooks: string[]) => {
    hooks.forEach((hook: any) => {
        schema.pre(hook, fullNameMiddleware());
    });
};