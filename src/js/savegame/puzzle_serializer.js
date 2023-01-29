/* typehints:start */
import { GameRoot } from "../game/root";
import { PuzzleGameMode } from "../game/modes/puzzle";
/* typehints:end */
import { StaticMapEntityComponent } from "../game/components/static_map_entity";
import { Vector } from "../core/vector";
import { defaultBuildingVariant } from "../game/meta_building";
import { gMetaBuildingRegistry } from "../core/global_registries";
import { createLogger } from "../core/logging";
import { BaseItem } from "../game/base_item";
import { MetaBlockBuilding } from "../game/buildings/block";
import { MetaProgrammableSignalBuilding } from "../game/buildings/programmable_signal";
import { MetaProgrammableAcceptorBuilding } from "../game/buildings/programmable_acceptor";
import { BOOL_FALSE_SINGLETON, BOOL_TRUE_SINGLETON } from "../game/items/boolean_item";

const logger = createLogger("puzzle-serializer");

export class PuzzleSerializer {
    /**
     * Serializes the game root into a dump
     * @param {GameRoot} root
     * @returns {import("./savegame_typedefs").PuzzleGameData}
     */
    generateDumpFromGameRoot(root) {
        console.log("serializing", root);

        /**
         * @type {import("./savegame_typedefs").PuzzleGameData["buildings"]}
         */
        let buildings = [];
        for (const entity of root.entityMgr.getAllWithComponent(StaticMapEntityComponent)) {
            const staticComp = entity.components.StaticMapEntity;
            const progSignalComp = entity.components.ProgrammableSignal;
            const acceptorComp = entity.components.ProgrammableAcceptor;

            if (progSignalComp) {
                assert(progSignalComp.signalList.length > 0, "signalList missing");
                buildings.push({
                    type: "programmableSignal",
                    signalList: progSignalComp.signalList.map(it => it.getAsCopyableKey()).join(","),
                    pos: {
                        x: staticComp.origin.x,
                        y: staticComp.origin.y,
                        r: staticComp.rotation,
                    },
                });
                continue;
            }

            if (acceptorComp) {
                assert(acceptorComp.expectedSignals.length > 0, "expectedSignals missing");
                buildings.push({
                    type: "programmableAcceptor",
                    expectedSignals: acceptorComp.expectedSignals.map(it => it.getAsCopyableKey()).join(","),
                    pos: {
                        x: staticComp.origin.x,
                        y: staticComp.origin.y,
                        r: staticComp.rotation,
                    },
                });
                continue;
            }

            if (staticComp.getMetaBuilding().id === gMetaBuildingRegistry.findByClass(MetaBlockBuilding).id) {
                buildings.push({
                    type: "block",
                    pos: {
                        x: staticComp.origin.x,
                        y: staticComp.origin.y,
                        r: staticComp.rotation,
                    },
                });
            }
        }

        const mode = /** @type {PuzzleGameMode} */ (root.gameMode);

        const handles = root.hud.parts.buildingsToolbar.buildingHandles;
        const ids = gMetaBuildingRegistry.getAllIds();

        /** @type {Array<string>} */
        let excludedBuildings = [];
        for (let i = 0; i < ids.length; ++i) {
            const handle = handles[ids[i]];
            if (handle && handle.puzzleLocked) {
                // @ts-ignore
                excludedBuildings.push(handle.metaBuilding.getId());
            }
        }

        const excludedBuildingsVariations = root.hud.parts.buildingPlacer.lockedVariants;

        return {
            version: 1,
            buildings,
            bounds: {
                w: mode.zoneWidth,
                h: mode.zoneHeight,
            },
            //read from the toolbar when making a puzzle
            excludedBuildings,
            excludedBuildingsVariations,
        };
    }

    /**
     * Tries to parse a signal list
     * @param {string} codes
     * @returns {BaseItem[]}
     */
    parseSignalList(codes) {
        return codes.split(",").map(code => {
            if (code === "1") {
                return BOOL_TRUE_SINGLETON;
            }
            if (code === "0") {
                return BOOL_FALSE_SINGLETON;
            }
            return null;
        });
    }

    /**
     * @param {GameRoot} root
     * @param {import("./savegame_typedefs").PuzzleGameData} puzzle
     */
    deserializePuzzle(root, puzzle) {
        if (puzzle.version !== 1) {
            return "invalid-version";
        }

        for (const building of puzzle.buildings) {
            switch (building.type) {
                case "programmableSignal": {
                    const signalList = this.parseSignalList(building.signalList);
                    if (!signalList) {
                        return "bad-signalList:" + building.signalList;
                    }

                    const entity = root.logic.tryPlaceBuilding({
                        origin: new Vector(building.pos.x, building.pos.y),
                        building: gMetaBuildingRegistry.findByClass(MetaProgrammableSignalBuilding),
                        originalRotation: building.pos.r,
                        rotation: building.pos.r,
                        rotationVariant: 0,
                        variant: defaultBuildingVariant,
                    });
                    if (!entity) {
                        logger.warn("Failed to place programmableSignal:", building);
                        return "failed-to-place-programmableSignal";
                    }

                    entity.components.ProgrammableSignal.signalList = signalList;
                    break;
                }

                case "programmableAcceptor": {
                    const expectedSignals = this.parseSignalList(building.expectedSignals);
                    if (!expectedSignals) {
                        return "bad-expectedSignals:" + building.expectedSignals;
                    }

                    const entity = root.logic.tryPlaceBuilding({
                        origin: new Vector(building.pos.x, building.pos.y),
                        building: gMetaBuildingRegistry.findByClass(MetaProgrammableAcceptorBuilding),
                        originalRotation: building.pos.r,
                        rotation: building.pos.r,
                        rotationVariant: 0,
                        variant: defaultBuildingVariant,
                    });
                    if (!entity) {
                        logger.warn("Failed to place emitter:", building);
                        return "failed-to-place-emitter";
                    }

                    entity.components.ProgrammableAcceptor.expectedSignals = expectedSignals;
                    break;
                }

                case "block": {
                    const entity = root.logic.tryPlaceBuilding({
                        origin: new Vector(building.pos.x, building.pos.y),
                        building: gMetaBuildingRegistry.findByClass(MetaBlockBuilding),
                        originalRotation: building.pos.r,
                        rotation: building.pos.r,
                        rotationVariant: 0,
                        variant: defaultBuildingVariant,
                    });
                    if (!entity) {
                        logger.warn("Failed to place block:", building);
                        return "failed-to-place-block";
                    }
                    break;
                }
                default: {
                    // @ts-ignore
                    return "invalid-building-type: " + building.type;
                }
            }
        }
    }
}
