// Hàm chuyển đổi chuỗi số đã định dạng thành số
function parseFormattedNumber(formattedNumber) {
    if (!formattedNumber) return 0;
    return parseFloat(formattedNumber.replace(/\./g, '')) || 0;
}

// Hàm định dạng số thành chuỗi tiền tệ Việt Nam
function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', { 
        style: 'currency', 
        currency: 'VND',
        maximumFractionDigits: 0
    }).format(amount);
}

// Hàm định dạng số nhập vào
function formatCurrencyInput(value) {
    // Xóa tất cả các ký tự không phải số
    let number = value.replace(/\D/g, '');
    
    // Thêm dấu chấm phân cách hàng nghìn
    number = number.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    
    return number;
}

// Hàm xử lý sự kiện khi người dùng nhập liệu
function handleCurrencyInput(input) {
    // Lưu vị trí con trỏ
    const cursorPosition = input.selectionStart;
    const originalLength = input.value.length;
    
    // Định dạng giá trị
    input.value = formatCurrencyInput(input.value);
    
    // Cập nhật giá trị thực tế trong thuộc tính data-value
    input.setAttribute('data-value', input.value.replace(/\./g, ''));
    
    // Đặt lại vị trí con trỏ
    const newLength = input.value.length;
    const newPosition = cursorPosition + (newLength - originalLength);
    input.setSelectionRange(newPosition, newPosition);
    
    return parseFloat(input.getAttribute('data-value')) || 0;
}

// Hàm tính thuế môn bài
function calculateMonBaiTax(businessType, location) {
    const monBaiRates = {
        'service': { urban: 3000000, rural: 2000000 },
        'trade': { urban: 2000000, rural: 1500000 },
        'production': { urban: 2000000, rural: 1000000 },
        'other': { urban: 2000000, rural: 1500000 }
    };
    
    return monBaiRates[businessType]?.[location] || 2000000;
}

// Hàm tính thuế TNCN theo phương pháp khoán
function calculateTncnKhoan(revenue, businessType, location, employees) {
    const khoanRates = {
        'service': { urban: 0.10, rural: 0.08 },
        'trade': { urban: 0.07, rural: 0.05 },
        'production': { urban: 0.06, rural: 0.04 },
        'other': { urban: 0.07, rural: 0.05 }
    };
    
    const rate = khoanRates[businessType]?.[location] || 0.07;
    
    // Giảm trừ cho hộ có lao động
    let reduction = 0;
    if (employees === '1-10') reduction = 0.1; // Giảm 10%
    else if (employees === '11-50') reduction = 0.2; // Giảm 20%
    else if (employees === '51+') reduction = 0.3; // Giảm 30%
    
    const tax = revenue * rate * (1 - reduction);
    return Math.round(tax);
}

// Hàm tính thuế TNCN theo tỷ lệ % trên doanh thu
function calculateTncnTile(revenue, businessType) {
    const tileRates = {
        'service': 0.05,
        'trade': 0.03,
        'production': 0.02,
        'other': 0.03
    };
    
    const rate = tileRates[businessType] || 0.03;
    return Math.round(revenue * rate);
}

// Hàm tính thuế GTGT (nếu đăng ký)
function calculateGtgtTax(revenue, isRegistered = true) {
    if (!isRegistered) return 0;
    return Math.round(revenue * 0.05); // 5% doanh thu
}

function calculateTax() {
    // Lấy giá trị input
    const revenue = parseFloat(document.getElementById('revenue').getAttribute('data-value')) || 0;
    const businessType = document.getElementById('businessType').value;
    const location = document.getElementById('location').value;
    const employees = document.getElementById('employees').value;
    const calculationMethod = document.querySelector('input[name="calculationMethod"]:checked').value;
    
    // Tính toán
    const monBaiTax = calculateMonBaiTax(businessType, location);
    
    let tncnTax;
    if (calculationMethod === 'khoan') {
        tncnTax = calculateTncnKhoan(revenue, businessType, location, employees);
    } else {
        tncnTax = calculateTncnTile(revenue, businessType);
    }
    
    const gtgtTax = calculateGtgtTax(revenue, true); // Mặc định là đã đăng ký GTGT
    const totalTax = monBaiTax + tncnTax + gtgtTax;
    const profit = Math.max(0, revenue - totalTax);
    
    // Cập nhật kết quả trên giao diện
    document.getElementById('revenueResult').textContent = formatCurrency(revenue);
    document.getElementById('monBaiResult').textContent = formatCurrency(monBaiTax);
    document.getElementById('tncnResult').textContent = formatCurrency(tncnTax);
    document.getElementById('gtgtResult').textContent = formatCurrency(gtgtTax);
    document.getElementById('totalTaxResult').textContent = formatCurrency(totalTax);
    document.getElementById('profitResult').textContent = formatCurrency(profit);
}

// Thêm sự kiện cho các ô nhập liệu tiền tệ
function initCurrencyInputs() {
    const revenueInput = document.getElementById('revenue');
    
    // Xử lý sự kiện khi nhập liệu
    revenueInput.addEventListener('input', function() {
        handleCurrencyInput(this);
        calculateTax();
    });
    
    // Định dạng giá trị ban đầu
    if (revenueInput.value) {
        revenueInput.value = formatCurrencyInput(revenueInput.value);
        revenueInput.setAttribute('data-value', revenueInput.value.replace(/\./g, ''));
    }
}

// Cập nhật giao diện khi thay đổi phương pháp tính thuế
function updateCalculationMethod() {
    const method = document.querySelector('input[name="calculationMethod"]:checked').value;
    const employeesGroup = document.getElementById('employeesGroup');
    
    if (method === 'khoan') {
        employeesGroup.style.display = 'block';
    } else {
        employeesGroup.style.display = 'none';
    }
    
    calculateTax();
}

// Khởi tạo khi tải trang
document.addEventListener('DOMContentLoaded', function() {
    // Khởi tạo các ô nhập tiền tệ
    initCurrencyInputs();
    
    // Thêm sự kiện cho nút tính thuế
    document.getElementById('calculateTax').addEventListener('click', calculateTax);
    
    // Thêm sự kiện cho các dropdown
    ['businessType', 'location', 'employees'].forEach(id => {
        document.getElementById(id).addEventListener('change', calculateTax);
    });
    
    // Thêm sự kiện cho radio button chọn phương pháp tính thuế
    document.querySelectorAll('input[name="calculationMethod"]').forEach(radio => {
        radio.addEventListener('change', updateCalculationMethod);
    });
    
    // Tính toán lần đầu
    calculateTax();
    
    // Định dạng giá trị ban đầu cho doanh thu
    const revenueInput = document.getElementById('revenue');
    revenueInput.value = formatCurrencyInput('500000000');
    revenueInput.setAttribute('data-value', '500000000');
    
    // Cập nhật giao diện ban đầu
    updateCalculationMethod();
});
