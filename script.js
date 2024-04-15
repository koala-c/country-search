const countryInput = document.getElementById('countryInput');
const suggestions = document.getElementById('suggestions');
let selectedSuggestionIndex = -1; // Initialize selected suggestion index
const OPENWEATHERMAP_API_KEY = process.env.OPENWEATHERMAP_API_KEY;

countryInput.addEventListener('input', function() {
    const searchTerm = this.value.trim();
    if (searchTerm.length === 0) {
        suggestions.innerHTML = '';
        suggestions.style.display = 'none';
        return;
    }

    // Call Restcountries API to get all countries
    fetch('https://restcountries.com/v3.1/all')
        .then(response => response.json())
        .then(data => {
            console.log("Data from API:", data); // Log data received from API
            suggestions.innerHTML = '';

            // Sort countries by prefix in ascending order
            data.sort((a, b) => {
                const prefixA = parseInt(a.idd && a.idd.root, 10);
                const prefixB = parseInt(b.idd && b.idd.root, 10);
                return prefixA - prefixB;
            });

            // Filter and display countries
            const filteredCountries = data.filter(country => {
                const countryName = country.name.common.toLowerCase();
                const countryPrefix = country.idd && country.idd.root && country.idd.suffixes ? (country.idd.root + country.idd.suffixes[0]).toLowerCase() : '';
                
                // Match with countryName or prefix starts with searchTerm
                return countryName.startsWith(searchTerm.toLowerCase()) || countryPrefix.startsWith(searchTerm.toLowerCase());
            });

            console.log("Filtered and sorted Countries:", filteredCountries); // Log filtered and sorted countries
            if (filteredCountries.length > 0) {
                filteredCountries.forEach(country => {
                    const countryName = country.name.common.toLowerCase();
                    const option = document.createElement('p');
                    option.textContent = countryName;
                    option.addEventListener('click', function() {
                        countryInput.value = countryName;
                        suggestions.innerHTML = '';
                        suggestions.style.display = 'none';
                        searchCountry(countryName);
                    });
                    suggestions.appendChild(option);
                });
                suggestions.style.display = 'block';
            } else {
                suggestions.innerHTML = '<p>No results found</p>';
                suggestions.style.display = 'block';
            }
        })
        .catch(error => {
            console.log("Error fetching country data:", error);
            suggestions.style.display = 'none';
        });
});


countryInput.addEventListener('keydown', function(event) {
    const suggestionsList = suggestions.querySelectorAll('p');

    if (event.key === 'ArrowDown') {
        selectedSuggestionIndex = Math.min(selectedSuggestionIndex + 1, suggestionsList.length - 1);
        highlightSuggestion(suggestionsList);
        scrollSuggestionIntoView(suggestionsList, selectedSuggestionIndex);
    } else if (event.key === 'ArrowUp') {
        selectedSuggestionIndex = Math.max(selectedSuggestionIndex - 1, -1);
        highlightSuggestion(suggestionsList);
        scrollSuggestionIntoView(suggestionsList, selectedSuggestionIndex);
    } else if (event.key === 'Enter') {
        if (selectedSuggestionIndex > -1) {
            suggestionsList[selectedSuggestionIndex].click();
        }
        selectedSuggestionIndex = -1;
    }
});

function highlightSuggestion(suggestions) {
    suggestions.forEach((suggestion, index) => {
        if (index === selectedSuggestionIndex) {
            suggestion.classList.add('selected');
        } else {
            suggestion.classList.remove('selected');
        }
    });
}

function scrollSuggestionIntoView(suggestionsList, selectedIndex) {
    const suggestionHeight = suggestionsList[0].offsetHeight; // Assuming all suggestions have same height
    const suggestionsContainerHeight = suggestions.offsetHeight;
    const suggestionTop = suggestionHeight * selectedIndex;
    const suggestionMidpoint = suggestionTop + (suggestionHeight / 2); // Calculate midpoint of suggestion

    // Scroll to keep the midpoint of the selected suggestion in view
    if (suggestionMidpoint < suggestionsContainerHeight / 2) {
        // Suggestion is in the top half, no need to scroll
    } else if (suggestionMidpoint > suggestionsList.length * suggestionHeight - suggestionsContainerHeight / 2) {
        // Suggestion is in the bottom half, scroll to bottom
        suggestions.scrollTop = suggestionsList.length * suggestionHeight - suggestionsContainerHeight;
    } else {
        // Suggestion needs to be centered, adjust scroll position
        suggestions.scrollTop = suggestionTop - suggestionsContainerHeight / 2 + suggestionHeight / 2;
    }
}

function searchCountry(countryName) {
    fetch(`https://restcountries.com/v3.1/name/${countryName}`)
        .then(response => response.json())
        .then(data => {
            const country = data[0];
            const languages = Object.values(country.languages);
            const languagesString = languages.join(', ');
            const timezones = Object.values(country.timezones);
            const timezonesString = timezones.join(', ');

            const countryInfo = document.getElementById('countryInfo');
            countryInfo.innerHTML = `
                <h2>Country Information:</h2>
                <p>Capital: ${country.capital}</p>
                <p>Population: ${country.population.toLocaleString('es-ES')}</p>
                <p>Languages: ${languagesString}</p>
                <p>Region: ${country.region}</p>
                <p>Subregion: ${country.subregion}</p>
                <p>Timezone: ${timezonesString}</p>
                <img id="countryFlag" src="${country.flags.png}" alt="Flag">
                <p id="currency">Currency: ${Object.values(country.currencies)[0].name} <span id="currencySymbol">${Object.values(country.currencies)[0].symbol}</span></p>
                <p>Prefix: ${country.idd.root}${country.idd.suffixes[0]}</p>
            `;

            fetch(`https://api.openweathermap.org/data/2.5/weather?q=${country.capital}&appid=${OPENWEATHERMAP_API_KEY}&units=metric`)
                .then(response => response.json())
                .then(weatherData => {
                    const weatherInfo = document.getElementById('weatherInfo');
                    const weatherDescription = weatherData.weather[0].description;
                    const capitalizedDescription = weatherDescription.charAt(0).toUpperCase() + weatherDescription.slice(1);
                    weatherInfo.innerHTML = `
                        <p>${weatherData.main.temp} °C | ${capitalizedDescription}</p>
                        <div class="weather-icon-container">
                            <img src="https://openweathermap.org/img/wn/${weatherData.weather[0].icon}.png" alt="Weather Icon - ${weatherData.weather[0].description}">
                        </div>
                    `;
                })
                .catch(error => {
                    console.log("Error fetching weather data:", error);
                });
        })
        .catch(error => {
            console.log("Error fetching country data:", error);
        });
}
