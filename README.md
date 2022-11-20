# Gatez

## Basic information

This is a fork from shapez (https://github.com/tobspr/shapez.io), mainly focusing in adapting the puzzle DLC gameplay but using logic gates, where the objective becomes building a circuit that meets a list of conditions, similar to a truth table. Players have a series of premade puzzles at their disposal where they'll learn the basics of logic circuits and digital design, with progressively difficult levels building more and more complex components and circuits.

This project also has a back-end (https://github.com/armandosneto/shapez.io-gates-backend) that allows players to create an account so that they can track their progress, play and rate other player's puzzles and create their own puzzles. Right now we're not hosting the server anywhere, so you'll have to run your own instance in your local network.

Right now, the game is playable, but some very important improvements are needed. Feel free to create a pull request with new features/improvements!

### Future features/improvements in probable order of implementation:

-   Allowing players to lock building variant's on puzzle creation, not only the whole building;
-   Polishing the sandbox mode (removing all unused mechanics and adding some new, most notably a clock component);
-   Moving all difficulty labeling to the back-end, avoiding code duplication;
-   Implement multi lingual puzzle titles and descriptions, that can be translated by users or automaticaly;
-   A more in topic way of choosing a puzzle's icon, correctly it's just set to a random shape from shapez;
-   Improving the puzzle description input using a multi line textbox;
-   Improving Programmable Signal/Acceptor's signal input;
-   Show a truth table while creating the puzzle;
-   Revising the settings menu;
-   Translating to other languages (right now only English and Brazilian Portuguese are complete);
-   Making permanent assets for all components;
-   Updating the main menu background animation and all loading tooltips;
-   Creating more components (registers, an ALU, a RAM and ROM) and adding more levels until building a simple 4 bit CPU and RAM;
-   Changing the game's visual identity and creating new logos;
-   Updating this README;
-   Remove all (or most) unused code;
-   Remove all references to upstream analytics, crash reports, platforms, emails, links, etc (except when pointing to it as the upstream, like on the main menu);
-   Update the build scripts for web and standalone;
-   Releasing the game, probably as installers for each operating system, and the back-end in server.

A lot of unused code/assets from the base game are still present, and almost all the code regarding building the game/hosting it in a production environment was not changed, so feel free to help with these as well!

## Original README

<img src="https://i.imgur.com/Y5Z2iqQ.png" alt="shapez.io Logo">

This is the source code for shapez.io, an open source base building game inspired by Factorio.
Your goal is to produce shapes by cutting, rotating, merging and painting parts of shapes.

-   [Steam Page](https://get.shapez.io/ghr)
-   [Official Discord](https://discord.com/invite/HN7EVzV) <- _Highly recommended to join!_
-   [Trello Board & Roadmap](https://trello.com/b/ISQncpJP/shapezio)
-   [itch.io Page](https://tobspr.itch.io/shapezio)
-   [Online Demo](https://shapez.io)

## Reporting issues, suggestions, feedback, bugs

1. Ask in `#bugs` / `#feedback` / `#questions` on the [Official Discord](https://discord.com/invite/HN7EVzV) if you are not entirely sure if it's a bug
2. Check out the trello board: https://trello.com/b/ISQncpJP/shapezio
3. See if it's already there - If so, vote for it, done. I will see it. (You have to be signed in on trello)
4. If not, check if it's already reported here: https://github.com/tobspr/shapez.io/issues
5. If not, file a new issue here: https://github.com/tobspr/shapez.io/issues/new
6. I will then have a look (This can take days or weeks) and convert it to trello, and comment with the link. You can then vote there ;)

## Building

-   Make sure `ffmpeg` is on your path
-   Install Node.js (v16 or earlier) and Yarn
-   Install Java (required for texture packer)
-   Run `yarn` in the root folder
-   `cd` into `gulp` folder
-   Run `yarn` and then `yarn gulp` - it should now open in your browser

**Notice**: This will produce a debug build with several debugging flags enabled. If you want to disable them, modify [`src/js/core/config.js`](src/js/core/config.js).

## Creating Mods

Mods can be found [here](https://shapez.mod.io). The documentation for creating mods can be found [here](mod_examples/), including a bunch of sample mods.

## Build Online with one-click setup

You can use [Gitpod](https://www.gitpod.io/) (an Online Open Source VS Code-like IDE which is free for Open Source) for working on issues and making PRs to this project. With a single click it will start a workspace and automatically:

-   clone the `shapez.io` repo.
-   install all of the dependencies.
-   start `gulp` in `gulp/` directory.

[![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/#https://github.com/tobspr/shapez.io)

## Helping translate

Please checkout the [Translations readme](translations/).

## Contributing

I will only accept pull requests which add a benefit to a large portion of the player base. If the feature is useful but only to a fraction of players, or is controversial, I recommend making a mod instead.

If you want to add a new feature or in generally contribute I recommend to get in touch on Discord in advance, which largely increases the chance of the PR to get merged:

<a href="https://discord.com/invite/HN7EVzV" target="_blank">
<img src="https://i.imgur.com/SoawBhW.png" alt="discord logo" width="100">
</a>

### Code

The game is based on a custom engine which itself is based on the YORG.io 3 game engine (Actually it shares almost the same core).
The code within the engine is relatively clean with some code for the actual game on top being hacky.

This project is based on ES5 (If I would develop it again, I would definitely use TypeScript). Some ES2015 features are used but most of them are too slow, especially when polyfilled. For example, `Array.prototype.forEach` is only used within non-critical loops since its slower than a plain for loop.

#### Adding a new component

1. Create the component file in `src/js/game/components/<name_lowercase>.js`
2. Create a component class (e.g. `MyFancyComponent`) which `extends Component`
3. Create a `static getId()` method which should return the `PascalCaseName` without component (e.g. `MyFancy`)
4. If any data needs to be persisted, create a `static getSchema()` which should return the properties to be saved (See other components)
5. Add a constructor. **The constructor must be called with optional parameters only!** `new MyFancyComponent({})` should always work.
6. Add any props you need in the constructor.
7. Add the component in `src/js/game/component_registry.js`
8. Add the component in `src/js/game/entity_components.js`
9. Done! You can use your component now

#### Adding a new building

(The easiest way is to copy an existing building)

1. Create your building in `src/js/game/buildings/<my_building.js>`
2. Create the building meta class, e.g. `MetaMyFancyBuilding extends MetaBuilding`
3. Override the methods from MetaBuilding you want to override.
4. Most important is `setupEntityComponents`
5. Add the building to `src/js/game/meta_building_registry.js`: You need to register it on the registry.
6. Add the building to the right toolbar, e.g. `src/js/game/hud/parts/buildings_toolbar.js`:`supportedBuildings`
7. Add a keybinding for the building in `src/js/game/key_action_mapper.js` in `KEYMAPPINGS.buildings`
8. In `translations/base-en.yaml` add it to two sections: `buildings.[my_building].XXX` (See other buildings) and also `keybindings.mappings.[my_building]`. Be sure to do it the same way as other buildings do!
9. Create a icon (128x128, [prefab](https://github.com/tobspr/shapez.io-artwork/blob/master/ui/toolbar-icons.psd)) for your building and save it in `res/ui/buildings_icons` with the id of your building
10. Create a tutorial image (600x600) for your building and save it in `res/ui/building_tutorials`
11. In `src/css/resources.scss` add your building to `$buildings` as well as `$buildingAndVariants`
12. Done! Optional: Add a new reward for unlocking your building at some point.

#### Adding a new game system

1. Create the class in `src/js/game/systems/<system_name>.js`
2. Derive it from `GameSystemWithFilter` if you want it to work on certain entities only which have the given components. Otherwise use `GameSystem` to do more generic stuff.
3. Implement the `update()` method.
4. Add the system in `src/js/game/game_system_manager.js` (To `this.systems` and also call `add` in the `internalInitSystems()` method)
5. If your system should draw stuff, this is a bit more complicated. Have a look at existing systems on how they do it.

#### Checklist for a new building / testing it

This is a quick checklist, if a new building is added this points should be fulfilled:

2. The translation for all variants is done and finalized
3. The artwork (regular sprite) is finalized
4. The blueprint sprite has been generated and is up to date
5. The building has been added to the appropriate toolbar
6. The building has a keybinding which makes sense
7. The building has a reward assigned and is unlocked at a meaningful point
8. The reward for the building has a proper translation
9. The reward for the building has a proper image
10. The building has a proper tutorial image assigned
11. The buliding has a proper toolbar icon
12. The reward requires a proper shape
13. The building has a proper silhouette color
14. The building has a proper matrix for being rendered on the minimap
15. The building has proper statistics in the dialog
16. The building properly contributes to the shapes produced analytics
17. The building is properly persisted in the savegame
18. The building is explained properly, ideally via an interactive tutorial

### Assets

For most assets I use Adobe Photoshop, you can find them <a href="//github.com/tobspr/shapez.io-artwork" target="_blank">here</a>.

All assets will be automatically rebuilt into the atlas once changed (Thanks to dengr1065!)

<img src="https://i.imgur.com/W25Fkl0.png" alt="shapez.io Screenshot">

<br>

## Check out our other games!

<a href="https://tobspr.io" title="tobspr Games">
<img src="https://i.imgur.com/uA2wcUy.png" alt="tobspr Games">
</a>
