# Compound Interest & Multi-Asset Portfolio Calculator (Ad-Free & Local)

A clean, modern, ad-free web application for calculating compound interest, modeling multi-asset portfolios (e.g. Stocks, Real Estate, Crypto, Pensions, Savings), tracking historical market index benchmarks, modeling multiple fixed-term debt / loan liabilities, comparing return rates side-by-side, and projecting long-term combined net worth. Runs 100% locally on your computer with no tracking, no ads, and no external server requirements.

## Features

- ➕ **Unlimited Assets & Investments Support**:
  - Click **"+ Add Asset"** to add as many compounding assets as you need (Asset 1, Asset 2, Asset 3, etc.).
  - Customize each asset's name, starting balance, regular contributions, contribution frequency, return rate, and compounding frequency.
  - Delete any asset (minimum 1 retained).

- ➕ **Unlimited Debts & Loan Liabilities**:
  - Click **"+ Add Debt"** to model mortgages, auto loans, credit lines, or student debt.
  - Set starting debt balance, interest rate, payoff term (e.g. 5 years), start year, payment frequency, and repayment plan (Amortized vs Interest-Only).
  - Live calculation of annual debt payments and total interest cost.
  - Delete debts with the **✕** button.

- 📈 **Historical Index Benchmark Tracking**:
  - Automatically forecast rates based on 10-year historical annualized CAGR averages for major global indexes:
    - **S&P 500 Index** (~11.8% 10-yr CAGR)
    - **UK Housing Index** (~3.8% 10-yr CAGR - Nationwide House Price Index)
    - **FTSE All-World Index** (~8.8% 10-yr CAGR)
    - **NASDAQ 100 Index** (~16.5% 10-yr CAGR)
    - **FTSE 100 Index** (~6.2% 10-yr CAGR)
    - **UK Gilts / Treasury Bonds** (~2.8% 10-yr CAGR)
    - **Custom / Manual Rate** (Full user control)

- 📊 **Individual & Combined Visualizations**:
  - **Net Worth & Growth Chart**: Displays stacked visual growth of all active assets alongside debt liability bars and a continuous Net Worth trajectory line.
  - **Asset Breakdowns Tab**: Switch between any active asset using the dropdown selector to inspect its principal, contributions, and growth breakdown.
  - **Debt Breakdowns Tab**: Switch between any active debt to inspect its payoff amortization curve and payment schedule table.
  - **Rate Scenario Comparison**: Multi-line graph comparing return rates for Asset 1.

- 📅 **Detailed Annual Schedule & CSV Export**:
  - Comprehensive annual breakdown table showing each asset's ending balance, total gross assets, each debt's ending balance, total liabilities, combined net worth, annual contributions added, annual debt payments, and total net growth.
  - One-click **Export to CSV** button downloading the complete dynamic schedule for all active assets and debts.

- 🌙 **Modern UI & Theme Toggle**:
  - Built-in Dark Mode and Light Mode toggle.
  - Fully responsive for desktop and mobile.
  - Zero ads, no tracking, works completely offline.

## How to Run & Deploy

### 1. Run Live on GitHub (GitHub Pages)
To make your app run live on GitHub for free:
1. Push your repository to GitHub.
2. On GitHub, go to your repository **Settings**.
3. In the left sidebar, click **Pages** (under *Code and automation*).
4. Under **Build and deployment** -> **Branch**:
   - Select **`main`** (or `master`) branch.
   - Select **`/(root)`** directory.
   - Click **Save**.
5. After 1-2 minutes, GitHub will give you a live URL: `https://<your-username>.github.io/<your-repo-name>/`.

> **Note on Folder Structure**: Ensure `index.html`, `styles.css`, and `app.js` are located in the **root** folder of the GitHub repository (not inside a subfolder).

### 2. Run Directly on Your Computer (Offline / Local)
- Simply double-click `index.html` in your file explorer to open it in any web browser (Chrome, Edge, Firefox, Safari).
- Or serve locally:
  ```bash
  python -m http.server 8000
  ```
  Then navigate to `http://localhost:8000`.

---
*Created for fast, local, ad-free financial planning.*

2. **Local Web Server (Optional)**:
   You can also serve it with VS Code Live Server or Python:
   ```bash
   python -m http.server 8000
   ```
   Then navigate to `http://localhost:8000` in your web browser.

---
*Created for fast, local, ad-free financial planning.*
