import {PipelineStage} from "mongoose";
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
export const buildPaginationPipeline = (page: number, pageSize: number, sortOptions: { [key: string]: 1 | -1 }): PipelineStage[] => {
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
            [`normalizedSearchField.${field}`]: {$regex: diacritics.remove(search).replace(/-/g, ""), $options: "i"}
        }))
    };
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
 * @param {string[]} searchFields - The fields to search in.
 * @param {PipelineStage[]} lookupStages - The lookup stages for the aggregation pipeline.
 * @param {Record<string, any>} additionalQuery - Additional query parameters.
 * @returns {Promise<{data: any[], count: number, latestUpdate?: Date | undefined}>} - The data, count, and latest update.
 */
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
    additionalQuery: Record<string, any> = {}
): Promise<{ data: any[], count: number, latestUpdate?: Date | undefined }> => {
    const {page = "1", pageSize = "10_000", search = "", sorting, dataFrom, searchFields = []} = options;

    const latestUpdate: { updatedAt: Date | undefined } = await model.findOne().sort({ updatedAt: -1 }).select('updatedAt').lean() as unknown as { updatedAt: Date | undefined };

    // Check if dataFrom is provided and if it's more recent than the latest update
    if (dataFrom && latestUpdate?.updatedAt && new Date(dataFrom as string) >= new Date(latestUpdate.updatedAt)) {
        // No new data, send 204 No Content and return
        return {data: [], count: 0, latestUpdate: latestUpdate?.updatedAt};
    }

    const sortOptions = parseSorting(sorting);
    const searchQuery = buildSearchQuery(search, searchFields);
    const defaultQuery = buildDefaultQuery();
    const paginationPipeline = buildPaginationPipeline(parseInt(page as string), parseInt(pageSize as string), sortOptions);

    const query = {
        ...defaultQuery,
        ...searchQuery,
        ...additionalQuery
    };

    const pipeline: PipelineStage[] = [
        {$match: query},
        ...lookupStages
    ];

    const data = await model.aggregate([...pipeline, ...paginationPipeline]).collation({locale: "cs", strength: 2, numericOrdering: true});
    const count = (await model.aggregate(pipeline)).length;

    return {data, count, latestUpdate: latestUpdate?.updatedAt};
};