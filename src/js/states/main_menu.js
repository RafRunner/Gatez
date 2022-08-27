import { cachebust } from "../core/cachebust";
import { A_B_TESTING_LINK_TYPE, globalConfig, THIRDPARTY_URLS } from "../core/config";
import { GameState } from "../core/game_state";
import { DialogWithForm } from "../core/modal_dialog_elements";
import { FormElementInput } from "../core/modal_dialog_forms";
import { ReadWriteProxy } from "../core/read_write_proxy";
import {
    formatSecondsToTimeAgo,
    generateFileDownload,
    isSupportedBrowser,
    makeButton,
    makeDiv,
    makeDivElement,
    removeAllChildren,
    startFileChoose,
    waitNextFrame,
} from "../core/utils";
import { HUDModalDialogs } from "../game/hud/parts/modal_dialogs";
import { MODS } from "../mods/modloader";
import { PlatformWrapperImplBrowser } from "../platform/browser/wrapper";
import { Savegame } from "../savegame/savegame";
import { T } from "../translations";

const trim = require("trim");

/**
 * @typedef {import("../savegame/savegame_typedefs").SavegameMetadata} SavegameMetadata
 * @typedef {import("../profile/setting_types").EnumSetting} EnumSetting
 */

export class MainMenuState extends GameState {
    constructor() {
        super("MainMenuState");
    }

    getInnerHTML() {
        const showLanguageIcon = !G_CHINA_VERSION && !G_WEGAME_VERSION;
        const showExitAppButton = G_IS_STANDALONE;
        const showBrowserWarning = !G_IS_STANDALONE && !isSupportedBrowser();
        const showWegameFooter = G_WEGAME_VERSION;

        let showExternalLinks = true;

        if (G_IS_STANDALONE) {
            if (G_WEGAME_VERSION || G_CHINA_VERSION) {
                showExternalLinks = false;
            }
        } else {
            const wrapper = /** @type {PlatformWrapperImplBrowser} */ (this.app.platformWrapper);
            if (!wrapper.embedProvider.externalLinks) {
                showExternalLinks = false;
            }
        }

        let showUpstreamLink = showExternalLinks;
        if (G_CHINA_VERSION) {
            showUpstreamLink = true;
        }

        return `
            <div class="topButtons">
                ${
                    showLanguageIcon
                        ? `<button class="languageChoose" data-languageicon="${this.app.settings.getLanguage()}"></button>`
                        : ""
                }

                <button class="settingsButton"></button>
                ${showExitAppButton ? `<button class="exitAppButton"></button>` : ""}
            </div>

            <video autoplay muted loop class="fullscreenBackgroundVideo">
                <source src="${cachebust("res/bg_render.webm")}" type="video/webm">
            </video>

            <div class="logo">
                <!-- Add new logo here -->
            </div>

            <div class="mainWrapper" data-columns="1">

            <div class="puzzleContainer">
                <h3>${T.mainMenu.puzzleModeTitle}</h3>
                    <div class="buttons">
                        <button class="styledButton puzzleDlcPlayButton playButton" style="background-color: #66bb6a">${
                            this.app.isLoggedIn ? T.mainMenu.play : T.mainMenu.signin
                        }</button>
                        ${
                            !this.app.isLoggedIn
                                ? `
                                <div class="outer">
                                    <button class="styledButton commonButton">${T.mainMenu.playOffline}</button>
                                    <button class="styledButton createAccountButton createButton">${T.mainMenu.crateAccount}</button>
                                </div>`
                                : ""
                        }
                    </div>
            </div>

            <div class="sandboxContainer">
                <h3>${T.mainMenu.sandboxModeTitle}</h3>
                    ${
                        showBrowserWarning
                            ? `<div class="browserWarning">${T.mainMenu.browserWarning}</div>`
                            : ""
                    }
                    <div class="buttons"></div>
            </div>
        </div>

            ${
                showWegameFooter
                    ? `
                <div class='footer wegameDisclaimer'>
                        <div class="disclaimer">
                            健康游戏忠告
                            <br>
                            抵制不良游戏,拒绝盗版游戏。注意自我保护,谨防受骗上当。<br>
                            适度游戏益脑,沉迷游戏伤身。合理安排时间,享受健康生活。
                        </div>

                        <div class="rating"></div>
                    </div>
                    `
                    : `

                <div class="footer ${showExternalLinks ? "" : "noLinks"} ">
                    ${
                        showExternalLinks
                            ? `
                        <a class="githubLink boxLink" target="_blank">
                            ${T.mainMenu.openSourceHint}
                            <span class="thirdpartyLogo githubLogo"></span>
                        </a>`
                            : ""
                    }

                    ${
                        showUpstreamLink
                            ? `<a class="upstreamLink boxLink" target="_blank">

                        ${T.mainMenu.upstreamLink}
                        <span class="thirdpartyLogo upstreamLogo"></span>
                    </a>`
                            : ""
                    }

                    ${
                        showExternalLinks
                            ? `<a class="translateLink boxLink" target="_blank">

                            ${T.mainMenu.helpTranslate}
                        <span class="thirdpartyLogo helpTranslate"></span>
                    </a>`
                            : ""
                    }
                </div>
            `
            }
        `;
    }

    /**
     * Asks the user to import a savegame
     */
    requestImportSavegame() {
        if (
            this.app.savegameMgr.getSavegamesMetaData().length > 0 &&
            !this.app.restrictionMgr.getHasUnlimitedSavegames()
        ) {
            this.app.analytics.trackUiClick("importgame_slot_limit_show");
            this.showSavegameSlotLimit();
            return;
        }

        // Create a 'fake' file-input to accept savegames
        startFileChoose(".bin").then(file => {
            if (file) {
                const closeLoader = this.dialogs.showLoadingDialog();
                waitNextFrame().then(() => {
                    this.app.analytics.trackUiClick("import_savegame");
                    const reader = new FileReader();
                    reader.addEventListener("load", event => {
                        const contents = event.target.result;
                        let realContent;

                        try {
                            realContent = ReadWriteProxy.deserializeObject(contents);
                        } catch (err) {
                            closeLoader();
                            this.dialogs.showWarning(
                                T.dialogs.importSavegameError.title,
                                T.dialogs.importSavegameError.text + "<br><br>" + err
                            );
                            return;
                        }

                        this.app.savegameMgr.importSavegame(realContent).then(
                            () => {
                                closeLoader();
                                this.dialogs.showWarning(
                                    T.dialogs.importSavegameSuccess.title,
                                    T.dialogs.importSavegameSuccess.text
                                );

                                this.renderMainMenu();
                                this.renderSavegames();
                            },
                            err => {
                                closeLoader();
                                this.dialogs.showWarning(
                                    T.dialogs.importSavegameError.title,
                                    T.dialogs.importSavegameError.text + ":<br><br>" + err
                                );
                            }
                        );
                    });
                    reader.addEventListener("error", error => {
                        this.dialogs.showWarning(
                            T.dialogs.importSavegameError.title,
                            T.dialogs.importSavegameError.text + ":<br><br>" + error
                        );
                    });
                    reader.readAsText(file, "utf-8");
                });
            }
        });
    }

    onBackButton() {
        this.app.platformWrapper.exitApp();
    }

    onEnter(payload) {
        this.dialogs = new HUDModalDialogs(null, this.app);
        const dialogsElement = document.body.querySelector(".modalDialogParent");
        this.dialogs.initializeToElement(dialogsElement);

        if (payload.loadError) {
            this.dialogs.showWarning(
                T.dialogs.gameLoadFailure.title,
                T.dialogs.gameLoadFailure.text + "<br><br>" + payload.loadError
            );
        }

        if (G_IS_DEV && globalConfig.debug.testPuzzleMode) {
            this.onPuzzleModeButtonClicked();
            return;
        }

        if (G_IS_DEV && globalConfig.debug.fastGameEnter) {
            const games = this.app.savegameMgr.getSavegamesMetaData();
            if (games.length > 0 && globalConfig.debug.resumeGameOnFastEnter) {
                this.resumeGame(games[0]);
            } else {
                this.onPlayButtonClicked();
            }
        }

        // Initialize video
        this.videoElement = this.htmlElement.querySelector("video");
        this.videoElement.playbackRate = 0.9;
        this.videoElement.addEventListener("canplay", () => {
            if (this.videoElement) {
                this.videoElement.classList.add("loaded");
            }
        });

        // TODO implement play offline click functionality
        const clickHandling = {
            ".settingsButton": this.onSettingsButtonClicked,
            ".languageChoose": this.onLanguageChooseClicked,
            ".changelog": this.onChangelogClicked,
            ".translateLink": this.onTranslationHelpLinkClicked,
            ".exitAppButton": this.onExitAppButtonClicked,
            ".steamLink": this.onSteamLinkClicked,
            ".upstreamLink": () => {
                this.app.analytics.trackUiClick("main_menu_link_upstream");
                this.app.platformWrapper.openExternalLink(THIRDPARTY_URLS.upstream);
            },
            ".githubLink": () => {
                this.app.analytics.trackUiClick("main_menu_link_github");
                this.app.platformWrapper.openExternalLink(THIRDPARTY_URLS.github);
            },
            ".producerLink": () => this.app.platformWrapper.openExternalLink("https://tobspr.io"),
            ".puzzleDlcPlayButton": this.onPuzzleModeButtonClicked,
            ".createAccountButton": this.onCreateAccountClicked,
            ".editMods": this.onModsClicked,
        };

        for (const key in clickHandling) {
            const handler = clickHandling[key];
            const element = this.htmlElement.querySelector(key);
            if (element) {
                this.trackClicks(element, handler, { preventClick: true });
            }
        }

        this.renderMainMenu();
        this.renderSavegames();
    }

    renderMainMenu() {
        const buttonContainer = this.htmlElement.querySelector(".sandboxContainer .buttons");
        removeAllChildren(buttonContainer);

        const outerDiv = makeDivElement(null, ["outer"], null);

        // Import button
        this.trackClicks(
            makeButton(outerDiv, ["importButton", "styledButton"], T.mainMenu.importSavegame),
            this.requestImportSavegame
        );

        if (this.savedGames.length > 0) {
            // Continue game
            this.trackClicks(
                makeButton(buttonContainer, ["continueButton", "styledButton"], T.mainMenu.continue),
                this.onContinueButtonClicked
            );

            // New game
            this.trackClicks(
                makeButton(outerDiv, ["newGameButton", "styledButton"], T.mainMenu.newGame),
                this.onPlayButtonClicked
            );
        } else {
            // New game
            this.trackClicks(
                makeButton(buttonContainer, ["playButton", "styledButton"], T.mainMenu.play),
                this.onPlayButtonClicked
            );
        }

        buttonContainer.appendChild(outerDiv);
    }

    onPuzzleModeButtonClicked() {
        if (!this.app.isLoggedIn) {
            const nameInput = new FormElementInput({
                id: "nameInput",
                label: T.mainMenu.login.nameLabel,
                placeholder: T.mainMenu.login.nameLabel,
            });

            const passwordInput = new FormElementInput({
                id: "passwordInput",
                label: T.mainMenu.login.passwordLabel,
                placeholder: T.mainMenu.login.passwordLabel,
                inputType: "password",
            });

            const dialog = new DialogWithForm({
                app: this.app,
                title: T.mainMenu.signin,
                desc: "",
                formElements: [nameInput, passwordInput],
                buttons: ["ok:good:enter"],
            });

            this.dialogs.internalShowDialog(dialog);

            dialog.buttonSignals.ok.add(async () => {
                const name = trim(nameInput.getValue());
                const password = trim(passwordInput.getValue());

                this.moveToState("LoginState", {
                    nextStateId: "PuzzleMenuState",
                    name,
                    password,
                });
            });
        } else {
            this.moveToState("LoginState", {
                nextStateId: "PuzzleMenuState",
            });
        }
    }

    onCreateAccountClicked() {
        const nameInput = new FormElementInput({
            id: "nameInput",
            label: T.mainMenu.login.nameLabel,
            placeholder: T.mainMenu.login.nameLabel,
        });

        const passwordInput = new FormElementInput({
            id: "passwordInput",
            label: T.mainMenu.login.passwordLabel,
            placeholder: T.mainMenu.login.passwordLabel,
            inputType: "password",
        });

        const dialog = new DialogWithForm({
            app: this.app,
            title: T.mainMenu.signin,
            desc: "",
            formElements: [nameInput, passwordInput],
            buttons: ["ok:good:enter"],
        });

        this.dialogs.internalShowDialog(dialog);

        dialog.buttonSignals.ok.add(async () => {
            const name = trim(nameInput.getValue());
            const password = trim(passwordInput.getValue());

            this.app.clientApi
                .createUser(name, password)
                .then(async user => {
                    alert(T.mainMenu.login.created);
                })
                .catch(async error => {
                    alert(`${T.mainMenu.login.createdFail}: ${error}`);
                });
        });
    }

    onBackButtonClicked() {
        this.renderMainMenu();
        this.renderSavegames();
    }

    onSteamLinkClicked() {
        this.app.analytics.trackUiClick("main_menu_steam_link_" + A_B_TESTING_LINK_TYPE);
        const discount = globalConfig.currentDiscount.active
            ? "_discount" + globalConfig.currentDiscount.amount
            : "";
        this.app.platformWrapper.openExternalLink(
            THIRDPARTY_URLS.stanaloneCampaignLink + "/shapez_mainmenu" + discount
        );

        return false;
    }

    onExitAppButtonClicked() {
        this.app.platformWrapper.exitApp();
    }

    onChangelogClicked() {
        this.moveToState("ChangelogState");
    }

    onRedditClicked() {
        this.app.analytics.trackUiClick("main_menu_reddit_link");
        this.app.platformWrapper.openExternalLink(THIRDPARTY_URLS.reddit);
    }

    onLanguageChooseClicked() {
        this.app.analytics.trackUiClick("choose_language");
        const setting = /** @type {EnumSetting} */ (this.app.settings.getSettingHandleById("language"));

        const { optionSelected } = this.dialogs.showOptionChooser(T.settings.labels.language.title, {
            active: this.app.settings.getLanguage(),
            options: setting.options.map(option => ({
                value: setting.valueGetter(option),
                text: setting.textGetter(option),
                desc: setting.descGetter(option),
                iconPrefix: setting.iconPrefix,
            })),
        });

        optionSelected.add(value => {
            this.app.settings.updateLanguage(value).then(() => {
                if (setting.restartRequired) {
                    if (this.app.platformWrapper.getSupportsRestart()) {
                        this.app.platformWrapper.performRestart();
                    } else {
                        this.dialogs.showInfo(
                            T.dialogs.restartRequired.title,
                            T.dialogs.restartRequired.text,
                            ["ok:good"]
                        );
                    }
                }

                if (setting.changeCb) {
                    setting.changeCb(this.app, value);
                }
            });

            // Update current icon
            this.htmlElement.querySelector("button.languageChoose").setAttribute("data-languageIcon", value);
        }, this);
    }

    get savedGames() {
        return this.app.savegameMgr.getSavegamesMetaData();
    }

    renderSavegames() {
        const oldContainer = this.htmlElement.querySelector(".sandboxContainer .savegames");
        if (oldContainer) {
            oldContainer.remove();
        }
        const games = this.savedGames;
        if (games.length > 0) {
            const parent = makeDiv(this.htmlElement.querySelector(".sandboxContainer"), null, ["savegames"]);

            for (let i = 0; i < games.length; ++i) {
                const elem = makeDiv(parent, null, ["savegame"]);

                makeDiv(
                    elem,
                    null,
                    ["playtime"],
                    formatSecondsToTimeAgo((new Date().getTime() - games[i].lastUpdate) / 1000.0)
                );

                makeDiv(
                    elem,
                    null,
                    ["level"],
                    games[i].level
                        ? T.mainMenu.savegameLevel.replace("<x>", "" + games[i].level)
                        : T.mainMenu.savegameLevelUnknown
                );

                const name = makeDiv(
                    elem,
                    null,
                    ["name"],
                    "<span>" + (games[i].name ? games[i].name : T.mainMenu.savegameUnnamed) + "</span>"
                );

                const deleteButton = document.createElement("button");
                deleteButton.classList.add("styledButton", "deleteGame");
                elem.appendChild(deleteButton);

                const downloadButton = document.createElement("button");
                downloadButton.classList.add("styledButton", "downloadGame");
                elem.appendChild(downloadButton);

                if (!G_WEGAME_VERSION) {
                    const renameButton = document.createElement("button");
                    renameButton.classList.add("styledButton", "renameGame");
                    name.appendChild(renameButton);
                    this.trackClicks(renameButton, () => this.requestRenameSavegame(games[i]));
                }

                const resumeButton = document.createElement("button");
                resumeButton.classList.add("styledButton", "resumeGame");
                elem.appendChild(resumeButton);

                this.trackClicks(deleteButton, () => this.deleteGame(games[i]));
                this.trackClicks(downloadButton, () => this.downloadGame(games[i]));
                this.trackClicks(resumeButton, () => this.resumeGame(games[i]));
            }
        }
    }

    /**
     * @param {SavegameMetadata} game
     */
    requestRenameSavegame(game) {
        const regex = /^[a-zA-Z0-9_\- ]{1,20}$/;

        const nameInput = new FormElementInput({
            id: "nameInput",
            label: null,
            placeholder: "",
            defaultValue: game.name || "",
            validator: val => val.match(regex) && trim(val).length > 0,
        });
        const dialog = new DialogWithForm({
            app: this.app,
            title: T.dialogs.renameSavegame.title,
            desc: T.dialogs.renameSavegame.desc,
            formElements: [nameInput],
            buttons: ["cancel:bad:escape", "ok:good:enter"],
        });
        this.dialogs.internalShowDialog(dialog);

        // When confirmed, save the name
        dialog.buttonSignals.ok.add(() => {
            game.name = trim(nameInput.getValue());
            this.app.savegameMgr.writeAsync();
            this.renderSavegames();
        });
    }

    /**
     * @param {SavegameMetadata} game
     */
    resumeGame(game) {
        this.app.analytics.trackUiClick("resume_game");

        this.app.adProvider.showVideoAd().then(() => {
            this.app.analytics.trackUiClick("resume_game_adcomplete");
            const savegame = this.app.savegameMgr.getSavegameById(game.internalId);
            savegame
                .readAsync()
                .then(() => this.checkForModDifferences(savegame))
                .then(() => {
                    this.moveToState("InGameState", {
                        savegame,
                    });
                })

                .catch(err => {
                    this.dialogs.showWarning(
                        T.dialogs.gameLoadFailure.title,
                        T.dialogs.gameLoadFailure.text + "<br><br>" + err
                    );
                });
        });
    }

    /**
     * @param {Savegame} savegame
     */
    checkForModDifferences(savegame) {
        const difference = MODS.computeModDifference(savegame.currentData.mods);

        if (difference.missing.length === 0 && difference.extra.length === 0) {
            return Promise.resolve();
        }

        let dialogHtml = T.dialogs.modsDifference.desc;

        /**
         *
         * @param {import("../savegame/savegame_typedefs").SavegameStoredMods[0]} mod
         */
        function formatMod(mod) {
            return `
                <div class="dialogModsMod">
                    <div class="name">${mod.name}</div>
                    <div class="version">${T.mods.version} ${mod.version}</div>
                    <button class="website styledButton" onclick="window.open('${mod.website.replace(
                        /"'/,
                        ""
                    )}')">${T.mods.modWebsite}
            </button>

                </div>
            `;
        }

        if (difference.missing.length > 0) {
            dialogHtml += "<h3>" + T.dialogs.modsDifference.missingMods + "</h3>";
            dialogHtml += difference.missing.map(formatMod).join("<br>");
        }

        if (difference.extra.length > 0) {
            dialogHtml += "<h3>" + T.dialogs.modsDifference.newMods + "</h3>";
            dialogHtml += difference.extra.map(formatMod).join("<br>");
        }

        const signals = this.dialogs.showWarning(T.dialogs.modsDifference.title, dialogHtml, [
            "cancel:good",
            "continue:bad",
        ]);

        return new Promise(resolve => {
            signals.continue.add(resolve);
        });
    }

    /**
     * @param {SavegameMetadata} game
     */
    deleteGame(game) {
        this.app.analytics.trackUiClick("delete_game");

        const signals = this.dialogs.showWarning(
            T.dialogs.confirmSavegameDelete.title,
            T.dialogs.confirmSavegameDelete.text
                .replace("<savegameName>", game.name || T.mainMenu.savegameUnnamed)
                .replace("<savegameLevel>", String(game.level)),
            ["cancel:good", "delete:bad:timeout"]
        );

        signals.delete.add(() => {
            this.app.savegameMgr.deleteSavegame(game).then(
                () => {
                    this.renderSavegames();
                    if (this.savedGames.length <= 0) this.renderMainMenu();
                },
                err => {
                    this.dialogs.showWarning(
                        T.dialogs.savegameDeletionError.title,
                        T.dialogs.savegameDeletionError.text + "<br><br>" + err
                    );
                }
            );
        });
    }

    /**
     * @param {SavegameMetadata} game
     */
    downloadGame(game) {
        this.app.analytics.trackUiClick("download_game");

        const savegame = this.app.savegameMgr.getSavegameById(game.internalId);
        savegame.readAsync().then(() => {
            const data = ReadWriteProxy.serializeObject(savegame.currentData);
            const filename = (game.name || "unnamed") + ".bin";
            generateFileDownload(filename, data);
        });
    }

    /**
     * Shows a hint that the slot limit has been reached
     */
    showSavegameSlotLimit() {
        const { getStandalone } = this.dialogs.showWarning(
            T.dialogs.oneSavegameLimit.title,
            T.dialogs.oneSavegameLimit.desc,
            ["cancel:bad", "getStandalone:good"]
        );
        getStandalone.add(() => {
            this.app.analytics.trackUiClick("visit_steampage_from_slot_limit");
            this.app.platformWrapper.openExternalLink(
                THIRDPARTY_URLS.stanaloneCampaignLink + "/shapez_slotlimit"
            );
        });
    }

    onSettingsButtonClicked() {
        this.moveToState("SettingsState");
    }

    onTranslationHelpLinkClicked() {
        this.app.analytics.trackUiClick("translation_help_link");
        this.app.platformWrapper.openExternalLink(
            "https://github.com/RafRunner/shapez.io/blob/master/translations"
        );
    }

    onPlayButtonClicked() {
        if (
            this.app.savegameMgr.getSavegamesMetaData().length > 0 &&
            !this.app.restrictionMgr.getHasUnlimitedSavegames()
        ) {
            this.app.analytics.trackUiClick("startgame_slot_limit_show");
            this.showSavegameSlotLimit();
            return;
        }

        this.app.analytics.trackUiClick("startgame");
        this.app.adProvider.showVideoAd().then(() => {
            const savegame = this.app.savegameMgr.createNewSavegame();

            this.moveToState("InGameState", {
                savegame,
            });
            this.app.analytics.trackUiClick("startgame_adcomplete");
        });
    }

    onModsClicked() {
        this.moveToState("ModsState", {
            backToStateId: "MainMenuState",
        });
    }

    onContinueButtonClicked() {
        let latestLastUpdate = 0;
        let latestInternalId;
        this.app.savegameMgr.currentData.savegames.forEach(saveGame => {
            if (saveGame.lastUpdate > latestLastUpdate) {
                latestLastUpdate = saveGame.lastUpdate;
                latestInternalId = saveGame.internalId;
            }
        });

        const savegame = this.app.savegameMgr.getSavegameById(latestInternalId);
        savegame
            .readAsync()
            .then(() => this.app.adProvider.showVideoAd())
            .then(() => this.checkForModDifferences(savegame))
            .then(() => {
                this.moveToState("InGameState", {
                    savegame,
                });
            });
    }

    onLeave() {
        this.dialogs.cleanup();
    }
}
