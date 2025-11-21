require([
  "esri/views/MapView",
  "esri/WebMap",
  "esri/layers/GeoJSONLayer"
], function (MapView, WebMap, GeoJSONLayer) {

  // ==== WebMap no ArcGIS Online (tavs esošais kartes projekts) ====
  const webmap = new WebMap({
    portalItem: {
      id: "9ff33072bb01412399123d65b4da851d",
      portal: "https://lu-dac.maps.arcgis.com"
    }
  });

  const view = new MapView({
    container: "map",
    map: webmap,
    center: [25.0, 57.0],
    zoom: 7,
    ui: {
      components: [] // no default ESRI UI
    }
  });

  // ==== Custom zoom pogas ====
  document.getElementById("zoomIn").onclick = () => { view.zoom += 1; };
  document.getElementById("zoomOut").onclick = () => { view.zoom -= 1; };

  // ==== GeoJSON slāņu definīcijas ====
  // Pielāgo šo ceļu – mape, kur stāv tavi .geojson/.geojson.gz faili
  const geojsonDir = "geojson/"; // piemēram: ./geojson/ vai relatīvs URL no servera saknes

  const layersInfo = [
    { name: "AM Radars BLUE level līdz 2028", file: "AM Radars  BLUE level spēkā līdz 2028. gadam;_optimized_dissolved.geojson" },
    { name: "AM Radars BLUE LEVEL after 2028", file: "AM Radars BLUE LEVEL after 2028_optimized_dissolved.geojson" },
    { name: "AM Radars YELLOW level no 2028", file: "AM Radars YELLOW level no 2028_optimized_dissolved.geojson" },
    { name: "AM Radars YELLOW level līdz 2028", file: "AM Radars YELLOW level spēkā līdz 2028. gadam;_optimized_dissolved.geojson" },
    { name: "CSP BAT dati pilsētas", file: "CSP_BAT_dati_pilsetas_optimized.geojson" },
    { name: "DAP Aizsargājamie koki", file: "DAP_Aizsargajamie_koki_optimized_dissolved.geojson" },
    { name: "DAP IADT ainavas", file: "DAP_IADT_ainavas_optimized_dissolved.geojson" },
    { name: "DAP IADT dabas pieminekļi", file: "DAP_IADT_dabas_pieminekli_optimized_dissolved.geojson" },
    { name: "DAP Īpaši aizsarg. biotopi FAST", file: "DAP_Ipasi_aizsargajamie_biotopi_FAST.geojson" },
    { name: "DAP mikroliegumi un buferzonas", file: "DAP_mikroliegumi_un_buferzonas_optimized_dissolved.geojson" },
    { name: "DAP Nacionālās ainavu telpas", file: "DAP_Nacionalas_ainavu_telpas_optimized_dissolved.geojson" },
    { name: "DAP potenciālās Natura 2000 teritorijas", file: "DAP_potencialas_natura_2000_teritorijas_optimized_dissolved.geojson" },
    { name: "DAP Sugu atradnes", file: "DAP_Sugu_atradnes_optimized_dissolved.geojson" },
    { name: "Īpaši aizsargājamas dabas teritorijas zonejums", file: "Ipasi_aizsargajamas_dabas_teritorijas_zonejums_nav_verts_union_optimized_dissolved.geojson" },
    { name: "LVĢMC Radars BLUE", file: "LVGMC Radars BLUE level_optimized_dissolved.geojson" },
    { name: "LVĢMC Radars ORANGE", file: "LVGMC Radars ORANGE level_optimized_dissolved.geojson" },
    { name: "LVĢMC Radars YELLOW", file: "LVGMC Radars YELLOW LEVEL_optimized_dissolved.geojson" },
    { name: "VMD meži FAST", file: "VMD_mezi_optimizeti_FAST.geojson.gz" },
    { name: "VVD Atkritumu poligoni", file: "VVD_Atkritumu_poligoni_optimized_dissolved.geojson" },
    { name: "VVD Piesārņotās vietas", file: "VVD_Piesarnotas_vietas_optimized_dissolved.geojson" },
    { name: "VVD Potenciāli piesārņotās vietas", file: "VVD_Potenciali_piesarnotas_vietas_optimized_dissolved.geojson" }
  ];

  // ==== GeoJSONLayer objekti (neredzami, tikai query) ====
  const geoLayers = layersInfo.map(info => {
    const layer = new GeoJSONLayer({
      url: geojsonDir + encodeURIComponent(info.file),
      title: info.name,
      visible: false,
      outFields: ["*"]
    });
    webmap.add(layer);
    return layer;
  });

  // ==== Pop-up loģika: slāņu pārklājumi punktā ====
  view.on("click", async function (event) {
    const found = [];

    for (const layer of geoLayers) {
      const query = layer.createQuery();
      query.geometry = event.mapPoint;
      query.spatialRelationship = "intersects";
      query.returnGeometry = false;
      query.outFields = ["*"];

      try {
        const result = await layer.queryFeatures(query);
        if (result.features.length > 0) {
          found.push(layer.title);
        }
      } catch (err) {
        console.error("Query error for layer:", layer.title, err);
      }
    }

    let content;
    if (found.length === 0) {
      content = "Šajā punktā nav neviena GeoJSON slāņa pārklājuma.";
    } else {
      content = "<b>Pārklājas šie slāņi:</b><br><br>" +
        found.map(nosaukums => "• " + nosaukums).join("<br>");
    }

    view.popup.open({
      location: event.mapPoint,
      title: "Slāņu pārklājums",
      content: content
    });
  });

});
