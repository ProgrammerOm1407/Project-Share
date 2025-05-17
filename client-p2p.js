// Client-side JavaScript for QuickShare P2P application
// This version uses PeerJS for WebRTC connections and works on GitHub Pages

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const deviceIdElement = document.getElementById('device-id');
    const qrcodeContainer = document.getElementById('qrcode');
    const peerIdInput = document.getElementById('peer-id');
    const connectBtn = document.getElementById('connect-btn');
    const fileInput = document.getElementById('file-input');
    const sendBtn = document.getElementById('send-btn');
    const receivedFilesContainer = document.getElementById('received-files');
    const statusMessage = document.getElementById('status-message');
    const connectedPeersContainer = document.getElementById('connected-peers');
    const shareUrlInput = document.getElementById('share-url');
    const copyUrlBtn = document.getElementById('copy-url-btn');
    
    // QR Scanner elements
    const scanQrBtn = document.getElementById('scan-qr-btn');
    const qrScannerContainer = document.getElementById('qr-scanner-container');
    const qrScannerVideo = document.getElementById('qr-scanner-video');
    const cancelScanBtn = document.getElementById('cancel-scan-btn');
    const switchCameraBtn = document.getElementById('switch-camera-btn');
    
    // QR Scanner variables
    let html5QrCode = null;
    let currentCamera = 'environment'; // Start with back camera
    
    // PeerJS variables
    let peer = null;
    let connections = {};
    let myPeerId = null;
    
    // File transfer variables
    const fileChunks = {};
    const chunkSize = 16 * 1024; // 16KB chunks
    
    // Initialize PeerJS
    initPeer();
    
    // Set up copy button
    if (copyUrlBtn) {
        copyUrlBtn.addEventListener('click', () => {
            shareUrlInput.select();
            document.execCommand('copy');
            copyUrlBtn.textContent = 'Copied!';
            setTimeout(() => {
                copyUrlBtn.textContent = 'Copy';
            }, 2000);
        });
    }
    
    // Initialize PeerJS connection
    function initPeer() {
        try {
            // Check if PeerJS is available
            if (typeof Peer === 'undefined') {
                console.error('PeerJS library not loaded yet. Will retry in 2 seconds.');
                updateStatus('Loading PeerJS library...', 'status-connecting');
                setTimeout(initPeer, 2000);
                return;
            }
            
            updateStatus('Connecting to PeerJS server...', 'status-connecting');
            
            // Create a new Peer with a random ID using the official PeerJS cloud server
            // This uses the default PeerJS server with no custom configuration
            console.log('Connecting to default PeerJS cloud server');
            
            // Destroy existing peer if it exists
            if (peer && !peer.destroyed) {
                peer.destroy();
            }
            
            // Create new peer with debug enabled
            peer = new Peer({
                debug: 3, // Verbose logging
                config: {
                    'iceServers': [
                        { urls: 'stun:stun.l.google.com:19302' },
                        { urls: 'stun:global.stun.twilio.com:3478' }
                    ]
                }
            });
            
            // When we get a connection ID
            peer.on('open', (id) => {
                console.log('My peer ID is:', id);
                myPeerId = id;
                deviceIdElement.textContent = id;
                updateStatus('Ready to connect', '');
                
                // Generate QR code
                generateQRCode(id);
                
                // Set up share URL
                const shareUrl = window.location.href.split('?')[0] + '?connect=' + id;
                if (shareUrlInput) {
                    shareUrlInput.value = shareUrl;
                }
            });
            
            // Handle incoming connections
            peer.on('connection', (conn) => {
                handleConnection(conn);
            });
            
            // Handle errors
            peer.on('error', (err) => {
                console.error('PeerJS error:', err);
                updateStatus('Connection error: ' + err.type, 'status-disconnected');
                
                // If the server is down or network error, try to reconnect
                if (err.type === 'server-error' || err.type === 'network' || err.type === 'disconnected') {
                    // Destroy the current peer if it exists
                    if (peer && !peer.destroyed) {
                        peer.destroy();
                    }
                    
                    // Try to reconnect after a short delay
                    console.log('Attempting to reconnect to PeerJS server...');
                    setTimeout(initPeer, 2000);
                }
            });
            
            // Handle disconnection
            peer.on('disconnected', () => {
                console.log('Disconnected from PeerJS server');
                updateStatus('Disconnected from server - attempting to reconnect...', 'status-disconnected');
                
                // Try to reconnect immediately
                if (peer && !peer.destroyed) {
                    console.log('Attempting immediate reconnection...');
                    peer.reconnect();
                }
                
                // Set up a more aggressive reconnection strategy
                let reconnectAttempts = 0;
                const maxReconnectAttempts = 5;
                const reconnectInterval = setInterval(() => {
                    reconnectAttempts++;
                    
                    if (peer && !peer.disconnected) {
                        // Successfully reconnected
                        console.log('Successfully reconnected to PeerJS server');
                        clearInterval(reconnectInterval);
                        updateStatus('Connected to PeerJS server', '');
                        return;
                    }
                    
                    if (reconnectAttempts >= maxReconnectAttempts) {
                        // Max attempts reached, create a new peer
                        console.log(`Max reconnection attempts (${maxReconnectAttempts}) reached, creating new peer`);
                        clearInterval(reconnectInterval);
                        
                        if (peer && !peer.destroyed) {
                            peer.destroy();
                        }
                        
                        // Create a new peer connection
                        setTimeout(initPeer, 1000);
                        return;
                    }
                    
                    // Try to reconnect again
                    console.log(`Reconnection attempt ${reconnectAttempts}/${maxReconnectAttempts}...`);
                    if (peer && !peer.destroyed) {
                        peer.reconnect();
                    }
                }, 2000);
            });
            
            // Check URL for connection parameter
            checkUrlForConnection();
            
        } catch (error) {
            console.error('Error initializing PeerJS:', error);
            updateStatus('Failed to initialize connection', 'status-disconnected');
        }
    }
    
    // Generate QR code for the peer ID
    function generateQRCode(peerId) {
        try {
            // Get the base URL without any query parameters
            const baseUrl = window.location.href.split('?')[0];
            const qrCodeText = baseUrl + '?connect=' + peerId;
            
            // Debug mode - check URL parameters
            const urlParams = new URLSearchParams(window.location.search);
            const debugMode = urlParams.get('debug') === 'true';
            
            if (debugMode) {
                console.log('DEBUG MODE ENABLED');
                // Add debug info to the page
                const debugInfo = document.createElement('div');
                debugInfo.className = 'debug-info';
                debugInfo.innerHTML = `
                    <h3>Debug Information</h3>
                    <p>QR Code URL: ${qrCodeText}</p>
                    <p>Peer ID: ${peerId}</p>
                    <p>User Agent: ${navigator.userAgent}</p>
                    <p>QRCode library loaded: ${typeof QRCode !== 'undefined'}</p>
                    <p>PeerJS library loaded: ${typeof Peer !== 'undefined'}</p>
                `;
                document.body.appendChild(debugInfo);
            }
            
            console.log('Generating QR code with URL:', qrCodeText);
            
            // Clear any existing content
            qrcodeContainer.innerHTML = '';
            
            // Try to create QR code with canvas first
            try {
                QRCode.toCanvas(qrcodeContainer, qrCodeText, {
                    width: 200,
                    margin: 1,
                    color: {
                        dark: '#4a6fa5',
                        light: '#ffffff'
                    }
                }, function(error) {
                    if (error) {
                        // If canvas fails, try with image
                        console.log('Canvas QR code failed, trying with image');
                        QRCode.toDataURL(qrCodeText, { 
                            width: 200,
                            margin: 1,
                            color: {
                                dark: '#4a6fa5',
                                light: '#ffffff'
                            }
                        }, function(err, url) {
                            if (err) {
                                console.error('QR code generation failed:', err);
                                qrcodeContainer.textContent = 'QR Code generation failed';
                            } else {
                                const img = document.createElement('img');
                                img.src = url;
                                qrcodeContainer.appendChild(img);
                            }
                        });
                    }
                });
            } catch (canvasError) {
                // If toCanvas is not available, fall back to toDataURL
                console.log('QRCode.toCanvas not available, using toDataURL instead');
                QRCode.toDataURL(qrCodeText, { 
                    width: 200,
                    margin: 1,
                    color: {
                        dark: '#4a6fa5',
                        light: '#ffffff'
                    }
                }, function(err, url) {
                    if (err) {
                        console.error('QR code generation failed:', err);
                        qrcodeContainer.textContent = 'QR Code generation failed';
                    } else {
                        const img = document.createElement('img');
                        img.src = url;
                        qrcodeContainer.appendChild(img);
                    }
                });
            }
        } catch (error) {
            console.error('QR code generation error:', error);
            // Create a fallback QR code using a third-party service
            qrcodeContainer.innerHTML = `
                <p>QR Code generation failed locally.</p>
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeText)}" 
                     alt="QR Code for ${peerId}" 
                     title="Scan this QR code to connect" />
                <p>Your peer ID is: ${peerId}</p>
            `;
        }
    }
    
    // Connect to another peer
    connectBtn.addEventListener('click', () => {
        const targetPeerId = peerIdInput.value.trim();
        if (targetPeerId && targetPeerId !== myPeerId) {
            connectToPeer(targetPeerId);
        } else {
            alert('Please enter a valid peer ID');
        }
    });
    
    function connectToPeer(targetPeerId) {
        try {
            console.log('Connecting to peer:', targetPeerId);
            updateStatus(`Connecting to ${targetPeerId}...`, 'status-connecting');
            
            // Check if we're already connected to this peer
            if (connections[targetPeerId]) {
                console.log('Already connected to this peer');
                updateStatus(`Already connected to ${targetPeerId}`, 'status-connected');
                return;
            }
            
            // Connect to the peer
            const conn = peer.connect(targetPeerId, {
                reliable: true
            });
            
            handleConnection(conn);
            
        } catch (error) {
            console.error('Error connecting to peer:', error);
            updateStatus('Connection failed', 'status-disconnected');
        }
    }
    
    function handleConnection(conn) {
        // Store the connection
        connections[conn.peer] = conn;
        
        conn.on('open', () => {
            console.log('Connected to peer:', conn.peer);
            updateStatus(`Connected to ${conn.peer}`, 'status-connected');
            addConnectedPeer(conn.peer);
            sendBtn.disabled = false;
            
            // Send a greeting
            conn.send({
                type: 'greeting',
                peerId: myPeerId,
                message: 'Hello from ' + myPeerId
            });
        });
        
        conn.on('data', (data) => {
            console.log('Received data:', data);
            handleIncomingData(conn.peer, data);
        });
        
        conn.on('close', () => {
            console.log('Connection closed:', conn.peer);
            updateStatus('Disconnected from peer', 'status-disconnected');
            removeConnectedPeer(conn.peer);
            delete connections[conn.peer];
            sendBtn.disabled = Object.keys(connections).length === 0;
        });
        
        conn.on('error', (err) => {
            console.error('Connection error:', err);
            updateStatus('Connection error', 'status-disconnected');
        });
    }
    
    // Handle incoming data
    function handleIncomingData(peerId, data) {
        if (!data.type) return;
        
        switch (data.type) {
            case 'greeting':
                console.log('Received greeting:', data.message);
                break;
                
            case 'file-start':
                console.log('File transfer starting:', data.fileName);
                createFileReceiveElement(data);
                // Initialize file chunks storage
                fileChunks[data.fileId] = {
                    fileName: data.fileName,
                    fileType: data.fileType,
                    fileSize: data.fileSize,
                    chunks: [],
                    receivedChunks: 0,
                    totalChunks: data.totalChunks
                };
                break;
                
            case 'file-chunk':
                receiveFileChunk(data);
                break;
                
            case 'file-end':
                completeFileTransfer(data);
                break;
        }
    }
    
    // Send files
    fileInput.addEventListener('change', () => {
        sendBtn.disabled = fileInput.files.length === 0 || Object.keys(connections).length === 0;
    });
    
    sendBtn.addEventListener('click', () => {
        if (fileInput.files.length > 0 && Object.keys(connections).length > 0) {
            Array.from(fileInput.files).forEach(file => {
                sendFile(file);
            });
        }
    });
    
    function sendFile(file) {
        // Generate a unique file ID
        const fileId = generateFileId();
        
        // Get all connected peers
        const peers = Object.keys(connections);
        
        if (peers.length === 0) {
            alert('No connected peers to send file to');
            return;
        }
        
        // Calculate total chunks
        const totalChunks = Math.ceil(file.size / chunkSize);
        
        // Send file start message to all peers
        peers.forEach(peerId => {
            const conn = connections[peerId];
            if (conn && conn.open) {
                conn.send({
                    type: 'file-start',
                    fileId: fileId,
                    fileName: file.name,
                    fileType: file.type,
                    fileSize: file.size,
                    totalChunks: totalChunks,
                    sender: myPeerId
                });
            }
        });
        
        // Read and send file in chunks
        const reader = new FileReader();
        let chunkIndex = 0;
        
        reader.onload = (e) => {
            const chunk = e.target.result;
            
            // Send chunk to all peers
            peers.forEach(peerId => {
                const conn = connections[peerId];
                if (conn && conn.open) {
                    conn.send({
                        type: 'file-chunk',
                        fileId: fileId,
                        chunkIndex: chunkIndex,
                        totalChunks: totalChunks,
                        chunk: chunk
                    });
                }
            });
            
            chunkIndex++;
            
            // If there are more chunks to send
            if (chunkIndex < totalChunks) {
                readNextChunk();
            } else {
                // Send file end message
                peers.forEach(peerId => {
                    const conn = connections[peerId];
                    if (conn && conn.open) {
                        conn.send({
                            type: 'file-end',
                            fileId: fileId,
                            fileName: file.name
                        });
                    }
                });
            }
        };
        
        function readNextChunk() {
            const start = chunkIndex * chunkSize;
            const end = Math.min(file.size, start + chunkSize);
            reader.readAsArrayBuffer(file.slice(start, end));
        }
        
        // Start reading the first chunk
        readNextChunk();
    }
    
    function receiveFileChunk(data) {
        const fileData = fileChunks[data.fileId];
        
        if (fileData) {
            // Store the chunk
            fileData.chunks[data.chunkIndex] = data.chunk;
            fileData.receivedChunks++;
            
            // Update progress
            const progress = (fileData.receivedChunks / fileData.totalChunks) * 100;
            updateFileProgress(data.fileId, progress);
        }
    }
    
    function completeFileTransfer(data) {
        const fileData = fileChunks[data.fileId];
        
        if (fileData) {
            // Combine all chunks into a single blob
            const fileBlob = new Blob(fileData.chunks, { type: fileData.fileType });
            
            // Create download link
            const fileUrl = URL.createObjectURL(fileBlob);
            
            // Update the file element
            const fileElement = document.getElementById(`file-${data.fileId}`);
            if (fileElement) {
                fileElement.innerHTML = `
                    <div>
                        <p>${fileData.fileName} (${formatFileSize(fileData.fileSize)})</p>
                    </div>
                    <a href="${fileUrl}" download="${fileData.fileName}">Download</a>
                `;
            }
            
            // Clean up
            delete fileChunks[data.fileId];
        }
    }
    
    // QR Scanner functionality
    if (scanQrBtn && qrScannerContainer) {
        // Initialize QR scanner when button is clicked
        scanQrBtn.addEventListener('click', () => {
            initQrScanner();
        });
        
        // Cancel scanning
        if (cancelScanBtn) {
            cancelScanBtn.addEventListener('click', () => {
                stopQrScanner();
            });
        }
        
        // Switch camera
        if (switchCameraBtn) {
            switchCameraBtn.addEventListener('click', () => {
                currentCamera = currentCamera === 'environment' ? 'user' : 'environment';
                stopQrScanner();
                initQrScanner();
            });
        }
    }
    
    function initQrScanner() {
        try {
            // Show scanner container
            qrScannerContainer.classList.remove('hidden');
            
            // Check if HTML5 QR Code scanner is available
            if (typeof Html5Qrcode === 'undefined') {
                console.error('HTML5 QR Code scanner library not loaded');
                alert('QR Code scanner is not available. Please try entering the Peer ID manually.');
                qrScannerContainer.classList.add('hidden');
                return;
            }
            
            // Create scanner instance
            html5QrCode = new Html5Qrcode("qr-scanner-video-container");
            
            // Camera options
            const config = { 
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0
            };
            
            // Start scanning
            html5QrCode.start(
                { facingMode: currentCamera },
                config,
                onQrCodeSuccess,
                onQrCodeError
            ).catch((err) => {
                console.error('Error starting QR scanner:', err);
                alert('Could not access camera. Please check camera permissions or try entering the Peer ID manually.');
                qrScannerContainer.classList.add('hidden');
            });
            
            console.log('QR scanner started with camera:', currentCamera);
        } catch (error) {
            console.error('Error initializing QR scanner:', error);
            alert('QR scanner initialization failed. Please try entering the Peer ID manually.');
            qrScannerContainer.classList.add('hidden');
        }
    }
    
    function stopQrScanner() {
        if (html5QrCode && html5QrCode.isScanning) {
            html5QrCode.stop().then(() => {
                console.log('QR scanner stopped');
                qrScannerContainer.classList.add('hidden');
            }).catch(err => {
                console.error('Error stopping QR scanner:', err);
            });
        } else {
            qrScannerContainer.classList.add('hidden');
        }
    }
    
    function onQrCodeSuccess(decodedText) {
        console.log('QR code scanned:', decodedText);
        
        // Stop scanner
        stopQrScanner();
        
        try {
            // Try to extract the connect parameter from the URL
            let peerId = '';
            
            // Check if it's a URL with connect parameter
            if (decodedText.includes('?connect=')) {
                const url = new URL(decodedText);
                peerId = url.searchParams.get('connect');
            } else {
                // If it's just a peer ID
                peerId = decodedText;
            }
            
            if (peerId && peerId.trim() !== '') {
                // Set the peer ID in the input field
                peerIdInput.value = peerId.trim();
                
                // Connect to the peer
                connectToPeer(peerId.trim());
            } else {
                alert('Invalid QR code. Please try again or enter the Peer ID manually.');
            }
        } catch (error) {
            console.error('Error processing QR code:', error);
            alert('Could not process QR code. Please try again or enter the Peer ID manually.');
        }
    }
    
    function onQrCodeError(error) {
        // This is called continuously while scanning, so we don't need to do anything here
    }
    
    // Check URL for connection parameter
    function checkUrlForConnection() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const connectParam = urlParams.get('connect');
            
            if (connectParam && connectParam.trim() !== '') {
                console.log('Found connection parameter in URL:', connectParam);
                peerIdInput.value = connectParam.trim();
                
                // Wait for peer to initialize before connecting
                const checkPeerAndConnect = () => {
                    if (myPeerId) {
                        // Auto-connect after a short delay
                        setTimeout(() => {
                            console.log('Auto-connecting to peer:', connectParam);
                            connectToPeer(connectParam.trim());
                        }, 1500);
                    } else {
                        // Check again in 500ms
                        setTimeout(checkPeerAndConnect, 500);
                    }
                };
                
                checkPeerAndConnect();
            }
        } catch (error) {
            console.error('Error checking URL for connection:', error);
        }
    }
    
    // Helper functions
    function generateFileId() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }
    
    function updateStatus(message, className) {
        statusMessage.textContent = message;
        statusMessage.className = className || '';
    }
    
    function addConnectedPeer(peerId) {
        const peerElement = document.createElement('div');
        peerElement.className = 'peer-item';
        peerElement.id = `peer-${peerId}`;
        peerElement.textContent = `Connected to: ${peerId}`;
        connectedPeersContainer.appendChild(peerElement);
    }
    
    function removeConnectedPeer(peerId) {
        const peerElement = document.getElementById(`peer-${peerId}`);
        if (peerElement) {
            peerElement.remove();
        }
    }
    
    function createFileReceiveElement(data) {
        const fileElement = document.createElement('div');
        fileElement.className = 'file-item';
        fileElement.id = `file-${data.fileId}`;
        
        fileElement.innerHTML = `
            <div>
                <p>${data.fileName} (${formatFileSize(data.fileSize)})</p>
                <div class="progress-container">
                    <div class="progress-bar" style="width: 0%"></div>
                </div>
            </div>
        `;
        
        receivedFilesContainer.appendChild(fileElement);
    }
    
    function updateFileProgress(fileId, progress) {
        const progressBar = document.querySelector(`#file-${fileId} .progress-bar`);
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }
    }
    
    function formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' bytes';
        else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        else if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
        else return (bytes / 1073741824).toFixed(1) + ' GB';
    }
});