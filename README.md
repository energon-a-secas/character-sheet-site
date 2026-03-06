<div align="center">

# Character Sheet

**Know Your Party** — RPG-style personality interview. Discover gaming habits, anime picks, movie tastes, hobbies, and hot takes — then export your character card.

[![Live][badge-site]][url-site]
[![HTML5][badge-html]][url-html]
[![CSS3][badge-css]][url-css]
[![JavaScript][badge-js]][url-js]
[![Claude Code][badge-claude]][url-claude]
[![License][badge-license]](LICENSE)

[badge-site]:    https://img.shields.io/badge/live_site-0063e5?style=for-the-badge&logo=googlechrome&logoColor=white
[badge-html]:    https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white
[badge-css]:     https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white
[badge-js]:      https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black
[badge-claude]:  https://img.shields.io/badge/Claude_Code-CC785C?style=for-the-badge&logo=anthropic&logoColor=white
[badge-license]: https://img.shields.io/badge/license-MIT-404040?style=for-the-badge

[url-site]:   https://charactersheet.neorgon.com/
[url-html]:   #
[url-css]:    #
[url-js]:     #
[url-claude]: https://claude.ai/code

</div>

---

## Overview

**Character Sheet** is a multi-section personality interview that builds an RPG-style character card from your answers. Walk through seven themed sections, get auto-assigned an RPG class, and export a canvas-rendered character card.

**Live:** [charactersheet.neorgon.com](https://charactersheet.neorgon.com/)

## Features

- **Multi-section wizard interview** — guided flow through Identity, Gaming, Anime, Movies & Series, Hobbies, Wildcards, and Extras
- **Console and platform selection** — choose your gaming platforms and preferences
- **Media search** — search for anime and movies via external API integration
- **RPG class auto-assignment** — answers determine your class (Digital Ronin, Screen Sage, Pixel Paladin, and more)
- **Canvas character card generation** — export a rendered character card image
- **Randomize button** — fill in random answers for quick testing

## Architecture

Modular ES module app following the standard project layout:

```
player-card-site/
├── index.html            # HTML shell
├── css/
│   └── style.css         # All styles
├── js/
│   ├── app.js            # Entry point, imports and initializes
│   ├── state.js          # Shared mutable state
│   ├── data.js           # Question data and class definitions
│   ├── render.js         # DOM rendering and templates
│   ├── events.js         # Event handlers and user interactions
│   ├── builder.js        # Interview wizard logic
│   ├── card.js           # Canvas character card rendering
│   ├── api.js            # External API calls (anime/movie search)
│   ├── utils.js          # Shared helpers
│   └── testdata.js       # Test/randomize data
├── env.js                # Environment config (gitignored)
└── env.example.js        # Config template
```

**Tech:** Pure HTML + CSS + Canvas API + JavaScript ES modules. External API calls for anime and movie search.

## Run Locally

```bash
cd player-card-site
python3 -m http.server
```

Then open [http://localhost:8000](http://localhost:8000). ES modules require an HTTP server — `file://` will not work.

Copy `env.example.js` to `env.js` and fill in any required API keys before running.

---

<div align="center">

Part of [Neorgon](https://neorgon.com)

</div>
