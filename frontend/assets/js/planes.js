(function () {
  let currentPage = 1;
  const PAGE_SIZE = 10;

  function showErr(e) { window.AdminAPI.showMessage('#planes-alert', 'danger', e.message || 'Có lỗi xảy ra.'); }

  function row(item) {
    return '<tr data-id="' + item.id + '"><td>' + window.AdminAPI.escape(item.id) + '</td><td>' + window.AdminAPI.escape(item.airlineId || item.airline_id) + '</td><td>' + window.AdminAPI.escape(item.model) + '</td><td>' + window.AdminAPI.escape(item.totalSeats || item.total_seats) + '</td><td><span class="badge text-bg-secondary">' + window.AdminAPI.escape(item.status || 'ACTIVE') + '</span></td><td class="text-end"><button class="btn btn-sm btn-outline-primary js-edit">Edit</button></td></tr>';
  }

  function fill(item) {
    $('#planes-edit-id').val(item.id || '');
    $('#planes-edit-airline-id').val(item.airlineId || item.airline_id || '');
    $('#planes-edit-model').val(item.model || '');
    $('#planes-edit-total-seats').val(item.totalSeats || item.total_seats || '');
    $('#planes-edit-status').val((item.status || 'ACTIVE').toUpperCase());
  }

  function ensurePaginationUI() {
    if ($('#planes-pagination-nav').length) return;
    const html = '<div class="d-flex justify-content-between align-items-center pt-3 px-3 pb-3">'
      + '<small id="planes-pagination-info" class="text-muted"></small>'
      + '<nav aria-label="pagination" id="planes-pagination-nav"></nav>'
      + '</div>';
    $('#planes-table-body').closest('.table-responsive').after(html);
  }

  function renderPagination(pagination) {
    ensurePaginationUI();
    if (!pagination) {
      $('#planes-pagination-info').html('');
      $('#planes-pagination-nav').html('');
      return;
    }

    currentPage = pagination.currentPage;
    $('#planes-pagination-info').html('Trang ' + pagination.currentPage + ' / ' + pagination.totalPages + ' (tổng ' + pagination.totalRecords + ')');

    let html = '<ul class="pagination mb-0 gap-1" style="flex-wrap:wrap;">';
    if (pagination.hasPrevPage) html += '<li class="page-item"><button class="page-link rounded-2" data-page="' + (currentPage - 1) + '">Trước</button></li>';

    const start = Math.max(1, currentPage - 2);
    const end = Math.min(pagination.totalPages, currentPage + 2);
    for (let p = start; p <= end; p++) {
      html += '<li class="page-item ' + (p === currentPage ? 'active' : '') + '"><button class="page-link rounded-2" data-page="' + p + '">' + p + '</button></li>';
    }

    if (pagination.hasNextPage) html += '<li class="page-item"><button class="page-link rounded-2" data-page="' + (currentPage + 1) + '">Tiếp</button></li>';
    html += '</ul>';
    $('#planes-pagination-nav').html(html);
  }

  async function loadData(page) {
    page = page || 1;
    const payload = await window.AdminAPI.request('/api/planes?page=' + page + '&limit=' + PAGE_SIZE, { method: 'GET' });
    const list = Array.isArray(payload.data) ? payload.data : [];
    $('#planes-table-body').html(list.map(row).join('') || '<tr><td colspan="6" class="text-center text-muted py-4">Không có dữ liệu.</td></tr>');
    renderPagination(payload.pagination);
    if (list.length) fill(list[0]);
  }

  function bind() {
    ensurePaginationUI();
    $('#planes-refresh-btn').on('click.planes', function () { loadData(currentPage).catch(showErr); });

    $(document).on('click.planes', '#planes-pagination-nav button', function () {
      const page = Number($(this).data('page'));
      if (page) loadData(page).catch(showErr);
    });

    $('#planes-table-body').on('click.planes', '.js-edit', function () {
      const c = $(this).closest('tr').children('td');
      fill({ id: $(this).closest('tr').data('id'), airlineId: c.eq(1).text().trim(), model: c.eq(2).text().trim(), totalSeats: c.eq(3).text().trim(), status: c.eq(4).text().trim() });
    });

    $('#planes-edit-form').on('submit.planes', async function (e) {
      e.preventDefault();
      const id = $('#planes-edit-id').val();
      if (!id) return;
      try {
        await window.AdminAPI.request('/api/planes/' + id, {
          method: 'PATCH',
          body: JSON.stringify({
            airlineId: Number($('#planes-edit-airline-id').val()),
            model: $('#planes-edit-model').val().trim(),
            totalSeats: Number($('#planes-edit-total-seats').val()),
            status: $('#planes-edit-status').val(),
          }),
        });
        await loadData(currentPage);
      } catch (err) { showErr(err); }
    });

    $('#planes-delete-btn').on('click.planes', async function () {
      const id = $('#planes-edit-id').val();
      if (!id || !confirm('Xóa máy bay #' + id + '?')) return;
      try { await window.AdminAPI.request('/api/planes/' + id, { method: 'DELETE' }); await loadData(1); }
      catch (err) { showErr(err); }
    });

    $('#planes-create-form').on('submit.planes', async function (e) {
      e.preventDefault();
      try {
        await window.AdminAPI.request('/api/planes', {
          method: 'POST',
          body: JSON.stringify({
            airlineId: Number($('#planes-create-airline-id').val()),
            model: $('#planes-create-model').val().trim(),
            totalSeats: Number($('#planes-create-total-seats').val()),
            status: $('#planes-create-status').val(),
          }),
        });
        this.reset();
        await loadData(1);
      } catch (err) { showErr(err); }
    });
  }

  window.AdminPages.planes = {
    init: function () { bind(); loadData(1).catch(showErr); },
    destroy: function () {
      $('#planes-refresh-btn').off('.planes');
      $('#planes-table-body').off('.planes');
      $('#planes-edit-form').off('.planes');
      $('#planes-delete-btn').off('.planes');
      $('#planes-create-form').off('.planes');
      $(document).off('.planes');
    },
  };
})();
