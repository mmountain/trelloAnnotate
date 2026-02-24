# GitHub Pages Deployment Guide

This guide will walk you through deploying your Trello Power-Up to GitHub Pages.

## Quick Start (5 minutes)

### Step 1: Initialize Git Repository

```bash
cd TrelloAnnotate
git init
git add .
git commit -m "Initial commit - Trello Image Annotator v1.0"
```

### Step 2: Create GitHub Repository

1. Go to [GitHub](https://github.com) and sign in
2. Click the "+" icon in the top right → "New repository"
3. Repository name: `trello-image-annotator` (or your preferred name)
4. Description: "Trello Power-Up for annotating images with pins and comments"
5. Choose: **Public** (required for free GitHub Pages)
6. **Do NOT** check "Initialize with README" (we already have one)
7. Click "Create repository"

### Step 3: Push to GitHub

Copy the commands from GitHub's quick setup page, or use these (replace YOUR_USERNAME):

```bash
git remote add origin https://github.com/YOUR_USERNAME/trello-image-annotator.git
git branch -M main
git push -u origin main
```

### Step 4: Configure GitHub Pages

#### Option A: Using GitHub Actions (Recommended)

The project already includes `.github/workflows/deploy.yml` for automatic deployment.

1. Go to your repository on GitHub
2. Click **Settings** → **Pages**
3. Under "Build and deployment":
   - Source: **GitHub Actions**
4. That's it! The workflow will automatically deploy on every push to `main`

#### Option B: Manual Deployment

If you prefer manual deployment:

1. Run the deploy command locally:
   ```bash
   npm run deploy
   ```

2. Go to your repository on GitHub
3. Click **Settings** → **Pages**
4. Under "Build and deployment":
   - Source: **Deploy from a branch**
   - Branch: **gh-pages** → **/ (root)**
   - Click **Save**

### Step 5: Wait for Deployment

- GitHub Pages typically takes 1-5 minutes to deploy
- Check deployment status: **Actions** tab on GitHub
- When complete, your Power-Up will be available at:
  ```
  https://YOUR_USERNAME.github.io/trello-image-annotator/
  ```

### Step 6: Install Power-Up on Trello

1. **Open Trello** and go to any board
2. Click **"Power-Ups"** in the top menu
3. Scroll to bottom and click **"Custom"**
4. Click **"New Power-Up"** or **"Add Custom Power-Up"**
5. Enter your Power-Up details:

   **Manifest URL**:
   ```
   https://YOUR_USERNAME.github.io/trello-image-annotator/manifest.json
   ```

6. Click **"Submit"**
7. Enable the Power-Up on your board

### Step 7: Test the Power-Up

1. **Create or open a card** on your Trello board
2. **Attach an image** (PNG, JPG, GIF, SVG, or WEBP)
3. You should see **"Annotate: [filename]"** button appear
4. Click the button to open the annotation interface
5. Click **"Pin"** tool and click on the image to add a pin
6. Enter a comment and click **"Add Pin"**

Congratulations! Your Power-Up is live! 🎉

---

## Updating Your Power-Up

When you make changes and want to update the deployed version:

### Using GitHub Actions (Automatic)

Simply push your changes to GitHub:

```bash
git add .
git commit -m "Description of changes"
git push
```

The GitHub Action will automatically build and deploy.

### Using Manual Deployment

Run the deploy command:

```bash
npm run deploy
```

This builds and pushes to the `gh-pages` branch.

---

## Troubleshooting

### "Power-Up not found" Error

**Cause**: GitHub Pages not fully deployed yet or wrong URL

**Solution**:
1. Verify your site is accessible: `https://YOUR_USERNAME.github.io/trello-image-annotator/`
2. Check the manifest is accessible: `https://YOUR_USERNAME.github.io/trello-image-annotator/manifest.json`
3. Wait a few more minutes for GitHub Pages to deploy
4. Clear browser cache and try again

### Annotations Not Appearing

**Cause**: Image attachments not detected

**Solution**:
1. Ensure the attachment is an image (PNG, JPG, GIF, SVG, WEBP)
2. Refresh the Trello card
3. Check browser console for errors (F12 → Console)

### "Failed to load module" Errors

**Cause**: Vite build issues with relative paths

**Solution**:
1. Verify `vite.config.js` has `base: './'`
2. Rebuild: `npm run build`
3. Redeploy: `npm run deploy`

### CORS Errors in Console

**Cause**: External images might have CORS restrictions

**Solution**:
- Re-upload the image directly to Trello (Trello-hosted images don't have CORS issues)
- Or use a CORS proxy (not recommended for production)

### GitHub Actions Deploy Failing

**Cause**: Permissions not set correctly

**Solution**:
1. Go to **Settings** → **Actions** → **General**
2. Scroll to "Workflow permissions"
3. Select **"Read and write permissions"**
4. Check **"Allow GitHub Actions to create and approve pull requests"**
5. Click **Save**
6. Re-run the failed workflow

### Power-Up Doesn't Update

**Cause**: Browser or Trello caching old version

**Solution**:
1. Hard refresh Trello (Ctrl+Shift+R or Cmd+Shift+R)
2. Clear browser cache
3. Disable and re-enable the Power-Up on the board
4. Verify new version is deployed on GitHub Pages

---

## Advanced Configuration

### Custom Domain

To use a custom domain (e.g., `trello.yourdomain.com`):

1. **Add CNAME file** to `public/` directory:
   ```
   trello.yourdomain.com
   ```

2. **Update vite.config.js**:
   ```javascript
   export default defineConfig({
     base: 'https://trello.yourdomain.com/',
     // ... rest of config
   });
   ```

3. **Configure DNS**:
   - Add CNAME record: `trello` → `YOUR_USERNAME.github.io`

4. **Update GitHub Pages settings**:
   - Settings → Pages → Custom domain → Enter `trello.yourdomain.com`

5. **Redeploy**:
   ```bash
   npm run deploy
   ```

### Environment Variables

For different environments (dev, staging, prod):

1. **Create `.env` files**:
   ```bash
   # .env.development
   VITE_APP_ENV=development

   # .env.production
   VITE_APP_ENV=production
   ```

2. **Use in code**:
   ```javascript
   const isDev = import.meta.env.VITE_APP_ENV === 'development';
   ```

3. **Add to .gitignore** (already included):
   ```
   .env
   .env.local
   ```

---

## Security Checklist

Before deploying to production:

- [ ] Remove any API keys or secrets from code
- [ ] Set repository to Public (required for free GitHub Pages)
- [ ] Test on different browsers (Chrome, Firefox, Safari)
- [ ] Test on mobile devices
- [ ] Verify HTTPS is working (GitHub Pages provides this automatically)
- [ ] Review Trello permissions in manifest.json
- [ ] Test with real Trello cards and images

---

## Monitoring & Analytics

To track usage (optional):

1. **Add Google Analytics** to `index.html`:
   ```html
   <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
   <script>
     window.dataLayer = window.dataLayer || [];
     function gtag(){dataLayer.push(arguments);}
     gtag('js', new Date());
     gtag('config', 'G-XXXXXXXXXX');
   </script>
   ```

2. **Monitor GitHub Pages traffic**:
   - Repository → Insights → Traffic

---

## Cost & Limits

### GitHub Pages (Free Tier)
- **Bandwidth**: 100GB/month
- **Build time**: 10 minutes max per build
- **Repository size**: 1GB recommended
- **File size**: 100MB max per file

For this Power-Up:
- Built size: ~530KB (well within limits)
- Typical usage: <1GB bandwidth/month for small teams

---

## Support

If you encounter issues:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review browser console for errors (F12)
3. Check GitHub Actions logs for deployment errors
4. Verify GitHub Pages is enabled and deployed
5. Test the manifest.json URL directly in browser

---

## Next Steps

Now that your Power-Up is deployed:

1. **Share with your team**: Add the Power-Up to team boards
2. **Collect feedback**: See how people use it
3. **Continue development**: Add Phase 3 (Drawing) and Phase 4 (Highlights)
4. **Star the repo**: Help others find this project
5. **Customize**: Update the icon, name, and description to match your brand

Happy annotating! 🎨📌
