const BASE_URL = "https://www.swapi.tech/api";

let currentSection = "films";
let allData = [];
let displayData = [];
const sectionCache = {};
const resourceCache = new Map();

const cardsGrid = document.getElementById("cardsGrid");
const loadingSpinner = document.getElementById("loadingSpinner");
const errorMessage = document.getElementById("errorMessage");
const sectionTitle = document.getElementById("sectionTitle");
const sectionSub = document.getElementById("sectionSubtitle");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const clearBtn = document.getElementById("clearBtn");
const searchError = document.getElementById("searchError");
const detailOverlay = document.getElementById("detailOverlay");
const detailContent = document.getElementById("detailContent");
const detailClose = document.getElementById("detailClose");
const retryBtn = document.getElementById("retryBtn");
const navBtns = document.querySelectorAll(".nav-btn");

const sectionConfig = {
  films: {
    title: "Films",
    subtitle: "Every Star Wars saga film",
    endpoint: "/films",
  },
  characters: {
    title: "Characters",
    subtitle: "Heroes, villains & everyone between",
    endpoint: "/people",
  },
  planets: {
    title: "Planets",
    subtitle: "Worlds across the galaxy",
    endpoint: "/planets",
  },
  starships: {
    title: "Starships",
    subtitle: "Legendary ships from across the galaxy",
    endpoint: "/starships",
  },
};

function buildStarField() {
  const container = document.getElementById("stars");
  if (!container) return;

  container.innerHTML = "";

  for (let i = 0; i < 120; i++) {
    const star = document.createElement("div");
    star.classList.add("star");
    const size = Math.random() * 2.5 + 0.5;

    star.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      top: ${Math.random() * 100}%;
      left: ${Math.random() * 100}%;
      --dur: ${(Math.random() * 4 + 2).toFixed(1)}s;
      --delay: ${(Math.random() * 4).toFixed(1)}s;
    `;

    container.appendChild(star);
  }
}

function showLoading() {
  loadingSpinner.style.display = "flex";
  cardsGrid.style.display = "none";
  errorMessage.style.display = "none";
}

function showCards() {
  loadingSpinner.style.display = "none";
  cardsGrid.style.display = "grid";
  errorMessage.style.display = "none";
}

function showError() {
  loadingSpinner.style.display = "none";
  cardsGrid.style.display = "none";
  errorMessage.style.display = "block";
}

function capitalize(str) {
  if (!str || str === "unknown" || str === "n/a") return str || "N/A";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatNumber(num) {
  if (!num || num === "unknown" || num === "n/a") return num || "N/A";
  const parsed = Number(String(num).replace(/,/g, ""));
  return Number.isNaN(parsed) ? num : parsed.toLocaleString();
}

function detailItem(label, value) {
  const display = value === undefined || value === null || value === "" ? "N/A" : value;
  return `
    <div class="detail-item">
      <div class="detail-item-label">${label}</div>
      <div class="detail-item-value">${display}</div>
    </div>
  `;
}

async function fetchJSON(url) {
  const fullUrl = url.startsWith("http") ? url : `${BASE_URL}${url}`;

  if (resourceCache.has(fullUrl)) {
    return resourceCache.get(fullUrl);
  }

  const response = await fetch(fullUrl);
  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  resourceCache.set(fullUrl, data);
  return data;
}

async function fetchAllPages(endpoint) {
  let results = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const data = await fetchJSON(`${endpoint}?page=${page}&limit=100`);
    const items = data.results || [];

    if (!items.length) {
      hasMore = false;
    } else {
      results = results.concat(items);
      page += 1;

      if (items.length < 100) {
        hasMore = false;
      }
    }
  }

  return results;
}

async function fetchDetailsForItems(items) {
  const detailed = await Promise.all(
    items.map(async (item) => {
      try {
        const detailUrl = item.url || item.uid && `${BASE_URL}/${item.uid}`;
        const data = await fetchJSON(item.url);
        return data.result || item;
      } catch (error) {
        console.warn("Failed to fetch item details:", item, error);
        return item;
      }
    })
  );

  return detailed;
}

async function getSectionData(section) {
  const config = sectionConfig[section];

  if (section === "films") {
    const filmData = await fetchJSON(config.endpoint);
    return (filmData.result || []).map((film) => film);
  }

  const listItems = await fetchAllPages(config.endpoint);
  return await fetchDetailsForItems(listItems);
}

async function fetchRelatedNames(urls, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  try {
    const names = await Promise.all(
      urls.map(async (url) => {
        try {
          const data = await fetchJSON(url);
          const result = data.result || data;
          const props = result.properties || {};
          return props.name || props.title || "Unknown";
        } catch {
          return "Unknown";
        }
      })
    );

    container.innerHTML = names
      .map((name) => `<span class="related-tag">${name}</span>`)
      .join("");
  } catch {
    container.textContent = "Could not load related data.";
  }
}

function renderFilms(films) {
  cardsGrid.innerHTML = "";

  if (!films.length) {
    cardsGrid.innerHTML = `<p style="color:var(--text-muted);grid-column:1/-1;text-align:center;padding:3rem 0;">No films found.</p>`;
    return;
  }

  films.forEach((film, i) => {
    const props = film.properties || {};
    const card = document.createElement("div");
    card.className = "card";
    card.style.animationDelay = `${i * 40}ms`;

    card.innerHTML = `
      <div class="card-label">Episode ${props.episode_id ?? "?"}</div>
      <div class="card-title">${props.title ?? "Unknown Title"}</div>
      <div class="card-body">
        <p><strong>Director:</strong> ${props.director ?? "N/A"}</p>
        <p><strong>Producer:</strong> ${props.producer ?? "N/A"}</p>
        <p><strong>Released:</strong> ${props.release_date ?? "N/A"}</p>
      </div>
      <div class="card-footer">Click to explore →</div>
    `;

    card.addEventListener("click", () => openFilmDetail(film));
    cardsGrid.appendChild(card);
  });
}

function renderCharacters(characters) {
  cardsGrid.innerHTML = "";

  if (!characters.length) {
    cardsGrid.innerHTML = `<p style="color:var(--text-muted);grid-column:1/-1;text-align:center;padding:3rem 0;">No characters found.</p>`;
    return;
  }

  characters.forEach((char, i) => {
    const props = char.properties || {};
    const card = document.createElement("div");
    card.className = "card";
    card.style.animationDelay = `${i * 20}ms`;

    card.innerHTML = `
      <div class="card-label">Character</div>
      <div class="card-title">${props.name ?? "Unknown"}</div>
      <div class="card-body">
        <p><strong>Gender:</strong> ${capitalize(props.gender)}</p>
        <p><strong>Birth Year:</strong> ${props.birth_year ?? "N/A"}</p>
        <p><strong>Height:</strong> ${props.height ? `${props.height} cm` : "N/A"}</p>
      </div>
      <div class="card-footer">Click to explore →</div>
    `;

    card.addEventListener("click", () => openCharacterDetail(char));
    cardsGrid.appendChild(card);
  });
}

function renderPlanets(planets) {
  cardsGrid.innerHTML = "";

  if (!planets.length) {
    cardsGrid.innerHTML = `<p style="color:var(--text-muted);grid-column:1/-1;text-align:center;padding:3rem 0;">No planets found.</p>`;
    return;
  }

  planets.forEach((planet, i) => {
    const props = planet.properties || {};
    const card = document.createElement("div");
    card.className = "card";
    card.style.animationDelay = `${i * 20}ms`;

    card.innerHTML = `
      <div class="card-label">Planet</div>
      <div class="card-title">${props.name ?? "Unknown"}</div>
      <div class="card-body">
        <p><strong>Climate:</strong> ${capitalize(props.climate)}</p>
        <p><strong>Terrain:</strong> ${capitalize(props.terrain)}</p>
        <p><strong>Population:</strong> ${formatNumber(props.population)}</p>
      </div>
      <div class="card-footer">Click to explore →</div>
    `;

    card.addEventListener("click", () => openPlanetDetail(planet));
    cardsGrid.appendChild(card);
  });
}

function renderStarships(starships) {
  cardsGrid.innerHTML = "";

  if (!starships.length) {
    cardsGrid.innerHTML = `<p style="color:var(--text-muted);grid-column:1/-1;text-align:center;padding:3rem 0;">No starships found.</p>`;
    return;
  }

  starships.forEach((ship, i) => {
    const props = ship.properties || {};
    const card = document.createElement("div");
    card.className = "card";
    card.style.animationDelay = `${i * 20}ms`;

    card.innerHTML = `
      <div class="card-label">Starship</div>
      <div class="card-title">${props.name ?? "Unknown"}</div>
      <div class="card-body">
        <p><strong>Model:</strong> ${props.model ?? "N/A"}</p>
        <p><strong>Class:</strong> ${props.starship_class ?? "N/A"}</p>
        <p><strong>Manufacturer:</strong> ${props.manufacturer ?? "N/A"}</p>
      </div>
      <div class="card-footer">Click to explore →</div>
    `;

    card.addEventListener("click", () => openStarshipDetail(ship));
    cardsGrid.appendChild(card);
  });
}

async function openFilmDetail(film) {
  const props = film.properties || {};

  detailContent.innerHTML = `
    <div class="detail-label">Star Wars Film</div>
    <div class="detail-title">${props.title ?? "Unknown"}</div>
    <div class="detail-grid">
      ${detailItem("Episode", props.episode_id)}
      ${detailItem("Director", props.director)}
      ${detailItem("Producer", props.producer)}
      ${detailItem("Released", props.release_date)}
    </div>
    ${
      props.opening_crawl
        ? `
      <div class="detail-section-title">Opening Crawl</div>
      <p class="detail-crawl">${props.opening_crawl.replace(/\r\n/g, " ").trim()}</p>
    `
        : ""
    }
    <div class="detail-section-title">Characters</div>
    <div class="related-list" id="relatedChars"><span style="color:var(--text-dim);font-size:0.85rem;">Loading...</span></div>
    <div class="detail-section-title">Planets</div>
    <div class="related-list" id="relatedPlanets"><span style="color:var(--text-dim);font-size:0.85rem;">Loading...</span></div>
  `;

  detailOverlay.style.display = "flex";

  if (Array.isArray(props.characters) && props.characters.length) {
    fetchRelatedNames(props.characters.slice(0, 6), "relatedChars");
  } else {
    document.getElementById("relatedChars").textContent = "None listed.";
  }

  if (Array.isArray(props.planets) && props.planets.length) {
    fetchRelatedNames(props.planets.slice(0, 6), "relatedPlanets");
  } else {
    document.getElementById("relatedPlanets").textContent = "None listed.";
  }
}

async function openCharacterDetail(char) {
  const props = char.properties || {};

  detailContent.innerHTML = `
    <div class="detail-label">Character</div>
    <div class="detail-title">${props.name ?? "Unknown"}</div>
    <div class="detail-grid">
      ${detailItem("Gender", capitalize(props.gender))}
      ${detailItem("Birth Year", props.birth_year)}
      ${detailItem("Height", props.height ? `${props.height} cm` : "N/A")}
      ${detailItem("Mass", props.mass ? `${props.mass} kg` : "N/A")}
      ${detailItem("Hair Color", capitalize(props.hair_color))}
      ${detailItem("Eye Color", capitalize(props.eye_color))}
      ${detailItem("Skin Color", capitalize(props.skin_color))}
    </div>
    <div class="detail-section-title">Homeworld</div>
    <div class="related-list" id="relatedHomeworld"><span style="color:var(--text-dim);font-size:0.85rem;">Loading...</span></div>
    <div class="detail-section-title">Films Appeared In</div>
    <div class="related-list" id="relatedFilms"><span style="color:var(--text-dim);font-size:0.85rem;">Loading...</span></div>
  `;

  detailOverlay.style.display = "flex";

  if (props.homeworld) {
    try {
      const data = await fetchJSON(props.homeworld);
      const worldProps = (data.result || data).properties || {};
      document.getElementById("relatedHomeworld").innerHTML =
        `<span class="related-tag">${worldProps.name ?? "Unknown"}</span>`;
    } catch {
      document.getElementById("relatedHomeworld").textContent = "Could not load homeworld.";
    }
  } else {
    document.getElementById("relatedHomeworld").textContent = "Unknown";
  }

  if (Array.isArray(props.films) && props.films.length) {
    fetchRelatedNames(props.films.slice(0, 6), "relatedFilms");
  } else {
    document.getElementById("relatedFilms").textContent = "None listed.";
  }
}

async function openPlanetDetail(planet) {
  const props = planet.properties || {};

  detailContent.innerHTML = `
    <div class="detail-label">Planet</div>
    <div class="detail-title">${props.name ?? "Unknown"}</div>
    <div class="detail-grid">
      ${detailItem("Climate", capitalize(props.climate))}
      ${detailItem("Terrain", capitalize(props.terrain))}
      ${detailItem("Population", formatNumber(props.population))}
      ${detailItem("Diameter", props.diameter ? `${formatNumber(props.diameter)} km` : "N/A")}
      ${detailItem("Gravity", props.gravity)}
      ${detailItem("Orbital Period", props.orbital_period ? `${props.orbital_period} days` : "N/A")}
      ${detailItem("Rotation Period", props.rotation_period ? `${props.rotation_period} hrs` : "N/A")}
      ${detailItem("Surface Water", props.surface_water ? `${props.surface_water}%` : "N/A")}
    </div>
    <div class="detail-section-title">Residents</div>
    <div class="related-list" id="relatedResidents"><span style="color:var(--text-dim);font-size:0.85rem;">Loading...</span></div>
    <div class="detail-section-title">Films Featured In</div>
    <div class="related-list" id="relatedPlanetFilms"><span style="color:var(--text-dim);font-size:0.85rem;">Loading...</span></div>
  `;

  detailOverlay.style.display = "flex";

  if (Array.isArray(props.residents) && props.residents.length) {
    fetchRelatedNames(props.residents.slice(0, 6), "relatedResidents");
  } else {
    document.getElementById("relatedResidents").textContent = "No residents listed.";
  }

  if (Array.isArray(props.films) && props.films.length) {
    fetchRelatedNames(props.films.slice(0, 6), "relatedPlanetFilms");
  } else {
    document.getElementById("relatedPlanetFilms").textContent = "None listed.";
  }
}

async function openStarshipDetail(ship) {
  const props = ship.properties || {};

  detailContent.innerHTML = `
    <div class="detail-label">Starship</div>
    <div class="detail-title">${props.name ?? "Unknown"}</div>
    <div class="detail-grid">
      ${detailItem("Model", props.model)}
      ${detailItem("Class", props.starship_class)}
      ${detailItem("Manufacturer", props.manufacturer)}
      ${detailItem("Cost", props.cost_in_credits ? `${formatNumber(props.cost_in_credits)} credits` : "N/A")}
      ${detailItem("Crew", props.crew)}
      ${detailItem("Passengers", props.passengers)}
      ${detailItem("Length", props.length ? `${props.length} m` : "N/A")}
      ${detailItem("Max Atmosphering Speed", props.max_atmosphering_speed)}
    </div>
    <div class="detail-section-title">Films Featured In</div>
    <div class="related-list" id="relatedShipFilms"><span style="color:var(--text-dim);font-size:0.85rem;">Loading...</span></div>
    <div class="detail-section-title">Pilots</div>
    <div class="related-list" id="relatedPilots"><span style="color:var(--text-dim);font-size:0.85rem;">Loading...</span></div>
  `;

  detailOverlay.style.display = "flex";

  if (Array.isArray(props.films) && props.films.length) {
    fetchRelatedNames(props.films.slice(0, 6), "relatedShipFilms");
  } else {
    document.getElementById("relatedShipFilms").textContent = "None listed.";
  }

  if (Array.isArray(props.pilots) && props.pilots.length) {
    fetchRelatedNames(props.pilots.slice(0, 6), "relatedPilots");
  } else {
    document.getElementById("relatedPilots").textContent = "No pilots listed.";
  }
}

function renderSection(section, data) {
  if (section === "films") renderFilms(data);
  if (section === "characters") renderCharacters(data);
  if (section === "planets") renderPlanets(data);
  if (section === "starships") renderStarships(data);
}

async function loadSection(section) {
  const config = sectionConfig[section];
  if (!config) return;

  currentSection = section;
  sectionTitle.textContent = config.title;
  sectionSub.textContent = config.subtitle;
  searchInput.value = "";
  searchError.textContent = "";

  showLoading();

  try {
    if (!sectionCache[section]) {
      sectionCache[section] = await getSectionData(section);
    }

    allData = sectionCache[section];
    displayData = [...allData];

    renderSection(section, displayData);
    showCards();
  } catch (error) {
    console.error(`Failed loading ${section}:`, error);
    showError();
  }
}

function handleSearch() {
  const query = searchInput.value.trim().toLowerCase();
  searchError.textContent = "";

  if (!query) {
    searchError.textContent = "Please enter a search term.";
    return;
  }

  if (query.length < 2) {
    searchError.textContent = "Search must be at least 2 characters.";
    return;
  }

  displayData = allData.filter((item) => {
    const props = item.properties || {};
    const name = (props.name || props.title || "").toLowerCase();
    return name.includes(query);
  });

  if (!displayData.length) {
    searchError.textContent = `No results found for "${searchInput.value.trim()}".`;
  }

  renderSection(currentSection, displayData);
  showCards();
}

function clearSearch() {
  searchInput.value = "";
  searchError.textContent = "";
  displayData = [...allData];
  renderSection(currentSection, displayData);
  showCards();
}

navBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const section = btn.dataset.section;
    if (!section || section === currentSection) return;

    navBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    loadSection(section);
  });
});

searchBtn.addEventListener("click", handleSearch);

searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleSearch();
});

clearBtn.addEventListener("click", clearSearch);

detailClose.addEventListener("click", () => {
  detailOverlay.style.display = "none";
  detailContent.innerHTML = "";
});

detailOverlay.addEventListener("click", (e) => {
  if (e.target === detailOverlay) {
    detailOverlay.style.display = "none";
    detailContent.innerHTML = "";
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && detailOverlay.style.display === "flex") {
    detailOverlay.style.display = "none";
    detailContent.innerHTML = "";
  }
});

retryBtn.addEventListener("click", () => loadSection(currentSection));

buildStarField();
loadSection("films");