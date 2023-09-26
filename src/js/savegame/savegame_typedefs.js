/**
 * @typedef {import("../game/entity").Entity} Entity
 *
 * @typedef {{
 *   id: string;
 *   version: string;
 *   website: string;
 *   name: string;
 *   author: string;
 * }[]} SavegameStoredMods
 *
 * @typedef {{
 *   failedMam: boolean,
 *   trashedCount: number,
 *   usedInverseRotater: boolean
 * }} SavegameStats
 *
 * @typedef {{
 *   camera: any,
 *   time: any,
 *   entityMgr: any,
 *   map: any,
 *   gameMode: object,
 *   hubGoals: any,
 *   pinnedShapes: any,
 *   waypoints: any,
 *   entities: Array<Entity>,
 *   beltPaths: Array<any>,
 *   modExtraData: Object
 * }} SerializedGame
 *
 * @typedef {{
 *   version: number,
 *   dump: SerializedGame,
 *   stats: SavegameStats,
 *   lastUpdate: number,
 *   mods: SavegameStoredMods
 * }} SavegameData
 *
 * @typedef {{
 *   lastUpdate: number,
 *   version: number,
 *   internalId: string,
 *   level: number
 *   name?: string
 * }} SavegameMetadata
 *
 * @typedef {{
 *   version: number,
 *   savegames: Array<SavegameMetadata>
 * }} SavegamesData
 */

// Notice: Update backend too
/**
 * @typedef {{
 * id: number;
 * shortKey: string;
 * likes: number;
 * downloads: number;
 * completions: number;
 * difficulty?: string;
 * difficultyRating?: string;
 * averageTime?: number;
 * averageDifficultyRating?: number;
 * title: string;
 * author: string;
 * authorName: string;
 * afterCompletingMessage?: string;
 * minimumComponents: number;
 * maximumComponents?: number;
 * minimumNands: number;
 * createdAt: string;
 * completed: boolean;
 * liked: boolean;
 * canPlay: boolean;
 * locale: string;
 * }} PuzzleMetadata
 */

/**
 * @typedef {{
 *   type: "emitter";
 *   item: string;
 *   pos: { x: number; y: number; r: number }
 * }} PuzzleGameBuildingConstantProducer
 */

/**
 * @typedef {{
 *   type: "goal";
 *   item: string;
 *   pos: { x: number; y: number; r: number }
 * }} PuzzleGameBuildingGoal
 */

/**
 * @typedef {{
 *   type: "block";
 *   pos: { x: number; y: number; r: number }
 * }} PuzzleGameBuildingBlock
 */

/**
 * @typedef {{
 *   type: "programmableSignal";
 *   signalList: string;
 *   pos: { x: number; y: number; r: number }
 * }} PuzzleGameBuildingProgrammableSignal
 */

/**
 * @typedef {{
 *   type: "programmableAcceptor";
 *   expectedSignals: string;
 *   pos: { x: number; y: number; r: number }
 * }} PuzzleGameBuildingProgrammableAcceptor
 */

/**
 * @typedef {{
 *   version: number;
 *   bounds: { w: number; h: number; },
 *   buildings: (PuzzleGameBuildingBlock|PuzzleGameBuildingProgrammableSignal|PuzzleGameBuildingProgrammableAcceptor)[],
 *   excludedBuildings: Array<string>,
 * }} PuzzleGameData
 */

/**
 * @typedef {{
 *   meta: PuzzleMetadata & {
 *     description?: string;
 *     difficultyRating?: string;
 *   };
 *   game: PuzzleGameData;
 * }} PuzzleFullData
 */

/**
 * @typedef {{
 * id: string
 * puzzleId: number
 * userId: string | null
 * locale: string
 * title: string
 * description: string
 * approved: boolean
 * reviewerId: string | null
 * reviewedAt: Date | null
 * createdAt: Date
 * }} PuzzleTranslation
 */

export default {};
