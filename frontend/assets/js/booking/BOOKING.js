$(function() {
    'use strict';

    // 1. Load footer từ thư mục components
    $('#footer-container').load('../../components/footer.html');

    // 2. Quản lý trạng thái SPA cho luồng Booking
    window.BookingSPA = {
        currentStep: 'user-info',
        routes: {
            'user-info': { html: 'user-info.html', js: '../../assets/js/booking/user-info.js', init: 'initUserInfo' },
            'shopping-cart': { html: 'shopping-cart.html', js: '../../assets/js/booking/shopping-cart.js', init: 'initShoppingCart' },
            'seatmap': { html: 'seatmap.html', js: '../../assets/js/booking/seatmap.js', init: 'initSeatMap' },
            'meal': { html: 'meal.html', js: '../../assets/js/booking/meal.js', init: 'initMeal' },
            'payment': { html: 'payment.html', js: '../../assets/js/booking/payment.js', init: 'initPayment' }
        },
        goToStep: function(stepName) {
            const route = this.routes[stepName];
            if (!route) {
                console.error('Booking step not found:', stepName);
                return;
            }

            $('#booking-content').stop().animate({ opacity: 0 }, 200, function() {
                $.get(route.html, function(data) {
                    // Trích xuất nội dung để tránh duplicate html/head/script
                    const $temp = $('<div>').html(data);
                    $temp.find('script').remove(); // Xóa script cứng trong html để load động qua $.getScript

                    // Lấy thẻ chứa nội dung chính
                    const content = $temp.find('.steps-bar').length ? $temp : ($temp.find('body').length ? $temp.find('body') : $temp);

                    $('#booking-content').html(content.html()).animate({ opacity: 1 }, 200);
                    window.scrollTo({ top: 0, behavior: 'smooth' });

                    // Nạp file JS riêng cho step và gọi hàm khởi tạo tương ứng
                    $.getScript(route.js).done(function() {
                        if (typeof window[route.init] === 'function') {
                            window[route.init]();
                        }
                    });

                    window.BookingSPA.currentStep = stepName;
                }).fail(function() {
                    $('#booking-content').html('<div class="container text-center py-5 text-danger">Không thể tải nội dung trang.</div>').animate({ opacity: 1 }, 200);
                });
            });
        }
    };

    // 3. Bắt đầu luồng ở trang nhập thông tin
    window.BookingSPA.goToStep('user-info');
});