/**
 * initPayment - Khởi tạo logic cho bước thanh toán
 */
window.initPayment = function() {
    console.log("Thanh toán đã sẵn sàng.");
    
    let countdownInterval;
    let timeLeft = 30;

    // Tải và hiển thị thông tin đơn hàng từ SessionStorage
    loadBookingSummary();

    // Xử lý chuyển đổi giữa các phương thức
    $('.method-item').on('click', function() {
        // Reset trạng thái
        $('.method-item').removeClass('active');
        $('.method-item input[type="radio"]').prop('checked', false);

        // Kích hoạt item được chọn
        $(this).addClass('active');
        $(this).find('input[type="radio"]').prop('checked', true);
        
        // Hiện/Ẩn form nhập thẻ tín dụng
        const method = $(this).data('method');
        if(method === 'credit-card') {
            $('#card-fields').slideDown();
        } else {
            $('#card-fields').slideUp();
        }
        
        // Reset lại UI nếu đổi phương thức
        $('#payment-processing-container').hide();
        $('#btn-pay-now').show();
    });

    // Xử lý nút thanh toán
    $('#btn-pay-now').on('click', function() {
        const btn = $(this);
        const originalText = btn.html();
        const selectedMethod = $('.method-item.active').data('method');

        // 1. Lấy dữ liệu từ giao diện
        // Xóa chữ "₫" và dấu chấm phân cách hàng nghìn để lấy số nguyên
        const totalAmount = parseInt($('#summary-total-price').text().replace(/[^\d]/g, ''));
        const orderDescription = "Thanh toan don hang " + Date.now(); // Hoặc mã đơn hàng của bạn

        // Kiểm tra nếu là phương thức chuyển khoản (vietqr) mới hiện QR
        if (selectedMethod !== 'vnpay' && selectedMethod !== 'vietqr') {
            alert("Vui lòng chọn phương thức Chuyển khoản ngân hàng!");
            return;
        }

        
        const rawData = sessionStorage.getItem('selectedFlightBooking');
        const amount = (JSON.parse(rawData)).totalPrice;

        // 2. Hiệu ứng Loading
        btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-2"></span> Đang tạo mã QR...');

        // 3. Gọi API Backend (Offline QR)
        $.ajax({
            url: 'http://localhost:3000/api/payments/generateQRCode', // Đường dẫn route Node.js của bạn
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                amount: 2000,
                content: orderDescription
            }),
            success: function(response) {
                if (response.success) {
                    // 4. Hiển thị ảnh QR vào thẻ img
                    const qrImgTag = $('.qr-container img');
                    qrImgTag.attr('src', response.data.qrImage);
                    
                    // Hiển thị container chứa QR (nếu đang ẩn)
                    $('.qr-container').fadeIn().addClass('active');

                    // Bắt đầu logic đếm ngược TTL
                    startPaymentProcess();
                }
            },
            error: function(xhr) {
                alert("Lỗi kết nối server: " + (xhr.responseJSON?.message || "Không thể tạo mã QR"));
            },
            complete: function() {
                // Khôi phục trạng thái nút
                btn.prop('disabled', false).html(originalText);
            }
        });
    });
    
    // Xử lý nút xác nhận thanh toán (thành công)
    $('#btn-confirm-payment').on('click', function() {
        clearInterval(countdownInterval); // Dừng đếm ngược
        
        // Cập nhật trạng thái thành SUCCEED
        $('#payment-status-badge').removeClass().addClass('badge bg-success px-3 py-2').text('SUCCEED');
        $('#payment-countdown').removeClass('text-danger').addClass('text-success');
        
        $(this).prop('disabled', true).html('ĐÃ XÁC NHẬN <i class="fa-solid fa-check ms-2"></i>');
        
        // TODO: Tại đây bạn có thể gọi API AJAX để gửi trạng thái SUCCEED lên server nếu cần thiết
        alert("Xác nhận thanh toán thành công!");
    });

    // Hàm bắt đầu bộ đếm ngược
    function startPaymentProcess() {
        $('#btn-pay-now').hide(); // Ẩn nút "Thanh toán ngay"
        $('#payment-processing-container').slideDown(); // Hiện khối timer & xác nhận
        $('#btn-confirm-payment').prop('disabled', false).html('XÁC NHẬN THANH TOÁN <i class="fa-solid fa-check ms-2"></i>');
        $('#payment-status-badge').removeClass().addClass('badge bg-warning text-dark px-3 py-2').text('PENDING');
        
        timeLeft = 30;
        $('#payment-countdown').text(`00:${timeLeft}`).removeClass('text-success text-muted').addClass('text-danger');
        
        clearInterval(countdownInterval);
        countdownInterval = setInterval(() => {
            timeLeft--;
            let displayTime = timeLeft < 10 ? '0' + timeLeft : timeLeft;
            $('#payment-countdown').text(`00:${displayTime}`);
            
            if (timeLeft <= 0) {
                clearInterval(countdownInterval);
                
                // Cập nhật trạng thái thành OUT_OF_TIME
                $('#payment-status-badge').removeClass().addClass('badge bg-danger px-3 py-2').text('OUT_OF_TIME');
                $('#payment-countdown').removeClass('text-danger').addClass('text-muted');
                $('#btn-confirm-payment').prop('disabled', true).html('ĐÃ HẾT HẠN <i class="fa-solid fa-clock ms-2"></i>');
                
                // TODO: Gọi API báo backend là giao dịch OUT_OF_TIME (nếu cần)
            }
        }, 1000);
    }
};

function loadBookingSummary() {
    const rawData = sessionStorage.getItem('selectedFlightBooking');
    if (rawData) {
        const data = JSON.parse(rawData);
        const paxCount = (data.passengers?.adult || 1) + (data.passengers?.child || 0) + (data.passengers?.infant || 0);
        const basePrice = (data.basePrice || 0) * paxCount;
        const extraFee = data.selectedServices?.totalExtraFee || 0;
        const total = data.totalPrice || (basePrice + extraFee);

        $('#summary-pax-label').text(`Giá vé (${paxCount} Hành khách)`);
        $('#summary-base-price').text(basePrice.toLocaleString('vi-VN') + ' ₫');
        $('#summary-extra-fee').text(extraFee > 0 ? `+ ${extraFee.toLocaleString('vi-VN')} ₫` : '0 ₫');
        $('#summary-total-price').text(total.toLocaleString('vi-VN') + ' ₫');
    }
}