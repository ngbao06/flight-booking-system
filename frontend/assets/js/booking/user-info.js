/* ═══════════════════════════════════════════════════════
   nhap-thong-tin.js  —  JS cho trang Nhập Thông Tin Hành Khách
   Requires: jQuery 3.x
   ═══════════════════════════════════════════════════════ */
const BASE_API_URL = 'http://localhost:3000/api';

window.initUserInfo = function () {

  /* ══ GENERATE PASSENGER CARDS ══ */
  function renderPassengerForms(totalPax) {
    let html = '';
    for (let i = 1; i <= totalPax; i++) {
      html += `
      <div class="form-card pax-card-dynamic" id="pax-card-${i}">
        <div class="form-card-header pax-header">
          <span class="pax-badge">Hành khách ${i}</span>
          <span class="pax-title">Người lớn</span>
        </div>
        <div class="form-card-body">
          <p style="font-size:12px;color:var(--muted);margin-bottom:18px;">
            <span style="color:#ef4444;">*</span> = các trường bắt buộc &nbsp;·&nbsp;
            Vui lòng điền thông tin cá nhân tương ứng với thông tin trong hộ chiếu
          </p>
          <div class="row g-3">
            <div class="col-12">
              <div class="field-group">
                <label>Danh xưng <span class="req">*</span></label>
                <select class="form-select pax-title-select">
                  <option value=""></option>
                  <option>Ông (Mr)</option>
                  <option>Bà (Mrs)</option>
                  <option>Cô (Ms)</option>
                </select>
              </div>
            </div>
            <div class="col-12">
              <div class="field-group">
                <label>Tên đệm và tên (thứ tự như trên CCCD/Hộ chiếu) <span class="req">*</span></label>
                <input type="text" class="form-control pax-firstname" placeholder="" />
              </div>
            </div>
            <div class="col-12">
              <div class="field-group">
                <label>Họ (như trên CCCD/Hộ chiếu) <span class="req">*</span></label>
                <input type="text" class="form-control pax-lastname" placeholder="" />
              </div>
            </div>
            <div class="col-12">
              <div class="field-group">
                <label>Ngày sinh <span class="req">*</span></label>
                <div class="input-with-icon">
                  <input type="date" class="form-control pax-dob" placeholder="Ngày / Tháng / Năm" />
                </div>
                <div class="field-note">Định dạng là Ngày / Tháng / Năm</div>
              </div>
            </div>
          </div>
        </div>
      </div>`;
    }
    $('.users').html(html);
    $('#pax-card-1:not(.pax-card-dynamic)').remove(); // Xoá bỏ thẻ form fix cứng nằm ngoài thẻ .users (nếu có) để tránh trùng lặp
  }

  /* ══ INITIALIZE FLIGHT DATA ══ */
  function loadFlightData() {
    const rawData = sessionStorage.getItem('selectedFlightBooking');
    if (!rawData) return;

    try {
      const data = JSON.parse(rawData);

      // Đổ dữ liệu Sân bay & Thành phố
      if (data.departureAirport) {
        $('#fb-origin-iata').text(data.departureAirport.code);
        $('#fb-origin-city').text(data.departureAirport.city.split(',')[0]); // Lấy tên TP thay vì cả đoạn dài
      }
      if (data.arrivalAirport) {
        $('#fb-dest-iata').text(data.arrivalAirport.code);
        $('#fb-dest-city').text(data.arrivalAirport.city.split(',')[0]);
      }

      // Đổ dữ liệu Ngày đi
      if (data.flight) {
        const depTime = data.flight.departureTime || data.flight.departure_time;
        if (depTime) {
          const dateObj = new Date(depTime);
          const days = ['CN', 'Th 2', 'Th 3', 'Th 4', 'Th 5', 'Th 6', 'Th 7'];
          const dateStr = `${days[dateObj.getDay()]}, ${dateObj.getDate()} tháng ${dateObj.getMonth() + 1}`;
          $('#fb-date').text(dateStr);
        }
      }

      // Đổ dữ liệu số lượng hành khách
      if (data.passengers) {
        const totalPax = (data.passengers.adult || 1) + (data.passengers.child || 0) + (data.passengers.infant || 0);
        $('#fb-pax').html(`${totalPax} <i class="fa-solid fa-user" style="font-size:12px;"></i>`);
        renderPassengerForms(totalPax);
        
        // [QUAN TRỌNG] Khôi phục dữ liệu hành khách nếu người dùng "Quay lại" từ giỏ hàng
        if (data.passengerDetails && data.passengerDetails.length > 0) {
          $('.users .pax-card-dynamic').each(function(index) {
            const pax = data.passengerDetails[index];
            if (pax) {
              $(this).find('.pax-title-select').val(pax.title);
              $(this).find('.pax-firstname').val(pax.firstName);
              $(this).find('.pax-lastname').val(pax.lastName);
              $(this).find('.pax-dob').val(pax.dob);
            }
          });
        }
        
        // Khôi phục thông tin liên hệ
        if (data.contactInfo) {
          if (data.contactInfo.email) $('#email-1').val(data.contactInfo.email);
          if (data.contactInfo.phone) $('input[type="tel"]').first().val(data.contactInfo.phone);
        }
      }
    } catch (e) {
      console.error('Error parsing flight data from session:', e);
    }
  }
  
  // Gọi hàm load dữ liệu
  loadFlightData();

  /* ══ COUNTER: email fields ══ */
  let emailCount = 1;

  window.addEmail = function () {
    emailCount++;
    const id = emailCount;
    const html = `
      <div class="field-group mt-3" id="email-field-${id}">
        <label>Địa chỉ email ${id}</label>
        <div style="display:flex;gap:8px;">
          <input type="email" class="form-control" placeholder="" />
          <button class="btn-remove-field" onclick="$('#email-field-${id}').remove()">&times;</button>
        </div>
      </div>`;
    $('#extra-emails').append(html);
  };

  /* ══ COUNTER: phone fields ══ */
  let phoneCount = 1;

  window.addPhone = function () {
    phoneCount++;
    const id = phoneCount;
    const html = `
      <div class="row g-3 mt-1" id="phone-row-${id}">
        <div class="col-12 col-md-5">
          <div class="field-group">
            <label>Loại điện thoại ${id}</label>
            <select class="form-select">
              <option>Cá nhân</option>
              <option>Công việc</option>
              <option>Khác</option>
            </select>
          </div>
        </div>
        <div class="col-12 col-md-7">
          <div class="row g-3 align-items-end">
            <div class="col-5">
              <div class="field-group">
                <label>Mã quốc gia</label>
                <select class="form-select">
                  <option>🇻🇳 +84</option>
                  <option>🇺🇸 +1</option>
                  <option>🇸🇬 +65</option>
                  <option>🇹🇭 +66</option>
                  <option>🇲🇾 +60</option>
                  <option>🇯🇵 +81</option>
                </select>
              </div>
            </div>
            <div class="col-6">
              <div class="field-group">
                <label>Số điện thoại</label>
                <input type="tel" class="form-control" placeholder="VD: 912345678" />
              </div>
            </div>
            <div class="col-1 pb-2">
              <button class="btn-remove-field" onclick="$('#phone-row-${id}').remove()" style="padding:8px 10px;">&times;</button>
            </div>
          </div>
        </div>
      </div>`;
    $('#extra-phones').append(html);
  };

  /* ══ URGENCY TOGGLE ══ */
  window.toggleUrgency = function (btn) {
    $(btn).toggleClass('on');
    const isOn = $(btn).hasClass('on');
    $('#urgency-label').text(
      isOn ? 'Số liên lạc khẩn cấp đã bật' : 'Vui lòng nhập số liên lạc khẩn cấp'
    );
  };

  /* ══ CONFIRM / VALIDATE ══ */
  window.handleConfirm = async function () {
    // Privacy check
    if (!$('#privacy-chk').is(':checked')) {
      showToast('error', 'Vui lòng đồng ý với chính sách bảo mật để tiếp tục.');
      return;
    }

    // Required fields
    const missing = [];
    $('.users .pax-card-dynamic').each(function(index) {
      const paxNum = index + 1;
      if (!$(this).find('.pax-title-select').val()) missing.push(`Danh xưng (Hành khách ${paxNum})`);
      if (!$(this).find('.pax-firstname').val().trim()) missing.push(`Tên đệm và tên (Hành khách ${paxNum})`);
      if (!$(this).find('.pax-lastname').val().trim()) missing.push(`Họ (Hành khách ${paxNum})`);
    });

    if (!$('#email-1').val().trim()) missing.push('Địa chỉ email');

    if (missing.length) {
      showToast('error', 'Vui lòng điền: ' + missing.join(', '));
      return;
    }

    // Thu thập dữ liệu để lưu vào session
    const rawData = sessionStorage.getItem('selectedFlightBooking');
    let bookingData = rawData ? JSON.parse(rawData) : {};
    
    const passengerDetails = [];
    $('.users .pax-card-dynamic').each(function() {
      passengerDetails.push({
        title: $(this).find('.pax-title-select').val(),
        firstName: $(this).find('.pax-firstname').val().trim(),
        lastName: $(this).find('.pax-lastname').val().trim(),
        dob: $(this).find('.pax-dob').val()
      });
    });

    const contactInfo = {
      email: $('#email-1').val().trim(),
      phone: $('input[type="tel"]').first().val().trim() || ''
    };

    bookingData.passengerDetails = passengerDetails;
    bookingData.contactInfo = contactInfo;
    sessionStorage.setItem('selectedFlightBooking', JSON.stringify(bookingData));

    // [SAGA STEP 1] Tạo Booking
    try {
      const flightId = bookingData.flight.id || bookingData.flight.flight_id;
      const paxCount = passengerDetails.length;
      const basePrice = bookingData.basePrice || 0;
      const totalAmount = basePrice * paxCount; // Tạm tính tiền vé, sẽ cập nhật thêm nếu mua hành lý/bảo hiểm
      const bookingDate = new Date().toISOString().slice(0, 10);

      console.log(flightId, bookingDate, totalAmount);

      const bookingRes = await fetch(`${BASE_API_URL}/booking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flightId, bookingDate, totalAmount, passengerDetails, contactInfo })
      }).then(r => r.json());

      if (!bookingRes.success) showToast('error', bookingRes.message || 'Lỗi tạo đơn hàng');
      
      bookingData.bookingId = bookingRes.data.bookingId;
      sessionStorage.setItem('selectedFlightBooking', JSON.stringify(bookingData));

      showToast('success', 'Thông tin đã được xác nhận! Đang chuyển tới trang tiếp theo…');
      window.BookingSPA.goToStep('shopping-cart');
    } catch (error) {
      showToast('error', error.message);
    }
  };

  /* ══ TOAST ══ */
  function showToast(type, msg) {
    const icon = type === 'success' ? '✅' : '❌';
    const $el = $(`
      <div class="toast-msg ${type}">
        <span class="t-icon">${icon}</span>
        <span>${msg}</span>
      </div>`);
    $('#toast-area').append($el);
    setTimeout(function () {
      $el.fadeOut(300, function () { $(this).remove(); });
    }, 3500);
  }

};