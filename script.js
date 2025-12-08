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

function calculateProgressiveTax(taxableIncome) {
    let tax = 0;
    
    if (taxableIncome <= 0) return 0;
    
    // Biểu thuế 5 bậc mới
    const brackets = [
        { min: 0, max: 10000000, rate: 0.05 },
        { min: 10000000, max: 30000000, rate: 0.15 },
        { min: 30000000, max: 60000000, rate: 0.25 },
        { min: 60000000, max: 100000000, rate: 0.30 },
        { min: 100000000, max: Infinity, rate: 0.35 }
    ];
    
    for (let bracket of brackets) {
        if (taxableIncome > bracket.min) {
            const taxableInBracket = Math.min(taxableIncome - bracket.min, bracket.max - bracket.min);
            tax += taxableInBracket * bracket.rate;
        }
    }
    
    return tax;
}

function calculateTax() {
    // Lấy giá trị input
    const income = parseFloat(document.getElementById('income').getAttribute('data-value')) || 0;
    const dependents = parseInt(document.getElementById('dependents').value) || 0;
    const insuranceSalary = parseFloat(document.getElementById('insuranceSalary').getAttribute('data-value')) || 0;
    
    // Tính toán
    const insuranceAmount = insuranceSalary * 0.105; // 10.5% của lương đóng bảo hiểm
    const personalDeduction = 15500000; // 15.5 triệu
    const dependentDeduction = 6200000 * dependents; // 6.2 triệu/người
    const totalDeduction = personalDeduction + dependentDeduction;
    
    const taxableIncome = Math.max(0, income - insuranceAmount - totalDeduction);
    const taxAmount = calculateProgressiveTax(taxableIncome);
    const netIncome = income - insuranceAmount - taxAmount;
    
    // Hiển thị kết quả
    document.getElementById('originalIncome').textContent = formatCurrency(income);
    document.getElementById('insuranceAmount').textContent = formatCurrency(insuranceAmount);
    document.getElementById('deduction').textContent = formatCurrency(totalDeduction);
    document.getElementById('taxableIncome').textContent = formatCurrency(taxableIncome);
    document.getElementById('taxAmount').textContent = formatCurrency(taxAmount);
    document.getElementById('netIncome').textContent = formatCurrency(netIncome);
}

// Thêm sự kiện cho các ô nhập liệu tiền tệ
function initCurrencyInputs() {
    const inputs = ['income', 'insuranceSalary'];
    
    inputs.forEach(id => {
        const input = document.getElementById(id);
        
        // Xử lý sự kiện khi nhập liệu
        input.addEventListener('input', function() {
            handleCurrencyInput(this);
            calculateTax();
        });
        
        // Định dạng giá trị ban đầu
        if (input.value) {
            input.value = formatCurrencyInput(input.value);
            input.setAttribute('data-value', input.value.replace(/\./g, ''));
        }
    });
}

// Khởi tạo khi tải trang
document.addEventListener('DOMContentLoaded', function() {
    initCurrencyInputs();
    
    // Thêm sự kiện cho dropdown phụ thuộc
    document.getElementById('dependents').addEventListener('change', calculateTax);
    
    // Tính toán lần đầu
    calculateTax();
    
    // Định dạng giá trị ban đầu cho thu nhập
    const incomeInput = document.getElementById('income');
    incomeInput.value = formatCurrencyInput('25000000');
    incomeInput.setAttribute('data-value', '25000000');
});