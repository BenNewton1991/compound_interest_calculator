/**
 * Ad-Free Local Compound Interest & Multi-Asset/Debt Portfolio Calculator
 * Features: Unlimited dynamic compounding assets with index benchmark tracking,
 * unlimited dynamic debt & loan liability payoff schedules,
 * combined net worth growth, rate scenario analysis, annual schedule, and CSV exporter.
 */

// Global Chart Instances
let combinedChartInstance = null;
let assetBreakdownChartInstance = null;
let debtChartInstance = null;
let comparisonChartInstance = null;

// Export Data Cache
let currentScheduleExportData = [];

const STORAGE_KEY = 'compound-interest-calculator-state-v1';

// Color Palette for Assets
const ASSET_COLORS = [
  { bg: '#38bdf8', border: '#0284c7' }, // Sky Blue
  { bg: '#a78bfa', border: '#7c3aed' }, // Purple
  { bg: '#fbbf24', border: '#d97706' }, // Amber
  { bg: '#34d399', border: '#059669' }, // Emerald
  { bg: '#f472b6', border: '#db2777' }, // Pink
  { bg: '#818cf8', border: '#4f46e5' }, // Indigo
  { bg: '#2dd4bf', border: '#0d9488' }, // Teal
  { bg: '#fb923c', border: '#ea580c' }, // Orange
  { bg: '#e879f9', border: '#c026d3' }  // Fuchsia
];

// Historical Index Benchmarks (10-Year Annualized CAGR Averages)
const INDEX_BENCHMARKS = {
  custom: { name: 'Custom Rate', rate: null },
  sp500: { name: 'S&P 500 Index', rate: 11.8, desc: 'US Equities ~11.8% 10-Yr CAGR' },
  ftse_allworld: { name: 'FTSE All-World Index', rate: 8.8, desc: 'Global Equities ~8.8% 10-Yr CAGR' },
  nasdaq100: { name: 'NASDAQ 100 Index', rate: 16.5, desc: 'US Tech Equities ~16.5% 10-Yr CAGR' },
  ftse100: { name: 'FTSE 100 Index', rate: 6.2, desc: 'UK Equities ~6.2% 10-Yr CAGR' },
  uk_house: { name: 'UK Housing Index', rate: 3.8, desc: 'UK Real Estate ~3.8% 10-Yr CAGR' },
  uk_gilts: { name: 'UK Gilts / Bonds', rate: 2.8, desc: 'UK Treasury Bonds ~2.8% 10-Yr CAGR' }
};

// Typical UK loan examples. All values remain editable after selecting a preset.
const DEBT_PRESETS = {
  custom: { name: 'Custom Debt / Loan' },
  mortgage: { name: 'Average UK Mortgage', principal: 200000, rate: 4.5, termYears: 25, paymentFreq: 12, paymentModel: 'amortized' },
  car_finance: { name: 'Average Car Finance', principal: 20000, rate: 8.9, termYears: 4, paymentFreq: 12, paymentModel: 'amortized' },
  personal_loan: { name: 'Average Personal Loan', principal: 10000, rate: 9.9, termYears: 5, paymentFreq: 12, paymentModel: 'amortized' },
  student_loan: { name: 'UK Student Loan Example', principal: 45000, rate: 4.3, termYears: 30, paymentFreq: 12, paymentModel: 'amortized' },
  credit_card: { name: 'Average Credit Card Balance', principal: 2500, rate: 24.9, termYears: 3, paymentFreq: 12, paymentModel: 'amortized' },
  payday_loan: { name: 'Typical Payday Loan', principal: 300, rate: 99.9, termYears: 1, paymentFreq: 12, paymentModel: 'amortized' }
};

// Application State
let nextAssetId = 3;
let nextDebtId = 2;

let assetsState = [
  {
    id: 'asset_1',
    name: 'Finances & Investments',
    preset: 'sp500',
    principal: 10000,
    deposit: 100,
    depositFreq: 1, // Annually
    rate: 11.8,
    compoundFreq: 12 // Monthly
  },
  {
    id: 'asset_2',
    name: 'House & Real Estate',
    preset: 'uk_house',
    principal: 300000,
    deposit: 100,
    depositFreq: 1, // Annually
    rate: 3.8,
    compoundFreq: 1 // Annually
  }
];

let debtsState = [
  {
    id: 'debt_1',
    name: 'Fixed Loan / Mortgage',
    preset: 'custom',
    principal: 10000,
    rate: 2.5,
    termYears: 5,
    startYear: 1,
    paymentFreq: 12,
    paymentModel: 'amortized'
  }
];

function saveCalculatorState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      assetsState,
      debtsState,
      nextAssetId,
      nextDebtId,
      investmentYears: investmentYearsInput.value,
      inflationRate: inflationRateInput.value,
      comparisonRates: comparisonRatesInput.value,
      theme: document.documentElement.getAttribute('data-theme')
    }));
  } catch (error) {
    // Storage can be unavailable in private or restricted browser contexts.
  }
}

function restoreCalculatorState() {
  try {
    const savedState = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!savedState || !Array.isArray(savedState.assetsState) || !Array.isArray(savedState.debtsState)) return;

    assetsState = savedState.assetsState;
    debtsState = savedState.debtsState;
    nextAssetId = Number.isInteger(savedState.nextAssetId) ? savedState.nextAssetId : assetsState.length + 1;
    nextDebtId = Number.isInteger(savedState.nextDebtId) ? savedState.nextDebtId : debtsState.length + 1;
    investmentYearsInput.value = savedState.investmentYears || investmentYearsInput.value;
    inflationRateInput.value = savedState.inflationRate || inflationRateInput.value;
    comparisonRatesInput.value = savedState.comparisonRates || comparisonRatesInput.value;

    if (savedState.theme === 'light' || savedState.theme === 'dark') {
      document.documentElement.setAttribute('data-theme', savedState.theme);
      themeToggle.querySelector('.theme-icon').textContent = savedState.theme === 'dark' ? '🌙' : '☀️';
    }
  } catch (error) {
    // Use the built-in defaults if saved data is missing, corrupt, or unavailable.
  }
}

// DOM Elements - Global Settings
const form = document.getElementById('calculatorForm');
const investmentYearsInput = document.getElementById('investmentYears');
const inflationRateInput = document.getElementById('inflationRate');
const comparisonRatesInput = document.getElementById('comparisonRates');

const assetsContainer = document.getElementById('assetsContainer');
const debtsContainer = document.getElementById('debtsContainer');
const btnAddAsset = document.getElementById('btnAddAsset');
const btnAddDebt = document.getElementById('btnAddDebt');

// Selectors in Tabs
const assetSelector = document.getElementById('assetSelector');
const debtSelector = document.getElementById('debtSelector');
const btnTabDebt = document.getElementById('btnTabDebt');
const cardDebtSummary = document.getElementById('cardDebtSummary');

// Results Cards DOM
const lblCombinedValue = document.getElementById('lblCombinedValue');
const resCombinedValue = document.getElementById('resCombinedValue');
const resInflationAdjusted = document.getElementById('resInflationAdjusted');

const resGrossAssets = document.getElementById('resGrossAssets');
const resGrossAssetsSub = document.getElementById('resGrossAssetsSub');

const resDebtSummaryValue = document.getElementById('resDebtSummaryValue');
const resDebtSummarySub = document.getElementById('resDebtSummarySub');

const resTotalContributions = document.getElementById('resTotalContributions');
const resContributionsSub = document.getElementById('resContributionsSub');

const resTotalInterest = document.getElementById('resTotalInterest');
const resInterestPercentage = document.getElementById('resInterestPercentage');

// Controls DOM
const btnCalculate = document.getElementById('btnCalculate');
const btnReset = document.getElementById('btnReset');
const themeToggle = document.getElementById('themeToggle');
const btnExportCSV = document.getElementById('btnExportCSV');

// Format Helpers
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0
  }).format(amount || 0);
}

function formatCompactCurrency(amount) {
  const absoluteAmount = Math.abs(amount);
  if (absoluteAmount >= 1000000) return `£${(amount / 1000000).toFixed(1)}m`;
  if (absoluteAmount >= 1000) return `£${(amount / 1000).toFixed(0)}k`;
  return `£${amount}`;
}

function formatPercent(value) {
  return `${(value || 0).toFixed(1)}%`;
}

// Calculate Compound Interest Schedule for an asset
function calculateCompoundInterest({
  principal,
  deposit,
  depositFreq,
  annualRate,
  compoundFreq,
  years,
  inflationRate
}) {
  const r = (annualRate || 0) / 100;
  const n = compoundFreq || 1;
  const m = depositFreq || 1;
  const totalYears = parseInt(years, 10);

  const ratePerComp = r / n;
  const ratePerDepositPeriod = Math.pow(1 + ratePerComp, n / m) - 1;

  let currentBalance = principal;
  let totalContributions = principal;
  const schedule = [];

  for (let y = 1; y <= totalYears; y++) {
    const yearStartBalance = currentBalance;
    let yearContributions = 0;
    let yearInterestEarned = 0;

    for (let p = 1; p <= m; p++) {
      const interest = currentBalance * ratePerDepositPeriod;
      currentBalance += interest;
      yearInterestEarned += interest;
      currentBalance += deposit;
      yearContributions += deposit;
    }

    totalContributions += yearContributions;
    const totalInterestEarned = currentBalance - totalContributions;
    const realFutureValue = currentBalance / Math.pow(1 + (inflationRate / 100), y);

    schedule.push({
      year: y,
      startBalance: yearStartBalance,
      contributionsThisYear: yearContributions,
      interestEarnedThisYear: yearInterestEarned,
      endBalance: currentBalance,
      cumulativeContributions: totalContributions,
      cumulativeInterest: totalInterestEarned,
      realFutureValue: realFutureValue
    });
  }

  return {
    finalBalance: currentBalance,
    totalContributions: totalContributions,
    totalInterest: currentBalance - totalContributions,
    realFutureValue: currentBalance / Math.pow(1 + (inflationRate / 100), totalYears),
    schedule: schedule
  };
}

// Calculate Debt Amortization Schedule
function calculateDebtSchedule({
  principal,
  annualRate,
  termYears,
  startYear,
  paymentFreq,
  paymentModel,
  totalYears
}) {
  const p0 = parseFloat(principal) || 0;
  const r = (parseFloat(annualRate) || 0) / 100;
  const m = parseInt(paymentFreq, 10) || 12;
  const i = r / m;
  const term = Math.max(1, parseInt(termYears, 10) || 1);
  const start = Math.max(1, parseInt(startYear, 10) || 1);
  const totalPaymentPeriods = term * m;

  let periodicPayment = 0;
  if (paymentModel === 'amortized') {
    if (i > 0) {
      periodicPayment = (p0 * i) / (1 - Math.pow(1 + i, -totalPaymentPeriods));
    } else {
      periodicPayment = totalPaymentPeriods > 0 ? p0 / totalPaymentPeriods : 0;
    }
  } else {
    // Interest-only periodic payment
    periodicPayment = p0 * i;
  }

  const annualPayment = periodicPayment * m;
  let currentDebtBalance = 0;
  let totalInterestPaid = 0;
  let totalPrincipalPaid = 0;

  const schedule = [];

  for (let y = 1; y <= totalYears; y++) {
    const isBeforeStart = y < start;
    const isDuringTerm = y >= start && y < (start + term);
    const isPayoffYear = y === (start + term); // if needed or exact term end
    const isPastTerm = y >= (start + term);

    let yearStartBalance = 0;
    let yearPayment = 0;
    let yearInterestPaid = 0;
    let yearPrincipalPaid = 0;
    let yearEndBalance = 0;

    if (isBeforeStart) {
      // Debt exists before repayment starts (accrues interest or stands at principal)
      yearStartBalance = p0;
      yearEndBalance = p0;
      yearPayment = 0;
      yearInterestPaid = 0;
      yearPrincipalPaid = 0;
      currentDebtBalance = p0;
    } else if (isDuringTerm) {
      if (y === start) {
        currentDebtBalance = p0;
      }
      yearStartBalance = currentDebtBalance;

      for (let p = 1; p <= m; p++) {
        if (currentDebtBalance <= 0) break;

        const periodInterest = currentDebtBalance * i;
        yearInterestPaid += periodInterest;

        let periodPrincipal = 0;
        if (paymentModel === 'amortized') {
          periodPrincipal = periodicPayment - periodInterest;
          if (periodPrincipal > currentDebtBalance || (y === start + term - 1 && p === m)) {
            // Last payment adjusts for floating precision
            periodPrincipal = currentDebtBalance;
          }
        } else {
          // Interest only: principal remains until final period
          if (y === start + term - 1 && p === m) {
            periodPrincipal = currentDebtBalance;
          } else {
            periodPrincipal = 0;
          }
        }

        yearPrincipalPaid += periodPrincipal;
        currentDebtBalance = Math.max(0, currentDebtBalance - periodPrincipal);
      }

      yearPayment = yearPrincipalPaid + yearInterestPaid;
      totalInterestPaid += yearInterestPaid;
      totalPrincipalPaid += yearPrincipalPaid;
      yearEndBalance = currentDebtBalance < 0.01 ? 0 : currentDebtBalance;
    } else if (isPastTerm) {
      // Loan has been fully paid off
      yearStartBalance = 0;
      yearEndBalance = 0;
      yearPayment = 0;
      yearInterestPaid = 0;
      yearPrincipalPaid = 0;
    }

    schedule.push({
      year: y,
      startBalance: yearStartBalance,
      annualPayment: yearPayment,
      principalPaid: yearPrincipalPaid,
      interestPaid: yearInterestPaid,
      endBalance: yearEndBalance,
      cumulativeInterestPaid: totalInterestPaid,
      cumulativePrincipalPaid: totalPrincipalPaid
    });
  }

  return {
    annualPayment: annualPayment,
    totalInterestPaid: totalInterestPaid,
    totalPrincipalPaid: totalPrincipalPaid,
    schedule: schedule
  };
}

// Render Dynamic Asset Cards in Form
function renderAssetCards() {
  assetsContainer.innerHTML = '';

  assetsState.forEach((asset, idx) => {
    const color = ASSET_COLORS[idx % ASSET_COLORS.length];
    const canDelete = assetsState.length > 1;

    const card = document.createElement('div');
    card.className = 'asset-card';
    card.style.borderLeft = `4px solid ${color.bg}`;
    card.dataset.assetId = asset.id;

    card.innerHTML = `
      <div class="asset-card-header">
        <span class="asset-badge" style="background-color: ${color.bg};">Asset ${idx + 1}</span>
        <input type="text" class="asset-name-input" data-field="name" value="${asset.name}" placeholder="Asset Name">
        ${canDelete ? `<button type="button" class="btn-remove-card" data-action="remove-asset" title="Remove Asset">✕</button>` : ''}
      </div>

      <div class="form-group">
        <label>Benchmark / Index Track</label>
        <select class="index-preset-select" data-field="preset">
          <option value="custom" ${asset.preset === 'custom' ? 'selected' : ''}>Custom / Manual Rate</option>
          <option value="sp500" ${asset.preset === 'sp500' ? 'selected' : ''}>S&P 500 (US Equities ~11.8% 10-yr avg)</option>
          <option value="ftse_allworld" ${asset.preset === 'ftse_allworld' ? 'selected' : ''}>FTSE All-World (Global Equities ~8.8% 10-yr avg)</option>
          <option value="nasdaq100" ${asset.preset === 'nasdaq100' ? 'selected' : ''}>NASDAQ 100 (US Tech ~16.5% 10-yr avg)</option>
          <option value="ftse100" ${asset.preset === 'ftse100' ? 'selected' : ''}>FTSE 100 (UK Large Cap ~6.2% 10-yr avg)</option>
          <option value="uk_house" ${asset.preset === 'uk_house' ? 'selected' : ''}>UK Housing Index (~3.8% 10-yr avg)</option>
          <option value="uk_gilts" ${asset.preset === 'uk_gilts' ? 'selected' : ''}>UK Gilts / Bonds (~2.8% 10-yr avg)</option>
        </select>
      </div>

      <div class="form-group">
        <label>Starting Value / Principal (£)</label>
        <input type="number" data-field="principal" min="0" step="100" value="${asset.principal}" required>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Regular Contribution (£)</label>
          <input type="number" data-field="deposit" min="0" step="50" value="${asset.deposit}">
        </div>

        <div class="form-group">
          <label>Frequency</label>
          <select data-field="depositFreq">
            <option value="1" ${asset.depositFreq === 1 ? 'selected' : ''}>Annually</option>
            <option value="12" ${asset.depositFreq === 12 ? 'selected' : ''}>Monthly</option>
            <option value="26" ${asset.depositFreq === 26 ? 'selected' : ''}>Bi-Weekly</option>
            <option value="52" ${asset.depositFreq === 52 ? 'selected' : ''}>Weekly</option>
          </select>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Return Rate (%)</label>
          <input type="number" data-field="rate" min="-50" max="100" step="0.1" value="${asset.rate}" required>
        </div>

        <div class="form-group">
          <label>Compounding</label>
          <select data-field="compoundFreq">
            <option value="1" ${asset.compoundFreq === 1 ? 'selected' : ''}>Annually</option>
            <option value="2" ${asset.compoundFreq === 2 ? 'selected' : ''}>Semi-Annually</option>
            <option value="4" ${asset.compoundFreq === 4 ? 'selected' : ''}>Quarterly</option>
            <option value="12" ${asset.compoundFreq === 12 ? 'selected' : ''}>Monthly</option>
            <option value="365" ${asset.compoundFreq === 365 ? 'selected' : ''}>Daily</option>
          </select>
        </div>
      </div>
    `;

    // Bind event listeners for this card
    const nameInput = card.querySelector('[data-field="name"]');
    const presetSelect = card.querySelector('[data-field="preset"]');
    const principalInput = card.querySelector('[data-field="principal"]');
    const depositInput = card.querySelector('[data-field="deposit"]');
    const depositFreqSelect = card.querySelector('[data-field="depositFreq"]');
    const rateInput = card.querySelector('[data-field="rate"]');
    const compoundFreqSelect = card.querySelector('[data-field="compoundFreq"]');
    const removeBtn = card.querySelector('[data-action="remove-asset"]');

    nameInput.addEventListener('input', (e) => {
      asset.name = e.target.value;
      processCalculation();
    });

    presetSelect.addEventListener('change', (e) => {
      asset.preset = e.target.value;
      if (asset.preset !== 'custom' && INDEX_BENCHMARKS[asset.preset]) {
        asset.rate = INDEX_BENCHMARKS[asset.preset].rate;
        rateInput.value = asset.rate;
      }
      processCalculation();
    });

    rateInput.addEventListener('input', (e) => {
      asset.rate = parseFloat(e.target.value) || 0;
      asset.preset = 'custom';
      presetSelect.value = 'custom';
      processCalculation();
    });

    principalInput.addEventListener('input', (e) => {
      asset.principal = parseFloat(e.target.value) || 0;
      processCalculation();
    });

    depositInput.addEventListener('input', (e) => {
      asset.deposit = parseFloat(e.target.value) || 0;
      processCalculation();
    });

    depositFreqSelect.addEventListener('change', (e) => {
      asset.depositFreq = parseInt(e.target.value, 10);
      processCalculation();
    });

    compoundFreqSelect.addEventListener('change', (e) => {
      asset.compoundFreq = parseInt(e.target.value, 10);
      processCalculation();
    });

    if (removeBtn) {
      removeBtn.addEventListener('click', () => {
        removeAsset(asset.id);
      });
    }

    assetsContainer.appendChild(card);
  });
}

// Render Dynamic Debt Cards in Form
function renderDebtCards() {
  debtsContainer.innerHTML = '';

  if (debtsState.length === 0) {
    debtsContainer.innerHTML = `
      <div class="empty-placeholder">
        No active liabilities or loans. Click <strong>+ Add Debt</strong> to model mortgages, auto loans, or student debt.
      </div>
    `;
    return;
  }

  debtsState.forEach((debt, idx) => {
    const card = document.createElement('div');
    card.className = 'asset-card debt-card';
    card.dataset.debtId = debt.id;

    card.innerHTML = `
      <div class="asset-card-header">
        <span class="asset-badge debt-badge">Debt ${idx + 1}</span>
        <input type="text" class="asset-name-input" data-field="name" value="${debt.name}" placeholder="Debt Name">
        <button type="button" class="btn-remove-card" data-action="remove-debt" title="Remove Debt">✕</button>
      </div>

      <div class="form-group">
        <label>Loan Type</label>
        <select class="debt-preset-select" data-field="preset">
          <option value="custom" ${debt.preset === 'custom' ? 'selected' : ''}>Custom / Manual Values</option>
          <option value="mortgage" ${debt.preset === 'mortgage' ? 'selected' : ''}>Average UK Mortgage (25 yr, 4.5%)</option>
          <option value="car_finance" ${debt.preset === 'car_finance' ? 'selected' : ''}>Average Car Finance (4 yr, 8.9%)</option>
          <option value="personal_loan" ${debt.preset === 'personal_loan' ? 'selected' : ''}>Average Personal Loan (5 yr, 9.9%)</option>
          <option value="student_loan" ${debt.preset === 'student_loan' ? 'selected' : ''}>UK Student Loan Example (30 yr, 4.3%)</option>
          <option value="credit_card" ${debt.preset === 'credit_card' ? 'selected' : ''}>Average Credit Card Balance (3 yr, 24.9%)</option>
          <option value="payday_loan" ${debt.preset === 'payday_loan' ? 'selected' : ''}>Typical Payday Loan (1 yr, 99.9%)</option>
        </select>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Starting Balance (£)</label>
          <input type="number" data-field="principal" min="0" step="100" value="${debt.principal}">
        </div>

        <div class="form-group">
          <label>Interest Rate (%)</label>
          <input type="number" data-field="rate" min="0" max="999" step="0.1" value="${debt.rate}">
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Payoff Term (Years)</label>
          <input type="number" data-field="termYears" min="1" max="100" step="1" value="${debt.termYears}">
        </div>

        <div class="form-group">
          <label>Start Year</label>
          <input type="number" data-field="startYear" min="1" max="100" step="1" value="${debt.startYear}">
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Payment Frequency</label>
          <select data-field="paymentFreq">
            <option value="12" ${debt.paymentFreq === 12 ? 'selected' : ''}>Monthly</option>
            <option value="1" ${debt.paymentFreq === 1 ? 'selected' : ''}>Annually</option>
          </select>
        </div>

        <div class="form-group">
          <label>Repayment Plan</label>
          <select data-field="paymentModel">
            <option value="amortized" ${debt.paymentModel === 'amortized' ? 'selected' : ''}>Amortized (P+I)</option>
            <option value="interest_only" ${debt.paymentModel === 'interest_only' ? 'selected' : ''}>Interest-Only</option>
          </select>
        </div>
      </div>

      <div class="debt-calc-preview" id="preview_${debt.id}">
        <span>Annual Payment: <strong class="debt-annual-val">£0/yr</strong></span>
        <span>Total Interest: <strong class="debt-interest-val">£0</strong></span>
      </div>
    `;

    // Bind event listeners
    const nameInput = card.querySelector('[data-field="name"]');
    const presetSelect = card.querySelector('[data-field="preset"]');
    const principalInput = card.querySelector('[data-field="principal"]');
    const rateInput = card.querySelector('[data-field="rate"]');
    const termYearsInput = card.querySelector('[data-field="termYears"]');
    const startYearInput = card.querySelector('[data-field="startYear"]');
    const paymentFreqSelect = card.querySelector('[data-field="paymentFreq"]');
    const paymentModelSelect = card.querySelector('[data-field="paymentModel"]');
    const removeBtn = card.querySelector('[data-action="remove-debt"]');

    const setCustomPreset = () => {
      debt.preset = 'custom';
      presetSelect.value = 'custom';
    };

    presetSelect.addEventListener('change', (e) => {
      const preset = DEBT_PRESETS[e.target.value];
      debt.preset = e.target.value;

      if (e.target.value !== 'custom' && preset) {
        debt.name = preset.name;
        debt.principal = preset.principal;
        debt.rate = preset.rate;
        debt.termYears = preset.termYears;
        debt.paymentFreq = preset.paymentFreq;
        debt.paymentModel = preset.paymentModel;
        nameInput.value = debt.name;
        principalInput.value = debt.principal;
        rateInput.value = debt.rate;
        termYearsInput.value = debt.termYears;
        paymentFreqSelect.value = debt.paymentFreq;
        paymentModelSelect.value = debt.paymentModel;
      }

      processCalculation();
    });

    nameInput.addEventListener('input', (e) => {
      debt.name = e.target.value;
      setCustomPreset();
      processCalculation();
    });

    principalInput.addEventListener('input', (e) => {
      debt.principal = parseFloat(e.target.value) || 0;
      setCustomPreset();
      processCalculation();
    });

    rateInput.addEventListener('input', (e) => {
      debt.rate = parseFloat(e.target.value) || 0;
      setCustomPreset();
      processCalculation();
    });

    termYearsInput.addEventListener('input', (e) => {
      debt.termYears = parseInt(e.target.value, 10) || 1;
      setCustomPreset();
      processCalculation();
    });

    startYearInput.addEventListener('input', (e) => {
      debt.startYear = parseInt(e.target.value, 10) || 1;
      processCalculation();
    });

    paymentFreqSelect.addEventListener('change', (e) => {
      debt.paymentFreq = parseInt(e.target.value, 10);
      setCustomPreset();
      processCalculation();
    });

    paymentModelSelect.addEventListener('change', (e) => {
      debt.paymentModel = e.target.value;
      setCustomPreset();
      processCalculation();
    });

    removeBtn.addEventListener('click', () => {
      removeDebt(debt.id);
    });

    debtsContainer.appendChild(card);
  });
}

// Add New Asset
function addAsset() {
  const newId = `asset_${nextAssetId++}`;
  const idx = assetsState.length;
  assetsState.push({
    id: newId,
    name: `Asset ${idx + 1}`,
    preset: 'custom',
    principal: 5000,
    deposit: 100,
    depositFreq: 12,
    rate: 7.0,
    compoundFreq: 12
  });

  renderAssetCards();
  processCalculation();
}

// Remove Asset
function removeAsset(id) {
  if (assetsState.length <= 1) return;
  assetsState = assetsState.filter(a => a.id !== id);
  renderAssetCards();
  processCalculation();
}

// Add New Debt
function addDebt() {
  const newId = `debt_${nextDebtId++}`;
  const idx = debtsState.length;
  debtsState.push({
    id: newId,
    name: `Loan ${idx + 1}`,
    preset: 'custom',
    principal: 10000,
    rate: 3.0,
    termYears: 5,
    startYear: 1,
    paymentFreq: 12,
    paymentModel: 'amortized'
  });

  renderDebtCards();
  processCalculation();
}

// Remove Debt
function removeDebt(id) {
  debtsState = debtsState.filter(d => d.id !== id);
  renderDebtCards();
  processCalculation();
}

// Main Calculation Engine
function processCalculation() {
  const years = parseInt(investmentYearsInput.value, 10) || 1;
  const inflationRate = parseFloat(inflationRateInput.value) || 0;

  // 1. Calculate all assets
  const calculatedAssets = assetsState.map(asset => {
    const result = calculateCompoundInterest({
      principal: asset.principal,
      deposit: asset.deposit,
      depositFreq: asset.depositFreq,
      annualRate: asset.rate,
      compoundFreq: asset.compoundFreq,
      years: years,
      inflationRate: inflationRate
    });
    return { ...asset, ...result };
  });

  // 2. Calculate all debts
  const calculatedDebts = debtsState.map(debt => {
    const result = calculateDebtSchedule({
      principal: debt.principal,
      annualRate: debt.rate,
      termYears: debt.termYears,
      startYear: debt.startYear,
      paymentFreq: debt.paymentFreq,
      paymentModel: debt.paymentModel,
      totalYears: years
    });

    // Update inline debt preview if element exists
    const previewEl = document.getElementById(`preview_${debt.id}`);
    if (previewEl) {
      previewEl.querySelector('.debt-annual-val').textContent = `${formatCurrency(result.annualPayment)}/yr`;
      previewEl.querySelector('.debt-interest-val').textContent = formatCurrency(result.totalInterestPaid);
    }

    return { ...debt, ...result };
  });

  // 3. Compute Totals across all assets and debts
  const totalGrossFinalAssets = calculatedAssets.reduce((sum, a) => sum + a.finalBalance, 0);
  const totalInitialDebt = calculatedDebts.reduce((sum, d) => sum + d.principal, 0);
  const totalFinalDebt = calculatedDebts.reduce((sum, d) => sum + (d.schedule[years - 1] ? d.schedule[years - 1].endBalance : 0), 0);
  const totalNetWorth = totalGrossFinalAssets - totalFinalDebt;

  const totalCumulativeContributions = calculatedAssets.reduce((sum, a) => sum + a.totalContributions, 0);
  const totalInitialPrincipal = calculatedAssets.reduce((sum, a) => sum + a.principal, 0);
  const totalRegularAdded = totalCumulativeContributions - totalInitialPrincipal;

  const totalAssetInterest = calculatedAssets.reduce((sum, a) => sum + a.totalInterest, 0);
  const totalDebtInterestPaid = calculatedDebts.reduce((sum, d) => sum + d.totalInterestPaid, 0);
  const totalNetGrowth = totalAssetInterest - totalDebtInterestPaid;

  const realPurchasingPower = totalNetWorth / Math.pow(1 + (inflationRate / 100), years);

  // 4. Update Summary Cards
  lblCombinedValue.textContent = calculatedDebts.length > 0 ? 'Net Worth (Assets - Debt)' : 'Total Portfolio Value';
  resCombinedValue.textContent = formatCurrency(totalNetWorth);
  resInflationAdjusted.textContent = `Real Power: ${formatCurrency(realPurchasingPower)}`;

  resGrossAssets.textContent = formatCurrency(totalGrossFinalAssets);
  resGrossAssetsSub.textContent = `Across ${calculatedAssets.length} asset${calculatedAssets.length > 1 ? 's' : ''}`;

  if (calculatedDebts.length > 0) {
    cardDebtSummary.classList.remove('hidden');
    btnTabDebt.classList.remove('hidden');
    if (totalFinalDebt <= 0.01) {
      resDebtSummaryValue.textContent = formatCurrency(0);
      resDebtSummarySub.textContent = `Orig: ${formatCurrency(totalInitialDebt)} | Int Paid: ${formatCurrency(totalDebtInterestPaid)}`;
    } else {
      resDebtSummaryValue.textContent = `${formatCurrency(totalFinalDebt)} Remaining`;
      resDebtSummarySub.textContent = `Orig: ${formatCurrency(totalInitialDebt)} | Int Paid: ${formatCurrency(totalDebtInterestPaid)}`;
    }
  } else {
    cardDebtSummary.classList.add('hidden');
    btnTabDebt.classList.add('hidden');
    if (btnTabDebt.classList.contains('active')) {
      document.querySelector('[data-tab="tabCombined"]').click();
    }
  }

  resTotalContributions.textContent = formatCurrency(totalCumulativeContributions);
  resContributionsSub.textContent = `Initial: ${formatCurrency(totalInitialPrincipal)} | Added: ${formatCurrency(totalRegularAdded)}`;

  resTotalInterest.textContent = formatCurrency(totalNetGrowth);
  const netGrowthPct = totalNetWorth > 0 ? (totalNetGrowth / totalNetWorth) * 100 : 0;
  resInterestPercentage.textContent = `${netGrowthPct.toFixed(1)}% net growth`;

  // 5. Build Combined Annual Schedule Matrix
  const combinedSchedule = [];
  for (let y = 0; y < years; y++) {
    const yearNum = y + 1;
    let grossEnd = 0;
    let totalDebtEnd = 0;
    let contribThisYear = 0;
    let totalContrib = 0;
    let debtPaymentThisYear = 0;
    let cumulativeDebtInterest = 0;

    const assetYearBalances = {};
    calculatedAssets.forEach(a => {
      const s = a.schedule[y];
      assetYearBalances[a.id] = s.endBalance;
      grossEnd += s.endBalance;
      contribThisYear += s.contributionsThisYear;
      totalContrib += s.cumulativeContributions;
    });

    const debtYearBalances = {};
    calculatedDebts.forEach(d => {
      const s = d.schedule[y];
      debtYearBalances[d.id] = s.endBalance;
      totalDebtEnd += s.endBalance;
      debtPaymentThisYear += s.annualPayment;
      cumulativeDebtInterest += s.cumulativeInterestPaid;
    });

    const netWorth = grossEnd - totalDebtEnd;
    const netGrowth = (grossEnd - totalContrib) - cumulativeDebtInterest;
    const realVal = netWorth / Math.pow(1 + (inflationRate / 100), yearNum);

    combinedSchedule.push({
      year: yearNum,
      assetYearBalances,
      debtYearBalances,
      grossEnd,
      totalDebtEnd,
      netWorth,
      contribThisYear,
      totalContrib,
      debtPaymentThisYear,
      netGrowth,
      realVal
    });
  }

  currentScheduleExportData = { combinedSchedule, calculatedAssets, calculatedDebts };

  // 6. Update Visualizations & Tables
  renderCombinedChart(combinedSchedule, calculatedAssets, calculatedDebts);
  updateAssetSelectorDropdown(calculatedAssets);
  updateDebtSelectorDropdown(calculatedDebts);
  renderScheduleTable(combinedSchedule, calculatedAssets, calculatedDebts);

  // 7. Multi-rate comparison on Asset 1
  if (calculatedAssets.length > 0) {
    processMultiRateComparison({
      asset1: calculatedAssets[0],
      otherAssets: calculatedAssets.slice(1),
      debts: calculatedDebts,
      years,
      inflationRate
    });
  }

  saveCalculatorState();
}

// Render Combined Chart (Stacked Assets, Stacked Debts, Net Worth Line)
function renderCombinedChart(combinedSchedule, calculatedAssets, calculatedDebts) {
  const ctx = document.getElementById('combinedChart').getContext('2d');
  const labels = combinedSchedule.map(s => `Yr ${s.year}`);

  if (combinedChartInstance) {
    combinedChartInstance.destroy();
  }

  if (typeof Chart === 'undefined') return;

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const textColor = isDark ? '#94a3b8' : '#475569';
  const gridColor = isDark ? 'rgba(51, 65, 85, 0.4)' : 'rgba(226, 232, 240, 0.8)';

  const datasets = [];

  // Asset Stacked Bars
  calculatedAssets.forEach((asset, idx) => {
    const color = ASSET_COLORS[idx % ASSET_COLORS.length];
    datasets.push({
      type: 'bar',
      label: `${asset.name} Value`,
      data: combinedSchedule.map(s => s.assetYearBalances[asset.id]),
      backgroundColor: color.bg,
      borderColor: color.border,
      borderWidth: 1,
      stack: 'Assets'
    });
  });

  // Debt Stacked Bars
  calculatedDebts.forEach(debt => {
    datasets.push({
      type: 'bar',
      label: `${debt.name} Debt`,
      data: combinedSchedule.map(s => s.debtYearBalances[debt.id]),
      backgroundColor: 'rgba(239, 68, 68, 0.45)',
      borderColor: '#ef4444',
      borderWidth: 1,
      stack: 'Liabilities'
    });
  });

  // Net Worth Line Overlay
  datasets.push({
    type: 'line',
    label: calculatedDebts.length > 0 ? 'Net Worth (Assets - Debt)' : 'Total Net Worth',
    data: combinedSchedule.map(s => s.netWorth),
    borderColor: '#34d399',
    backgroundColor: '#34d399',
    borderWidth: 3,
    tension: 0.2,
    fill: false,
    pointRadius: 4,
    pointHoverRadius: 6
  });

  combinedChartInstance = new Chart(ctx, {
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${formatCurrency(ctx.raw)}`,
            footer: (items) => {
              const yrIdx = items[0].dataIndex;
              const row = combinedSchedule[yrIdx];
              return `Combined Net Worth: ${formatCurrency(row.netWorth)}`;
            }
          }
        },
        legend: { labels: { color: textColor } }
      },
      scales: {
        x: { grid: { color: gridColor }, ticks: { color: textColor } },
        y: {
          grid: { color: gridColor },
          ticks: {
            color: textColor,
            callback: value => formatCompactCurrency(value)
          }
        }
      }
    }
  });
}

// Update Asset Selector in Asset Breakdowns Tab
function updateAssetSelectorDropdown(calculatedAssets) {
  const currentSelected = assetSelector.value;
  assetSelector.innerHTML = '';

  calculatedAssets.forEach((asset, idx) => {
    const opt = document.createElement('option');
    opt.value = asset.id;
    opt.textContent = `${asset.name} (Asset ${idx + 1})`;
    assetSelector.appendChild(opt);
  });

  if (calculatedAssets.some(a => a.id === currentSelected)) {
    assetSelector.value = currentSelected;
  }

  const selectedAsset = calculatedAssets.find(a => a.id === assetSelector.value) || calculatedAssets[0];
  if (selectedAsset) {
    renderAssetBreakdownChart(selectedAsset);
  }
}

// Render Asset Breakdown Chart
function renderAssetBreakdownChart(asset) {
  const ctx = document.getElementById('assetBreakdownChart').getContext('2d');
  const labels = asset.schedule.map(s => `Yr ${s.year}`);

  const principalData = asset.schedule.map(() => asset.principal);
  const additionsData = asset.schedule.map(s => s.cumulativeContributions - asset.principal);
  const interestData = asset.schedule.map(s => s.cumulativeInterest);

  if (assetBreakdownChartInstance) {
    assetBreakdownChartInstance.destroy();
  }

  if (typeof Chart === 'undefined') return;

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const textColor = isDark ? '#94a3b8' : '#475569';
  const gridColor = isDark ? 'rgba(51, 65, 85, 0.4)' : 'rgba(226, 232, 240, 0.8)';

  assetBreakdownChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Initial Principal',
          data: principalData,
          backgroundColor: '#38bdf8',
          stack: 'AssetStack'
        },
        {
          label: 'Added Contributions',
          data: additionsData,
          backgroundColor: '#a78bfa',
          stack: 'AssetStack'
        },
        {
          label: 'Total Growth / Interest',
          data: interestData,
          backgroundColor: '#34d399',
          stack: 'AssetStack'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${formatCurrency(ctx.raw)}`,
            footer: (items) => {
              let total = 0;
              items.forEach(i => { total += i.raw; });
              return `Total ${asset.name} Value: ${formatCurrency(total)}`;
            }
          }
        },
        legend: { labels: { color: textColor } }
      },
      scales: {
        x: { stacked: true, grid: { color: gridColor }, ticks: { color: textColor } },
        y: {
          stacked: true,
          grid: { color: gridColor },
          ticks: {
            color: textColor,
            callback: value => formatCompactCurrency(value)
          }
        }
      }
    }
  });
}

// Update Debt Selector in Debt Breakdown Tab
function updateDebtSelectorDropdown(calculatedDebts) {
  if (calculatedDebts.length === 0) return;

  const currentSelected = debtSelector.value;
  debtSelector.innerHTML = '';

  calculatedDebts.forEach((debt, idx) => {
    const opt = document.createElement('option');
    opt.value = debt.id;
    opt.textContent = `${debt.name} (Debt ${idx + 1})`;
    debtSelector.appendChild(opt);
  });

  if (calculatedDebts.some(d => d.id === currentSelected)) {
    debtSelector.value = currentSelected;
  }

  const selectedDebt = calculatedDebts.find(d => d.id === debtSelector.value) || calculatedDebts[0];
  if (selectedDebt) {
    renderDebtBreakdownChart(selectedDebt);
  }
}

// Render Debt Payoff Chart & Table
function renderDebtBreakdownChart(debt) {
  const ctx = document.getElementById('debtChart').getContext('2d');
  const labels = debt.schedule.map(s => `Yr ${s.year}`);

  if (debtChartInstance) {
    debtChartInstance.destroy();
  }

  if (typeof Chart === 'undefined') return;

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const textColor = isDark ? '#94a3b8' : '#475569';
  const gridColor = isDark ? 'rgba(51, 65, 85, 0.4)' : 'rgba(226, 232, 240, 0.8)';

  debtChartInstance = new Chart(ctx, {
    data: {
      labels: labels,
      datasets: [
        {
          type: 'bar',
          label: 'Principal Paid',
          data: debt.schedule.map(s => s.principalPaid),
          backgroundColor: '#38bdf8',
          stack: 'DebtPayments'
        },
        {
          type: 'bar',
          label: 'Interest Paid',
          data: debt.schedule.map(s => s.interestPaid),
          backgroundColor: '#f87171',
          stack: 'DebtPayments'
        },
        {
          type: 'line',
          label: 'Remaining Balance',
          data: debt.schedule.map(s => s.endBalance),
          borderColor: '#ef4444',
          backgroundColor: '#ef4444',
          borderWidth: 3,
          tension: 0.1,
          pointRadius: 4,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${formatCurrency(ctx.raw)}`
          }
        },
        legend: { labels: { color: textColor } }
      },
      scales: {
        x: { grid: { color: gridColor }, ticks: { color: textColor } },
        y: {
          grid: { color: gridColor },
          ticks: {
            color: textColor,
            callback: value => formatCompactCurrency(value)
          }
        }
      }
    }
  });

  // Render Debt Table
  const tbody = document.querySelector('#debtTable tbody');
  tbody.innerHTML = '';
  debt.schedule.forEach(row => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>Year ${row.year}</td>
      <td>${formatCurrency(row.startBalance)}</td>
      <td>${formatCurrency(row.annualPayment)}</td>
      <td>${formatCurrency(row.principalPaid)}</td>
      <td style="color: #f87171;">${formatCurrency(row.interestPaid)}</td>
      <td><strong>${formatCurrency(row.endBalance)}</strong></td>
    `;
    tbody.appendChild(tr);
  });
}

// Multi-Rate Comparison for Asset 1
function processMultiRateComparison({ asset1, otherAssets, debts, years, inflationRate }) {
  const ratesStr = comparisonRatesInput.value;
  let parsedRates = ratesStr
    .split(',')
    .map(r => parseFloat(r.trim()))
    .filter(r => !isNaN(r) && r >= -50 && r <= 100);

  const baseRate = asset1.rate;
  if (!parsedRates.includes(baseRate)) {
    parsedRates.push(baseRate);
  }
  parsedRates.sort((a, b) => a - b);

  const otherAssetsFinalSum = otherAssets.reduce((sum, a) => sum + a.finalBalance, 0);
  const debtsFinalSum = debts.reduce((sum, d) => sum + (d.schedule[years - 1] ? d.schedule[years - 1].endBalance : 0), 0);

  const scenarioResults = parsedRates.map(rate => {
    const res1 = calculateCompoundInterest({
      principal: asset1.principal,
      deposit: asset1.deposit,
      depositFreq: asset1.depositFreq,
      annualRate: rate,
      compoundFreq: asset1.compoundFreq,
      years: years,
      inflationRate: inflationRate
    });
    const netFinal = res1.finalBalance + otherAssetsFinalSum - debtsFinalSum;
    return { rate, res1, netFinal };
  });

  // Render Table
  const tbody = document.querySelector('#comparisonTable tbody');
  tbody.innerHTML = '';

  const baseScenario = scenarioResults.find(s => s.rate === baseRate);

  scenarioResults.forEach(({ rate, res1, netFinal }) => {
    const diff = netFinal - (baseScenario ? baseScenario.netFinal : 0);
    const diffFormatted = (diff >= 0 ? '+' : '') + formatCurrency(diff);
    const tr = document.createElement('tr');
    if (rate === baseRate) {
      tr.style.fontWeight = 'bold';
      tr.style.backgroundColor = 'rgba(56, 189, 248, 0.08)';
    }

    tr.innerHTML = `
      <td>${formatPercent(rate)} ${rate === baseRate ? '(Base)' : ''}</td>
      <td>${formatCurrency(res1.totalContributions)}</td>
      <td>${formatCurrency(res1.finalBalance)}</td>
      <td><strong>${formatCurrency(netFinal)}</strong></td>
      <td style="color: ${diff >= 0 ? '#34d399' : '#f87171'}">${diffFormatted}</td>
    `;
    tbody.appendChild(tr);
  });

  // Render Comparison Chart
  renderComparisonChart(scenarioResults, years, baseRate);
}

// Render Comparison Chart
function renderComparisonChart(scenarioResults, years, baseRate) {
  const ctx = document.getElementById('comparisonChart').getContext('2d');

  if (comparisonChartInstance) {
    comparisonChartInstance.destroy();
  }

  if (typeof Chart === 'undefined') return;

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const textColor = isDark ? '#94a3b8' : '#475569';
  const gridColor = isDark ? 'rgba(51, 65, 85, 0.4)' : 'rgba(226, 232, 240, 0.8)';

  const colors = ['#38bdf8', '#34d399', '#a78bfa', '#fbbf24', '#f87171', '#e879f9', '#818cf8'];
  const labels = Array.from({ length: years }, (_, i) => `Yr ${i + 1}`);

  const datasets = scenarioResults.map(({ rate, res1 }, idx) => {
    const isBase = rate === baseRate;
    const color = colors[idx % colors.length];

    return {
      label: `Asset 1 @ ${rate}%`,
      data: res1.schedule.map(s => s.endBalance),
      borderColor: color,
      backgroundColor: color,
      borderWidth: isBase ? 3 : 2,
      borderDash: isBase ? [] : [4, 4],
      fill: false,
      tension: 0.2
    };
  });

  comparisonChartInstance = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${formatCurrency(ctx.raw)}`
          }
        },
        legend: { labels: { color: textColor } }
      },
      scales: {
        x: { grid: { color: gridColor }, ticks: { color: textColor } },
        y: {
          grid: { color: gridColor },
          ticks: {
            color: textColor,
            callback: value => formatCompactCurrency(value)
          }
        }
      }
    }
  });
}

// Render Annual Schedule Table
function renderScheduleTable(combinedSchedule, calculatedAssets, calculatedDebts) {
  const headerRow = document.getElementById('scheduleTableHeader');
  
  let headerHTML = '<th>Year</th>';
  calculatedAssets.forEach(a => {
    headerHTML += `<th>${a.name}</th>`;
  });
  if (calculatedAssets.length > 1) {
    headerHTML += `<th>Total Gross Assets</th>`;
  }
  calculatedDebts.forEach(d => {
    headerHTML += `<th>${d.name}</th>`;
  });
  if (calculatedDebts.length > 1) {
    headerHTML += `<th>Total Liabilities</th>`;
  }
  headerHTML += `
    <th>Net Worth</th>
    <th>Annual Added</th>
    ${calculatedDebts.length > 0 ? '<th>Annual Debt Service</th>' : ''}
    <th>Net Growth</th>
  `;

  headerRow.innerHTML = headerHTML;

  const tbody = document.querySelector('#scheduleTable tbody');
  tbody.innerHTML = '';

  combinedSchedule.forEach(row => {
    const tr = document.createElement('tr');
    let rowHTML = `<td>Year ${row.year}</td>`;

    calculatedAssets.forEach(a => {
      rowHTML += `<td>${formatCurrency(row.assetYearBalances[a.id])}</td>`;
    });
    if (calculatedAssets.length > 1) {
      rowHTML += `<td>${formatCurrency(row.grossEnd)}</td>`;
    }

    calculatedDebts.forEach(d => {
      rowHTML += `<td style="color: #f87171;">${formatCurrency(row.debtYearBalances[d.id])}</td>`;
    });
    if (calculatedDebts.length > 1) {
      rowHTML += `<td style="color: #f87171;">${formatCurrency(row.totalDebtEnd)}</td>`;
    }

    rowHTML += `
      <td><strong>${formatCurrency(row.netWorth)}</strong></td>
      <td>${formatCurrency(row.contribThisYear)}</td>
      ${calculatedDebts.length > 0 ? `<td>${formatCurrency(row.debtPaymentThisYear)}</td>` : ''}
      <td>${formatCurrency(row.netGrowth)}</td>
    `;

    tr.innerHTML = rowHTML;
    tbody.appendChild(tr);
  });
}

// Export Dynamic Schedule to CSV
function exportScheduleToCSV() {
  if (!currentScheduleExportData || !currentScheduleExportData.combinedSchedule) return;

  const { combinedSchedule, calculatedAssets, calculatedDebts } = currentScheduleExportData;

  const headers = ['Year'];
  calculatedAssets.forEach(a => headers.push(`"${a.name} Ending"`));
  if (calculatedAssets.length > 1) headers.push('"Total Gross Assets"');

  calculatedDebts.forEach(d => headers.push(`"${d.name} Remaining"`));
  if (calculatedDebts.length > 1) headers.push('"Total Liabilities"');

  headers.push('"Net Worth"', '"Annual Contributions Added"', '"Cumulative Contributions"');
  if (calculatedDebts.length > 0) headers.push('"Annual Debt Payments"');
  headers.push('"Total Net Growth"', '"Inflation Adjusted Value"');

  const rows = combinedSchedule.map(s => {
    const r = [s.year];
    calculatedAssets.forEach(a => r.push((s.assetYearBalances[a.id] || 0).toFixed(2)));
    if (calculatedAssets.length > 1) r.push(s.grossEnd.toFixed(2));

    calculatedDebts.forEach(d => r.push((s.debtYearBalances[d.id] || 0).toFixed(2)));
    if (calculatedDebts.length > 1) r.push(s.totalDebtEnd.toFixed(2));

    r.push(s.netWorth.toFixed(2), s.contribThisYear.toFixed(2), s.totalContrib.toFixed(2));
    if (calculatedDebts.length > 0) r.push(s.debtPaymentThisYear.toFixed(2));
    r.push(s.netGrowth.toFixed(2), s.realVal.toFixed(2));
    return r;
  });

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `portfolio_compound_schedule.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Setup Tabs Navigation
function setupTabs() {
  const tabBtns = document.querySelectorAll('.tab-header .tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');

      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const targetEl = document.getElementById(targetTab);
      if (targetEl) targetEl.classList.add('active');
    });
  });

  assetSelector.addEventListener('change', () => {
    const { calculatedAssets } = currentScheduleExportData;
    if (calculatedAssets) {
      const selectedAsset = calculatedAssets.find(a => a.id === assetSelector.value);
      if (selectedAsset) renderAssetBreakdownChart(selectedAsset);
    }
  });

  debtSelector.addEventListener('change', () => {
    const { calculatedDebts } = currentScheduleExportData;
    if (calculatedDebts) {
      const selectedDebt = calculatedDebts.find(d => d.id === debtSelector.value);
      if (selectedDebt) renderDebtBreakdownChart(selectedDebt);
    }
  });
}

// Setup Theme Toggle
function setupThemeToggle() {
  themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    themeToggle.querySelector('.theme-icon').textContent = newTheme === 'dark' ? '🌙' : '☀️';

    // Re-render
    processCalculation();
  });
}

// Init Application
function init() {
  btnCalculate.addEventListener('click', processCalculation);

  investmentYearsInput.addEventListener('input', processCalculation);
  inflationRateInput.addEventListener('input', processCalculation);
  comparisonRatesInput.addEventListener('input', processCalculation);

  btnAddAsset.addEventListener('click', addAsset);
  btnAddDebt.addEventListener('click', addDebt);

  btnReset.addEventListener('click', () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      // The default reset still works when browser storage is unavailable.
    }

    assetsState = [
      {
        id: 'asset_1',
        name: 'Finances & Investments',
        preset: 'sp500',
        principal: 10000,
        deposit: 100,
        depositFreq: 1,
        rate: 11.8,
        compoundFreq: 12
      },
      {
        id: 'asset_2',
        name: 'House & Real Estate',
        preset: 'uk_house',
        principal: 300000,
        deposit: 100,
        depositFreq: 1,
        rate: 3.8,
        compoundFreq: 1
      }
    ];

    debtsState = [
      {
        id: 'debt_1',
        name: 'Fixed Loan / Mortgage',
        principal: 10000,
        rate: 2.5,
        termYears: 5,
        startYear: 1,
        paymentFreq: 12,
        paymentModel: 'amortized'
      }
    ];

    investmentYearsInput.value = 20;
    inflationRateInput.value = 2.5;
    comparisonRatesInput.value = '4, 6, 8, 10, 12';

    renderAssetCards();
    renderDebtCards();
    processCalculation();
  });

  btnExportCSV.addEventListener('click', exportScheduleToCSV);

  setupTabs();
  setupThemeToggle();

  restoreCalculatorState();

  // Render initial or restored cards and calculate
  renderAssetCards();
  renderDebtCards();
  processCalculation();
}

// Robust execution whether DOM is already loaded or still loading
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}


