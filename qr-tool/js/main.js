// Function to show temporary toast notification
function showToast(message, duration = 2000) {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.backgroundColor = '#333';
    toast.style.color = 'white';
    toast.style.padding = '10px 20px';
    toast.style.borderRadius = '4px';
    toast.style.zIndex = '1000';
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    
    document.body.appendChild(toast);
    
    // Trigger reflow
    toast.offsetHeight;
    
    toast.style.opacity = '1';
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, duration);
}

// Function to show image preview
function showImagePreview(file) {
    const reader = new FileReader();
    const previewImg = document.getElementById('image-preview');
    const previewContainer = document.getElementById('image-preview-container');
    
    reader.onload = function(e) {
        previewImg.src = e.target.result;
        previewContainer.style.display = 'block';
    };
    
    reader.readAsDataURL(file);
}

// Function to remove image preview
function removeImagePreview() {
    const previewContainer = document.getElementById('image-preview-container');
    const fileInput = document.getElementById('input-qr-file');
    const fileInfo = document.getElementById('file-info');
    
    // Reset file input
    fileInput.value = '';
    
    // Hide preview
    previewContainer.style.display = 'none';
    
    // Clear file info
    fileInfo.textContent = '';
    fileInfo.style.display = 'none';
}

// Function to handle image file selection
function handleImageFile(file) {
    const fileInfo = document.getElementById('file-info');
    
    if (!file.type.startsWith('image/')) {
        fileInfo.textContent = 'Please select a valid image file';
        fileInfo.style.display = 'block';
        fileInfo.style.color = 'red';
        return false;
    }
    
    fileInfo.textContent = `Selected: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`;
    fileInfo.style.display = 'block';
    fileInfo.style.color = 'inherit';
    
    // Show image preview
    showImagePreview(file);
    return true;
}

document.addEventListener('DOMContentLoaded', () => {
    const formGenerate = document.getElementById('form-generate-qr');
    const canvas = document.getElementById('qr-canvas');
    const ctx = canvas.getContext('2d');
    const inputText = document.getElementById('input-text');
    const inputSize = document.getElementById('input-size');
    const inputColor = document.getElementById('input-color');
    const inputLogo = document.getElementById('input-logo');

    const formScan = document.getElementById('form-scan-qr');
    const inputQRFile = document.getElementById('input-qr-file');
    const dropZone = document.getElementById('drop-zone');
    const fileInfo = document.getElementById('file-info');

    // Handle drag and drop files
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });

    function highlight() {
        dropZone.classList.add('drag-over');
    }

    function unhighlight() {
        dropZone.classList.remove('drag-over');
    }

    // Handle file drop
    dropZone.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length > 0) {
            inputQRFile.files = files;
            handleImageFile(files[0]);
        }
    }

    // Handle click on drop zone to select file
    dropZone.addEventListener('click', () => {
        inputQRFile.click();
    });

    // Handle file selection
    inputQRFile.addEventListener('change', (e) => {
        if (inputQRFile.files.length > 0) {
            handleImageFile(inputQRFile.files[0]);
        }
    });

    // Handle paste image (Ctrl+V)
    document.addEventListener('paste', (e) => {
        const items = (e.clipboardData || window.clipboardData).items;
        
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const blob = items[i].getAsFile();
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(blob);
                inputQRFile.files = dataTransfer.files;
                
                // Update file info and show preview
                fileInfo.textContent = 'Image pasted from clipboard';
                fileInfo.style.display = 'block';
                fileInfo.style.color = 'inherit';
                
                // Show image preview
                showImagePreview(blob);
                
                break;
            }
        }
    });
    
    // Handle remove image button click
    document.getElementById('remove-image').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        removeImagePreview();
    });
    
    // Handle form submission
    formScan.addEventListener('submit', (e) => {
        if (!inputQRFile.files || inputQRFile.files.length === 0) {
            e.preventDefault();
            showToast('Please select or paste an image to scan QR code');
            return false;
        }
        return true;
    });

    // Clear canvas helper
    function clearCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    // Draw logo image on QR code canvas centered and scaled max 100x100 px
    function drawLogo(logoImg) {
        const maxLogoSize = 100;
        let logoWidth = logoImg.width;
        let logoHeight = logoImg.height;

        // Scale logo to max 100x100 px preserving aspect ratio
        if (logoWidth > maxLogoSize || logoHeight > maxLogoSize) {
            const scale = Math.min(maxLogoSize / logoWidth, maxLogoSize / logoHeight);
            logoWidth = logoWidth * scale;
            logoHeight = logoHeight * scale;
        }

        const x = (canvas.width - logoWidth) / 2;
        const y = (canvas.height - logoHeight) / 2;
        ctx.drawImage(logoImg, x, y, logoWidth, logoHeight);
    }

    // Generate QR code with options and optional logo
    async function generateQRCode(text, size, color, logoFile) {
        clearCanvas();
        canvas.width = size;
        canvas.height = size;

        try {
            // Generate QR code on canvas
            await QRCode.toCanvas(canvas, text, {
                width: size,
                color: {
                    dark: color,
                    light: '#ffffff'
                },
                errorCorrectionLevel: 'H'
            });

            if (logoFile) {
                const img = new Image();
                img.onload = () => {
                    drawLogo(img);
                };
                img.onerror = () => {
                    // Logo load error silently ignored
                };
                img.src = URL.createObjectURL(logoFile);
            }
        } catch (err) {
            alert('Error creating QR code: ' + err.message);
        }
    }

    formGenerate.addEventListener('submit', e => {
        e.preventDefault();
        const text = inputText.value.trim();
        if (!text) {
            alert('Please enter text to create QR code.');
            inputText.focus();
            return;
        }
        let size = parseInt(inputSize.value, 10);
        if (isNaN(size) || size < 100 || size > 1000) {
            alert('QR code size must be from 100 to 1000 px.');
            inputSize.focus();
            return;
        }
        const color = inputColor.value || '#000000';
        const logoFile = inputLogo.files[0] || null;

        generateQRCode(text, size, color, logoFile);
    });

    // Copy text from textarea
    const copyTextBtn = document.getElementById('copy-text-btn');
    const outputText = document.getElementById('output-text');
    
    copyTextBtn.addEventListener('click', async () => {
        if (!outputText.value.trim()) {
            showToast('No content to copy');
            return;
        }
        
        try {
            await navigator.clipboard.writeText(outputText.value);
            copyTextBtn.classList.add('copied');
            copyTextBtn.innerHTML = '<span class="copy-icon">✓</span><span class="copy-text">Copied</span>';
            showToast('Copied to clipboard');
            
            setTimeout(() => {
                copyTextBtn.classList.remove('copied');
                copyTextBtn.innerHTML = '<span class="copy-icon">📋</span><span class="copy-text">Copy</span>';
            }, 2000);
        } catch (err) {
            console.error('Error copying: ', err);
            showToast('Error copying');
        }
    });
    
    // Copy QR image
    const copyQrBtn = document.getElementById('copy-qr-btn');
    const qrCanvas = document.getElementById('qr-canvas');
    
    copyQrBtn.addEventListener('click', async () => {
        if (qrCanvas.width === 0 || qrCanvas.height === 0) {
            showToast('No QR code to copy');
            return;
        }
        
        try {
            // Convert canvas to blob
            qrCanvas.toBlob(async (blob) => {
                try {
                    await navigator.clipboard.write([
                        new ClipboardItem({ 'image/png': blob })
                    ]);
                    
                    copyQrBtn.classList.add('copied');
                    copyQrBtn.innerHTML = '<span class="copy-icon">✓</span><span class="copy-text">Copied</span>';
                    showToast('QR image copied to clipboard');
                    
                    setTimeout(() => {
                        copyQrBtn.classList.remove('copied');
                        copyQrBtn.innerHTML = '<span class="copy-icon">📋</span><span class="copy-text">Copy</span>';
                    }, 2000);
                } catch (err) {
                    console.error('Error copying image: ', err);
                    showToast('Error copying image');
                }
            }, 'image/png');
        } catch (err) {
            console.error('Error creating image: ', err);
            showToast('Error creating image to copy');
        }
    });
    
    // QR code scanning from image file using html5-qrcode
    formScan.addEventListener('submit', e => {
        e.preventDefault();
        outputText.value = '';
        const file = inputQRFile.files[0];
        if (!file) {
            showToast('Please select or paste an image containing QR code to scan.');
            dropZone.focus();
            return;
        }
        if (!file.type.startsWith('image/')) {
            showToast('Selected file must be an image.');
            return;
        }

        const reader = new FileReader();
        reader.onload = function (event) {
            const img = new Image();
            img.onload = () => {
                // Create html5-qrcode scanner for image scanning
                const html5QrCode = new Html5Qrcode('qr-reader');
                
                // Scan the image file
                html5QrCode.scanFile(file, true)
                    .then(decodedText => {
                        outputText.value = decodedText;
                    })
                    .catch(err => {
                        outputText.value = 'No valid QR code found in the image.';
                    });
            };
            img.onerror = () => {
                outputText.value = 'Error loading image. Please try again.';
            };
            img.src = event.target.result;
        };
        reader.onerror = () => {
            outputText.value = 'Error reading file. Please try again.';
        };
        reader.readAsDataURL(file);
    });
});
