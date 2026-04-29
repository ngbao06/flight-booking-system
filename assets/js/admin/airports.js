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
    const total = pagination.totalItems ?? pagination.totalRecords ?? '?';
    $('#airports-pagination-info').html(
      'Trang <strong>' + pagination.currentPage + '</strong> / ' + pagination.totalPages +
      ' &nbsp;·&nbsp; ' + total + ' sân bay'
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
        await loadData(currentPage);
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
