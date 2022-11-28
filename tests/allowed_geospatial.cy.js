const onBeforeLoad = (win) => {
  cy.stub(win.navigator.geolocation, "getCurrentPosition").callsFake((cb) => {
    return cb({ coords: { latitude: 35, longitude: -80 } });
  });
};

const intercept = (time) => {
  cy.intercept("GET", "https://api.weather.gov/points/35,-80", {
    fixture: `get_url_success.json`,
  });

  cy.intercept("GET", "https://forecast.url", {
    fixture: `get_forecast_success_${time}.json`,
  });
};

describe("when the user allows geospatial location", () => {
  it("with an error fetching the forecast URL", () => {
    cy.intercept("GET", "https://api.weather.gov/points/35,-80", {
      statusCode: 500,
      body: {},
    });
    cy.visit("/", { onBeforeLoad });

    cy.contains("Something went wrong. 😢 Going to try again...");
  });

  it("with an error fetching the forecast", () => {
    cy.intercept("GET", "https://api.weather.gov/points/35,-80", {
      fixture: `get_url_success.json`,
    });
    cy.intercept("GET", "https://forecast.url", {
      statusCode: 500,
      body: {},
    });
    cy.visit("/", { onBeforeLoad });

    cy.contains("Something went wrong. 😢 Going to try again...");
  });

  it("with no snow in the forecast", () => {
    intercept("none");
    cy.visit("/", { onBeforeLoad });

    cy.contains("No snow in the forecast 😢");
  });

  it("with no snow at a future day", () => {
    intercept("day");
    cy.visit("/", { onBeforeLoad });

    cy.contains("Friday");
    cy.contains("Chance of snow. This is the test.");
  });

  it("with no snow at a future night", () => {
    intercept("night");
    cy.visit("/", { onBeforeLoad });

    cy.contains("Thursday Night");
    cy.contains("Chance of snow. This is the test.");
  });
});
