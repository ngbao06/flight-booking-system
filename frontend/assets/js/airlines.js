(function () {
  let currentPage = 1;
  const PAGE_SIZE = 10;
  let selected = null;

  function statusBadge(status) {
    const s = (status || 'ACTIVE').toUpperCase();
    const tone = s === 'LOCKED' ? 'danger' : 'success';
    return '<span class="badge text-bg-' + tone + '">' + window.AdminAPI.escape(s) + '</span>';
  }

  function fillEdit(item) {
    selected = item;
    $('#airlines-edit-id').val(item.id || '');
    $('#airlines-edit-code').val(item.code || '');
    $('#airlines-edit-name').val(item.name || '');
    $('#airlines-edit-status').val((item.status || 'ACTIVE').toUpperCase());
  }

  function renderRows(items) {
    const rows = items.map(function (item) {
      return '<tr data-id="' + item.id + '">'
        + '<td>' + window.AdminAPI.escape(item.id) + '</td>'
        + '<td>' + window.AdminAPI.escape(item.code) + '</td>'
        + '<td>' + window.AdminAPI.escape(item.name) + '</td>'
        + '<td>' + statusBadge(item.status) + '</td>'
        + '<td class="text-end"><button class="btn btn-sm btn-outline-primary me-1 js-edit">Edit</button><button class="btn btn-sm btn-outline-danger js-delete">Delete</button></td>'
        + '</tr>';
    }).join('');
    $('#airlines-table-body').html(rows || '<tr><td colspan="5" class="text-center text-muted py-4">Không có dữ liệu.</td></tr>');
  }

  function ensurePaginationUI() {
    if ($('#airlines-pagination-nav').length) return;
    const html = '<div class="d-flex justify-content-between align-items-center pt-3 px-3 pb-3">'
      + '<small id="airlines-pagination-info" class="text-muted"></small>'
      + '<nav aria-label="pagination" id="airlines-pagination-nav"></nav>'
      + '</div>';
    $('#airlines-table-body').closest('.table-responsive').after(html);
  }

  function renderPagination(pagination) {
    ensurePaginationUI();
    if (!pagination) {
      $('#airlines-pagination-info').html('');
      $('#airlines-pagination-nav').html('');
      return;
    }

    currentPage = pagination.currentPage;
    const total = pagination.totalItems ?? pagination.totalRecords ?? '?';
    $('#airlines-pagination-info').html(
      'Trang <strong>' + pagination.currentPage + '</strong> / ' + pagination.totalPages +
      ' &nbsp;·&nbsp; ' + total + ' hãng'
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

    $('#airlines-pagination-nav').html(html);
  }

  async function loadData(page) {
    page = page || 1;
    const payload = await window.AdminAPI.request('/api/airlines?page=' + page + '&limit=' + PAGE_SIZE, { method: 'GET' });
    const items = Array.isArray(payload.data) ? payload.data : [];
    renderRows(items);
    renderPagination(payload.pagination);
    if (items.length && !selected) {
      fillEdit(items[0]);
    }
  }

  async function remove(id) {
    await window.AdminAPI.request('/api/airlines/' + id, { method: 'DELETE' });
  }

  function bind() {
    ensurePaginationUI();
    $('#airlines-refresh-btn').on('click.airlines', function () { loadData(currentPage).catch(showErr); });

    $(document).on('click.airlines', '#airlines-pagination-nav button', function () {
      const page = Number($(this).data('page'));
      if (page) loadData(page).catch(showErr);
    });

    $('#airlines-table-body').on('click.airlines', '.js-edit', function () {
      const id = $(this).closest('tr').data('id');
      const row = $(this).closest('tr').children('td');
      fillEdit({ id: id, code: row.eq(1).text().trim(), name: row.eq(2).text().trim(), status: row.eq(3).text().trim() });
    });

    $('#airlines-table-body').on('click.airlines', '.js-delete', async function () {
      const id = $(this).closest('tr').data('id');
      if (!confirm('Xóa hãng #' + id + '?')) return;
      try { await remove(id); await loadData(currentPage); }
      catch (e) { showErr(e); }
    });

    $('#airlines-edit-form').on('submit.airlines', async function (e) {
      e.preventDefault();
      const id = $('#airlines-edit-id').val();
      if (!id) return;
      try {
        await window.AdminAPI.request('/api/airlines/' + id, {
          method: 'PATCH',
          body: JSON.stringify({ code: $('#airlines-edit-code').val().trim(), name: $('#airlines-edit-name').val().trim(), status: $('#airlines-edit-status').val() }),
        });
        await loadData(currentPage);
        window.AdminAPI.showMessage('#airlines-alert', 'success', 'Đã cập nhật hãng.');
      } catch (err) { showErr(err); }
    });

    $('#airlines-delete-btn').on('click.airlines', async function (e) {
	  e.preventDefault();
      const id = $('#airlines-edit-id').val();
      if (!id || !confirm('Xóa hãng #' + id + '?')) return;
      try { 
        await remove(id); 
        await loadData(currentPage); 
      }
      catch (err) { showErr(err); }
    });

    $('#airlines-create-form').on('submit.airlines', async function (e) {
      e.preventDefault();
      try {
        await window.AdminAPI.request('/api/airlines', {
          method: 'POST',
          body: JSON.stringify({ code: $('#airlines-create-code').val().trim(), name: $('#airlines-create-name').val().trim() }),
        });
        this.reset();
        await loadData(1);
        window.AdminAPI.showMessage('#airlines-alert', 'success', 'Tạo hãng thành công.');
      } catch (err) { showErr(err); }
    });
  }

  function showErr(error) {
    window.AdminAPI.showMessage('#airlines-alert', 'danger', error.message || 'Có lỗi xảy ra.');
  }

  window.AdminPages.airlines = {
    init: function () {
      bind();
      loadData(1).catch(showErr);
    },
    destroy: function () {
      $('#airlines-refresh-btn').off('.airlines');
      $('#airlines-table-body').off('.airlines');
      $('#airlines-edit-form').off('.airlines');
      $('#airlines-delete-btn').off('.airlines');
      $('#airlines-create-form').off('.airlines');
      $(document).off('.airlines');
    },
  };
})();
