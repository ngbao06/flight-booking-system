(function () {
  let currentPage = 1;
  const PAGE_SIZE = 10;

  function statusBadge(status) {
    const s = (status || 'ACTIVE').toUpperCase();
    const tone = s === 'LOCKED' ? 'danger' : 'success';
    return '<span class="badge text-bg-' + tone + '">' + window.AdminAPI.escape(s) + '</span>';
  }

  function fillEdit(item) {
    $('#airports-edit-id').val(item.id || '');
    $('#airports-edit-iata').val(item.iataCode || item.iata_code || '');
    $('#airports-edit-name').val(item.name || '');
    $('#airports-edit-city').val(item.city || '');
    $('#airports-edit-region').val(item.region || '');
    $('#airports-toggle-lock-btn').data('status', (item.status || 'ACTIVE').toUpperCase());
  }

  function ensurePaginationUI() {
    if ($('#airports-pagination-nav').length) return;
    const html = '<div class="d-flex justify-content-between align-items-center pt-3 px-3 pb-3">'
      + '<small id="airports-pagination-info" class="text-muted"></small>'
      + '<nav aria-label="pagination" id="airports-pagination-nav"></nav>'
      + '</div>';
    $('#airports-table-body').closest('.table-responsive').after(html);
  }

  function renderPagination(pagination) {
    ensurePaginationUI();
    if (!pagination) {
      $('#airports-pagination-info').html('');
      $('#airports-pagination-nav').html('');
      return;
    }

    currentPage = pagination.currentPage;
    $('#airports-pagination-info').html('Trang ' + pagination.currentPage + ' / ' + pagination.totalPages + ' (tổng ' + pagination.totalRecords + ')');

    let html = '<ul class="pagination mb-0 gap-1" style="flex-wrap:wrap;">';
    if (pagination.hasPrevPage) html += '<li class="page-item"><button class="page-link rounded-2" data-page="' + (currentPage - 1) + '">Trước</button></li>';

    const start = Math.max(1, currentPage - 2);
    const end = Math.min(pagination.totalPages, currentPage + 2);
    for (let p = start; p <= end; p++) {
      html += '<li class="page-item ' + (p === currentPage ? 'active' : '') + '"><button class="page-link rounded-2" data-page="' + p + '">' + p + '</button></li>';
    }

    if (pagination.hasNextPage) html += '<li class="page-item"><button class="page-link rounded-2" data-page="' + (currentPage + 1) + '">Tiếp</button></li>';
    html += '</ul>';
    $('#airports-pagination-nav').html(html);
  }

  async function loadData(page) {
    page = page || 1;
    const payload = await window.AdminAPI.request('/api/airports?page=' + page + '&limit=' + PAGE_SIZE, { method: 'GET' });
    const items = Array.isArray(payload.data) ? payload.data : [];

    const rows = items.map(function (item) {
      const iata = item.iataCode || item.iata_code || '';
      return '<tr data-id="' + item.id + '">'
        + '<td>' + window.AdminAPI.escape(item.id) + '</td>'
        + '<td>' + window.AdminAPI.escape(iata) + '</td>'
        + '<td>' + window.AdminAPI.escape(item.name) + '</td>'
        + '<td>' + window.AdminAPI.escape(item.city) + '</td>'
        + '<td>' + window.AdminAPI.escape(item.region) + '</td>'
        + '<td>' + statusBadge(item.status) + '</td>'
        + '<td class="text-end"><button class="btn btn-sm btn-outline-primary js-edit">Edit</button></td></tr>';
    }).join('');

    $('#airports-table-body').html(rows || '<tr><td colspan="7" class="text-center text-muted py-4">Không có dữ liệu.</td></tr>');
    renderPagination(payload.pagination);
    if (items.length) fillEdit(items[0]);
  }

  function showErr(e) { window.AdminAPI.showMessage('#airports-alert', 'danger', e.message || 'Có lỗi xảy ra.'); }

  function bind() {
    ensurePaginationUI();
    $('#airports-refresh-btn').on('click.airports', function () { loadData(currentPage).catch(showErr); });

    $(document).on('click.airports', '#airports-pagination-nav button', function () {
      const page = Number($(this).data('page'));
      if (page) loadData(page).catch(showErr);
    });

    $('#airports-table-body').on('click.airports', '.js-edit', function () {
      const $cells = $(this).closest('tr').children('td');
      fillEdit({
        id: $(this).closest('tr').data('id'),
        iataCode: $cells.eq(1).text().trim(),
        name: $cells.eq(2).text().trim(),
        city: $cells.eq(3).text().trim(),
        region: $cells.eq(4).text().trim(),
        status: $cells.eq(5).text().trim(),
      });
    });

    $('#airports-edit-form').on('submit.airports', async function (e) {
      e.preventDefault();
      const id = $('#airports-edit-id').val();
      if (!id) return;
      try {
        await window.AdminAPI.request('/api/airports/' + id, {
          method: 'PATCH',
          body: JSON.stringify({
            iataCode: $('#airports-edit-iata').val().trim(),
            name: $('#airports-edit-name').val().trim(),
            city: $('#airports-edit-city').val().trim(),
            region: $('#airports-edit-region').val().trim(),
          }),
        });
        await loadData(currentPage);
        window.AdminAPI.showMessage('#airports-alert', 'success', 'Đã cập nhật sân bay.');
      } catch (err) { showErr(err); }
    });

    $('#airports-toggle-lock-btn').on('click.airports', async function () {
      const id = $('#airports-edit-id').val();
      if (!id) return;
      const status = ($(this).data('status') || 'ACTIVE').toUpperCase();
      const action = status === 'LOCKED' ? 'unlock' : 'lock';
      try {
        await window.AdminAPI.request('/api/airports/' + id + '/' + action, { method: 'PATCH' });
        await loadData(currentPage);
      } catch (err) { showErr(err); }
    });

    $('#airports-delete-btn').on('click.airports', async function () {
      const id = $('#airports-edit-id').val();
      if (!id || !confirm('Xóa sân bay #' + id + '?')) return;
      try {
        await window.AdminAPI.request('/api/airports/' + id, { method: 'DELETE' });
        await loadData(1);
      } catch (err) { showErr(err); }
    });

    $('#airports-create-form').on('submit.airports', async function (e) {
      e.preventDefault();
      try {
        await window.AdminAPI.request('/api/airports', {
          method: 'POST',
          body: JSON.stringify({
            iataCode: $('#airports-create-iata').val().trim(),
            name: $('#airports-create-name').val().trim(),
            city: $('#airports-create-city').val().trim(),
            region: $('#airports-create-region').val().trim(),
          }),
        });
        this.reset();
        await loadData(1);
      } catch (err) { showErr(err); }
    });
  }

  window.AdminPages.airports = {
    init: function () { bind(); loadData(1).catch(showErr); },
    destroy: function () {
      $('#airports-refresh-btn').off('.airports');
      $('#airports-table-body').off('.airports');
      $('#airports-edit-form').off('.airports');
      $('#airports-toggle-lock-btn').off('.airports');
      $('#airports-delete-btn').off('.airports');
      $('#airports-create-form').off('.airports');
      $(document).off('.airports');
    },
  };
})();
