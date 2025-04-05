let map;

window.onload = function () {
  fetch("/api/maps_api_key")
    .then((res) => res.json())
    .then((data) => {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${data.key}&callback=initMap`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    })
    .catch((err) => console.error("Failed to load Google Maps:", err));

  fetchTollData(); // fetch + display toll table
};

function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 40.7580, lng: -73.9855 },
    zoom: 13,
  });

  const trafficLayer = new google.maps.TrafficLayer();
  trafficLayer.setMap(map);
}

function fetchTollData() {
  fetch("/api/realtime_tolls")
    .then((res) => res.json())
    .then((data) => {
      // Update global congestion display
      const globalDisplay = document.getElementById("global-congestion");
      if (globalDisplay) {
        globalDisplay.textContent = data.global_congestion.toFixed(2);
      }

      // Update table
      const tbody = document.querySelector("#toll-table tbody");
      tbody.innerHTML = ""; // clear existing rows

      // Populate local inputs for test mode
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

      for (const entry of data.entry_points) {
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
      console.error("Failed to fetch toll data:", err);
    });
}

function runModelTester() {
  const global = parseFloat(document.getElementById("global-input").value);
  const localInputs = document.querySelectorAll(".local-input");
  const localValues = Array.from(localInputs).map((el) => ({
    name: el.dataset.name,
    value: parseFloat(el.value),
  }));

  fetch("/api/test_model", {
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