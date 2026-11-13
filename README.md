# ForWeather (FW)

A responsive weather experience for desktop and mobile. Built with React, TypeScript and Vite.

## Run locally
1. Install Node.js (LTS).
2. In this folder run `npm install`.
3. Run `npm run dev`.
4. Open the local URL printed by Vite.

## Deploy to Netlify
1. Push this folder to a GitHub repository.
2. In Netlify choose **Add new site → Import an existing project**.
3. Select the repository. Build command: `npm run build`. Publish directory: `dist`.
4. Deploy. `netlify.toml` already includes SPA routing.

## Weather data
The starter uses Open-Meteo forecast, geocoding and air-quality endpoints. No API key is required for basic non-commercial use. Check Open-Meteo's current terms and attribution requirements before public/commercial launch.

## Current prototype scope
- Live location weather (browser geolocation) and city search.
- Current conditions, hourly forecast, 7-day outlook, air quality.
- Responsive desktop/mobile navigation.
- Animated weather scene, live city clock, day/night ambience.
- Sound settings with user-initiated UI tones and synthesized weather ambience.
- Reduced-motion preference support.

## Before public launch
Add proper provider attribution, review API licensing/usage limits, improve error states and accessibility, add automated tests, and consider a server-side proxy/caching layer if you need higher traffic or provider credentials.
