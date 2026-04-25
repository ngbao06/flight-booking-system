(function () {
  function showErr(e) { window.AdminAPI.showMessage('#logs-alert', 'danger', e.message || 'Không tải được logs.'); }

  function row(item) {
    return '<tr><td>' + window.AdminAPI.escape(item.createdAt || item.created_at || item.timestamp || '') + '</td><td><span class="badge text-bg-secondary">' + window.AdminAPI.escape(item.level || 'INFO') + '</span></td><td>' + window.AdminAPI.escape(item.action || item.event || '') + '</td><td>' + window.AdminAPI.escape(item.actor || item.user || '') + '</td><td>' + window.AdminAPI.escape(item.message || item.details || '') + '</td></tr>';
  }

  async function loadData() {
    const payload = await window.AdminAPI.request('/api/adminlogs', { method: 'GET' });
    const list = Array.isArray(payload.data) ? payload.data : [];
    $('#logs-table-body').html(list.map(row).join('') || '<tr><td colspan="5" class="text-center text-muted py-4">Chưa có log.</td></tr>');
  }

  function bind() {
    $('#logs-refresh-btn').on('click.logs', function () { loadData().catch(showErr); });
  }

  window.AdminPages.logs = {
    init: function () {
      bind();
      loadData().catch(function () {
        window.AdminAPI.showMessage('#logs-alert', 'warning', 'Không tìm thấy endpoint /api/adminlogs hoặc chưa có dữ liệu log.');
        $('#logs-table-body').html('<tr><td colspan="5" class="text-center text-muted py-4">Endpoint logs chưa sẵn sàng.</td></tr>');
      });
    },
    destroy: function () {
      $('#logs-refresh-btn').off('.logs');
    },
  };
})();
