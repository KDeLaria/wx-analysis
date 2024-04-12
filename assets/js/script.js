const apiKey = proccess.env.API_KEY;
const baseUrl = "https://api.openweathermap.org/data/2.5/weather?units=imperial&lang=en&appid=" + apiKey + "&q=";
const iconUrl = "https://openweathermap.org/img/wn/";
const iconMedium = "@2x.png";
const iconLarge = "@4x.png";
let requestUrl;
let cities = [];
let state = "";
$("#year").html(dayjs().format("YYYY"));

getSavedCities();
$("#cityForm").on("submit", getWXInfo);
$(".city-button").on("click", getSavedCityWX);


// Prepares the request url from the city button
function getSavedCityWX() {
    if ($(this).attr("id").includes(",")) {
        state = $(this).attr("id").split(",")[1];
        requestUrl = baseUrl + $(this).attr("id") + ",US";
    }
    else {
        requestUrl = baseUrl + $(this).attr("id") + ",US";
    }
    getWeatherData();
}

// Prepares the request url from the input text
function getWXInfo(event) {
    event.preventDefault();
    // If the city input is not an empty string the city is formatted for the url
    if ($("#cityInput").val() !== "") {
        if ($("#cityInput").val().includes(",")) {
            state = $("#cityInput").val().split(",")[1].trim().toUpperCase();
            let city = $("#cityInput").val().trim() + ",US";
            // 
            if (city !== "") {
                requestUrl = baseUrl + city;
                getWeatherData();
            }
        }
        else {
            requestUrl = baseUrl + $("#cityInput").val() + ",US";
            getWeatherData();
        }
    }
}

// Clears the weather data
function clearLayout() {
    $("#cityInput").val("");
    $("#currentWeather").html("");
    $("#current-city").text("");
    // Clears the 5 day forecast
    for (let i = 1; i < 6; i++) {

        $("#day-" + i + "-weather").html("");
    }
}

// Stores the city on the user's machine
function saveCity(newCity) {
    (cities !== null) ? cities.push(newCity) : cities = [newCity];
    localStorage.setItem("myCity", JSON.stringify(cities));
    getSavedCities();
}

// Sets up buttons for saved cities
function getSavedCities() {
    $("#cities").html("");
    cities = JSON.parse(localStorage.getItem("myCity"));
    // If the cities array from local storage is not empty a new button will be made for that city
    if (cities !== null) {
        for (let i = 0; i < cities.length; i++) {
            let ctyButton = $("<button>");
            ctyButton.attr("id", cities[i]).text(cities[i]).attr("class", "city-button btn bg-dark text-light border");
            $("#cities").append(ctyButton);
        }
        $(".city-button").on("click", getSavedCityWX);
    }
}

// Checks to see if the city is stored already
function ifCityExists(searchedCity) {
    cities = JSON.parse(localStorage.getItem("myCity"));
    if (cities !== null) {
        for (let i = 0; i < cities.length; i++) {
            // Checks only city names
            if (cities[i].includes(",") && searchedCity.includes(",")) {
                if (cities[i].split(",")[0] === searchedCity.split(",")[0]) {
                    return true;
                }
            }
            else if (cities[i].includes(",")) {
                if (cities[i].split(",")[0] === searchedCity) {
                    return true;
                }
            }
            else if (searchedCity.includes(",")) {
                if (cities[i] === searchedCity.split(",")[0]) {
                    return true;
                }
            }
            else {
                if (cities[i] === searchedCity) {
                    return true;
                }
            }
        }
    }
    return false;
}

// Gathers the current forecast 
async function getWeatherData() {
    try {
        let response = await fetch(requestUrl);
        let weatherData = await response.json();

        requestUrl = ""; ////////////////////////////////////////////////////////////////////////////////

        let timeStamp = dayjs(weatherData.dt).format("MMMM D, YYYY");
        let icon = weatherData.weather[0].icon;
        let temperature = weatherData.main.temp;
        let feelsLike = weatherData.main.feels_like;
        let humidity = weatherData.main.humidity;
        let windSpeed = weatherData.wind.speed;
        let forecast = weatherData.weather[0].main;
        let latitude = weatherData.coord.lat;
        let longitude = weatherData.coord.lon;

        clearLayout();

        $("#current-city").text(weatherData.name);

        // If the city exists on the server the city name will be stored on the local machine
        if (state !== "") {
            if (!(ifCityExists(weatherData.name + ", " + state))) {
                saveCity(weatherData.name + ", " + state);
                state = ""; ////////clears the state object
            }
        }
        else {
            if (!(ifCityExists(weatherData.name))) {
                saveCity(weatherData.name);
            }
        }

        getFiveDayForcast(latitude, longitude);   ////5 day forcast
        $("#currentIcon").attr("src", iconUrl + icon + iconLarge);
        $("#currentWeather").html(`<h3>${dayjs().format("MMMM D, YYYY")}</h3>\n
        <br><b>${forecast}</b>\n
        <br><br><b>Temperature:</b> ${setTempColor(temperature)}\n
        <br><b>Feels Like Temperature:</b> ${feelsLike} °F\n
        <br><b>Humidity:</b> ${humidity} %\n
        <br><b>Wind Speed:</b> ${windSpeed} mph`);

        $("#five-day-title").css("display", "block");
        $("#main-forecast").css("display", "block");

    }
    catch (error) {
        console.error(error);
    }
}

// Gathers and displays the 5 day forecast
async function getFiveDayForcast(lat, lon) {
    try {
        /////////////////////////////////////////////////////////////////
        let NWSurl = `https://api.weather.gov/points/${lat},${lon}`;
        let res = await fetch(NWSurl);
        let data = await res.json();

        // Alert Data (Warinings and Watches)
        // let zone = data.properties.forecastZone.replace("https://api.weather.gov/zones/forecast/", "");
        // let alertUrl = `https://api.weather.gov/alerts/active/zone/${zone}`;
        // let alertRes = await fetch(alertUrl);
        // let alertData = await alertRes.json();

        let fiveDayUrl = data.properties.forecast;
        let fiveDayResponse = await fetch(fiveDayUrl);
        let weather = await fiveDayResponse.json();
        const prefix = "#day-";
        const iconSuffix = "-icon";
        const suffix = "-weather";
        let today = dayjs();

        let wxList = weather.properties.periods;

        let dayX = 1;
        ////////////////////////////////
        let isNight = false;
        let upperIdex = 6;
        let lowerIndex = 0;
        /////////////////////////////////

        // Displays the forecast for each day
        for (let i = 0; i < wxList.length; i++) {
            ////////////////////////////////////////////////////////////////
            // If currently night /////////////////////////////////////////
            // if (wxList[i].name.includes("ight") && wxList[i].number == 1) {
            //     isNight = true;
            // }
            // Night /////////////////////////////////////////////////////
            // if (wxList[i].name.includes("ight") && wxList[i].number < 13) {
            //     if (isNight) {
            //         lowerIndex++;
            //         dayX = lowerIndex;
            //     }
            //     else {
            //         upperIdex++;
            //         dayX = upperIdex;
            //     }

            // }
            // Day ///////////////////////////////////////////////////////
            // else if (wxList[i].number < 13) {
            //     if (isNight) {
            //         upperIdex++;
            //         dayX = upperIdex;
            //     }
            //     else {
            //         lowerIndex++;
            //         dayX = lowerIndex;
            //     }
            // }
            // else { dayX = wxList[i].number }
            ////////////////////////////////////////////////////////////////

            dayX = Number(wxList[i].number);////////ordered list
            console.log(`wxList: ${wxList[i].number}
                dayX: ${dayX}`)
            $(prefix + dayX + iconSuffix).attr("src", wxList[i].icon.toString());
            $(prefix + dayX + suffix).html(`<div style='text-align:center'><h4>${wxList[i].name}</h4></div>\n
            <br><div style='text-align:center'><b>${wxList[i].shortForecast}</b></div>\n
            <br><b>Temperature:</b> ${setTempColor(wxList[i].temperature)}\n
                <br><b>Dewpoint:</b> ${setDewPointColor(wxList[i].dewpoint.value)}\n
                <br><b>Humidity:</b> ${wxList[i].relativeHumidity.value} %\n
                <br><b>Wind:</b> ${wxList[i].windSpeed} ${wxList[i].windDirection}`).css("title", wxList[i].detailedForecast);
        }
        $(".small-forecast").css("display", "flex");
        $(".icon").css("display", "block"); // Display images
        $("footer").css("display", "block");
    }
    catch (error) {
        console.error(error);
    }
}

function setDewPointColor(dewpoint) {
    // Convert to Fahrenheit
    dewpoint = (dewpoint * 9 / 5) + 32;

    if (dewpoint >= 50 && dewpoint <= 55) {
        dewpoint = `<span style='color:LightGreen'>${dewpoint} °F</span>`;
    }
    else if (dewpoint >= 56 && dewpoint <= 60) {
        dewpoint = `<span style='color:Green'>${dewpoint} °F</span>`;
    }
    else if (dewpoint >= 61 && dewpoint <= 65) {
        dewpoint = `<span style='color:Yellow'>${dewpoint} °F</span>`;
    }
    else if (dewpoint >= 66 && dewpoint <= 70) {
        dewpoint = `<span style='color:Orange'>${dewpoint} °F</span>`;
    }
    else if (dewpoint >= 71 && dewpoint <= 75) {
        dewpoint = `<span style='color:OrangeRed'>${dewpoint} °F</span>`;
    }
    else if (dewpoint >= 76) {
        dewpoint = `<span style='color:Red'>${dewpoint} °F</span>`;
    }
    else {
        dewpoint = `${dewpoint} °F`;
    }

    return dewpoint;
}

function setTempColor(temp) {

    if (temp >= 65 && temp <= 70) {
        temp = `<span style='color:LightGreen'>${temp} °F</span>`;
    }
    else if (temp >= 71 && temp <= 75) {
        temp = `<span style='color:GreenYellow'>${temp} °F</span>`;
    }
    else if (temp >= 76 && temp <= 80) {
        temp = `<span style='color:Yellow'>${temp} °F</span>`;
    }
    else if (temp >= 81 && temp <= 85) {
        temp = `<span style='color:Orange'>${temp} °F</span>`;
    }
    else if (temp >= 86 && temp <= 90) {
        temp = `<span style='color:OrangeRed'>${temp} °F</span>`;
    }
    else if (temp >= 91 && temp <= 99) {
        temp = `<span style='color:Red'>${temp} °F</span>`;
    }
    else if (temp >= 100) {
        temp = `<span style='color:Red'>${temp} °F</span>`;
    }
    else {
        temp = `${temp} °F`;
    }

    return temp;
}
