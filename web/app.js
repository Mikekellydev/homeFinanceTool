document.addEventListener("DOMContentLoaded", () => {
  const year = document.querySelector("[data-year]");
  if (year) {
    year.textContent = String(new Date().getFullYear());
  }

  const planner = document.querySelector("[data-planner]");
  const resultNet = document.querySelector("[data-result-net]");
  const resultIncome = document.querySelector("[data-result-income]");
  const resultAverage = document.querySelector("[data-result-average]");
  const transactionForm = document.querySelector("[data-transaction-form]");
  const transactionList = document.querySelector("[data-transaction-list]");
  const accountForm = document.querySelector("[data-account-form]");
  const accountsList = document.querySelector("[data-accounts-list]");
  const register = document.querySelector("[data-register]");
  const fileInput = document.querySelector("#import-file-input");
  const fileTriggers = Array.from(
    document.querySelectorAll("[data-file-trigger]")
  );
  const fileStatus = document.querySelector("[data-file-status]");
  const importAccountSelect = document.querySelector("[data-import-account]");
  const dashboardAccounts = document.querySelector("[data-dashboard-accounts]");
  const reportGrid = document.querySelector("[data-report-grid]");
  const reportTable = document.querySelector("[data-report-table]");
  const reportPill = document.querySelector("[data-report-pill]");
  const reportStatus = document.querySelector("[data-report-status]");
  const reportExportType = document.querySelector("[data-report-export-type]");
  const reportExportButton = document.querySelector("[data-report-export]");

  const STORAGE_KEY = "home-finances-transactions";
  const ACCOUNT_KEY = "home-finances-accounts";
  const REPORT_KEY = "home-finances-reports";

  const createId = () => {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  };

  const downloadBlob = (content, filename, type) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);

  const formatCurrencyExact = (value) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);

  const parseIsoDate = (value) => {
    if (!value) {
      return null;
    }
    const parsed = new Date(`${value}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const readTransactions = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  };

  const saveTransactions = (transactions) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    } catch (error) {
      // Ignore write errors (private mode or storage disabled).
    }
  };

  const readAccounts = () => {
    try {
      const stored = localStorage.getItem(ACCOUNT_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  };

  const saveAccounts = (accountsList) => {
    try {
      localStorage.setItem(ACCOUNT_KEY, JSON.stringify(accountsList));
    } catch (error) {
      // Ignore write errors (private mode or storage disabled).
    }
  };

  const readReports = () => {
    try {
      const stored = localStorage.getItem(REPORT_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  };

  const saveReports = (items) => {
    try {
      localStorage.setItem(REPORT_KEY, JSON.stringify(items));
    } catch (error) {
      // Ignore write errors (private mode or storage disabled).
    }
  };

  const normalizeAccounts = (items) => {
    let didChange = false;
    const seenIds = new Set();
    const normalized = items
      .map((account) => {
        if (!account || typeof account !== "object") {
          didChange = true;
          return null;
        }

        let id = account.id;
        if (!id || seenIds.has(id)) {
          id = createId();
          didChange = true;
        }
        seenIds.add(id);

        if (id === account.id) {
          return account;
        }

        return {
          ...account,
          id,
        };
      })
      .filter(Boolean);

    if (didChange) {
      saveAccounts(normalized);
    }

    return normalized;
  };

  let accounts = normalizeAccounts(readAccounts());
  let transactions = readTransactions();
  let registerState = null;
  let reports = readReports();

  const updateDashboard = () => {
    const netValue = document.querySelector("[data-dashboard-net]");
    if (!netValue) {
      return;
    }

    const netTrend = document.querySelector("[data-dashboard-net-trend]");
    const totalValue = document.querySelector("[data-dashboard-total]");
    const totalTrend = document.querySelector("[data-dashboard-total-trend]");
    const budgetValue = document.querySelector("[data-dashboard-budget]");
    const budgetTrend = document.querySelector("[data-dashboard-budget-trend]");
    const billsValue = document.querySelector("[data-dashboard-bills]");
    const billsTrend = document.querySelector("[data-dashboard-bills-trend]");
    const accountsListEl = document.querySelector("[data-dashboard-accounts]");
    const categoriesListEl = document.querySelector("[data-dashboard-categories]");

    if (!transactions.length) {
      netValue.textContent = "--";
      if (netTrend) {
        netTrend.textContent = "Add transactions to see totals.";
      }
      if (budgetValue) {
        budgetValue.textContent = "--";
      }
      if (budgetTrend) {
        budgetTrend.textContent = "Start categorizing transactions.";
      }
    }

    const now = new Date();
    const recentStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 30
    );
    const recentTransactions = transactions.filter((transaction) => {
      const date = parseIsoDate(transaction.date);
      return date && date >= recentStart;
    });

    const inflow = recentTransactions.reduce(
      (sum, transaction) =>
        sum + (transaction.type === "inflow" ? transaction.amount : 0),
      0
    );
    const outflow = recentTransactions.reduce(
      (sum, transaction) =>
        sum + (transaction.type === "outflow" ? transaction.amount : 0),
      0
    );
    const net = inflow - outflow;
    netValue.textContent = transactions.length
      ? formatCurrencyExact(net)
      : "--";
    if (netTrend) {
      netTrend.textContent = recentTransactions.length
        ? "Last 30 days"
        : "No recent activity yet.";
    }

    const balances = {};
    transactions.forEach((transaction) => {
      if (!transaction.account) {
        return;
      }
      const signed =
        transaction.type === "outflow"
          ? -transaction.amount
          : transaction.amount;
      balances[transaction.account] =
        (balances[transaction.account] || 0) + signed;
    });

    if (totalValue) {
      const total = accounts.reduce(
        (sum, account) => sum + (balances[account.name] || 0),
        0
      );
      totalValue.textContent = accounts.length
        ? formatCurrencyExact(total)
        : "--";
    }
    if (totalTrend) {
      totalTrend.textContent = accounts.length
        ? `${accounts.length} account(s) tracked`
        : "Add accounts to track balances.";
    }

    if (budgetValue) {
      if (inflow > 0) {
        const percent = Math.round((outflow / inflow) * 100);
        budgetValue.textContent = `${percent}%`;
        if (budgetTrend) {
          budgetTrend.textContent = "Outflow vs inflow (30d)";
        }
      } else {
        budgetValue.textContent = "--";
        if (budgetTrend) {
          budgetTrend.textContent = "Start categorizing transactions.";
        }
      }
    }

    if (billsValue && billsTrend) {
      billsValue.textContent = "--";
      billsTrend.textContent = "Add scheduled payments.";
    }

    if (accountsListEl) {
      accountsListEl.innerHTML = "";
      if (!accounts.length) {
        const item = document.createElement("li");
        item.innerHTML = "<strong>No accounts yet</strong><span>Use Accounts to add</span>";
        accountsListEl.appendChild(item);
      } else {
        accounts.slice(0, 3).forEach((account) => {
          const item = document.createElement("li");
          const amount = balances[account.name] || 0;
          const button = document.createElement("button");
          button.type = "button";
          button.dataset.account = account.name;
          button.innerHTML = `<strong>${account.name}</strong><span>${formatCurrencyExact(
            amount
          )}</span>`;
          item.appendChild(button);
          accountsListEl.appendChild(item);
        });
      }
    }

    if (categoriesListEl) {
      categoriesListEl.innerHTML = "";
      const categoryTotals = {};
      recentTransactions
        .filter((transaction) => transaction.type === "outflow")
        .forEach((transaction) => {
          const key = transaction.category || "Uncategorized";
          categoryTotals[key] =
            (categoryTotals[key] || 0) + transaction.amount;
        });
      const topCategories = Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);

      if (!topCategories.length) {
        const item = document.createElement("li");
        item.innerHTML =
          "<strong>No spending yet</strong><span>Import or add transactions</span>";
        categoriesListEl.appendChild(item);
      } else {
        topCategories.forEach(([category, total]) => {
          const item = document.createElement("li");
          item.innerHTML = `<strong>${category}</strong><span>${formatCurrencyExact(
            total
          )}</span>`;
          categoriesListEl.appendChild(item);
        });
      }
    }
  };

  const updateTransactions = (nextTransactions) => {
    transactions = nextTransactions;
    saveTransactions(transactions);
    if (transactionList) {
      renderTransactions(transactions);
    }
    if (registerState) {
      registerState.render(transactions);
    }
    updateDashboard();
    renderReports();
  };

  const updateAccounts = (nextAccounts) => {
    accounts = nextAccounts;
    saveAccounts(accounts);
    renderAccounts();
    if (registerState) {
      registerState.render(transactions);
    }
    updateDashboard();
  };

  const updateAccountSelects = () => {
    const selects = Array.from(document.querySelectorAll("[data-account-select]"));
    selects.forEach((select) => {
      const allowAll = select.dataset.allowAll === "true";
      const previous = select.value;
      select.innerHTML = "";

      if (allowAll) {
        const option = document.createElement("option");
        option.value = "all";
        option.textContent = "All accounts";
        select.appendChild(option);
      }

      if (!accounts.length) {
        const option = document.createElement("option");
        option.value = "";
        option.textContent = "Add an account first";
        option.disabled = true;
        option.selected = true;
        select.appendChild(option);
        select.disabled = true;
        return;
      }

      accounts.forEach((account) => {
        const option = document.createElement("option");
        option.value = account.name;
        option.textContent = account.name;
        select.appendChild(option);
      });

      select.disabled = false;
      if (allowAll) {
        select.value =
          previous && accounts.some((account) => account.name === previous)
            ? previous
            : "all";
      } else if (previous && accounts.some((account) => account.name === previous)) {
        select.value = previous;
      } else {
        select.selectedIndex = 0;
      }
    });
  };

  const isValidMonthKey = (value) => /^\d{4}-(0[1-9]|1[0-2])$/.test(value);

  const formatMonthLabel = (monthKey) => {
    if (!isValidMonthKey(monthKey)) {
      return monthKey;
    }
    const [year, month] = monthKey.split("-").map(Number);
    const date = new Date(year, month - 1, 1);
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      year: "numeric",
    }).format(date);
  };

  const setReportStatus = (message, tone) => {
    if (!reportStatus) {
      return;
    }
    reportStatus.textContent = message;
    if (tone) {
      reportStatus.dataset.tone = tone;
    } else {
      delete reportStatus.dataset.tone;
    }
  };

  const summarizeMonth = (monthKey) => {
    let inflow = 0;
    let outflow = 0;
    const count = transactions.reduce((total, item) => {
      if (!item.date) {
        return total;
      }
      if (item.date.slice(0, 7) !== monthKey) {
        return total;
      }
      if (item.type === "inflow") {
        inflow += item.amount;
      } else if (item.type === "outflow") {
        outflow += item.amount;
      }
      return total + 1;
    }, 0);
    return {
      inflow,
      outflow,
      net: inflow - outflow,
      count,
    };
  };

  const renderReports = () => {
    if (!reportGrid || !reportTable) {
      return;
    }

    reportGrid.innerHTML = "";
    reportTable.innerHTML = "";

    if (!reports.length) {
      const emptyCard = document.createElement("article");
      emptyCard.className = "card";
      emptyCard.innerHTML = `
        <h3>No reports yet</h3>
        <p class="muted">Create your first monthly summary to see reports listed here.</p>
        <div class="actions">
          <a class="btn small" href="#" data-report-new>New monthly report</a>
        </div>
      `;
      reportGrid.appendChild(emptyCard);

      const emptyRow = document.createElement("tr");
      const emptyCell = document.createElement("td");
      emptyCell.colSpan = 4;
      emptyCell.classList.add("muted");
      emptyCell.textContent = "No reports yet.";
      emptyRow.appendChild(emptyCell);
      reportTable.appendChild(emptyRow);
      if (reportPill) {
        reportPill.textContent = "No drafts yet";
      }
      return;
    }

    if (reportPill) {
      reportPill.textContent = `${reports.length} report(s)`;
    }

    reports.forEach((report) => {
      const summary = summarizeMonth(report.month);
      const card = document.createElement("article");
      card.className = "card";
      card.innerHTML = `
        <h3>${formatMonthLabel(report.month)}</h3>
        <p class="muted">Household snapshot with ${summary.count} transaction(s).</p>
        <ul class="list">
          <li><strong>Inflow</strong><span>${formatCurrencyExact(summary.inflow)}</span></li>
          <li><strong>Outflow</strong><span>${formatCurrencyExact(summary.outflow)}</span></li>
          <li><strong>Net</strong><span>${formatCurrencyExact(summary.net)}</span></li>
        </ul>
      `;
      reportGrid.appendChild(card);

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${formatMonthLabel(report.month)}</td>
        <td>${report.month}</td>
        <td>${report.status || "Draft"}</td>
        <td>${report.focus || "Household summary"}</td>
      `;
      reportTable.appendChild(row);
    });
  };

  const exportReportsCsv = () => {
    if (!reports.length) {
      setReportStatus("Create a monthly report before exporting.", "error");
      return;
    }
    const rows = [
      [
        "Month",
        "Period",
        "Status",
        "Focus",
        "Inflow",
        "Outflow",
        "Net",
        "Transactions",
      ],
    ];
    reports.forEach((report) => {
      const summary = summarizeMonth(report.month);
      rows.push([
        formatMonthLabel(report.month),
        report.month,
        report.status || "Draft",
        report.focus || "Household summary",
        summary.inflow.toFixed(2),
        summary.outflow.toFixed(2),
        summary.net.toFixed(2),
        String(summary.count),
      ]);
    });

    const escapeField = (value) => {
      const text = String(value);
      if (/[",\n]/.test(text)) {
        return `"${text.replace(/"/g, '""')}"`;
      }
      return text;
    };

    const csv = rows.map((row) => row.map(escapeField).join(",")).join("\n");
    const filename = `home-finances-reports-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    downloadBlob(csv, filename, "text/csv");
    setReportStatus("CSV export downloaded.", "success");
  };

  const exportReportsArchive = () => {
    const archive = {
      generatedAt: new Date().toISOString(),
      reports,
      accounts,
      transactions,
    };
    const filename = `home-finances-archive-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    downloadBlob(JSON.stringify(archive, null, 2), filename, "application/json");
    setReportStatus("Archive export downloaded.", "success");
  };

  const exportReportsPdf = () => {
    if (!reports.length) {
      setReportStatus("Create a monthly report before exporting.", "error");
      return;
    }
    const reportRows = reports
      .map((report) => {
        const summary = summarizeMonth(report.month);
        return `
          <tr>
            <td>${formatMonthLabel(report.month)}</td>
            <td>${report.month}</td>
            <td>${report.status || "Draft"}</td>
            <td>${report.focus || "Household summary"}</td>
            <td>${formatCurrencyExact(summary.inflow)}</td>
            <td>${formatCurrencyExact(summary.outflow)}</td>
            <td>${formatCurrencyExact(summary.net)}</td>
            <td>${summary.count}</td>
          </tr>
        `;
      })
      .join("");

    const html = `
      <!doctype html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <title>Home Finances Reports</title>
          <style>
            body { font-family: "Trebuchet MS", "Gill Sans", "Optima", sans-serif; padding: 24px; color: #1e1a16; }
            h1 { margin: 0 0 8px; font-size: 28px; }
            p { margin: 0 0 20px; color: #6f6159; }
            table { width: 100%; border-collapse: collapse; font-size: 13px; }
            th, td { border-bottom: 1px solid #e6ddd2; padding: 8px 6px; text-align: left; }
            th { text-transform: uppercase; font-size: 11px; letter-spacing: 0.12em; color: #3f5961; }
          </style>
        </head>
        <body>
          <h1>Monthly reports</h1>
          <p>Generated ${new Date().toLocaleDateString()}.</p>
          <table>
            <thead>
              <tr>
                <th>Report</th>
                <th>Period</th>
                <th>Status</th>
                <th>Focus</th>
                <th>Inflow</th>
                <th>Outflow</th>
                <th>Net</th>
                <th>Transactions</th>
              </tr>
            </thead>
            <tbody>
              ${reportRows}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.onload = () => {
      try {
        if (iframe.contentWindow) {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
          setReportStatus("PDF export ready to print or save.", "success");
        } else {
          setReportStatus("Unable to open PDF preview.", "error");
        }
      } finally {
        setTimeout(() => iframe.remove(), 1000);
      }
    };
    iframe.srcdoc = html;
    document.body.appendChild(iframe);
  };

  const updateReports = (nextReports) => {
    reports = nextReports;
    saveReports(reports);
    renderReports();
  };

  const createMonthlyReport = (monthKey) => {
    if (!isValidMonthKey(monthKey)) {
      if (reportStatus) {
        reportStatus.textContent = "Use YYYY-MM for the report month.";
        reportStatus.dataset.tone = "error";
      }
      return;
    }

    if (reports.some((report) => report.month === monthKey)) {
      if (reportStatus) {
        reportStatus.textContent = "That month already has a report.";
        reportStatus.dataset.tone = "error";
      }
      return;
    }

    const newReport = {
      id: createId(),
      month: monthKey,
      createdAt: Date.now(),
      status: "Draft",
      focus: "Household summary",
    };
    updateReports([newReport, ...reports]);
    if (reportStatus) {
      reportStatus.textContent = `Created ${formatMonthLabel(monthKey)}.`;
      reportStatus.dataset.tone = "success";
    }
  };

  const getValue = (selector, fallback) => {
    const input = planner ? planner.querySelector(selector) : null;
    const parsed = input ? Number(input.value) : NaN;
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const runPlan = () => {
    if (!planner || !resultNet || !resultIncome || !resultAverage) {
      return;
    }

    const income = getValue("#income", 0);
    const expenses = getValue("#expenses", 0);
    const growthPercent = getValue("#growth", 0);
    const monthsRaw = Math.round(getValue("#months", 1));
    const months = Math.max(1, monthsRaw);
    const growthRate = growthPercent / 100;

    let totalNet = 0;
    let currentIncome = income;
    for (let i = 0; i < months; i += 1) {
      totalNet += currentIncome - expenses;
      currentIncome *= 1 + growthRate;
    }

    const averageNet = totalNet / months;
    const finalIncome = income * Math.pow(1 + growthRate, months - 1);

    resultNet.textContent = formatCurrency(totalNet);
    resultIncome.textContent = formatCurrency(finalIncome);
    resultAverage.textContent = formatCurrency(averageNet);
  };

  if (planner) {
    planner.addEventListener("submit", (event) => {
      event.preventDefault();
      runPlan();
    });
    runPlan();
  }

  if (fileInput && fileTriggers.length) {
    fileTriggers.forEach((trigger) => {
      trigger.addEventListener("click", () => {
        fileInput.click();
      });
    });

    const normalizeHeader = (value) =>
      value.toLowerCase().replace(/[^a-z0-9]/g, "");

    const parseCsv = (text) => {
      const rows = [];
      let row = [];
      let current = "";
      let inQuotes = false;

      for (let i = 0; i < text.length; i += 1) {
        const char = text[i];
        const next = text[i + 1];

        if (char === '"') {
          if (inQuotes && next === '"') {
            current += '"';
            i += 1;
          } else {
            inQuotes = !inQuotes;
          }
          continue;
        }

        if (char === "," && !inQuotes) {
          row.push(current);
          current = "";
          continue;
        }

        if ((char === "\n" || char === "\r") && !inQuotes) {
          if (char === "\r" && next === "\n") {
            i += 1;
          }
          row.push(current);
          current = "";
          if (row.some((cell) => cell.trim() !== "")) {
            rows.push(row);
          }
          row = [];
          continue;
        }

        current += char;
      }

      if (current.length || row.length) {
        row.push(current);
        if (row.some((cell) => cell.trim() !== "")) {
          rows.push(row);
        }
      }

      return rows;
    };

    const toIsoDate = (value) => {
      const trimmed = value.trim();
      if (/^\\d{4}-\\d{2}-\\d{2}$/.test(trimmed)) {
        return trimmed;
      }
      const parsed = new Date(trimmed);
      if (Number.isNaN(parsed.getTime())) {
        return "";
      }
      return parsed.toISOString().slice(0, 10);
    };

    const parseAmount = (value) => {
      const trimmed = String(value || "").trim();
      if (!trimmed) {
        return NaN;
      }
      const isNegative =
        (trimmed.startsWith("(") && trimmed.endsWith(")")) ||
        trimmed.startsWith("-");
      const normalized = trimmed
        .replace(/[()]/g, "")
        .replace(/[$,]/g, "")
        .trim();
      const parsed = Number(normalized);
      if (!Number.isFinite(parsed)) {
        return NaN;
      }
      return isNegative ? -Math.abs(parsed) : parsed;
    };

    const pickIndex = (headers, candidates) => {
      const normalized = headers.map(normalizeHeader);
      for (const candidate of candidates) {
        const index = normalized.indexOf(normalizeHeader(candidate));
        if (index !== -1) {
          return index;
        }
      }
      return -1;
    };

    const getImportDefaultAccount = () => {
      if (importAccountSelect instanceof HTMLSelectElement) {
        const selected = importAccountSelect.value.trim();
        if (selected) {
          return selected;
        }
      }
      return accounts[0]?.name || "Unassigned";
    };

    const importFromCsv = (text, defaultAccountName) => {
      const rows = parseCsv(text);
      if (rows.length < 2) {
        return [];
      }
      const header = rows[0];
      const dateIndex = pickIndex(header, [
        "date",
        "transaction date",
        "posted date",
        "post date",
      ]);
      const amountIndex = pickIndex(header, ["amount", "amt", "value"]);
      const inflowIndex = pickIndex(header, ["inflow", "credit", "deposit"]);
      const outflowIndex = pickIndex(header, ["outflow", "debit", "withdrawal"]);
      const accountIndex = pickIndex(header, ["account", "account name"]);
      const payeeIndex = pickIndex(header, [
        "payee",
        "description",
        "merchant",
        "name",
      ]);
      const categoryIndex = pickIndex(header, ["category", "cat"]);
      const memoIndex = pickIndex(header, ["memo", "note", "notes"]);

      if (dateIndex === -1 || (amountIndex === -1 && inflowIndex === -1 && outflowIndex === -1)) {
        return [];
      }

      const defaultAccount = defaultAccountName || accounts[0]?.name || "Unassigned";
      const validAccounts = new Set(accounts.map((account) => account.name));

      const imported = [];
      rows.slice(1).forEach((row) => {
        const rawDate = row[dateIndex] || "";
        const date = toIsoDate(rawDate);
        if (!date) {
          return;
        }

        let amount = NaN;
        if (amountIndex !== -1) {
          amount = parseAmount(row[amountIndex]);
        } else {
          const inflow = parseAmount(row[inflowIndex]);
          const outflow = parseAmount(row[outflowIndex]);
          if (Number.isFinite(inflow) && inflow > 0) {
            amount = inflow;
          } else if (Number.isFinite(outflow) && outflow > 0) {
            amount = -outflow;
          }
        }

        if (!Number.isFinite(amount) || amount === 0) {
          return;
        }

        const accountRaw = accountIndex !== -1 ? row[accountIndex] : "";
        const accountName = accountRaw.trim() || defaultAccount;
        const account = validAccounts.has(accountName)
          ? accountName
          : defaultAccount;
        const payeeRaw = payeeIndex !== -1 ? row[payeeIndex] : "";
        const categoryRaw = categoryIndex !== -1 ? row[categoryIndex] : "";
        const memoRaw = memoIndex !== -1 ? row[memoIndex] : "";

        const type = amount < 0 ? "outflow" : "inflow";
        const entry = {
          id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          createdAt: Date.now(),
          date,
          account,
          payee: payeeRaw.trim() || "Imported",
          category: categoryRaw.trim(),
          memo: memoRaw.trim(),
          type,
          amount: Math.abs(amount),
        };
        imported.push(entry);
      });

      return imported;
    };

    const readFileText = (file) =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(reader.error);
        reader.readAsText(file);
      });

    const setFileStatus = (message, tone) => {
      if (!fileStatus) {
        return;
      }
      fileStatus.textContent = message;
      if (tone) {
        fileStatus.dataset.tone = tone;
      } else {
        delete fileStatus.dataset.tone;
      }
    };

    fileInput.addEventListener("change", async () => {
      const files = Array.from(fileInput.files || []);
      if (!files.length) {
        setFileStatus("No files selected.");
        return;
      }
      if (!accounts.length) {
        setFileStatus("Add an account first to import files.", "error");
        fileInput.value = "";
        return;
      }

      const csvFiles = files.filter((file) =>
        file.name.toLowerCase().endsWith(".csv")
      );
      if (!csvFiles.length) {
        setFileStatus("Only CSV imports are supported right now.", "error");
        fileInput.value = "";
        return;
      }

      setFileStatus("Reading files...");
      let importedCount = 0;
      let skippedFiles = 0;
      for (const file of csvFiles) {
        try {
          const text = await readFileText(file);
          const defaultAccount = getImportDefaultAccount();
          const imported = importFromCsv(text, defaultAccount);
          if (imported.length) {
            importedCount += imported.length;
            updateTransactions([...imported, ...transactions]);
          } else {
            skippedFiles += 1;
          }
        } catch (error) {
          skippedFiles += 1;
        }
      }

      if (importedCount) {
        setFileStatus(
          `Import complete: ${importedCount} transaction(s) added.`,
          "success"
        );
      } else {
        setFileStatus(
          "No transactions imported. Check column headers and data.",
          "error"
        );
      }

      if (skippedFiles) {
        fileStatus.textContent += ` (${skippedFiles} file(s) skipped.)`;
      }

      fileInput.value = "";
    });
  }

  const renderTransactions = (list) => {
    if (!transactionList) {
      return;
    }
    transactionList.innerHTML = "";
    if (!list.length) {
      const emptyRow = document.createElement("tr");
      const emptyCell = document.createElement("td");
      emptyCell.colSpan = 8;
      emptyCell.textContent = "No manual transactions yet.";
      emptyCell.classList.add("muted");
      emptyRow.appendChild(emptyCell);
      transactionList.appendChild(emptyRow);
      return;
    }

    list.forEach((transaction) => {
      const row = document.createElement("tr");
      const signedAmount =
        transaction.type === "outflow" ? -transaction.amount : transaction.amount;
      const sign = transaction.type === "outflow" ? "-" : "+";

      [
        transaction.date,
        transaction.account,
        transaction.payee,
        transaction.category || "Uncategorized",
        transaction.memo || "-",
      ].forEach((value) => {
        const cell = document.createElement("td");
        cell.textContent = value;
        row.appendChild(cell);
      });

      const amountCell = document.createElement("td");
      amountCell.textContent = `${sign}${formatCurrencyExact(
        Math.abs(signedAmount)
      )}`;
      amountCell.classList.add(
        "amount",
        transaction.type === "outflow" ? "outflow" : "inflow"
      );
      row.appendChild(amountCell);

      const typeCell = document.createElement("td");
      typeCell.textContent =
        transaction.type === "outflow" ? "Outflow" : "Inflow";
      row.appendChild(typeCell);

      const actionCell = document.createElement("td");
      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.className = "btn small ghost";
      removeButton.textContent = "Remove";
      removeButton.dataset.transactionId = transaction.id;
      actionCell.appendChild(removeButton);
      row.appendChild(actionCell);

      transactionList.appendChild(row);
    });
  };

  const renderAccounts = () => {
    if (!accountsList) {
      updateAccountSelects();
      return;
    }

    accountsList.innerHTML = "";
    if (!accounts.length) {
      const emptyRow = document.createElement("tr");
      const emptyCell = document.createElement("td");
      emptyCell.colSpan = 5;
      emptyCell.textContent = "No accounts yet. Add your first account to start.";
      emptyCell.classList.add("muted");
      emptyRow.appendChild(emptyCell);
      accountsList.appendChild(emptyRow);
      updateAccountSelects();
      return;
    }

    const buildAccountRow = (account) => {
      const row = document.createElement("tr");
      row.dataset.accountId = account.id;

      const nameCell = document.createElement("td");
      nameCell.textContent = account.name;
      row.appendChild(nameCell);

      const groupCell = document.createElement("td");
      groupCell.textContent = account.group || "On budget";
      row.appendChild(groupCell);

      const typeCell = document.createElement("td");
      typeCell.textContent = account.type;
      row.appendChild(typeCell);

      const instCell = document.createElement("td");
      instCell.textContent = account.institution || "-";
      row.appendChild(instCell);

      const actionCell = document.createElement("td");
      const viewButton = document.createElement("button");
      viewButton.type = "button";
      viewButton.className = "btn small";
      viewButton.textContent = "View";
      viewButton.dataset.action = "view";
      actionCell.appendChild(viewButton);

      const editButton = document.createElement("button");
      editButton.type = "button";
      editButton.className = "btn small ghost";
      editButton.textContent = "Edit";
      editButton.dataset.action = "edit";
      actionCell.appendChild(editButton);

      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.className = "btn small ghost";
      removeButton.textContent = "Remove";
      removeButton.dataset.action = "remove";
      actionCell.appendChild(removeButton);

      row.appendChild(actionCell);
      return row;
    };

    accounts.forEach((account) => {
      accountsList.appendChild(buildAccountRow(account));
    });

    updateAccountSelects();
  };

  if (accountForm && accountsList) {
    const submitButton = accountForm.querySelector("[data-account-submit]");
    const cancelButton = accountForm.querySelector("[data-account-cancel]");
    const openingDateInput = accountForm.querySelector("#account-opening-date");

    if (openingDateInput instanceof HTMLInputElement && !openingDateInput.value) {
      openingDateInput.value = new Date().toISOString().slice(0, 10);
    }

    const resetAccountForm = () => {
      accountForm.reset();
      if (openingDateInput instanceof HTMLInputElement) {
        openingDateInput.value = new Date().toISOString().slice(0, 10);
      }
      delete accountForm.dataset.editingId;
      if (submitButton) {
        submitButton.textContent = "Add account";
      }
      if (cancelButton) {
        cancelButton.hidden = true;
      }
    };

    const updateAccountDetails = (accountId, updates) => {
      const existing = accounts.find((item) => item.id === accountId);
      if (!existing) {
        return;
      }

      const name = updates.name.trim();
      if (!name) {
        return;
      }
      const nameConflict = accounts.some(
        (item) =>
          item.id !== accountId && item.name.toLowerCase() === name.toLowerCase()
      );
      if (nameConflict) {
        return;
      }

      const updatedAccount = {
        ...existing,
        name,
        group: updates.group || existing.group || "On budget",
        type: updates.type || existing.type,
        institution: updates.institution.trim(),
      };

      const updatedAccounts = accounts.map((item) =>
        item.id === accountId ? updatedAccount : item
      );

      if (existing.name !== updatedAccount.name) {
        const updatedTransactions = transactions.map((item) =>
          item.account === existing.name
            ? { ...item, account: updatedAccount.name }
            : item
        );
        updateTransactions(updatedTransactions);
      }

      updateAccounts(updatedAccounts);
    };

    const startAccountEdit = (account) => {
      accountForm.dataset.editingId = account.id;
      const nameInput = accountForm.querySelector("#account-name");
      const groupInput = accountForm.querySelector("#account-group");
      const typeInput = accountForm.querySelector("#account-type");
      const institutionInput = accountForm.querySelector("#account-institution");
      const openingBalanceInput = accountForm.querySelector(
        "#account-opening-balance"
      );
      if (nameInput instanceof HTMLInputElement) {
        nameInput.value = account.name;
      }
      if (groupInput instanceof HTMLSelectElement) {
        groupInput.value = account.group || "On budget";
      }
      if (typeInput instanceof HTMLSelectElement) {
        typeInput.value = account.type;
      }
      if (institutionInput instanceof HTMLInputElement) {
        institutionInput.value = account.institution || "";
      }
      if (openingBalanceInput instanceof HTMLInputElement) {
        openingBalanceInput.value = "";
      }
      if (submitButton) {
        submitButton.textContent = "Save changes";
      }
      if (cancelButton) {
        cancelButton.hidden = false;
      }
      accountForm.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    if (cancelButton) {
      cancelButton.addEventListener("click", () => {
        resetAccountForm();
      });
    }

    accountForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const formData = new FormData(accountForm);
      const name = String(formData.get("name") || "").trim();
      const group = String(formData.get("group") || "").trim();
      const type = String(formData.get("type") || "").trim();
      const institution = String(formData.get("institution") || "").trim();
      const openingBalanceRaw = Number(formData.get("opening_balance"));
      const openingDateRaw = String(formData.get("opening_date") || "").trim();
      if (!name || !type) {
        return;
      }

      const editingId = accountForm.dataset.editingId;
      if (editingId) {
        updateAccountDetails(editingId, {
          name,
          group,
          type,
          institution,
        });
        resetAccountForm();
        return;
      }

      if (accounts.some((account) => account.name.toLowerCase() === name.toLowerCase())) {
        return;
      }

      const newAccount = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        name,
        group: group || "On budget",
        type,
        institution,
      };
      updateAccounts([...accounts, newAccount]);

      const openingDate = openingDateRaw || new Date().toISOString().slice(0, 10);
      if (Number.isFinite(openingBalanceRaw) && openingBalanceRaw !== 0) {
        const openingType = openingBalanceRaw < 0 ? "outflow" : "inflow";
        const openingTransaction = {
          id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          createdAt: Date.now(),
          date: openingDate,
          account: name,
          payee: "Opening balance",
          category: "Starting balance",
          memo: "Account setup",
          type: openingType,
          amount: Math.abs(openingBalanceRaw),
        };
        updateTransactions([openingTransaction, ...transactions]);
      }
      resetAccountForm();
    });

    accountsList.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }
      const button = target.closest("button");
      if (!button) {
        return;
      }
      const row = button.closest("tr");
      const accountId = row ? row.dataset.accountId : "";
      const action = button.dataset.action;
      if (!accountId || !action) {
        return;
      }

      if (action === "remove") {
        const account = accounts.find((item) => item.id === accountId);
        updateAccounts(accounts.filter((item) => item.id !== accountId));
        if (account) {
          updateTransactions(
            transactions.filter((item) => item.account !== account.name)
          );
        }
        return;
      }

      if (action === "edit") {
        const account = accounts.find((item) => item.id === accountId);
        if (!account) {
          return;
        }
        startAccountEdit(account);
        return;
      }

      if (action === "view") {
        const account = accounts.find((item) => item.id === accountId);
        if (!account) {
          return;
        }
        if (registerState && registerState.setAccountFilter) {
          registerState.setAccountFilter(account.name);
        }
        if (register) {
          register.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    });
  }

  renderAccounts();
  updateDashboard();
  renderReports();

  if (transactionForm && transactionList) {
    const dateInput = transactionForm.querySelector("#txn-date");
    if (dateInput && !dateInput.value) {
      dateInput.value = new Date().toISOString().slice(0, 10);
    }

    renderTransactions(transactions);

    transactionForm.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!accounts.length) {
        return;
      }
      const formData = new FormData(transactionForm);
      const amountValue = Number(formData.get("amount"));
      if (!Number.isFinite(amountValue) || amountValue <= 0) {
        return;
      }

      const newTransaction = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        createdAt: Date.now(),
        date: String(formData.get("date") || ""),
        account: String(formData.get("account") || "Checking"),
        payee: String(formData.get("payee") || ""),
        category: String(formData.get("category") || ""),
        memo: String(formData.get("memo") || ""),
        type: String(formData.get("type") || "outflow"),
        amount: Math.abs(amountValue),
      };

      updateTransactions([newTransaction, ...transactions]);
      transactionForm.reset();
      if (dateInput) {
        dateInput.value = new Date().toISOString().slice(0, 10);
      }
    });

    transactionList.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }
      const transactionId = target.dataset.transactionId;
      if (!transactionId) {
        return;
      }
      updateTransactions(transactions.filter((item) => item.id !== transactionId));
    });
  }

  const initRegister = () => {
    if (!register) {
      return null;
    }

    const rowsBody = register.querySelector("[data-register-rows]");
    if (!rowsBody) {
      return null;
    }

    const accountFilter = register.querySelector("[data-register-account]");
    const typeFilter = register.querySelector("[data-register-type]");
    const searchInput = register.querySelector("[data-register-search]");
    const inflowTarget = register.querySelector("[data-register-inflow]");
    const outflowTarget = register.querySelector("[data-register-outflow]");
    const netTarget = register.querySelector("[data-register-net]");
    const addSection = register.querySelector("[data-register-add]");
    const addAction = addSection
      ? addSection.querySelector("[data-add-action]")
      : null;
    let rowMeta = [];

    const createCell = (value, className) => {
      const cell = document.createElement("td");
      cell.textContent = value;
      if (className) {
        cell.className = className;
      }
      return cell;
    };

    const createInput = (type, value, placeholder, field) => {
      const input = document.createElement("input");
      input.type = type;
      input.value = value;
      if (placeholder) {
        input.placeholder = placeholder;
      }
      if (field) {
        input.dataset.field = field;
      }
      return input;
    };

    const createSelect = (options, selected, field) => {
      const select = document.createElement("select");
      if (field) {
        select.dataset.field = field;
      }
      options.forEach((value) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = value;
        if (value === selected) {
          option.selected = true;
        }
        select.appendChild(option);
      });
      return select;
    };

    const createActionButton = (label, action) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "btn small ghost";
      button.textContent = label;
      button.dataset.action = action;
      return button;
    };

    const getAccountOptions = () =>
      accounts.length ? accounts.map((account) => account.name) : ["Unassigned"];

    const buildRegisterRow = (transaction) => {
      const row = document.createElement("tr");
      const account = transaction.account || "Checking";
      const payee = transaction.payee || "Manual entry";
      const category = transaction.category || "";
      const memo = transaction.memo || "";
      const orderValue = Number(
        transaction.createdAt || String(transaction.id || "").split("-")[0] || 0
      );
      const signedAmount =
        transaction.type === "outflow"
          ? -transaction.amount
          : transaction.amount;

      row.dataset.id = transaction.id;
      row.dataset.source = "manual";
      row.dataset.account = account;
      row.dataset.type = transaction.type;
      row.dataset.amount = String(signedAmount);
      row.dataset.order = String(Number.isFinite(orderValue) ? orderValue : 0);
      row.dataset.search = `${payee} ${category} ${memo} ${account} ${transaction.type}`;
      row.dataset.date = transaction.date;

      row.appendChild(createCell(transaction.date));
      row.appendChild(createCell(account));
      row.appendChild(createCell(payee));
      row.appendChild(createCell(category || "Uncategorized"));
      row.appendChild(createCell(memo || "-"));

      if (transaction.type === "outflow") {
        row.appendChild(
          createCell(formatCurrencyExact(transaction.amount), "amount outflow")
        );
        row.appendChild(createCell("-", "amount inflow"));
      } else {
        row.appendChild(createCell("-", "amount outflow"));
        row.appendChild(
          createCell(formatCurrencyExact(transaction.amount), "amount inflow")
        );
      }

      const balanceCell = document.createElement("td");
      balanceCell.dataset.balance = "true";
      row.appendChild(balanceCell);

      const actionCell = document.createElement("td");
      actionCell.appendChild(createActionButton("Edit", "edit"));
      actionCell.appendChild(createActionButton("Remove", "remove"));
      row.appendChild(actionCell);

      return row;
    };

    const buildEditRow = (transaction) => {
      const row = document.createElement("tr");
      const account = transaction.account || "Checking";
      const payee = transaction.payee || "";
      const category = transaction.category || "";
      const memo = transaction.memo || "";
      const signedAmount =
        transaction.type === "outflow"
          ? -transaction.amount
          : transaction.amount;

      row.dataset.id = transaction.id;
      row.dataset.source = "manual";
      row.dataset.account = account;
      row.dataset.type = transaction.type;
      row.dataset.amount = String(signedAmount);
      row.dataset.search = `${payee} ${category} ${memo} ${account} ${transaction.type}`;
      row.dataset.date = transaction.date;
      row.dataset.editing = "true";

      const dateInput = createInput("date", transaction.date, "", "date");
      row.appendChild(document.createElement("td")).appendChild(dateInput);

      const accountSelect = createSelect(getAccountOptions(), account, "account");
      row.appendChild(document.createElement("td")).appendChild(accountSelect);

      const payeeInput = createInput("text", payee, "Payee", "payee");
      row.appendChild(document.createElement("td")).appendChild(payeeInput);

      const categoryInput = createInput("text", category, "Category", "category");
      row.appendChild(document.createElement("td")).appendChild(categoryInput);

      const memoInput = createInput("text", memo, "Memo", "memo");
      row.appendChild(document.createElement("td")).appendChild(memoInput);

      const outflowValue =
        transaction.type === "outflow" ? String(transaction.amount) : "";
      const inflowValue =
        transaction.type === "inflow" ? String(transaction.amount) : "";

      const outflowInput = createInput(
        "number",
        outflowValue,
        "0.00",
        "outflow"
      );
      outflowInput.step = "0.01";
      row.appendChild(document.createElement("td")).appendChild(outflowInput);

      const inflowInput = createInput(
        "number",
        inflowValue,
        "0.00",
        "inflow"
      );
      inflowInput.step = "0.01";
      row.appendChild(document.createElement("td")).appendChild(inflowInput);

      const balanceCell = document.createElement("td");
      balanceCell.dataset.balance = "true";
      balanceCell.textContent = "-";
      row.appendChild(balanceCell);

      const actionCell = document.createElement("td");
      actionCell.appendChild(createActionButton("Save", "save"));
      actionCell.appendChild(createActionButton("Cancel", "cancel"));
      row.appendChild(actionCell);

      return row;
    };

    const seedRows = Array.from(rowsBody.querySelectorAll("tr")).map(
      (row, index) => {
        if (!row.dataset.date) {
          const dateCell = row.querySelector("td");
          row.dataset.date = dateCell ? dateCell.textContent.trim() : "";
        }
        row.dataset.source = row.dataset.source || "seed";
        row.dataset.order = row.dataset.order || String(index);
        return row;
      }
    );

    const collectRows = () => {
      rowMeta = Array.from(rowsBody.querySelectorAll("tr"))
        .filter((row) => !row.dataset.placeholder)
        .map((row, index) => ({
          row,
          amount: Number(row.dataset.amount || "0"),
          account: row.dataset.account || "",
          type: row.dataset.type || "",
          search: row.dataset.search || row.textContent || "",
          date: row.dataset.date || row.querySelector("td")?.textContent || "",
          order: Number(row.dataset.order || index),
          id: row.dataset.id || "",
        }));
    };

    const sortRows = () => {
      rowMeta.sort((a, b) => {
        if (a.date === b.date) {
          return a.order - b.order;
        }
        return a.date.localeCompare(b.date);
      });
      rowsBody.innerHTML = "";
      rowMeta.forEach((item) => {
        rowsBody.appendChild(item.row);
      });
    };

    const normalize = (value) => value.toLowerCase().trim();
    const readNumber = (value) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : 0;
    };

    const applyFilters = () => {
      const accountValue = accountFilter ? accountFilter.value : "all";
      const typeValue = typeFilter ? typeFilter.value : "all";
      const searchValue = normalize(searchInput ? searchInput.value : "");
      const running = {};
      let inflow = 0;
      let outflow = 0;

      rowMeta.forEach((item) => {
        const matchesAccount =
          accountValue === "all" || item.account === accountValue;
        const matchesType = typeValue === "all" || item.type === typeValue;
        const matchesSearch =
          !searchValue || normalize(item.search).includes(searchValue);
        const isVisible = matchesAccount && matchesType && matchesSearch;

        item.row.hidden = !isVisible;
        if (!isVisible) {
          return;
        }

        if (!(item.account in running)) {
          running[item.account] = 0;
        }

        if (item.amount >= 0) {
          inflow += item.amount;
        } else {
          outflow += Math.abs(item.amount);
        }

        running[item.account] += item.amount;
        const balanceCell = item.row.querySelector("[data-balance]");
        if (balanceCell) {
          balanceCell.textContent = formatCurrencyExact(running[item.account]);
        }
      });

      if (inflowTarget) {
        inflowTarget.textContent = formatCurrencyExact(inflow);
      }
      if (outflowTarget) {
        outflowTarget.textContent = formatCurrencyExact(outflow);
      }
      if (netTarget) {
        netTarget.textContent = formatCurrencyExact(inflow - outflow);
      }
    };

    const render = (list) => {
      const manualRows = list.map(buildRegisterRow);
      rowsBody.innerHTML = "";
      seedRows.forEach((row) => rowsBody.appendChild(row));
      manualRows.forEach((row) => rowsBody.appendChild(row));
      if (!seedRows.length && !manualRows.length) {
        const emptyRow = document.createElement("tr");
        emptyRow.dataset.placeholder = "true";
        const emptyCell = document.createElement("td");
        emptyCell.colSpan = 9;
        emptyCell.textContent = "No transactions yet. Add one to get started.";
        emptyCell.classList.add("muted");
        emptyRow.appendChild(emptyCell);
        rowsBody.appendChild(emptyRow);
        rowMeta = [];
        applyFilters();
        return;
      }
      collectRows();
      sortRows();
      applyFilters();
    };

    const setAccountFilter = (accountName) => {
      if (!accountFilter) {
        return;
      }
      const options = Array.from(accountFilter.options || []);
      if (!options.some((option) => option.value === accountName)) {
        return;
      }
      accountFilter.value = accountName;
      applyFilters();
    };

    const handleAddRow = () => {
      if (!addSection) {
        return;
      }
      if (!accounts.length) {
        return;
      }
      const getField = (field) =>
        addSection.querySelector(`[data-add-field="${field}"]`);

      const date = getField("date")?.value || "";
      const account = getField("account")?.value || "Checking";
      const payee = getField("payee")?.value.trim() || "Manual entry";
      const category = getField("category")?.value.trim() || "";
      const memo = getField("memo")?.value.trim() || "";
      const outflowValue = Number(getField("outflow")?.value);
      const inflowValue = Number(getField("inflow")?.value);

      const hasOutflow = Number.isFinite(outflowValue) && outflowValue > 0;
      const hasInflow = Number.isFinite(inflowValue) && inflowValue > 0;
      if (!date || (hasOutflow && hasInflow) || (!hasOutflow && !hasInflow)) {
        return;
      }

      const type = hasOutflow ? "outflow" : "inflow";
      const amount = hasOutflow ? outflowValue : inflowValue;

      const newTransaction = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        createdAt: Date.now(),
        date,
        account,
        payee,
        category,
        memo,
        type,
        amount: Math.abs(amount),
      };

      updateTransactions([newTransaction, ...transactions]);

      const dateField = getField("date");
      addSection.querySelectorAll("[data-add-field]").forEach((input) => {
        if (input instanceof HTMLInputElement) {
          input.value = "";
        } else if (input instanceof HTMLSelectElement) {
          input.selectedIndex = 0;
        }
      });
      if (dateField instanceof HTMLInputElement) {
        dateField.value = new Date().toISOString().slice(0, 10);
      }
    };

    [accountFilter, typeFilter].forEach((control) => {
      if (control) {
        control.addEventListener("change", applyFilters);
      }
    });

    [searchInput].forEach((control) => {
      if (control) {
        control.addEventListener("input", applyFilters);
      }
    });

    const saveEditRow = (row) => {
      const transactionId = row.dataset.id;
      if (!transactionId) {
        return;
      }
      const getFieldValue = (field) => {
        const input = row.querySelector(`[data-field="${field}"]`);
        return input ? input.value : "";
      };

      const updatedDate = getFieldValue("date");
      const updatedAccount = getFieldValue("account");
      const updatedPayee = getFieldValue("payee").trim();
      const updatedCategory = getFieldValue("category").trim();
      const updatedMemo = getFieldValue("memo").trim();
      const outflowValue = Number(getFieldValue("outflow"));
      const inflowValue = Number(getFieldValue("inflow"));

      const hasOutflow = Number.isFinite(outflowValue) && outflowValue > 0;
      const hasInflow = Number.isFinite(inflowValue) && inflowValue > 0;
      if ((hasOutflow && hasInflow) || (!hasOutflow && !hasInflow)) {
        return;
      }

      const updatedType = hasOutflow ? "outflow" : "inflow";
      const updatedAmount = hasOutflow ? outflowValue : inflowValue;

      const updatedTransactions = transactions.map((item) =>
        item.id === transactionId
          ? {
              ...item,
              date: updatedDate,
              account: updatedAccount,
              payee: updatedPayee,
              category: updatedCategory,
              memo: updatedMemo,
              type: updatedType,
              amount: Math.abs(updatedAmount),
            }
          : item
      );

      updateTransactions(updatedTransactions);
    };

    rowsBody.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }
      const button = target.closest("button");
      if (!button) {
        return;
      }
      const action = button.dataset.action;
      const row = button.closest("tr");
      if (!row || !action) {
        return;
      }
      const transactionId = row.dataset.id;
      if (!transactionId) {
        return;
      }

      if (action === "remove") {
        updateTransactions(transactions.filter((item) => item.id !== transactionId));
        return;
      }

      const transaction = transactions.find((item) => item.id === transactionId);
      if (!transaction) {
        return;
      }

      if (action === "edit") {
        if (row.dataset.editing === "true") {
          return;
        }
        const editRow = buildEditRow(transaction);
        row.replaceWith(editRow);
        collectRows();
        applyFilters();
        return;
      }

      if (action === "cancel") {
        render(transactions);
        return;
      }

      if (action === "save") {
        saveEditRow(row);
      }
    });

    rowsBody.addEventListener("keydown", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }
      const row = target.closest("tr");
      if (!row || row.dataset.editing !== "true") {
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        render(transactions);
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        saveEditRow(row);
      }
    });

    if (addSection) {
      const dateField = addSection.querySelector('[data-add-field="date"]');
      if (dateField instanceof HTMLInputElement && !dateField.value) {
        dateField.value = new Date().toISOString().slice(0, 10);
      }

      if (addAction) {
        addAction.addEventListener("click", handleAddRow);
      }

      addSection.addEventListener("keydown", (event) => {
        if (event.key !== "Enter") {
          return;
        }
        event.preventDefault();
        handleAddRow();
      });
    }

    return { render, setAccountFilter };
  };

  registerState = initRegister();
  if (registerState) {
    registerState.render(transactions);
  }

  const readAccountQuery = () => {
    try {
      return new URLSearchParams(window.location.search).get("account") || "";
    } catch (error) {
      return "";
    }
  };

  const applyAccountQuery = () => {
    const accountName = readAccountQuery();
    if (!accountName) {
      return;
    }
    if (registerState && registerState.setAccountFilter) {
      registerState.setAccountFilter(accountName);
    }
    if (register) {
      register.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  applyAccountQuery();

  if (dashboardAccounts) {
    dashboardAccounts.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }
      const button = target.closest("button[data-account]");
      if (!button) {
        return;
      }
      const accountName = button.dataset.account;
      if (!accountName) {
        return;
      }
      const params = new URLSearchParams();
      params.set("account", accountName);
      window.location.href = `accounts.html?${params.toString()}`;
    });
  }

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }
    const trigger = target.closest("[data-report-new]");
    if (!trigger) {
      return;
    }
    event.preventDefault();
    const defaultMonth = new Date().toISOString().slice(0, 7);
    const input = window.prompt(
      "Which month should this report cover? Use YYYY-MM.",
      defaultMonth
    );
    if (input === null) {
      return;
    }
    const monthKey = input.trim() || defaultMonth;
    createMonthlyReport(monthKey);
  });

  if (reportExportButton) {
    reportExportButton.addEventListener("click", () => {
      const type = reportExportType ? reportExportType.value : "csv";
      if (type === "pdf") {
        exportReportsPdf();
        return;
      }
      if (type === "archive") {
        exportReportsArchive();
        return;
      }
      exportReportsCsv();
    });
  }

  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY) {
      transactions = readTransactions();
      if (transactionList) {
        renderTransactions(transactions);
      }
      if (registerState) {
        registerState.render(transactions);
      }
      updateDashboard();
      renderReports();
    }
    if (event.key === ACCOUNT_KEY) {
      accounts = readAccounts();
      renderAccounts();
      if (registerState) {
        registerState.render(transactions);
      }
      updateDashboard();
    }
    if (event.key === REPORT_KEY) {
      reports = readReports();
      renderReports();
    }
  });

  document.body.classList.add("is-loaded");
});
