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
      currentRate = currentResult.value_inc_vat + "p";
      console.log("Current rate (including VAT):", currentRate);
      rateNowEl.innerText = currentRate;
    } else {
      console.log("No results found.");
    }
  })
  .catch((error) => {
    console.error("Error:", error); // Handle any errors
  });
let nextTime = 1000 * 60 * 30;
let nextT = new Date(Math.round(now.getTime() / nextTime) * nextTime);
 
console.log(nextT);

function timeSlot(now, nextT) {
    let hour = now.getHours();
    let minute = now.getMinutes();
    let hourNext = nextT.getHours();
    let minuteNext = nextT.getMinutes();

    return hour + ":" + minute + " - " + hourNext + ":" + minuteNext;
}
let currentSlot = timeSlot(now, nextT);
console.log("The current slot now is: " + currentSlot);

let timeNowEl = document.getElementById("time-el-now");
let rateNowEl = document.getElementById("rate-el-now");

console.log(timeNowEl);

timeNowEl.innerText = currentSlot;
rateNowEl.innerText = currentRate;