const API_KEY = "93cb6f32e21f8cfbd023aac1138fd0bb"; // βάλε εδώ το δικό σου

const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const errorEl = document.getElementById("error");
const loadingEl = document.getElementById("loading");
const resultEl = document.getElementById("result");
const cityNameEl = document.getElementById("cityName");
const tempEl = document.getElementById("temp");
const descriptionEl = document.getElementById("description");
const detailsEl = document.getElementById("details");
const sunriseEl = document.getElementById("sunrise");
const sunsetEl = document.getElementById("sunset");
const iconEl = document.getElementById("icon");
const forecastEl = document.getElementById("forecast");
const forecastItemsEl = document.getElementById("forecastItems");
const themeToggleBtn = document.getElementById("themeToggle");

console.log("Weather app JS loaded");

searchBtn.addEventListener("click", () => {
    const city = cityInput.value.trim();
    if (city === "") {
        showError("Please type a city name.");
        return;
    }
    getWeather(city);
});

cityInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        searchBtn.click();
    }
});

themeToggleBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    themeToggleBtn.textContent = document.body.classList.contains("dark")
        ? "Light mode"
        : "Dark mode";
});

function showError(message) {
    errorEl.textContent = message;
    resultEl.classList.add("hidden");
    forecastEl.classList.add("hidden");
}

function clearError() {
    errorEl.textContent = "";
}

function showLoading() {
    loadingEl.classList.remove("hidden");
}

function hideLoading() {
    loadingEl.classList.add("hidden");
}

async function getWeather(city) {
    clearError();
    showLoading();

    try {
        const url =
            "https://api.openweathermap.org/data/2.5/weather?q=" +
            encodeURIComponent(city) +
            "&units=metric&lang=el&appid=" +
            API_KEY;

        const response = await fetch(url);

        if (!response.ok) {
            if (response.status === 404) {
                showError("City not found. Try another name.");
            } else if (response.status === 401) {
                showError("Invalid API key or not activated yet.");
            } else {
                showError("Error fetching weather data.");
            }
            hideLoading();
            return;
        }

        const data = await response.json();
        updateUI(data);

        // Μετά τον τωρινό καιρό, φέρνουμε και forecast με lat/lon
        getForecast(data.coord.lat, data.coord.lon);
    } catch (err) {
        showError("Network error. Check your connection.");
        console.error(err);
        hideLoading();
    }
}

function formatTimeFromUnix(unixTime, timezoneOffset) {
    // unixTime σε δευτερόλεπτα, timezoneOffset σε δευτερόλεπτα
    const local = (unixTime + timezoneOffset) * 1000;
    const date = new Date(local);
    const hours = String(date.getUTCHours()).padStart(2, "0");
    const minutes = String(date.getUTCMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
}

function updateUI(data) {
    const cityName = data.name + ", " + data.sys.country;
    const temp = Math.round(data.main.temp);
    const description = data.weather[0].description;
    const feelsLike = Math.round(data.main.feels_like);
    const humidity = data.main.humidity;
    const wind = data.wind.speed;
    const iconCode = data.weather[0].icon;
    const iconUrl = "https://openweathermap.org/img/wn/" + iconCode + "@2x.png";

    const sunriseLocal = formatTimeFromUnix(data.sys.sunrise, data.timezone);
    const sunsetLocal = formatTimeFromUnix(data.sys.sunset, data.timezone);

    cityNameEl.textContent = cityName;
    tempEl.textContent = `Θερμοκρασία: ${temp}°C (αισθητή ${feelsLike}°C)`;
    descriptionEl.textContent = `Καιρός: ${description}`;
    detailsEl.textContent = `Υγρασία: ${humidity}% • Άνεμος: ${wind} m/s`;
    sunriseEl.textContent = `Ανατολή: ${sunriseLocal}`;
    sunsetEl.textContent = `Δύση: ${sunsetLocal}`;
    iconEl.src = iconUrl;
    iconEl.alt = description;

    resultEl.classList.remove("hidden");
}

// 5-day forecast
async function getForecast(lat, lon) {
    try {
        const url =
            "https://api.openweathermap.org/data/2.5/forecast?lat=" +
            lat +
            "&lon=" +
            lon +
            "&units=metric&lang=el&appid=" +
            API_KEY;

        const response = await fetch(url);
        if (!response.ok) {
            console.error("Forecast error:", response.status);
            hideLoading();
            return;
        }

        const data = await response.json();
        updateForecastUI(data);
        hideLoading();
    } catch (err) {
        console.error("Forecast fetch error:", err);
        hideLoading();
    }
}

function updateForecastUI(data) {
    // data.list περιέχει ανά 3 ώρες. Θέλουμε ~1 entry ανά μέρα
    const byDate = {};

    data.list.forEach((item) => {
        const date = item.dt_txt.split(" ")[0]; // "YYYY-MM-DD"
        const hour = item.dt_txt.split(" ")[1].split(":")[0]; // "00", "03", ...
        // προτιμάμε κοντά στο μεσημέρι (12:00) ή αν όχι, κρατάμε ένα
        if (!byDate[date] || hour === "12") {
            byDate[date] = item;
        }
    });

    const entries = Object.entries(byDate).slice(0, 5); // 5 μέρες

    forecastItemsEl.innerHTML = "";

    entries.forEach(([date, item]) => {
        const d = new Date(date);
        const dayName = d.toLocaleDateString("en-GB", { weekday: "short" });

        const temp = Math.round(item.main.temp);
        const iconCode = item.weather[0].icon;
        const desc = item.weather[0].description;
        const iconUrl =
            "https://openweathermap.org/img/wn/" + iconCode + "@2x.png";

        const card = document.createElement("div");
        card.className = "forecast-card";

        card.innerHTML = `
            <div>${dayName}</div>
            <img src="${iconUrl}" alt="${desc}">
            <div>${temp}°C</div>
        `;

        forecastItemsEl.appendChild(card);
    });

    forecastEl.classList.remove("hidden");
}


