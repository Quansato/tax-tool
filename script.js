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

function calculateProgressiveTax(taxableIncome, bracketType = '5') {
    let tax = 0;
    
    if (taxableIncome <= 0) return 0;
    
    let brackets;
    
    if (bracketType === '5') {
        // 5-bracket tax rate (from 01/07/2026)
        brackets = [
            { min: 0, max: 10000000, rate: 0.05 },
            { min: 10000000, max: 30000000, rate: 0.10 },
            { min: 30000000, max: 60000000, rate: 0.20 },
            { min: 60000000, max: 100000000, rate: 0.30 },
            { min: 100000000, max: Infinity, rate: 0.35 }
        ];
    } else {
        // 7-bracket tax rate (current)
        brackets = [
            { min: 0, max: 5000000, rate: 0.05 },
            { min: 5000000, max: 10000000, rate: 0.10 },
            { min: 10000000, max: 18000000, rate: 0.15 },
            { min: 18000000, max: 32000000, rate: 0.20 },
            { min: 32000000, max: 52000000, rate: 0.25 },
            { min: 52000000, max: 80000000, rate: 0.30 },
            { min: 80000000, max: Infinity, rate: 0.35 }
        ];
    }
    
    for (let bracket of brackets) {
        if (taxableIncome > bracket.min) {
            const taxableInBracket = Math.min(taxableIncome - bracket.min, bracket.max - bracket.min);
            tax += taxableInBracket * bracket.rate;
        } else {
            break; // No need to check higher brackets
        }
    }
    
    return Math.round(tax);
}

function showTaxResultPopup() {
    const popup = document.getElementById('taxResultPopup');
    popup.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Prevent scrolling when popup is open
}

function closeTaxResultPopup() {
    const popup = document.getElementById('taxResultPopup');
    popup.style.display = 'none';
    document.body.style.overflow = 'auto'; // Re-enable scrolling
}

function calculateTax(showPopup = false) {
    // Lấy giá trị input
    const income = parseFloat(document.getElementById('income').getAttribute('data-value')) || 0;
    const dependents = parseInt(document.getElementById('dependents').value) || 0;
    const insuranceSalary = parseFloat(document.getElementById('insuranceSalary').getAttribute('data-value')) || 0;
    const selectedBracket = document.querySelector('input[name="taxBracket"]:checked').value;
    
    // Tính toán
    const insuranceAmount = insuranceSalary * 0.105; // 10.5% của lương đóng bảo hiểm
    const personalDeduction = 15500000; // 15.5 triệu
    const dependentDeduction = 6200000 * dependents; // 6.2 triệu/người
    const totalDeduction = personalDeduction + dependentDeduction;
    
    const taxableIncome = Math.max(0, income - insuranceAmount - totalDeduction);
    const taxAmount = calculateProgressiveTax(taxableIncome, selectedBracket);
    const netIncome = income - insuranceAmount - taxAmount;
    
    // Cập nhật kết quả trên giao diện chính
    document.getElementById('originalIncome').textContent = formatCurrency(income);
    document.getElementById('insuranceAmount').textContent = formatCurrency(insuranceAmount);
    document.getElementById('deduction').textContent = formatCurrency(totalDeduction);
    document.getElementById('taxableIncome').textContent = formatCurrency(taxableIncome);
    document.getElementById('taxAmount').textContent = formatCurrency(taxAmount);
    document.getElementById('netIncome').textContent = formatCurrency(netIncome);
    
    // Cập nhật kết quả trong popup
    document.getElementById('popupOriginalIncome').textContent = formatCurrency(income);
    document.getElementById('popupInsuranceAmount').textContent = formatCurrency(insuranceAmount);
    document.getElementById('popupDeduction').textContent = formatCurrency(totalDeduction);
    document.getElementById('popupTaxableIncome').textContent = formatCurrency(taxableIncome);
    document.getElementById('popupTaxAmount').textContent = formatCurrency(taxAmount);
    document.getElementById('popupNetIncome').textContent = formatCurrency(netIncome);
    
    // Nếu được yêu cầu hiển thị popup
    if (showPopup && window.innerWidth <= 840) {
        showTaxResultPopup();
    }
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
// Xử lý FAQ Accordion
document.addEventListener('DOMContentLoaded', function() {
    // Lấy tất cả các câu hỏi FAQ
    const faqQuestions = document.querySelectorAll('.faq-question');
    
    // Thêm sự kiện click cho mỗi câu hỏi
    faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
            const faqItem = question.parentElement;
            const isActive = faqItem.classList.contains('active');
            
            // Đóng tất cả các câu hỏi khác
            document.querySelectorAll('.faq-item').forEach(item => {
                item.classList.remove('active');
            });
            
            // Nếu câu hỏi hiện tại chưa được mở, mở nó
            if (!isActive) {
                faqItem.classList.add('active');
            }
        });
    });
    
    // Mở câu hỏi đầu tiên mặc định
    if (faqQuestions.length > 0) {
        faqQuestions[0].parentElement.classList.add('active');
    }
    
    // Khởi tạo các ô nhập tiền tệ
    initCurrencyInputs();
    
    // Thêm sự kiện cho nút tính thuế
    document.getElementById('tax').addEventListener('click', function() {
        calculateTax(true); // true để hiển thị popup
    });
    
    // Thêm sự kiện cho dropdown phụ thuộc
    document.getElementById('dependents').addEventListener('change', function() {
        calculateTax(false); // false để không hiển thị popup
    });
    
    // Thêm sự kiện cho radio button chọn biểu thuế
    document.querySelectorAll('input[name="taxBracket"]').forEach(radio => {
        radio.addEventListener('change', function() {
            calculateTax(false); // Không hiển thị popup khi chuyển đổi biểu thuế
        });
    });
    
    // Thêm sự kiện cho nút đóng popup
    document.querySelector('.close-popup')?.addEventListener('click', closeTaxResultPopup);
    document.querySelector('.close-popup-btn')?.addEventListener('click', closeTaxResultPopup);
    
    // Đóng popup khi click bên ngoài nội dung
    document.getElementById('taxResultPopup')?.addEventListener('click', function(e) {
        if (e.target === this) {
            closeTaxResultPopup();
        }
    });
    
    // Đóng popup khi nhấn phím Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeTaxResultPopup();
        }
    });
    
    // Tính toán lần đầu
    calculateTax(false);
    
    // Định dạng giá trị ban đầu cho thu nhập
    const incomeInput = document.getElementById('income');
    incomeInput.value = formatCurrencyInput('25000000');
    incomeInput.setAttribute('data-value', '25000000');
    
    // Tab dropdown functionality
    const dropdownToggle = document.querySelector('.dropdown-toggle');
    const dropdownMenu = document.querySelector('.dropdown-menu');
    
    if (dropdownToggle && dropdownMenu) {
        dropdownToggle.addEventListener('click', function(e) {
            e.preventDefault();
            const isExpanded = this.getAttribute('aria-expanded') === 'true';
            this.setAttribute('aria-expanded', !isExpanded);
            this.classList.toggle('active');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!dropdownToggle.contains(e.target) && !dropdownMenu.contains(e.target)) {
                dropdownToggle.setAttribute('aria-expanded', 'false');
                dropdownToggle.classList.remove('active');
            }
        });
        
        // Handle dropdown item clicks
        const dropdownItems = document.querySelectorAll('.dropdown-item');
        dropdownItems.forEach(item => {
            item.addEventListener('click', function(e) {
                const tool = this.getAttribute('data-tool');
                const href = this.getAttribute('href');
                
                // QR Tool is available, redirect directly
                if (tool === 'qr' && href && href !== '#') {
                    window.location.href = href;
                    return;
                }
                
                // Other tools show coming soon alert
                if (tool && href === '#') {
                    e.preventDefault();
                    alert('Công cụ này đang được phát triển và sẽ sớm ra mắt!\n\nVui lòng quay lại sau hoặc sử dụng các công cụ có sẵn:\n- Tính thuế TNCN\n- Tính thuế HKD\n- QR Tool');
                }
                
                // Close dropdown
                dropdownToggle.setAttribute('aria-expanded', 'false');
                dropdownToggle.classList.remove('active');
            });
        });
    }
});