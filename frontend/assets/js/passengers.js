(function () {
  let currentPage = 1;
  const PAGE_SIZE = 10;

  function showErr(e) {
    window.AdminAPI.showMessage('#passengers-alert', 'danger', e.message || 'Có lỗi xảy ra.');
  }

  function loyalty(user) {
    return user.loyaltyPoints || user.loyalty_points || user.points || 0;
  }

  function profile(profileData) {
    const p = profileData || {};
    const contact = p.contact || {};
    const passport = p.passport || {};
    const preferences = p.preferences || {};

    return '<div class="vstack gap-2">'
      + '<div><strong>Họ tên:</strong> ' + window.AdminAPI.escape(p.full_name || p.fullName || '') + '</div>'
      + '<div><strong>Email:</strong> ' + window.AdminAPI.escape(contact.email || '') + '</div>'
      + '<div><strong>SĐT:</strong> ' + window.AdminAPI.escape(contact.phone || '') + '</div>'
      + '<div><strong>Địa chỉ:</strong> ' + window.AdminAPI.escape(contact.address || '') + '</div>'
      + '<div><strong>Passport:</strong> ' + window.AdminAPI.escape(passport.number || '') + '</div>'
      + '<div><strong>Prefer meal:</strong> ' + window.AdminAPI.escape(preferences.meal || '') + '</div>'
      + '<div><strong>Prefer seat position:</strong> ' + window.AdminAPI.escape(preferences.seat_position || '') + '</div>'
      + '</div>';
  }

  function ensurePaginationUI() {
    if ($('#passengers-pagination-nav').length) return;
    const html = '<div class="d-flex justify-content-between align-items-center pt-3 px-3 pb-3">'
      + '<small id="passengers-pagination-info" class="text-muted"></small>'
      + '<div id="passengers-pagination-nav" class="d-flex gap-1 flex-wrap"></div>'
      + '</div>';
    $('#passengers-table-body').closest('.table-responsive').after(html);
  }

  function renderPagination(pagination) {
    ensurePaginationUI();
    if (!pagination) {
      $('#passengers-pagination-info').html('');
      $('#passengers-pagination-nav').html('');
      return;
    }

    currentPage = pagination.currentPage;
    const total = pagination.totalItems ?? pagination.totalRecords ?? '?';
    $('#passengers-pagination-info').html(
      'Trang <strong>' + pagination.currentPage + '</strong> / ' + pagination.totalPages +
      ' &nbsp;·&nbsp; ' + total + ' hành khách'
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

    $('#passengers-pagination-nav').html(html);
  }
  async function loadData(page) {
    page = page || 1;
    const payload = await window.AdminAPI.request('/api/users/passengers/full-info?page=' + page + '&limit=' + PAGE_SIZE, { method: 'GET' });
    const passengers = Array.isArray(payload.data) ? payload.data : [];

    const rows = passengers.map(function (u) {
      const p = u.profile || {};
      const contact = p.contact || {};
      return '<tr data-id="' + u.id + '">'
        + '<td>' + window.AdminAPI.escape(u.id) + '</td>'
        + '<td>' + window.AdminAPI.escape(u.username) + '</td>'
        + '<td>' + window.AdminAPI.escape(p.full_name || '') + '</td>'
        + '<td>' + window.AdminAPI.escape(contact.email || '') + '</td>'
        + '<td>' + window.AdminAPI.escape(loyalty(u)) + '</td>'
        + '<td class="text-end"><button class="btn btn-sm btn-outline-primary js-view">Xem</button></td></tr>';
    }).join('');

    $('#passengers-table-body').html(rows || '<tr><td colspan="6" class="text-center text-muted py-4">Không có dữ liệu.</td></tr>');
    renderPagination(payload.pagination);

    if (passengers.length) {
      $('#passengers-profile-panel').html(profile(passengers[0].profile));
    }
  }

  function bind() {
    ensurePaginationUI();
    $('#passengers-refresh-btn').on('click.passengers', function () { loadData(currentPage).catch(showErr); });

    $(document).on('click.passengers', '#passengers-pagination-nav button', function () {
      const page = Number($(this).data('page'));
      if (page) loadData(page).catch(showErr);
    });

    $('#passengers-table-body').on('click.passengers', '.js-view', async function () {
      const id = $(this).closest('tr').data('id');
      try {
        const payload = await window.AdminAPI.request('/api/users/passengers/' + id + '/profile', { method: 'GET' });
        $('#passengers-profile-panel').html(profile(payload.data || {}));
      } catch (err) { showErr(err); }
    });
  }

  window.AdminPages.passengers = {
    init: function () { bind(); loadData(1).catch(showErr); },
    destroy: function () {
      $('#passengers-refresh-btn').off('.passengers');
      $('#passengers-table-body').off('.passengers');
      $(document).off('.passengers');
    },
  };
})();
