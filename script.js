// Define a constant for the " Rs" suffix.
const rupeeSuffix = " Rs";

// Global variable to store the current calculation method ("reducing" by default).
let calcMethod = "reducing";

// Format numbers using the Indian numbering system (e.g., 1,06,000)
function formatIndianCurrency(amount) {
  return amount.toLocaleString("en-IN");
}

let emiChart = null;

function calculateEMI() {
  // Use fallback to 0 if any input is empty.
  let P = parseFloat(document.getElementById("loanAmount").value) || 0;
  let annualRate = parseFloat(document.getElementById("interestRate").value) || 0;
  let years = parseInt(document.getElementById("years").value) || 0;
  let months = parseInt(document.getElementById("months").value) || 0;

  // Ensure non-negative values.
  if (P < 0 || annualRate < 0 || years < 0 || months < 0) {
    alert("Please enter valid non-negative values.");
    return;
  }

  let totalMonths = years * 12 + months; // Total tenure in months.
  let EMI = 0, totalAmount = 0, totalInterest = 0;

  if (totalMonths === 0) {
    // If tenure is 0 months, avoid division by zero.
    EMI = 0;
    totalAmount = P;
    totalInterest = 0;
  } else if (calcMethod === "flat") {
    // Flat Rate Method:
    totalInterest = P * (annualRate / 100) * (totalMonths / 12);
    totalAmount = P + totalInterest;
    EMI = totalAmount / totalMonths;
    EMI = Math.round(EMI);
  } else {
    // Reducing Balance Method.
    let monthlyRate = annualRate / 12 / 100;
    if (annualRate === 0) {
      EMI = P / totalMonths;
      EMI = Math.round(EMI);
      totalAmount = EMI * totalMonths;
      totalInterest = totalAmount - P;
    } else {
      EMI = (P * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
            (Math.pow(1 + monthlyRate, totalMonths) - 1);
      EMI = Math.round(EMI);
      totalAmount = EMI * totalMonths;
      totalInterest = totalAmount - P;
    }
  }

  // Display results (using rupeeSuffix appended after the formatted number).
  document.getElementById("principalAmount").textContent =
    formatIndianCurrency(P) + rupeeSuffix;
  document.getElementById("durationDetail").textContent =
    years + " years " + months + " months";
  document.getElementById("emiAmount").textContent =
    formatIndianCurrency(EMI) + rupeeSuffix;
  document.getElementById("totalInterest").textContent =
    formatIndianCurrency(totalInterest) + rupeeSuffix;
  document.getElementById("totalAmount").textContent =
    formatIndianCurrency(totalAmount) + rupeeSuffix;

  document.getElementById("result").style.display = "block";
  
  // Show the Download Report button after calculation.
  document.getElementById("downloadBtn").style.display = "block";

  // Draw/Update the pie chart with Principal vs. Interest.
  updateChart(P, totalInterest);
}

// Draw or update the Chart.js pie chart.
function updateChart(principal, interest) {
  const ctx = document.getElementById("emiChart").getContext("2d");

  // If a chart already exists, destroy it before creating a new one.
  if (emiChart) {
    emiChart.destroy();
  }

  emiChart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["Principal", "Interest"],
      datasets: [
        {
          data: [principal, interest],
          backgroundColor: ["#007bff", "#ffcc00"],
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "bottom" },
        title: { display: true, text: "Loan Breakdown" },
      },
    },
  });
}

// Dark Mode Toggle.
document.getElementById("themeToggle").addEventListener("change", function () {
  document.body.classList.toggle("dark-mode");
});

// Calculation Method Toggle: Switch between reducing and flat rate methods.
document.getElementById("calcSwitch").addEventListener("change", function () {
  if (this.checked) {
    calcMethod = "flat";
    document.getElementById("calcLabel").textContent = "Flat Rate Method";
  } else {
    calcMethod = "reducing";
    document.getElementById("calcLabel").textContent = "Reducing Balance Method";
  }
});

// Generate PDF Report using jsPDF without a table.
// The EMI value is shown in a larger, bold font.
// An extra line is added to indicate the calculation method used.
function downloadPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Use a built-in bold font; here "helvetica" in bold is used for the header.
  doc.setFont("helvetica", "bold");

  // Set header (centered)
  doc.setFontSize(22);
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.text("EMI Calculation Report", pageWidth / 2, 20, { align: "center" });

  // Set normal text size for details and revert to normal font style
  doc.setFontSize(16);
  doc.setFont("helvetica", "normal");

  let yPosition = 35; // starting Y position for the content

  // Print details line by line
  doc.text(
    `Loan Amount: ${formatIndianCurrency(document.getElementById("loanAmount").value || 0)}${rupeeSuffix}`,
    20,
    yPosition
  );
  yPosition += 10;
  doc.text(
    `Annual Interest Rate: ${document.getElementById("interestRate").value || 0} %`,
    20,
    yPosition
  );
  yPosition += 10;
  doc.text(
    `Tenure: ${document.getElementById("years").value || 0} years ${document.getElementById("months").value || 0} months`,
    20,
    yPosition
  );
  yPosition += 15;
  
  
  // EMI line in a slightly bigger, bold font
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  // Remove the suffix from the displayed text before formatting (if any)
  doc.text(
    `EMI: ${formatIndianCurrency(document.getElementById("emiAmount").textContent.replace(rupeeSuffix, "") || 0)}${rupeeSuffix}`,
    20,
    yPosition
  );
  yPosition += 15;
  
  // Return to normal font for the remaining details
  doc.setFont("helvetica", "normal");
  doc.setFontSize(16);
  doc.text(
    `Total Interest: ${formatIndianCurrency(document.getElementById("totalInterest").textContent.replace(rupeeSuffix, "") || 0)}${rupeeSuffix}`,
    20,
    yPosition
  );
  yPosition += 10;
  doc.text(
    `Total Amount Paid: ${formatIndianCurrency(document.getElementById("totalAmount").textContent.replace(rupeeSuffix, "") || 0)}${rupeeSuffix}`,
    20,
    yPosition
  );
  yPosition += 10;
  // Add the Calculation Method used
  doc.setFontSize(10);
  const methodLabel = calcMethod === "flat" ? "Flat Rate Method" : "Reducing Balance Method";
  doc.text(`Calculation Method: ${methodLabel}`, 20, yPosition);
  yPosition += 15;

  // Save the PDF
  doc.save("EMI_Report.pdf");
}

