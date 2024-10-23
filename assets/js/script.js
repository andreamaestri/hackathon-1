// PATH Parameters
const now = new Date();
const next = new Date(now);
next.setMinutes(now.getMinutes() + 60);

//Day Parameters
const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1); 

let periodFrom = now.toISOString();
let periodTo = next.toISOString();

let productCode = "AGILE-24-10-01";
let tariffCode = "E-1R-AGILE-24-10-01-L";

let currentRate;

// Define API Endpoint URL using backticks for template literals
let apiUrl = `https://api.octopus.energy/v1/products/${productCode}/electricity-tariffs/${tariffCode}/standard-unit-rates/?period_from=${periodFrom}Z&period_to=${periodTo}Z`;

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

// Retrieve 1-Day JSON request
let dayPeriodFrom = startOfDay.toISOString();
let dayPeriodTo = endOfDay.toISOString();

let dayApiUrl = `https://api.octopus.energy/v1/products/${productCode}/electricity-tariffs/${tariffCode}/standard-unit-rates/?period_from=${dayPeriodFrom}Z&period_to=${dayPeriodTo}Z`;

// Function to format the time slot
function timeSlot(validFrom, validTo) {
  let hour = validFrom.getHours();
  let minute = validFrom.getMinutes();
  let hourNext = validTo.getHours();
  let minuteNext = validTo.getMinutes();

  return `${hour}:${minute
    .toString()
    .padStart(2, "0")} - ${hourNext}:${minuteNext.toString().padStart(2, "0")}`;
}

let timeNowEl = document.getElementById("time-el-now");
let rateNowEl = document.getElementById("rate-el-now");

let timeNextEl = document.getElementById("time-el-next");
let rateNextEl = document.getElementById("rate-el-next");
let trendEl = document.getElementById("trend-el");
