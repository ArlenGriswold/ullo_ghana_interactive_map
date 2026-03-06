# Ullo, Ghana — Interactive Community Explorer
### Engineers Without Borders – Iowa State University

An interactive 3D satellite map of the Ullo community in Ghana's Upper West Region, with clickable location markers and embedded 360° photo viewing.

---

## Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or newer)
- A free [Mapbox](https://mapbox.com) account

### 1. Install dependencies

```bash
cd ullo-explorer
npm install
```

### 2. Get your Mapbox token

1. Go to https://account.mapbox.com/access-tokens/
2. Sign up (free) or log in
3. Copy your **Default public token** (starts with `pk.`)

### 3. Run the dev server

```bash
npm run dev
```

This opens http://localhost:3000 in your browser. Paste your Mapbox token when prompted.

**Or** hardcode the token (optional): Open `src/App.jsx` and replace:
```js
const MAPBOX_TOKEN = "YOUR_MAPBOX_TOKEN_HERE";
```
with your actual token.

---

## Adding Your 360° Photos

### Prepare your Insta360 photos
Export your photos as **equirectangular JPGs** from the Insta360 app or Studio.

### Option A: Local files
1. Create a `public/photos/` folder
2. Drop your `.jpg` files in there
3. Update `src/App.jsx` — find the `LOCATIONS` array and set each `photoUrl`:
   ```js
   {
     id: 1,
     name: "Ullo Village Center",
     photoUrl: "/photos/village-center.jpg",  // ← add this
     ...
   }
   ```

### Option B: Hosted URLs
If your photos are hosted online (Google Drive, Cloudflare, etc.), just paste the direct URL:
```js
photoUrl: "https://your-host.com/photos/village-center.jpg",
```

### Updating GPS coordinates
The current coordinates are approximate. To use exact GPS from your Insta360 files:
1. Open a photo in any EXIF viewer (or run `exiftool yourphoto.jpg`)
2. Note the latitude and longitude
3. Update `lat` and `lng` in the LOCATIONS array

---

## Project Structure

```
ullo-explorer/
├── index.html          # Entry HTML
├── package.json        # Dependencies
├── vite.config.js      # Vite config
├── public/
│   └── photos/         # Put your 360° photos here
└── src/
    ├── main.jsx        # React entry
    └── App.jsx         # Main app (all the code)
```

---

## Deployment

To build for production:

```bash
npm run build
```

The output goes to `dist/`. Deploy to any static host:
- **Netlify**: drag & drop the `dist` folder
- **Vercel**: `npx vercel --prod`
- **GitHub Pages**: push `dist` contents to `gh-pages` branch
- **Cloudflare Pages**: connect your repo

---

## Tech Stack

- **React 18** + **Vite** — fast dev & build
- **Mapbox GL JS** — 3D satellite map with terrain
- **Pannellum** — 360° panoramic photo viewer
- **EWB-USA brand colors** — #0065b2, #abcae9, #cedc00, #b36924, #3d3935 + gold
