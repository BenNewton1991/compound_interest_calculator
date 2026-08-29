# Compound Interest & Dual Asset Portfolio Calculator (Ad-Free & Local)

A clean, modern, ad-free web application for calculating compound interest, modeling multi-asset portfolios (e.g. Real Estate + Investment Portfolio), comparing return rates side-by-side, and projecting long-term combined net worth. Runs 100% locally on your computer with no tracking, no ads, and no external server requirements.

## Features

- 🏠 **Dual Compounding Assets Support**:
  - **Asset 1 (e.g. Liquid Finances)**: Model stocks or savings compounding at higher rates (e.g. 10% with $30,000 added annually).
  - **Asset 2 (e.g. House / Real Estate)**: Model property appreciation compounding at lower rates (e.g. 2% with $1,600 added annually).
  - Custom rename inputs for each asset.
  - Enable/Disable toggle to easily switch between single asset and dual asset modes.

- 📊 **Individual & Combined Visualizations**:
  - **Combined Net Worth Chart**: Displays stacked visual growth of Asset 1 + Asset 2 over time to project total wealth.
  - **Asset 1 Breakdown Chart**: Stacked breakdown of Initial Principal, Contributions Added, and Interest Earned for Asset 1.
  - **Asset 2 Breakdown Chart**: Stacked breakdown of Initial Value, Contributions Added, and Appreciation for Asset 2.
  - **Rate Scenario Comparison**: Multi-line graph comparing return rates (e.g. 4%, 6%, 8%, 10%, 12%) for Asset 1.

- 📅 **Detailed Annual Schedule & CSV Export**:
  - Annual breakdown table showing Asset 1 Ending Balance, Asset 2 Ending Balance, Combined Net Worth, Annual Contributions, and Total Interest/Appreciation.
  - One-click **Export to CSV** button downloading the complete multi-asset projection schedule.

- 🌙 **Modern UI & Theme Toggle**:
  - Built-in Dark Mode and Light Mode toggle.
  - Fully responsive for desktop and mobile.
  - Zero ads, no tracking, works completely offline.

## How to Run

1. **Direct File Open (Easiest)**:
   Simply double-click `index.html` in your file explorer to open it in any web browser (Chrome, Edge, Firefox, Safari).

2. **Local Web Server (Optional)**:
   You can also serve it with VS Code Live Server or Python:
   ```bash
   python -m http.server 8000
   ```
   Then navigate to `http://localhost:8000` in your web browser.

---
*Created for fast, local, ad-free financial planning.*
