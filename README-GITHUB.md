# QuickShare - P2P File Sharing for GitHub Pages

QuickShare is a web-based application that allows you to easily share files between devices using peer-to-peer WebRTC connections. This version is specifically designed to work on GitHub Pages.

## Features

- Direct peer-to-peer file sharing (no server required for file transfer)
- Works on GitHub Pages (static hosting)
- QR code generation and scanning for easy connection between devices
- Multiple connection methods (QR code, manual ID entry, shareable link)
- Support for sharing any file type (documents, images, videos, etc.)
- Real-time file transfer with progress indication
- Works between mobile and desktop devices
- No file size limitations (except for browser limitations)

## How to Use

### Setup for GitHub Pages

1. Fork this repository
2. Go to your repository settings
3. Navigate to "Pages" under "Code and automation"
4. Select the branch you want to deploy (usually `main` or `master`)
5. Set the folder to `/` (root) or `/docs` if you moved the files there
6. Click "Save"
7. Wait for GitHub to deploy your site (you'll see a link when it's ready)

### Sharing Files

1. Open the GitHub Pages URL in a browser on your device
2. You'll see your Connection ID and a QR code
3. Connect to another device using one of these methods:
   - Scan the QR code from the other device
   - Let the other device scan your QR code using the "Scan QR Code" button
   - Manually enter the Connection ID
   - Share the connection link via messaging apps
4. Once connected, select files to share and click "Send Files"
5. The recipient will see the files and can download them

## How It Works

This version of QuickShare uses WebRTC (via PeerJS) to establish direct peer-to-peer connections between browsers. This allows it to work on static hosting like GitHub Pages without requiring a custom server.

The application uses a free STUN/TURN server for connection establishment, but all file data is transferred directly between devices without going through any server.

## Important Notes

- Both devices must have the application open at the same time
- The connection is temporary - if you refresh the page, you'll need to reconnect
- For large files, keep both browser windows open until the transfer completes
- WebRTC connections work best on modern browsers (Chrome, Firefox, Edge, Safari)
- Mobile browsers may have limitations with camera access for QR scanning

## Privacy & Security

- All file transfers are direct between devices (peer-to-peer)
- No files are stored on any servers
- Connections are encrypted using WebRTC's built-in encryption
- No data is retained after closing the browser tab

## Troubleshooting

If you encounter issues:

1. Make sure both devices are using compatible browsers
2. Check that you have a stable internet connection
3. Try using the manual Connection ID instead of QR codes
4. If on mobile, ensure camera permissions are granted for QR scanning
5. For connection issues, try refreshing both pages and reconnecting

## License

MIT