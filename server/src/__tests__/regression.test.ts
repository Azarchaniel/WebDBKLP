import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";
import type { Request, Response, NextFunction } from "express";

import User from "../models/user";
import { loginGuest, refreshToken } from "../controllers/usersC";
import { normalizeBook } from "../controllers/booksC";
import { blockGuest, userVerification } from "../middleware";
import { buildFilterQuery, buildPaginationPipeline, buildSearchQuery, fetchDataWithPagination, parseSorting } from "../utils/queryUtils";

type MockResponse = Response & {
    statusCodeValue?: number;
    body?: unknown;
    cookiesSet: { name: string; value: string; options: Record<string, unknown> }[];
};

const createResponse = (): MockResponse => {
    const res: any = {
        cookiesSet: [],
        status(code: number) {
            this.statusCodeValue = code;
            return this as MockResponse;
        },
        json(body: unknown) {
            this.body = body;
            return this as MockResponse;
        },
        cookie(name: string, value: string, options: Record<string, unknown> = {}) {
            this.cookiesSet?.push({ name, value, options });
            return this as MockResponse;
        },
        clearCookie() {
            return this as MockResponse;
        },
        send(body: unknown) {
            this.body = body;
            return this as MockResponse;
        }
    };

    return res as MockResponse;
};

test("auth refresh issues a short-lived access token cookie", async (t) => {
    process.env.SECRET_KEY = "test-access-secret";
    process.env.REFRESH_TOKEN_SECRET = "test-refresh-secret";

    const userId = new Types.ObjectId().toString();
    const storedRefreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "3d" });
    const originalFindOne = (User as any).findOne;

    t.after(() => {
        (User as any).findOne = originalFindOne;
    });

    (User as any).findOne = async (query: Record<string, unknown>) => {
        assert.equal(query._id, userId);
        assert.equal(query.refreshTokens, storedRefreshToken);
        return { _id: userId };
    };

    const req = { cookies: { refreshToken: storedRefreshToken } } as unknown as Request;
    const res = createResponse();

    await refreshToken(req, res);

    assert.equal(res.statusCodeValue, 200);
    assert.equal(typeof (res.body as { tokenExpiresAt: number }).tokenExpiresAt, "number");
    const tokenCookie = res.cookiesSet.find(cookie => cookie.name === "token");
    assert.ok(tokenCookie);
    assert.equal(tokenCookie.options.httpOnly, true);
    assert.equal(tokenCookie.options.secure, true);
    assert.equal(tokenCookie.options.sameSite, "none");
    assert.equal(tokenCookie.options.maxAge, 15 * 60 * 1000);

    const decoded = jwt.verify(tokenCookie.value, process.env.SECRET_KEY) as jwt.JwtPayload;
    assert.equal(decoded.userId, userId);
});

test("guest write requests are blocked before mutating handlers run", () => {
    process.env.SECRET_KEY = "test-access-secret";

    const guestToken = jwt.sign(
        { userId: "guest", email: "guest", role: "guest" },
        process.env.SECRET_KEY,
        { expiresIn: "24h" }
    );
    const req = { headers: { authorization: `Bearer ${guestToken}` }, cookies: {} } as unknown as Request;
    const res = createResponse();
    let nextCalled = false;
    const next: NextFunction = () => {
        nextCalled = true;
    };

    blockGuest(req, res, next);

    assert.equal(nextCalled, false);
    assert.equal(res.statusCodeValue, 403);
    assert.deepEqual(res.body, { message: "Guest users cannot modify data" });
});

test("book CRUD normalization keeps form payloads in database shape", () => {
    const authorId = new Types.ObjectId().toString();
    const ownerId = new Types.ObjectId().toString();
    const readerId = new Types.ObjectId().toString();

    const normalized = normalizeBook({
        autor: [{ _id: authorId }],
        editor: [],
        translator: [],
        ilustrator: [],
        readBy: [{ _id: readerId }],
        owner: [{ _id: ownerId }],
        title: "Regression Book",
        published: {
            publisher: "Publisher",
            year: 2024,
            country: [{ key: "SK", value: "Slovakia" }]
        },
        location: {
            city: [{ key: "ba", value: "Bratislava" }],
            shelf: "A1"
        },
        language: [{ key: "sk", value: "Slovak" }],
        numberOfPages: "321",
        dimensions: {
            height: "20,5",
            width: "13.2",
            thickness: "",
            weight: "450"
        },
        exLibris: "Y"
    });

    assert.deepEqual(normalized.autor, [authorId]);
    assert.deepEqual(normalized.owner, [ownerId]);
    assert.deepEqual(normalized.readBy, [readerId]);
    assert.equal(normalized.published?.country, "SK");
    assert.equal(normalized.location?.city, "Bratislava");
    assert.deepEqual(normalized.language, ["sk"]);
    assert.equal(normalized.numberOfPages, 321);
    assert.equal(normalized.dimensions?.height?.toString(), "20.5");
    assert.equal(normalized.dimensions?.width?.toString(), "13.2");
    assert.equal(normalized.dimensions?.thickness, undefined);
    assert.equal(normalized.dimensions?.weight?.toString(), "450");
});

test("pagination and filter query helpers build expected aggregation input", () => {
    const ownerId = new Types.ObjectId().toString();
    const pipeline = buildPaginationPipeline(3, 25, { title: 1 });
    assert.deepEqual(pipeline, [
        { $sort: { title: 1 } },
        { $skip: 50 },
        { $limit: 25 }
    ]);

    const query = buildFilterQuery([
        { id: "owner", value: [ownerId, "sci-fi"] },
        { id: "exLibris", value: "Y" },
        { id: "createdAt", value: "2026-07-14", operator: "=" },
        { id: "dimensions.height", value: "20", operator: ">" }
    ]);

    assert.equal(query.exLibris, true);
    assert.equal(query.owner.$in[0].toString(), ownerId);
    assert.equal(query.owner.$in[1], "scifi");
    assert.equal(query["dimensions.height"].$gt, 20);
    assert.equal(query.createdAt.$gte.getHours(), 0);
    assert.equal(query.createdAt.$gte.getMinutes(), 0);
    assert.equal(query.createdAt.$lte.getHours(), 23);
    assert.equal(query.createdAt.$lte.getMinutes(), 59);
});
test("guest login returns guest identity and a signed access cookie", () => {
    process.env.SECRET_KEY = "test-access-secret";
    const res = createResponse();

    loginGuest({} as Request, res);

    assert.equal(res.statusCodeValue, 200);
    assert.equal((res.body as { user: { role: string } }).user.role, "guest");
    const tokenCookie = res.cookiesSet.find(cookie => cookie.name === "token");
    assert.ok(tokenCookie);
    assert.equal(tokenCookie.options.httpOnly, true);
    assert.equal(tokenCookie.options.maxAge, 24 * 60 * 60 * 1000);

    const decoded = jwt.verify(tokenCookie.value, process.env.SECRET_KEY) as jwt.JwtPayload;
    assert.equal(decoded.userId, "guest");
    assert.equal(decoded.email, "guest");
    assert.equal(decoded.role, "guest");
});

test("authenticated user middleware accepts cookie token and exposes user data", () => {
    process.env.SECRET_KEY = "test-access-secret";
    const token = jwt.sign(
        { userId: "user-1", email: "user@example.test", role: "user" },
        process.env.SECRET_KEY,
        { expiresIn: "15m" }
    );
    const req = { cookies: { token }, headers: {} } as unknown as Request;
    const res = createResponse();
    let nextCalled = false;

    userVerification(req, res, () => {
        nextCalled = true;
    });

    assert.equal(nextCalled, true);
    assert.deepEqual((res as any).userData, { userId: "user-1", role: "user" });
});

test("guest blocking lets regular authenticated users continue", () => {
    process.env.SECRET_KEY = "test-access-secret";
    const userToken = jwt.sign(
        { userId: "user-1", email: "user@example.test", role: "user" },
        process.env.SECRET_KEY,
        { expiresIn: "15m" }
    );
    const req = { headers: { authorization: `Bearer ${userToken}` }, cookies: {} } as unknown as Request;
    const res = createResponse();
    let nextCalled = false;

    blockGuest(req, res, () => {
        nextCalled = true;
    });

    assert.equal(nextCalled, true);
    assert.equal(res.statusCodeValue, undefined);
});

test("search and sorting helpers normalize common table inputs", () => {
    const objectId = new Types.ObjectId().toString();
    const searchQuery = buildSearchQuery("Prilis zlutoucky kun", ["title", "note"]);
    assert.deepEqual(searchQuery, {
        $or: [
            { "normalizedSearchField.title": { $regex: "Prilis\\s+zlutoucky\\s+kun", $options: "i" } },
            { "normalizedSearchField.note": { $regex: "Prilis\\s+zlutoucky\\s+kun", $options: "i" } }
        ]
    });

    const idSearchQuery = buildSearchQuery(objectId, ["title"]);
    assert.equal(idSearchQuery.$or[1]._id.toString(), objectId);
    assert.deepEqual(parseSorting([{ id: "height", desc: true }, { id: "title", desc: false }]), {
        "dimensions.height": -1,
        title: 1
    });
});

test("fetchDataWithPagination builds one faceted aggregation for rows and count", async () => {
    const aggregateCalls: any[][] = [];
    let collationOptions: unknown;
    const latestUpdate = new Date("2026-07-14T10:00:00.000Z");

    const model = {
        findOne() {
            return {
                sort() { return this; },
                select() { return this; },
                lean: async () => ({ updatedAt: latestUpdate })
            };
        },
        aggregate(pipeline: any[]) {
            aggregateCalls.push(pipeline);
            return {
                collation: async (options: unknown) => {
                    collationOptions = options;
                    return [{ data: [{ title: "Book A" }], count: [{ count: 1 }] }];
                }
            };
        }
    };

    const result = await fetchDataWithPagination(
        model,
        {
            page: 2,
            pageSize: 25,
            search: "Book",
            sorting: [{ id: "title", desc: false }],
            searchFields: ["title"],
            filters: [{ id: "exLibris", value: "Y" }]
        }
    );

    assert.deepEqual(result, {
        data: [{ title: "Book A" }],
        count: 1,
        latestUpdate
    });
    assert.equal(aggregateCalls.length, 1);
    assert.deepEqual(aggregateCalls[0][0].$match.exLibris, true);
    assert.deepEqual(aggregateCalls[0][1], {
        $facet: {
            data: [{ $sort: { title: 1 } }, { $skip: 25 }, { $limit: 25 }],
            count: [{ $count: "count" }]
        }
    });
    assert.deepEqual(collationOptions, { locale: "cs", strength: 2, numericOrdering: true });
});
