(function () {
  let currentPage = 1;
  const PAGE_SIZE = 10;

  function showErr(e) { window.AdminAPI.showMessage('#staff-alert', 'danger', e.message || 'Có lỗi xảy ra.'); }

  function row(item) {
    return '<tr data-id="' + item.id + '"><td>' + window.AdminAPI.escape(item.id) + '</td><td>' + window.AdminAPI.escape(item.username) + '</td><td>' + window.AdminAPI.escape(item.full_name || item.fullName || '') + '</td><td><span class="badge text-bg-info">' + window.AdminAPI.escape(item.role) + '</span></td><td>' + window.AdminAPI.escape(item.email || '') + '</td><td class="text-end"><button class="btn btn-sm btn-outline-primary js-edit">Edit</button></td></tr>';
  }

  function fill(item) {
    $('#staff-edit-id').val(item.id || '');
    $('#staff-edit-full-name').val(item.full_name || item.fullName || '');
    $('#staff-edit-email').val(item.email || '');
    $('#staff-edit-phone').val(item.phone || '');
    $('#staff-edit-address').val(item.address || '');
    $('#staff-edit-role').val((item.role || 'GATE_AGENT').toUpperCase());
  }

  function ensurePaginationUI() {
    if ($('#staff-pagination-nav').length) return;
    const html = '<div class="d-flex justify-content-between align-items-center pt-3 px-3 pb-3">'
      + '<small id="staff-pagination-info" class="text-muted"></small>'
      + '<nav aria-label="pagination" id="staff-pagination-nav"></nav>'
      + '</div>';
    $('#staff-table-body').closest('.table-responsive').after(html);
  }

  function renderPagination(pagination) {
    ensurePaginationUI();
    if (!pagination) {
      $('#staff-pagination-info').html('');
      $('#staff-pagination-nav').html('');
      return;
    }

    currentPage = pagination.currentPage;
    $('#staff-pagination-info').html('Trang ' + pagination.currentPage + ' / ' + pagination.totalPages + ' (tổng ' + pagination.totalRecords + ')');

    let html = '<ul class="pagination mb-0 gap-1" style="flex-wrap:wrap;">';
    if (pagination.hasPrevPage) html += '<li class="page-item"><button class="page-link rounded-2" data-page="' + (currentPage - 1) + '">Trước</button></li>';

    const start = Math.max(1, currentPage - 2);
    const end = Math.min(pagination.totalPages, currentPage + 2);
    for (let p = start; p <= end; p++) {
      html += '<li class="page-item ' + (p === currentPage ? 'active' : '') + '"><button class="page-link rounded-2" data-page="' + p + '">' + p + '</button></li>';
    }

    if (pagination.hasNextPage) html += '<li class="page-item"><button class="page-link rounded-2" data-page="' + (currentPage + 1) + '">Tiếp</button></li>';
    html += '</ul>';
    $('#staff-pagination-nav').html(html);
  }

  async function loadData(page) {
    page = page || 1;
    const payload = await window.AdminAPI.request('/api/users?role=STAFF&page=' + page + '&limit=' + PAGE_SIZE, { method: 'GET' });
    const staff = Array.isArray(payload.data) ? payload.data : [];
    $('#staff-table-body').html(staff.map(row).join('') || '<tr><td colspan="6" class="text-center text-muted py-4">Không có dữ liệu.</td></tr>');
    renderPagination(payload.pagination);
    if (staff.length) fill(staff[0]);
  }

  function bind() {
    ensurePaginationUI();
    $('#staff-refresh-btn').on('click.staff', function () { loadData(currentPage).catch(showErr); });

    $(document).on('click.staff', '#staff-pagination-nav button', function () {
      const page = Number($(this).data('page'));
      if (page) loadData(page).catch(showErr);
    });

    $('#staff-table-body').on('click.staff', '.js-edit', async function () {
      const id = $(this).closest('tr').data('id');
      try {
        const payload = await window.AdminAPI.request('/api/users/' + id, { method: 'GET' });
        fill(payload.data || {});
      } catch (err) { showErr(err); }
    });

    $('#staff-edit-form').on('submit.staff', async function (e) {
      e.preventDefault();
      const id = $('#staff-edit-id').val();
      if (!id) return;
      try {
        await window.AdminAPI.request('/api/users/' + id, {
          method: 'PATCH',
          body: JSON.stringify({
            full_name: $('#staff-edit-full-name').val().trim(),
            email: $('#staff-edit-email').val().trim(),
            phone: $('#staff-edit-phone').val().trim(),
            address: $('#staff-edit-address').val().trim(),
            role: $('#staff-edit-role').val(),
          }),
        });
        await loadData(currentPage);
      } catch (err) { showErr(err); }
    });

    $('#staff-delete-btn').on('click.staff', async function () {
      const id = $('#staff-edit-id').val();
      if (!id || !confirm('Xóa user #' + id + '?')) return;
      try { await window.AdminAPI.request('/api/users/' + id, { method: 'DELETE' }); await loadData(1); }
      catch (err) { showErr(err); }
    });

    $('#staff-create-form').on('submit.staff', async function (e) {
      e.preventDefault();
      try {
        await window.AdminAPI.request('/api/users', {
          method: 'POST',
          body: JSON.stringify({
            username: $('#staff-create-username').val().trim(),
            password: $('#staff-create-password').val(),
            role: 'GATE_AGENT',
            full_name: $('#staff-create-full-name').val().trim(),
            email: $('#staff-create-email').val().trim(),
            phone: $('#staff-create-phone').val().trim(),
          }),
        });
        this.reset();
        await loadData(1);
      } catch (err) { showErr(err); }
    });
  }

  window.AdminPages.staff = {
    init: function () { bind(); loadData(1).catch(showErr); },
    destroy: function () {
      $('#staff-refresh-btn').off('.staff');
      $('#staff-table-body').off('.staff');
      $('#staff-edit-form').off('.staff');
      $('#staff-delete-btn').off('.staff');
      $('#staff-create-form').off('.staff');
      $(document).off('.staff');
    },
  };
})();
