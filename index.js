// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃ ██████ ██████ ██████       █      █      █      █      █ █▄  ▀███ █       ┃
// ┃ ▄▄▄▄▄█ █▄▄▄▄▄ ▄▄▄▄▄█  ▀▀▀▀▀█▀▀▀▀▀ █ ▀▀▀▀▀█ ████████▌▐███ ███▄  ▀█ █ ▀▀▀▀▀ ┃
// ┃ █▀▀▀▀▀ █▀▀▀▀▀ █▀██▀▀ ▄▄▄▄▄ █ ▄▄▄▄▄█ ▄▄▄▄▄█ ████████▌▐███ █████▄   █ ▄▄▄▄▄ ┃
// ┃ █      ██████ █  ▀█▄       █ ██████      █      ███▌▐███ ███████▄ █       ┃
// ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
// ┃ Copyright (c) 2017, the Perspective Authors.                              ┃
// ┃ ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ ┃
// ┃ This file is part of the Perspective library, distributed under the terms ┃
// ┃ of the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

import "https://cdn.jsdelivr.net/npm/@finos/perspective-viewer@3.4.0/dist/cdn/perspective-viewer.js";
import "https://cdn.jsdelivr.net/npm/@finos/perspective-workspace@3.4.0/dist/cdn/perspective-workspace.js";
import "https://cdn.jsdelivr.net/npm/@finos/perspective-viewer-datagrid@3.4.0/dist/cdn/perspective-viewer-datagrid.js";
import "https://cdn.jsdelivr.net/npm/@finos/perspective-viewer-d3fc@3.4.0/dist/cdn/perspective-viewer-d3fc.js";
import "https://cdn.jsdelivr.net/npm/@finos/perspective-viewer-openlayers/dist/cdn/perspective-viewer-openlayers.js";

import perspective from "https://cdn.jsdelivr.net/npm/@finos/perspective@3.4.0/dist/cdn/perspective.js";

let DATA_URL = "mta_data.csv";

let LAYOUTS = localStorage.getItem("layouts")
    ? JSON.parse(localStorage.getItem("layouts"))
    : undefined;

const worker = await perspective.worker();
const theme_style_node = document.createElement("style");
document.head.appendChild(theme_style_node);
let DARK_THEME;
let LIGHT_THEME;

function toggle_theme() {
    if (theme_style_node.dataset.theme === "Pro Light") {
        theme_style_node.textContent = DARK_THEME;
        document.body.classList.add("dark");
        window.theme.textContent = "Light Theme";
        for (const view of document.querySelectorAll("perspective-viewer")) {
            view.setAttribute("theme", "Pro Dark");
            view.restyleElement();
        }

        theme_style_node.dataset.theme = "Pro Dark";
    } else {
        theme_style_node.textContent = LIGHT_THEME;
        document.body.classList.remove("dark");
        window.theme.textContent = "Dark Theme";
        for (const view of document.querySelectorAll("perspective-viewer")) {
            view.setAttribute("theme", "Pro Light");
            view.restyleElement();
        }
        theme_style_node.dataset.theme = "Pro Light";
    }
}

async function fetch_csv(url) {
    window.message.textContent = "Downloading...";
    const response = await fetch(url);
    const text = await response.text();
    window.message.style.display = "none";
    return text;
}

DARK_THEME = await fetch(
    "https://cdn.jsdelivr.net/npm/@finos/perspective-workspace/dist/css/pro-dark.css"
).then((x) => x.text());

LIGHT_THEME = await fetch(
    "https://cdn.jsdelivr.net/npm/@finos/perspective-workspace/dist/css/pro.css"
).then((x) => x.text());

document.body.innerHTML = `
        <style>
        </style>
        <div id='buttons'>
            <span id="message"></span>
            <select id="layouts"></select>
            <button id="save_as">Save As</button>
            <input id="name_input" style="display: none"></input>
            <button id="save" style="display: none">Save</button>
            <button id="cancel" style="display: none">Cancel</button>
            <button id="theme" style="float: right">Light Theme</button>
            <button id="copy" style="float: right">Debug to Clipboard</button>
            <button id="reset" style="float: right">Reset LocalStorage</button>
            <a href="https://github.com/MTA/congestion-pricing">MTA Congestion Pricing Data</a>
            <a href="https://github.com/finos/perspective">Built With Perspective</a>
        </div>
        <perspective-workspace id='workspace'></perspective-workspace>
    `.trim();

toggle_theme();

window.workspace.addEventListener(
    "workspace-new-view",
    ({ detail: { widget } }) => {
        widget.viewer.setAttribute("theme", theme_style_node.dataset.theme);
    }
);

window.workspace.addTable(
    "mta",
    (async () => {
        const csv = await fetch_csv(DATA_URL);
        return worker.table(csv);
    })()
);

// Default layout if none exists
const defaultLayout = {
    "Raw Data Grid": {
        "sizes": [1],
        "detail": {
            "main": {
                "type": "tab-area",
                "widgets": ["PERSPECTIVE_GENERATED_ID_1"],
                "currentIndex": 0
            }
        },
        "mode": "globalFilters",
        "viewers": {
            "PERSPECTIVE_GENERATED_ID_1": {
                "plugin": "Datagrid",
                "plugin_config": {
                    "columns": {},
                    "editable": false,
                    "scroll_lock": false
                },
                "settings": true,
                "title": "Raw Data",
                "group_by": [],
                "split_by": [],
                "columns": [
                    "Toll Date",
                    "Toll Hour",
                    "Toll 10 Minute Block",
                    "Minute of Hour",
                    "Hour of Day",
                    "Day of Week Int",
                    "Day of Week",
                    "Toll Week",
                    "Time Period",
                    "Vehicle Class",
                    "Detection Group",
                    "Detection Region",
                    "CRZ Entries",
                    "Excluded Roadway Entries"
                ],
                "filter": [],
                "sort": [],
                "expressions": {},
                "aggregates": {},
                "master": false,
                "table": "mta",
                "linked": false
            }
        }
    },
    "Bar Chart - Traffic by Location": {
        "sizes": [1],
        "detail": {
            "main": {
                "type": "tab-area",
                "widgets": ["PERSPECTIVE_GENERATED_ID_10"],
                "currentIndex": 0
            }
        },
        "mode": "globalFilters",
        "viewers": {
            "PERSPECTIVE_GENERATED_ID_10": {
                "plugin": "Y Bar",
                "plugin_config": {},
                "settings": true,
                "title": "Traffic by Detection Group",
                "group_by": ["Detection Group"],
                "split_by": ["Vehicle Class"],
                "columns": ["CRZ Entries"],
                "filter": [],
                "sort": [["CRZ Entries", "desc"]],
                "expressions": {},
                "aggregates": { "CRZ Entries": "sum" },
                "master": false,
                "table": "mta",
                "linked": false
            }
        }
    },
    "Line Chart - Hourly Traffic": {
        "sizes": [1],
        "detail": {
            "main": {
                "type": "tab-area",
                "widgets": ["PERSPECTIVE_GENERATED_ID_11"],
                "currentIndex": 0
            }
        },
        "mode": "globalFilters",
        "viewers": {
            "PERSPECTIVE_GENERATED_ID_11": {
                "plugin": "Y Line",
                "plugin_config": {},
                "settings": true,
                "title": "Hourly Traffic",
                "group_by": ["Hour of Day"],
                "split_by": ["Day of Week"],
                "columns": ["CRZ Entries"],
                "filter": [],
                "sort": [],
                "expressions": {},
                "aggregates": { "CRZ Entries": "sum" },
                "master": false,
                "table": "mta",
                "linked": false
            }
        }
    },
    "Heatmap - Traffic by Day and Hour": {
        "sizes": [1],
        "detail": {
            "main": {
                "type": "tab-area",
                "widgets": ["PERSPECTIVE_GENERATED_ID_12"],
                "currentIndex": 0
            }
        },
        "mode": "globalFilters",
        "viewers": {
            "PERSPECTIVE_GENERATED_ID_12": {
                "plugin": "Heatmap",
                "plugin_config": {},
                "settings": true,
                "title": "Traffic Heatmap by Day and Hour",
                "group_by": ["Day of Week"],
                "split_by": ["Hour of Day"],
                "columns": ["CRZ Entries"],
                "filter": [],
                "sort": [],
                "expressions": {},
                "aggregates": { "CRZ Entries": "sum" },
                "master": false,
                "table": "mta",
                "linked": false
            }
        }
    },
    "Bar Chart - Traffic by Time Period": {
        "sizes": [1],
        "detail": {
            "main": {
                "type": "tab-area",
                "widgets": ["PERSPECTIVE_GENERATED_ID_13"],
                "currentIndex": 0
            }
        },
        "mode": "globalFilters",
        "viewers": {
            "PERSPECTIVE_GENERATED_ID_13": {
                "plugin": "Y Bar",
                "plugin_config": {},
                "settings": true,
                "title": "Traffic by Time Period",
                "group_by": ["Time Period"],
                "split_by": ["Vehicle Class"],
                "columns": ["CRZ Entries"],
                "filter": [],
                "sort": [],
                "expressions": {},
                "aggregates": { "CRZ Entries": "sum" },
                "master": false,
                "table": "mta",
                "linked": false
            }
        }
    },
    "Scatter Plot - Traffic Correlation": {
        "sizes": [1],
        "detail": {
            "main": {
                "type": "tab-area",
                "widgets": ["PERSPECTIVE_GENERATED_ID_14"],
                "currentIndex": 0
            }
        },
        "mode": "globalFilters",
        "viewers": {
            "PERSPECTIVE_GENERATED_ID_14": {
                "plugin": "X/Y Scatter",
                "plugin_config": {},
                "settings": true,
                "title": "Detection Group Traffic Correlation",
                "group_by": ["Detection Group"],
                "split_by": ["Vehicle Class"],
                "columns": ["CRZ Entries", "Excluded Roadway Entries"],
                "filter": [],
                "sort": [],
                "expressions": {},
                "aggregates": {
                    "CRZ Entries": "sum",
                    "Excluded Roadway Entries": "sum"
                },
                "master": false,
                "table": "mta",
                "linked": false
            }
        }
    },
    "Treemap - Traffic Distribution": {
        "sizes": [1],
        "detail": {
            "main": {
                "type": "tab-area",
                "widgets": ["PERSPECTIVE_GENERATED_ID_15"],
                "currentIndex": 0
            }
        },
        "mode": "globalFilters",
        "viewers": {
            "PERSPECTIVE_GENERATED_ID_15": {
                "plugin": "Treemap",
                "plugin_config": {},
                "settings": true,
                "title": "Traffic Distribution",
                "group_by": ["Detection Group", "Vehicle Class"],
                "split_by": [],
                "columns": ["CRZ Entries"],
                "filter": [],
                "sort": [],
                "expressions": {},
                "aggregates": { "CRZ Entries": "sum" },
                "master": false,
                "table": "mta",
                "linked": false
            }
        }
    }
};

if (LAYOUTS == undefined) {
    try {
        LAYOUTS = await (await fetch("./layout.json")).json();
    } catch (e) {
        console.log("Could not load layout.json, using default layout");
        LAYOUTS = defaultLayout;
    }
}

const layout_names = Object.keys(LAYOUTS);
let selected_layout = LAYOUTS[layout_names[0]];
await window.workspace.restore(selected_layout);

function set_layout_options() {
    const layout_names = Object.keys(LAYOUTS);
    window.layouts.innerHTML = "";
    for (const layout of layout_names) {
        window.layouts.innerHTML += `<option${
            layout === selected_layout ? " selected='true'" : ""
        }>${layout}</option>`;
    }
}

set_layout_options();

window.name_input.value = layout_names[0];
window.layouts.addEventListener("change", async () => {
    if (window.layouts.value.trim().length === 0) {
        return;
    }

    window.workspace.innerHTML = "";
    await window.workspace.restore(LAYOUTS[window.layouts.value]);
    window.name_input.value = window.layouts.value;
});

window.save_as.addEventListener("click", async () => {
    window.save_as.style.display = "none";
    window.save.style.display = "inline-block";
    window.cancel.style.display = "inline-block";
    window.name_input.style.display = "inline-block";
    window.copy.style.display = "none";
    window.layouts.style.display = "none";
});

function cancel() {
    window.save_as.style.display = "inline-block";
    window.save.style.display = "none";
    window.cancel.style.display = "none";
    window.name_input.style.display = "none";
    window.copy.style.display = "inline-block";
    window.layouts.style.display = "inline-block";
}

window.cancel.addEventListener("click", cancel);

window.reset.addEventListener("click", () => {
    localStorage.clear();
    window.reset.innerText = "Reset!";
    setTimeout(() => {
        window.reset.innerText = "Reset LocalStorage";
    }, 1000);
});

window.save.addEventListener("click", async () => {
    const token = await window.workspace.save();
    const new_name = window.name_input.value;
    LAYOUTS[new_name] = token;
    set_layout_options();
    window.layouts.value = new_name;
    window.save_as.innerText = "Saved!";
    setTimeout(() => {
        window.save_as.innerText = "Save As";
    }, 1000);
    localStorage.setItem("layouts", JSON.stringify(LAYOUTS));
    cancel();
});

window.copy.addEventListener("click", async () => {
    await navigator.clipboard.writeText(JSON.stringify(LAYOUTS));
    window.copy.innerText = "Copied!";
    setTimeout(() => {
        window.copy.innerText = "Debug to Clipboard";
    }, 1000);
});

window.theme.addEventListener("click", toggle_theme); 