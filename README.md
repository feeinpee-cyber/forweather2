# ForWeather

ForWeather is a responsive weather dashboard built with React, TypeScript and Vite. It uses a weather-reactive interface, a lightweight 3D scene, detailed forecasts and an animated precipitation radar.

## Run locally

1. Install Node.js 24 or a compatible current LTS release.
2. Run `npm ci` to install the exact versions in the lockfile.
3. Run `npm run dev`.
4. Run `npm run build` to type-check and create the production build in `dist/`.

## Deployment

The project is configured for the existing Cloudflare-connected Git deployment. Use `npm ci` as the install command, `npm run build` as the build command, and `dist` as the build output directory where the deployment configuration expects static assets. Confirm which Git branch your Cloudflare project is connected to before expecting a push to publish.

## Features

- Current conditions, feels-like temperature, humidity, pressure, cloud cover and wind.
- 24-hour hourly forecast with temperature, precipitation-chance and wind charts.
- 10-day forecast with high/low temperatures, precipitation probability and totals, and maximum wind.
- Air quality (US AQI, PM2.5 and PM10) when the provider has data for the location.
- UV index, visibility, dew point, sunrise, sunset and an estimated moon phase.
- City search, browser geolocation and saved locations remembered in the browser.
- Weather-reactive desktop, tablet and mobile layouts.
- Interactive Three.js WebGL weather scene with reduced-motion and lower-power settings.
- Animated historical precipitation radar with a timeline, when radar coverage is available.
- Optional synthesized weather ambience and interface sounds.

## Data sources and limitations

- Forecast, geocoding and air quality: [Open-Meteo](https://open-meteo.com/). Review its current attribution, licensing and usage terms before commercial or high-volume use.
- Radar: [RainViewer](https://www.rainviewer.com/). The public API is intended for personal, educational and small-community use, requires visible attribution, and currently provides recent past radar frames rather than future radar nowcasts. Radar coverage varies by region and has no uptime guarantee.
- Base map: [OpenStreetMap](https://www.openstreetmap.org/copyright). Keep the map attribution visible and follow its tile usage policy.

ForWeather does not currently provide official government severe-weather alerts, historical climate averages, weather news, or animated wind/temperature maps. Do not treat the app as an emergency warning service; check the relevant national meteorological authority for official warnings.

## Before a public release

Run a clean install and production build, add automated tests and browser/device checks, verify API terms and attribution, and consider caching/proxying provider requests if traffic grows. Check the live Cloudflare deployment separately; a successful GitHub commit does not prove that a deployment has completed.
