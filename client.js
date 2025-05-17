// Client-side JavaScript for QuickShare application

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

    // Connect to socket.io server
    const socket = io();
    
    // Generate a random device ID
    const deviceId = generateDeviceId();
    deviceIdElement.textContent = deviceId;
    
    // Set up the share URL
    const baseUrl = window.location.href.split('?')[0];
    const shareUrl = baseUrl + '?connect=' + deviceId;
    if (shareUrlInput) {
        shareUrlInput.value = shareUrl;
    }
    
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
    
    // Generate QR code for the device ID
    try {
        // Get the base URL without any query parameters
        const baseUrl = window.location.href.split('?')[0];
        const qrCodeText = baseUrl + '?connect=' + deviceId;
        
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
                <p>Device ID: ${deviceId}</p>
                <p>User Agent: ${navigator.userAgent}</p>
                <p>QRCode library loaded: ${typeof QRCode !== 'undefined'}</p>
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
                 alt="QR Code for ${deviceId}" 
                 title="Scan this QR code to connect" />
            <p>Your device ID is: ${deviceId}</p>
        `;
    }

    // Socket connection events
    socket.on('connect', () => {
        console.log('Connected to server');
        socket.emit('register', { deviceId });
        updateStatus('Connected to server', 'status-connected');
    });

    socket.on('disconnect', () => {
        console.log('Disconnected from server');
        updateStatus('Disconnected from server', 'status-disconnected');
        sendBtn.disabled = true;
    });

    // Handle peer connection events
    socket.on('peer-connected', (data) => {
        console.log('Peer connected:', data.peerId);
        updateStatus(`Connected to ${data.peerId}`, 'status-connected');
        addConnectedPeer(data.peerId);
        sendBtn.disabled = false;
    });

    socket.on('peer-disconnected', (data) => {
        console.log('Peer disconnected:', data.peerId);
        updateStatus('Peer disconnected', 'status-disconnected');
        removeConnectedPeer(data.peerId);
        sendBtn.disabled = true;
    });

    // Handle file transfer events
    socket.on('file-metadata', (data) => {
        console.log('Receiving file metadata:', data);
        createFileReceiveElement(data);
    });

    socket.on('file-chunk', (data) => {
        console.log('Received file chunk:', data.fileName, data.chunkIndex, data.totalChunks);
        updateFileProgress(data);
    });

    socket.on('file-complete', (data) => {
        console.log('File transfer complete:', data.fileName);
        completeFileTransfer(data);
    });

    // Connect to another peer
    connectBtn.addEventListener('click', () => {
        const peerId = peerIdInput.value.trim();
        if (peerId && peerId !== deviceId) {
            console.log('Connecting to peer:', peerId);
            updateStatus(`Connecting to ${peerId}...`, 'status-connecting');
            socket.emit('connect-to-peer', { 
                sourceId: deviceId,
                targetId: peerId 
            });
        } else {
            alert('Please enter a valid peer ID');
        }
    });
    
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

    // Check URL for connection parameter
    checkUrlForConnection();
    
    // QR Scanner functions
    function initQrScanner() {
        try {
            // Show scanner container
            qrScannerContainer.classList.remove('hidden');
            
            // Check if HTML5 QR Code scanner is available
            if (typeof Html5Qrcode === 'undefined') {
                console.error('HTML5 QR Code scanner library not loaded');
                alert('QR Code scanner is not available. Please try entering the Device ID manually.');
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
                alert('Could not access camera. Please check camera permissions or try entering the Device ID manually.');
                qrScannerContainer.classList.add('hidden');
            });
            
            console.log('QR scanner started with camera:', currentCamera);
        } catch (error) {
            console.error('Error initializing QR scanner:', error);
            alert('QR scanner initialization failed. Please try entering the Device ID manually.');
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
                // If it's just a device ID
                peerId = decodedText;
            }
            
            if (peerId && peerId.trim() !== '') {
                // Set the peer ID in the input field
                peerIdInput.value = peerId.trim();
                
                // Connect to the peer
                console.log('Connecting to scanned peer:', peerId);
                updateStatus(`Connecting to ${peerId}...`, 'status-connecting');
                socket.emit('connect-to-peer', { 
                    sourceId: deviceId,
                    targetId: peerId 
                });
            } else {
                alert('Invalid QR code. Please try again or enter the Device ID manually.');
            }
        } catch (error) {
            console.error('Error processing QR code:', error);
            alert('Could not process QR code. Please try again or enter the Device ID manually.');
        }
    }
    
    function onQrCodeError(error) {
        // This is called continuously while scanning, so we don't need to do anything here
        // console.log('QR code scanning in progress...');
    }

    // Send files
    fileInput.addEventListener('change', () => {
        sendBtn.disabled = fileInput.files.length === 0;
    });

    sendBtn.addEventListener('click', () => {
        if (fileInput.files.length > 0) {
            Array.from(fileInput.files).forEach(file => {
                sendFile(file);
            });
        }
    });

    // Helper functions
    function generateDeviceId() {
        return Math.random().toString(36).substring(2, 10);
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

    function checkUrlForConnection() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const connectParam = urlParams.get('connect');
            
            if (connectParam && connectParam.trim() !== '') {
                console.log('Found connection parameter in URL:', connectParam);
                peerIdInput.value = connectParam;
                
                // Auto-connect after a short delay to ensure everything is initialized
                setTimeout(() => {
                    console.log('Auto-connecting to peer:', connectParam);
                    connectBtn.click();
                }, 1500);
            }
        } catch (error) {
            console.error('Error checking URL for connection:', error);
        }
    }

    // File handling functions
    function sendFile(file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const fileData = event.target.result;
            const chunkSize = 1024 * 16; // 16KB chunks
            const totalChunks = Math.ceil(fileData.byteLength / chunkSize);
            
            // Send file metadata first
            socket.emit('file-metadata', {
                sourceId: deviceId,
                fileName: file.name,
                fileType: file.type,
                fileSize: file.size,
                totalChunks: totalChunks
            });
            
            // Send file in chunks
            for (let i = 0; i < totalChunks; i++) {
                const start = i * chunkSize;
                const end = Math.min(fileData.byteLength, start + chunkSize);
                const chunk = fileData.slice(start, end);
                
                socket.emit('file-chunk', {
                    sourceId: deviceId,
                    fileName: file.name,
                    chunk: chunk,
                    chunkIndex: i,
                    totalChunks: totalChunks
                });
            }
        };
        reader.readAsArrayBuffer(file);
    }

    // File receiving functions
    const fileBuffers = {};

    function createFileReceiveElement(data) {
        const fileElement = document.createElement('div');
        fileElement.className = 'file-item';
        fileElement.id = `file-${data.fileName.replace(/[^a-z0-9]/gi, '_')}`;
        
        fileElement.innerHTML = `
            <div>
                <p>${data.fileName} (${formatFileSize(data.fileSize)})</p>
                <div class="progress-container">
                    <div class="progress-bar" style="width: 0%"></div>
                </div>
            </div>
        `;
        
        receivedFilesContainer.appendChild(fileElement);
        
        // Initialize buffer for this file
        fileBuffers[data.fileName] = {
            chunks: new Array(data.totalChunks),
            receivedChunks: 0,
            totalChunks: data.totalChunks,
            fileType: data.fileType,
            fileSize: data.fileSize
        };
    }

    function updateFileProgress(data) {
        const fileBuffer = fileBuffers[data.fileName];
        if (fileBuffer) {
            fileBuffer.chunks[data.chunkIndex] = data.chunk;
            fileBuffer.receivedChunks++;
            
            const progress = (fileBuffer.receivedChunks / fileBuffer.totalChunks) * 100;
            const progressBar = document.querySelector(`#file-${data.fileName.replace(/[^a-z0-9]/gi, '_')} .progress-bar`);
            
            if (progressBar) {
                progressBar.style.width = `${progress}%`;
            }
            
            // If all chunks received, emit complete event
            if (fileBuffer.receivedChunks === fileBuffer.totalChunks) {
                socket.emit('file-received', {
                    sourceId: deviceId,
                    fileName: data.fileName
                });
            }
        }
    }

    function completeFileTransfer(data) {
        const fileBuffer = fileBuffers[data.fileName];
        if (fileBuffer) {
            // Combine chunks into a single buffer
            const fileBlob = new Blob(fileBuffer.chunks, { type: fileBuffer.fileType });
            const fileUrl = URL.createObjectURL(fileBlob);
            
            // Update the file element with download link
            const fileElement = document.getElementById(`file-${data.fileName.replace(/[^a-z0-9]/gi, '_')}`);
            if (fileElement) {
                fileElement.innerHTML = `
                    <div>
                        <p>${data.fileName} (${formatFileSize(fileBuffer.fileSize)})</p>
                    </div>
                    <a href="${fileUrl}" download="${data.fileName}">Download</a>
                `;
            }
            
            // Clean up
            delete fileBuffers[data.fileName];
        }
    }

    function formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' bytes';
        else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        else if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
        else return (bytes / 1073741824).toFixed(1) + ' GB';
    }
});