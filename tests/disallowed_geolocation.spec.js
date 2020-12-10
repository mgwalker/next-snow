const onBeforeLoad = (win) => {
  cy.stub(win.navigator.geolocation, "getCurrentPosition").callsFake(
    (cb, errorCb) => {
      return errorCb({ code: 1 });
    }
  );
  cy.stub(win.navigator.serviceWorker, "register").resolves();
};

describe("when the user does not allow geospatial location", () => {
  it("shows the ZIP code input", () => {
    cy.visit("/", { onBeforeLoad });
    cy.contains("ZIP code");
    cy.contains("When is the snow?");
  });

  describe("it ignores invalid ZIP codes", () => {
    beforeEach(() => {
      cy.visit("/", { onBeforeLoad });
    });

    it("such as less than 5-digit", () => {
      cy.get("input").type("1234");
      cy.get("button").click();
      cy.contains("ZIP code");
      cy.contains("When is the snow?");
    });

    it("such as more than 5-digit", () => {
      cy.get("input").type("123456");
      cy.get("button").click();
      cy.contains("ZIP code");
      cy.contains("When is the snow?");
    });

    it("such as including letters", () => {
      cy.get("input").type("12a34");
      cy.get("button").click();
      cy.contains("ZIP code");
      cy.contains("When is the snow?");
    });
  });

  describe("it handles valid ZIP codes", () => {
    beforeEach(() => {
      cy.visit("/", { onBeforeLoad });
    });

    it("but the ZIP code is not found in the database", () => {
      cy.intercept("GET", "zips.json", {
        body: { 12346: {} },
      });
      cy.get("input").type("12345");
      cy.get("button").click();
      cy.contains("ZIP code");
      cy.contains("When is the snow?");
    });

    it("and the ZIP code is found in the database", () => {
      cy.intercept("GET", "http://localhost:8080/zips.json", {
        body: { 12345: { latitude: 10, longitude: 20 } },
      });
      cy.intercept("GET", "https://api.weather.gov/points/10,20", {
        fixture: `get_url_success.json`,
      });
      cy.intercept("GET", "https://forecast.url", {
        fixture: `get_forecast_success_day.json`,
      });

      cy.get("input").type("12345");
      cy.get("button").click();
      cy.contains("Friday");
      cy.contains("Chance of snow. This is the test.");
    });
  });
});
