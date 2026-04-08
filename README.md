# 🪐 Holocron API

A front-end web application that pulls live data from the [Swapi.Tech](https://swapi.tech) public Star Wars API and displays it in a polished, interactive UI. Built as a pre-work assignment for Code the Dream's Advanced Web Development program.

---

## Features

- **Three sections**: Films, Characters, and Planets
- **Search** within any section (with error handling for empty/short queries)
- **Detail panel** for every item &mdash; click any card to see full information
- **Related data** &mdash; films show linked characters & planets; characters show their home world & films; planets show their residents & films
- **Animated star field** hero banner
- **Responsive design** &mdash; works on mobile and desktop
- **No API key required** &mdash; Swapi.Tech is completely free and open

---

## Tech Stack

| File             | Purpose                                 |
|------------------|-----------------------------------------|
| `index.html`     | Page structure and markup.              |
|------------------|-----------------------------------------|
| `style.css`      | All styling (CSS variables, animations) |
|------------------|-----------------------------------------|
| `script.js`      | API fetching, rendering, event handling |
|------------------|-----------------------------------------|

---

## How to Run

### Option A - Open directly in your browser (simplest)

1. Download or clone this repository.
2. Open `index.html` in any modern web browser (Chrome, Firefox, Edge, Safari).
3. That's it! No build step, no dependencies, no server needed.

```bash
# Clone the repo
git clone https://github.com/whitgunt77/holocron-api.git

# Navigate into the folder
cd holocron-api

# Open in browser (Mac)
open index.html

# Open in browser (Windows - run in Powershell)
start index.html

# Open in browser (Linux)
xdg-open index.html
```

### Option B - Use VS Code Live Server (recommended for development)

1. Install [Visual Studio Code](https://code.visualstudio.com/).
2. Install the **Live Server** extension (by Ritwick Dey) from the Extensions panel.
3. Open the project folder in VS Code.
4. Right-click `index.html` → **Open with Live Server**.
5. Your browser will open automatically and reload on every save.

### Option C - Python simple HTTP server

```bash
# Python 3
python3 -m http.server 8080

# Then visit:
# http://localhost:8080
```

---

## Project Structure

```
holocron-api/
├── index.html   ← Page markup
├── style.css    ← Styles & theme
├── script.js    ← API logic & rendering
└── README.md    ← This file
```

---

## API Used

**Swapi.Tech** - `https://www.swapi.tech/api`

No API key is needed. All requests are made with the browser's built-in `fetch()`. Endpoints used:

| Section     | Endpoint  | Details fetched                            |
|-------------|-----------|--------------------------------------------|
| Films       | `/films`  | Title, episode, director, crawl, cast      |
|-------------|-----------|--------------------------------------------|
| Characters  | `/people` | Name, gender, birth year, homeworld        |
|-------------|-----------|--------------------------------------------|
| Planets     | `/planets`| Name, climate, terrain, population         |
|-------------|-----------|--------------------------------------------|

Related resources (e.g., a character's homeworld) are fetched on demand when the detail panel is opened &mdash; keeping the initial load fast.

---

## Checklist of Requirements

### Structure ✅
- [x] Public GitHub repository
- [x] `index.html` document
- [x] `style.css` stylesheet
- [x] `script.js` - fetches from public API
- [x] `README.md` with run instructions

### Content ✅
- [x] At least 2 endpoints displayed (Films + Characters + Planets = 3)
- [x] Navigation between sections via header buttons
- [x] New GET requests issued when navigating to each section

### Functionality ✅
- [x] Runs without issues from instructions above
- [x] Navigation is fast - only fetches the active section's data
- [x] Code is readable, commented, and well-structured
- [x] Search includes error handling (empty query, too-short query, no results)
- [x] Accessible colors with sufficient contrast; readable font sizes

---

## Author

Built by Whitney · GitHub Link: [@whitgunt77](https://github.com/whitgunt77)