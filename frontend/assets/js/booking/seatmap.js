/* ═══════════════════════════════════════════════════════
   seatmap.js  —  initSeatMap()
   Được BookingSPA.goToStep('seatmap') gọi sau khi load HTML.
   Yêu cầu: window.AdminAPI (hoặc tự fetch), jQuery
   State đầu vào từ BookingState (window.BookingState):
     - flightId     : number
     - passengers   : [{ id, name, type }]  (hoặc ít nhất 1)
     - selectedSeats: {}  map passengerId → { seatId, label }
═══════════════════════════════════════════════════════ */

function initSeatMap() {
  'use strict';

  /* Thêm động style để phân biệt màu ghế các hạng */
  if (!$('#sm-dynamic-style').length) {
    $('<style id="sm-dynamic-style">').text(`
      .sm-seat--first { background-color: var(--gold) !important; color: #fff !important; border-color: var(--gold) !important; }
      .sm-seat--business { background-color: var(--navy) !important; color: #fff !important; border-color: var(--navy) !important; }
      .sm-seat--window { background-color: var(--primary) !important; color: #fff !important; border-color: var(--primary-dark) !important; }
      .sm-seat--middle { background-color: var(--primary-hover) !important; color: #fff !important; border-color: var(--primary) !important; }
      .sm-seat--aisle { background-color: var(--muted) !important; color: #fff !important; border-color: var(--muted) !important; }
      .sm-seat--taken { background-color: #e5e7eb !important; color: #9ca3af !important; border-color: #d1d5db !important; cursor: not-allowed !important; }
    `).appendTo('head');
  }

  /* ─────────────────────────────────────────
     1. STATE
  ───────────────────────────────────────── */
  const state = {
    flightId:      null,
    planeModel:    'AIRBUS A321',
    passengers:    [],          // [{ id, name, type }]
    currentPaxIdx: 0,           // index in passengers
    seats:         [],          // raw seat objects from API
    selectedSeats: {},          // { passengerId: { seatId, label, price, col } }
    totalPax:      1,
  };

  /* ─────────────────────────────────────────
     2. INIT — read BookingState
  ───────────────────────────────────────── */
  function readBookingState() {
    const rawData = sessionStorage.getItem('selectedFlightBooking');
    const bs = rawData ? JSON.parse(rawData) : {};

    state.flightId  = bs.flight?.id || null;
    state.basePrice = bs.basePrice || 0;
    
    const pName = bs.flight?.plane_name || bs.flight?.plane?.name || bs.flight?.planeModel || bs.flight?.plane?.model;
    state.planeModel = pName ? pName.toUpperCase() : 'AIRBUS A321';

    /* Lấy danh sách hành khách từ session (đã lưu ở bước nhập thông tin) */
    if (bs.passengerDetails && bs.passengerDetails.length) {
      state.passengers = bs.passengerDetails.map(function (p, i) {
        return {
          id:   'pax_' + i,
          name: ((p.firstName || '') + ' ' + (p.lastName || '')).trim() || ('Hành khách ' + (i + 1)),
          type: p.title || 'Người lớn',
        };
      });
    } else {
      state.passengers = [{ id: 'pax_0', name: 'Hành khách 1', type: 'Người lớn' }];
    }

    state.totalPax = state.passengers.length;

    /* Khôi phục ghế đã chọn trước đó (nếu có) */
    state.selectedSeats = bs.selectedSeats || {};

    /* Cập nhật UI hiển thị số lượng */
    $('#sm-required-count').text(state.totalPax);
    $('#sm-plane-model').text(state.planeModel);

    /* Hiển thị chặng bay */
    const origin = bs.departureAirport?.city?.split(',')[0] || 'TP. Hồ Chí Minh';
    const dest   = bs.arrivalAirport?.city?.split(',')[0] || 'Hà Nội';
    $('#sm-hero-route').text(origin + ' – ' + dest);
  }

  /* ─────────────────────────────────────────
     3. FETCH SEATS
  ───────────────────────────────────────── */
  async function fetchSeats() {
    $('#sm-loading').show();
    $('#sm-cabin').hide();

    if (!state.flightId) {
      /* DEV fallback: generate mock seats if no flightId */
      state.seats = generateMockSeats();
      renderAll();
      return;
    }

    try {
      const BASE = (typeof BASE_API_URL !== 'undefined') ? BASE_API_URL : 'http://localhost:3000/api';
      const url = `${BASE}/seats?flightId=${state.flightId}&limit=300`;
      let payload;

      if (window.AdminAPI && window.AdminAPI.request) {
        payload = await window.AdminAPI.request(url, { method: 'GET' });
      } else {
        const res = await fetch(url, { credentials: 'include' });
        payload = await res.json();
      }

      if (!payload.success) throw new Error(payload.message || 'API error');

      // Xử lý dữ liệu trả về từ DB: map seat_number (VD: 1A, 2B) thành row và col
      const rawSeats = Array.isArray(payload.data) ? payload.data : [];
      state.seats = rawSeats.map(s => {
          const seatNum = s.seat_number || s.seatNumber || '';
          const match = seatNum.match(/^(\d+)([A-Z])$/);
          const row = match ? parseInt(match[1]) : 0;
          const col = match ? match[2] : '';
          
          return {
              ...s,
              id: s.id,
              seatNumber: seatNum,
              row: row,
              col: col,
              class: s.class,
              price: (parseInt(s.price) || 0) - state.basePrice,
              status: s.status,
              isExit: [15, 28].includes(row),
              isWindow: (col === 'A' || col === 'F'),
              isAisle: (col === 'C' || col === 'D'),
              isExtraLeg: [15, 28].includes(row)
          };
      });

      if (!state.seats.length) {
        state.seats = generateMockSeats();
      }

      renderAll();
    } catch (err) {
      console.warn('[SeatMap] API failed, using mock data.', err.message);
      state.seats = generateMockSeats();
      renderAll();
    }
  }

  /* ─────────────────────────────────────────
     4. MOCK SEAT GENERATOR
     Tạo A321 layout: rows 1–39, cols A B C | D E G
     Rows 1–14  = Business / front
     Rows 15–39 = Economy
     Exit rows: 15, 28
  ───────────────────────────────────────── */
  function generateMockSeats() {
    const COLS     = ['A','B','C','D','E','F'];
    const TOTAL    = 39;
    const BUSINESS = [1,2,3,4,5,6,7,8,9,10,11,12,13,14];
    const EXIT     = [15, 28];
    const TAKEN_PCT = 0.40; // 40% ghế đã bán

    const seats = [];
    let id = 1;

    for (let row = 1; row <= TOTAL; row++) {
      for (let ci = 0; ci < COLS.length; ci++) {
        const col = COLS[ci];
        const seatNum = col + row;
        const isBusiness = BUSINESS.includes(row);
        const isExit     = EXIT.includes(row);
        const isWindow   = (col === 'A' || col === 'F');
        const isAisle    = (col === 'C' || col === 'D');

        /* seatClass: BUSINESS | ECONOMY */
        const seatClass = isBusiness ? 'BUSINESS' : 'ECONOMY';

        /* price tiers */
        let basePrice = 0;
        if (isBusiness) {
          basePrice = 800000;
        } else if (isExit) {
          basePrice = 150000; /* extra legroom */
        } else if (isWindow && row <= 20) {
          basePrice = 80000;
        } else if (isAisle) {
          basePrice = 60000;
        }

        /* status */
        const taken = Math.random() < TAKEN_PCT;

        seats.push({
          id:         id++,
          seatNumber: seatNum,
          row:        row,
          col:        col,
          class:      seatClass,
          price:      basePrice - state.basePrice,
          status:     taken ? 'RESERVED' : 'AVAILABLE',
          isExit:     isExit,
          isWindow:   isWindow,
          isAisle:    isAisle,
          isExtraLeg: isExit,
        });
      }
    }
    return seats;
  }

  /* ─────────────────────────────────────────
     5. SEAT CLASSIFICATION HELPERS
  ───────────────────────────────────────── */

  /* Returns CSS class for seat type (color coding) */
  function seatTypeClass(seat) {
    const row = seat.row;
    const col = seat.col;

    /* Bắt tất cả các trạng thái không còn trống (PAID, RESERVED, BOOKED...) */
    if (seat.status !== 'AVAILABLE') return 'sm-seat--taken';

    /* Check if selected by any pax in this booking */
    const reservedByOther = getReservedByOther(seat.id);
    if (reservedByOther !== null) return 'sm-seat--reserved-other';

    /* Check selected by current pax */
    if (isSelectedByCurrent(seat.id)) return 'sm-seat--selected';

    /* Phân loại màu theo hạng ghế */
    if (seat.class === 'FIRST') return 'sm-seat--first';
    if (seat.class === 'BUSINESS') return 'sm-seat--business';

    /* Window seats (A/F) */
    if (col === 'A' || col === 'F') return 'sm-seat--window';

    /* Middle seats (B/E) */
    if (col === 'B' || col === 'E') return 'sm-seat--middle';

    /* Aisle seats (C/D) */
    if (col === 'C' || col === 'D') return 'sm-seat--aisle';

    return 'sm-seat--avail';
  }

  function isSelectedByCurrent(seatId) {
    const pax = state.passengers[state.currentPaxIdx];
    if (!pax) return false;
    const sel = state.selectedSeats[pax.id];
    return sel && sel.seatId === seatId;
  }

  function getReservedByOther(seatId) {
    const pax = state.passengers[state.currentPaxIdx];
    for (const pid in state.selectedSeats) {
      if (pid !== (pax && pax.id) && state.selectedSeats[pid].seatId === seatId) return pid;
    }
    return null;
  }

  /* ─────────────────────────────────────────
     6. RENDER — Legend
  ───────────────────────────────────────── */
  function renderLegend() {
    const items = [
      { cls: 'sm-seat--first',        label: 'Hạng Nhất',             text: 'F' },
      { cls: 'sm-seat--business',     label: 'Hạng Thương gia',       text: 'C' },
      { cls: 'sm-seat--window',       label: 'Phổ thông (Cửa sổ)',    text: 'W' },
      { cls: 'sm-seat--middle',       label: 'Phổ thông (Giữa)',      text: 'M' },
      { cls: 'sm-seat--aisle',        label: 'Phổ thông (Lối đi)',    text: 'A' },
      { cls: 'sm-seat--selected',     label: 'Chỗ đang chọn',         text: '✓' },
      { cls: 'sm-seat--taken',        label: 'Chỗ không còn trống',   text: '×' },
    ];

    const html = items.map(function (it) {
      return '<div class="sm-legend-item">'
        + '<div class="sm-legend-swatch sm-seat ' + it.cls + '">' + it.text + '</div>'
        + '<span>' + it.label + '</span>'
        + '</div>';
    }).join('')
      + '<div class="sm-legend-item" style="margin-top:6px;">'
      +   '<div class="sm-exit-badge">E</div>'
      +   '<span>Lối thoát hiểm</span>'
      + '</div>';

    $('#sm-legend-list').html(html);
  }

  /* ─────────────────────────────────────────
     7. RENDER — Passenger chips
  ───────────────────────────────────────── */
  function renderPaxChips() {
    const html = state.passengers.map(function (pax, i) {
      const sel  = state.selectedSeats[pax.id];
      const seat = sel ? sel.label : 'Chưa chọn chỗ';
      const act  = i === state.currentPaxIdx ? 'active' : '';
      return '<div class="sm-pax-chip ' + act + '" data-pax-idx="' + i + '">'
        + '<div class="sm-pax-chip-avatar"><i class="fa-solid fa-user"></i></div>'
        + '<div class="sm-pax-chip-info">'
        +   '<div class="sm-pax-chip-name">' + escHtml(pax.name) + '</div>'
        +   '<div class="sm-pax-chip-seat">' + escHtml(seat) + '</div>'
        + '</div>'
        + '</div>';
    }).join('');

    $('#sm-pax-bar').html(html);
  }

  /* ─────────────────────────────────────────
     8. RENDER — Seat grid (A321 layout)
     Columns: A B C | gap | D E G
     6 cols + 1 aisle gap + row number col
  ───────────────────────────────────────── */
  function renderCabin() {
    const COLS_LEFT  = ['A','B','C'];
    const COLS_RIGHT = ['D','E','F'];

    /* Group seats by row */
    const byRow = {};
    state.seats.forEach(function (s) {
      if (!byRow[s.row]) byRow[s.row] = {};
      byRow[s.row][s.col] = s;
    });

    const rows = Object.keys(byRow).map(Number).sort(function (a,b) { return a-b; });
    const EXIT_ROWS = [15, 28];

    /* Column headers: A B C [num] D E G */
    const hdrCols = COLS_LEFT.concat(['num']).concat(COLS_RIGHT);
    const hdrGrid = 'grid-template-columns:' + hdrCols.map(function(c){
      return c === 'num' ? '28px' : '30px';
    }).join(' ');

    $('#sm-col-headers')
      .attr('style', hdrGrid + ';padding:4px 16px;gap:4px;display:grid;')
      .html(
        COLS_LEFT.map(function(c){ return '<div class="sm-col-hdr">' + c + '</div>'; }).join('')
        + '<div class="sm-col-hdr" style="font-size:10px;color:var(--muted);"></div>'
        + COLS_RIGHT.map(function(c){ return '<div class="sm-col-hdr">' + c + '</div>'; }).join('')
      );

    let html = '';
    rows.forEach(function (rowNum) {
      const rowData = byRow[rowNum];
      const isExit  = EXIT_ROWS.includes(rowNum);

      /* Exit row spacer before */
      if (isExit) {
        html += '<div class="sm-row" style="grid-template-columns:' + hdrCols.map(function(c){ return c==='num'?'28px':'30px'; }).join(' ') + ';height:20px;position:relative;">'
          + '<div class="sm-exit-indicator sm-exit-left" style="position:static;width:auto;height:20px;padding:0 6px;border-radius:4px;font-size:10px;">E</div>'
          + '<div></div><div></div>'
          + '<div style="font-size:10px;color:#e53935;text-align:center;line-height:20px;font-weight:700;">←</div>'
          + '<div></div><div></div>'
          + '<div class="sm-exit-indicator sm-exit-right" style="position:static;width:auto;height:20px;padding:0 6px;border-radius:4px;font-size:10px;">E</div>'
          + '</div>';
      }

      /* Seat row */
      const allCols = COLS_LEFT.concat([null]).concat(COLS_RIGHT);
      let rowHtml = '<div class="sm-row" style="grid-template-columns:' + allCols.map(function(c){return c===null?'28px':'30px';}).join(' ') + ';">';

      allCols.forEach(function (col) {
        if (col === null) {
          /* Row number cell */
          rowHtml += '<div class="sm-row-num">' + rowNum + '</div>';
          return;
        }

        const seat = rowData[col];
        if (!seat) {
          rowHtml += '<div class="sm-seat sm-seat--empty"></div>';
          return;
        }

        const typeClass = seatTypeClass(seat);
        const isTaken   = typeClass === 'sm-seat--taken' || typeClass === 'sm-seat--reserved-other';
        const isSelected = isSelectedByCurrent(seat.id);

        let inner = '';
        if (typeClass === 'sm-seat--taken') inner = '×';
        else if (isSelected) inner = '<i class="fa-solid fa-check" style="font-size:10px;"></i>';

        let extraBadge = '';
        if (seat.isExtraLeg && !isTaken) {
          extraBadge = '<div class="sm-xl-badge">XL</div>';
        }

        rowHtml += '<div class="sm-seat ' + typeClass + '"'
          + ' data-seat-id="' + seat.id + '"'
          + ' data-seat-num="' + escAttr(seat.seatNumber) + '"'
          + ' data-row="' + rowNum + '"'
          + ' data-col="' + escAttr(col) + '"'
          + ' data-price="' + (seat.price || 0) + '"'
          + ' data-status="' + escAttr(seat.status) + '"'
          + ' data-class="' + escAttr(seat.class) + '"'
          + (isTaken ? ' title="Ghế không còn trống"' : '')
          + '>'
          + extraBadge
          + inner
          + '</div>';
      });

      rowHtml += '</div>';
      html += rowHtml;
    });

    $('#sm-seat-rows').html(html);
  }

  /* ─────────────────────────────────────────
     9. RENDER — Bottom count / confirm btn
  ───────────────────────────────────────── */
  function updateActionBar() {
    const count = Object.keys(state.selectedSeats).length;
    $('#sm-selected-count').text(count);
    const btn = $('#sm-confirm-btn');
    if (count >= state.totalPax) {
      btn.prop('disabled', false).text('XÁC NHẬN ').append('<i class="fa-solid fa-arrow-right"></i>');
    } else {
      btn.prop('disabled', true);
    }
  }

  /* ─────────────────────────────────────────
     10. FULL RENDER
  ───────────────────────────────────────── */
  function renderAll() {
    $('#sm-loading').hide();
    $('#sm-cabin').show();
    renderLegend();
    renderPaxChips();
    renderCabin();
    updateActionBar();
    updateInfoPanel(null);
  }

  /* ─────────────────────────────────────────
     11. INFO PANEL
  ───────────────────────────────────────── */
  function updateInfoPanel(seat) {
    if (!seat) {
      $('#sm-info-body').html('<p style="font-size:12px;color:var(--muted);text-align:center;padding:16px 0;">Hover vào ghế để xem chi tiết</p>');
      return;
    }

    let classLabel = 'Phổ thông';
    if (seat.dataset.class === 'FIRST') classLabel = 'Hạng Nhất';
    else if (seat.dataset.class === 'BUSINESS') classLabel = 'Thương gia';

    const priceVal    = parseInt(seat.dataset.price) || 0;
    let priceStr = 'Miễn phí';
    if (priceVal > 0) priceStr = '+' + priceVal.toLocaleString('vi-VN') + ' VND';
    else if (priceVal < 0) priceStr = priceVal.toLocaleString('vi-VN') + ' VND';
    const statusLabel = seat.dataset.status === 'AVAILABLE' ? '<span style="color:#16a34a;font-weight:700;">Còn trống</span>' : '<span style="color:#dc2626;">Đã đặt</span>';
    const seatNum     = seat.dataset.seatNum;

    $('#sm-info-body').html(
      '<div class="sm-info-row"><span class="label">Ghế</span><span class="val" style="font-size:18px;color:var(--primary);">' + escHtml(seatNum) + '</span></div>'
      + '<div class="sm-info-row"><span class="label">Hạng</span><span class="val">' + classLabel + '</span></div>'
      + '<div class="sm-info-row"><span class="label">Phí thêm</span><span class="val">' + priceStr + '</span></div>'
      + '<div class="sm-info-row"><span class="label">Trạng thái</span><span class="val">' + statusLabel + '</span></div>'
    );
  }

  /* ─────────────────────────────────────────
     12. TOOLTIP
  ───────────────────────────────────────── */
  function showTooltip(seat, x, y) {
    const priceVal = parseInt(seat.dataset.price) || 0;
    let priceStr = 'Miễn phí';
    if (priceVal > 0) priceStr = '+' + priceVal.toLocaleString('vi-VN') + ' VND';
    else if (priceVal < 0) priceStr = priceVal.toLocaleString('vi-VN') + ' VND';
    const status   = seat.dataset.status;

    let content = '<strong>' + escHtml(seat.dataset.seatNum) + '</strong><br/>';
    if (status === 'AVAILABLE') {
      if (seat.dataset.class === 'FIRST') content += 'Hạng Nhất<br>';
      else if (seat.dataset.class === 'BUSINESS') content += 'Hạng Thương gia<br>';
      else content += 'Hạng Phổ thông<br>';
      content += priceStr;
    } else {
      content += 'Ghế đã được đặt';
    }

    const $tip = $('#sm-tooltip');
    $tip.html(content).css({ left: x + 14, top: y - 40, display: 'block' });
  }

  function hideTooltip() { $('#sm-tooltip').hide(); }

  /* ─────────────────────────────────────────
     13. SEAT CLICK HANDLER
  ───────────────────────────────────────── */
  function onSeatClick(seat) {
    const seatId = parseInt(seat.dataset.seatId);
    const status = seat.dataset.status;

    /* Blocked seats */
    if (status === 'RESERVED' || status === 'BOOKED') return;
    if ($(seat).hasClass('sm-seat--taken')) return;
    if ($(seat).hasClass('sm-seat--empty')) return;

    /* Reserved by other pax in booking */
    if (getReservedByOther(seatId) !== null) return;

    const pax   = state.passengers[state.currentPaxIdx];
    if (!pax) return;

    /* Toggle: if clicking same seat → deselect */
    const current = state.selectedSeats[pax.id];
    if (current && current.seatId === seatId) {
      delete state.selectedSeats[pax.id];
    } else {
      state.selectedSeats[pax.id] = {
        seatId:  seatId,
        label:   seat.dataset.seatNum,
        price:   parseInt(seat.dataset.price) || 0,
        col:     seat.dataset.col,
      };

      /* Auto-advance to next unassigned passenger */
      const nextIdx = findNextUnassigned();
      if (nextIdx !== null) {
        state.currentPaxIdx = nextIdx;
      }
    }

    renderAll();
  }

  function findNextUnassigned() {
    for (let i = 0; i < state.passengers.length; i++) {
      const pax = state.passengers[i];
      if (!state.selectedSeats[pax.id]) return i;
    }
    return null;
  }

  /* ─────────────────────────────────────────
     14. EVENT BINDING
  ───────────────────────────────────────── */
  function bindEvents() {
    /* Seat click — delegated */
    $(document).on('click.seatmap', '.sm-seat:not(.sm-seat--taken):not(.sm-seat--empty):not(.sm-seat--reserved-other)', function () {
      onSeatClick(this);
    });

    /* Seat hover — tooltip */
    $(document).on('mouseenter.seatmap', '.sm-seat:not(.sm-seat--empty)', function (e) {
      showTooltip(this, e.clientX, e.clientY);
      updateInfoPanel(this);
    });

    $(document).on('mousemove.seatmap', '.sm-seat', function (e) {
      $('#sm-tooltip').css({ left: e.clientX + 14, top: e.clientY - 40 });
    });

    $(document).on('mouseleave.seatmap', '.sm-seat', function () {
      hideTooltip();
      updateInfoPanel(null);
    });

    /* Passenger chip click */
    $(document).on('click.seatmap', '.sm-pax-chip', function () {
      const idx = parseInt($(this).data('pax-idx'));
      if (!isNaN(idx)) {
        state.currentPaxIdx = idx;
        renderAll();
      }
    });

    /* Clear seats */
    $(document).on('click.seatmap', '#sm-clear-btn', function (e) {
      e.preventDefault();
      state.selectedSeats = {};
      renderAll();
    });

    /* Guide toggle */
    $(document).on('click.seatmap', '.sm-toggle-guide', function (e) {
      e.preventDefault();
      const $box = $('#sm-guide-box');
      const $arrow = $('#sm-guide-arrow');
      $box.slideToggle(200);
      $arrow.toggleClass('fa-chevron-down fa-chevron-up');
    });

    /* Back button */
    $(document).on('click.seatmap', '#sm-back-btn', function () {
      if (window.BookingSPA) window.BookingSPA.goToStep('shopping-cart');
    });

    /* Confirm button */
    $(document).on('click.seatmap', '#sm-confirm-btn:not(:disabled)', async function () {
      /* Persist selections to sessionStorage */
      const rawData = sessionStorage.getItem('selectedFlightBooking');
      let bookingData = rawData ? JSON.parse(rawData) : {};
      
      bookingData.selectedSeats = state.selectedSeats;
      bookingData.seatSummary   = buildSeatSummary();
      
      const bookingId = bookingData.bookingId;
      const seatIds = Object.values(state.selectedSeats).map(s => parseInt(s.seatId));

      if (bookingId && seatIds.length > 0) {
        try {
          const BASE = (typeof BASE_API_URL !== 'undefined') ? BASE_API_URL : 'http://localhost:3000/api';
          const seatRes = await fetch(`${BASE}/booking/${bookingId}/select-seats`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ seatIds })
          }).then(r => r.json());

          if (!seatRes.success) throw new Error(seatRes.message || 'Lỗi khóa ghế');
        } catch (error) {
          alert('Lỗi khi khóa ghế: ' + error.message);
          return; // Dừng lại không chuyển trang nếu khóa ghế thất bại
        }
      }

      sessionStorage.setItem('selectedFlightBooking', JSON.stringify(bookingData));

      if (window.BookingSPA) window.BookingSPA.goToStep('shopping-cart');
    });
  }

  function buildSeatSummary() {
    return state.passengers.map(function (pax) {
      const sel = state.selectedSeats[pax.id];
      return {
        passengerId:   pax.id,
        passengerName: pax.name,
        seatId:        sel ? sel.seatId : null,
        seatLabel:     sel ? sel.label  : null,
        price:         sel ? sel.price  : 0,
      };
    });
  }

  /* ─────────────────────────────────────────
     15. CLEANUP (called by BookingSPA on step change)
  ───────────────────────────────────────── */
  window.destroySeatMap = function () {
    $(document).off('.seatmap');
  };

  /* ─────────────────────────────────────────
     16. UTILS
  ───────────────────────────────────────── */
  function escHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function escAttr(str) { return escHtml(str); }

  /* ─────────────────────────────────────────
     17. BOOTSTRAP
  ───────────────────────────────────────── */
  readBookingState();
  bindEvents();
  fetchSeats();

  console.log('[SeatMap] Initialized. flightId =', state.flightId);
}