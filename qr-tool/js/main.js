// Hàm hiển thị thông báo tạm thời
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

// Hàm hiển thị preview ảnh
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

// Hàm xoá ảnh preview
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

// Hàm xử lý khi chọn file ảnh
function handleImageFile(file) {
    const fileInfo = document.getElementById('file-info');
    
    if (!file.type.startsWith('image/')) {
        fileInfo.textContent = 'Vui lòng chọn file ảnh hợp lệ';
        fileInfo.style.display = 'block';
        fileInfo.style.color = 'red';
        return false;
    }
    
    fileInfo.textContent = `Đã chọn: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`;
    fileInfo.style.display = 'block';
    fileInfo.style.color = 'inherit';
    
    // Hiển thị preview ảnh
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

    // Xử lý kéo thả file
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

    // Xử lý thả file
    dropZone.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length > 0) {
            inputQRFile.files = files;
            handleImageFile(files[0]);
        }
    }

    // Xử lý click vào drop zone để chọn file
    dropZone.addEventListener('click', () => {
        inputQRFile.click();
    });

    // Xử lý chọn file
    inputQRFile.addEventListener('change', (e) => {
        if (inputQRFile.files.length > 0) {
            handleImageFile(inputQRFile.files[0]);
        }
    });

    // Xử lý dán ảnh (Ctrl+V)
    document.addEventListener('paste', (e) => {
        const items = (e.clipboardData || window.clipboardData).items;
        
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const blob = items[i].getAsFile();
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(blob);
                inputQRFile.files = dataTransfer.files;
                
                // Cập nhật thông tin file và hiển thị preview
                fileInfo.textContent = 'Đã dán ảnh từ clipboard';
                fileInfo.style.display = 'block';
                fileInfo.style.color = 'inherit';
                
                // Hiển thị preview ảnh
                showImagePreview(blob);
                
                break;
            }
        }
    });
    
    // Xử lý sự kiện click nút xoá ảnh
    document.getElementById('remove-image').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        removeImagePreview();
    });
    
    // Xử lý khi form được submit
    formScan.addEventListener('submit', (e) => {
        if (!inputQRFile.files || inputQRFile.files.length === 0) {
            e.preventDefault();
            showToast('Vui lòng chọn hoặc dán ảnh để quét mã QR');
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
            alert('Lỗi khi tạo mã QR: ' + err.message);
        }
    }

    formGenerate.addEventListener('submit', e => {
        e.preventDefault();
        const text = inputText.value.trim();
        if (!text) {
            alert('Vui lòng nhập văn bản để tạo mã QR.');
            inputText.focus();
            return;
        }
        let size = parseInt(inputSize.value, 10);
        if (isNaN(size) || size < 100 || size > 1000) {
            alert('Kích thước mã QR phải từ 100 đến 1000 px.');
            inputSize.focus();
            return;
        }
        const color = inputColor.value || '#000000';
        const logoFile = inputLogo.files[0] || null;

        generateQRCode(text, size, color, logoFile);
    });

    // Sao chép văn bản từ textarea
    const copyTextBtn = document.getElementById('copy-text-btn');
    const outputText = document.getElementById('output-text');
    
    copyTextBtn.addEventListener('click', async () => {
        if (!outputText.value.trim()) {
            showToast('Không có nội dung để sao chép');
            return;
        }
        
        try {
            await navigator.clipboard.writeText(outputText.value);
            copyTextBtn.classList.add('copied');
            copyTextBtn.innerHTML = '<span class="copy-icon">✓</span><span class="copy-text">Đã sao chép</span>';
            showToast('Đã sao chép vào clipboard');
            
            setTimeout(() => {
                copyTextBtn.classList.remove('copied');
                copyTextBtn.innerHTML = '<span class="copy-icon">📋</span><span class="copy-text">Sao chép</span>';
            }, 2000);
        } catch (err) {
            console.error('Lỗi khi sao chép: ', err);
            showToast('Lỗi khi sao chép');
        }
    });
    
    // Sao chép ảnh QR
    const copyQrBtn = document.getElementById('copy-qr-btn');
    const qrCanvas = document.getElementById('qr-canvas');
    
    copyQrBtn.addEventListener('click', async () => {
        if (qrCanvas.width === 0 || qrCanvas.height === 0) {
            showToast('Không có mã QR để sao chép');
            return;
        }
        
        try {
            // Chuyển canvas thành blob
            qrCanvas.toBlob(async (blob) => {
                try {
                    await navigator.clipboard.write([
                        new ClipboardItem({ 'image/png': blob })
                    ]);
                    
                    copyQrBtn.classList.add('copied');
                    copyQrBtn.innerHTML = '<span class="copy-icon">✓</span><span class="copy-text">Đã sao chép</span>';
                    showToast('Đã sao chép ảnh QR vào clipboard');
                    
                    setTimeout(() => {
                        copyQrBtn.classList.remove('copied');
                        copyQrBtn.innerHTML = '<span class="copy-icon">📋</span><span class="copy-text">Sao chép</span>';
                    }, 2000);
                } catch (err) {
                    console.error('Lỗi khi sao chép ảnh: ', err);
                    showToast('Lỗi khi sao chép ảnh');
                }
            }, 'image/png');
        } catch (err) {
            console.error('Lỗi khi tạo ảnh: ', err);
            showToast('Lỗi khi tạo ảnh để sao chép');
        }
    });
    
    // QR code scanning from image file
    formScan.addEventListener('submit', e => {
        e.preventDefault();
        outputText.value = '';
        const file = inputQRFile.files[0];
        if (!file) {
            showToast('Vui lòng chọn hoặc dán ảnh chứa mã QR để quét.');
            dropZone.focus();
            return;
        }
        if (!file.type.startsWith('image/')) {
            showToast('File chọn phải là ảnh.');
            return;
        }

        const reader = new FileReader();
        reader.onload = function (event) {
            const img = new Image();
            img.onload = () => {
                // Create offscreen canvas to draw image for scanning
                const offCanvas = document.createElement('canvas');
                const offCtx = offCanvas.getContext('2d');
                offCanvas.width = img.width;
                offCanvas.height = img.height;
                offCtx.drawImage(img, 0, 0);

                const imageData = offCtx.getImageData(0, 0, offCanvas.width, offCanvas.height);
                const code = jsQR(imageData.data, imageData.width, imageData.height, {
                    inversionAttempts: 'attemptBoth'
                });

                if (code) {
                    outputText.value = code.data;
                } else {
                    outputText.value = 'Không tìm thấy mã QR hợp lệ trong ảnh.';
                }
            };
            img.onerror = () => {
                outputText.value = 'Lỗi khi tải ảnh. Vui lòng thử lại.';
            };
            img.src = event.target.result;
        };
        reader.onerror = () => {
            outputText.value = 'Lỗi khi đọc file. Vui lòng thử lại.';
        };
        reader.readAsDataURL(file);
    });
});
