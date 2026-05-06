# CTAHR Hawaii Ecosystem & Fisheries Dashboard

A web-based interactive dashboard for exploring Hawaii's ecosystem extents and commercial/non-commercial fisheries exchange value data by region (moku) over time.

---

## What This Project Does

This dashboard lets users click on a region of Hawaii on a map and instantly see charts and statistics about:
- **Fisheries** — how the economic exchange value of fish species has changed over time
- **Ecosystem Extents** — how the area covered by different ecosystem types (e.g. Tree Cover, Grass/Shrub, Coral) has shifted within that region

---

## How Everything Fits Together

The dashboard is a **standalone web app** that reads pre-processed data files directly. The pipeline is a separate utility used to prepare data — it is not connected to or required by the running app.

```
GeoJSON + CSV files (capstone-dashboard/public/)
        │
        ▼
Next.js Web App (capstone-dashboard/)
  Fetches the GeoJSON/CSV files and renders the interactive map + charts
        │
        ▼
Browser — users interact with the dashboard
```

### Where the Data Files Come From

The data files in `public/` were prepared separately using the Python pipeline scripts. When new data arrives, someone runs the pipeline manually, then places the output files into `public/` before redeploying the app.

```
New raw data → Python Pipeline (pipeline/) → Manually copy output → public/
```

---

## The Two Main Parts

### 1. Next.js Web App (`capstone-dashboard/`)
The interactive website. This is the active, running part of the project.

| Folder / File | What it does |
|---|---|
| `src/app/` | Entry point and page layout |
| `src/components/dashboard/` | All the visible panels, charts, and filters |
| `src/components/map/` | The interactive Hawaii map |
| `src/utils/filterData.ts` | Helper logic to filter data based on user selections |
| `public/fisheriesdata/` | GeoJSON and CSV files for fisheries data |
| `public/mokuextentsdata/` | GeoJSON and CSV files for ecosystem extents data |
| `node_modules/` | Auto-generated folder of third-party libraries — **do not edit manually** |

### 2. Python Pipeline (`pipeline/`)
A set of standalone data cleaning scripts. These are **not used by the running app** — they exist to prepare raw data files when new data is received.

| File | What it does |
|---|---|
| `pipeline.py` | The main script — run this to kick off the whole pipeline |
| `clean_commercial.py` | Cleans and validates commercial fisheries data |
| `clean_noncommercial.py` | Cleans and validates non-commercial fisheries data |
| `config.py` | Central settings — file paths, column names, validation rules |
| `generate_dashboard.py` | Generates a standalone HTML dashboard file (legacy output) |
| `generate_components.py` | Generates embeddable chart components (legacy output) |
| `collapse_fisheries_geoJSON.py` | Compresses map shape files without losing data |

---

## Running the Dashboard Locally

### Prerequisites
- [Node.js](https://nodejs.org/) v18 or higher
- A terminal (Terminal on Mac, Command Prompt/PowerShell on Windows)

### Steps

1. **Install web app dependencies** (only needed once, or after pulling new changes):
   ```bash
   cd capstone-dashboard
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. Open your browser and go to `http://localhost:3000`

> **What is `npm install`?** It reads the `package.json` file and downloads all the libraries the web app needs into the `node_modules/` folder. This folder can be very large and is never committed to Git — it gets recreated each time you run `npm install`.

---

## Updating the Data

When new raw data files are received:

1. Place them in `pipeline/data/raw/`
2. Update `pipeline/config.py` if file names have changed
3. Run the pipeline (requires Python 3):
   ```bash
   cd pipeline
   python3 pipeline.py
   ```
4. Copy the processed output files into the appropriate folder under `capstone-dashboard/public/`
5. Restart the dev server (or redeploy)

---

## Project Structure (Full)

```
CTAHR-Dashboard/
├── capstone-dashboard/          # The Next.js web application (the active app)
│   ├── public/                  # Data files read directly by the app
│   │   ├── fisheriesdata/       # Fisheries GeoJSON + CSV files
│   │   └── mokuextentsdata/     # Ecosystem extents GeoJSON + CSV files
│   ├── src/
│   │   ├── app/                 # Page entry point and global layout
│   │   ├── components/          # UI components (map, charts, filters, panels)
│   │   └── utils/               # Shared helper functions
│   ├── package.json             # Lists all web app dependencies
│   └── node_modules/            # Downloaded libraries (auto-generated, not in Git)
│
├── pipeline/                    # Standalone Python data prep scripts (not part of the app)
│   ├── data/
│   │   ├── raw/                 # Original input data files
│   │   └── cleaned/             # Pipeline output — copy these into public/ when updated
│   ├── pipeline.py              # Main entry point — run this
│   └── config.py                # All configurable settings live here
│
├── README.md                    # This file
└── SETUP.md                     # Instructions for copying this to a new repository
```

---

## For the Maintaining Team

See [SETUP.md](SETUP.md) for step-by-step instructions on copying this project into your own GitHub repository.
