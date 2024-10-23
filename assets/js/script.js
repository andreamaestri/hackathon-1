// PATH Parameters
const now = new Date();
const next = new Date(now);
next.setMinutes(now.getMinutes() + 60);

let periodFrom = now.toISOString();
let periodTo = next.toISOString();

let productCode = "AGILE-24-10-01";
let tariffCode = "E-1R-AGILE-24-10-01-L";

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
      rateNowEl.innerText = currentRate;

      // Extract validFrom and validTo
      let validFrom = new Date(currentResult.valid_from);
      let validTo = new Date(currentResult.valid_to);

      // Format and display the time slot
      let currentSlot = timeSlot(validFrom, validTo);
      console.log("The current slot now is: " + currentSlot);
      timeNowEl.innerText = currentSlot;

      // Extract next rate and time slot
      let nextRate = parseFloat(nextResult.value_inc_vat).toFixed(2) + "p";
      console.log("Next rate (including VAT):", nextRate);
      rateNextEl.innerText = nextRate;

      // Extract validFrom and validTo for next time slot
      let validFromNext = new Date(nextResult.valid_from);
      let validToNext = new Date(nextResult.valid_to);

      // Display the next time slot
      let nextSlot = timeSlot(validFromNext, validToNext);
      console.log("The next slot is: " + nextSlot);
      timeNextEl.innerText = nextSlot;
      // Calculate trend and apply dynamic color
      let rateChange =
        ((parseFloat(nextResult.value_inc_vat) -
          parseFloat(currentResult.value_inc_vat)) /
          parseFloat(currentResult.value_inc_vat)) *
        100;
      let trendArrow = rateChange > 0 ? "↗︎" : "↘︎";
      let trendText = `${trendArrow} ${Math.abs(rateChange).toFixed(2)}%`;
      // Update next rate with trend
      trendEl.innerText = `${trendText}`;

      // Apply text color class dynamically
      if (rateChange < 0) {
        trendEl.classList.add("text-violet-500"); // Cheaper
        trendEl.classList.remove("text-pink-600");
      } else {
        trendEl.classList.add("text-pink-600"); // More expensive
        trendEl.classList.remove("text-violet-500");
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
// Fetch 1-Day API Data
let dayRate = [];

fetch(dayApiUrl)
  .then((response) => response.json())
  .then((data) => {
    if (data.results && data.results.length > 0) {
      // Filter results for future time slots
      let filteredResults = data.results.filter((result) => {
        let validFrom = new Date(result.valid_from);
        return validFrom >= now; // Only keep future time slots
      });

      // Store valid rates in dayRate array
      filteredResults.forEach((result) => {
        let dayRatePrice = parseFloat(result.value_inc_vat);
        let dayRateValidFrom = new Date(result.valid_from);
        let dayRateValidTo = new Date(result.valid_to);
        dayRate.push({ dayRatePrice, dayRateValidFrom, dayRateValidTo });
      });

      // Sort by price
      dayRate.sort((a, b) => a.dayRatePrice - b.dayRatePrice);

      // Get top 3 cheapest slots
      let top3Cheapest = dayRate.slice(0, 3);

      top3Cheapest.forEach((slot, index) => {
        console.log(`Top ${index + 1} Cheapest Time Slot: "${timeSlot(slot.dayRateValidFrom, slot.dayRateValidTo)}" at ${slot.dayRatePrice.toFixed(2)}p`);
      });
    } else {
      console.log("No results found.");
    }
  })
  .catch((error) => {
    console.error("There was a problem with the fetch operation:", error);
  });


// Function to format the time slot
function timeSlot(validFrom, validTo) {
  let hour = validFrom.getUTCHours();
  let minute = validFrom.getUTCMinutes();
  let hourNext = validTo.getUTCHours();
  let minuteNext = validTo.getUTCMinutes();

  // Ensure validTo is at least one minute after validFrom
  if (hour === hourNext && minute === minuteNext) {
    validTo.setUTCMinutes(validTo.getUTCMinutes() + 1);
    hourNext = validTo.getUTCHours();
    minuteNext = validTo.getUTCMinutes();
  }

  return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")} - ${hourNext.toString().padStart(2, "0")}:${minuteNext.toString().padStart(2, "0")}`;
}
