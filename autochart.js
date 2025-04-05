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
    const response = await fetch(url);
    const text = await response.text();
    return text;
}

// Initialize themes
DARK_THEME = await fetch(
    "https://cdn.jsdelivr.net/npm/@finos/perspective-workspace/dist/css/pro-dark.css"
).then((x) => x.text());

LIGHT_THEME = await fetch(
    "https://cdn.jsdelivr.net/npm/@finos/perspective-workspace/dist/css/pro.css"
).then((x) => x.text());

// Initialize theme
theme_style_node.textContent = DARK_THEME;
theme_style_node.dataset.theme = "Pro Dark";
document.body.classList.add("dark");

const API_URL = 'http://localhost:5001/api/chart-recommendation';
const questionInput = document.getElementById('questionInput');
const recommendationDiv = document.getElementById('recommendation');
const loadingIndicator = document.getElementById('loadingIndicator');
const workspace = document.getElementById('workspace');

// Initialize the workspace with the data
async function initializeWorkspace() {
    try {
        const csv = await fetch_csv(DATA_URL);
        const table = await worker.table(csv);
        
        // Initialize workspace with proper configuration
        const config = {
            plugin: "Datagrid",
            settings: true,
            theme: "Pro Dark"
        };
        
        await workspace.tables.set("mta", table);
        
        // Load initial layout if available
        try {
            const response = await fetch("./layout.json");
            const initialLayout = await response.json();
            await workspace.restore(initialLayout);
        } catch (e) {
            console.log("Could not load initial layout.json");
            // Set a default layout if no layout.json exists
            const defaultLayout = {
                workspaces: {
                    main: {
                        perspective: config
                    }
                },
                mode: "globalFilters"
            };
            await workspace.restore(defaultLayout);
        }
    } catch (error) {
        console.error("Error initializing workspace:", error);
    }
}

// Handle question submission and chart generation
async function askQuestion() {
    const question = questionInput.value.trim();
    if (!question) return;

    loadingIndicator.style.display = 'inline';
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ question }),
        });

        const data = await response.json();
        
        if (response.ok) {
            // Apply the new layout to the workspace
            if (data.layout) {
                await workspace.restore(data.layout);
            }
        } else {
            console.error('Error:', data.error || 'Failed to get recommendation');
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        loadingIndicator.style.display = 'none';
    }
}

// Allow Enter key to submit
questionInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        askQuestion();
    }
});

// Initialize the workspace when the page loads
initializeWorkspace();

// Make askQuestion available globally
window.askQuestion = askQuestion;

// Default layout if none exists
// const defaultLayout = use Python generated JSON

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