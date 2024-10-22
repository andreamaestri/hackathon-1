// PATH Parameters
let product_code = 'AGILE-24-10-01';
let tariff_code = 'E-1R-AGILE-24-10-01-C';

// Define API Endpoint URL using backticks for template literals
let apiUrl = `https://api.octopus.energy/v1/products/${product_code}/electricity-tariffs/${tariff_code}/standard-unit-rates/`;

console.log(apiUrl);
