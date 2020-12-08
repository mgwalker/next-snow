const appState = {
  day: null,
  forecast: null,
  getZip: false,
  loading: false,
  snowflakes: [],
  zip: "",
  zipEntered: () => {},
};

const getNextSnow = async (forecasts) => {
  const snows = forecasts.filter(({ forecast }) =>
    forecast.toLowerCase().includes("snow")
  );
  if (snows.length > 0) {
    return snows[0];
  }
  return false;
};

const getForecast = async (url) => {
  const response = await fetch(url);
  const json = await response.json();
  return json.properties.periods.map(({ detailedForecast, name }) => ({
    name,
    forecast: detailedForecast,
  }));
};

const getForecastURL = async (latitude, longitude) => {
  const url = `https://api.weather.gov/points/${latitude},${longitude}`;
  const response = await fetch(url);
  const json = await response.json();
  return json.properties.forecast;
};

const makeItSnow = () => {
  const createSnowflake = () => {
    const { innerWidth } = window;

    // Fixed vertical position, random horizontal position.
    const left = Math.round(Math.random() * innerWidth);
    const rotation = Math.round(Math.random() * 90);
    const size = Math.round(Math.random() * 32) + 12;

    return {
      speed: 8 + Math.floor(Math.random() * 16),
      style: {
        position: "fixed",
        top: `${-size}px`,
        left: `${left}px`,
        width: `${size}px`,
        height: `${size}px`,
        background: "url(flake2.svg)",
        "background-size": "contain",
        "background-position": "center center",
        "background-repeat": "no-repeat",
        transform: `rotate(${rotation}deg)`,
      },
      top: -size,
    };
  };

  const moveFlakes = () => {
    const { innerHeight } = window;

    appState.snowflakes.forEach((flake, i) => {
      const { top } = flake;
      if (top > innerHeight) {
        appState.snowflakes.splice(i, 1, createSnowflake());
        return;
      }

      flake.top += flake.speed; // eslint-disable-line no-param-reassign
      flake.style.top = `${flake.top}px`; // eslint-disable-line no-param-reassign
    });
  };

  [...Array(50)].forEach(() => {
    appState.snowflakes.push(createSnowflake());
  });

  setInterval(() => {
    moveFlakes();
  }, 40);
};

const updateDOMWithLocation = async (latitude, longitude) => {
  const nextSnow = await getForecastURL(latitude, longitude)
    .then(getForecast)
    .then(getNextSnow);

  appState.loading = false;

  if (nextSnow !== false) {
    const { name, forecast } = nextSnow;
    if (name.toLowerCase().includes("night")) {
      document.body.setAttribute("class", "night");
    } else {
      document.body.setAttribute("class", "day");
    }

    appState.day = name;
    appState.forecast = forecast;
    makeItSnow();
  } else {
    appState.day = "No snow in the forecast 😢";
  }
};

const getLocation = () => {
  appState.day = null;
  appState.forecast = null;
  appState.loading = true;
  const g = navigator.geolocation;

  g.getCurrentPosition(
    async ({ coords: { latitude, longitude } }) => {
      updateDOMWithLocation(latitude, longitude);
    },
    ({ code }) => {
      appState.loading = false;
      appState.day = "";
      appState.forecast = "";

      switch (code) {
        case 1:
          navigator.serviceWorker.register("worker.js").then(() => {
            appState.getZip = true;
          });
          break;
        case 2:
        case 3:
        default:
          appState.forecast =
            "There was an error getting your location. Going to try again...";
          setTimeout(getLocation, 3000);
          break;
      }
    }
  );
};

const getCoordsForZip = async (zip) => {
  const zips = await (await fetch("zips.json")).json();

  const coords = zips[zip];
  if (coords) {
    updateDOMWithLocation(coords.latitude, coords.longitude);
  } else {
    appState.getZip = true;
    appState.loading = false;
  }
};

const handleZipSubmit = (e) => {
  e.preventDefault();
  if (/^\d{5}$/.test(appState.zip)) {
    appState.getZip = false;
    appState.loading = true;
    getCoordsForZip(appState.zip);
  }
};

document.addEventListener("DOMContentLoaded", () => {
  appState.zipEntered = handleZipSubmit;

  // We don't need to keep a reference to the Vue app object, but eslint
  // doesn't want us to use constructors for side-effects (which is reasonable,
  // but here we are...)
  // eslint-disable-next-line no-new
  new Vue({
    el: "#container",
    data: appState,
  });

  document.getElementById("container").removeAttribute("style");
  getLocation();
});
