/*
 * initPayment - Khởi tạo logic cho bước thanh toán
 */
// const BASE_API_URL = 'http://localhost:3000/api';

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
    $('#btn-pay-now').on('click', async function() {
        const btn = $(this);
        const originalText = btn.html();
        const selectedMethod = $('.method-item.active').data('method');

        // Kiểm tra nếu là phương thức chuyển khoản (vietqr) mới hiện QR
        if (selectedMethod !== 'vnpay' && selectedMethod !== 'vietqr') {
            alert("Vui lòng chọn phương thức Chuyển khoản ngân hàng!");
            return;
        }

        // 2. Hiệu ứng Loading
        btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-2"></span> Đang tạo giao dịch...');

        try {
            const rawData = sessionStorage.getItem('selectedFlightBooking');
            if (!rawData) throw new Error("Không tìm thấy dữ liệu đơn hàng");
            
            const data = JSON.parse(rawData);
            const amount = data.totalPrice;
            const bookingId = data.bookingId;
            if (!bookingId) throw new Error("Chưa có Booking ID. Vui lòng thử lại từ bước đầu.");

            // [TẠO PAYMENT DB]
            const transactionId = "TXN-" + Date.now();
            const paymentRes = await fetch(`${BASE_API_URL}/payments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bookingId: parseInt(bookingId),
                    transactionId: transactionId,
                    amount: amount,
                    paymentMethod: 'BANKING',
                    status: 'PENDING'
                })
            }).then(r => r.json());
            if (!paymentRes.success) throw new Error(paymentRes.message || 'Lỗi khởi tạo Thanh toán');
            
            const paymentId = paymentRes.data.id;
            sessionStorage.setItem('currentPaymentId', paymentId);
            sessionStorage.setItem('currentTransactionId', transactionId);

            // [HIỂN THỊ MÃ QR]
            const qrRes = await fetch(`${BASE_API_URL}/payments/generateQRCode`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: amount, content: transactionId })
            }).then(r => r.json());

            if (qrRes.success) {
                $('.qr-container img').attr('src', qrRes.data.qrImage);
                $('.qr-container').fadeIn().addClass('active');
                startPaymentProcess();
            } else {
                throw new Error("Không thể sinh mã QR");
            }
        } catch (error) {
            alert("Giao dịch gián đoạn: " + error.message);
        } finally {
            btn.prop('disabled', false).html(originalText);
        }
    });
    
    // Xử lý nút xác nhận thanh toán (thành công)
    $('#btn-confirm-payment').on('click', async function() {
        const btn = $(this);
        clearInterval(countdownInterval); // Dừng đếm ngược
        btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-2"></span> Đang xác nhận...');
        
        try {
            const data = JSON.parse(sessionStorage.getItem('selectedFlightBooking'));
            const bookingId = data.bookingId;
            const paymentId = sessionStorage.getItem('currentPaymentId');
            const transactionId = sessionStorage.getItem('currentTransactionId');
            const amount = data.totalPrice;
            const paymentMethod = $('.method-item.active').data('method') || 'vietqr';

            // Cập nhật Database: Đổi Payments sang COMPLETED
            await fetch(`${BASE_API_URL}/payments/${paymentId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'SUCCEED' })
            });

            // [SAGA STEP 4] Báo Saga hoàn tất thanh toán để xuất vé
            const confirmRes = await fetch(`${BASE_API_URL}/booking/${bookingId}/payment-completed`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paymentId: parseInt(paymentId), transactionId, amount, paymentMethod })
            }).then(r => r.json());

            if (!confirmRes.success) throw new Error(confirmRes.message);
            
            $('#payment-status-badge').removeClass().addClass('badge bg-success px-3 py-2').text('SUCCEED');
            $('#payment-countdown').removeClass('text-danger').addClass('text-success');
            btn.html('ĐÃ XÁC NHẬN <i class="fa-solid fa-check ms-2"></i>');
            alert("Chúc mừng! Chuyến bay của bạn đã được đặt vé thành công.");
            sessionStorage.removeItem('selectedFlightBooking');
        } catch (error) {
            alert("Lỗi xác nhận: " + error.message);
            btn.prop('disabled', false).html('XÁC NHẬN LẠI <i class="fa-solid fa-rotate-right ms-2"></i>');
        }
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
                
                // [SAGA COMPENSATION] Báo Saga huỷ giao dịch, nhả ghế
                const data = JSON.parse(sessionStorage.getItem('selectedFlightBooking') || '{}');
                const bookingId = data.bookingId;
                const paymentId = sessionStorage.getItem('currentPaymentId');
                if (bookingId && paymentId) {
                    fetch(`${BASE_API_URL}/booking/${bookingId}/payment-failed`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            paymentId: parseInt(paymentId),
                            reason: 'Hết thời gian thanh toán'
                        })
                    });
                }
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