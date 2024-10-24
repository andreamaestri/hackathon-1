// PATH Parameters
const now = new Date();
const next = new Date(now);
next.setMinutes(now.getMinutes() + 60);

let periodFrom = now.toISOString();
let periodTo = next.toISOString();
// Retrieve region code from settings or use default 'L'
let regionCode = localStorage.getItem("regionCode") || "L";

// Set product and tariff codes
let productCode = "AGILE-24-10-01";
let tariffCode = `E-1R-AGILE-24-10-01-${regionCode}`;

let currentRate;

// Event listener for settings form submission (desktop)
document.getElementById('settingsForm').addEventListener('submit', function(event) {
  event.preventDefault();
  const regionCode = document.getElementById('regionCode').value;

  localStorage.setItem('regionCode', regionCode);

  alert('Settings saved!');
  document.getElementById('settings').close();
  location.reload(); // Auto-refresh the page
});

// Event listener for settings form submission (mobile)
document.getElementById('settingsFormMobile').addEventListener('submit', function(event) {
  event.preventDefault();
  const regionCode = document.getElementById('regionCodeMobile').value;

  localStorage.setItem('regionCode', regionCode);

  alert('Settings saved!');
  document.getElementById('settings-mobile').close();
  location.reload(); // Auto-refresh the page
});

// Load settings on page load
window.addEventListener('load', function() {
  document.getElementById('regionCode').value = localStorage.getItem('regionCode') || 'L';
});



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

      // Display as table for debugging
      console.table(dayRate.map(slot => ({
        TimeSlot: timeSlot(slot.dayRateValidFrom, slot.dayRateValidTo),
        Price: `${slot.dayRatePrice.toFixed(2)}p`
      })));

      // Sort by price in descending order to get the most expensive slots
      dayRate.sort((a, b) => b.dayRatePrice - a.dayRatePrice);

      // Get the top 6 most expensive slots
      let top6Expensive = dayRate.slice(0, 6);

      // Find the earliest start time and the latest end time among the top 6 expensive slots
      let earliestStartTime = top6Expensive[0].dayRateValidFrom;
      let latestEndTime = top6Expensive[0].dayRateValidTo;

      top6Expensive.forEach(slot => {
        if (slot.dayRateValidFrom < earliestStartTime) {
          earliestStartTime = slot.dayRateValidFrom;
        }
        if (slot.dayRateValidTo > latestEndTime) {
          latestEndTime = slot.dayRateValidTo;
        }
      });

      // Format the time slot for the most expensive rates
      let expensiveTimeSlot = `${timeSlot(earliestStartTime, latestEndTime)}`;

      // Update the highest rate and time slot in the HTML
      document.getElementById("highUsageRateEl").innerText = `${top6Expensive[0].dayRatePrice.toFixed(2)}p`;
      document.getElementById("highUsageTimeEl").innerText = expensiveTimeSlot;

      // Display the top 6 expensive slots for debugging
      top6Expensive.forEach((slot, index) => {
        console.log(
          `Top ${index + 1} Expensive Time Slot: "${timeSlot(
            slot.dayRateValidFrom,
            slot.dayRateValidTo
          )}" at ${slot.dayRatePrice.toFixed(2)}p`
        );
      });

      // Display top 3 cheapest rates (existing functionality)
      let top3Cheapest = dayRate.slice(dayRate.length - 3);

      document.getElementById(
        "rate1"
      ).innerHTML = `<div class="badge badge-success gap-2">${top3Cheapest[0].dayRatePrice.toFixed(2)}p</div>`;
      document.getElementById(
        "rate2"
      ).innerHTML = `<div class="badge badge-success gap-2">${top3Cheapest[1].dayRatePrice.toFixed(2)}p</div>`;
      document.getElementById(
        "rate3"
      ).innerHTML = `<div class="badge badge-success gap-2">${top3Cheapest[2].dayRatePrice.toFixed(2)}p</div>`;

      document.getElementById("timeSlot1").innerText = timeSlot(
        top3Cheapest[0].dayRateValidFrom,
        top3Cheapest[0].dayRateValidTo
      );
      document.getElementById("timeSlot2").innerText = timeSlot(
        top3Cheapest[1].dayRateValidFrom,
        top3Cheapest[1].dayRateValidTo
      );
      document.getElementById("timeSlot3").innerText = timeSlot(
        top3Cheapest[2].dayRateValidFrom,
        top3Cheapest[2].dayRateValidTo
      );

      // Determine and display trend
      document.getElementById("trend1").innerHTML = `<div class="badge badge-info gap-2">${
        top3Cheapest[0].dayRatePrice < 0 ? "Plunge Pricing" : "Low"
      }</div>`;
      document.getElementById("trend2").innerHTML = `<div class="badge badge-info gap-2">${
        top3Cheapest[1].dayRatePrice < 0 ? "Plunge Pricing" : "Low"
      }</div>`;
      document.getElementById("trend3").innerHTML = `<div class="badge badge-info gap-2">${
        top3Cheapest[2].dayRatePrice < 0 ? "Plunge Pricing" : "Low"
      }</div>`;
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

