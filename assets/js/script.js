// PATH Parameters
const now = new Date();
const next = new Date(now);
next.setMinutes(now.getMinutes() + 30);

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
      let currentResult = data.results[0];

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
    } else {
      console.log("No results found.");
    }
  })
  .catch((error) => {
    console.error("Error:", error); 
  });

// Function to format the time slot
function timeSlot(validFrom, validTo) {
    let hour = validFrom.getHours();
    let minute = validFrom.getMinutes();
    let hourNext = validTo.getHours();
    let minuteNext = validTo.getMinutes();

    return `${hour}:${minute.toString().padStart(2, '0')} - ${hourNext}:${minuteNext.toString().padStart(2, '0')}`;
}

let timeNowEl = document.getElementById("time-el-now");
let rateNowEl = document.getElementById("rate-el-now");
