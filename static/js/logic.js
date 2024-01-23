// Define New York City coordinates and map zoom level
let newYorkCoords = [40.73, -74.0059];
let mapZoomLevel = 12;
let map;

// Create the createMap function
function createMap() {
  // Create the tile layer that will be the background of our map
  let lightmap = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors",
    maxZoom: 18
  });

  // Create a map object
  map = L.map("map-id", {
    center: newYorkCoords,
    zoom: mapZoomLevel,
    layers: [lightmap]
  });

  fetchDataAndCreateMap();
}

// Create a function to perform API calls and process the data
function fetchDataAndCreateMap() {
  // Perform an API call to the Citi Bike station information endpoint
  d3.json("https://gbfs.citibikenyc.com/gbfs/en/station_information.json").then(stationInfo => {
    // Perform a second API call to the Citi Bike station status endpoint
    d3.json("https://gbfs.citibikenyc.com/gbfs/en/station_status.json").then(stationStatus => {
      createMarkersWithStatus(stationInfo, stationStatus);
    });
  });
}

function createMarkersWithStatus(stationInfo, stationStatus) {
  let stations = stationInfo.data.stations;
  let status = stationStatus.data.stations;
  let bikeMarkers = [];
  let comingSoonGroup = L.layerGroup();
  let emptyStationsGroup = L.layerGroup();
  let outOfOrderGroup = L.layerGroup();
  let lowStationsGroup = L.layerGroup();
  let healthyStationsGroup = L.layerGroup();

  stations.forEach(station => {
    let currentStatus = status.find(s => s.station_id === station.station_id);

    // Determine the marker type based on the station status
    let markerColor = "green"; // Default for healthy stations
    if (!currentStatus.is_installed) {
      markerColor = "grey"; // Coming soon
    } else if (!currentStatus.is_renting) {
      markerColor = "red"; // Out of order
    } else if (currentStatus.num_bikes_available === 0) {
      markerColor = "blue"; // Empty stations
    } else if (currentStatus.num_bikes_available < 5) {
      markerColor = "orange"; // Low stations
    }

    // Create a marker and bind a popup with the station's name, capacity, and available bikes
    let bikeMarker = L.marker([station.lat, station.lon], {
      icon: L.ExtraMarkers.icon({
        icon: "fa-bicycle",
        markerColor: markerColor,
        shape: "circle"
      })
    }).bindPopup(`<h3>${station.name}</h3><p>Capacity: ${station.capacity}</p><p>Available Bikes: ${currentStatus.num_bikes_available}</p>`);

    bikeMarkers.push(bikeMarker);

    // Add markers to the appropriate group
    if (!currentStatus.is_installed) {
      comingSoonGroup.addLayer(bikeMarker);
    } else if (!currentStatus.is_renting) {
      outOfOrderGroup.addLayer(bikeMarker);
    } else if (currentStatus.num_bikes_available === 0) {
      emptyStationsGroup.addLayer(bikeMarker);
    } else if (currentStatus.num_bikes_available < 5) {
      lowStationsGroup.addLayer(bikeMarker);
    } else {
      healthyStationsGroup.addLayer(bikeMarker);
    }
  });

  // Create a layer control to switch between different groups
  let layerControl = L.control.layers({
    "Bike Station": healthyStationsGroup
  }, {
    "Coming Soon": comingSoonGroup,
    "Empty Stations": emptyStationsGroup,
    "Out of Order": outOfOrderGroup,
    "Low Stations": lowStationsGroup
  }).addTo(map);

  // Add all layers to the map initially
  map.addLayer(healthyStationsGroup);
  map.addLayer(comingSoonGroup);
  map.addLayer(emptyStationsGroup);
  map.addLayer(outOfOrderGroup);
  map.addLayer(lowStationsGroup);

// Add legend to the map
let legend = L.control({ position: "bottomright" });
legend.onAdd = function (map) {
  let div = L.DomUtil.create("div", "info legend");
  div.innerHTML += '<span class="legend-icon" style="background-color: green;"></span> Healthy Stations<br>';
  div.innerHTML += '<span class="legend-icon" style="background-color: grey;"></span> Coming Soon<br>';
  div.innerHTML += '<span class="legend-icon" style="background-color: red;"></span> Out of Order<br>';
  div.innerHTML += '<span class="legend-icon" style="background-color: blue;"></span> Empty Stations<br>';
  div.innerHTML += '<span class="legend-icon" style="background-color: orange;"></span> Low Stations<br>';
  return div;
};
legend.addTo(map);
}

// Call the createMap function to initialize the map
createMap();
