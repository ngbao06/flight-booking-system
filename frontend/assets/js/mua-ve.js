/**
 * mua-ve.js  —  Logic trang Mua Vé
 * * Có thể được gọi từ:
 * 1. Mua-ve.html độc lập (DOMContentLoaded)
 * 2. Loaded vào index.html via AJAX (initMuaVe())
 * * Data tìm kiếm từ:
 * - window.flightSearchData (khi load vào index.html)
 * - sessionStorage (khi vào trang mua-ve.html trực tiếp)
 */

(function () {
  'use strict';

  const BASE = (typeof BASE_API_URL !== 'undefined') ? BASE_API_URL : 'http://localhost:3000/api';

  /* Helpers */
  async function apiFetch(url) {
    try {
      const r = await fetch(url, { credentials: 'include' });
      if (!r.ok) return null;
      return await r.json();
    } catch { return null; }
  }

  function toArr(payload) {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload.data)) return payload.data;
    if (payload.data && typeof payload.data === 'object') return [payload.data];
    return [];
  }

  function fmtVND(n) {
    if (n == null) return '—';
    return Number(n).toLocaleString('vi-VN') + '₫';
  }

  function fmtTime(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  }

  function fmtDateVN(str) {
    if (!str) return '—';
    const [y, m, d] = str.split('-');
    return `${d}/${m}/${y}`;
  }

  function calcDuration(dep, arr) {
    if (!dep || !arr) return null;
    const mins = Math.round((new Date(arr) - new Date(dep)) / 60000);
    if (mins <= 0) return null;
    return `${Math.floor(mins / 60)}h ${String(mins % 60).padStart(2, '0')}m`;
  }

  /* State */
  let airports = [];
  let fromAirport = null;
  let toAirport = null;
  let allFlights = [];
  let currentSort = 'price';

  const DEFAULT_AIRPORTS = [
    { code: 'HAN', name: 'Sân bay Nội Bài', city: 'Hà Nội, Việt Nam' },
    { code: 'SGN', name: 'Sân bay Tân Sơn Nhất', city: 'TP. Hồ Chí Minh, Việt Nam' },
    { code: 'DAD', name: 'Sân bay Đà Nẵng', city: 'Đà Nẵng, Việt Nam' },
  ];

  function normalizeAirport(raw) {
    return {
      id: raw.id ?? raw.airportId ?? raw.airport_id ?? null,
      code: String(raw.code ?? raw.iataCode ?? raw.iata_code ?? '').toUpperCase(),
      name: raw.name ?? raw.airportName ?? raw.airport_name ?? '',
      city: raw.city ?? raw.region ?? ''
    };
  }

  function showToast(msg, type = 'success') {
    const area = document.getElementById('toast-area');
    if (!area) return;
    const el = document.createElement('div');
    el.className = `toast-msg ${type}`;
    el.innerHTML = `<span class="t-icon">${type === 'success' ? '✅' : '⚠️'}</span><span>${msg}</span>`;
    area.appendChild(el);
    setTimeout(() => el.remove(), 3600);
  }

  function renderDropdown($dd, query) {
    if (!$dd || !$dd.length || !airports || airports.length === 0) {
      console.warn('renderDropdown: $dd or airports missing', { $dd: $dd?.length, airports: airports?.length });
      return;
    }

    const q = (query || '').trim().toLowerCase();
    const filtered = q
      ? airports.filter(a =>
          a.code.toLowerCase().includes(q) ||
          a.name.toLowerCase().includes(q) ||
          a.city.toLowerCase().includes(q))
      : airports;

    let html = `<div class="airport-search-wrap">
        <input class="airport-search-input" type="text" placeholder="Tìm sân bay..." value="${query}"/>
      </div><div class="airport-list">`;

    if (!filtered.length) {
      html += `<div class="airport-item-empty">Không tìm thấy sân bay phù hợp</div>`;
    } else {
      filtered.forEach(a => {
        html += `<div class="airport-item" data-code="${a.code}">
            <div class="ai-code">${a.code}</div>
            <div class="ai-info">
              <div class="ai-name">${a.name}</div>
              <div class="ai-city">${a.city}</div>
            </div>
          </div>`;
      });
    }
    html += '</div>';
    $dd.html(html);
  }

  function updateAirportDisplay(which, airport) {
    if (!airport) {
      $(`#val-${which}`).text(which === 'from' ? 'Chọn điểm đi' : 'Chọn điểm đến').addClass('placeholder-text');
      $(`#sub-${which}`).text('Nhấn để chọn sân bay');
      $(`#input-${which}`).val('');
      return;
    }

    $(`#val-${which}`).text(airport.code).removeClass('placeholder-text');
    $(`#sub-${which}`).text(airport.city || airport.name);
    $(`#input-${which}`).val(airport.code);
  }

  function closeAllDropdowns() {
    $('#mv-search-panel .airport-field').removeClass('open');
    $('#mv-search-panel .airport-dropdown').removeClass('show');
  }

  /* Load airports từ API */
  async function loadAirports() {
    try {
      const payload = await apiFetch(BASE + `/airports`);
      let apiAirports = toArr(payload)
        .map(normalizeAirport)
        .filter((a) => a.code);

      if (apiAirports.length) {
        airports = apiAirports;
      } else {
        airports = DEFAULT_AIRPORTS;
      }

      if (!fromAirport || !fromAirport.code) {
        fromAirport = airports[0] || null;
      }

      updateAirportDisplay('from', fromAirport);
      updateAirportDisplay('to', toAirport);
    } catch (error) {
      console.warn('Failed to load airports, using defaults:', error);
      airports = DEFAULT_AIRPORTS;
      fromAirport = airports[0] || null;
      updateAirportDisplay('from', fromAirport);
      updateAirportDisplay('to', toAirport);
    }
  }

  /* Airport field click: Bắt sự kiện dựa vào ID Wrapper để tránh xung đột với app.js */
  function attachAirportFieldClick() {
    $(document).off('click.mva', '#mv-search-panel .airport-field').on('click.mva', '#mv-search-panel .airport-field', function(e) {
      const $field = $(this);
      const id = $field.attr('id');
      const ddId = id === 'field-from' ? 'dd-from' : 'dd-to';
      const $dd = $(`#${ddId}`);
      const isOpen = $dd.hasClass('show');

      closeAllDropdowns();
      if (!isOpen) {
        $field.addClass('open');
        renderDropdown($dd, '');
        $dd.addClass('show');
        $dd.find('.airport-search-input').focus();
      }
      e.stopPropagation();
    });
  }

  /* Airport search input */
  function attachAirportSearchInput() {
    $(document).off('input.mva-airport-search', '#mv-search-panel .airport-search-input').on('input.mva-airport-search', '#mv-search-panel .airport-search-input', function() {
      const $dd = $(this).closest('.airport-dropdown');
      renderDropdown($dd, $(this).val());
    });
  }

  /* Airport item select */
  function attachAirportItemSelect() {
    $(document).off('click.mva-airport-item', '#mv-search-panel .airport-item').on('click.mva-airport-item', '#mv-search-panel .airport-item', function(e) {
      e.stopPropagation();
      const code = $(this).data('code');
      const airport = airports.find(a => a.code === code);
      if (!airport) return;

      const $dd = $(this).closest('.airport-dropdown');
      if ($dd.attr('id') === 'dd-from') {
        fromAirport = airport;
        updateAirportDisplay('from', airport);
      } else {
        toAirport = airport;
        updateAirportDisplay('to', airport);
        $('#field-to').removeClass('is-invalid-field');
      }
      closeAllDropdowns();
    });
  }

  /* Swap button */
  function attachSwapButton() {
    $(document).off('click.mva-swap', '#mv-search-panel #btn-swap').on('click.mva-swap', '#mv-search-panel #btn-swap', function() {
      if (!toAirport) return;
      [fromAirport, toAirport] = [toAirport, fromAirport];
      updateAirportDisplay('from', fromAirport);
      updateAirportDisplay('to', toAirport);
      $(this).css('transition','transform .4s').css('transform','rotate(180deg)');
      setTimeout(() => $(this).css('transform', ''), 400);
    });
  }

  /* Search flights */
  function attachSearchButton() {
    $(document).off('click.mva-search', '#mv-search-panel #btn-search-flight').on('click.mva-search', '#mv-search-panel #btn-search-flight', async function() {
      const from = $('#input-from').val();
      const to = $('#input-to').val();
      const date = $('#dep-date').val();

      const missing = [];
      if (!to) {
        $('#field-to').addClass('is-invalid-field');
        missing.push('điểm đến');
      }
      if (!date) {
        $('#dep-date').addClass('is-invalid-field');
        missing.push('ngày đi');
      }
      if (missing.length) {
        showToast(`Vui lòng nhập ${missing.join(' và ')}.`, 'error');
        return;
      }

      const $btn = $(this);
      $btn.prop('disabled', true);
      const originalText = $btn.html();
      $btn.html('<i class="fa-solid fa-spinner fa-spin me-2"></i> Đang tìm…');

      try {
        const fromAP = airports.find(a => a.code === from) || null;
        const toAP = airports.find(a => a.code === to) || null;

        const params = new URLSearchParams();
        if (fromAP && fromAP.id) params.append('departureAirportId', fromAP.id);
        if (toAP && toAP.id) params.append('arrivalAirportId', toAP.id);
        
        const apiUrl = `${BASE}/flights${params.toString() ? '?' + params.toString() : ''}`;
        const response = await apiFetch(apiUrl);
        
        let flights = toArr(response) || [];

        if (!flights.length && (!params.toString())) {
          const allResponse = await apiFetch(`${BASE}/flights`);
          flights = toArr(allResponse) || [];
        }

        flights = flights.filter(f => {
          const depTime = f.departureTime || f.departure_time || '';
          const depDateStr = String(depTime).slice(0, 10);
          return depDateStr === date;
        });

        if (fromAP && fromAP.id && toAP && toAP.id) {
          flights = flights.filter(f => {
            const depAirportId = f.departureAirportId || f.departure_airport_id;
            const arrAirportId = f.arrivalAirportId || f.arrival_airport_id;
            return Number(depAirportId) === Number(fromAP.id) && 
                   Number(arrAirportId) === Number(toAP.id);
          });
        }

        allFlights = flights;
        const resultsArea = document.getElementById('mv-results-area');
        resultsArea.style.display = 'block';
        document.getElementById('mv-initial-hint').style.display = 'none';
        document.getElementById('mv-results-title').textContent = 
          `Chuyến bay ${from} → ${to}`;
        document.getElementById('mv-results-count').textContent =
          flights.length 
            ? `Tìm thấy ${flights.length} chuyến bay · Ngày ${fmtDateVN(date)}`
            : '';

        // Đổi từ renderFlights sang renderVNAirlinesCards
        renderVNAirlinesCards(sortFlights(flights, currentSort));
      } catch (error) {
        console.error('Search flights error:', error);
        showToast('Lỗi khi tìm kiếm. Vui lòng thử lại.', 'error');
      } finally {
        $btn.prop('disabled', false);
        $btn.html(originalText);
      }
    });
  }

  /* Sort flights */
  function sortFlights(flights, mode) {
    const arr = [...flights];
    if (mode === 'price') {
      return arr.sort((a, b) =>
        (a.basePrice || a.economyPrice || a.price || 0) -
        (b.basePrice || b.economyPrice || b.price || 0));
    }
    if (mode === 'duration') {
      return arr.sort((a, b) => {
        const da = (new Date(a.arrivalTime || a.arrival_time)) - (new Date(a.departureTime || a.departure_time));
        const db = (new Date(b.arrivalTime || b.arrival_time)) - (new Date(b.departureTime || b.departure_time));
        return da - db;
      });
    }
    if (mode === 'departure') {
      return arr.sort((a, b) =>
        new Date(a.departureTime || a.departure_time) -
        new Date(b.departureTime || b.departure_time));
    }
    return arr;
  }

  /* API Helper cho phần Render VNA Card */
  async function fetchFlightPricing(flightId) {
      try {
          const response = await apiFetch(`${BASE}/seats?flightId=${flightId}`);
          const seats = toArr(response);

          console.log(seats);

          const pricing = {
              ECONOMY: { minPrice: Infinity, available: 0 },
              BUSINESS: { minPrice: Infinity, available: 0 },
              FIRST: { minPrice: Infinity, available: 0 }
          };

          seats.forEach(seat => {
              if (seat.status !== 'AVAILABLE') return; 

              let seatClass = "ECONOMY";
              if (seat.class === "BUSINESS") seatClass = "BUSINESS";
              if (seat.class === "FIRST") seatClass = "FIRST";

              pricing[seatClass].available++;
              if (seat.price < pricing[seatClass].minPrice) {
                  pricing[seatClass].minPrice = seat.price;
              }
          });

          for (const key in pricing) {
              if (pricing[key].minPrice === Infinity) pricing[key].minPrice = null;
          }

          return pricing;
      } catch (error) {
          console.error(`Lỗi khi lấy giá cho chuyến bay ${flightId}:`, error);
          return null;
      }
  }

  /* Render flights VNA Style */
  async function renderVNAirlinesCards(flights) {
      const listContainer = document.getElementById('mv-flight-list');
      
      if (!flights.length) {
          listContainer.innerHTML = `
            <div class="state-box">
              <div class="state-icon">🛫</div>
              <div class="state-title">Không tìm thấy chuyến bay</div>
              <div class="state-sub">Thử thay đổi ngày bay hoặc điểm đến khác.</div>
            </div>`;
          return;
      }

      listContainer.innerHTML = `<div class="text-center p-5"><i class="fa-solid fa-spinner fa-spin fs-2"></i> Đang tải giá vé...</div>`;
      let html = '';

      for (const flight of flights) {
          const depTime = flight.departure_time || flight.departureTime;
          const arrTime = flight.arrival_time || flight.arrivalTime;
          const duration = calcDuration(depTime, arrTime);

          const depId = flight.departure_airport_id || flight.departureAirportId;
          const arrId = flight.arrival_airport_id || flight.arrivalAirportId;

          const depAP = airports.find(a => Number(a.id) === Number(depId));
          const arrAP = airports.find(a => Number(a.id) === Number(arrId));
          
          const depCode = depAP ? depAP.code : '';
          const arrCode = arrAP ? arrAP.code : '';

          const pricing = await fetchFlightPricing(flight.id);
          console.log(pricing);
          if (!pricing) continue;

          html += `
          <div class="vna-card mb-4" data-flight-id="${flight.id}">
              <div class="vna-info-sec">
                  <div class="row w-100 align-items-center">
                      <div class="col-md-5 vna-route-col">
                          <div class="d-flex justify-content-between align-items-center mb-1">
                              <span class="vna-time">${fmtTime(depTime)}</span>
                              <div class="vna-line">Bay thẳng</div>
                              <span class="vna-time">${fmtTime(arrTime)}</span>
                          </div>
                          <div class="d-flex justify-content-between">
                              <div class="text-start">
                                  <div class="vna-code">${depCode}</div>
                              </div>
                              <div class="text-end">
                                  <div class="vna-code">${arrCode}</div>
                              </div>
                          </div>
                      </div>

                      <div class="col-md-7 vna-detail-col">
                          <div class="vna-text-sm"><i class="fa-regular fa-clock me-1"></i> Thời gian bay: ${duration}</div>
                          <div class="vna-text-sm mt-1">
                              <i class="fa-solid fa-plane-departure me-1"></i> ${flight.flight_number || flight.flightNumber} Khai thác bởi BAirlines <i class="fa-solid fa-leaf text-warning ms-1"></i>
                          </div>
                          <a href="#" class="vna-link mt-2 d-inline-block">Chi tiết hành trình <i class="fa-solid fa-arrow-up-right-from-square" style="font-size: 10px;"></i></a>
                      </div>
                  </div>
              </div>

              <div class="vna-price-sec eco" onclick="mvSelectFlight(${flight.id}, 'ECONOMY')">
                ${pricing.ECONOMY.available > 0 && pricing.ECONOMY.available <= 10 ? `<div class="vna-badge">${pricing.ECONOMY.available} ghế còn lại</div>` : ''}
                <i class="fa-solid fa-tag vna-tag"></i>
                <div class="vna-class-name">PHỔ THÔNG</div>
                ${pricing.ECONOMY.minPrice ? `
                <div class="vna-price-lbl">từ</div>
                <div class="vna-price-val">${fmtVND(pricing.ECONOMY.minPrice)}</div>
                <div class="vna-currency">VND</div>
                  ` : `<div class="vna-price-val mt-2">Hết chỗ</div>`}
                  <i class="fa-solid fa-chevron-down mt-auto mb-2"></i>
              </div>

              <div class="vna-price-sec prem" onclick="mvSelectFlight(${flight.id}, 'BUSINESS')">
                  <i class="fa-solid fa-tag vna-tag"></i>
                  <div class="vna-class-name">THƯƠNG GIA</div>
                  ${pricing.BUSINESS.minPrice ? `
                      <div class="vna-price-lbl">từ</div>
                      <div class="vna-price-val">${fmtVND(pricing.BUSINESS.minPrice)}</div>
                      <div class="vna-currency">VND</div>
                  ` : `<div class="vna-price-val mt-2">Hết chỗ</div>`}
                  <i class="fa-solid fa-chevron-down mt-auto mb-2"></i>
              </div>

              <div class="vna-price-sec biz" onclick="mvSelectFlight(${flight.id}, 'BUSINESS')">
                  ${pricing.FIRST.available > 0 && pricing.FIRST.available <= 5 ? `<div class="vna-badge bg-teal">${pricing.FIRST.available} ghế còn lại</div>` : ''}
                  <i class="fa-solid fa-tag vna-tag"></i>
                  <div class="vna-class-name">HẠNG NHẤT</div>
                  ${pricing.FIRST.minPrice ? `
                      <div class="vna-price-lbl">từ</div>
                      <div class="vna-price-val">${fmtVND(pricing.FIRST.minPrice)}</div>
                      <div class="vna-currency">VND</div>
                  ` : `<div class="vna-price-val mt-2">Hết chỗ</div>`}
                  <i class="fa-solid fa-chevron-down mt-auto mb-2"></i>
              </div>
          </div>
          `;
      }

      listContainer.innerHTML = html;
  }

  /* Đã Comment Hàm render cũ không dùng nữa */
  /*
  function renderFlights(flights) {
    // Logic cũ ...
  }
  */

  /* Public: select flight */
  window.mvSelectFlight = function (flightId, classType) {
    const f = allFlights.find(x => Number(x.id) === Number(flightId));
    const num = f?.flightNumber || f?.flight_number || flightId;
    showToast(`Đã chọn chuyến ${num} - Hạng: ${classType}`, 'success');
    // TODO: chuyển sang trang thanh toán / đặt chỗ
  };

  /* Attach sort button listeners */
  function attachSortButtons() {
    $(document).off('click.mva-sort', '#mv-search-panel .sort-btn').on('click.mva-sort', '#mv-search-panel .sort-btn', function() {
      document.querySelectorAll('#mv-search-panel .sort-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      currentSort = this.dataset.sort;
      if (allFlights.length) {
        renderVNAirlinesCards(sortFlights(allFlights, currentSort));
      }
    });
  }

  /* Initialize mua-ve page */
  window.initMuaVe = async function() {
    await loadAirports();

    const today = new Date().toISOString().slice(0, 10);
    const depEl = document.getElementById('dep-date');
    if (depEl) {
      depEl.min = today;
      if (!depEl.value) depEl.value = today;
    }

    attachAirportFieldClick();
    attachAirportSearchInput();
    attachAirportItemSelect();
    attachSwapButton();
    attachSearchButton();
    attachSortButtons();

    $(document).off('click.mva-dropdown').on('click.mva-dropdown', closeAllDropdowns);
    $('#mv-search-panel .airport-dropdown').off('click.mva-dd').on('click.mva-dd', e => e.stopPropagation());

    if (window.flightSearchData) {
      const { from, to, date, flights } = window.flightSearchData;

      const apFrom = airports.find(a => a.code === from);
      const apTo = airports.find(a => a.code === to);

      if (apFrom) { fromAirport = apFrom; updateAirportDisplay('from', apFrom); }
      if (apTo) { toAirport = apTo; updateAirportDisplay('to', apTo); }
      if (date && depEl) { depEl.value = date; }

      if (flights && flights.length) {
        allFlights = flights;
        const resultsArea = document.getElementById('mv-results-area');
        resultsArea.style.display = 'block';
        document.getElementById('mv-initial-hint').style.display = 'none';
        document.getElementById('mv-results-title').textContent = 
          `Chuyến bay ${from} → ${to}`;
        document.getElementById('mv-results-count').textContent =
          flights.length 
            ? `Tìm thấy ${flights.length} chuyến bay · Ngày ${fmtDateVN(date)}`
            : '';

        renderVNAirlinesCards(sortFlights(flights, currentSort));
      }

      window.flightSearchData = null;
    } else {
      let sessionData = null;
      try {
        const stored = sessionStorage.getItem('flightSearchResults');
        if (stored) {
          sessionData = JSON.parse(stored);
        }
      } catch (e) {
        console.warn('Failed to parse sessionStorage:', e);
      }

      if (sessionData) {
        const { from, to, date, flights } = sessionData;

        const apFrom = airports.find(a => a.code === from);
        const apTo = airports.find(a => a.code === to);

        if (apFrom) { fromAirport = apFrom; updateAirportDisplay('from', apFrom); }
        if (apTo) { toAirport = apTo; updateAirportDisplay('to', apTo); }
        if (date && depEl) { depEl.value = date; }

        if (flights && flights.length) {
          allFlights = flights;
          const resultsArea = document.getElementById('mv-results-area');
          resultsArea.style.display = 'block';
          document.getElementById('mv-initial-hint').style.display = 'none';
          document.getElementById('mv-results-title').textContent = 
            `Chuyến bay ${from} → ${to}`;
          document.getElementById('mv-results-count').textContent =
            flights.length 
              ? `Tìm thấy ${flights.length} chuyến bay · Ngày ${fmtDateVN(date)}`
              : '';

          renderVNAirlinesCards(sortFlights(flights, currentSort));
        }

        sessionStorage.removeItem('flightSearchResults');
      }
    }
  };

  /* Đoạn gọi tự động DOMContentLoaded được comment lại tránh chạy đè ở trang chủ */
  /*
  document.addEventListener('DOMContentLoaded', async function () {
    if (typeof initMuaVe === 'function') {
      initMuaVe();
    }
  });
  */

})();