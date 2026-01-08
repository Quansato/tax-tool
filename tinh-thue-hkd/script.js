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

// Hàm tính thuế TNCN theo quy định mới 2026
function calculateTncnTax(revenue, expenses, method, businessType) {
    const NGUONG_CHIU_THUE = 500000000; // 500 triệu/năm
    
    // Nếu doanh thu dưới ngưỡng chịu thuế
    if (revenue <= NGUONG_CHIU_THUE) {
        return 0;
    }
    
    let taxableIncome = 0;
    let taxRate = 0;
    
    if (method === 'loinhuan') {
        // Phương pháp tính trên lợi nhuận (có chi phí)
        taxableIncome = Math.max(0, revenue - expenses);
        
        // Xác định thuế suất theo doanh thu
        if (revenue <= 3000000000) {
            taxRate = 0.15; // 15% cho doanh thu dưới 3 tỷ
        } else if (revenue <= 50000000000) {
            taxRate = 0.17; // 17% cho doanh thu 3-50 tỷ
        } else {
            taxRate = 0.20; // 20% cho doanh thu trên 50 tỷ
        }
    } else {
        // Phương pháp tính trên doanh thu (không xác định được chi phí)
        // Áp dụng ngưỡng 500 triệu trước khi tính
        const doanhThuTinhThue = revenue - NGUONG_CHIU_THUE;
        
        // Tỷ lệ theo ngành nghề (cập nhật chính xác 2026)
        const tileRates = {
            'service': 0.02,      // 2% (Dịch vụ, xây dựng không bao thầu vật liệu)
            'trade': 0.005,      // 0.5% (Phân phối, cung cấp hàng hóa)
            'production': 0.015,  // 1.5% (Sản xuất, vận tải, dịch vụ gắn hàng hóa)
            'other': 0.01        // 1% (Các ngành còn lại)
        };
        
        const rate = tileRates[businessType] || 0.01;
        return Math.round(doanhThuTinhThue * rate);
    }
    
    return Math.round(taxableIncome * taxRate);
}

// Hàm tính thuế GTGT (cập nhật 2026 - tính trên toàn bộ doanh thu)
function calculateGtgtTax(revenue, businessType) {
    const NGUONG_CHIU_THUE_GTGT = 500000000; // 500 triệu/năm
    
    // Nếu doanh thu dưới ngưỡng chịu thuế GTGT thì không nộp thuế
    if (revenue <= NGUONG_CHIU_THUE_GTGT) {
        return 0;
    }
    
    // Tính thuế GTGT trên TOÀN BỘ doanh thu (không trừ ngưỡng)
    const gtgtRates = {
        'service': 0.05,     // Dịch vụ: 5%
        'trade': 0.01,       // Thương mại: 1%
        'production': 0.03,  // Sản xuất: 3%
        'other': 0.02        // Ngành khác: 2%
    };
    
    const rate = gtgtRates[businessType] || 0.05;
    return Math.round(revenue * rate);
}

// Sao chép kết quả tính thuế HKD
function copyHkdResults() {
    const fields = [
        { id: 'revenueResult', label: 'Doanh thu năm' },
        { id: 'expensesResult', label: 'Chi phí đầu vào' },
        { id: 'profitBeforeTaxResult', label: 'Lợi nhuận trước thuế' },
        { id: 'tncnResult', label: 'Thuế TNCN' },
        { id: 'gtgtResult', label: 'Thuế GTGT' },
        { id: 'totalTaxResult', label: 'Tổng thuế phải nộp' },
        { id: 'profitAfterTaxResult', label: 'Lợi nhuận sau thuế' },
    ];

    const lines = fields.map(({ id, label }) => {
        const el = document.getElementById(id);
        return el ? `${label}: ${el.textContent}` : null;
    }).filter(Boolean);

    if (!lines.length) {
        alert('Không có dữ liệu để sao chép. Vui lòng nhập thông tin trước.');
        return;
    }

    const note = 'Quy định mới 2026: Bỏ thuế khoán, ngưỡng chịu thuế 500 triệu/năm, chỉ còn thuế TNCN và GTGT.';
    const content = [...lines, note].join('\n');

    navigator.clipboard?.writeText(content)
        .then(() => alert('Đã sao chép kết quả vào clipboard.'))
        .catch(() => alert('Không thể sao chép. Vui lòng thử lại hoặc kiểm tra quyền trình duyệt.'));
}

function calculateTax() {
    // Lấy giá trị input
    const revenue = parseFloat(document.getElementById('revenue').getAttribute('data-value')) || 0;
    const expenses = parseFloat(document.getElementById('expenses').getAttribute('data-value')) || 0;
    const businessType = document.getElementById('businessType').value;
    const calculationMethod = document.querySelector('input[name="calculationMethod"]:checked').value;
    
    // Tính toán lợi nhuận trước thuế
    const profitBeforeTax = revenue - expenses;
    
    // Tính thuế TNCN theo phương pháp đã chọn
    const tncnTax = calculateTncnTax(revenue, expenses, calculationMethod, businessType);
    
    // Tính thuế GTGT
    const gtgtTax = calculateGtgtTax(revenue, businessType);
    
    // Tính tổng thuế và lợi nhuận sau thuế
    const totalTax = tncnTax + gtgtTax;
    const profitAfterTax = Math.max(0, profitBeforeTax - tncnTax - gtgtTax);
    
    // Cập nhật kết quả trên giao diện
    document.getElementById('revenueResult').textContent = formatCurrency(revenue);
    document.getElementById('expensesResult').textContent = formatCurrency(expenses);
    document.getElementById('profitBeforeTaxResult').textContent = formatCurrency(profitBeforeTax);
    document.getElementById('tncnResult').textContent = formatCurrency(tncnTax);
    document.getElementById('gtgtResult').textContent = formatCurrency(gtgtTax);
    document.getElementById('totalTaxResult').textContent = formatCurrency(totalTax);
    document.getElementById('profitAfterTaxResult').textContent = formatCurrency(profitAfterTax);
    
    // Hiển thị thông tin tính toán chi tiết
    updateCalculationDetails(revenue, expenses, tncnTax, gtgtTax, calculationMethod, businessType);
}

// Hàm cập nhật thông tin chi tiết về cách tính
function updateCalculationDetails(revenue, expenses, tncnTax, gtgtTax, method, businessType) {
    // Có thể thêm logic để hiển thị chi tiết cách tính
    // Ví dụ: "Thuế TNCN = (1.000.000.000 - 300.000.000) × 15% = 105.000.000"
}

// Thêm sự kiện cho các ô nhập liệu tiền tệ
function initCurrencyInputs() {
    const revenueInput = document.getElementById('revenue');
    const expensesInput = document.getElementById('expenses');
    
    // Xử lý sự kiện khi nhập liệu doanh thu
    revenueInput.addEventListener('input', function() {
        handleCurrencyInput(this);
        calculateTax();
    });
    
    // Xử lý sự kiện khi nhập liệu chi phí
    expensesInput.addEventListener('input', function() {
        handleCurrencyInput(this);
        calculateTax();
    });
    
    // Định dạng giá trị ban đầu
    if (revenueInput.value) {
        revenueInput.value = formatCurrencyInput(revenueInput.value);
        revenueInput.setAttribute('data-value', revenueInput.value.replace(/\./g, ''));
    }
    
    if (expensesInput.value) {
        expensesInput.value = formatCurrencyInput(expensesInput.value);
        expensesInput.setAttribute('data-value', expensesInput.value.replace(/\./g, ''));
    }
}

// Cập nhật giao diện khi thay đổi phương pháp tính thuế
function updateCalculationMethod() {
    // Không cần thay đổi giao diện vì cả 2 phương pháp đều có thể áp dụng
    calculateTax();
}

// Khởi tạo khi tải trang
document.addEventListener('DOMContentLoaded', function() {
    // Khởi tạo các ô nhập tiền tệ
    initCurrencyInputs();
    
    // Thêm sự kiện cho nút tính thuế
    document.getElementById('calculateTax').addEventListener('click', calculateTax);
    
    // Thêm sự kiện cho các dropdown
    ['businessType'].forEach(id => {
        document.getElementById(id).addEventListener('change', calculateTax);
    });
    
    // Thêm sự kiện cho radio button chọn phương pháp tính thuế
    document.querySelectorAll('input[name="calculationMethod"]').forEach(radio => {
        radio.addEventListener('change', updateCalculationMethod);
    });

    // Sao chép kết quả
    document.getElementById('copyHkdResult')?.addEventListener('click', copyHkdResults);
    
    // Tính toán lần đầu
    calculateTax();
    
    // Định dạng giá trị ban đầu
    const revenueInput = document.getElementById('revenue');
    revenueInput.value = formatCurrencyInput('500000000');
    revenueInput.setAttribute('data-value', '500000000');
    
    const expensesInput = document.getElementById('expenses');
    expensesInput.value = formatCurrencyInput('0');
    expensesInput.setAttribute('data-value', '0');
    
    // Cập nhật giao diện ban đầu
    updateCalculationMethod();
});
