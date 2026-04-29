(function () {
  let currentPage = 1;
  const PAGE_SIZE = 10;

  function showErr(e) { window.AdminAPI.showMessage('#bookings-alert', 'danger', e.message || 'Có lỗi xảy ra.'); }

  function toLocalInput(value) {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    const tz = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tz).toISOString().slice(0, 16);
  }

  function row(item) {
    return '<tr data-id="' + item.id + '"><td>' + window.AdminAPI.escape(item.id) + '</td><td>' + window.AdminAPI.escape(item.flightId || item.flight_id) + '</td><td>' + window.AdminAPI.escape(item.userId || item.user_id) + '</td><td>' + window.AdminAPI.escape(toLocalInput(item.bookingDate || item.booking_date)) + '</td><td>' + window.AdminAPI.escape(item.totalAmount || item.total_amount) + '</td><td><span class="badge text-bg-secondary">' + window.AdminAPI.escape(item.status || 'PENDING') + '</span></td><td class="text-end"><button class="btn btn-sm btn-outline-primary js-edit">Edit</button></td></tr>';
  }

  function fill(item) {
    $('#bookings-edit-id').val(item.id || '');
    $('#bookings-edit-flight-id').val(item.flightId || item.flight_id || '');
    $('#bookings-edit-user-id').val(item.userId || item.user_id || '');
    $('#bookings-edit-date').val(toLocalInput(item.bookingDate || item.booking_date));
    $('#bookings-edit-amount').val(item.totalAmount || item.total_amount || '');
    $('#bookings-edit-status').val((item.status || 'PENDING').toUpperCase());
  }

  function ensurePaginationUI() {
    if ($('#bookings-pagination-nav').length) return;
    const html = '<div class="d-flex justify-content-between align-items-center pt-3 px-3 pb-3">'
      + '<small id="bookings-pagination-info" class="text-muted"></small>'
      + '<nav aria-label="pagination" id="bookings-pagination-nav"></nav>'
      + '</div>';
    $('#bookings-table-body').closest('.table-responsive').after(html);
  }

  function renderPagination(pagination) {
    ensurePaginationUI();
    if (!pagination) {
      $('#bookings-pagination-info').html('');
      $('#bookings-pagination-nav').html('');
      return;
    }

    currentPage = pagination.currentPage;
    const total = pagination.totalItems ?? pagination.totalRecords ?? '?';
    $('#bookings-pagination-info').html(
      'Trang <strong>' + pagination.currentPage + '</strong> / ' + pagination.totalPages +
      ' &nbsp;·&nbsp; ' + total + ' booking'
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

    $('#bookings-pagination-nav').html(html);
  }

  async function loadData(page) {
    page = page || 1;
    const payload = await window.AdminAPI.request('/api/booking?page=' + page + '&limit=' + PAGE_SIZE, { method: 'GET' });
    const list = Array.isArray(payload.data) ? payload.data : [];
    $('#bookings-table-body').html(list.map(row).join('') || '<tr><td colspan="7" class="text-center text-muted py-4">Không có dữ liệu.</td></tr>');
    renderPagination(payload.pagination);
    if (list.length) fill(list[0]);
  }

  function bind() {
    ensurePaginationUI();
    $('#bookings-refresh-btn').on('click.bookings', function () { loadData(currentPage).catch(showErr); });

    $(document).on('click.bookings', '#bookings-pagination-nav button', function () {
      const page = Number($(this).data('page'));
      if (page) loadData(page).catch(showErr);
    });

    $('#bookings-table-body').on('click.bookings', '.js-edit', async function () {
      const id = $(this).closest('tr').data('id');
      try {
        const payload = await window.AdminAPI.request('/api/booking/' + id, { method: 'GET' });
        fill(payload.data || {});
      } catch (err) { showErr(err); }
    });

    $('#bookings-edit-form').on('submit.bookings', async function (e) {
      e.preventDefault();
      const id = $('#bookings-edit-id').val();
      if (!id) return;
      try {
        await window.AdminAPI.request('/api/booking/' + id, {
          method: 'PATCH',
          body: JSON.stringify({ status: $('#bookings-edit-status').val() }),
        });
        await loadData(currentPage);
      } catch (err) { showErr(err); }
    });

    $('#bookings-create-form').on('submit.bookings', async function (e) {
      e.preventDefault();
      try {
        await window.AdminAPI.request('/api/booking', {
          method: 'POST',
          body: JSON.stringify({
            flightId: Number($('#bookings-create-flight-id').val()),
            userId: Number($('#bookings-create-user-id').val()),
            bookingDate: new Date($('#bookings-create-date').val()).toISOString(),
            totalAmount: Number($('#bookings-create-amount').val()),
            status: 'PENDING',
          }),
        });
        this.reset();
        await loadData(1);
      } catch (err) { showErr(err); }
    });
  }

  window.AdminPages.bookings = {
    init: function () { bind(); loadData(1).catch(showErr); },
    destroy: function () {
      $('#bookings-refresh-btn').off('.bookings');
      $('#bookings-table-body').off('.bookings');
      $('#bookings-edit-form').off('.bookings');
      $('#bookings-create-form').off('.bookings');
      $(document).off('.bookings');
    },
  };
})();
