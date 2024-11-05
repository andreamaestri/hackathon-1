/** Function to fetch unit rates for electricity from the Octopus Energy API*/ 
async function fetchUnitRates(periodFrom, periodTo) {
    const url = `https://api.octopus.energy/v1/products/AGILE-24-10-01/electricity-tariffs/E-1R-AGILE-24-10-01-C/standard-unit-rates/?period_from=${periodFrom}&period_to=${periodTo}`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();
        console.log(data); // Log the entire response to ensure you're receiving data
        return data.results || []; // Return the list of unit rates or empty array if undefined
    } catch (error) {
        console.error('Error fetching data:', error);
        return []; // Return empty array on error
    }
}

function getCurrentDateRange() {
    const now = new Date();
    const periodFrom = new Date(now.setUTCHours(0, 0, 0, 0)); // Today at midnight UTC
    const periodTo = new Date(periodFrom);
    periodTo.setUTCDate(periodTo.getUTCDate() + 1); // Tomorrow at midnight UTC

    return {
        periodFrom: periodFrom.toISOString(),
        periodTo: periodTo.toISOString(),
    };
}

async function processUnitRates() {
    const { periodFrom, periodTo } = getCurrentDateRange();
    const ratesData = await fetchUnitRates(periodFrom, periodTo);

    if (!ratesData.length) {
        console.log("No data received from the API");
        return; // Exit if no data is returned
    }

    const timeLabels = ratesData.map(rate => new Date(rate.valid_from).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    const unitRates = ratesData.map(rate => rate.value_inc_vat); // Use the rate including VAT

    plotGraph(timeLabels, unitRates);
}

function plotGraph(timeLabels, unitRates) {
    const ctx = document.getElementById('myChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: timeLabels,
            datasets: [{
                label: 'Unit Rate (pence per kWh)',
                data: unitRates,
                backgroundColor: 'rgba(167,254,237,0.5)', // Light version of the last color
                borderColor: '#0B666A', // Main line color
                borderWidth: 2, // Thicker line for better visibility
                fill: true, // Fill area under the line for a more pronounced effect
                pointBackgroundColor: '#35A29F', // Point color for data points
                pointBorderColor: '#071952', // Border color for points
                pointBorderWidth: 2,
                pointRadius: 4, // Size of the points
                tension: 0.3 // Smooth the line
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: { display: true, text: 'Time', color: '#FFF', font: { weight: 'bold' } },
                    grid: { color: '#FFF', lineWidth: 1 }, // Grid color for x-axis
                    reverse: true, // Reversing the x-axis
                    ticks: {
                        color: '#FFF'
                    }
                },
                y: {
                    title: { display: true, text: 'Cost (pence per kWh)', color: '#FFF', font: { weight: 'bold' } },
                    grid: { color: '#FFF', lineWidth: 1 }, // Grid color for y-axis
                    beginAtZero: false,
                    ticks: {
                        color: '#FFF', // Color for y-axis ticks
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: '#FFF', // Color for legend labels
                        font: {
                            weight: 'bold' // Bold legend labels
                        }
                    }
                },
                tooltip: {
                    backgroundColor: '#AD49E1', // Tooltip background color
                    titleColor: '#FFFFFF', // Tooltip title color
                    bodyColor: '#FFFFFF', // Tooltip body text color
                    borderColor: '#AD49E1', // Tooltip border color
                    borderWidth: 1
                }
            }
        }
    });
}

processUnitRates();