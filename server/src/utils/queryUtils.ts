import {PipelineStage, Types} from "mongoose";
import diacritics from "diacritics";

interface SortParam {
    id: string;
    desc: string;
}

interface PaginationOptions {
    page?: string | number;
    pageSize?: string | number;
    search?: string;
    sorting?: string | SortParam[];
    filterUsers?: string[];
    dataFrom?: string;
    searchFields?: string[];
    filters?: { id: string; value: string }[];
}

/**
 * Parses sorting parameters from a query string or array.
 *
 * @param {string | SortParam[] | undefined} sorting - The sorting parameters from the query.
 * @returns {{ [key: string]: 1 | -1 }} - The MongoDB sort object.
 */
export const parseSorting = (sorting: string | SortParam[] | undefined): { [key: string]: 1 | -1 } => {
    let sortParams: SortParam[] = [];
    if (typeof sorting === "string") {
        sortParams = JSON.parse(sorting);
    } else if (Array.isArray(sorting)) {
        sortParams = sorting;
    }

    const sortOptions: { [key: string]: 1 | -1 } = {};
    if (sortParams.length > 0) {
        const dimensions = ["height", "width", "depth", "weight"];

        sortParams.forEach((param) => {
            if (dimensions.includes(param.id)) param.id = "dimensions." + param.id;
            sortOptions[param.id] = param.desc === "true" ? -1 : 1;
        });
    }

    return sortOptions;
};

/**
 * Builds the pagination pipeline stages for MongoDB aggregation.
 *
 * @param {number} page - The current page number.
 * @param {number} pageSize - The number of items per page.
 * @param {object} sortOptions - The MongoDB sort object.
 * @returns {PipelineStage[]} - The pagination pipeline stages.
 */
export const buildPaginationPipeline = (page: number, pageSize: number, sortOptions: {
    [key: string]: 1 | -1
}): PipelineStage[] => {
    return [
        {$sort: sortOptions},
        {$skip: (page - 1) * pageSize},
        {$limit: pageSize},
    ];
};

/**
 * Builds the search query for MongoDB.
 *
 * @param {string} search - The search term.
 * @param {string[]} searchFields - The fields to search in.
 * @returns {Record<string, any>} - The MongoDB search query.
 */
export const buildSearchQuery = (search: string, searchFields: string[]): Record<string, any> => {
    if (!search) return {};

    return {
        $or: searchFields.map(field => ({
            [`normalizedSearchField.${field}`]: {
                $regex: diacritics.remove(search ?? "")?.replace(/-/g, ""),
                $options: "i"
            }
        }))
    };
};

const buildFilterCondition = (field: string, value: any, operator?: string): any => {
    if (!operator || operator === '=') {
        return {[field]: value};
    } else if (operator === '<') {
        return {[field]: {$lt: value}};
    } else if (operator === '>') {
        return {[field]: {$gt: value}};
    }

    // Default case - exact match
    return {[field]: value};
};

const isMongoId = (value: string): boolean => /^[a-f\d]{24}$/i.test(value);

/**
 * Builds the filter query for MongoDB.
 *
 * @param {Array<{id: string, value: string}>} filters - The filters to apply.
 * @returns {Record<string, any>} - The MongoDB filter query.
 */
const buildFilterQuery = (filters: {
    id: string;
    value: string | string[];
    operator?: string
}[]): Record<string, any> => {
    if (!filters || filters.length === 0) return {};

    const filterQuery: Record<string, any> = {};
    filters.forEach(({id, value, operator}) => {
        if (value !== undefined && value !== null && value !== '') {
            if (id === "exLibris") {
                filterQuery[id] = value === 'Y';
            } else if (operator) {
                Object.assign(filterQuery, buildFilterCondition(id, Number(value), operator));
            } else if (value && Array.isArray(value)) {
                // Handle array values (multi-select filters)
                const nonEmptyValues = value.filter(v => v?.trim() !== "");
                if (nonEmptyValues.length > 0) {
                    filterQuery[id] = {
                        $in: nonEmptyValues.map(v => {
                            const strValue = v || ""; // Ensure value is a string
                            return isMongoId(strValue) ? new Types.ObjectId(strValue) : diacritics.remove(String(strValue)).replace(/-/g, "");
                        })
                    };
                }
            } else if (value && value?.trim() !== "") {
                const strValue = value || ""; // Ensure value is a string
                filterQuery[id] = isMongoId(strValue)
                    ? new Types.ObjectId(strValue)
                    : {$regex: diacritics.remove(String(strValue)).replace(/-/g, ""), $options: "i"};
            }
        }
    });

    return filterQuery;
};

/**
 * Builds the default query for deletedAt.
 *
 * @returns {Record<string, any>} - The MongoDB default query.
 */
export const buildDefaultQuery = (): Record<string, any> => {
    return {deletedAt: {$eq: null}};
};

/**
 * Builds the aggregation pipeline for fetching data with pagination, sorting, and searching.
 *
 * @param {any} model - The Mongoose model.
 * @param {PaginationOptions} options - The pagination options.
 * @param {PipelineStage[]} lookupStages - The lookup stages for the aggregation pipeline.
 * @param {Record<string, any>} additionalQuery - Additional query parameters.
 * @returns {Promise<{data: any[], count: number, latestUpdate?: Date | undefined}>} - The data, count, and latest update.
 */
export const fetchDataWithPagination = async (
    model: any,
    options: PaginationOptions,
    lookupStages: PipelineStage[] = [],
    additionalQuery: Record<string, any> = {},
): Promise<{ data: any[], count: number, latestUpdate?: Date | undefined }> => {
    const {page = "1", pageSize = "10_000", search = "", sorting, dataFrom, searchFields = [], filters = []} = options;

    const latestUpdate: {
        updatedAt: Date | undefined
    } = await model.findOne().sort({updatedAt: -1}).select('updatedAt').lean() as unknown as {
        updatedAt: Date | undefined
    };

    // Check if dataFrom is provided and if it's more recent than the latest update
    if (dataFrom && latestUpdate?.updatedAt && new Date(dataFrom as string) >= new Date(latestUpdate.updatedAt)) {
        // No new data, send 204 No Content and return
        return {data: [], count: 0, latestUpdate: latestUpdate?.updatedAt};
    }

    const sortOptions = parseSorting(sorting);
    const searchQuery = buildSearchQuery(search, searchFields);
    const filterQuery = buildFilterQuery(filters);
    const defaultQuery = buildDefaultQuery();
    const paginationPipeline = buildPaginationPipeline(parseInt(page as string), parseInt(pageSize as string), sortOptions);

    const query = {
        ...defaultQuery,
        ...searchQuery,
        ...filterQuery,
        ...additionalQuery
    };

    const pipeline: PipelineStage[] = [
        {$match: query},
        ...lookupStages
    ];

    const data = await model.aggregate([...pipeline, ...paginationPipeline]).collation({
        locale: "cs",
        strength: 2,
        numericOrdering: true
    });
    const count = (await model.aggregate(pipeline)).length;

    return {data, count, latestUpdate: latestUpdate?.updatedAt};
};