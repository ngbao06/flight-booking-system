(function () {
  function card(title, value, icon, tone) {
    return '<div class="col-md-6 col-xl-3">'
      + '<div class="card shadow-sm border-0 h-100">'
      + '<div class="card-body d-flex align-items-center gap-3">'
      + '<div class="rounded-circle d-flex align-items-center justify-content-center" style="width:48px;height:48px;background:' + tone + ';color:#fff;">'
      + '<i class="fa-solid ' + icon + '"></i></div>'
      + '<div><div class="text-muted small">' + title + '</div><div class="h4 mb-0 fw-bold">' + value + '</div></div>'
      + '</div></div></div>';
  }

  async function fetchCount(url) {
    const payload = await window.AdminAPI.request(url, { method: 'GET' });
    const list = Array.isArray(payload.data) ? payload.data : [];
    return list.length;
  }

  async function loadDashboard() {
    try {
      const [airlines, airports, flights, bookings] = await Promise.all([
        fetchCount('/api/airlines'),
        fetchCount('/api/airports'),
        fetchCount('/api/flights'),
        fetchCount('/api/booking'),
      ]);

      $('#dashboard-summary').html(
        card('Hãng hàng không', airlines, 'fa-building', '#0d6efd')
        + card('Sân bay', airports, 'fa-tower-control', '#198754')
        + card('Chuyến bay', flights, 'fa-plane', '#fd7e14')
        + card('Giao dịch', bookings, 'fa-credit-card', '#6f42c1')
      );

      $('#dashboard-overview').html(
        '<div class="row g-3">'
        + '<div class="col-lg-6"><div class="p-3 rounded bg-light">'
        + '<h6 class="fw-bold">Tình hình vận hành</h6>'
        + '<p class="mb-0 text-muted">Hệ thống đang sẵn sàng cho thao tác quản trị và theo dõi dữ liệu trực tiếp từ API.</p>'
        + '</div></div>'
        + '<div class="col-lg-6"><div class="p-3 rounded bg-light">'
        + '<h6 class="fw-bold">Lưu ý</h6>'
        + '<p class="mb-0 text-muted">Chọn menu bên trái để quản lý dữ liệu chi tiết theo từng module.</p>'
        + '</div></div>'
        + '</div>'
      );
    } catch (error) {
      window.AdminAPI.showMessage('#dashboard-alert', 'danger', error.message || 'Không tải được dashboard.');
    }
  }

  window.AdminPages.dashboard = {
    init: function () {
      loadDashboard();
    },
  };
})();
