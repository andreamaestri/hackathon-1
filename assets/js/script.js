// Load settings from localStorage
const mpan = localStorage.getItem('mpan') || '';
const productCode = localStorage.getItem('productCode') || 'AGILE-24-10-01';
const periodFrom = localStorage.getItem('periodFrom') || new Date().toISOString();
const periodTo = localStorage.getItem('periodTo') || new Date(new Date().getTime() + 60 * 60 * 1000).toISOString();
const topNCheapest = parseInt(localStorage.getItem('topNCheapest')) || 3;
const topNExpensive = parseInt(localStorage.getItem('topNExpensive')) || 6;
const apiFetchInterval = parseInt(localStorage.getItem('apiFetchInterval')) || 60000;

// Function to determine region code from MPAN
function getRegionCode(mpan) {
  const regionCodes = {
    '10': 'A', '11': 'B', '12': 'C', '13': 'D', '14': 'E', '15': 'F', '16': 'G', '17': 'P',
    '18': 'N', '19': 'J', '20': 'H', '21': 'K', '22': 'L', '23': 'M'
  };
  const mpanPrefix = mpan.slice(0, 2);
  return regionCodes[mpanPrefix] || 'L'; // Default to 'L' if not found
}

const regionCode = getRegionCode(mpan);
const tariffCode = `E-1R-AGILE-24-10-01-${regionCode}`;

let currentRate;

// Define API Endpoint URL using backticks for template literals
let apiUrl = `https://api.octopus.energy/v1/products/${productCode}/electricity-tariffs/${tariffCode}/standard-unit-rates/?period_from=${periodFrom}&period_to=${periodTo}`;

console.log(apiUrl); // Outputs the correct URL
console.log(periodFrom); // Logs 'period_from' (now)
console.log(periodTo); // Logs 'period_to' (30 minutes later)

fetch(apiUrl)
  .then((response) => {
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    return response.json();
  })
  .then((data) => {
    if (data.results && data.results.length > 0) {
      let currentResult = data.results[1];
      let nextResult = data.results[0];

      // Extract the current rate and display it
      currentRate = parseFloat(currentResult.value_inc_vat).toFixed(2) + "p";
      console.log("Current rate (including VAT):", currentRate);
      document.getElementById("rateNowEl").innerText = currentRate;

      // Extract validFrom and validTo
      let validFrom = new Date(currentResult.valid_from);
      let validTo = new Date(currentResult.valid_to);

      // Format and display the time slot
      let currentSlot = timeSlot(validFrom, validTo);
      console.log("The current slot now is: " + currentSlot);
      document.getElementById("timeNowEl").innerText = currentSlot;

      // Extract next rate and time slot
      let nextRate = parseFloat(nextResult.value_inc_vat).toFixed(2) + "p";
      console.log("Next rate (including VAT):", nextRate);
      document.getElementById("rateNextEl").innerText = nextRate;

      // Extract validFrom and validTo for next time slot
      let validFromNext = new Date(nextResult.valid_from);
      let validToNext = new Date(nextResult.valid_to);

      // Display the next time slot
      let nextSlot = timeSlot(validFromNext, validToNext);
      console.log("The next slot is: " + nextSlot);
      document.getElementById("timeNextEl").innerText = nextSlot;

      // Calculate trend and apply dynamic color
      let rateChange =
        ((parseFloat(nextResult.value_inc_vat) -
          parseFloat(currentResult.value_inc_vat)) /
          parseFloat(currentResult.value_inc_vat)) *
        100;
      let trendArrow = rateChange > 0 ? "↗︎" : "↘︎";
      let trendText = `${trendArrow} ${Math.abs(rateChange).toFixed(2)}%`;
      // Update next rate with trend
      document.getElementById("trendEl").innerText = `${trendText}`;

      // Apply text color class dynamically
      if (rateChange < 0) {
        document.getElementById("trendEl").classList.add("text-violet-500"); // Cheaper
        document.getElementById("trendEl").classList.remove("text-pink-600");
      } else {
        document.getElementById("trendEl").classList.add("text-pink-600"); // More expensive
        document.getElementById("trendEl").classList.remove("text-violet-500");
      }
    } else {
      console.log("No results found.");
    }
  })
  .catch((error) => {
    console.error("Error:", error);
  });

//Day Parameters
const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

//Check if next-day data is published at 9:30
function isEndOfDay(now) {
  return now.getHours() >= 21 && now.getMinutes() >= 30;
}

const endOfDay = isEndOfDay(now)
  ? new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)
  : new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);
  // Retrieve 1-Day JSON request
  let dayPeriodFrom = startOfDay.toISOString();
  let dayPeriodTo = endOfDay.toISOString();

  let dayApiUrl = `https://api.octopus.energy/v1/products/${productCode}/electricity-tariffs/${tariffCode}/standard-unit-rates/?period_from=${dayPeriodFrom}&period_to=${dayPeriodTo}`;

  // Function to format the time slot
  function timeSlot(validFrom, validTo) {
    let hour = validFrom.getUTCHours();
    let minute = validFrom.getUTCMinutes();
    let hourNext = validTo.getUTCHours();
    let minuteNext = validTo.getUTCMinutes();

    return `${hour.toString().padStart(2, "0")}:${minute
      .toString()
      .padStart(2, "0")} - ${hourNext.toString().padStart(2, "0")}:${minuteNext
      .toString()
      .padStart(2, "0")}`;
  }

  // Fetch 1-Day API Data
  fetch(dayApiUrl)
    .then((response) => response.json())
    .then((data) => {
      if (data.results && data.results.length > 0) {
        // Filter results for future time slots
        let filteredResults = data.results.filter((result) => {
          let validFrom = new Date(result.valid_from);
          return validFrom >= now; // Only keep future time slots
        });

        // Reverse the order since the API provides the latest times first
        filteredResults.reverse();

        // Store valid rates in dayRate array
        let dayRate = [];
        filteredResults.forEach((result) => {
          let dayRatePrice = parseFloat(result.value_inc_vat);
          let dayRateValidFrom = new Date(result.valid_from);
          let dayRateValidTo = new Date(result.valid_to);
          dayRate.push({ dayRatePrice, dayRateValidFrom, dayRateValidTo });
        });

        // Calculate average price
        let totalPrices = dayRate.reduce((sum, slot) => sum + slot.dayRatePrice, 0);
        let averagePrice = totalPrices / dayRate.length;

        // Display as table for debugging 
        console.table(dayRate.map(slot => ({
          TimeSlot: timeSlot(slot.dayRateValidFrom, slot.dayRateValidTo),
          Price: `${slot.dayRatePrice.toFixed(2)}p ~`
        })));

        // Sort by price in ascending order to get the cheapest slots
        dayRate.sort((a, b) => a.dayRatePrice - b.dayRatePrice);

        // Get the top N cheapest slots
        let topNCheapestRates = dayRate.slice(0, topNCheapest);

        // Display top N cheapest rates
        for (let i = 0; i < topNCheapest; i++) {
          document.getElementById(`rate${i + 1}`).innerHTML = `<div class="badge badge-success gap-2">${topNCheapestRates[i].dayRatePrice.toFixed(2)}p</div>`;
          document.getElementById(`timeSlot${i + 1}`).innerText = timeSlot(
            topNCheapestRates[i].dayRateValidFrom,
            topNCheapestRates[i].dayRateValidTo
          );
          document.getElementById(`trend${i + 1}`).innerHTML = `<div class="badge badge-info gap-2">${
            topNCheapestRates[i].dayRatePrice < 0 ? "Plunge Pricing" : "Low"
          }</div>`;
        }

        // Sort by price in descending order to get the most expensive slots
        dayRate.sort((a, b) => b.dayRatePrice - a.dayRatePrice);

        // Get the top N most expensive slots
        let topNExpensiveRates = dayRate.slice(0, topNExpensive);

        // Display top N expensive rates
        for (let i = 0; i < topNExpensive; i++) {
          document.getElementById(`expensiveRate${i + 1}`).innerHTML = `<div class="badge badge-danger gap-2">${topNExpensiveRates[i].dayRatePrice.toFixed(2)}p</div>`;
          document.getElementById(`expensiveTimeSlot${i + 1}`).innerText = timeSlot(
            topNExpensiveRates[i].dayRateValidFrom,
            topNExpensiveRates[i].dayRateValidTo
          );
          document.getElementById(`expensiveTrend${i + 1}`).innerHTML = `<div class="badge badge-info gap-2">${
            topNExpensiveRates[i].dayRatePrice > averagePrice ? "High" : "Moderate"
          }</div>`;
        }

      } else {
        console.log("No results found.");
      }
    })
    .catch((error) => {
      console.error("There was a problem with the fetch operation:", error);
    });

//Clock
window.addEventListener("load", () => {
  clock();

  function clock() {
    const today = new Date();

    // Get hours, minutes, and seconds and pad with '0' if less than 10
    const hours = String(today.getHours()).padStart(2, "0");
    const minutes = String(today.getMinutes()).padStart(2, "0");
    const seconds = String(today.getSeconds()).padStart(2, "0");

    // Update the respective elements in the HTML using CSS variables
    document.getElementById("hours").style.setProperty("--value", hours);
    document.getElementById("minutes").style.setProperty("--value", minutes);
    document.getElementById("seconds").style.setProperty("--value", seconds);

    // Call the function again every second
    setTimeout(clock, 1000);
  }
});

