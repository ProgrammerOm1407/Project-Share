# QuickShare - Simple File Sharing Application

QuickShare is a web-based application that allows you to easily share files between devices on the same local network. It uses WebSockets for real-time communication and QR codes for easy connection between devices.

## Features

- Direct device-to-device file sharing on local network
- QR code generation and scanning for easy connection between devices
- Multiple connection methods (QR code, manual ID entry, shareable link)
- Support for sharing any file type (documents, images, videos, etc.)
- Real-time file transfer with progress indication
- Works between mobile and desktop devices
- No file size limitations (except for browser limitations)
- No internet connection required (works on local network)

## How to Use

### Setup

1. Install Node.js if you don't have it already
2. Clone or download this repository
3. Open a terminal in the project directory
4. Run `npm install` to install dependencies
5. Run `npm start` to start the server
6. Note the Network URL displayed in the console (e.g., `http://192.168.1.100:3000`)

### Sharing Files

1. Open the Network URL in a browser on your device
2. You'll see your Device ID and a QR code
3. Connect to another device using one of these methods:
   - Scan the QR code from the other device
   - Let the other device scan your QR code using the "Scan QR Code" button
   - Manually enter the Device ID
   - Share the connection link via messaging apps
4. Once connected, select files to share and click "Send Files"
5. The recipient will see the files and can download them

## Technical Details

- Built with Node.js, Express, and Socket.IO
- Uses WebSockets for real-time communication
- Files are transferred in chunks to handle large files
- QR codes are generated client-side using the qrcode.js library

## Requirements

- Node.js 14.x or higher
- Modern web browser with WebSocket support
- Devices must be on the same local network

## License

MIT