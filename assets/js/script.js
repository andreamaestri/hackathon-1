/** Function to fetch unit rates for electricity from the Octopus Energy API*/ 
async function fetchUnitRates() {
    const url = 'https://api.octopus.energy/v1/products/AGILE-24-10-01/electricity-tariffs/E-1R-AGILE-24-10-01-C/standard-unit-rates/';

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

