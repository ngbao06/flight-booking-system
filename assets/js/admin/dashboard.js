/* ═══════════════════════════════════════════════════════
   dashboard.js  –  AdminPages.dashboard module
   Yêu cầu: window.AdminAPI (request, escape, showMessage)
═══════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ─── state ─── */
  let _data      = null;
  let _airlinesPage = 1;
  let _destPage     = 1;

  const PAGE_SIZE_AIRLINES = 5;
  const PAGE_SIZE_DEST     = 5;

  /* ─── date helpers ─── */
  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  function daysAgo(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().slice(0, 10);
  }

  function buildQuery(from, to) {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to)   params.set('to',   to);
    return params.toString() ? '?' + params.toString() : '';
  }

  /* ─── number formatters ─── */
  function fmtCurrency(val) {
    const n = parseFloat(val) || 0;
    if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000)     return '$' + (n / 1_000).toFixed(1) + 'K';
    return '$' + n.toLocaleString();
  }

  function fmtPct(val) {
    return (parseFloat(val) || 0).toFixed(2) + '%';
  }

  function rankClass(i) {
    return ['r1','r2','r3'][i] || 'rn';
  }

  /* ─── KPI cards ─── */
  function renderKPI(summary) {
    if (!summary) return;
    const f = summary.flights  || {};
    const u = summary.users    || {};

    const cards = [
      {
        key: 'revenue', label: 'Tổng doanh thu', icon: 'fa-dollar-sign',
        value: fmtCurrency(summary.totalRevenue),
        sub: summary.successfulPayments + ' giao dịch thành công',
        badge: { cls: 'up', icon: 'fa-arrow-up', text: 'Doanh thu' },
      },
      {
        key: 'payments', label: 'Giao dịch', icon: 'fa-credit-card',
        value: (summary.successfulPayments || 0).toLocaleString(),
        sub: 'Thanh toán thành công',
        badge: null,
      },
      {
        key: 'flights', label: 'Chuyến bay', icon: 'fa-plane',
        value: (f.totalFlights || 0).toLocaleString(),
        sub: 'Delay ' + fmtPct(f.delayRate) + '  ·  Hủy ' + fmtPct(f.cancelRate),
        badge: f.delayedFlights > 0
          ? { cls: 'down', icon: 'fa-triangle-exclamation', text: f.delayedFlights + ' delay' }
          : { cls: 'up', icon: 'fa-check', text: 'Đúng giờ' },
      },
      {
        key: 'users', label: 'Người dùng', icon: 'fa-users',
        value: (u.totalRegisteredUsers || 0).toLocaleString(),
        sub: 'Loyalty ' + fmtPct(u.loyaltyRate) + '  (' + (u.loyaltyUsers || 0) + ' thành viên)',
        badge: { cls: 'neutral', icon: 'fa-star', text: u.loyaltyUsers + ' loyalty' },
      },
    ];

    const html = cards.map((c, i) => {
      const badgeHtml = c.badge
        ? '<span class="db-kpi-badge ' + c.badge.cls + '"><i class="fa-solid ' + c.badge.icon + '"></i>' + window.AdminAPI.escape(c.badge.text) + '</span>'
        : '';
      return `
        <div class="db-kpi-card c-${c.key}" style="animation-delay:${i * 80}ms">
          <div class="db-kpi-top">
            <div class="db-kpi-label">${window.AdminAPI.escape(c.label)}</div>
            <div class="db-kpi-icon c-${c.key}"><i class="fa-solid ${c.icon}"></i></div>
          </div>
          <div class="db-kpi-value">${c.value}</div>
          <div class="db-kpi-sub">${badgeHtml}<span>${window.AdminAPI.escape(c.sub)}</span></div>
        </div>`;
    }).join('');

    $('#db-kpi-grid').html(html);
  }

  /* ─── flight stats ─── */
  function renderFlightStats(f) {
    if (!f) return;
    const total = f.totalFlights || 1;

    const items = [
      {
        label: 'Tổng chuyến bay', icon: 'fa-plane fa-primary',
        val: f.totalFlights, pct: 100,
        color: 'linear-gradient(90deg,var(--primary),var(--primary-hover))',
      },
      {
        label: 'Chuyến bị delay', icon: 'fa-clock',
        val: f.delayedFlights, pct: f.delayRate,
        color: 'linear-gradient(90deg,#f59e0b,#fbbf24)',
        rate: fmtPct(f.delayRate),
      },
      {
        label: 'Chuyến bị hủy', icon: 'fa-ban',
        val: f.canceledFlights, pct: f.cancelRate,
        color: 'linear-gradient(90deg,#e05252,#f87171)',
        rate: fmtPct(f.cancelRate),
      },
      {
        label: 'Chuyến đúng giờ', icon: 'fa-circle-check',
        val: f.totalFlights - (f.delayedFlights || 0) - (f.canceledFlights || 0),
        pct: 100 - (f.delayRate || 0) - (f.cancelRate || 0),
        color: 'linear-gradient(90deg,#0d9e6e,#34d399)',
        rate: fmtPct(100 - (f.delayRate || 0) - (f.cancelRate || 0)),
      },
    ];

    const html = '<div class="db-stat-rows">' + items.map(item => `
      <div class="db-stat-item">
        <div class="db-stat-meta">
          <span class="db-stat-name"><i class="fa-solid ${item.icon}" style="color:var(--primary);"></i>${window.AdminAPI.escape(item.label)}</span>
          <span class="db-stat-val">${item.val ?? 0}${item.rate ? ' <span class="db-stat-rate">(' + item.rate + ')</span>' : ''}</span>
        </div>
        <div class="db-bar-track">
          <div class="db-bar-fill" style="width:0%;background:${item.color}" data-w="${Math.min(100, Math.max(0, item.pct || 0)).toFixed(1)}"></div>
        </div>
      </div>`).join('') + '</div>';

    $('#db-flight-stats').html(html);

    // animate bars after render
    setTimeout(() => {
      $('#db-flight-stats .db-bar-fill').each(function () {
        $(this).css('width', $(this).data('w') + '%');
      });
    }, 60);
  }

  /* ─── user stats / loyalty donut ─── */
  function renderUserStats(u) {
    if (!u) return;
    const total   = u.totalRegisteredUsers || 0;
    const loyalty = u.loyaltyUsers || 0;
    const regular = total - loyalty;
    const rate    = parseFloat(u.loyaltyRate) || 0;

    // SVG donut
    const r = 52, cx = 60, cy = 60;
    const circ = 2 * Math.PI * r;
    const loyaltyArc = circ * (rate / 100);
    const regularArc = circ - loyaltyArc;

    const donut = `
      <svg class="db-donut-svg" width="120" height="120" viewBox="0 0 120 120">
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#e0f3f8" stroke-width="13"/>
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none"
          stroke="url(#dg1)" stroke-width="13"
          stroke-dasharray="${loyaltyArc} ${regularArc}"
          stroke-dashoffset="${circ * 0.25}"
          stroke-linecap="round"/>
        <defs>
          <linearGradient id="dg1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#006885"/>
            <stop offset="100%" stop-color="#0d9e6e"/>
          </linearGradient>
        </defs>
        <text x="${cx}" y="${cy - 6}" text-anchor="middle" font-size="14" font-weight="800" fill="#1a2d35">${rate.toFixed(1)}%</text>
        <text x="${cx}" y="${cy + 10}" text-anchor="middle" font-size="9" fill="#6b8a96">loyalty</text>
      </svg>`;

    const legend = `
      <div class="db-donut-legend">
        <div class="db-donut-leg-item">
          <div class="db-donut-dot" style="background:linear-gradient(135deg,#006885,#0d9e6e)"></div>
          <span>Thành viên Loyalty</span>
          <span class="db-donut-leg-val">${loyalty.toLocaleString()}</span>
        </div>
        <div class="db-donut-leg-item">
          <div class="db-donut-dot" style="background:#e0f3f8"></div>
          <span>Thành viên thường</span>
          <span class="db-donut-leg-val">${regular.toLocaleString()}</span>
        </div>
        <div class="db-donut-leg-item" style="border-top:1px solid var(--border);padding-top:8px;margin-top:2px;">
          <div class="db-donut-dot" style="background:#1a2d35"></div>
          <span>Tổng người dùng</span>
          <span class="db-donut-leg-val">${total.toLocaleString()}</span>
        </div>
      </div>`;

    $('#db-user-stats').html('<div class="db-donut-wrap">' + donut + legend + '</div>');
  }

  /* ─── airlines table ─── */
  function renderAirlines(airlines, pagination, totalRevenue) {
    const maxRev = Math.max(...(airlines.map(a => parseFloat(a.revenue) || 0)), 1);

    const rows = airlines.map((a, i) => {
      const rev   = parseFloat(a.revenue) || 0;
      const pct   = ((rev / (totalRevenue || 1)) * 100).toFixed(1);
      const barW  = ((rev / maxRev) * 100).toFixed(1);
      const rank  = (_airlinesPage - 1) * PAGE_SIZE_AIRLINES + i;
      return `<tr style="animation-delay:${i * 50}ms">
        <td><span class="db-rank ${rankClass(rank)}">${rank + 1}</span></td>
        <td>
          <span class="db-airline-code">${window.AdminAPI.escape(a.airlineCode || '')}</span>
          ${window.AdminAPI.escape(a.airlineName || '')}
        </td>
        <td>${a.totalFlights || 0}</td>
        <td>${a.successfulPayments || 0}</td>
        <td class="db-revenue-text">${fmtCurrency(a.revenue)}</td>
        <td>
          <div class="db-mini-bar">
            <div class="db-mini-track"><div class="db-mini-fill" style="width:${barW}%"></div></div>
            <span class="db-mini-pct">${pct}%</span>
          </div>
        </td>
      </tr>`;
    }).join('');

    $('#db-airlines-body').html(rows || '<tr><td colspan="6" class="db-loading-cell">Không có dữ liệu</td></tr>');

    if (pagination) {
      const { currentPage, totalPages } = pagination;
      $('#db-airlines-nav').html(`
        <button class="db-nav-btn" id="db-airlines-prev" ${currentPage <= 1 ? 'disabled' : ''}>
          <i class="fa-solid fa-chevron-left"></i>
        </button>
        <span class="db-nav-info">${currentPage}/${totalPages}</span>
        <button class="db-nav-btn" id="db-airlines-next" ${currentPage >= totalPages ? 'disabled' : ''}>
          <i class="fa-solid fa-chevron-right"></i>
        </button>`);
    }
  }

  /* ─── destinations table ─── */
  function renderDestinations(destinations, pagination) {
    const maxRev = Math.max(...(destinations.map(d => parseFloat(d.revenue) || 0)), 1);

    const regionColors = {
      NORTHERN: '#3b82f6', CENTRAL: '#f59e0b', SOUTHERN: '#0d9e6e',
    };

    const rows = destinations.map((d, i) => {
      const rank  = (_destPage - 1) * PAGE_SIZE_DEST + i;
      return `<tr style="animation-delay:${i * 50}ms">
        <td><span class="db-rank ${rankClass(rank)}">${rank + 1}</span></td>
        <td>
          <span class="db-iata">${window.AdminAPI.escape(d.iataCode || '')}</span>
          <div style="display:inline;">
            <span style="font-weight:600;">${window.AdminAPI.escape(d.city || '')}</span>
            <br>
            <span style="font-size:11px;color:var(--muted);">${window.AdminAPI.escape(d.airportName || '')}</span>
          </div>
        </td>
        <td>${d.totalFlights || 0}</td>
        <td>${d.successfulBookings || 0}</td>
        <td class="db-revenue-text">${fmtCurrency(d.revenue)}</td>
      </tr>`;
    }).join('');

    $('#db-dest-body').html(rows || '<tr><td colspan="5" class="db-loading-cell">Không có dữ liệu</td></tr>');

    if (pagination) {
      const { currentPage, totalPages } = pagination;
      $('#db-dest-nav').html(`
        <button class="db-nav-btn" id="db-dest-prev" ${currentPage <= 1 ? 'disabled' : ''}>
          <i class="fa-solid fa-chevron-left"></i>
        </button>
        <span class="db-nav-info">${currentPage}/${totalPages}</span>
        <button class="db-nav-btn" id="db-dest-next" ${currentPage >= totalPages ? 'disabled' : ''}>
          <i class="fa-solid fa-chevron-right"></i>
        </button>`);
    }
  }

  /* ─── full render from _data ─── */
  function renderAll() {
    if (!_data) return;
    const { summary, topAirlines, topDestinations } = _data.data;
    const { pagination } = _data;

    renderKPI(summary);
    renderFlightStats(summary.flights);
    renderUserStats(summary.users);
    renderAirlines(topAirlines, pagination.topAirlines, summary.totalRevenue);
    renderDestinations(topDestinations, pagination.topDestinations);
  }

  /* ─── fetch ─── */
  async function fetchDashboard(from, to, airlinesPage, destPage) {
    airlinesPage = airlinesPage || 1;
    destPage     = destPage     || 1;

    let url = '/api/reports/dashboard?airlinePage=' + airlinesPage
            + '&destPage=' + destPage
            + '&airlineLimit=' + PAGE_SIZE_AIRLINES
            + '&destLimit=' + PAGE_SIZE_DEST;

    if (from) url += '&from=' + from;
    if (to)   url += '&to='   + to;

    try {
      _data = await window.AdminAPI.request(url, { method: 'GET' });
      _airlinesPage = airlinesPage;
      _destPage     = destPage;
      renderAll();
    } catch (e) {
      window.AdminAPI.showMessage('#dashboard-alert', 'danger', e.message || 'Không tải được dữ liệu.');
      // show empty states
      $('#db-kpi-grid').html('<div style="grid-column:1/-1;text-align:center;color:var(--muted);padding:20px;">Không có dữ liệu</div>');
      $('#db-flight-stats, #db-user-stats, #db-airlines-body, #db-dest-body').html('');
    }
  }

  /* ─── get current filter values ─── */
  function getFilter() {
    return {
      from: $('#db-from').val() || null,
      to:   $('#db-to').val()   || null,
    };
  }

  /* ─── bind events ─── */
  function bind() {
    // Quick range buttons
    $(document).on('click.dashboard', '.db-quick-btn', function () {
      $('.db-quick-btn').removeClass('active');
      $(this).addClass('active');

      const range = $(this).data('range');
      const t = today();
      if (range === 'today') {
        $('#db-from').val(t);
        $('#db-to').val(t);
      } else if (range === '7d') {
        $('#db-from').val(daysAgo(6));
        $('#db-to').val(t);
      } else if (range === '30d') {
        $('#db-from').val(daysAgo(29));
        $('#db-to').val(t);
      } else if (range === 'all') {
        $('#db-from').val('');
        $('#db-to').val('');
      }
    });

    // Apply button
    $(document).on('click.dashboard', '#db-apply-btn', function () {
      _airlinesPage = 1;
      _destPage     = 1;
      const f = getFilter();
      fetchDashboard(f.from, f.to, 1, 1);
    });

    // Airlines pagination
    $(document).on('click.dashboard', '#db-airlines-prev', function () {
      if (_airlinesPage <= 1) return;
      const f = getFilter();
      fetchDashboard(f.from, f.to, _airlinesPage - 1, _destPage);
    });
    $(document).on('click.dashboard', '#db-airlines-next', function () {
      const f = getFilter();
      fetchDashboard(f.from, f.to, _airlinesPage + 1, _destPage);
    });

    // Destinations pagination
    $(document).on('click.dashboard', '#db-dest-prev', function () {
      if (_destPage <= 1) return;
      const f = getFilter();
      fetchDashboard(f.from, f.to, _airlinesPage, _destPage - 1);
    });
    $(document).on('click.dashboard', '#db-dest-next', function () {
      const f = getFilter();
      fetchDashboard(f.from, f.to, _airlinesPage, _destPage + 1);
    });
  }

  /* ─── module ─── */
  window.AdminPages = window.AdminPages || {};
  window.AdminPages.dashboard = {
    init: function () {
      // Set default: today
      const t = today();
      $('#db-from').val(t);
      $('#db-to').val(t);
      $('[data-range="today"]').addClass('active');

      bind();
      fetchDashboard(t, t, 1, 1);
    },
    destroy: function () {
      $(document).off('.dashboard');
      _data = null;
      _airlinesPage = 1;
      _destPage = 1;
    },
  };
})();