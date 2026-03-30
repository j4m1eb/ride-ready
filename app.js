const STORAGE_KEY = "chainkeeper-state-v3";
const LEGACY_STORAGE_KEYS = ["chainkeeper-state-v2", "chainkeeper-state-v1"];

const BIKE_CONSUMABLES = [
  { key: "wax", label: "Chain wax", defaultInterval: 300 },
  { key: "chainring", label: "Chainrings", defaultInterval: 12000 },
  { key: "cassette", label: "Cassette", defaultInterval: 8000 },
  { key: "frontBrakePads", label: "Front brake pads", defaultInterval: 2500 },
  { key: "rearBrakePads", label: "Rear brake pads", defaultInterval: 2200 }
];

const WHEELSET_CONSUMABLES = [
  { key: "frontTyre", label: "Front tyre", defaultInterval: 2500, mode: "distance" },
  { key: "rearTyre", label: "Rear tyre", defaultInterval: 2200, mode: "distance" },
  { key: "frontSealant", label: "Front sealant", defaultInterval: 4, mode: "time" },
  { key: "rearSealant", label: "Rear sealant", defaultInterval: 4, mode: "time" }
];

const WHEELSET_ACTIONS = new Set(WHEELSET_CONSUMABLES.map((item) => item.key));

const demoState = buildDemoState();
const state = loadState();

const elements = {
  bikeForm: document.querySelector("#bike-form"),
  wheelsetForm: document.querySelector("#wheelset-form"),
  serviceForm: document.querySelector("#service-form"),
  bikeList: document.querySelector("#bike-list"),
  statsGrid: document.querySelector("#stats-grid"),
  activityList: document.querySelector("#activity-list"),
  wheelsetBikeSelect: document.querySelector("#wheelset-bike-select"),
  serviceBikeSelect: document.querySelector("#service-bike-select"),
  serviceTypeSelect: document.querySelector("#service-type-select"),
  serviceWheelsetLabel: document.querySelector("#service-wheelset-label"),
  serviceWheelsetSelect: document.querySelector("#service-wheelset-select"),
  seedDemo: document.querySelector("#seed-demo"),
  exportData: document.querySelector("#export-data"),
  importData: document.querySelector("#import-data"),
  connectStrava: document.querySelector("#connect-strava")
};

const templates = {
  bikeCard: document.querySelector("#bike-card-template"),
  meter: document.querySelector("#meter-template"),
  wheelset: document.querySelector("#wheelset-template")
};

normalizeState();
bindEvents();
render();

function buildDemoState() {
  const dogma50 = createWheelset({
    name: "50mm race wheels",
    notes: "Daily setup, GP5000 S TR 30 mm",
    distance: 980,
    frontTyreName: "Continental GP5000 S TR 30 mm",
    rearTyreName: "Continental GP5000 S TR 30 mm",
    frontSealantName: "Silca Ultimate Tubeless",
    rearSealantName: "Silca Ultimate Tubeless",
    frontTyreInterval: 3400,
    rearTyreInterval: 2800,
    frontSealantInterval: 4,
    rearSealantInterval: 4
  });
  dogma50.maintenance.frontTyre = { distanceAtService: 0, date: "2025-01-18" };
  dogma50.maintenance.rearTyre = { distanceAtService: 220, date: "2025-02-02" };
  dogma50.maintenance.frontSealant = { distanceAtService: 350, date: "2025-02-10" };
  dogma50.maintenance.rearSealant = { distanceAtService: 350, date: "2025-02-10" };

  const dogma65 = createWheelset({
    name: "65mm deep wheels",
    notes: "Race day setup, 28 mm tyres",
    distance: 260,
    frontTyreName: "Pirelli P Zero Race TLR RS 28 mm",
    rearTyreName: "Pirelli P Zero Race TLR RS 28 mm",
    frontSealantName: "Stan's Race",
    rearSealantName: "Stan's Race",
    frontTyreInterval: 3200,
    rearTyreInterval: 2500,
    frontSealantInterval: 3,
    rearSealantInterval: 3
  });
  dogma65.maintenance.frontTyre = { distanceAtService: 0, date: "2025-02-20" };
  dogma65.maintenance.rearTyre = { distanceAtService: 0, date: "2025-02-20" };
  dogma65.maintenance.frontSealant = { distanceAtService: 0, date: "2025-02-20" };
  dogma65.maintenance.rearSealant = { distanceAtService: 0, date: "2025-02-20" };

  const mog650b = createWheelset({
    name: "650b gravel wheels",
    notes: "45 mm tyres, Orange Seal endurance",
    distance: 860,
    frontTyreName: "WTB Raddler 45 mm",
    rearTyreName: "WTB Raddler 45 mm",
    frontSealantName: "Orange Seal Endurance",
    rearSealantName: "Orange Seal Endurance",
    frontTyreInterval: 2600,
    rearTyreInterval: 2000,
    frontSealantInterval: 3,
    rearSealantInterval: 3
  });
  mog650b.maintenance.frontTyre = { distanceAtService: 140, date: "2024-12-03" };
  mog650b.maintenance.rearTyre = { distanceAtService: 240, date: "2025-01-06" };
  mog650b.maintenance.frontSealant = { distanceAtService: 120, date: "2025-01-28" };
  mog650b.maintenance.rearSealant = { distanceAtService: 120, date: "2025-01-28" };

  const dogma = createBike({
    name: "Dogma Road",
    category: "Road",
    distance: 1240,
    wheelset: dogma50,
    waxInterval: 450,
    chainringInterval: 14000,
    cassetteInterval: 9500,
    frontBrakePadsInterval: 2800,
    rearBrakePadsInterval: 2200
  });
  dogma.maintenance.wax = { distanceAtService: 920, date: "2025-03-22" };
  dogma.maintenance.chainring = { distanceAtService: 0, date: "2024-11-02" };
  dogma.maintenance.cassette = { distanceAtService: 140, date: "2024-12-18" };
  dogma.maintenance.frontBrakePads = { distanceAtService: 180, date: "2025-02-24" };
  dogma.maintenance.rearBrakePads = { distanceAtService: 620, date: "2025-03-10" };
  dogma.wheelsets.push(dogma65);

  const mog = createBike({
    name: "MOG Gravel",
    category: "Gravel",
    distance: 860,
    wheelset: mog650b,
    waxInterval: 300,
    chainringInterval: 11000,
    cassetteInterval: 7600,
    frontBrakePadsInterval: 2400,
    rearBrakePadsInterval: 2100
  });
  mog.maintenance.wax = { distanceAtService: 710, date: "2025-03-26" };
  mog.maintenance.chainring = { distanceAtService: 0, date: "2024-10-12" };
  mog.maintenance.cassette = { distanceAtService: 80, date: "2024-11-16" };
  mog.maintenance.frontBrakePads = { distanceAtService: 260, date: "2025-01-30" };
  mog.maintenance.rearBrakePads = { distanceAtService: 260, date: "2025-01-30" };

  return {
    units: "km",
    bikes: [dogma, mog],
    activity: [
      {
        id: crypto.randomUUID(),
        bikeId: dogma.id,
        bikeName: dogma.name,
        wheelsetId: dogma50.id,
        wheelsetName: dogma50.name,
        type: "ride",
        distance: 72,
        notes: "Sunday club ride on the 50 mm wheels",
        date: "2025-03-29"
      },
      {
        id: crypto.randomUUID(),
        bikeId: mog.id,
        bikeName: mog.name,
        wheelsetId: mog650b.id,
        wheelsetName: mog650b.name,
        type: "rearSealant",
        distance: 0,
        notes: "Rear tyre top-up after a puncture plug",
        date: "2025-03-28"
      },
      {
        id: crypto.randomUUID(),
        bikeId: dogma.id,
        bikeName: dogma.name,
        wheelsetId: "",
        wheelsetName: "",
        type: "rearBrakePads",
        distance: 0,
        notes: "Rear pads replaced after wet rides",
        date: "2025-03-18"
      }
    ]
  };
}

function loadState() {
  const current = localStorage.getItem(STORAGE_KEY);
  if (current) {
    return parseState(current);
  }

  for (const key of LEGACY_STORAGE_KEYS) {
    const legacy = localStorage.getItem(key);
    if (legacy) {
      return parseState(legacy);
    }
  }

  return { units: "km", bikes: [], activity: [] };
}

function parseState(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return { units: "km", bikes: [], activity: [] };
  }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function bindEvents() {
  elements.bikeForm.addEventListener("submit", onBikeSubmit);
  elements.wheelsetForm.addEventListener("submit", onWheelsetSubmit);
  elements.serviceForm.addEventListener("submit", onServiceSubmit);
  elements.serviceBikeSelect.addEventListener("change", renderServiceWheelsetOptions);
  elements.serviceTypeSelect.addEventListener("change", updateServiceWheelsetVisibility);
  elements.seedDemo.addEventListener("click", seedDemoData);
  elements.exportData.addEventListener("click", exportState);
  elements.importData.addEventListener("change", importState);
  elements.connectStrava.addEventListener("click", showStravaStub);

  document.querySelectorAll("[data-units]").forEach((button) => {
    button.addEventListener("click", () => {
      state.units = button.dataset.units;
      persist();
      render();
    });
  });
}

function onBikeSubmit(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const wheelset = createWheelset({
    name: form.get("wheelsetName").toString().trim(),
    notes: form.get("wheelsetNotes").toString().trim(),
    distance: Number(form.get("wheelsetDistance")),
    frontTyreName: form.get("frontTyreName").toString().trim(),
    rearTyreName: form.get("rearTyreName").toString().trim(),
    frontSealantName: form.get("frontSealantName").toString().trim(),
    rearSealantName: form.get("rearSealantName").toString().trim(),
    frontTyreInterval: Number(form.get("frontTyreInterval")),
    rearTyreInterval: Number(form.get("rearTyreInterval")),
    frontSealantInterval: Number(form.get("frontSealantInterval")),
    rearSealantInterval: Number(form.get("rearSealantInterval"))
  });

  const bike = createBike({
    name: form.get("name").toString().trim(),
    category: form.get("category").toString(),
    distance: Number(form.get("distance")),
    wheelset,
    waxInterval: Number(form.get("waxInterval")),
    chainringInterval: Number(form.get("chainringInterval")),
    cassetteInterval: Number(form.get("cassetteInterval")),
    frontBrakePadsInterval: Number(form.get("frontBrakePadsInterval")),
    rearBrakePadsInterval: Number(form.get("rearBrakePadsInterval"))
  });

  state.bikes.unshift(bike);
  state.activity.unshift({
    id: crypto.randomUUID(),
    bikeId: bike.id,
    bikeName: bike.name,
    wheelsetId: wheelset.id,
    wheelsetName: wheelset.name,
    type: "setup",
    distance: bike.distance,
    notes: `${bike.category} bike created with ${wheelset.name}`,
    date: today()
  });

  event.currentTarget.reset();
  persist();
  render();
}

function onWheelsetSubmit(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const bike = getBike(form.get("bikeId").toString());
  if (!bike) return;

  const wheelset = createWheelset({
    name: form.get("name").toString().trim(),
    notes: form.get("notes").toString().trim(),
    distance: Number(form.get("distance")),
    frontTyreName: form.get("frontTyreName").toString().trim(),
    rearTyreName: form.get("rearTyreName").toString().trim(),
    frontSealantName: form.get("frontSealantName").toString().trim(),
    rearSealantName: form.get("rearSealantName").toString().trim(),
    frontTyreInterval: Number(form.get("frontTyreInterval")),
    rearTyreInterval: Number(form.get("rearTyreInterval")),
    frontSealantInterval: Number(form.get("frontSealantInterval")),
    rearSealantInterval: Number(form.get("rearSealantInterval"))
  });

  bike.wheelsets.unshift(wheelset);
  if (!bike.activeWheelsetId) bike.activeWheelsetId = wheelset.id;

  state.activity.unshift({
    id: crypto.randomUUID(),
    bikeId: bike.id,
    bikeName: bike.name,
    wheelsetId: wheelset.id,
    wheelsetName: wheelset.name,
    type: "wheelset",
    distance: wheelset.distance,
    notes: wheelset.notes || "Wheelset added",
    date: today()
  });

  event.currentTarget.reset();
  persist();
  render();
}

function onServiceSubmit(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const bike = getBike(form.get("bikeId").toString());
  if (!bike) return;

  const type = form.get("type").toString();
  const distance = Number(form.get("distance"));
  const notes = form.get("notes").toString().trim();
  const wheelsetId = form.get("wheelsetId")?.toString() || "";
  const wheelset = wheelsetId ? getWheelset(bike, wheelsetId) : null;

  if ((type === "ride" || WHEELSET_ACTIONS.has(type)) && !wheelset) {
    alert("Select a wheelset for rides, tyres, and sealant actions.");
    return;
  }

  if (type === "ride") {
    bike.distance += distance;
    wheelset.distance += distance;
    bike.activeWheelsetId = wheelset.id;
  } else if (WHEELSET_ACTIONS.has(type)) {
    wheelset.maintenance[type].distanceAtService = wheelset.distance;
    wheelset.maintenance[type].date = today();
    bike.activeWheelsetId = wheelset.id;
  } else {
    bike.maintenance[type].distanceAtService = bike.distance;
    bike.maintenance[type].date = today();
  }

  state.activity.unshift({
    id: crypto.randomUUID(),
    bikeId: bike.id,
    bikeName: bike.name,
    wheelsetId: wheelset?.id || "",
    wheelsetName: wheelset?.name || "",
    type,
    distance,
    notes,
    date: today()
  });

  event.currentTarget.reset();
  persist();
  render();
}

function render() {
  renderUnits();
  renderStats();
  renderBikes();
  renderActivity();
  renderBikeSelects();
  renderServiceWheelsetOptions();
  updateServiceWheelsetVisibility();
}

function renderUnits() {
  document.querySelectorAll("[data-units]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.units === state.units);
  });
}

function renderStats() {
  const cards = [
    { value: state.bikes.length, caption: "Bikes tracked" },
    { value: wheelsetCount(), caption: "Wheelsets tracked" },
    { value: formatDistance(totalDistance()), caption: "Bike distance" },
    { value: dueItemsCount(), caption: "Items due soon" }
  ];

  elements.statsGrid.innerHTML = "";
  cards.forEach((card) => {
    const article = document.createElement("article");
    article.className = "stat-card";
    article.innerHTML = `<strong>${card.value}</strong><p class="stat-caption">${card.caption}</p>`;
    elements.statsGrid.appendChild(article);
  });
}

function renderBikes() {
  elements.bikeList.innerHTML = "";
  if (!state.bikes.length) {
    elements.bikeList.innerHTML = `<div class="empty-state">No bikes yet. Add one to start tracking maintenance intervals.</div>`;
    return;
  }

  state.bikes.forEach((bike) => {
    const fragment = templates.bikeCard.content.cloneNode(true);
    fragment.querySelector(".bike-name").textContent = bike.name;
    fragment.querySelector(".bike-meta").textContent =
      `${bike.category} • ${formatDistance(bike.distance)} total • ${bike.wheelsets.length} wheelset${bike.wheelsets.length === 1 ? "" : "s"}`;
    fragment.querySelector(".delete-bike").addEventListener("click", () => removeBike(bike.id));

    const bikeStack = fragment.querySelector(".bike-meter-stack");
    BIKE_CONSUMABLES.forEach((item) => {
      bikeStack.appendChild(createMeter({ ...item, mode: "distance" }, bike.distance, bike.maintenance[item.key], bike.thresholds[item.key]));
    });

    const wheelsetList = fragment.querySelector(".wheelset-list");
    bike.wheelsets.forEach((wheelset) => {
      const wheelsetFragment = templates.wheelset.content.cloneNode(true);
      wheelsetFragment.querySelector(".wheelset-name").textContent = wheelset.name;
      wheelsetFragment.querySelector(".wheelset-meta").textContent =
        `${wheelset.notes || "No notes"} • ${formatDistance(wheelset.distance)} • ${bike.activeWheelsetId === wheelset.id ? "Active setup" : "Stored setup"}`;
      wheelsetFragment.querySelector(".wheelset-specs").innerHTML = `
        <p><strong>Front tyre:</strong> ${wheelset.components.frontTyre || "Not set"}</p>
        <p><strong>Rear tyre:</strong> ${wheelset.components.rearTyre || "Not set"}</p>
        <p><strong>Front sealant:</strong> ${wheelset.components.frontSealant || "Not set"}</p>
        <p><strong>Rear sealant:</strong> ${wheelset.components.rearSealant || "Not set"}</p>
      `;
      const activateButton = wheelsetFragment.querySelector(".activate-wheelset");
      activateButton.textContent = bike.activeWheelsetId === wheelset.id ? "Active" : "Set active";
      activateButton.disabled = bike.activeWheelsetId === wheelset.id;
      activateButton.addEventListener("click", () => {
        bike.activeWheelsetId = wheelset.id;
        persist();
        render();
      });

      const stack = wheelsetFragment.querySelector(".wheelset-meter-stack");
      WHEELSET_CONSUMABLES.forEach((item) => {
        stack.appendChild(createMeter(item, wheelset.distance, wheelset.maintenance[item.key], wheelset.thresholds[item.key]));
      });

      wheelsetList.appendChild(wheelsetFragment);
    });

    elements.bikeList.appendChild(fragment);
  });
}

function createMeter(item, currentDistance, maintenance, interval) {
  const fragment = templates.meter.content.cloneNode(true);
  const sinceService = item.mode === "time"
    ? monthsSince(maintenance.date)
    : currentDistance - maintenance.distanceAtService;
  const ratio = sinceService / interval;
  const status = ratio >= 1
    ? { label: "Due now", color: "var(--bad)", fill: "linear-gradient(90deg, #d6336c, #ff87b2)" }
    : ratio >= 0.8
      ? { label: "Due soon", color: "var(--warn)", fill: "linear-gradient(90deg, #f08c00, #ffd43b)" }
      : { label: "In range", color: "var(--ok)", fill: "linear-gradient(90deg, #1f6f78, #63c4bc)" };

  fragment.querySelector(".meter-label").textContent = item.label;
  fragment.querySelector(".meter-detail").textContent = item.mode === "time"
    ? `${formatMonths(sinceService)} since refresh • target ${formatMonths(interval)}`
    : `${formatDistance(sinceService)} since service • target ${formatDistance(interval)}`;
  const stateEl = fragment.querySelector(".meter-state");
  stateEl.textContent = status.label;
  stateEl.style.color = status.color;
  const fill = fragment.querySelector(".meter-fill");
  fill.style.width = `${Math.max(0, Math.min(100, ratio * 100))}%`;
  fill.style.background = status.fill;
  return fragment;
}

function renderActivity() {
  elements.activityList.innerHTML = "";
  const items = state.activity.slice(0, 10);
  if (!items.length) {
    elements.activityList.innerHTML = `<div class="empty-state">No service events yet.</div>`;
    return;
  }

  items.forEach((item) => {
    const article = document.createElement("article");
    article.className = "activity-item";
    const wheelsetCopy = item.wheelsetName ? ` • ${item.wheelsetName}` : "";
    article.innerHTML = `
      <p class="activity-title">${activityLabel(item.type)} · ${item.bikeName}${wheelsetCopy}</p>
      <p class="activity-meta">${item.date} ${item.distance ? `• ${formatDistance(item.distance)}` : ""}</p>
      <p>${item.notes || "No notes recorded."}</p>
    `;
    elements.activityList.appendChild(article);
  });
}

function renderBikeSelects() {
  [elements.wheelsetBikeSelect, elements.serviceBikeSelect].forEach((select) => {
    const current = select.value;
    select.innerHTML = "";
    if (!state.bikes.length) {
      const option = document.createElement("option");
      option.value = "";
      option.textContent = "Add a bike first";
      select.appendChild(option);
      return;
    }
    state.bikes.forEach((bike) => {
      const option = document.createElement("option");
      option.value = bike.id;
      option.textContent = bike.name;
      select.appendChild(option);
    });
    if (state.bikes.some((bike) => bike.id === current)) select.value = current;
  });
}

function renderServiceWheelsetOptions() {
  const bike = getBike(elements.serviceBikeSelect.value) || state.bikes[0];
  elements.serviceWheelsetSelect.innerHTML = "";
  if (!bike || !bike.wheelsets.length) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "No wheelsets";
    elements.serviceWheelsetSelect.appendChild(option);
    return;
  }
  bike.wheelsets.forEach((wheelset) => {
    const option = document.createElement("option");
    option.value = wheelset.id;
    option.textContent = wheelset.id === bike.activeWheelsetId ? `${wheelset.name} (active)` : wheelset.name;
    elements.serviceWheelsetSelect.appendChild(option);
  });
  elements.serviceWheelsetSelect.value = bike.activeWheelsetId || bike.wheelsets[0].id;
}

function updateServiceWheelsetVisibility() {
  const type = elements.serviceTypeSelect.value;
  const visible = type === "ride" || WHEELSET_ACTIONS.has(type);
  elements.serviceWheelsetLabel.hidden = !visible;
  elements.serviceWheelsetSelect.required = visible;
}

function removeBike(bikeId) {
  state.bikes = state.bikes.filter((bike) => bike.id !== bikeId);
  state.activity = state.activity.filter((item) => item.bikeId !== bikeId);
  persist();
  render();
}

function totalDistance() {
  return state.bikes.reduce((sum, bike) => sum + bike.distance, 0);
}

function wheelsetCount() {
  return state.bikes.reduce((sum, bike) => sum + bike.wheelsets.length, 0);
}

function dueItemsCount() {
  return state.bikes.reduce((sum, bike) => {
    const bikeDue = BIKE_CONSUMABLES.filter((item) => isDueSoon(item, bike.distance, bike.maintenance[item.key], bike.thresholds[item.key])).length;
    const wheelsetDue = bike.wheelsets.reduce((inner, wheelset) => {
      return inner + WHEELSET_CONSUMABLES.filter((item) => isDueSoon(item, wheelset.distance, wheelset.maintenance[item.key], wheelset.thresholds[item.key])).length;
    }, 0);
    return sum + bikeDue + wheelsetDue;
  }, 0);
}

function isDueSoon(item, distance, maintenance, interval) {
  const current = item.mode === "time" ? monthsSince(maintenance.date) : distance - maintenance.distanceAtService;
  return current / interval >= 0.8;
}

function exportState() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "chainkeeper-data.json";
  link.click();
  URL.revokeObjectURL(url);
}

function importState(event) {
  const [file] = event.target.files;
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = JSON.parse(reader.result);
      if (!Array.isArray(imported.bikes) || !Array.isArray(imported.activity)) throw new Error("Invalid shape");
      state.units = imported.units;
      state.bikes = imported.bikes;
      state.activity = imported.activity;
      normalizeState();
      persist();
      render();
    } catch {
      alert("Could not import that file.");
    }
  };
  reader.readAsText(file);
  event.target.value = "";
}

function seedDemoData() {
  state.units = demoState.units;
  state.bikes = structuredClone(demoState.bikes);
  state.activity = structuredClone(demoState.activity);
  persist();
  render();
}

function showStravaStub() {
  alert("Strava sync should attach each ride to a bike, then let you confirm which wheelset was used so front and rear tyre/sealant mileage stays accurate.");
}

function normalizeState() {
  state.units = state.units === "mi" ? "mi" : "km";
  state.bikes = (state.bikes || []).map((bike) => normalizeBike(bike));
  state.activity = (state.activity || []).map((item) => ({ wheelsetId: "", wheelsetName: "", ...item }));
}

function normalizeBike(bike) {
  const normalized = {
    ...bike,
    id: bike.id || crypto.randomUUID(),
    distance: Number(bike.distance || 0),
    thresholds: { ...(bike.thresholds || {}) },
    maintenance: { ...(bike.maintenance || {}) }
  };

  migrateBrakePads(normalized);

  BIKE_CONSUMABLES.forEach((item) => {
    normalized.thresholds[item.key] = Number(normalized.thresholds[item.key] || item.defaultInterval);
    normalized.maintenance[item.key] = normalizeMaintenance(normalized.maintenance[item.key], normalized.distance);
  });

  if (Array.isArray(bike.wheelsets) && bike.wheelsets.length) {
    normalized.wheelsets = bike.wheelsets.map((wheelset) => normalizeWheelset(wheelset, normalized.distance));
  } else {
    normalized.wheelsets = [createWheelsetFromLegacyBike(normalized)];
  }

  if (!normalized.activeWheelsetId || !normalized.wheelsets.some((wheelset) => wheelset.id === normalized.activeWheelsetId)) {
    normalized.activeWheelsetId = normalized.wheelsets[0].id;
  }

  return normalized;
}

function normalizeWheelset(wheelset, fallbackDistance) {
  const normalized = {
    ...wheelset,
    id: wheelset.id || crypto.randomUUID(),
    name: wheelset.name || "Default wheelset",
    notes: wheelset.notes || "",
    distance: Number(wheelset.distance ?? fallbackDistance ?? 0),
    components: { ...(wheelset.components || {}) },
    thresholds: { ...(wheelset.thresholds || {}) },
    maintenance: { ...(wheelset.maintenance || {}) }
  };

  migrateWheelsetConsumables(normalized, fallbackDistance);

  WHEELSET_CONSUMABLES.forEach((item) => {
    normalized.thresholds[item.key] = Number(normalized.thresholds[item.key] || item.defaultInterval);
    normalized.maintenance[item.key] = normalizeMaintenance(normalized.maintenance[item.key], normalized.distance);
  });

  return normalized;
}

function migrateBrakePads(bike) {
  if (!bike.thresholds.frontBrakePads && bike.thresholds.brakePads) bike.thresholds.frontBrakePads = bike.thresholds.brakePads;
  if (!bike.thresholds.rearBrakePads && bike.thresholds.brakePads) bike.thresholds.rearBrakePads = bike.thresholds.brakePads;
  if (!bike.maintenance.frontBrakePads && bike.maintenance.brakePads) bike.maintenance.frontBrakePads = bike.maintenance.brakePads;
  if (!bike.maintenance.rearBrakePads && bike.maintenance.brakePads) bike.maintenance.rearBrakePads = bike.maintenance.brakePads;
}

function migrateWheelsetConsumables(wheelset, fallbackDistance) {
  const legacyTyreInterval = Number(wheelset.thresholds.tyre || WHEELSET_CONSUMABLES[0].defaultInterval);
  const legacySealantInterval = Number(wheelset.thresholds.sealant || WHEELSET_CONSUMABLES[2].defaultInterval);
  wheelset.components.frontTyre = wheelset.components.frontTyre || "";
  wheelset.components.rearTyre = wheelset.components.rearTyre || "";
  wheelset.components.frontSealant = wheelset.components.frontSealant || "";
  wheelset.components.rearSealant = wheelset.components.rearSealant || "";
  if (!wheelset.thresholds.frontTyre) wheelset.thresholds.frontTyre = legacyTyreInterval;
  if (!wheelset.thresholds.rearTyre) wheelset.thresholds.rearTyre = legacyTyreInterval;
  if (!wheelset.thresholds.frontSealant) wheelset.thresholds.frontSealant = legacySealantInterval;
  if (!wheelset.thresholds.rearSealant) wheelset.thresholds.rearSealant = legacySealantInterval;
  if (!wheelset.maintenance.frontTyre) wheelset.maintenance.frontTyre = wheelset.maintenance.tyre || normalizeMaintenance(null, wheelset.distance ?? fallbackDistance);
  if (!wheelset.maintenance.rearTyre) wheelset.maintenance.rearTyre = wheelset.maintenance.tyre || normalizeMaintenance(null, wheelset.distance ?? fallbackDistance);
  if (!wheelset.maintenance.frontSealant) wheelset.maintenance.frontSealant = wheelset.maintenance.sealant || normalizeMaintenance(null, wheelset.distance ?? fallbackDistance);
  if (!wheelset.maintenance.rearSealant) wheelset.maintenance.rearSealant = wheelset.maintenance.sealant || normalizeMaintenance(null, wheelset.distance ?? fallbackDistance);
}

function createBike({ name, category, distance, wheelset, waxInterval, chainringInterval, cassetteInterval, frontBrakePadsInterval, rearBrakePadsInterval }) {
  const bike = {
    id: crypto.randomUUID(),
    name,
    category,
    distance,
    activeWheelsetId: wheelset.id,
    thresholds: {
      wax: waxInterval,
      chainring: chainringInterval,
      cassette: cassetteInterval,
      frontBrakePads: frontBrakePadsInterval,
      rearBrakePads: rearBrakePadsInterval
    },
    maintenance: {},
    wheelsets: [wheelset]
  };
  BIKE_CONSUMABLES.forEach((item) => {
    bike.maintenance[item.key] = normalizeMaintenance(null, distance);
  });
  return bike;
}

function createWheelset({ name, notes, distance, frontTyreName, rearTyreName, frontSealantName, rearSealantName, frontTyreInterval, rearTyreInterval, frontSealantInterval, rearSealantInterval }) {
  const wheelset = {
    id: crypto.randomUUID(),
    name,
    notes,
    distance,
    components: {
      frontTyre: frontTyreName,
      rearTyre: rearTyreName,
      frontSealant: frontSealantName,
      rearSealant: rearSealantName
    },
    thresholds: {
      frontTyre: frontTyreInterval,
      rearTyre: rearTyreInterval,
      frontSealant: frontSealantInterval,
      rearSealant: rearSealantInterval
    },
    maintenance: {}
  };
  WHEELSET_CONSUMABLES.forEach((item) => {
    wheelset.maintenance[item.key] = normalizeMaintenance(null, distance);
  });
  return wheelset;
}

function createWheelsetFromLegacyBike(bike) {
  return normalizeWheelset({
    id: crypto.randomUUID(),
    name: "Default wheelset",
    notes: "Migrated from bike-level tyre and sealant tracking",
    distance: bike.distance,
    thresholds: {
      tyre: bike.thresholds.tyre,
      sealant: bike.thresholds.sealant
    },
    maintenance: {
      tyre: bike.maintenance.tyre,
      sealant: bike.maintenance.sealant
    }
  }, bike.distance);
}

function normalizeMaintenance(maintenance, distance) {
  if (maintenance) {
    return {
      distanceAtService: Number(maintenance.distanceAtService || 0),
      date: maintenance.date || today()
    };
  }
  return { distanceAtService: Number(distance || 0), date: today() };
}

function getBike(id) {
  return state.bikes.find((bike) => bike.id === id);
}

function getWheelset(bike, id) {
  return bike.wheelsets.find((wheelset) => wheelset.id === id);
}

function activityLabel(type) {
  const labels = {
    setup: "Bike created",
    wheelset: "Wheelset added",
    ride: "Ride added",
    wax: "Chain waxed",
    chainring: "Chainrings replaced",
    cassette: "Cassette replaced",
    frontBrakePads: "Front brake pads replaced",
    rearBrakePads: "Rear brake pads replaced",
    frontTyre: "Front tyre replaced",
    rearTyre: "Rear tyre replaced",
    frontSealant: "Front sealant refreshed",
    rearSealant: "Rear sealant refreshed"
  };
  return labels[type] || "Updated";
}

function formatDistance(distance) {
  const value = state.units === "mi" ? distance * 0.621371 : distance;
  const rounded = value >= 100 ? Math.round(value) : value.toFixed(1);
  return `${rounded} ${state.units}`;
}

function formatMonths(months) {
  const rounded = months >= 10 ? Math.round(months) : months.toFixed(1);
  return `${rounded} mo`;
}

function monthsSince(dateString) {
  const now = new Date();
  const then = new Date(dateString);
  const ms = now.getTime() - then.getTime();
  return Math.max(0, ms / (1000 * 60 * 60 * 24 * 30.4375));
}

function today() {
  return new Date().toISOString().slice(0, 10);
}
