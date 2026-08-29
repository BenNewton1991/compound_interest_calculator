/**
 * Ad-Free Local Compound Interest & Portfolio Calculator
 * Features: Dual compounding assets (e.g. House + Investment Portfolio),
 * combined net worth growth, rate scenario analysis, annual schedule, and CSV exporter.
 */

// Global Chart Instances
let combinedChartInstance = null;
let asset1ChartInstance = null;
let asset2ChartInstance = null;
let comparisonChartInstance = null;

// Export Data Cache
let currentScheduleExportData = [];

// DOM Elements - Global Settings
const form = document.getElementById('calculatorForm');
const investmentYearsInput = document.getElementById('investmentYears');
const inflationRateInput = document.getElementById('inflationRate');

// DOM Elements - Asset 1
const asset1NameInput = document.getElementById('asset1Name');
const initialPrincipal1Input = document.getElementById('initialPrincipal1');
const recurringDeposit1Input = document.getElementById('recurringDeposit1');
const depositFrequency1Select = document.getElementById('depositFrequency1');
const interestRate1Input = document.getElementById('interestRate1');
const compoundFrequency1Select = document.getElementById('compoundFrequency1');

// DOM Elements - Asset 2
const enableAsset2Checkbox = document.getElementById('enableAsset2');
const asset2Panel = document.getElementById('asset2Panel');
const cardAsset2Summary = document.getElementById('cardAsset2Summary');
const btnTabAsset2 = document.getElementById('btnTabAsset2');
const asset2NameInput = document.getElementById('asset2Name');
const initialPrincipal2Input = document.getElementById('initialPrincipal2');
const recurringDeposit2Input = document.getElementById('recurringDeposit2');
const depositFrequency2Select = document.getElementById('depositFrequency2');
const interestRate2Input = document.getElementById('interestRate2');
const compoundFrequency2Select = document.getElementById('compoundFrequency2');

// DOM Elements - Scenarios
const comparisonRatesInput = document.getElementById('comparisonRates');

// Results Cards DOM
const lblCombinedValue = document.getElementById('lblCombinedValue');
const resCombinedValue = document.getElementById('resCombinedValue');
const resInflationAdjusted = document.getElementById('resInflationAdjusted');

const lblAsset1Value = document.getElementById('lblAsset1Value');
const resAsset1Value = document.getElementById('resAsset1Value');
const resAsset1Sub = document.getElementById('resAsset1Sub');

const lblAsset2Value = document.getElementById('lblAsset2Value');
const resAsset2Value = document.getElementById('resAsset2Value');
const resAsset2Sub = document.getElementById('resAsset2Sub');

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
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(amount || 0);
}

function formatPercent(value) {
  return `${(value || 0).toFixed(1)}%`;
}

// Calculate Compound Interest Schedule for a single asset
function calculateCompoundInterest({
  principal,
  deposit,
  depositFreq, // e.g. 12 (monthly), 1 (annually)
  annualRate,  // percentage
  compoundFreq, // e.g. 12 (monthly), 1 (annually), 365 (daily)
  years,
  inflationRate
}) {
  const r = annualRate / 100;
  const n = compoundFreq;
  const m = depositFreq;
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
      // Compound & deposit at end of period
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

// Perform and Render Main Calculations
function processCalculation() {
  const years = parseInt(investmentYearsInput.value, 10) || 1;
  const inflationRate = parseFloat(inflationRateInput.value) || 0;

  // Asset 1
  const asset1Name = asset1NameInput.value.trim() || 'Asset 1';
  const principal1 = parseFloat(initialPrincipal1Input.value) || 0;
  const deposit1 = parseFloat(recurringDeposit1Input.value) || 0;
  const depositFreq1 = parseInt(depositFrequency1Select.value, 10);
  const rate1 = parseFloat(interestRate1Input.value) || 0;
  const compoundFreq1 = parseInt(compoundFrequency1Select.value, 10);

  const res1 = calculateCompoundInterest({
    principal: principal1,
    deposit: deposit1,
    depositFreq: depositFreq1,
    annualRate: rate1,
    compoundFreq: compoundFreq1,
    years: years,
    inflationRate: inflationRate
  });

  // Asset 2
  const isAsset2Enabled = enableAsset2Checkbox.checked;
  let res2 = null;
  const asset2Name = asset2NameInput.value.trim() || 'Asset 2';

  if (isAsset2Enabled) {
    asset2Panel.classList.remove('hidden');
    cardAsset2Summary.classList.remove('hidden');
    btnTabAsset2.classList.remove('hidden');

    const principal2 = parseFloat(initialPrincipal2Input.value) || 0;
    const deposit2 = parseFloat(recurringDeposit2Input.value) || 0;
    const depositFreq2 = parseInt(depositFrequency2Select.value, 10);
    const rate2 = parseFloat(interestRate2Input.value) || 0;
    const compoundFreq2 = parseInt(compoundFrequency2Select.value, 10);

    res2 = calculateCompoundInterest({
      principal: principal2,
      deposit: deposit2,
      depositFreq: depositFreq2,
      annualRate: rate2,
      compoundFreq: compoundFreq2,
      years: years,
      inflationRate: inflationRate
    });
  } else {
    asset2Panel.classList.add('hidden');
    cardAsset2Summary.classList.add('hidden');
    btnTabAsset2.classList.add('hidden');

    // If Asset 2 tab is active, switch to Combined tab
    if (btnTabAsset2.classList.contains('active')) {
      document.querySelector('[data-tab="tabCombined"]').click();
    }
  }

  // Combined Totals
  const combinedFinalBalance = res1.finalBalance + (res2 ? res2.finalBalance : 0);
  const combinedContributions = res1.totalContributions + (res2 ? res2.totalContributions : 0);
  const combinedInterest = res1.totalInterest + (res2 ? res2.totalInterest : 0);
  const combinedRealValue = combinedFinalBalance / Math.pow(1 + (inflationRate / 100), years);

  // Update Summary Cards
  lblCombinedValue.textContent = isAsset2Enabled ? 'Combined Total Net Worth' : 'Future Value';
  resCombinedValue.textContent = formatCurrency(combinedFinalBalance);
  resInflationAdjusted.textContent = `Real Power: ${formatCurrency(combinedRealValue)}`;

  lblAsset1Value.textContent = `${asset1Name} Final Value`;
  resAsset1Value.textContent = formatCurrency(res1.finalBalance);
  resAsset1Sub.textContent = `Growth/Interest: ${formatCurrency(res1.totalInterest)}`;

  if (res2) {
    lblAsset2Value.textContent = `${asset2Name} Final Value`;
    resAsset2Value.textContent = formatCurrency(res2.finalBalance);
    resAsset2Sub.textContent = `Growth/Interest: ${formatCurrency(res2.totalInterest)}`;
  }

  resTotalContributions.textContent = formatCurrency(combinedContributions);
  const totalPrincipal = principal1 + (res2 ? parseFloat(initialPrincipal2Input.value) || 0 : 0);
  resContributionsSub.textContent = `Initial: ${formatCurrency(totalPrincipal)} | Added: ${formatCurrency(combinedContributions - totalPrincipal)}`;

  resTotalInterest.textContent = formatCurrency(combinedInterest);
  const growthPct = (combinedInterest / combinedFinalBalance) * 100 || 0;
  resInterestPercentage.textContent = `${growthPct.toFixed(1)}% of total net worth`;

  // Combined Schedule Data Preparation
  const combinedSchedule = [];
  for (let i = 0; i < years; i++) {
    const r1 = res1.schedule[i];
    const r2 = res2 ? res2.schedule[i] : null;

    const end1 = r1.endBalance;
    const end2 = r2 ? r2.endBalance : 0;
    const combEnd = end1 + end2;

    const contribThisYear = r1.contributionsThisYear + (r2 ? r2.contributionsThisYear : 0);
    const totalContrib = r1.cumulativeContributions + (r2 ? r2.cumulativeContributions : 0);
    const totalGrowth = combEnd - totalContrib;
    const realVal = combEnd / Math.pow(1 + (inflationRate / 100), i + 1);

    combinedSchedule.push({
      year: i + 1,
      end1,
      end2,
      combEnd,
      contribThisYear,
      totalContrib,
      totalGrowth,
      realVal
    });
  }

  currentScheduleExportData = combinedSchedule;

  // Render Charts & Tables
  renderCombinedChart(combinedSchedule, asset1Name, asset2Name, isAsset2Enabled);
  renderAssetBreakdownChart('asset1Chart', asset1ChartInstance, res1.schedule, principal1, asset1Name, (inst) => { asset1ChartInstance = inst; });
  
  if (isAsset2Enabled && res2) {
    const principal2 = parseFloat(initialPrincipal2Input.value) || 0;
    renderAssetBreakdownChart('asset2Chart', asset2ChartInstance, res2.schedule, principal2, asset2Name, (inst) => { asset2ChartInstance = inst; });
  }

  renderScheduleTable(combinedSchedule, asset1Name, asset2Name, isAsset2Enabled);

  // Rate Scenarios Comparison for Asset 1
  processMultiRateComparison({
    principal: principal1,
    deposit: deposit1,
    depositFreq: depositFreq1,
    compoundFreq: compoundFreq1,
    years: years,
    inflationRate: inflationRate,
    baseRate: rate1,
    res2: res2
  });
}

// Render Combined Growth Chart
function renderCombinedChart(combinedSchedule, name1, name2, isAsset2Enabled) {
  const ctx = document.getElementById('combinedChart').getContext('2d');
  const labels = combinedSchedule.map(s => `Yr ${s.year}`);

  if (combinedChartInstance) {
    combinedChartInstance.destroy();
  }

  if (typeof Chart === 'undefined') return;

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const textColor = isDark ? '#94a3b8' : '#475569';
  const gridColor = isDark ? 'rgba(51, 65, 85, 0.4)' : 'rgba(226, 232, 240, 0.8)';

  const datasets = [
    {
      label: `${name1} Value`,
      data: combinedSchedule.map(s => s.end1),
      backgroundColor: '#38bdf8',
      borderColor: '#0284c7',
      borderWidth: 1,
      stack: 'NetWorth'
    }
  ];

  if (isAsset2Enabled) {
    datasets.push({
      label: `${name2} Value`,
      data: combinedSchedule.map(s => s.end2),
      backgroundColor: '#a78bfa',
      borderColor: '#7c3aed',
      borderWidth: 1,
      stack: 'NetWorth'
    });
  }

  combinedChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            label: function(context) {
              return `${context.dataset.label}: ${formatCurrency(context.raw)}`;
            },
            footer: function(tooltipItems) {
              let total = 0;
              tooltipItems.forEach(item => { total += item.raw; });
              return `Total Combined Net Worth: ${formatCurrency(total)}`;
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
            callback: value => '$' + (value >= 1000 ? (value / 1000) + 'k' : value)
          }
        }
      }
    }
  });
}

// Render Individual Asset Breakdown Chart (Stacked Principal, Contributions, Interest)
function renderAssetBreakdownChart(canvasId, chartInstance, schedule, initialPrincipal, assetName, setInstanceCb) {
  const ctx = document.getElementById(canvasId).getContext('2d');
  const labels = schedule.map(s => `Yr ${s.year}`);

  const principalData = schedule.map(() => initialPrincipal);
  const additionsData = schedule.map(s => s.cumulativeContributions - initialPrincipal);
  const interestData = schedule.map(s => s.cumulativeInterest);

  if (chartInstance) {
    chartInstance.destroy();
  }

  if (typeof Chart === 'undefined') return;

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const textColor = isDark ? '#94a3b8' : '#475569';
  const gridColor = isDark ? 'rgba(51, 65, 85, 0.4)' : 'rgba(226, 232, 240, 0.8)';

  const newChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: `${assetName} Initial Principal`,
          data: principalData,
          backgroundColor: '#38bdf8',
          stack: 'AssetStack'
        },
        {
          label: 'Total Added Contributions',
          data: additionsData,
          backgroundColor: '#a78bfa',
          stack: 'AssetStack'
        },
        {
          label: 'Total Interest/Appreciation',
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
            label: function(context) {
              return `${context.dataset.label}: ${formatCurrency(context.raw)}`;
            },
            footer: function(tooltipItems) {
              let total = 0;
              tooltipItems.forEach(item => { total += item.raw; });
              return `Total ${assetName} Value: ${formatCurrency(total)}`;
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
            callback: value => '$' + (value >= 1000 ? (value / 1000) + 'k' : value)
          }
        }
      }
    }
  });

  setInstanceCb(newChart);
}

// Multi-Rate Comparison for Asset 1
function processMultiRateComparison({
  principal,
  deposit,
  depositFreq,
  compoundFreq,
  years,
  inflationRate,
  baseRate,
  res2
}) {
  const ratesStr = comparisonRatesInput.value;
  let parsedRates = ratesStr
    .split(',')
    .map(r => parseFloat(r.trim()))
    .filter(r => !isNaN(r) && r >= -50 && r <= 100);

  if (!parsedRates.includes(baseRate)) {
    parsedRates.push(baseRate);
  }
  parsedRates.sort((a, b) => a - b);

  const scenarioResults = parsedRates.map(rate => {
    const res1 = calculateCompoundInterest({
      principal,
      deposit,
      depositFreq,
      annualRate: rate,
      compoundFreq,
      years,
      inflationRate
    });
    const asset2Final = res2 ? res2.finalBalance : 0;
    return { rate, res1, combinedFinal: res1.finalBalance + asset2Final };
  });

  // Render Table
  const tbody = document.querySelector('#comparisonTable tbody');
  tbody.innerHTML = '';

  const baseScenario = scenarioResults.find(s => s.rate === baseRate);

  scenarioResults.forEach(({ rate, res1, combinedFinal }) => {
    const diff = combinedFinal - (baseScenario ? baseScenario.combinedFinal : 0);
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
      <td><strong>${formatCurrency(combinedFinal)}</strong></td>
      <td style="color: ${diff >= 0 ? '#34d399' : '#f87171'}">${diffFormatted}</td>
    `;
    tbody.appendChild(tr);
  });

  // Render Chart
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

  const datasets = scenarioResults.map(({ rate, res1, combinedFinal }, idx) => {
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
            callback: value => '$' + (value >= 1000 ? (value / 1000) + 'k' : value)
          }
        }
      }
    }
  });
}

// Render Schedule Table
function renderScheduleTable(schedule, name1, name2, isAsset2Enabled) {
  const headerRow = document.getElementById('scheduleTableHeader');
  headerRow.innerHTML = `
    <th>Year</th>
    <th>${name1} End</th>
    ${isAsset2Enabled ? `<th>${name2} End</th>` : ''}
    <th>Combined Net Worth</th>
    <th>Annual Added</th>
    <th>Total Interest/Growth</th>
  `;

  const tbody = document.querySelector('#scheduleTable tbody');
  tbody.innerHTML = '';

  schedule.forEach(row => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>Year ${row.year}</td>
      <td>${formatCurrency(row.end1)}</td>
      ${isAsset2Enabled ? `<td>${formatCurrency(row.end2)}</td>` : ''}
      <td><strong>${formatCurrency(row.combEnd)}</strong></td>
      <td>${formatCurrency(row.contribThisYear)}</td>
      <td>${formatCurrency(row.totalGrowth)}</td>
    `;
    tbody.appendChild(tr);
  });
}

// Export CSV
function exportScheduleToCSV() {
  if (!currentScheduleExportData || currentScheduleExportData.length === 0) return;

  const isAsset2Enabled = enableAsset2Checkbox.checked;
  const name1 = asset1NameInput.value.trim() || 'Asset 1';
  const name2 = asset2NameInput.value.trim() || 'Asset 2';

  const headers = ['Year', `${name1} Ending`];
  if (isAsset2Enabled) headers.push(`${name2} Ending`);
  headers.push('Combined Net Worth', 'Annual Contributions Added', 'Cumulative Contributions', 'Total Growth/Interest', 'Inflation Adjusted Value');

  const rows = currentScheduleExportData.map(s => {
    const r = [s.year, s.end1.toFixed(2)];
    if (isAsset2Enabled) r.push(s.end2.toFixed(2));
    r.push(
      s.combEnd.toFixed(2),
      s.contribThisYear.toFixed(2),
      s.totalContrib.toFixed(2),
      s.totalGrowth.toFixed(2),
      s.realVal.toFixed(2)
    );
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
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');

      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      document.getElementById(targetTab).classList.add('active');
    });
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

  // Input listener for live update
  const inputs = form.querySelectorAll('input, select');
  inputs.forEach(input => {
    input.addEventListener('input', () => {
      processCalculation();
    });
  });

  enableAsset2Checkbox.addEventListener('change', () => {
    processCalculation();
  });

  btnReset.addEventListener('click', () => {
    form.reset();
    enableAsset2Checkbox.checked = true;
    processCalculation();
  });

  btnExportCSV.addEventListener('click', exportScheduleToCSV);

  setupTabs();
  setupThemeToggle();

  // Initial calculation
  processCalculation();
}

document.addEventListener('DOMContentLoaded', init);
