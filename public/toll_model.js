let map;

window.onload = function () {
  // Load Google Maps API key dynamically
  fetch("http://localhost:5000/api/maps_api_key")
    .then((res) => res.json())
    .then((data) => {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${data.key}&callback=initMap`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    })
    .catch((err) => console.error("Failed to load Google Maps:", err));

  fetchTollData(); // Fetch and display toll table
};

// Initialize the Google Map with dark mode and traffic
function initMap() {
  const darkMapStyle = [
    { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
    {
      featureType: "administrative.locality",
      elementType: "labels.text.fill",
      stylers: [{ color: "#d59563" }],
    },
    {
      featureType: "poi",
      elementType: "labels.text.fill",
      stylers: [{ color: "#d59563" }],
    },
    {
      featureType: "poi.park",
      elementType: "geometry",
      stylers: [{ color: "#263c3f" }],
    },
    {
      featureType: "poi.park",
      elementType: "labels.text.fill",
      stylers: [{ color: "#6b9a76" }],
    },
    {
      featureType: "road",
      elementType: "geometry",
      stylers: [{ color: "#38414e" }],
    },
    {
      featureType: "road",
      elementType: "geometry.stroke",
      stylers: [{ color: "#212a37" }],
    },
    {
      featureType: "road",
      elementType: "labels.text.fill",
      stylers: [{ color: "#9ca5b3" }],
    },
    {
      featureType: "road.highway",
      elementType: "geometry",
      stylers: [{ color: "#746855" }],
    },
    {
      featureType: "road.highway",
      elementType: "geometry.stroke",
      stylers: [{ color: "#1f2835" }],
    },
    {
      featureType: "road.highway",
      elementType: "labels.text.fill",
      stylers: [{ color: "#f3d19c" }],
    },
    {
      featureType: "transit",
      elementType: "geometry",
      stylers: [{ color: "#2f3948" }],
    },
    {
      featureType: "transit.station",
      elementType: "labels.text.fill",
      stylers: [{ color: "#d59563" }],
    },
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [{ color: "#17263c" }],
    },
    {
      featureType: "water",
      elementType: "labels.text.fill",
      stylers: [{ color: "#515c6d" }],
    },
    {
      featureType: "water",
      elementType: "labels.text.stroke",
      stylers: [{ color: "#17263c" }],
    },
  ];

  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 40.7580, lng: -73.9855 },
    zoom: 13,
    styles: darkMapStyle,
  });

  const trafficLayer = new google.maps.TrafficLayer();
  trafficLayer.setMap(map);
}

// Fetch and display toll data
function fetchTollData() {
  fetch("http://localhost:5000/api/realtime_tolls")
    .then((res) => res.json())
    .then((data) => {
      // Update global congestion display
      const globalDisplay = document.getElementById("global-congestion");
      if (globalDisplay) {
        globalDisplay.textContent = data.global_congestion.toFixed(2);
      }

      // Update toll table
      const tbody = document.querySelector("#toll-table tbody");
      tbody.innerHTML = "";

      // Populate local inputs for model tester
      const localContainer = document.getElementById("local-inputs");
      localContainer.innerHTML = "<h4>Local Congestion Inputs:</h4>";

      for (const entry of data.entry_points) {
        const input = document.createElement("input");
        input.type = "number";
        input.min = 0;
        input.max = 1;
        input.step = 0.01;
        input.className = "local-input";
        input.dataset.name = entry.name;
        input.value = entry.local_congestion.toFixed(2);

        const label = document.createElement("label");
        label.textContent = `${entry.name}: `;
        label.appendChild(input);

        localContainer.appendChild(label);
        localContainer.appendChild(document.createElement("br"));
      }

      // Populate toll table
      for (const entry of data.entry_points) {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${entry.name}</td>
          <td>${entry.local_congestion.toFixed(2)}</td>
          <td>$${entry.toll.toFixed(2)}</td>
        `;
        tbody.appendChild(row);
      }

      // Sync map height after table is updated
      syncMapHeight();
    })
    .catch((err) => {
      console.error("Failed to fetch toll data:", err);
    });
}

// Run model tester and update test results
function runModelTester() {
  const global = parseFloat(document.getElementById("global-input").value);
  const localInputs = document.querySelectorAll(".local-input");
  const localValues = Array.from(localInputs).map((el) => ({
    name: el.dataset.name,
    value: parseFloat(el.value),
  }));

  fetch("http://localhost:5000/api/test_model", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      global_congestion: global,
      local_congestion: localValues,
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      const tbody = document.querySelector("#test-results tbody");
      tbody.innerHTML = "";

      for (const entry of data.results) {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${entry.name}</td>
          <td>${entry.local_congestion.toFixed(2)}</td>
          <td>$${entry.toll.toFixed(2)}</td>
        `;
        tbody.appendChild(row);
      }
    })
    .catch((err) => {
      console.error("Failed to test model:", err);
    });
}

// Sync the map height to match the model toll output
function syncMapHeight() {
  const modelOutput = document.getElementById("model-output");
  const mapEl = document.getElementById("map");
  if (modelOutput && mapEl) {
    const height = modelOutput.offsetHeight;
    mapEl.style.height = height + "px";
  }
}

// Observe toll table changes and sync height
const observer = new MutationObserver(syncMapHeight);
window.addEventListener("load", () => {
  const tollTbody = document.querySelector("#toll-table tbody");
  if (tollTbody) {
    observer.observe(tollTbody, { childList: true, subtree: true });
  }
});
window.addEventListener("resize", syncMapHeight);