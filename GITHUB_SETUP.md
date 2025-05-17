# Setting Up QuickShare on GitHub Pages

This guide will help you set up QuickShare on GitHub Pages so you can share files directly from your GitHub repository.

## Step 1: Fork or Clone the Repository

1. Fork this repository to your GitHub account
2. Or clone it and push to a new repository under your account

## Step 2: Configure GitHub Pages

1. Go to your repository on GitHub
2. Click on "Settings" (tab at the top)
3. In the left sidebar, click on "Pages" under "Code and automation"
4. Under "Source", select the branch you want to deploy (usually `main` or `master`)
5. Set the folder to `/` (root)
6. Click "Save"
7. GitHub will provide you with a URL where your site is published (e.g., `https://yourusername.github.io/quickshare/`)

## Step 3: Verify Your Deployment

1. Wait a few minutes for GitHub to deploy your site
2. Visit the URL provided by GitHub
3. You should see the QuickShare home page with two options:
   - Server Version (requires Node.js)
   - P2P Version (works on GitHub Pages)
4. Click on "Launch P2P Version" to use the GitHub Pages compatible version

## Step 4: Share Your QuickShare URL

1. Share the URL of your GitHub Pages deployment with others
2. They can visit the URL and connect to your device for file sharing
3. No server setup required!

## Important Notes for GitHub Pages

1. **Use the P2P Version**: The server version won't work on GitHub Pages because it requires a Node.js server. Always use the P2P version when hosting on GitHub Pages.

2. **Connection IDs**: The P2P version uses PeerJS to establish connections. Each device gets a unique connection ID that others can use to connect.

3. **QR Code Scanning**: The QR code scanning feature requires camera access, which only works on HTTPS sites (GitHub Pages provides this).

4. **File Size Limitations**: While there's no hard limit on file sizes, very large files may cause browser performance issues. The P2P connection might also be slower than the server version.

5. **Browser Compatibility**: The P2P version uses WebRTC, which is supported by most modern browsers (Chrome, Firefox, Edge, Safari). Older browsers may not work.

## Customizing Your Deployment

You can customize your QuickShare deployment by:

1. Editing the HTML/CSS files to change the appearance
2. Updating the GitHub link in `home.html` to point to your repository
3. Modifying the PeerJS configuration in `client-p2p.js` if you want to use your own PeerJS server

## Troubleshooting

If you encounter issues with your GitHub Pages deployment:

1. Make sure GitHub Pages is properly configured in your repository settings
2. Check that you're using the P2P version, not the server version
3. Verify that your browser supports WebRTC
4. Try using Chrome or Firefox if you experience issues with other browsers
5. Check the browser console for any error messages

For more help, please open an issue on the GitHub repository.