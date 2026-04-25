(function () {
  let currentPage = 1;
  const PAGE_SIZE = 10;
  let allLogs = [];

  function showErr(e) { window.AdminAPI.showMessage('#logs-alert', 'danger', e.message || 'Không tải được logs.'); }

  function getActionBadge(action) {
    const map = {
      UPDATE: 'warning',
      DELETE: 'danger',
      CREATE: 'success',
      LOCK: 'secondary',
      UNLOCK: 'info'
    };
    return map[action] || 'secondary';
  }
  
  function formatDiff(oldData, newData) {
    if (!oldData || !newData) return '';

    return Object.keys(newData).map(key => {
      const oldVal = oldData[key];
      const newVal = newData[key];

      if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        return `
          <div class="log-diff">
            <b>${key}</b>: 
            <span class="text-danger">${oldVal ?? '-'}</span> 
            → 
            <span class="text-success">${newVal ?? '-'}</span>
          </div>
        `;
      }
      return '';
    }).join('');
  }

  function row(item) {
    return `
      <tr>
        <td>${window.AdminAPI.formatDate(item.createdAt)}</td>

        <td>
          <span class="badge text-bg-dark">
            ${window.AdminAPI.escape(item.module)}
          </span>
        </td>

        <td>${item.id}</td>

        <td>
          <span class="badge text-bg-${getActionBadge(item.action)}">
            ${item.action}
          </span>
        </td>

        <td colspan="2">
          ${formatDiff(item.old_data, item.new_data)}
        </td>
      </tr>
    `;
  }

  function ensurePaginationUI() {
    if ($('#logs-pagination-nav').length) return;
    const html = '<div class="d-flex justify-content-between align-items-center pt-3 px-3 pb-3">'
      + '<small id="logs-pagination-info" class="text-muted" style="font-size:12px;"></small>'
      + '<div id="logs-pagination-nav" class="d-flex gap-1 flex-wrap"></div>'
      + '</div>';
    $('#logs-table-body').closest('.table-responsive').after(html);
  }

  function renderPagination(pagination) {
    ensurePaginationUI();
    if (!pagination) {
      $('#logs-pagination-info').html('');
      $('#logs-pagination-nav').html('');
      return;
    }

    currentPage = pagination.currentPage;
    const total = pagination.totalItems ?? pagination.totalRecords ?? '?';
    $('#logs-pagination-info').html(
      'Trang <strong>' + pagination.currentPage + '</strong> / ' + pagination.totalPages +
      ' &nbsp;·&nbsp; ' + total + ' log'
    );

    const totalPages = Number(pagination.totalPages) || 0;
    const pagesToShow = [];

    function pushPage(pageNumber) {
      if (pageNumber >= 1 && pageNumber <= totalPages && !pagesToShow.includes(pageNumber)) {
        pagesToShow.push(pageNumber);
      }
    }

    if (totalPages <= 7) {
      for (let pageNumber = 1; pageNumber <= totalPages; pageNumber++) {
        pushPage(pageNumber);
      }
    } else {
      pushPage(1);
      pushPage(totalPages);
      pushPage(currentPage - 1);
      pushPage(currentPage);
      pushPage(currentPage + 1);

      if (currentPage <= 3) {
        pushPage(2);
        pushPage(3);
        pushPage(4);
      }

      if (currentPage >= totalPages - 2) {
        pushPage(totalPages - 3);
        pushPage(totalPages - 2);
        pushPage(totalPages - 1);
      }

      pagesToShow.sort(function (a, b) { return a - b; });
    }

    let html = '';
    for (let index = 0; index < pagesToShow.length; index++) {
      const pageNumber = pagesToShow[index];
      const previousPage = pagesToShow[index - 1];

      if (index > 0 && pageNumber - previousPage > 1) {
        html += '<span class="fp-page-ellipsis">...</span>';
      }

      html += '<button class="fp-page-btn' + (pageNumber === currentPage ? ' active' : '') + '" data-page="' + pageNumber + '">' + pageNumber + '</button>';
    }

    $('#logs-pagination-nav').html(html);
  }

  function renderTable(data) {
    $('#logs-table-body').html(
      data.map(row).join('') ||
      '<tr><td colspan="6" class="text-center">No logs</td></tr>'
    );
  }

  function applyFilter() {
    const search = $('#logs-search').val().toLowerCase();
    const module = $('#logs-filter-module').val();
    const action = $('#logs-filter-action').val();

    const filtered = allLogs.filter(item => {
      const matchSearch =
        !search ||
        (item.module || '').toLowerCase().includes(search) ||
        (item.action || '').toLowerCase().includes(search) ||
        String(item.id).includes(search);

      const matchModule = !module || item.module === module;
      const matchAction = !action || item.action === action;

      return matchSearch && matchModule && matchAction;
    });

    renderTable(filtered);
  }

  async function loadData(page) {
    const payload = await window.AdminAPI.request(
      '/api/adminlogs?page=' + page + '&limit=' + PAGE_SIZE
    );

    allLogs = Array.isArray(payload.data) ? payload.data : [];

    renderTable(allLogs);
    renderPagination(payload.pagination);
  }

  function bind() {
    ensurePaginationUI();
    $('#logs-refresh-btn').on('click.logs', function () { loadData(currentPage).catch(showErr); });

    $(document).on('click.logs', '#logs-pagination-nav button', function () {
      const page = Number($(this).data('page'));
      if (page) loadData(page).catch(showErr);
    });
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
      $(document).off('.logs');
    },
  };

  $('#logs-search').on('input', applyFilter);
  $('#logs-filter-module').on('change', applyFilter);
  $('#logs-filter-action').on('change', applyFilter);
})();
