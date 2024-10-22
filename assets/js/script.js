/** Function to fetch unit rates for electricity from the Octopus Energy API*/ 
// Function to fetch unit rates from Octopus Energy API
async function fetchUnitRates(periodFrom, periodTo) {
    const url = `https://api.octopus.energy/v1/products/AGILE-24-10-01/electricity-tariffs/E-1R-AGILE-24-10-01-C/standard-unit-rates/?period_from=${periodFrom}&period_to=${periodTo}`;

    try {
        const response = await fetch(url);

        if (response.ok) {
            const data = await response.json();
            console.log(data);  // Log the entire response to ensure you're receiving data
            return data.results;  // Return the list of unit rates
        } else {
            console.error('Failed to fetch data:', response.status, response.statusText);
        }
    } catch (error) {
        console.error('Error fetching data:', error);
    }
    return [];
}

// Function to get the current date range for the API request
function getCurrentDateRange() {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0'); // Month is 0-based
    const day = String(now.getUTCDate()).padStart(2, '0');

    // Midnight of the current day
    const periodFrom = `${year}-${month}-${day}T00:00:00Z`;
    
    // Midnight of the next day (i.e., start of the next day)
    const nextDay = new Date(now);
    nextDay.setUTCDate(now.getUTCDate() + 1);
    const nextYear = nextDay.getUTCFullYear();
    const nextMonth = String(nextDay.getUTCMonth() + 1).padStart(2, '0');
    const nextDayNum = String(nextDay.getUTCDate()).padStart(2, '0');
    const periodTo = `${nextYear}-${nextMonth}-${nextDayNum}T00:00:00Z`;

    return { periodFrom, periodTo };
}

// Function to process and format the data for graphing
async function processUnitRates() {
    const ratesData = await fetchUnitRates();
    
    // Prepare arrays to hold the time intervals and unit rates
    const timeLabels = [];
    const unitRates = [];

    ratesData.forEach(rate => {
        const time = new Date(rate.valid_from).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const unitRate = rate.value_inc_vat;  // Use the rate including VAT

        timeLabels.push(time);  // Push the time for the x-axis
        unitRates.push(unitRate);  // Push the rate for the y-axis
    });

    // Call function to plot the graph using this data
    plotGraph(timeLabels, unitRates);
}

// Function to plot the graph using Chart.js
function plotGraph(timeLabels, unitRates) {
    const ctx = document.getElementById('myChart').getContext('2d');

    const myChart = new Chart(ctx, {
        type: 'line',  // Type of chart: line graph
        data: {
            labels: timeLabels,  // Time intervals as x-axis labels
            datasets: [{
                label: 'Unit Rate (pence per kWh)',
                data: unitRates,  // Unit rates as y-axis data
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1,
                fill: false,  // Line chart without filling
            }]
        },
        options: {
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Time'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Cost (pence per kWh)'
                    },
                    beginAtZero: false
                }
            }
        }
    });
}

// Call the function to fetch, process, and plot the data
processUnitRates();

