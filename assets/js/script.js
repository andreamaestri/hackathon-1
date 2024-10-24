const now = new Date();
const next = new Date(now);
next.setMinutes(now.getMinutes() + 60);

let periodFrom = now.toISOString();
let periodTo = next.toISOString();
let regionCode = localStorage.getItem("regionCode") || "L";

let productCode = "AGILE-24-10-01";
let tariffCode = `E-1R-AGILE-24-10-01-${regionCode}`;

let currentRate;

document.getElementById('settingsForm').addEventListener('submit', function(event) {
  event.preventDefault();
  const regionCode = document.getElementById('regionCode').value;

  localStorage.setItem('regionCode', regionCode);

  alert('Settings saved!');
  document.getElementById('settings').close();
  location.reload();
});

document.getElementById('settingsFormMobile').addEventListener('submit', function(event) {
  event.preventDefault();
  const regionCode = document.getElementById('regionCodeMobile').value;

  localStorage.setItem('regionCode', regionCode);

  alert('Settings saved!');
  document.getElementById('settings-mobile').close();
  location.reload();
});

window.addEventListener('load', function() {
  document.getElementById('regionCode').value = localStorage.getItem('regionCode') || 'L';
});

let apiUrl = `https://api.octopus.energy/v1/products/${productCode}/electricity-tariffs/${tariffCode}/standard-unit-rates/?period_from=${periodFrom}&period_to=${periodTo}`;

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

      currentRate = parseFloat(currentResult.value_inc_vat).toFixed(2) + "p";
      document.getElementById("rateNowEl").innerText = currentRate;

      let validFrom = new Date(currentResult.valid_from);
      let validTo = new Date(currentResult.valid_to);

      let currentSlot = timeSlot(validFrom, validTo);
      document.getElementById("timeNowEl").innerText = currentSlot;

      let nextRate = parseFloat(nextResult.value_inc_vat).toFixed(2) + "p";
      document.getElementById("rateNextEl").innerText = nextRate;

      let validFromNext = new Date(nextResult.valid_from);
      let validToNext = new Date(nextResult.valid_to);

      let nextSlot = timeSlot(validFromNext, validToNext);
      document.getElementById("timeNextEl").innerText = nextSlot;

      let rateChange =
        ((parseFloat(nextResult.value_inc_vat) -
          parseFloat(currentResult.value_inc_vat)) /
          parseFloat(currentResult.value_inc_vat)) *
        100;
      let trendArrow = rateChange > 0 ? "↗︎" : "↘︎";
      let trendText = `${trendArrow} ${Math.abs(rateChange).toFixed(2)}%`;
      document.getElementById("trendEl").innerText = `${trendText}`;

      if (rateChange < 0) {
        document.getElementById("trendEl").classList.add("text-violet-500");
        document.getElementById("trendEl").classList.remove("text-pink-600");
      } else {
        document.getElementById("trendEl").classList.add("text-pink-600");
        document.getElementById("trendEl").classList.remove("text-violet-500");
      }
    } else {
      console.log("No results found.");
    }
  })
  .catch((error) => {
    console.error("Error:", error);
  });

const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

function isEndOfDay(now) {
  return now.getHours() >= 21 && now.getMinutes() >= 30;
}

const endOfDay = isEndOfDay(now)
  ? new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)
  : new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);

let dayPeriodFrom = startOfDay.toISOString();
let dayPeriodTo = endOfDay.toISOString();

let dayApiUrl = `https://api.octopus.energy/v1/products/${productCode}/electricity-tariffs/${tariffCode}/standard-unit-rates/?period_from=${dayPeriodFrom}&period_to=${dayPeriodTo}`;

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

fetch(dayApiUrl)
  .then((response) => response.json())
  .then((data) => {
    if (data.results && data.results.length > 0) {
      let filteredResults = data.results.filter((result) => {
        let validFrom = new Date(result.valid_from);
        return validFrom >= now;
      });

      filteredResults.reverse();

      let dayRate = [];
      filteredResults.forEach((result) => {
        let dayRatePrice = parseFloat(result.value_inc_vat);
        let dayRateValidFrom = new Date(result.valid_from);
        let dayRateValidTo = new Date(result.valid_to);
        dayRate.push({ dayRatePrice, dayRateValidFrom, dayRateValidTo });
      });

      dayRate.sort((a, b) => b.dayRatePrice - a.dayRatePrice);

      let top6Expensive = dayRate.slice(0, 6);

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

      let expensiveTimeSlot = `${timeSlot(earliestStartTime, latestEndTime)}`;

      document.getElementById("highUsageRateEl").innerText = `${top6Expensive[0].dayRatePrice.toFixed(2)}p`;
      document.getElementById("highUsageTimeEl").innerText = expensiveTimeSlot;

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

window.addEventListener("load", () => {
  clock();

  function clock() {
    const today = new Date();

    const hours = String(today.getHours()).padStart(2, "0");
    const minutes = String(today.getMinutes()).padStart(2, "0");
    const seconds = String(today.getSeconds()).padStart(2, "0");

    document.getElementById("hours").style.setProperty("--value", hours);
    document.getElementById("minutes").style.setProperty("--value", minutes);
    document.getElementById("seconds").style.setProperty("--value", seconds);

    setTimeout(clock, 1000);
  }
});
