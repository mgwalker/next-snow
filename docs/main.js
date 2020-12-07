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
  const getStyle = (left, size, rotation, top) => {
    const style = {
      position: "fixed",
      top: `${top}px`,
      left: `${left}px`,
      width: `${size}px`,
      height: `${size}px`,
      background: "url(flake2.svg)",
      "background-size": "contain",
      "background-position": "center center",
      "background-repeat": "no-repeat",
      transform: `rotate(${rotation}deg)`,
    };

    return Object.entries(style)
      .map(([key, value]) => `${key}: ${value}`)
      .join(";");
  };

  const createSnowflake = () => {
    const { innerWidth } = window;

    // Fixed vertical position, random horizontal position.
    const left = Math.round(Math.random() * innerWidth);
    const rotation = Math.round(Math.random() * 90);
    const size = Math.round(Math.random() * 32) + 12;

    const img = document.createElement("div");
    img.setAttribute("data-speed", 8 + Math.floor(Math.random() * 16));
    img.setAttribute("data-left", left);
    img.setAttribute("data-rotation", rotation);
    img.setAttribute("data-size", size);
    img.setAttribute("style", getStyle(left, size, rotation, -size));

    document.body.appendChild(img);
  };

  const moveFlakes = () => {
    const { innerHeight } = window;
    const flakes = Array.from(document.querySelectorAll("[data-speed]"));

    flakes.forEach((flake) => {
      const top = flake.offsetTop;
      if (top > innerHeight) {
        flake.remove();
        createSnowflake();
        return;
      }

      const left = +flake.getAttribute("data-left");
      const rotation = +flake.getAttribute("data-rotation");
      const size = +flake.getAttribute("data-size");
      const speed = +flake.getAttribute("data-speed");

      flake.setAttribute("style", getStyle(left, size, rotation, top + speed));
    });
  };

  [...Array(50)].forEach(() => {
    createSnowflake();
  });

  setInterval(() => {
    moveFlakes();
  }, 40);
};

const updateDOMWithLocation = async (latitude, longitude) => {
  const nextSnow = await getForecastURL(latitude, longitude)
    .then(getForecast)
    .then(getNextSnow);

  if (nextSnow !== false) {
    const { name, forecast } = nextSnow;
    if (name.toLowerCase().includes("night")) {
      document.body.setAttribute("class", "night");
    } else {
      document.body.setAttribute("class", "day");
    }

    document.getElementById("name").innerText = name;
    document.getElementById("forecast").innerText = forecast;
    makeItSnow();
  } else {
    document.getElementById("name").innerText = "No snow in the forecast 😢";
  }
};

document.addEventListener("DOMContentLoaded", () => {
  // return;
  const g = navigator.geolocation;
  g.getCurrentPosition(
    async ({ coords: { latitude, longitude } }) => {
      updateDOMWithLocation(latitude, longitude);
    },
    ({ code }) => {
      console.log(code);
    }
  );
});
