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
const appContainer = document.getElementById('app-container');
if (appContainer) {
    appContainer.innerHTML = `
        <style>
            /* Styles specific to the controls/workspace if needed */
            #buttons {
                padding: 5px;
                background-color: var(--perspective- FFE UI--background, #f0f0f0); /* Use Perspective vars if possible */
                border-bottom: 1px solid var(--perspective- FFE UI--border-color, #ccc);
                flex-shrink: 0; /* Prevent buttons div from shrinking */
                 z-index: 10; /* Ensure buttons above workspace content if overlapping needed */
                 position: relative; /* Needed for z-index */
            }
            body.dark #buttons {
                 background-color: var(--perspective- FFE UI--background, #444);
                 border-bottom: 1px solid var(--perspective- FFE UI--border-color, #666);
            }
            #buttons a { /* Style the link inside buttons */
                margin-left: 15px;
                font-size: 0.9em;
            }
            #message { margin-right: 10px; font-style: italic; }
            /* Adjust input style */
            #name_input {
                margin: 0 5px;
                padding: 2px 4px;
            }
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
            <a href="https://data.ny.gov/Transportation/MTA-Congestion-Relief-Zone-Vehicle-Entries-Beginni/t6yz-b64h/about_data" target="_blank" rel="noopener noreferrer">MTA Congestion Pricing Data</a>
        </div>
        <perspective-workspace id='workspace'></perspective-workspace>
    `.trim();
} else {
    console.error("#app-container not found in the DOM!");
}


window.workspace.addTable(
    "mta",
    (async () => {
        const csv = await fetch_csv(DATA_URL);
        return worker.table(csv);
    })()
);

// Default layout if none exists
const defaultLayout = {
    "Traffic Overview": {
        "sizes": [1],
        "detail": {
            "main": {
                "type": "tab-area",
                "widgets": ["PERSPECTIVE_GENERATED_ID_3"],
                "currentIndex": 0
            }
        },
        "mode": "globalFilters",
        "viewers": {
            "PERSPECTIVE_GENERATED_ID_3": {
                "plugin": "Datagrid",
                "plugin_config": {
                    "columns": {},
                    "editable": false,
                    "scroll_lock": false
                },
                "settings": false,
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
    "Traffic by Location": {
        "sizes": [1],
        "detail": {
            "main": {
                "type": "tab-area",
                "widgets": ["PERSPECTIVE_GENERATED_ID_4"],
                "currentIndex": 0
            }
        },
        "mode": "globalFilters",
        "viewers": {
            "PERSPECTIVE_GENERATED_ID_4": {
                "plugin": "Y Bar",
                "plugin_config": {},
                "settings": false,
                "title": "Entries by Location",
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
    "Traffic by Time": {
        "sizes": [1],
        "detail": {
            "main": {
                "type": "split-area",
                "orientation": "vertical",
                "children": [
                    {
                        "type": "tab-area",
                        "widgets": ["PERSPECTIVE_GENERATED_ID_5"],
                        "currentIndex": 0
                    },
                    {
                        "type": "tab-area",
                        "widgets": ["PERSPECTIVE_GENERATED_ID_6"],
                        "currentIndex": 0
                    }
                ],
                "sizes": [0.5, 0.5]
            }
        },
        "mode": "globalFilters",
        "viewers": {
            "PERSPECTIVE_GENERATED_ID_5": {
                "plugin": "Y Line",
                "plugin_config": {},
                "settings": false,
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
            },
            "PERSPECTIVE_GENERATED_ID_6": {
                "plugin": "Heatmap",
                "plugin_config": {},
                "settings": false,
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