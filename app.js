const STORAGE_KEY = "chainkeeper-state-v4";
const LEGACY_STORAGE_KEYS = ["chainkeeper-state-v3", "chainkeeper-state-v2", "chainkeeper-state-v1"];

const BIKE_CONSUMABLES = [
  { key: "wax", label: "Chain wax", defaultInterval: 300, mode: "distance" },
  { key: "chainring", label: "Chainrings", defaultInterval: 12000, mode: "distance" },
  { key: "cassette", label: "Cassette", defaultInterval: 8000, mode: "distance" },
  { key: "frontBrakePads", label: "Front brake pads", defaultInterval: 2500, mode: "distance" },
  { key: "rearBrakePads", label: "Rear brake pads", defaultInterval: 2200, mode: "distance" }
];

const WHEELSET_CONSUMABLES = [
  { key: "frontTyre", label: "Front tyre", defaultInterval: 2500, mode: "distance" },
  { key: "rearTyre", label: "Rear tyre", defaultInterval: 2200, mode: "distance" },
  { key: "frontSealant", label: "Front sealant", defaultInterval: 4, mode: "time" },
  { key: "rearSealant", label: "Rear sealant", defaultInterval: 4, mode: "time" }
];

const WHEELSET_ACTIONS = new Set(WHEELSET_CONSUMABLES.map((item) => item.key));
const IMPORTED_STRAVA_BIKES = [
  { key: "strava-road", name: "Strava Road", category: "Road", distance: 4180 },
  { key: "strava-gravel", name: "Strava Gravel", category: "Gravel", distance: 2310 },
  { key: "strava-mtb", name: "Strava MTB", category: "MTB", distance: 1240 }
];

const demoState = buildDemoState();
const state = loadState();

const elements = {
  onboardingSection: document.querySelector("#onboarding-section"),
  manualSetupPanel: document.querySelector("#manual-setup-panel"),
  bikeForm: document.querySelector("#bike-form"),
  wheelsetForm: document.querySelector("#wheelset-form"),
  serviceForm: document.querySelector("#service-form"),
  bikeList: document.querySelector("#bike-list"),
  statsGrid: document.querySelector("#stats-grid"),
  priorityList: document.querySelector("#priority-list"),
  activeSetups: document.querySelector("#active-setups"),
  activityList: document.querySelector("#activity-list"),
  importedBikeList: document.querySelector("#imported-bike-list"),
  importSelectedBikes: document.querySelector("#import-selected-bikes"),
  editorShell: document.querySelector("#editor-shell"),
  editorBackdrop: document.querySelector("#editor-backdrop"),
  closeEditor: document.querySelector("#close-editor"),
  editorEyebrow: document.querySelector("#editor-eyebrow"),
  editorTitle: document.querySelector("#editor-title"),
  bikeEditForm: document.querySelector("#bike-edit-form"),
  wheelsetEditForm: document.querySelector("#wheelset-edit-form"),
  wheelsetBikeSelect: document.querySelector("#wheelset-bike-select"),
  serviceBikeSelect: document.querySelector("#service-bike-select"),
  serviceTypeSelect: document.querySelector("#service-type-select"),
  serviceWheelsetLabel: document.querySelector("#service-wheelset-label"),
  serviceWheelsetSelect: document.querySelector("#service-wheelset-select"),
  connectStrava: document.querySelector("#connect-strava"),
  showManualSetup: document.querySelector("#show-manual-setup"),
  stravaStatus: document.querySelector("#strava-status"),
  seedDemo: document.querySelector("#seed-demo"),
  exportData: document.querySelector("#export-data"),
  importData: document.querySelector("#import-data")
};

const templates = {
  bikeCard: document.querySelector("#bike-card-template"),
  wheelset: document.querySelector("#wheelset-template"),
  meter: document.querySelector("#meter-template"),
  importedBike: document.querySelector("#imported-bike-template")
};

normalizeState();
bindEvents();
render();

function buildDemoState() {
  const road = createBike({
    name: "Dogma Road",
    category: "Road",
    distance: 1240,
    wheelset: createWheelset({
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
    }),
    waxInterval: 450,
    chainringInterval: 14000,
    cassetteInterval: 9500,
    frontBrakePadsInterval: 2800,
    rearBrakePadsInterval: 2200
  });
  road.wheelsets.push(createWheelset({
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
  }));
  road.maintenance.wax = { distanceAtService: 920, date: "2025-03-22" };
  road.maintenance.chainring = { distanceAtService: 0, date: "2024-11-02" };
  road.maintenance.cassette = { distanceAtService: 140, date: "2024-12-18" };
  road.maintenance.frontBrakePads = { distanceAtService: 180, date: "2025-02-24" };
  road.maintenance.rearBrakePads = { distanceAtService: 620, date: "2025-03-10" };
  road.wheelsets[0].maintenance.frontTyre = { distanceAtService: 0, date: "2025-01-18" };
  road.wheelsets[0].maintenance.rearTyre = { distanceAtService: 220, date: "2025-02-02" };
  road.wheelsets[0].maintenance.frontSealant = { distanceAtService: 350, date: "2025-02-10" };
  road.wheelsets[0].maintenance.rearSealant = { distanceAtService: 350, date: "2025-02-10" };
  road.activeWheelsetId = road.wheelsets[0].id;

  const gravel = createBike({
    name: "MOG Gravel",
    category: "Gravel",
    distance: 860,
    wheelset: createWheelset({
      name: "650b gravel wheels",
      notes: "45 mm tyres, Orange Seal Endurance",
      distance: 860,
      frontTyreName: "WTB Raddler 45 mm",
      rearTyreName: "WTB Raddler 45 mm",
      frontSealantName: "Orange Seal Endurance",
      rearSealantName: "Orange Seal Endurance",
      frontTyreInterval: 2600,
      rearTyreInterval: 2000,
      frontSealantInterval: 3,
      rearSealantInterval: 3
    }),
    waxInterval: 300,
    chainringInterval: 11000,
    cassetteInterval: 7600,
    frontBrakePadsInterval: 2400,
    rearBrakePadsInterval: 2100
  });
  gravel.maintenance.wax = { distanceAtService: 710, date: "2025-03-26" };
  gravel.maintenance.chainring = { distanceAtService: 0, date: "2024-10-12" };
  gravel.maintenance.cassette = { distanceAtService: 80, date: "2024-11-16" };
  gravel.wheelsets[0].maintenance.frontTyre = { distanceAtService: 140, date: "2024-12-03" };
  gravel.wheelsets[0].maintenance.rearTyre = { distanceAtService: 240, date: "2025-01-06" };
  gravel.wheelsets[0].maintenance.frontSealant = { distanceAtService: 0, date: "2025-01-28" };
  gravel.wheelsets[0].maintenance.rearSealant = { distanceAtService: 0, date: "2025-01-28" };

  return {
    units: "km",
    onboarding: { stravaConnected: true, showManualSetup: false, importedKeys: [] },
    bikes: [road, gravel],
    activity: [
      activityRecord(road, road.wheelsets[0], "ride", 72, "Sunday club ride"),
      activityRecord(gravel, gravel.wheelsets[0], "rearSealant", 0, "Rear top-up after a puncture plug"),
      activityRecord(road, null, "rearBrakePads", 0, "Rear pads replaced after wet rides")
    ]
  };
}

function loadState() {
  const current = localStorage.getItem(STORAGE_KEY);
  if (current) return parseState(current);
  for (const key of LEGACY_STORAGE_KEYS) {
    const legacy = localStorage.getItem(key);
    if (legacy) return parseState(legacy);
  }
  return { units: "km", onboarding: defaultOnboarding(), bikes: [], activity: [] };
}

function parseState(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return { units: "km", onboarding: defaultOnboarding(), bikes: [], activity: [] };
  }
}

function defaultOnboarding() {
  return { stravaConnected: false, showManualSetup: false, importedKeys: [] };
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
  elements.editorBackdrop.addEventListener("click", closeEditor);
  elements.closeEditor.addEventListener("click", closeEditor);
  elements.bikeEditForm.addEventListener("submit", onBikeEditSubmit);
  elements.wheelsetEditForm.addEventListener("submit", onWheelsetEditSubmit);
  elements.connectStrava.addEventListener("click", onConnectStrava);
  elements.importSelectedBikes.addEventListener("click", importSelectedStravaBikes);
  elements.showManualSetup.addEventListener("click", () => {
    state.onboarding.showManualSetup = true;
    persist();
    render();
  });
  elements.seedDemo.addEventListener("click", seedDemoData);
  elements.exportData.addEventListener("click", exportState);
  elements.importData.addEventListener("change", importState);

  document.querySelectorAll("[data-units]").forEach((button) => {
    button.addEventListener("click", () => {
      state.units = button.dataset.units;
      persist();
      render();
    });
  });
}

function onConnectStrava() {
  state.onboarding.stravaConnected = true;
  persist();
  render();
}

function onBikeSubmit(event) {
  event.preventDefault();
  const bike = createBikeFromForm(new FormData(event.currentTarget));
  state.bikes.unshift(bike);
  state.onboarding.showManualSetup = true;
  state.activity.unshift(activityRecord(bike, bike.wheelsets[0], "setup", bike.distance, `${bike.category} bike created`));
  event.currentTarget.reset();
  persist();
  render();
}

function onWheelsetSubmit(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const bike = getBike(form.get("bikeId").toString());
  if (!bike) return;
  const wheelset = createWheelsetFromForm(form);
  bike.wheelsets.unshift(wheelset);
  if (!bike.activeWheelsetId) bike.activeWheelsetId = wheelset.id;
  state.activity.unshift(activityRecord(bike, wheelset, "wheelset", wheelset.distance, wheelset.notes || "Wheelset added"));
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
  const wheelset = getServiceWheelset(bike, form);

  if ((type === "ride" || WHEELSET_ACTIONS.has(type)) && !wheelset) {
    alert("Select a wheelset for rides, tyre changes, and sealant refreshes.");
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

  state.activity.unshift(activityRecord(bike, wheelset, type, distance, notes));
  event.currentTarget.reset();
  persist();
  render();
}

function render() {
  renderUnits();
  renderOnboarding();
  renderStats();
  renderPriority();
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

function renderOnboarding() {
  const hasBikes = state.bikes.length > 0;
  elements.onboardingSection.classList.toggle("hidden", hasBikes && !state.onboarding.stravaConnected);
  elements.manualSetupPanel.classList.toggle("hidden", !state.onboarding.showManualSetup && !hasBikes);
  elements.stravaStatus.textContent = state.onboarding.stravaConnected ? "Strava connected (stub)" : "Strava not connected";
  elements.importSelectedBikes.disabled = !state.onboarding.stravaConnected;

  elements.importedBikeList.innerHTML = "";
  if (!state.onboarding.stravaConnected) {
    elements.importedBikeList.innerHTML = `<div class="empty-state">Connect Strava to preview imported bikes.</div>`;
    return;
  }

  IMPORTED_STRAVA_BIKES.forEach((item) => {
    const fragment = templates.importedBike.content.cloneNode(true);
    const checkbox = fragment.querySelector(".imported-bike-checkbox");
    checkbox.value = item.key;
    checkbox.checked = state.onboarding.importedKeys.includes(item.key);
    checkbox.addEventListener("change", () => {
      state.onboarding.importedKeys = toggleValue(state.onboarding.importedKeys, item.key, checkbox.checked);
      persist();
    });
    fragment.querySelector(".imported-bike-name").textContent = item.name;
    fragment.querySelector(".imported-bike-meta").textContent = `${item.category} • ${formatDistance(item.distance)} from Strava`;
    elements.importedBikeList.appendChild(fragment);
  });
}

function renderStats() {
  const stats = [
    { value: state.bikes.length, caption: "Bikes tracked" },
    { value: wheelsetCount(), caption: "Wheelsets tracked" },
    { value: formatDistance(totalDistance()), caption: "Bike distance" },
    { value: allDueItems().filter((item) => item.status !== "In range").length, caption: "Items due soon" }
  ];
  elements.statsGrid.innerHTML = "";
  stats.forEach((stat) => {
    const article = document.createElement("article");
    article.className = "stat-card";
    article.innerHTML = `<strong>${stat.value}</strong><p class="stat-caption">${stat.caption}</p>`;
    elements.statsGrid.appendChild(article);
  });
}

function renderPriority() {
  const dueItems = allDueItems().filter((item) => item.status !== "In range");
  elements.priorityList.innerHTML = dueItems.length
    ? ""
    : `<div class="empty-state">Nothing urgent. The tracker is clear.</div>`;

  dueItems.slice(0, 6).forEach((item) => {
    const article = document.createElement("article");
    article.className = "priority-item";
    article.innerHTML = `
      <p class="priority-title">${item.title}</p>
      <p class="priority-copy">${item.context}</p>
      <p class="priority-copy">${item.detail}</p>
    `;
    elements.priorityList.appendChild(article);
  });

  elements.activeSetups.innerHTML = state.bikes.length
    ? ""
    : `<div class="empty-state">Import or add a bike to start.</div>`;

  state.bikes.forEach((bike) => {
    const wheelset = bike.wheelsets.find((entry) => entry.id === bike.activeWheelsetId) || bike.wheelsets[0];
    const article = document.createElement("article");
    article.className = "priority-item";
    article.innerHTML = `
      <p class="priority-title">${bike.name}</p>
      <p class="priority-copy">${wheelset ? wheelset.name : "No wheelset selected"}</p>
      <p class="priority-copy">${wheelset ? `${wheelset.components.frontTyre || "No front tyre"} / ${wheelset.components.rearTyre || "No rear tyre"}` : ""}</p>
    `;
    elements.activeSetups.appendChild(article);
  });
}

function renderBikes() {
  elements.bikeList.innerHTML = "";
  if (!state.bikes.length) {
    elements.bikeList.innerHTML = `<div class="empty-state">No bikes yet. Import bikes from Strava or add one manually.</div>`;
    return;
  }

  state.bikes.forEach((bike) => {
    const fragment = templates.bikeCard.content.cloneNode(true);
    fragment.querySelector(".bike-name").textContent = bike.name;
    fragment.querySelector(".bike-meta").textContent = `${bike.category} • ${formatDistance(bike.distance)} total • ${bike.wheelsets.length} wheelset${bike.wheelsets.length === 1 ? "" : "s"}`;
    fragment.querySelector(".delete-bike").addEventListener("click", () => deleteBike(bike.id));
    fragment.querySelector(".edit-bike").addEventListener("click", () => editBike(bike.id));

    const bikeStack = fragment.querySelector(".bike-meter-stack");
    BIKE_CONSUMABLES.forEach((item) => {
      bikeStack.appendChild(createMeter(item, bike.distance, bike.maintenance[item.key], bike.thresholds[item.key]));
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

      wheelsetFragment.querySelector(".edit-wheelset").addEventListener("click", () => editWheelset(bike.id, wheelset.id));
      wheelsetFragment.querySelector(".delete-wheelset").addEventListener("click", () => deleteWheelset(bike.id, wheelset.id));

      const meterStack = wheelsetFragment.querySelector(".wheelset-meter-stack");
      WHEELSET_CONSUMABLES.forEach((item) => {
        meterStack.appendChild(createMeter(item, wheelset.distance, wheelset.maintenance[item.key], wheelset.thresholds[item.key]));
      });

      wheelsetList.appendChild(wheelsetFragment);
    });

    elements.bikeList.appendChild(fragment);
  });
}

function renderActivity() {
  elements.activityList.innerHTML = "";
  if (!state.activity.length) {
    elements.activityList.innerHTML = `<div class="empty-state">No service events yet.</div>`;
    return;
  }

  state.activity.slice(0, 12).forEach((item) => {
    const article = document.createElement("article");
    article.className = "activity-item";
    const wheelsetCopy = item.wheelsetName ? ` • ${item.wheelsetName}` : "";
    article.innerHTML = `
      <div class="bike-card-top">
        <div>
          <p class="activity-title">${activityLabel(item.type)} · ${item.bikeName}${wheelsetCopy}</p>
          <p class="activity-meta">${item.date}${item.distance ? ` • ${formatDistance(item.distance)}` : ""}</p>
        </div>
        <button class="danger-link delete-activity" type="button">Delete</button>
      </div>
      <p>${item.notes || "No notes recorded."}</p>
    `;
    article.querySelector(".delete-activity").addEventListener("click", () => deleteActivity(item.id));
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
    elements.serviceWheelsetSelect.innerHTML = `<option value="">No wheelsets</option>`;
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
  elements.serviceWheelsetLabel.classList.toggle("hidden", !visible);
  elements.serviceWheelsetSelect.required = visible;
}

function importSelectedStravaBikes() {
  if (!state.onboarding.importedKeys.length) {
    alert("Pick at least one imported bike first.");
    return;
  }

  const imported = IMPORTED_STRAVA_BIKES
    .filter((item) => state.onboarding.importedKeys.includes(item.key))
    .filter((item) => !state.bikes.some((bike) => bike.name === item.name));

  if (!imported.length) {
    alert("Those bikes are already in the tracker.");
    return;
  }

  imported.forEach((item) => {
    const bike = createBike({
      name: item.name,
      category: item.category,
      distance: item.distance,
      wheelset: createWheelset({
        name: "Primary wheelset",
        notes: "Imported from Strava, complete wheel details next",
        distance: item.distance,
        frontTyreName: "",
        rearTyreName: "",
        frontSealantName: "",
        rearSealantName: "",
        frontTyreInterval: 2500,
        rearTyreInterval: 2200,
        frontSealantInterval: 4,
        rearSealantInterval: 4
      }),
      waxInterval: 300,
      chainringInterval: 12000,
      cassetteInterval: 8000,
      frontBrakePadsInterval: 2500,
      rearBrakePadsInterval: 2200
    });
    state.bikes.unshift(bike);
    state.activity.unshift(activityRecord(bike, bike.wheelsets[0], "setup", bike.distance, "Imported from Strava stub"));
  });

  state.onboarding.showManualSetup = true;
  persist();
  render();
}

function editBike(bikeId) {
  const bike = getBike(bikeId);
  if (!bike) return;
  openBikeEditor(bike);
}

function editWheelset(bikeId, wheelsetId) {
  const bike = getBike(bikeId);
  const wheelset = bike && getWheelset(bike, wheelsetId);
  if (!wheelset) return;
  openWheelsetEditor(bike, wheelset);
}

function deleteBike(bikeId) {
  if (!confirm("Delete this bike and all of its wheelsets and service history?")) return;
  state.bikes = state.bikes.filter((bike) => bike.id !== bikeId);
  state.activity = state.activity.filter((item) => item.bikeId !== bikeId);
  persist();
  render();
}

function deleteWheelset(bikeId, wheelsetId) {
  const bike = getBike(bikeId);
  if (!bike || bike.wheelsets.length === 1) {
    alert("A bike needs at least one wheelset.");
    return;
  }
  if (!confirm("Delete this wheelset?")) return;
  bike.wheelsets = bike.wheelsets.filter((wheelset) => wheelset.id !== wheelsetId);
  if (bike.activeWheelsetId === wheelsetId) bike.activeWheelsetId = bike.wheelsets[0].id;
  state.activity = state.activity.filter((item) => item.wheelsetId !== wheelsetId);
  persist();
  render();
}

function deleteActivity(activityId) {
  if (!confirm("Delete this service event?")) return;
  state.activity = state.activity.filter((item) => item.id !== activityId);
  persist();
  render();
}

function createMeter(item, currentDistance, maintenance, interval) {
  const fragment = templates.meter.content.cloneNode(true);
  const progress = currentProgress(item, currentDistance, maintenance, interval);
  const status = progressStatus(progress.ratio);
  fragment.querySelector(".meter-label").textContent = item.label;
  fragment.querySelector(".meter-detail").textContent = progress.detail;
  const stateEl = fragment.querySelector(".meter-state");
  stateEl.textContent = status.label;
  stateEl.style.color = status.color;
  const fill = fragment.querySelector(".meter-fill");
  fill.style.width = `${Math.max(0, Math.min(100, progress.ratio * 100))}%`;
  fill.style.background = status.fill;
  return fragment;
}

function currentProgress(item, currentDistance, maintenance, interval) {
  if (item.mode === "time") {
    const months = monthsSince(maintenance.date);
    return {
      ratio: months / interval,
      detail: `${formatMonths(months)} since refresh • target ${formatMonths(interval)} • date ${maintenance.date}`
    };
  }
  const distance = Math.max(0, currentDistance - maintenance.distanceAtService);
  return {
    ratio: distance / interval,
    detail: `${formatDistance(distance)} since service • target ${formatDistance(interval)} • installed ${maintenance.date} @ ${formatDistance(maintenance.distanceAtService)}`
  };
}

function progressStatus(ratio) {
  if (ratio >= 1) {
    return { label: "Due now", color: "var(--bad)", fill: "linear-gradient(90deg, #d6336c, #ff87b2)" };
  }
  if (ratio >= 0.8) {
    return { label: "Due soon", color: "var(--warn)", fill: "linear-gradient(90deg, #f08c00, #ffd43b)" };
  }
  return { label: "In range", color: "var(--ok)", fill: "linear-gradient(90deg, #1f6f78, #63c4bc)" };
}

function allDueItems() {
  const items = [];
  state.bikes.forEach((bike) => {
    BIKE_CONSUMABLES.forEach((item) => {
      const progress = currentProgress(item, bike.distance, bike.maintenance[item.key], bike.thresholds[item.key]);
      items.push({
        status: progressStatus(progress.ratio).label,
        title: item.label,
        context: bike.name,
        detail: progress.detail,
        ratio: progress.ratio
      });
    });
    bike.wheelsets.forEach((wheelset) => {
      WHEELSET_CONSUMABLES.forEach((item) => {
        const progress = currentProgress(item, wheelset.distance, wheelset.maintenance[item.key], wheelset.thresholds[item.key]);
        items.push({
          status: progressStatus(progress.ratio).label,
          title: item.label,
          context: `${bike.name} • ${wheelset.name}`,
          detail: progress.detail,
          ratio: progress.ratio
        });
      });
    });
  });
  return items.sort((a, b) => b.ratio - a.ratio);
}

function wheelsetCount() {
  return state.bikes.reduce((sum, bike) => sum + bike.wheelsets.length, 0);
}

function totalDistance() {
  return state.bikes.reduce((sum, bike) => sum + bike.distance, 0);
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
      state.units = imported.units;
      state.onboarding = imported.onboarding || defaultOnboarding();
      state.bikes = imported.bikes || [];
      state.activity = imported.activity || [];
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
  state.onboarding = structuredClone(demoState.onboarding);
  state.bikes = structuredClone(demoState.bikes);
  state.activity = structuredClone(demoState.activity);
  persist();
  render();
}

function normalizeState() {
  state.units = state.units === "mi" ? "mi" : "km";
  state.onboarding = { ...defaultOnboarding(), ...(state.onboarding || {}) };
  state.bikes = (state.bikes || []).map((bike) => normalizeBike(bike));
  state.activity = (state.activity || []).map((item) => ({
    id: item.id || crypto.randomUUID(),
    wheelsetId: "",
    wheelsetName: "",
    ...item
  }));
}

function normalizeBike(bike) {
  const normalized = {
    ...bike,
    id: bike.id || crypto.randomUUID(),
    distance: Number(bike.distance || 0),
    thresholds: { ...(bike.thresholds || {}) },
    maintenance: { ...(bike.maintenance || {}) }
  };

  migrateBikeThresholds(normalized);

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

  reconcileBikeMaintenance(normalized);

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

  migrateWheelsetFields(normalized, fallbackDistance);

  WHEELSET_CONSUMABLES.forEach((item) => {
    normalized.thresholds[item.key] = Number(normalized.thresholds[item.key] || item.defaultInterval);
    normalized.maintenance[item.key] = normalizeMaintenance(normalized.maintenance[item.key], normalized.distance);
  });

  reconcileWheelsetMaintenance(normalized);

  return normalized;
}

function migrateBikeThresholds(bike) {
  if (!bike.thresholds.frontBrakePads && bike.thresholds.brakePads) bike.thresholds.frontBrakePads = bike.thresholds.brakePads;
  if (!bike.thresholds.rearBrakePads && bike.thresholds.brakePads) bike.thresholds.rearBrakePads = bike.thresholds.brakePads;
  if (!bike.maintenance.frontBrakePads && bike.maintenance.brakePads) bike.maintenance.frontBrakePads = bike.maintenance.brakePads;
  if (!bike.maintenance.rearBrakePads && bike.maintenance.brakePads) bike.maintenance.rearBrakePads = bike.maintenance.brakePads;
}

function migrateWheelsetFields(wheelset, fallbackDistance) {
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

function createBikeFromForm(form) {
  return createBike({
    name: form.get("name").toString().trim(),
    category: form.get("category").toString(),
    distance: Number(form.get("distance")),
    wheelset: createWheelsetFromForm(form, true),
    waxInterval: Number(form.get("waxInterval")),
    chainringInterval: Number(form.get("chainringInterval")),
    cassetteInterval: Number(form.get("cassetteInterval")),
    frontBrakePadsInterval: Number(form.get("frontBrakePadsInterval")),
    rearBrakePadsInterval: Number(form.get("rearBrakePadsInterval"))
  });
}

function createWheelsetFromForm(form, bikeForm = false) {
  return createWheelset({
    name: form.get(bikeForm ? "wheelsetName" : "name").toString().trim(),
    notes: form.get(bikeForm ? "wheelsetNotes" : "notes").toString().trim(),
    distance: Number(form.get(bikeForm ? "wheelsetDistance" : "distance")),
    frontTyreName: form.get("frontTyreName").toString().trim(),
    rearTyreName: form.get("rearTyreName").toString().trim(),
    frontSealantName: form.get("frontSealantName").toString().trim(),
    rearSealantName: form.get("rearSealantName").toString().trim(),
    frontTyreInterval: Number(form.get("frontTyreInterval")),
    rearTyreInterval: Number(form.get("rearTyreInterval")),
    frontSealantInterval: Number(form.get("frontSealantInterval")),
    rearSealantInterval: Number(form.get("rearSealantInterval"))
  });
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
    thresholds: { tyre: bike.thresholds.tyre, sealant: bike.thresholds.sealant },
    maintenance: { tyre: bike.maintenance.tyre, sealant: bike.maintenance.sealant },
    components: {}
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

function openBikeEditor(bike) {
  elements.editorEyebrow.textContent = "Edit bike";
  elements.editorTitle.textContent = bike.name;
  elements.bikeEditForm.classList.remove("hidden");
  elements.wheelsetEditForm.classList.add("hidden");
  const form = elements.bikeEditForm;
  form.elements.bikeId.value = bike.id;
  form.elements.name.value = bike.name;
  form.elements.category.value = bike.category;
  form.elements.distance.value = bike.distance;
  BIKE_CONSUMABLES.forEach((item) => {
    form.elements[`${item.key}Interval`].value = bike.thresholds[item.key];
    form.elements[`${item.key}Date`].value = bike.maintenance[item.key].date;
    form.elements[`${item.key}Mileage`].value = bike.maintenance[item.key].distanceAtService;
  });
  elements.editorShell.classList.remove("hidden");
}

function openWheelsetEditor(bike, wheelset) {
  elements.editorEyebrow.textContent = "Edit wheelset";
  elements.editorTitle.textContent = `${bike.name} • ${wheelset.name}`;
  elements.wheelsetEditForm.classList.remove("hidden");
  elements.bikeEditForm.classList.add("hidden");
  const form = elements.wheelsetEditForm;
  form.elements.bikeId.value = bike.id;
  form.elements.wheelsetId.value = wheelset.id;
  form.elements.name.value = wheelset.name;
  form.elements.notes.value = wheelset.notes;
  form.elements.distance.value = wheelset.distance;
  form.elements.frontTyreName.value = wheelset.components.frontTyre;
  form.elements.rearTyreName.value = wheelset.components.rearTyre;
  form.elements.frontSealantName.value = wheelset.components.frontSealant;
  form.elements.rearSealantName.value = wheelset.components.rearSealant;
  WHEELSET_CONSUMABLES.forEach((item) => {
    form.elements[`${item.key}Interval`].value = wheelset.thresholds[item.key];
    form.elements[`${item.key}Date`].value = wheelset.maintenance[item.key].date;
    if (item.mode === "distance") {
      form.elements[`${item.key}Mileage`].value = wheelset.maintenance[item.key].distanceAtService;
    }
  });
  elements.editorShell.classList.remove("hidden");
}

function closeEditor() {
  elements.editorShell.classList.add("hidden");
}

function onBikeEditSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const bike = getBike(form.elements.bikeId.value);
  if (!bike) return;
  bike.name = form.elements.name.value.trim();
  bike.category = form.elements.category.value;
  bike.distance = Number(form.elements.distance.value) || bike.distance;
  BIKE_CONSUMABLES.forEach((item) => {
    bike.thresholds[item.key] = Number(form.elements[`${item.key}Interval`].value) || bike.thresholds[item.key];
    bike.maintenance[item.key].date = form.elements[`${item.key}Date`].value || bike.maintenance[item.key].date;
    bike.maintenance[item.key].distanceAtService = Number(form.elements[`${item.key}Mileage`].value);
  });
  reconcileBikeMaintenance(bike);
  persist();
  closeEditor();
  render();
}

function onWheelsetEditSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const bike = getBike(form.elements.bikeId.value);
  const wheelset = bike && getWheelset(bike, form.elements.wheelsetId.value);
  if (!wheelset) return;
  wheelset.name = form.elements.name.value.trim();
  wheelset.notes = form.elements.notes.value.trim();
  wheelset.distance = Number(form.elements.distance.value) || wheelset.distance;
  wheelset.components.frontTyre = form.elements.frontTyreName.value.trim();
  wheelset.components.rearTyre = form.elements.rearTyreName.value.trim();
  wheelset.components.frontSealant = form.elements.frontSealantName.value.trim();
  wheelset.components.rearSealant = form.elements.rearSealantName.value.trim();
  WHEELSET_CONSUMABLES.forEach((item) => {
    wheelset.thresholds[item.key] = Number(form.elements[`${item.key}Interval`].value) || wheelset.thresholds[item.key];
    wheelset.maintenance[item.key].date = form.elements[`${item.key}Date`].value || wheelset.maintenance[item.key].date;
    if (item.mode === "distance") {
      wheelset.maintenance[item.key].distanceAtService = Number(form.elements[`${item.key}Mileage`].value);
    }
  });
  reconcileWheelsetMaintenance(wheelset);
  persist();
  closeEditor();
  render();
}

function reconcileBikeMaintenance(bike) {
  BIKE_CONSUMABLES.forEach((item) => {
    if (bike.maintenance[item.key].distanceAtService > bike.distance) {
      bike.maintenance[item.key].distanceAtService = bike.distance;
    }
  });

  bike.wheelsets.forEach((wheelset) => {
    if (wheelset.distance > bike.distance) {
      wheelset.distance = bike.distance;
    }
    reconcileWheelsetMaintenance(wheelset);
  });
}

function reconcileWheelsetMaintenance(wheelset) {
  WHEELSET_CONSUMABLES.forEach((item) => {
    if (item.mode === "distance" && wheelset.maintenance[item.key].distanceAtService > wheelset.distance) {
      wheelset.maintenance[item.key].distanceAtService = wheelset.distance;
    }
  });
}

function getServiceWheelset(bike, form) {
  const wheelsetId = form.get("wheelsetId")?.toString() || "";
  return wheelsetId ? getWheelset(bike, wheelsetId) : null;
}

function activityRecord(bike, wheelset, type, distance, notes) {
  return {
    id: crypto.randomUUID(),
    bikeId: bike.id,
    bikeName: bike.name,
    wheelsetId: wheelset?.id || "",
    wheelsetName: wheelset?.name || "",
    type,
    distance,
    notes,
    date: today()
  };
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

function toggleValue(list, value, enabled) {
  const next = new Set(list);
  if (enabled) next.add(value);
  else next.delete(value);
  return [...next];
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
