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
    const total = pagination.totalItems ?? pagination.totalRecords ?? '?';
    $('#staff-pagination-info').html(
      'Trang <strong>' + pagination.currentPage + '</strong> / ' + pagination.totalPages +
      ' &nbsp;·&nbsp; ' + total + ' user'
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
      try { await window.AdminAPI.request('/api/users/' + id, { method: 'DELETE' }); await loadData(currentPage); }
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
