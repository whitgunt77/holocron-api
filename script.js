// Base URL
const BASE_URL = "https://www.swapi.tech/api";

// State
let currentSection = "films";
let allData = [];
let displayData = [];

// DOM References
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

// Section Config
const sectionConfig = {
    films: { title: "Films", subtitle: "Every Star Wars saga film", endpoint: "/films" },
    characters: { title: "Characters", subtitle: "Heroes, villains & everyone between", endpoint: "/people" },
    planets: { title: "Planets", subtitle: "Worlds across the galaxy", endpoint: "/planets" },
};

// Star Field (hero background animation)
function buildStarField() {
    const container = document.getElementById("stars");
    if (!container) return;
    const count = 120;
    for (let i = 0; i < count; i++) {
        const star = document.createElement("div");
        star.classList.add("star");
        const size = Math.random() * 2.5 + 0.5;
        star.style.cssText = `
            width: ${size}px; height: ${size}px;
            top: ${Math.random()*100}%;
            left: ${Math.random()*100}%;
            --dur: ${(Math.random()*4+2).toFixed(1)}s;
            --delay: ${(Math.random()*4).toFixed(1)}s;
        `;
        container.appendChild(star);
    }
}

// HELPERS: show / hide UI states
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
    if (!str || str === "n/a" || str === "unknown") return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatNumber(num) {
    if (!num || num === "unknown" || num === "n/a") return num;
    const parsed = Number(String(num).replace(/,/g, ""));
    return isNaN(parsed) ? num : parsed.toLocaleString();
}

// FETCH HELPERS

/**
 * Generic fetch wrapper with error handling
 * Returns parsed JSON or throws an Error
 */
async function fetchJSON(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    return response.json();
}

/**
 * Fetch ALL pages from a paginated endpoint
 * swapi.tech uses ?page=1&limit=10 pagination
 * Returns a flat array of result objects
 */
async function fetchAllPages(endpoint) {
    let results = [];
    let nextUrl = `${BASE_URL}${endpoint}?page=1&limit=10`;

    while (nextUrl) {
        const data = await fetchJSON(nextUrl);
        const items = data.results || data.result || [];
        results = results.concat(items);

        // swapi.tech returns next page url under data.next (may be null)
        nextUrl = data.next || null;
    }
    return results;
}

// RENDER - Films
function renderFilms(films) {
    cardsGrid.innerHTML = "";
    if (films.length === 0) {
        cardsGrid.innerHTML = `<p style="color:var(--text-muted);grid-column:1/-1;text-align:center;padding:3rem 0;">No films found.</p>`;
        return;
    }

    films.forEach((film, i) => {
        const props = film.properties || film;
        const card = document.createElement("div");
        card.classList.add("card");
        card.style.animationDelay = `${i * 60}ms`;

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

async function openFilmDetail(film) {
  const props = film.properties || film;
  detailContent.innerHTML = `
    <div class="detail-label">Star Wars Film</div>
    <div class="detail-title">${props.title ?? "Unknown"}</div>
    <div class="detail-grid">
      ${detailItem("Episode", props.episode_id)}
      ${detailItem("Director", props.director)}
      ${detailItem("Producer", props.producer)}
      ${detailItem("Released", props.release_date)}
    </div>
    ${props.opening_crawl ? `
      <div class="detail-section-title">Opening Crawl</div>
      <p class="detail-crawl">${props.opening_crawl.replace(/\r\n/g, " ").trim()}</p>
    ` : ""}
    <div class="detail-section-title">Characters</div>
    <div class="related-list" id="relatedChars">
      <span style="color:var(--text-dim);font-size:0.85rem;">Loading...</span>
    </div>
    <div class="detail-section-title">Planets</div>
    <div class="related-list" id="relatedPlanets">
      <span style="color:var(--text-dim);font-size:0.85rem;">Loading...</span>
    </div>
  `;
 
  detailOverlay.style.display = "flex";
 
  // Fetch related characters (first 5)
  if (Array.isArray(props.characters)) {
    fetchRelatedNames(props.characters.slice(0, 5), "relatedChars", "characters");
  }
 
  // Fetch related planets (first 5)
  if (Array.isArray(props.planets)) {
    fetchRelatedNames(props.planets.slice(0, 5), "relatedPlanets", "planets");
  }
}

// RENDER - Characters
function renderCharacters(characters) {
  cardsGrid.innerHTML = "";
  if (characters.length === 0) {
    cardsGrid.innerHTML = `<p style="color:var(--text-muted);grid-column:1/-1;text-align:center;padding:3rem 0;">No characters found.</p>`;
    return;
  }
 
  characters.forEach((char, i) => {
    const props = char.properties || char;
    const card  = document.createElement("div");
    card.classList.add("card");
    card.style.animationDelay = `${i * 50}ms`;
 
    card.innerHTML = `
      <div class="card-label">Character</div>
      <div class="card-title">${props.name ?? "Unknown"}</div>
      <div class="card-body">
        <p><strong>Gender:</strong> ${capitalize(props.gender ?? "N/A")}</p>
        <p><strong>Birth Year:</strong> ${props.birth_year ?? "N/A"}</p>
        <p><strong>Homeworld:</strong> <span class="homeworld-name" data-url="${props.homeworld ?? ""}">Loading…</span></p>
      </div>
      <div class="card-footer">Click to explore →</div>
    `;
 
    // Lazy-load homeworld name
    if (props.homeworld) fetchPlanetName(props.homeworld, card.querySelector(".homeworld-name"));
 
    card.addEventListener("click", () => openCharacterDetail(char));
    cardsGrid.appendChild(card);
  });
}
 
async function fetchPlanetName(url, el) {
  try {
    const data = await fetchJSON(url);
    const name = data?.result?.properties?.name ?? data?.properties?.name ?? "Unknown";
    if (el) el.textContent = name;
  } catch {
    if (el) el.textContent = "Unknown";
  }
}
 
async function openCharacterDetail(char) {
  const props = char.properties || char;
  detailContent.innerHTML = `
    <div class="detail-label">Character</div>
    <div class="detail-title">${props.name ?? "Unknown"}</div>
    <div class="detail-grid">
      ${detailItem("Gender", capitalize(props.gender))}
      ${detailItem("Birth Year", props.birth_year)}
      ${detailItem("Height", props.height ? props.height + " cm" : "N/A")}
      ${detailItem("Mass", props.mass ? props.mass + " kg" : "N/A")}
      ${detailItem("Hair Color", capitalize(props.hair_color))}
      ${detailItem("Eye Color", capitalize(props.eye_color))}
      ${detailItem("Skin Color", capitalize(props.skin_color))}
    </div>
    <div class="detail-section-title">Homeworld</div>
    <div class="related-list" id="relatedHomeworld">
      <span style="color:var(--text-dim);font-size:0.85rem;">Loading...</span>
    </div>
    <div class="detail-section-title">Films Appeared In</div>
    <div class="related-list" id="relatedFilms">
      <span style="color:var(--text-dim);font-size:0.85rem;">Loading...</span>
    </div>
  `;
 
  detailOverlay.style.display = "flex";
 
  // Fetch homeworld
  if (props.homeworld) {
    try {
      const data = await fetchJSON(props.homeworld);
      const planetProps = data?.result?.properties ?? data?.properties ?? {};
      const el = document.getElementById("relatedHomeworld");
      if (el) {
        el.innerHTML = `
          <div class="detail-grid" style="width:100%;margin:0;">
            ${detailItem("Name", planetProps.name)}
            ${detailItem("Climate", capitalize(planetProps.climate))}
            ${detailItem("Terrain", capitalize(planetProps.terrain))}
            ${detailItem("Population", formatNumber(planetProps.population))}
          </div>
        `;
      }
    } catch {
      document.getElementById("relatedHomeworld").textContent = "Could not load homeworld.";
    }
  } else {
    document.getElementById("relatedHomeworld").textContent = "Unknown";
  }
 
  // Fetch films
  if (Array.isArray(props.films) && props.films.length > 0) {
    fetchRelatedNames(props.films.slice(0, 6), "relatedFilms", "films");
  } else {
    document.getElementById("relatedFilms").textContent = "None listed.";
  }
}

// RENDER - Planets
function renderPlanets(planets) {
  cardsGrid.innerHTML = "";
  if (planets.length === 0) {
    cardsGrid.innerHTML = `<p style="color:var(--text-muted);grid-column:1/-1;text-align:center;padding:3rem 0;">No planets found.</p>`;
    return;
  }
 
  planets.forEach((planet, i) => {
    const props = planet.properties || planet;
    const card  = document.createElement("div");
    card.classList.add("card");
    card.style.animationDelay = `${i * 50}ms`;
 
    card.innerHTML = `
      <div class="card-label">Planet</div>
      <div class="card-title">${props.name ?? "Unknown"}</div>
      <div class="card-body">
        <p><strong>Climate:</strong> ${capitalize(props.climate ?? "N/A")}</p>
        <p><strong>Terrain:</strong> ${capitalize(props.terrain ?? "N/A")}</p>
        <p><strong>Population:</strong> ${formatNumber(props.population ?? "N/A")}</p>
      </div>
      <div class="card-footer">Click to explore →</div>
    `;
 
    card.addEventListener("click", () => openPlanetDetail(planet));
    cardsGrid.appendChild(card);
  });
}
 
async function openPlanetDetail(planet) {
  const props = planet.properties || planet;
  detailContent.innerHTML = `
    <div class="detail-label">Planet</div>
    <div class="detail-title">${props.name ?? "Unknown"}</div>
    <div class="detail-grid">
      ${detailItem("Climate", capitalize(props.climate))}
      ${detailItem("Terrain", capitalize(props.terrain))}
      ${detailItem("Population", formatNumber(props.population))}
      ${detailItem("Diameter", props.diameter ? formatNumber(props.diameter) + " km" : "N/A")}
      ${detailItem("Gravity", props.gravity)}
      ${detailItem("Orbital Period", props.orbital_period ? props.orbital_period + " days" : "N/A")}
      ${detailItem("Rotation Period", props.rotation_period ? props.rotation_period + " hrs" : "N/A")}
      ${detailItem("Surface Water", props.surface_water ? props.surface_water + "%" : "N/A")}
    </div>
    <div class="detail-section-title">Residents</div>
    <div class="related-list" id="relatedResidents">
      <span style="color:var(--text-dim);font-size:0.85rem;">Loading...</span>
    </div>
    <div class="detail-section-title">Films Featured In</div>
    <div class="related-list" id="relatedFilms">
      <span style="color:var(--text-dim);font-size:0.85rem;">Loading...</span>
    </div>
  `;
 
  detailOverlay.style.display = "flex";
 
  if (Array.isArray(props.residents) && props.residents.length > 0) {
    fetchRelatedNames(props.residents.slice(0, 5), "relatedResidents", "characters");
  } else {
    document.getElementById("relatedResidents").textContent = "No residents listed.";
  }
 
  if (Array.isArray(props.films) && props.films.length > 0) {
    fetchRelatedNames(props.films.slice(0, 6), "relatedFilms", "films");
  } else {
    document.getElementById("relatedFilms").textContent = "None listed.";
  }
}

// SHARED HELPERS

/* Build a single detail item block */
function detailItem(label, value) {
    const display = (value === undefined || value === null || value === "") ? "N/A" : value;
    return `
      <div class="detail-item">
        <div class="detail-item-label">${label}</div>
        <div class="detail-item-value">${display}</div>
      </div>
    `;
}

/**
 * Fetch names from an array of URLs and render them as tags
 * inside the element with id=containerId
 * @param {string[]}    urls             - Array of API URLs to fetch
 * @param {string}      containerId.     - Target element ID
 * @param {string}      type             - "films" | "characters" | "planets"
 */
async function fetchRelatedNames(urls, containerId, type) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const names = await Promise.all(
        urls.map(async (url) => {
            try {
                const data = await fetchJSON(url);
                // swapi.tech nests properties under result.properties or directly
                const props = data?.result?.properties ?? data?.properties ?? {};
                return { name: props.name ?? props.title ?? "Unknown", url };
            } catch {
                return { name: "Unknown", url };
            }
        })
    );

    container.innerHTML = names
        .map(({ name }) => `<span class="related-tag">${name}</span>`)
        .join("");
}

// Section Loader
async function loadSection(section) {
    const config = sectionConfig[section];
    sectionTitle.textContent = config.title;
    sectionSub.textContent = config.subtitle;
    searchInput.value = "";
    searchError.textContent = "";
    showLoading();

    try {
        const raw = await fetchAllPages(config.endpoint);
        allData = raw;
        displayData = raw;
        showCards();
        renderSection(section, displayData);
    } catch (err) {
        console.error("Failed to fetch section:", err);
        showError();
    }
}

function renderSection(section, data) {
    if (section === "films") renderFilms(data);
    else if (section === "characters") renderCharacters(data);
    else if (section === "planets") renderPlanets(data);
}

// SEARCH
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

    const filtered = allData.filter((item) => {
        const props = item.properties || item;
        const name = (props.name ?? props.title ?? "").toLowerCase();
        return name.includes(query);
    });

    displayData = filtered;
    showCards();

    if (filtered.length === 0) {
        searchError.textContent = `No results found for ${searchInput.value.trim()}".`;
    }

    renderSection(currentSection, displayData);
}

function clearSearch() {
    searchInput.value = "";
    searchError.textContent = "";
    displayData = allData;
    showCards();
    renderSection(currentSection, displayData);
}

// Event Listeners

// Nav Buttons
navBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
        const section = btn.dataset.section;
        if (section === currentSection) return;
        currentSection = section;
        navBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        loadSection(section);
    });
});

// Search
searchBtn.addEventListener("click", handleSearch);

searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleSearch();
});

clearBtn.addEventListener("click", clearSearch);

// Close detail overlay
detailClose.addEventListener("click", () => {
    detailOverlay.style.display = "none";
    detailContent.innerHTML = "";
});

// Close on backdrop click
detailOverlay.addEventListener("click", (e) => {
    if (e.target === detailOverlay) {
        detailOverlay.style.display = "none";
        detailContent.innerHTML = "";
    }
});

// Close on Escape key
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && detailOverlay.style.display === "flex") {
        detailOverlay.style.display = "none";
        detailContent.innerHTML = "";
    }
});

// Retry button (on error state)
retryBtn.addEventListener("click", () => loadSection(currentSection));

// INIT
buildStarField();
loadSection("films");