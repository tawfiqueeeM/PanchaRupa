/**
 * PanchaRupa Virtual Tea Factory — Shared UI Utilities
 */

/**
 * Triggers a client-side download of tabular data as a CSV file.
 * @param {string} filename 
 * @param {string[]} headers 
 * @param {Array<Array<string|number>>} rows 
 */
export function exportToCsv(filename, headers, rows) {
  const sanitize = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const csvContent = [
    headers.map(sanitize).join(","),
    ...rows.map(row => row.map(sanitize).join(","))
  ].join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Triggers a client-side download of JSON data.
 * @param {string} filename 
 * @param {object} data 
 */
export function exportToJson(filename, data) {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Formats a number to kilograms string.
 * @param {number} val 
 * @param {number} decimals 
 * @returns {string}
 */
export function formatKg(val, decimals = 2) {
  if (typeof val !== "number" || isNaN(val)) return "0.00 kg";
  return `${val.toFixed(decimals)} kg`;
}

/**
 * Formats a currency value in BDT.
 * @param {number} val 
 * @returns {string}
 */
export function formatCurrency(val) {
  if (typeof val !== "number" || isNaN(val)) return "BDT 0.00";
  return `BDT ${val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Creates an in-memory & DOM-backed event logger.
 * @param {HTMLElement|string} target 
 * @param {number} maxEntries 
 */
export function createEventLogger(target, maxEntries = 50) {
  const container = typeof target === "string" ? document.getElementById(target) : target;
  const history = [];

  return {
    log(message, type = "info") {
      const timestamp = new Date().toLocaleTimeString([], { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
      const entry = { timestamp, message, type };
      history.unshift(entry);
      if (history.length > maxEntries) history.pop();

      if (container) {
        const row = document.createElement("div");
        row.className = "event-entry";
        row.innerHTML = `
          <span class="event-time">${timestamp}</span>
          <span class="event-tag ${type.toLowerCase()}">${type.toUpperCase()}</span>
          <span class="event-msg">${escapeHtml(message)}</span>
        `;
        container.insertBefore(row, container.firstChild);
        while (container.children.length > maxEntries) {
          container.removeChild(container.lastChild);
        }
      }
    },
    getHistory() {
      return [...history];
    },
    clear() {
      history.length = 0;
      if (container) container.innerHTML = "";
    }
  };
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
