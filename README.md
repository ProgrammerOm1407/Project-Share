# QuickShare - Simple File Sharing Application

QuickShare is a web-based application that allows you to easily share files between devices. It comes in two versions:

1. **Server Version**: Uses Node.js with WebSockets for reliable file sharing on a local network
2. **P2P Version**: Uses WebRTC for direct browser-to-browser file sharing, works on GitHub Pages

Both versions support QR code scanning for easy connections between devices.

## Features

- Direct device-to-device file sharing
- QR code generation and scanning for easy connection between devices
- Multiple connection methods (QR code, manual ID entry, shareable link)
- Support for sharing any file type (documents, images, videos, etc.)
- Real-time file transfer with progress indication
- Works between mobile and desktop devices
- No file size limitations (except for browser limitations)

## Two Versions to Choose From

### Server Version
- Requires Node.js server
- More reliable for large files
- Works on local network without internet
- Better performance for multiple connections
- Ideal for home/office use

### P2P Version
- Works directly in the browser
- No server required
- Can be hosted on GitHub Pages
- Uses WebRTC for direct peer connections
- Great for quick sharing without setup

## How to Use

### Server Version Setup

1. Install Node.js if you don't have it already
2. Clone or download this repository
3. Open a terminal in the project directory
4. Run `npm install` to install dependencies
5. Run `npm start` to start the server
6. Note the Network URL displayed in the console (e.g., `http://192.168.1.100:3000`)
7. Open the URL and click "Launch Server Version"

### P2P Version Setup

1. Simply open the `index-p2p.html` file in your browser
2. Or host the files on any static web server (including GitHub Pages)
3. See `GITHUB_SETUP.md` for detailed instructions on GitHub Pages setup

### Sharing Files (Both Versions)

1. Open the application in a browser on your device
2. You'll see your Device/Connection ID and a QR code
3. Connect to another device using one of these methods:
   - Scan the QR code from the other device
   - Let the other device scan your QR code using the "Scan QR Code" button
   - Manually enter the Device/Connection ID
   - Share the connection link via messaging apps
4. Once connected, select files to share and click "Send Files"
5. The recipient will see the files and can download them

## Technical Details

### Server Version
- Built with Node.js, Express, and Socket.IO
- Uses WebSockets for real-time communication
- Files are transferred in chunks through the server

### P2P Version
- Uses PeerJS (WebRTC) for direct browser-to-browser connections
- No server involved in file transfer (only for connection setup)
- Works on static hosting like GitHub Pages

## Requirements

### Server Version
- Node.js 14.x or higher
- Modern web browser with WebSocket support
- Devices must be on the same local network

### P2P Version
- Modern browser with WebRTC support (Chrome, Firefox, Edge, Safari)
- Internet connection (for initial connection setup)

## GitHub Pages Deployment

See `GITHUB_SETUP.md` for detailed instructions on how to deploy QuickShare on GitHub Pages.

## License

MIT