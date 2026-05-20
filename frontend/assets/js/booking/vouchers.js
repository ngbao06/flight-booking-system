window.initVouchers = function() {
  const BASE = (typeof BASE_API_URL !== 'undefined') ? BASE_API_URL : 'http://localhost:5000/api';
  const $root = $('#vouchers-root');
  const $selectedText = $('#voucher-selected-text');

  const authFetch = (url, options = {}) => {
    const headers = { ...(options.headers || {}) };
    const token = localStorage.getItem('authToken');
    // Gửi token vào Authorization header để backend có thể lookup session
    if (token) headers.Authorization = `Bearer ${token}`;

    return fetch(url, {
      ...options,
      headers,
      credentials: 'include' // Gửi cookie sid nếu có
    });
  };

  $root.html('<div class="text-muted">Đang tải...</div>');

  const updateSelectedText = () => {
    if (!$selectedText.length) return;
    const raw = sessionStorage.getItem('selectedFlightBooking');
    const data = raw ? JSON.parse(raw) : {};
    const voucher = data.voucher || null;

    if (voucher && voucher.code) {
      $selectedText.html(`Đang áp dụng voucher: <span>${voucher.code}</span>`);
      return;
    }

    $selectedText.text('Chưa áp dụng voucher cho đơn hàng này.');
  };

  const renderNotLogged = () => {
    $root.html(`
      <div class="form-card">
        <div class="form-card-body">
          <h4>Đăng nhập để sử dụng voucher</h4>
          <p class="text-muted">Bạn cần đăng nhập tài khoản để xem, áp dụng hoặc đổi điểm lấy voucher.</p>
          <div class="d-flex gap-2 mt-3">
            <a href="../../index.html#login" class="btn btn-primary">Đăng nhập</a>
            <a href="../../index.html#register" class="btn btn-outline-primary">Đăng ký</a>
          </div>
        </div>
      </div>
    `);
  };

  const renderNoPassenger = (user) => {
    $root.html(`<div class="text-muted">Tài khoản <strong>${user.username}</strong> không phải là hành khách. Chỉ hành khách mới có voucher.</div>`);
  };

  const formatDiscountLabel = (item = {}) => {
    const discountType = (item.discount_type || item.discountType || '').toUpperCase();
    const discountValue = Number(item.discount_value ?? item.discountValue ?? 0);

    if (discountType === 'PERCENT') {
      const ratio = discountValue > 1 ? discountValue / 100 : discountValue;
      return `${Math.round(ratio * 100)}%`;
    }

    return `${discountValue}`;
  };

  const fetchMyVouchers = async () => {
    const res = await authFetch(`${BASE}/vouchers/mine`, {
      method: 'GET',
    });
    const json = await res.json();
    if (!json.success) return [];
    const data = json.data || [];
    return Array.isArray(data) ? data : (data.items || data);
  };

  const fetchAvailableForRedeem = async () => {
    const res = await fetch(`${BASE}/vouchers`, { credentials: 'include' });
    const json = await res.json();
    if (!json.success) return [];
    const data = json.data || [];
    const list = Array.isArray(data) ? data : (data.items || data);
    return list.filter(v => v.point_cost && Number(v.point_cost) > 0 && !v.is_deleted);
  };

  const renderMyList = (items) => {
    if (!items || items.length === 0) {
      $('#vouchers-root').append('<div class="mt-3 text-muted">Bạn chưa có voucher nào.</div>');
      return;
    }

    const html = [`<div class="mb-3"><strong>Voucher của bạn</strong></div>`];
    html.push('<div class="list-group mb-3">');
    items.forEach(iv => {
      const id = iv.id || iv.user_voucher_id || iv.userVoucherId || iv.userVoucherId;
      const code = iv.code || iv.voucher?.code || '';
      const rawVoucher = iv.voucher || iv;
      const discountType = rawVoucher.discount_type || rawVoucher.discountType || '';
      const discountValue = Number(rawVoucher.discount_value ?? rawVoucher.discountValue ?? 0);
      const maxDiscount = Number(rawVoucher.max_discount ?? rawVoucher.maxDiscount ?? 0);
      const desc = formatDiscountLabel(rawVoucher);
      const status = iv.status || iv.voucher_status || 'AVAILABLE';
      if (status === 'AVAILABLE') {
        html.push(`
          <label class="list-group-item d-flex align-items-center">
            <input type="radio" name="uv-select" value="${id}" data-code="${code}" data-voucherid="${iv.voucher_id || (iv.voucher && iv.voucher.id) || (iv.voucher && iv.voucherId) || ''}" data-discounttype="${discountType}" data-discountvalue="${discountValue}" data-maxdiscount="${maxDiscount}" style="margin-right:12px;" />
            <div style="flex:1;">
              <div style="font-weight:700;"><span class="voucher-code">${code}</span> <span class="discount-badge">${desc}</span></div>
              <div class="text-muted" style="font-size:13px;">Trạng thái: ${status}</div>
            </div>
          </label>
        `);
      }
    });
    html.push('</div>');

    $('#vouchers-root').append(html.join(''));
  };

  const renderRedeemList = (items) => {
    if (!items || items.length === 0) return;
    const html = [`<div class="mb-3"><strong>Đổi điểm Loyalty lấy voucher</strong></div>`];
    html.push('<div class="row g-3">');
    items.forEach(v => {
      html.push(`
        <div class="col-12 col-md-6">
          <div class="form-card p-3">
            <div style="font-weight:700;"><span class="voucher-code">${v.code}</span> <span class="discount-badge">${formatDiscountLabel(v)}</span></div>
            <div class="text-muted" style="font-size:13px;">Chi phí điểm: ${v.point_cost || 0}</div>
            <div class="text-end mt-2">
              <button class="btn  btn-primary btn-redeem" data-id="${v.id}">Đổi điểm</button>
            </div>
          </div>
        </div>
      `);
    });
    html.push('</div>');
    $('#vouchers-root').append(html.join(''));

    $('.btn-redeem').on('click', async function() {
      const voucherId = Number($(this).data('id'));
      if (!confirm('Xác nhận đổi điểm lấy voucher này?')) return;
      try {
        const res = await authFetch(`${BASE}/vouchers/redeem`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ voucherId })
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.message || 'Đổi điểm thất bại');

        // refresh my vouchers and auto-select
        const my = await fetchMyVouchers();
        $('#vouchers-root').empty();
        renderMyList(my);
        const created = json.data || null;
        const redeemedVoucher = created?.voucher || created || null;
        const userVoucherId = redeemedVoucher?.id || redeemedVoucher?.user_voucher_id || redeemedVoucher?.userVoucherId || null;
        const voucherIdReturned = redeemedVoucher?.voucher_id || redeemedVoucher?.voucher?.id || voucherId;
        if (userVoucherId) {
          const raw = sessionStorage.getItem('selectedFlightBooking');
          const data = raw ? JSON.parse(raw) : {};
          data.voucher = {
            userVoucherId,
            voucherId: voucherIdReturned,
            code: redeemedVoucher?.code || '',
            discountType: (redeemedVoucher?.discount_type || redeemedVoucher?.discountType || '').toString().toUpperCase(),
            discountValue: Number(redeemedVoucher?.discount_value ?? redeemedVoucher?.discountValue ?? 0),
            maxDiscount: Number(redeemedVoucher?.max_discount ?? redeemedVoucher?.maxDiscount ?? 0)
          };
          sessionStorage.setItem('selectedFlightBooking', JSON.stringify(data));
          updateSelectedText();
          alert('Đổi điểm thành công và đã áp dụng voucher cho đơn hàng');
          if (window.BookingSPA) window.BookingSPA.goToStep('shopping-cart');
        } else {
          alert('Đổi điểm thành công');
        }
      } catch (err) {
        alert(err.message || 'Lỗi khi đổi điểm');
      }
    });
  };

  $(document)
    .off('click.vouchers-nav', '#voucher-back-btn')
    .on('click.vouchers-nav', '#voucher-back-btn', function(e) {
      e.preventDefault();
      e.stopPropagation();
      if (window.BookingSPA) {
        window.BookingSPA.goToStep('shopping-cart');
      } else {
        history.back();
      }
    });

  $(document)
    .off('click.vouchers-nav', '#voucher-continue-btn')
    .on('click.vouchers-nav', '#voucher-continue-btn', function(e) {
      e.preventDefault();
      // Validate only one voucher is selected (safety; radios normally ensure this)
      const $checked = $('input[name="uv-select"]:checked');
      if ($checked.length > 1) {
        alert('Chỉ được chọn 1 voucher cho đơn hàng. Vui lòng chọn lại.');
        return;
      }

      // Apply selected voucher before navigating
      const $sel = $checked.first();
      if ($sel.length) {
        const userVoucherId = Number($sel.val());
        const voucherId = Number($sel.data('voucherid')) || null;
        const code = $sel.data('code') || '';
        const discountType = ($sel.data('discounttype') || '').toString().toUpperCase();
        const discountValue = Number($sel.data('discountvalue')) || 0;
        const maxDiscount = Number($sel.data('maxdiscount')) || 0;

        const raw = sessionStorage.getItem('selectedFlightBooking');
        const data = raw ? JSON.parse(raw) : {};
        data.voucher = { userVoucherId, voucherId, code, discountType, discountValue, maxDiscount };
        sessionStorage.setItem('selectedFlightBooking', JSON.stringify(data));
      }
      
      if (window.BookingSPA) {
        window.BookingSPA.goToStep('shopping-cart');
      }
    });

  $(document)
    .off('change.vouchers-select', 'input[name="uv-select"]')
    .on('change.vouchers-select', 'input[name="uv-select"]', function() {
      const code = $(this).data('code') || '';
      if ($selectedText.length && code) {
        $selectedText.html(`Đã chọn voucher: <span>${code}</span> (nhấn XONG để quay lại giỏ hàng)`);
      }
    });

  updateSelectedText();

  const fetchLoyaltyBalance = async () => {
    try {
      const res = await authFetch(`${BASE}/loyalty/me`, { method: 'GET' });
      const json = await res.json();
      if (json.success && json.data) {
        const balance = json.data.loyalty_points || json.data.loyaltyPoints || 0;
        return Number(balance);
      }
    } catch (err) {
      console.warn('Failed to fetch loyalty balance:', err);
    }
    return 0;
  };

  // Update header with loyalty points
  const updateHeaderWithLoyalty = async () => {
    const loyaltyBalance = await fetchLoyaltyBalance();
    const $header = $('.sec-card-header .sec-title');
    if (!$header.length) return;
    // remove any previous badge to avoid duplicates
    $('#voucher-loyalty-balance').remove();
    const text = `Bạn có <strong>${loyaltyBalance}</strong> điểm Loyalty`;
    $header.after(`<div id="voucher-loyalty-balance" class="loyalty-badge">${text}</div>`);
  };

  // Start flow
  (async () => {
    try {
      const meRes = await authFetch(`${BASE}/auth/me`);
      console.log(meRes);
      const meJson = await meRes.json();
      if (!meJson.success) {
        renderNotLogged();
        return;
      }

      const user = meJson.data;
      if (!user || user.role !== 'PASSENGER') {
        renderNoPassenger(user || {});
        return;
      }

      // passenger: show own vouchers and redeem options
      $root.empty();
      const my = await fetchMyVouchers();
      renderMyList(my);
      
      await updateHeaderWithLoyalty();

      const redeemList = await fetchAvailableForRedeem();
      if (redeemList.length) renderRedeemList(redeemList);

    } catch (err) {
      $root.html('<div class="text-danger">Lỗi khi tải dữ liệu.</div>');
    }
  })();
};
