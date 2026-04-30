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
      renderSelectedSeats();
      
      // Khôi phục suất ăn nếu đã chọn trước đó
      if (bookingData.selectedServices && bookingData.selectedServices.meal) {
          state.meal = bookingData.selectedServices.meal;
          $(`input[name="meal_option"][value="${state.meal}"]`).prop('checked', true);
          
          $('.meal-option').css({ 'border-color': 'var(--border)', 'background': 'transparent' });
          $(`input[name="meal_option"][value="${state.meal}"]`).closest('.meal-option').css({ 'border-color': 'var(--primary)', 'background': 'var(--primary-light)' });
          
          $('#meal-selected-info').html(`Đã chọn: <span style="color:var(--primary);">${state.meal}</span>`).show();
          $('#meal-desc').hide();
          $('#btn-meal').html('<i class="fa-solid fa-pen me-1"></i> SỬA LỰA CHỌN').removeClass('primary').addClass('outline');
      }
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

  /* ══ RENDER CHỖ NGỒI ĐÃ CHỌN ══ */
  function renderSelectedSeats() {
    const summary = bookingData.seatSummary || [];
    let seatTotal = 0;
    let seatLabels = [];

    summary.forEach(item => {
      if (item.seatLabel) {
        seatLabels.push(`${item.passengerName}: <span style="color:var(--primary); font-weight:700;">${item.seatLabel}</span>`);
        seatTotal += (item.price || 0);
      }
    });

    PRICES.seat = seatTotal;

    if (seatLabels.length > 0) {
      state.seat = true;
      let seatText = seatLabels.join('<br/>');
      let priceText = seatTotal > 0 ? `+ ${formatVND(seatTotal)}` : 'Miễn phí';

      $('#seat-selected-info').html(`Đã chọn ghế:<br/>${seatText}<br/><span style="color:#16a34a; font-weight:700;">${priceText}</span>`).show();
      $('#seat-desc').hide();
      
      $('#btn-seat').html('<i class="fa-solid fa-pen me-1"></i> SỬA LỰA CHỌN')
                    .removeClass('primary').addClass('outline');
    } else {
      state.seat = false;
      $('#seat-selected-info').hide();
      $('#seat-desc').show();
      $('#btn-seat').html('<i class="fa-solid fa-chair me-1"></i> CHỌN CHỖ')
                    .removeClass('outline').addClass('primary');
    }
  }

  /* ══ RENDER TỔNG TIỀN ══ */
  function calcTotal() {
    let total = PRICES.baseTicket;
    if (state.insurance) total += PRICES.insurance;
    if (state.baggage === 20) total += PRICES.baggage20;
    if (state.baggage === 30) total += PRICES.baggage30;
    total += PRICES.seat;
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
    window.BookingSPA.goToStep('seatmap');
  });

  /* ══ SUẤT ĂN ══ */
  $('#btn-meal').on('click', function () {
    $('#meal-options-container').slideToggle(300);
  });

  $('input[name="meal_option"]').on('change', function() {
      $('.meal-option').css({ 'border-color': 'var(--border)', 'background': 'transparent' });
      if($(this).is(':checked')) {
          $(this).closest('.meal-option').css({ 'border-color': 'var(--primary)', 'background': 'var(--primary-light)' });
      }
  });

  $('#btn-confirm-meal').on('click', function () {
    const selectedMeal = $('input[name="meal_option"]:checked').val();
    
    if (selectedMeal && selectedMeal !== 'none') {
        state.meal = selectedMeal;
        $('#meal-selected-info').html(`Đã chọn: <span style="color:var(--primary); font-weight:700;">${selectedMeal}</span>`).show();
        $('#meal-desc').hide();
        $('#btn-meal').html('<i class="fa-solid fa-pen me-1"></i> SỬA LỰA CHỌN').removeClass('primary').addClass('outline');
    } else {
        state.meal = false;
        $('#meal-selected-info').hide();
        $('#meal-desc').show();
        $('#btn-meal').html('<i class="fa-solid fa-utensils me-1"></i> LỰA CHỌN').removeClass('outline').addClass('primary');
    }
    
    $('#meal-options-container').slideUp(300);
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
  $('#btn-continue').off('click').on('click', function () {
    showToast('success', 'Đang lưu giỏ hàng và chuyển trang…');
    
    bookingData.selectedServices = {
        insurance: state.insurance,
        baggage: state.baggage,
        meal: state.meal,
        special: state.special,
        totalExtraFee: calcTotal() - PRICES.baseTicket
    };
    bookingData.totalPrice = calcTotal();
    sessionStorage.setItem('selectedFlightBooking', JSON.stringify(bookingData));

    setTimeout(function () {
      if(window.BookingSPA) window.BookingSPA.goToStep('payment');
    }, 1000);
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