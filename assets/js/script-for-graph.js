async function fetchUnitRates(periodFrom, periodTo) {
    const url = `https://api.octopus.energy/v1/products/AGILE-24-10-01/electricity-tariffs/E-1R-AGILE-24-10-01-C/standard-unit-rates/?period_from=${periodFrom}&period_to=${periodTo}`;
    
    console.log(`Fetching data from URL: ${url}`); // Log the API URL

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();
        return data.results || [];
    } catch (error) {
        console.error('Error fetching data:', error);
        return [];
    }
}

function getCurrentDateRange() {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let endOfDay;
    if (now.getHours() < 16) {
        endOfDay = new Date(startOfDay.getTime() + 22.5 * 60 * 60 * 1000); // Until 22:30 if before 4pm
    } else {
        endOfDay = new Date(startOfDay.getTime() + 48 * 60 * 60 * 1000 - 1); // End of the next day
    }
    return {
        periodFrom: startOfDay.toISOString(),
        periodTo: endOfDay.toISOString(),
    };
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

async function processUnitRates() {
    const { periodFrom, periodTo } = getCurrentDateRange();
    const ratesData = await fetchUnitRates(periodFrom, periodTo);

    if (!ratesData.length) {
        console.log("No data received from the API");
        return;
    }

    // Filter out past data
    const now = new Date();
    const futureRatesData = ratesData.filter(rate => new Date(rate.valid_from) > now);

    if (!futureRatesData.length) {
        console.log("No future data available");
        return;
    }

    // Sort futureRatesData by valid_from date
    futureRatesData.sort((a, b) => new Date(a.valid_from) - new Date(b.valid_from));

    futureRatesData.forEach(rate => {
        console.log(`Date: ${rate.valid_from}, Unit Rate: ${rate.value_inc_vat}`); // Log each unit rate and its date
    });

    const timeLabels = futureRatesData.map(rate => new Date(rate.valid_from).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    const unitRates = futureRatesData.map(rate => rate.value_inc_vat);
    const formattedDates = futureRatesData.map(rate => formatDate(rate.valid_from));

    plotGraph(timeLabels, unitRates, formattedDates);
    updateCustomAxis(futureRatesData);
    updateClockWithRateTime(futureRatesData[0]);
}

function plotGraph(timeLabels, unitRates, formattedDates) {
    const canvas = document.getElementById('myChart');
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createLinearGradient(0, 0, 0, 450);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.5)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)'); //

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: timeLabels,
            datasets: [{
                label: `Unit Rate (pence per kWh)`,
                data: unitRates,
                backgroundColor: gradient,
                borderColor: 'rgba(255, 255, 255, 0.2)',
                borderWidth: 2,
                pointBackgroundColor: 'transparent',
                pointBorderColor: '#FFFFFF',
                pointBorderWidth: 3,
                pointHoverBorderColor: 'rgba(255, 255, 255, 0.2)',
                pointHoverBorderWidth: 10,
                fill: true,
                tension: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            elements: {
                point: {
                    radius: 6,
                    hitRadius: 6,
                    hoverRadius: 6
                }
            },
            scales: {
                x: {
                    display: false
                },
                y: {
                    display: false,
                    ticks: {
                        beginAtZero: true
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'transparent',
                    displayColors: false,
                    bodyFontSize: 16,
                    callbacks: {
                        label: function(tooltipItems) {
                            return `${tooltipItems.raw.toFixed(2)} p/kWh - ${formattedDates[tooltipItems.dataIndex]}`;
                        }
                    }
                }
            }
        }
    });
}

function updateCustomAxis(ratesData) {
    const customAxis = document.getElementById('customAxis');
    customAxis.innerHTML = '';

    ratesData.forEach(rate => {
        const tick = document.createElement('div');
        tick.className = 'tick';

        const value = document.createElement('span');
        value.className = 'value value--this';
        value.textContent = `${rate.value_inc_vat.toFixed(2)}p`;

        const time = document.createElement('span');
        time.className = 'time';
        time.textContent = new Date(rate.valid_from).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        tick.appendChild(time);
        tick.appendChild(value);
        customAxis.appendChild(tick);
    });
}

function formatTimeFromDate(dateString) {
    const date = new Date(dateString);
    return {
        hours: String(date.getHours()).padStart(2, "0"),
        minutes: String(date.getMinutes()).padStart(2, "0"),
        seconds: String(date.getSeconds()).padStart(2, "0")
    };
}

function updateClockWithRateTime(rate) {
    const { hours, minutes, seconds } = formatTimeFromDate(rate.valid_from);
    document.getElementById("hours").style.setProperty("--value", hours);
    document.getElementById("minutes").style.setProperty("--value", minutes);
    document.getElementById("seconds").style.setProperty("--value", seconds);
}

processUnitRates();
