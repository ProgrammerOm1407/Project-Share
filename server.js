const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const ip = require('ip');

// Create Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files
app.use(express.static(path.join(__dirname, '/')));

// Store connected clients
const clients = {};

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Register device
    socket.on('register', (data) => {
        const { deviceId } = data;
        console.log(`Device registered: ${deviceId} (${socket.id})`);
        
        // Store client info
        clients[deviceId] = {
            socketId: socket.id,
            connectedPeers: []
        };
        
        // Associate socket with deviceId for easier lookup
        socket.deviceId = deviceId;
    });

    // Connect to peer
    socket.on('connect-to-peer', (data) => {
        let { sourceId, targetId } = data;
        
        // Normalize IDs (trim whitespace and convert to lowercase)
        sourceId = sourceId.trim();
        targetId = targetId.trim();
        
        console.log(`Connection request: ${sourceId} -> ${targetId}`);
        
        // Check if source is registered
        if (!clients[sourceId]) {
            console.log(`Source device ${sourceId} not registered, registering now`);
            clients[sourceId] = {
                socketId: socket.id,
                connectedPeers: []
            };
            socket.deviceId = sourceId;
        }
        
        // Check if target exists (case-insensitive search)
        const targetDeviceId = Object.keys(clients).find(
            id => id.toLowerCase() === targetId.toLowerCase()
        );
        
        if (targetDeviceId) {
            const targetSocketId = clients[targetDeviceId].socketId;
            
            // Use the actual case of the found device ID
            targetId = targetDeviceId;
            
            // Notify both peers about the connection
            socket.emit('peer-connected', { peerId: targetId });
            io.to(targetSocketId).emit('peer-connected', { peerId: sourceId });
            
            // Update connected peers lists
            if (!clients[sourceId].connectedPeers.includes(targetId)) {
                clients[sourceId].connectedPeers.push(targetId);
            }
            
            if (!clients[targetId].connectedPeers.includes(sourceId)) {
                clients[targetId].connectedPeers.push(sourceId);
            }
            
            console.log(`Connection established: ${sourceId} <-> ${targetId}`);
        } else {
            console.log(`Target device ${targetId} not found`);
            socket.emit('error', { message: 'Peer not found or not online. Make sure both devices are connected to the server.' });
        }
    });

    // File transfer events
    socket.on('file-metadata', (data) => {
        const { sourceId, fileName, fileType, fileSize, totalChunks } = data;
        console.log(`File metadata received: ${fileName} (${formatFileSize(fileSize)})`);
        
        // Forward metadata to all connected peers
        forwardToPeers(sourceId, 'file-metadata', data);
    });

    socket.on('file-chunk', (data) => {
        const { sourceId, fileName, chunkIndex, totalChunks } = data;
        // Forward chunk to all connected peers
        forwardToPeers(sourceId, 'file-chunk', data);
    });

    socket.on('file-received', (data) => {
        const { sourceId, fileName } = data;
        console.log(`File received confirmation: ${fileName}`);
        
        // Forward completion to source
        if (clients[sourceId]) {
            const sourceSocketId = clients[sourceId].socketId;
            io.to(sourceSocketId).emit('file-complete', { fileName });
        }
    });

    // Disconnect handling
    socket.on('disconnect', () => {
        const deviceId = socket.deviceId;
        console.log(`Client disconnected: ${deviceId}`);
        
        if (deviceId && clients[deviceId]) {
            // Notify all connected peers about disconnection
            clients[deviceId].connectedPeers.forEach(peerId => {
                if (clients[peerId]) {
                    const peerSocketId = clients[peerId].socketId;
                    io.to(peerSocketId).emit('peer-disconnected', { peerId: deviceId });
                    
                    // Remove from peer's connected list
                    clients[peerId].connectedPeers = clients[peerId].connectedPeers.filter(id => id !== deviceId);
                }
            });
            
            // Remove client
            delete clients[deviceId];
        }
    });

    // Helper function to forward messages to all connected peers
    function forwardToPeers(sourceId, eventName, data) {
        if (clients[sourceId]) {
            clients[sourceId].connectedPeers.forEach(peerId => {
                if (clients[peerId]) {
                    const peerSocketId = clients[peerId].socketId;
                    io.to(peerSocketId).emit(eventName, data);
                }
            });
        }
    }
});

// Helper function to format file size
function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
    else return (bytes / 1073741824).toFixed(1) + ' GB';
}

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    const localIp = ip.address();
    console.log(`Server running at:`);
    console.log(`- Local:   http://localhost:${PORT}`);
    console.log(`- Network: http://${localIp}:${PORT}`);
    console.log(`Share the network URL with other devices on the same network to connect`);
});