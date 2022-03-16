# shapez.io

## DISCLAIMER

This is not the official shapez.io repository. This is a fork that will be heavily modified in the future. We are currently only starting and will change all trademarkable names in the near future to not infringe on the creator's rights and not cause any confusion. The official repository is: https://github.com/tobspr/shapez.io

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

### Assets

For most assets I use Adobe Photoshop, you can find them <a href="//github.com/tobspr/shapez.io-artwork" target="_blank">here</a>.

All assets will be automatically rebuilt into the atlas once changed (Thanks to dengr1065!)

<img src="https://i.imgur.com/W25Fkl0.png" alt="shapez.io Screenshot">

<br>

## Check out our other games!

<a href="https://tobspr.io" title="tobspr Games">
<img src="https://i.imgur.com/uA2wcUy.png" alt="tobspr Games">
</a>
