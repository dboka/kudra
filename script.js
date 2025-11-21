// ==========================================
// MAP INITIALIZATION
// ==========================================
const map = L.map("map", {
    center: [56.95, 26],   // moved left
    zoom: 7,
    preferCanvas: true
});

// Canvas renderer performance boost
const canvasRenderer = L.canvas({ padding: 0.5 });

// Basemaps
const darkBase = L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    { maxZoom: 19 }
).addTo(map);

// Light style – līdzīga tai bildē (Carto light)
const lightBase = L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    { maxZoom: 19 }
);

let isDark = true;

// Basemap toggle button
const toggleBtn = document.getElementById("toggle-basemap");
toggleBtn.addEventListener("click", () => {
    if (isDark) {
        map.removeLayer(darkBase);
        lightBase.addTo(map);
        toggleBtn.textContent = "Tumšā karte";
        toggleBtn.classList.add("active");
        isDark = false;
    } else {
        map.removeLayer(lightBase);
        darkBase.addTo(map);
        toggleBtn.textContent = "Gaišā karte";
        toggleBtn.classList.remove("active");
        isDark = true;
    }
});


// ==========================================
// LAYER CONFIG
// ==========================================
const layerConfigs = [
    {
        key: "eraf",
        title: "Kūdras ERAF izplatība",
        file: "data/kudra_eraf.topojson",
        color: "#ff8800",
        group: "Kūdras ieguves vieta (poligoni, punkti)",
        type: "polygon"
    },
    {
        key: "licences_active",
        title: "Spēkā esošās licences",
        file: "data/Derigo_licences_esosas.topojson",
        color: "#00e676",
        group: "Aktīvas licences",
        type: "polygon"
    },
    {
        key: "licences_inactive",
        title: "Neesošās spēkā licences",
        file: "data/Derigo_licences_neesosas.topojson",
        color: "#8888ff",
        group: "Vēsturiskie dati",
        type: "polygon"
    },
    {
        key: "rekultivetas",
        title: "Rekultivētās kūdras vietas",
        file: "data/Rekultivetas_kudras_vietas.topojson",
        color: "#00bcd4",
        group: "Degradētās platības",
        type: "polygon"
    },
    {
        key: "vesturiskas",
        title: "Vēsturiskās kūdrasieguves vietas",
        file: "data/Vesturiskas_kudras_vietas.topojson",
        color: "#ffb74d",
        group: "Vēsturiskie dati",
        type: "polygon"
    },
    {
        key: "life",
        title: "Degradētās platības (LIFE Restore)",
        file: "data/LIFE_Restore_degradetas.topojson",
        color: "#ff1744",
        group: "Degradētās platības",
        type: "polygon"
    },
    {
        key: "ietekmetas",
        title: "Kūdras ieguves ietekmētās platības",
        file: "data/Kudras_ietekmetas_platibas.topojson",
        color: "#d81b60",
        group: "Degradētās platības",
        type: "polygon"
    },
    {
        key: "rigas_mezi",
        title: "SIA “Rīgas meži” — degradētās teritorijas",
        file: "data/Rigas_mezi_degradetas.topojson",
        color: "#2979ff",
        group: "Degradētās platības",
        type: "polygon"
    },
    {
        key: "eraf_punkti",
        title: "Kūdras ERAF punkti",
        file: "data/Kudra_punkti.topojson",
        color: "#ff1744",
        group: "Kūdras ieguves vieta (poligoni, punkti)",
        type: "point"
    }
];

const layers = {};
let allLayers = [];

// ==========================================
// POPUP + HOVER BINDER
// ==========================================
function bindPopupAndHover(cfg) {
    return (feature, layer) => {
        // popup
        let html = `<div class='popup-box'><h3>${cfg.title}</h3>`;
        if (feature.properties) {
            for (const [k, v] of Object.entries(feature.properties)) {
                html += `<b>${k}:</b> ${v}<br>`;
            }
        }
        html += "</div>";
        layer.bindPopup(html);

        // hover (only for polygons/lines)
        layer.on({
            mouseover: e => {
                const t = e.target;
                if (t.setStyle) t.setStyle({ weight: 3, fillOpacity: 0.8 });
                if (t.bringToFront) t.bringToFront();
            },
            mouseout: e => {
                const t = e.target;
                const parent = layers[cfg.key];
                if (parent && parent.resetStyle && t.setStyle) {
                    parent.resetStyle(t);
                }
            }
        });
    };
}

// ==========================================
// LOAD TOPOJSON LAYER (FIXED FOR CIRCLEMArkER)
// ==========================================
function loadTopoLayer(cfg) {
    fetch(cfg.file)
        .then(r => r.json())
        .then(topo => {
            const objName = Object.keys(topo.objects)[0];
            const geo = topojson.feature(topo, topo.objects[objName]);

            let layer;

            // POINT LAYERS → circleMarker instead of flag icon
            if (cfg.type === "point") {
                layer = L.geoJSON(geo, {
                    pointToLayer: (feature, latlng) =>
                        L.circleMarker(latlng, {
                            radius: 5,
                            fillColor: cfg.color,
                            color: "#ffffff",
                            weight: 1,
                            opacity: 1,
                            fillOpacity: 0.85
                        }),
                    onEachFeature: bindPopupAndHover(cfg)
                });

            // POLYGON LAYERS → unchanged
            } else {
                layer = L.geoJSON(geo, {
                    renderer: canvasRenderer,
                    style: {
                        color: cfg.color,
                        weight: 1,
                        fillColor: cfg.color,
                        fillOpacity: 0.45
                    },
                    onEachFeature: bindPopupAndHover(cfg)
                });
            }

            layers[cfg.key] = layer;
            allLayers.push(layer);
        })
        .catch(err => console.error("TopoJSON load error:", cfg.file, err));
}

// Load all topo layers (bet nevienu neliekam kartē sākumā)
layerConfigs.forEach(loadTopoLayer);

// ==========================================
// SIDEBAR – LAYER LIST
// ==========================================

const groups = {};
layerConfigs.forEach(cfg => {
    if (!groups[cfg.group]) groups[cfg.group] = [];
    groups[cfg.group].push(cfg);
});

const sidebar = document.getElementById("layer-groups");

Object.entries(groups).forEach(([groupName, cfgs]) => {
    const title = document.createElement("div");
    title.className = "layer-group-title";
    title.textContent = groupName;
    sidebar.appendChild(title);

    cfgs.forEach(cfg => {
        const row = document.createElement("div");
        row.className = "layer-item";

        const colorBox = document.createElement("span");
        colorBox.className = "layer-color-box";
        colorBox.style.backgroundColor = cfg.color;

        const chk = document.createElement("input");
        chk.type = "checkbox";
        chk.dataset.key = cfg.key;
        chk.checked = false; // sākumā viss izslēgts

        chk.addEventListener("change", () => {
        const lyr = layers[cfg.key];
        if (!lyr) return;

        if (chk.checked) {
        map.addLayer(lyr);
        row.classList.add("active");
        } else {
        map.removeLayer(lyr);
        row.classList.remove("active");
        }
    });

        const label = document.createElement("span");
        label.textContent = cfg.title;

        row.append(colorBox, chk, label);
        sidebar.appendChild(row);
    });
});
// ==========================================
// ADD EXPLANATION TEXT BELOW LAYERS
// ==========================================
const infoText = `
    <p class="sidebar-info">
        <b>Kāpēc šī karte ir izveidota?</b><br>
        Karte ir izveidota, lai vienuviet apkopotu informāciju par Latvijas kūdras ieguves vietām, degradētajām teritorijām un vēsturiskajiem datiem. Tā sniedz ātru un vizuāli pārskatāmu ieskatu teritoriju stāvoklī un palīdz pieņemt pamatotus lēmumus dabas resursu pārvaldībā.<br><br>

        <b>Ko šī karte palīdz saprast?</b><br>
        – aktīvās un neaktīvās licences,<br>
        – degradētās un rekultivētās platības,<br>
        – vēsturiskās kūdras ieguves vietas,<br>
        – ERAF un LIFE projektu teritorijas.<br><br>

        <b>Kāda ir kartes nozīme?</b><br>
        Tā ļauj speciālistiem, pašvaldībām un iedzīvotājiem vērtēt teritorijas, plānot attīstību un nodrošināt ilgtspējīgu zemes izmantošanu.
    </p>
`;

document.getElementById("sidebar").insertAdjacentHTML("beforeend", infoText);

// ==========================================
// SEARCH
// ==========================================
function searchByAttribute(query) {
    const q = query.trim().toLowerCase();
    if (!q) return;

    let foundFeature = null;
    let foundParentLayer = null;
    let foundBounds = null;

    for (const [key, lyr] of Object.entries(layers)) {
        if (!lyr) continue;

        lyr.eachLayer(f => {
            if (foundFeature) return;

            const props = f.feature && f.feature.properties;
            if (!props) return;

            for (const v of Object.values(props)) {
                if (v && String(v).toLowerCase().includes(q)) {
                    foundFeature = f;
                    foundParentLayer = key;

                    if (f.getBounds) {
                        foundBounds = f.getBounds();
                    } else if (f.getLatLng) {
                        const ll = f.getLatLng();
                        foundBounds = L.latLngBounds(ll, ll);
                    }
                    return;
                }
            }
        });

        if (foundFeature) break;
    }

    if (!foundFeature || !foundBounds) {
        alert("Nekas netika atrasts.");
        return;
    }

    // 1) izslēdzam visus slāņus
    Object.values(layers).forEach(lyr => {
        if (map.hasLayer(lyr)) map.removeLayer(lyr);
    });

    // 2) ieslēdzam tikai to, kur atradās objekts
    const activeLayer = layers[foundParentLayer];
    if (!map.hasLayer(activeLayer)) {
        map.addLayer(activeLayer);
    }

    // 3) atjaunojam checkbox UI
    document.querySelectorAll("#layer-groups input[type='checkbox']")
        .forEach(chk => {
            chk.checked = (chk.dataset.key === foundParentLayer);
        });

    // 4) pietuvinām un atveram popup
    map.fitBounds(foundBounds.pad(0.4));
    foundFeature.openPopup();
}

// Search UI events
const searchInput = document.getElementById("search-input");
const searchBtn = document.getElementById("search-btn");

searchBtn.addEventListener("click", () => {
    searchByAttribute(searchInput.value);
});

searchInput.addEventListener("keydown", e => {
    if (e.key === "Enter") {
        searchByAttribute(searchInput.value);
    }
});
// ============================
// SIDEBAR OPEN/CLOSE (MOBILE)
// ============================
const sidebarEl = document.getElementById("sidebar");
const toggleBtnEl = document.getElementById("sidebar-toggle");
const backdropEl = document.getElementById("sidebar-backdrop");

toggleBtnEl.addEventListener("click", () => {
    sidebarEl.classList.toggle("open");
    backdropEl.classList.toggle("visible");
});

// click outside to close
backdropEl.addEventListener("click", () => {
    sidebarEl.classList.remove("open");
    backdropEl.classList.remove("visible");
});