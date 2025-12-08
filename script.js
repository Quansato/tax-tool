function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', { 
        style: 'currency', 
        currency: 'VND' 
    }).format(amount);
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
    const income = parseFloat(document.getElementById('income').value) || 0;
    const dependents = parseInt(document.getElementById('dependents').value) || 0;
    const insuranceSalary = parseFloat(document.getElementById('insuranceSalary').value) || 0;
    
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
    
    // Hiệu ứng highlight kết quả
    const highlight = document.querySelector('.highlight');
    highlight.style.animation = 'none';
    setTimeout(() => {
        highlight.style.animation = 'fadeInUp 0.5s ease';
    }, 10);
}

// Tự động tính khi người dùng nhập
document.getElementById('income').addEventListener('input', calculateTax);
document.getElementById('dependents').addEventListener('change', calculateTax);
document.getElementById('insuranceSalary').addEventListener('input', calculateTax);

// Tính mẫu ban đầu
document.getElementById('income').value = 25000000;
calculateTax();