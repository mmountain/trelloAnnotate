# Trello Image Annotator Power-Up

A Trello Power-Up that enables users to annotate images on cards with pins, drawings, and highlights. Comments sync to the main Trello card for easy collaboration.

## Features

### Phase 2 (Current)
- **Pin Annotations**: Click on images to drop numbered pins with comments
- **Comment Management**: Mark comments as done, delete, or copy to Trello card
- **Auto-save**: Annotations automatically save to Trello card data
- **Storage Tracking**: Monitor storage usage (4KB limit per image)
- **Responsive Design**: Works on desktop and mobile devices

### Coming Soon (Phase 3-4)
- **Freehand Drawing**: Draw lines, arrows, and shapes on images
- **Highlight Areas**: Rectangle and circle highlights with optional comments
- **Advanced Tools**: Color picker, stroke width, opacity controls

## Technology Stack

- **Frontend**: React 18
- **Canvas**: Konva.js with react-konva
- **Build Tool**: Vite
- **Storage**: Trello Card Data API (pluginData)
- **Hosting**: GitHub Pages
- **Compression**: LZ-String for efficient storage

## Installation & Deployment

### Prerequisites
- Node.js 16+ and npm
- GitHub account
- Trello account

### 1. Clone and Install

```bash
cd TrelloAnnotate
npm install
```

### 2. Local Development

```bash
npm run dev
```

Visit `http://localhost:3000` to see the Power-Up locally.

### 3. Deploy to GitHub Pages

#### Option A: Manual Deployment

1. **Initialize Git repository** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **Create GitHub repository**:
   - Go to GitHub and create a new repository (e.g., `trello-image-annotator`)
   - Don't initialize with README (we already have one)

3. **Connect to GitHub**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/trello-image-annotator.git
   git branch -M main
   git push -u origin main
   ```

4. **Deploy to GitHub Pages**:
   ```bash
   npm run deploy
   ```

   This builds the project and pushes the `dist/` folder to the `gh-pages` branch.

5. **Enable GitHub Pages**:
   - Go to your repository on GitHub
   - Settings → Pages
   - Source: Deploy from a branch
   - Branch: `gh-pages` → `/root`
   - Save

6. **Your Power-Up URL**:
   ```
   https://YOUR_USERNAME.github.io/trello-image-annotator/
   ```

#### Option B: Automatic Deployment with GitHub Actions

1. Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

2. Push to GitHub - automatic deployment will trigger on every push to `main`.

### 4. Install Power-Up on Trello

1. **Go to any Trello board**

2. **Click "Power-Ups" in the menu**

3. **Click "Custom"** at the bottom

4. **Click "New Power-Up" or "Add Custom Power-Up"**

5. **Enter your Power-Up information**:
   - **Iframe connector URL**: `https://YOUR_USERNAME.github.io/trello-image-annotator/index.html`
   - **Name**: Image Annotator
   - **Description**: Annotate images with pins, drawings, and highlights

6. **Update manifest.json URL**:
   - In Trello, enter the manifest URL: `https://YOUR_USERNAME.github.io/trello-image-annotator/manifest.json`

7. **Enable the Power-Up** on your board

### 5. Update Manifest for Your GitHub Pages URL

Before deploying, update `manifest.json` with your GitHub Pages URL:

```json
{
  "name": "Image Annotator",
  "details": "Annotate images on Trello cards with pins, drawings, and highlights. Comments sync to the main card.",
  "icon": {
    "url": "https://YOUR_USERNAME.github.io/trello-image-annotator/public/icon.svg"
  },
  "author": "Your Name",
  "capabilities": [
    "card-buttons",
    "card-back-section"
  ],
  "connectors": {
    "iframe": {
      "url": "https://YOUR_USERNAME.github.io/trello-image-annotator/index.html"
    }
  }
}
```

## Usage

### Adding Pin Annotations

1. **Open a Trello card** with an image attachment
2. **Click the "Annotate: [filename]" button** below the image
3. **Click the "Pin" tool** in the toolbar
4. **Click on the image** where you want to place a pin
5. **Enter your comment** in the dialog
6. **Click "Add Pin"**

The pin appears on the image with an auto-incremented number. The annotation is saved automatically after 2 seconds.

### Managing Annotations

- **View all comments**: See them in the right sidebar
- **Filter comments**: Click "All", "Open", or "Done" to filter
- **Mark as done**: Click "✓ Done" to mark a pin complete (turns green)
- **Reopen**: Click "↻ Reopen" to mark a done pin as open again
- **Copy to Trello**: Click "📋 Copy to Trello" to copy the comment to clipboard
- **Delete**: Click "🗑 Delete" to remove the annotation (requires confirmation)
- **Highlight**: Click any comment to highlight the corresponding pin on the image

### Keyboard Shortcuts

- **P**: Switch to Pin tool
- **Esc**: Switch to Select tool
- Click pin or comment to select/highlight

### Storage Limits

- Each image can store approximately **40-50 annotations** within the 4KB Trello pluginData limit
- Storage usage is shown in the header (e.g., "2.1KB / 4.00KB")
- Warning appears when approaching 3.5KB

## Project Structure

```
TrelloAnnotate/
├── dist/                   # Build output (generated)
├── public/
│   └── icon.svg            # Power-Up icon
├── src/
│   ├── components/
│   │   ├── AnnotationCanvas.jsx    # Konva canvas component
│   │   ├── AnnotationModal.jsx     # Main modal container
│   │   ├── CommentPanel.jsx        # Comment sidebar
│   │   ├── CommentThread.jsx       # Individual comment display
│   │   └── PinMarker.jsx           # Pin marker component
│   ├── hooks/
│   │   └── useAnnotations.js       # Annotation state management
│   ├── utils/
│   │   ├── annotations.js          # Annotation helpers
│   │   ├── storage.js              # PluginData compression/storage
│   │   └── trello-sync.js          # Trello comment utilities
│   ├── styles/
│   │   └── main.css                # Global styles
│   └── index.jsx                   # Power-Up initialization
├── index.html              # Entry point
├── manifest.json           # Trello Power-Up manifest
├── package.json
├── vite.config.js          # Vite configuration
└── README.md
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run deploy` - Build and deploy to GitHub Pages

### Data Model

Annotations are stored in Trello pluginData with key `annotation_{attachmentId}`:

```javascript
{
  "v": 1,                    // Schema version
  "pins": [
    {
      "id": "unique_id",     // Generated ID
      "x": 0.45,             // Relative X (0-1)
      "y": 0.32,             // Relative Y (0-1)
      "n": 1,                // Pin number
      "comment": "text",     // Comment text
      "cid": null,           // Trello comment ID (future)
      "s": "open",           // Status: "open" | "done"
      "t": 1709123456        // Timestamp (seconds)
    }
  ],
  "drawings": [],            // Phase 3
  "highlights": []           // Phase 4
}
```

### Storage Optimization

- **Relative coordinates**: Stored as 0-1 range instead of absolute pixels
- **Short keys**: Single-letter keys to save space
- **Timestamps in seconds**: 10 digits instead of 13
- **Point simplification**: Douglas-Peucker algorithm reduces drawing complexity
- **LZ-String compression**: Optional compression for large datasets

## Troubleshooting

### Power-Up doesn't appear on Trello
- Verify GitHub Pages is enabled and the site is accessible
- Check that manifest.json has the correct URLs
- Clear browser cache and refresh Trello
- Check browser console for CORS errors

### Annotations not saving
- Check storage usage - may be at 4KB limit
- Check browser console for errors
- Verify you have edit access to the Trello card

### Images not loading
- Verify image URL is accessible
- Check for CORS issues (some image hosts block cross-origin requests)
- Try re-uploading the image to Trello

## Browser Support

- Chrome/Edge (Chromium) 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## License

ISC

## Contributing

This is a personal project, but suggestions and feedback are welcome!

## Roadmap

- [x] Phase 1: Basic Power-Up structure and image display
- [x] Phase 2: Pin annotations with comments
- [ ] Phase 3: Freehand drawing tools
- [ ] Phase 4: Highlight areas (rectangles/circles)
- [ ] Phase 5: Polish & optimization (zoom/pan, keyboard shortcuts)
- [ ] Phase 6: Testing & production deployment

## Support

For issues or questions, please open an issue on GitHub.

---

**Version**: 1.0.0 (Phase 2)
**Last Updated**: February 2026
