/* ═══════════════════════════════════════════════════════
   gio-hang.js  —  JS cho trang Giỏ Hàng / Lựa Chọn Dịch Vụ
   Requires: jQuery 3.x
   ═══════════════════════════════════════════════════════ */

window.initShoppingCart = function () {

  /* ══ GIÁ ══ */
  const PRICES = {
    baseTicket:  0,       // Sẽ được cập nhật từ sessionStorage
    insurance:   80000,
    baggage20:   324000,
    baggage30:   480000,
    seat:        0,       // chọn chỗ miễn phí demo
    meal:        0,       // đã bao gồm
    special:     0,
  };

  const state = {
    insurance: true,     // mặc định chọn bảo hiểm
    baggage:   0,        // kg thêm
    seat:      false,
    meal:      false,
    special:   false,
  };

  let bookingData = {};

  /* ══ LOAD DỮ LIỆU TỪ SESSION ══ */
  function loadData() {
    const rawData = sessionStorage.getItem('selectedFlightBooking');
    if (rawData) {
      bookingData = JSON.parse(rawData);
      calculateBasePrice();
      renderFlightInfo();
      renderPassengerInfo();
    }
  }

  /* ══ TÍNH GIÁ GỐC ══ */
  function calculateBasePrice() {
    if (!bookingData.flight) return;
    
    // Lấy giá base trực tiếp từ minPrice đã truyền sang (nếu không có thì fallback)
    const singlePrice = bookingData.basePrice || bookingData.flight.basePrice || bookingData.flight.price || 1000000;
    
    // Tính tổng số khách
    const pax = bookingData.passengers || { adult: 1, child: 0, infant: 0 };
    const totalPax = pax.adult + pax.child + pax.infant;
    
    // Giá singlePrice lấy từ DB lên đã ứng với hạng ghế nên không cần nhân hệ số multiplier nữa
    PRICES.baseTicket = singlePrice * totalPax;
  }

  /* ══ RENDER CHUYẾN BAY ══ */
  function renderFlightInfo() {
    if (!bookingData.flight) return;
    const f = bookingData.flight;
    const depAP = bookingData.departureAirport || { code: 'SGN', city: 'TP. Hồ Chí Minh' };
    const arrAP = bookingData.arrivalAirport || { code: 'HAN', city: 'Hà Nội' };
    const depTime = f.departureTime || f.departure_time;
    const arrTime = f.arrivalTime || f.arrival_time;
    const flightNum = f.flightNumber || f.flight_number || 'VN 0000';
    
    const classMap = {
        'ECONOMY': 'Phổ thông',
        'BUSINESS': 'Thương gia',
        'FIRST': 'Hạng Nhất'
    };
    const className = classMap[bookingData.classType] || bookingData.classType || 'Phổ thông';

    const d = new Date(depTime);
    const dateStr = `Thứ ${d.getDay() === 0 ? 'Chủ Nhật' : d.getDay() + 1}, ${d.getDate()} tháng ${d.getMonth() + 1}. ${d.getFullYear()}`;
    
    const timeFormat = { hour: '2-digit', minute: '2-digit' };
    const depTimeStr = new Date(depTime).toLocaleTimeString('vi-VN', timeFormat);
    const arrTimeStr = new Date(arrTime).toLocaleTimeString('vi-VN', timeFormat);

    // Tính thời gian bay
    const mins = Math.round((new Date(arrTime) - new Date(depTime)) / 60000);
    const duration = `${Math.floor(mins / 60)}h ${String(mins % 60).padStart(2, '0')}phút`;

    const html = `
      <div class="fl-date-label">
        <i class="fa-regular fa-calendar me-1"></i>
        ${depAP.city.split(',')[0]} đến ${arrAP.city.split(',')[0]} &nbsp;·&nbsp; ${dateStr}
      </div>
      <div class="flight-row">
        <div class="text-center">
          <div class="fl-time">${depTimeStr}</div>
          <div class="fl-iata">${depAP.code}</div>
        </div>
        <div class="fl-middle">
          <div class="fl-duration">Bay thẳng &nbsp;·&nbsp; ${duration}</div>
          <div class="fl-line">
            <i class="fa-solid fa-circle" style="font-size:6px;"></i>
            <div class="fl-line-bar"></div>
            <i class="fa-solid fa-plane" style="font-size:13px;"></i>
          </div>
          <div class="fl-flight-num">
            ${flightNum} &nbsp;·&nbsp; Khai thác bởi BAirlines
          </div>
        </div>
        <div class="text-center">
          <div class="fl-time">${arrTimeStr}</div>
          <div class="fl-iata">${arrAP.code}</div>
        </div>
        <div class="ms-4 d-flex flex-column align-items-end gap-2">
          <span class="fl-fare-badge">Hạng ${className}</span>
        </div>
      </div>
    `;
    $('#sc-flight-container').html(html);
  }

  /* ══ RENDER HÀNH KHÁCH ══ */
  function renderPassengerInfo() {
    const paxList = bookingData.passengerDetails || [];
    const contact = bookingData.contactInfo || {};
    let html = '';

    paxList.forEach((pax, index) => {
      html += `
      <div class="pax-card mt-3">
        <div class="pax-avatar">
          <i class="fa-solid fa-user"></i>
          <div class="pax-verified"><i class="fa-solid fa-check" style="font-size:7px;"></i></div>
        </div>
        <div class="pax-info">
          <div class="pax-name">${pax.title} ${pax.firstName} ${pax.lastName}</div>
          <div class="pax-meta">
            ${index === 0 ? `${contact.email}<br/>${contact.phone}` : `Ngày sinh: ${pax.dob}`}
          </div>
        </div>
        <span class="pax-type-badge">Hành khách ${index + 1}</span>
      </div>`;
    });

    if (!html) {
      html = '<div class="text-muted">Chưa có thông tin hành khách.</div>';
    }
    $('#sc-passenger-container').html(html);
  }

  /* ══ RENDER TỔNG TIỀN ══ */
  function calcTotal() {
    let total = PRICES.baseTicket;
    if (state.insurance) total += PRICES.insurance;
    if (state.baggage === 20) total += PRICES.baggage20;
    if (state.baggage === 30) total += PRICES.baggage30;
    return total;
  }

  function formatVND(n) {
    return n.toLocaleString('vi-VN') + ' VND';
  }

  function renderTotal() {
    const total = calcTotal();
    $('#summary-total').text(formatVND(total));
    $('#fl-total').text(formatVND(PRICES.baseTicket));
  }

  /* ══ BẢO HIỂM ══ */
  $(document).on('click', '.ins-option', function () {
    const val = $(this).data('value');
    state.insurance = val === 'yes';

    $('.ins-option').removeClass('selected');
    $(this).addClass('selected');

    const insAmt = state.insurance ? PRICES.insurance : 0;
    $('#ins-total-amt').text(state.insurance ? formatVND(PRICES.insurance) : '0 VND');
    renderTotal();
    showToast(
      state.insurance ? 'success' : 'info',
      state.insurance ? 'Đã thêm bảo hiểm TripCARE vào đơn hàng.' : 'Đã bỏ bảo hiểm khỏi đơn hàng.'
    );
  });

  /* ══ HÀNH LÝ ══ */
  $(document).on('click', '.baggage-option-btn', function () {
    const kg = parseInt($(this).data('kg'));
    state.baggage = state.baggage === kg ? 0 : kg;

    $('.baggage-option-btn').removeClass('active');
    if (state.baggage) {
      $(`.baggage-option-btn[data-kg="${state.baggage}"]`).addClass('active');
      $('#baggage-status').html(`<span style="color:var(--primary);font-weight:700;"><i class="fa-solid fa-check me-1"></i>${state.baggage}kg – ${formatVND(PRICES['baggage' + state.baggage])}</span>`);
    } else {
      $('#baggage-status').html(`<span style="color:var(--muted);">1 kiện xách tay, <a href="#" class="baggage-link">không có hành lý ký gửi</a></span>`);
    }
    renderTotal();
    showToast('success', state.baggage ? `Đã chọn hành lý ${state.baggage}kg.` : 'Đã bỏ hành lý ký gửi.');
  });

  /* ══ CHỌN CHỖ ══ */
  $('#btn-seat').on('click', function () {
    state.seat = true;
    $(this).html('<i class="fa-solid fa-check me-1"></i> Đã chọn chỗ')
           .removeClass('primary').addClass('outline');
    showToast('success', 'Đã thêm dịch vụ chọn chỗ ngồi.');
    renderTotal();
  });

  /* ══ SUẤT ĂN ══ */
  $('#btn-meal').on('click', function () {
    state.meal = true;
    $(this).html('<i class="fa-solid fa-check me-1"></i> Đã chọn')
           .removeClass('primary').addClass('outline');
    showToast('success', 'Đã chọn suất ăn đặc biệt.');
  });

  /* ══ DỊCH VỤ ĐẶC BIỆT ══ */
  $('#btn-special').on('click', function () {
    state.special = true;
    $(this).html('<i class="fa-solid fa-check me-1"></i> Đã thêm')
           .removeClass('primary').addClass('outline');
    showToast('success', 'Đã thêm dịch vụ đặc biệt.');
  });

  /* ══ EXPAND / COLLAPSE ══ */
  $(document).on('click', '.expand-btn', function () {
    const target = $(this).data('target');
    const $content = $(target);
    const isOpen = $content.hasClass('show');

    $content.toggleClass('show');
    $(this).toggleClass('open');
    $(this).find('.expand-label').text(isOpen ? 'Xem chi tiết' : 'Thu gọn');
  });

  /* ══ TIẾP TỤC ══ */
  $('#btn-continue').on('click', function () {
    showToast('success', 'Đang chuyển đến trang thanh toán…');
    setTimeout(function () {
      // window.location.href = 'thanh-toan.html';
    }, 1600);
  });

  /* ══ TOAST ══ */
  function showToast(type, msg) {
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    const cls   = type === 'info' ? '' : type;
    const $el = $(`
      <div class="toast-msg ${cls}">
        <span>${icons[type] || 'ℹ️'}</span>
        <span>${msg}</span>
      </div>`);
    $('#toast-area').append($el);
    setTimeout(() => $el.fadeOut(300, function () { $(this).remove(); }), 3500);
  }

  /* ══ INIT ══ */
  loadData();
  renderTotal();

  // Lắng nghe thay đổi toggle đóng/mở thẻ (đã gắn cứng ngoài loadData)
  $(document).off('click', '.expand-btn').on('click', '.expand-btn', function () {
    const target = $(this).data('target');
    $(target).toggleClass('show');
    $(this).toggleClass('open');
  });
};