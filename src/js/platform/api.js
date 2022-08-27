/* typehints:start */
import { Application } from "../application";
/* typehints:end */
import { createLogger } from "../core/logging";
import { compressX64, decompressX64 } from "../core/lzstring";
import { T } from "../translations";

const logger = createLogger("puzzle-api");

export class ClientAPI {
    /**
     *
     * @param {Application} app
     */
    constructor(app) {
        this.app = app;

        /**
         * The current users session token
         * @type {string|null}
         */
        this.token = localStorage.getItem("dev_api_auth_token");
    }

    getEndpoint() {
        if (G_IS_DEV) {
            return "http://localhost:15001";
        }
        if (window.location.host === "beta.shapez.io") {
            return "https://api-staging.shapez.io";
        }
        return "https://api.shapez.io";
    }

    isLoggedIn() {
        return Boolean(this.token);
    }

    /**
     *
     * @param {string} endpoint
     * @param {object} options
     * @param {"GET"|"POST"|"DELETE"=} options.method
     * @param {any=} options.body
     */
    _request(endpoint, options) {
        const headers = {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json",
        };

        if (this.token) {
            headers["authorization"] = this.token;
        }

        return Promise.race([
            fetch(this.getEndpoint() + endpoint, {
                cache: "no-cache",
                mode: "cors",
                headers,
                method: options.method || "GET",
                body: options.body ? JSON.stringify(options.body) : undefined,
            })
                .then(res => {
                    if (!res.status.toString().startsWith("20")) {
                        throw "bad-status: " + res.status + " / " + res.statusText;
                    }
                    return res;
                })
                .then(res => res.json()),
            new Promise((resolve, reject) => setTimeout(() => reject("timeout"), 15000)),
        ])
            .then(data => {
                if (data && data.error) {
                    logger.warn("Got error from api:", data);
                    throw T.backendErrors[data.error] || data.error;
                }
                return data;
            })
            .catch(err => {
                logger.warn("Failure:", endpoint, ":", err);
                throw err;
            });
    }

    /**
     * @param {string} name
     * @param {string} password
     */
    tryLogin(name, password) {
        return this._request("/v1/login", {
            method: "POST",
            body: {
                name,
                password,
            },
        })
            .then(({ token, trophies }) => {
                this.token = token;
                localStorage.setItem("dev_api_auth_token", token);
                localStorage.setItem("trophies", trophies.toString());
                return true;
            })
            .catch(err => {
                this.token = null;
                localStorage.removeItem("dev_api_auth_token");
                localStorage.removeItem("trophies");
                logger.warn("Failed to login:", err);
                return false;
            });
    }

    async verifyToken() {
        try {
            const userData = await this._request("/v1/login", {
                method: "GET",
            });
            return userData;
        } catch {
            localStorage.removeItem("dev_api_auth_token");
            localStorage.removeItem("trophies");
            return null;
        }
    }

    createUser(name, password) {
        return this._request("/v1/user", {
            method: "POST",
            body: {
                name,
                password,
            },
        });
    }

    /**
     * @param {"new"|"top-rated"|"mine"} category
     * @returns {Promise<import("../savegame/savegame_typedefs").PuzzleMetadata[]>}
     */
    apiListPuzzles(category) {
        if (!this.isLoggedIn()) {
            return Promise.reject("not-logged-in");
        }
        return this._request("/v1/puzzles/list/" + category, {});
    }

    /**
     * @param {{ searchTerm: string; difficulty: string; duration: string }} searchOptions
     * @returns {Promise<import("../savegame/savegame_typedefs").PuzzleMetadata[]>}
     */
    apiSearchPuzzles(searchOptions) {
        if (!this.isLoggedIn()) {
            return Promise.reject("not-logged-in");
        }
        return this._request("/v1/puzzles/search", {
            method: "POST",
            body: searchOptions,
        });
    }

    /**
     * @param {number} puzzleId
     * @returns {Promise<import("../savegame/savegame_typedefs").PuzzleFullData>}
     */
    async apiDownloadPuzzle(puzzleId) {
        if (!this.isLoggedIn()) {
            return Promise.reject("not-logged-in");
        }
        const puzzle = await this._request("/v1/puzzles/download/" + puzzleId, {});
        return { game: JSON.parse(decompressX64(puzzle.game)), meta: puzzle.meta };
    }

    /**
     * @param {number} puzzleId
     * @returns {Promise<import("../savegame/savegame_typedefs").PuzzleFullData>}
     */
    apiDeletePuzzle(puzzleId) {
        if (!this.isLoggedIn()) {
            return Promise.reject("not-logged-in");
        }
        return this._request("/v1/puzzles/delete/" + puzzleId, {
            method: "DELETE",
            body: {},
        });
    }

    /**
     * @param {string} id
     * @returns {Promise<import("../savegame/savegame_typedefs").PuzzleFullData>}
     */
    async apiDownloadPuzzleById(id) {
        if (!this.isLoggedIn()) {
            return Promise.reject("not-logged-in");
        }
        const puzzle = await this._request("/v1/puzzles/download/" + id, {});
        return { game: JSON.parse(decompressX64(puzzle.game)), meta: puzzle.meta };
    }

    /**
     * @param {number} puzzleId
     * @returns {Promise<void>}
     */
    apiReportPuzzle(puzzleId, reason) {
        if (!this.isLoggedIn()) {
            return Promise.reject("not-logged-in");
        }
        return this._request("/v1/puzzles/report/" + puzzleId, {
            method: "POST",
            body: { reason },
        });
    }

    /**
     * @param {number} puzzleId
     * @param {object} payload
     * @param {number} payload.time
     * @param {boolean} payload.liked
     * @param {number} payload.difficultyRating
     * @param {number} payload.componentsUsed
     * @returns {Promise<{ trophies: number, completeData: any }>}
     */
    apiCompletePuzzle(puzzleId, payload) {
        if (!this.isLoggedIn()) {
            return Promise.reject("not-logged-in");
        }
        return this._request("/v1/puzzles/complete/" + puzzleId, {
            method: "POST",
            body: payload,
        });
    }

    /**
     * @param {object} payload
     * @param {string} payload.title
     * @param {string} payload.shortKey
     * @param {string} payload.description
     * @param {number} payload.minimumComponents
     * @param {number|undefined} payload.maximumComponents
     * @param {import("../savegame/savegame_typedefs").PuzzleGameData} payload.data
     * @returns {Promise<{ success: true }>}
     */
    apiSubmitPuzzle(payload) {
        if (!this.isLoggedIn()) {
            return Promise.reject("not-logged-in");
        }
        return this._request("/v1/puzzles/submit", {
            method: "POST",
            body: {
                ...payload,
                data: compressX64(JSON.stringify(payload.data)),
            },
        });
    }
}
