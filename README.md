# CTAHR Ecosystem Accounts Dashboard

An interactive web dashboard developed for the University of Hawaiʻi CTAHR Ecosystem Accounts project. The dashboard allows users to explore fisheries ecosystem data across Hawaiʻi using interactive maps, filters, and downloadable datasets.

## Project Overview

The purpose of this project is to make ecosystem accounting data easier to access and visualize for researchers, students, and the public. Instead of viewing large spreadsheets, users can interact with map-based visualizations to better understand fisheries exchange values across Hawaiʻi counties.

This dashboard was developed as a capstone project in collaboration with Dr. Kirsten Oleson and the CTAHR Ecosystem Accounts team.

---

## Features

- Interactive choropleth map of Hawaiʻi counties
- Filter data by:
  - County
  - Year range
  - Species group
  - Ecosystem type
- Dynamic dashboard updates
- CSV download support for filtered datasets
- Tooltip and hover interactions on map regions
- Responsive layout for easier navigation

---

## Tools and Stack

### Frontend

- Next.js
- React
- TypeScript
- Leaflet.js
- React-Leaflet

### Testing

- Jest
- React Testing Library

### Deployment

- Cloudflare Pages

---

## Project Structure

```bash
src/
 ├── app/
 ├── components/
 │    ├── dashboard/
 │    ├── map/
 │    └── ui/
 ├── utils/
 └── data/
```

---

## Installation

Clone the repository:

```bash
git clone https://github.com/CTAHR-Dashboard/CTAHR-Dashboard.git
```

Navigate into the project folder:

```bash
cd capstone-dashboard
```

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open the application in your browser:

```bash
http://localhost:3000
```

---

## Running Tests

Run the test suite using:

```bash
npm test
```

---

## Deployment

The project is deployed using Cloudflare Pages.

Production deployments automatically update when changes are pushed to the production branch.

---

## Data Sources

The dashboard currently focuses on fisheries ecosystem accounting datasets provided by the CTAHR Ecosystem Accounts project.

Additional ecosystem datasets may be added in future development.

---

## Future Improvements

- Additional ecosystem datasets
- Improved mobile responsiveness
- Expanded map layers and region selections
- More advanced analytics and charts
- Public data export tools

---

## Team Contributions

This project was developed as part of a University of Hawaiʻi at Mānoa capstone project. Team members collaborated using GitHub branches, pull requests, testing workflows, and weekly sponsor meetings.

---

## Acknowledgments

We would like to thank Dr. Kirsten Oleson and the CTAHR Ecosystem Accounts team for their guidance, support, and feedback throughout the project development process.

---

## License

This project is intended for educational and research purposes.
