// Configuration
const MY_BANK = {
    BANK_ID: "MB",
    ACCOUNT_NO: "0967394474",
};

const CLASS_FUND_API = "https://script.google.com/macros/s/AKfycbwt3tjCr-MbRE6k05Yql4QPaYLcH3iIKwfrYAOWx4Lv0w0WYSfZGvYMIO_aIlOV8xQQLw/exec";

// Member data
const MEMBERS = [
    { id: "233174", name: "Nguyễn Trần Hoài An" },
    { id: "233142", name: "Lê Mỹ Anh" },
    { id: "233372", name: "Trương Nguyễn Gia Bảo" },
    { id: "233440", name: "Đàm Vỉnh Bằng" },
    { id: "233056", name: "Nguyễn Cảnh Bằng" },
    { id: "233488", name: "Lê Anh Chiến" },
    { id: "233277", name: "Nguyễn Hồng Diễm" },
    { id: "233347", name: "Phan Văn Hiển" },
    { id: "233268", name: "Trần Trung Hiếu" },
    { id: "233484", name: "Nguyễn Văn Huy" },
    { id: "233225", name: "Huỳnh Quốc Khang" },
    { id: "233073", name: "Lê Chí Khanh" },
    { id: "233248", name: "Đặng Huỳnh Khánh" },
    { id: "233058", name: "Mai Văn Khôi" },
    { id: "233404", name: "Phạm Quyền Linh" },
    { id: "233075", name: "Phan Văn Lộc" },
    { id: "233454", name: "Trương Ánh Lộc" },
    { id: "233092", name: "Nguyễn Hữu Luân" },
    { id: "233373", name: "Ca Võ Vũ Minh" },
    { id: "233524", name: "Đào Vũ Minh" },
    { id: "233086", name: "Bùi Phú Nông" },
    { id: "233309", name: "Lê Huỳnh Thúy Ngân" },
    { id: "233179", name: "Nguyễn Thị Kim Ngân" },
    { id: "233293", name: "Phạm Trọng Nguyễn" },
    { id: "233400", name: "Huỳnh Chí Nguyện" },
    { id: "233341", name: "Nguyễn Phúc Uyển Nhi" },
    { id: "233140", name: "Trần Ngọc Nhung" },
    { id: "233345", name: "Trần Bảo Như" },
    { id: "233375", name: "Đỗ Minh Nhựt" },
    { id: "233108", name: "Đỗ Thuận Phát" },
    { id: "236717", name: "Lê Minh Phú" },
    { id: "233198", name: "Phan Quốc Tiến" },
    { id: "233539", name: "Lương Quốc Tùng" },
    { id: "233197", name: "Lý Hoàng Thanh" },
    { id: "233129", name: "Trần Thị Hồng Yến" }
];

// Cache DOM elements
const elements = {
    options: null,
    qrSection: null,
    qrImage: null,
    loadingSpinner: null,
    loadingText: null,
    paymentContent: null,
    paymentAmount: null,
    statusMessage: null
};

// State management
let currentCheckInterval = null;
let isSuccess = false;
let isCheckingPayment = false;
let lastApiResponse = null;
let lastApiCall = 0;
const API_CACHE_TIME = 3000;

// Initialize when DOM loaded
document.addEventListener("DOMContentLoaded", initializeApp);

function initializeApp() {
    cacheElements();
    setupEventListeners();
    populateMemberList();
}

function cacheElements() {
    elements.options = document.querySelectorAll('.option');
    elements.qrSection = document.getElementById('qrSection');
    elements.qrImage = document.getElementById('qrImage');
    elements.loadingSpinner = document.getElementById('loadingSpinner');
    elements.loadingText = document.getElementById('loadingText');
    elements.paymentContent = document.getElementById('paymentContent');
    elements.paymentAmount = document.getElementById('paymentAmount');
    elements.statusMessage = document.getElementById('statusMessage');
}

function setupEventListeners() {
    elements.options.forEach(option => {
        option.addEventListener('click', handleOptionClick);
    });

    // Cleanup on page unload
    window.addEventListener('beforeunload', clearCurrentInterval);
}

function handleOptionClick(e) {
    const option = e.currentTarget;
    const type = option.dataset.type;
    const price = parseInt(option.dataset.price);
    const description = option.dataset.description;

    // Update active state
    elements.options.forEach(opt => opt.classList.remove('active'));
    option.classList.add('active');

    // Generate payment
    generatePayment(price, description);
}

function generatePayment(amount) {
    clearCurrentInterval();

    showLoading();

    // KHÔNG còn paymentId nữa, chỉ tạo QR với số tiền
    const qrUrl = `https://img.vietqr.io/image/${MY_BANK.BANK_ID}-${MY_BANK.ACCOUNT_NO}-compact2.png?amount=${amount}`;

    elements.qrImage.onload = () => {
        hideLoading();
        showQRSection();
    };

    elements.qrImage.onerror = () => {
        hideLoading();
        showError('Không thể tải mã QR. Vui lòng thử lại.');
    };

    elements.qrImage.src = qrUrl;

    // elements.paymentContent.textContent = "Nội dung mặc định theo ngân hàng";
    elements.paymentAmount.textContent = formatCurrency(amount);

    isSuccess = false;
    hideStatus();

    setTimeout(() => {
        if (!isSuccess) {
            showWaitingMessage();
            startPaymentCheck(amount, ""); // Không cần content nữa
        }
    }, 15000);
}


function showLoading() {
    elements.loadingSpinner.style.display = 'block';
    elements.loadingText.style.display = 'block';
    elements.qrImage.style.display = 'none';
}

function hideLoading() {
    elements.loadingSpinner.style.display = 'none';
    elements.loadingText.style.display = 'none';
    elements.qrImage.style.display = 'block';
}

function showQRSection() {
    elements.qrSection.classList.add('show');
}

function showError(message) {
    elements.statusMessage.textContent = message;
    elements.statusMessage.className = 'status-message status-error';
    elements.statusMessage.style.display = 'block';
}

function showWaitingMessage() {
    elements.statusMessage.textContent = 'Đang chờ thanh toán... Vui lòng quét mã QR và thực hiện chuyển khoản.';
    elements.statusMessage.className = 'status-message status-waiting';
    elements.statusMessage.style.display = 'block';
}

function showSuccessMessage() {
    elements.statusMessage.textContent = '✅ Thanh toán thành công! Cảm ơn bạn đã đóng góp vào quỹ lớp.';
    elements.statusMessage.className = 'status-message status-success';
    elements.statusMessage.style.display = 'block';
}

function hideStatus() {
    elements.statusMessage.style.display = 'none';
}

function clearCurrentInterval() {
    if (currentCheckInterval) {
        clearInterval(currentCheckInterval);
        currentCheckInterval = null;
        isCheckingPayment = false;
    }
}

function startPaymentCheck(amount, content) {
    if (isCheckingPayment || isSuccess) return;

    isCheckingPayment = true;

    // Giai đoạn 1: fast-check trong 5 giây đầu (10 lần mỗi 500ms)
    let fastCheckCount = 0;
    const fastCheckLimit = 10;

    const fastCheck = async () => {
        if (isSuccess || fastCheckCount >= fastCheckLimit) {
            // Sau khi hết fast-check → chuyển qua interval
            currentCheckInterval = setInterval(() => {
                checkPayment(amount, content);
            }, 2000);
            return;
        }

        await checkPayment(amount, content);
        fastCheckCount++;
        setTimeout(fastCheck, 500); // delay nhỏ hơn
    };

    fastCheck();
}


async function checkPayment(amount, content) {
    if (isSuccess) {
        clearCurrentInterval();
        return;
    }

    try {
        const now = Date.now();
        let data;

        // Use cached data if recent
        if (lastApiResponse && (now - lastApiCall) < API_CACHE_TIME) {
            data = lastApiResponse;
        } else {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);

            const response = await fetch(CLASS_FUND_API, {
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            data = await response.json();
            lastApiResponse = data;
            lastApiCall = now;
        }

        if (!data?.data?.length) {
            console.log("Không có dữ liệu thanh toán");
            return;
        }

        const lastPayment = data.data[data.data.length - 1];
        const lastAmount = parseFloat(lastPayment["Giá trị"]) || 0;
        const lastContent = String(lastPayment["Mô tả"] || "");

        if (lastAmount >= amount && lastContent.includes(content)) {
            isSuccess = true;
            clearCurrentInterval();
            showSuccessMessage();

            // Animate success
            // elements.qrSection.style.background = 'linear-gradient(135deg, #d4edda, #c3e6cb)';
        } else {
            console.log("Chưa thanh toán thành công");
            // elements.qrSection.style.background = '';
        }

    } catch (error) {
        if (error.name === 'AbortError') {
            console.warn("Request timeout");
        } else {
            console.error("Lỗi kiểm tra thanh toán:", error);
        }
    }
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
}

// Performance optimization: Preload QR images
function preloadQRImages() {
    const amounts = [72000, 96000];
    amounts.forEach(amount => {
        const img = new Image();
        img.src = `https://img.vietqr.io/image/${MY_BANK.BANK_ID}-${MY_BANK.ACCOUNT_NO}-compact2.png?amount=${amount}`;
    });
}

// Preload images after page load
window.addEventListener('load', preloadQRImages);

// Member modal functions
function openMemberModal(e) {
    e.stopPropagation(); // Prevent option selection
    document.getElementById('memberModal').classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeMemberModal() {
    document.getElementById('memberModal').classList.remove('show');
    document.body.style.overflow = 'auto';
    // Clear search
    document.getElementById('memberSearch').value = '';
    document.getElementById('searchResult').style.display = 'none';
}

function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(tabName + 'Tab').classList.add('active');
}

function populateMemberList() {
    const memberList = document.getElementById('memberList');
    const fragment = document.createDocumentFragment();

    MEMBERS.forEach(member => {
        const memberItem = document.createElement('div');
        memberItem.className = 'member-item';
        memberItem.innerHTML = `
                    <span class="member-id">${member.id}</span>
                    <span class="member-name">${member.name}</span>
                `;
        fragment.appendChild(memberItem);
    });

    memberList.appendChild(fragment);
}

function searchMember() {
    const searchTerm = document.getElementById('memberSearch').value.trim().toLowerCase();
    const searchResult = document.getElementById('searchResult');

    if (!searchTerm) {
        searchResult.style.display = 'none';
        return;
    }

    // Search by ID or name
    const found = MEMBERS.find(member =>
        member.id.toLowerCase().includes(searchTerm) ||
        removeVietnameseAccents(member.name.toLowerCase()).includes(removeVietnameseAccents(searchTerm))
    );

    searchResult.style.display = 'block';

    if (found) {
        searchResult.className = 'search-result found';
        searchResult.innerHTML = `
                    ✅ <strong>Tìm thấy!</strong><br>
                    MSSV: <strong>${found.id}</strong><br>
                    Họ tên: <strong>${found.name}</strong><br>
                    <em>Bạn là đoàn viên - chọn option "Đoàn viên" (96,000₫)</em>
                `;
    } else {
        searchResult.className = 'search-result not-found';
        searchResult.innerHTML = `
                    ❌ <strong>Không tìm thấy!</strong><br>
                    Bạn không có trong danh sách đoàn viên.<br>
                    <em>Chọn option "Không phải đoàn viên" (72,000₫)</em>
                `;
    }
}

// Remove Vietnamese accents for better search
function removeVietnameseAccents(str) {
    return str.normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D');
}

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    const modal = document.getElementById('memberModal');
    if (e.target === modal) {
        closeMemberModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeMemberModal();
    }
});