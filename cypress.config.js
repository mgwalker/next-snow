module.exports = {
  fixturesFolder: 'tests/fixtures',
  e2e: {
    supportFile: false,
    setupNodeEvents(on, config) {},
    baseUrl: 'http://localhost:8080',
    specPattern: 'tests/**/*.cy.{js,jsx,ts,tsx}',
  },
}
