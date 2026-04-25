(function () {
  'use strict';
 
  let currentPage = 1;
  const PAGE_SIZE = 10;
 
  /* ── caches ── */
  let _airlines  = [];   // { id, name, code }
  let _planes    = [];   // { id, model, airlineId }
  let _airports  = [];   // { id, name, iataCode }
  let _flightCounts = {}; // { airlineId: count }  for auto-numbering
 
  /* ────────────────────────────────────── */
  /*  UTILS                                 */
  /* ────────────────────────────────────── */
  function showErr(e) {
    window.AdminAPI.showMessage('#flights-alert', 'danger', e.message || 'Có lỗi xảy ra.');
  }
 
  function toLocalInput(value) {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  }
 
  function pad(n, len) { return String(n).padStart(len, '0'); }
 
  function buildFlightNumber(airlineId) {
    const airline = _airlines.find(a => String(a.id) === String(airlineId));
    if (!airline || !airline.code) return '–';
    const count = (_flightCounts[airlineId] || 0) + 1;
    return airline.code.toUpperCase() + pad(count, 3);
  }

  function getAirportLabel(airportId) {
    const airport = _airports.find(a => String(a.id) === String(airportId));
    if (!airport) return airportId || '–';

    const name = airport.name || airport.iataCode || airport.code || ('Sân bay #' + airport.id);
    const code = airport.iataCode || airport.code;
    if (airport.name && code && airport.name !== code) {
      return airport.name + ' (' + code + ')';
    }
    return name;
  }

  function setFormState(activeForm) {
    const editOpen = activeForm === 'edit';
    const createOpen = activeForm === 'create';

    $('#flights-edit-card')
      .toggleClass('is-open', editOpen)
      .toggleClass('is-collapsed', !editOpen);
    $('#flights-create-card')
      .toggleClass('is-open', createOpen)
      .toggleClass('is-collapsed', !createOpen);

    $('#flights-edit-toggle-btn').html(
      '<i class="fa-solid fa-pen-to-square"></i> ' + (editOpen ? 'Ẩn form sửa' : 'Mở form sửa')
    );
    $('#flights-create-toggle-btn').html(
      '<i class="fa-solid fa-circle-plus"></i> ' + (createOpen ? 'Ẩn form' : 'Đăng ký chuyến bay')
    );
  }

  function openEditForm(item) {
    fill(item);
    setFormState('edit');
  }

  function openCreateForm() {
    setFormState('create');
  }

  function closeForms() {
    setFormState(null);
  }
 
  /* ────────────────────────────────────── */
  /*  TABLE ROW                             */
  /* ────────────────────────────────────── */
  function row(item) {
    const status = (item.status || 'WAITING').toUpperCase();
    const airlineName = (() => {
      const a = _airlines.find(x => String(x.id) === String(item.airlineId || item.airline_id));
      return a ? window.AdminAPI.escape(a.name) : (item.airlineId || item.airline_id || '–');
    })();
    return '<tr data-id="' + item.id + '">'
      + '<td style="color:var(--f-muted);font-size:12px;">' + window.AdminAPI.escape(item.id) + '</td>'
      + '<td><strong>' + window.AdminAPI.escape(item.flightNumber || item.flight_number || '') + '</strong></td>'
      + '<td>' + window.AdminAPI.escape(item.planeId || item.plane_id || '') + '</td>'
      + '<td>' + airlineName + '</td>'
      + '<td>' + window.AdminAPI.escape(getAirportLabel(item.departureAirportId || item.departure_airport_id || '')) + '</td>'
      + '<td>' + window.AdminAPI.escape(getAirportLabel(item.arrivalAirportId || item.arrival_airport_id || '')) + '</td>'
      + '<td><span class="s-badge s-' + status + '">' + status + '</span></td>'
      + '<td class="text-end" style="white-space:nowrap;">'
      + '<button class="fp-btn fp-btn-outline fp-btn-sm js-edit me-1"><i class="fa-solid fa-pen"></i></button>'
      + '<button class="fp-btn fp-btn-danger-ghost fp-btn-sm js-delete"><i class="fa-solid fa-trash"></i></button>'
      + '</td></tr>';
  }
 
  /* ────────────────────────────────────── */
  /*  FILL EDIT FORM                        */
  /* ────────────────────────────────────── */
  function fill(item) {
    $('#flights-edit-id').val(item.id || '');
    $('#flights-edit-number').val(item.flightNumber || item.flight_number || '');
    $('#flights-edit-plane-id').val(item.planeId || item.plane_id || '');
    $('#flights-edit-airline-id').val(item.airlineId || item.airline_id || '');
    $('#flights-edit-departure-airport-id').val(item.departureAirportId || item.departure_airport_id || '');
    $('#flights-edit-arrival-airport-id').val(item.arrivalAirportId || item.arrival_airport_id || '');
    $('#flights-edit-departure-time').val(toLocalInput(item.departureTime || item.departure_time));
    $('#flights-edit-arrival-time').val(toLocalInput(item.arrivalTime || item.arrival_time));
    $('#flights-edit-status').val((item.status || 'WAITING').toUpperCase());
    $('#flights-edit-reason').val('');
    // scroll right panel to top
    $('#flights-right-panel').scrollTop(0);
  }
 
  /* ────────────────────────────────────── */
  /*  PAGINATION                            */
  /* ────────────────────────────────────── */
  function renderPagination(pagination) {
    if (!pagination) {
      $('#flights-pagination-info').html('');
      $('#flights-pagination-nav').html('');
      return;
    }
    currentPage = pagination.currentPage;
    const total = pagination.totalItems ?? pagination.totalRecords ?? '?';
    $('#flights-pagination-info').html(
      'Trang <strong>' + pagination.currentPage + '</strong> / ' + pagination.totalPages +
      ' &nbsp;·&nbsp; ' + total + ' chuyến'
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
 
    $('#flights-pagination-nav').html(html);
  }
 
  /* ────────────────────────────────────── */
  /*  LOAD TABLE DATA                       */
  /* ────────────────────────────────────── */
  async function loadData(page) {
    page = page || 1;
    $('#flights-table-loading').show();
    try {
      const payload = await window.AdminAPI.request(
        '/api/flights?page=' + page + '&limit=' + PAGE_SIZE, { method: 'GET' }
      );
      const list = Array.isArray(payload.data) ? payload.data : [];
      $('#flights-table-body').html(
        list.map(row).join('') ||
        '<tr><td colspan="8" class="text-center text-muted py-4">Không có dữ liệu.</td></tr>'
      );
      renderPagination(payload.pagination);
      if (list.length) fill(list[0]);
    } finally {
      $('#flights-table-loading').hide();
    }
  }
 
  /* ────────────────────────────────────── */
  /*  LOAD DROPDOWN DATA                    */
  /* ────────────────────────────────────── */
  async function loadAirlines() {
    try {
      const res = await window.AdminAPI.request('/api/airlines?limit=200', { method: 'GET' });
      _airlines = Array.isArray(res.data) ? res.data : [];
 
      const opts = _airlines.map(a =>
        '<option value="' + a.id + '">' + window.AdminAPI.escape(a.name) +
        (a.code ? ' (' + a.code + ')' : '') + '</option>'
      ).join('');
      $('#flights-create-airline-id').html('<option value="">-- Chọn hãng bay --</option>' + opts);
    } catch (e) {
      $('#flights-create-airline-id').html('<option value="">-- Lỗi tải hãng bay --</option>');
    }
  }
 
  async function loadAirports() {
    try {
      const res = await window.AdminAPI.request('/api/airports?limit=500', { method: 'GET' });
      _airports = Array.isArray(res.data) ? res.data : [];
 
      const opts = _airports.map(a =>
        '<option value="' + a.id + '">' + window.AdminAPI.escape(a.name || a.iataCode || a.code) +
        (a.iataCode ? ' (' + a.iataCode + ')' : '') + '</option>'
      ).join('');
      const base = '<option value="">-- Chọn sân bay --</option>' + opts;
      $('#flights-create-departure-airport-id').html(base);
      $('#flights-create-arrival-airport-id').html(base);
    } catch (e) {
      const err = '<option value="">-- Lỗi tải sân bay --</option>';
      $('#flights-create-departure-airport-id, #flights-create-arrival-airport-id').html(err);
    }
  }
 
  async function loadPlanesByAirline(airlineId) {
    const $planeSelect = $('#flights-create-plane-id');
    if (!airlineId) {
      $planeSelect.html('<option value="">-- Chọn hãng bay trước --</option>');
      return;
    }
    $planeSelect.html('<option value="">-- Đang tải... --</option>');
    try {
      const res = await window.AdminAPI.request('/api/planes?airlineId=' + airlineId + '&limit=200', { method: 'GET' });
      _planes = Array.isArray(res.data) ? res.data : [];
      if (!_planes.length) {
        $planeSelect.html('<option value="">-- Không có máy bay --</option>');
        return;
      }
      const opts = _planes.map(p =>
        '<option value="' + p.id + '">' + window.AdminAPI.escape(p.model || p.name || 'Plane #' + p.id) +
        ' (ID: ' + p.id + ')' + '</option>'
      ).join('');
      $planeSelect.html('<option value="">-- Chọn máy bay --</option>' + opts);
    } catch (e) {
      $planeSelect.html('<option value="">-- Lỗi tải máy bay --</option>');
    }
  }
 
  async function fetchFlightCountForAirline(airlineId) {
    if (_flightCounts[airlineId] !== undefined) return;
    try {
      const res = await window.AdminAPI.request(
        '/api/flights/count?airlineId=' + airlineId, { method: 'GET' }
      );
      _flightCounts[airlineId] = res.count ?? res.data?.count ?? 0;
    } catch (_) {
      // fallback: count from loaded table
      _flightCounts[airlineId] = 0;
    }
  }
 
  async function updateFlightNumberPreview() {
    const airlineId = $('#flights-create-airline-id').val();
    if (!airlineId) {
      $('#flights-create-fn-text').text('–');
      $('#flights-create-fn-preview').removeClass('ready');
      return;
    }
    await fetchFlightCountForAirline(airlineId);
    const fn = buildFlightNumber(airlineId);
    $('#flights-create-fn-text').text(fn);
    $('#flights-create-fn-preview').toggleClass('ready', fn !== '–');
  }
 
  /* ────────────────────────────────────── */
  /*  BIND EVENTS                           */
  /* ────────────────────────────────────── */
  function bind() {
    /* refresh */
    $('#flights-refresh-btn').on('click.flights', function () {
      loadData(currentPage).catch(showErr);
    });
 
    /* pagination */
    $(document).on('click.flights', '#flights-pagination-nav button', function () {
      const page = Number($(this).data('page'));
      if (page) loadData(page).catch(showErr);
    });
 
    /* edit row */
    $('#flights-table-body').on('click.flights', '.js-edit', async function () {
      const id = $(this).closest('tr').data('id');
      try {
        const payload = await window.AdminAPI.request('/api/flights/' + id, { method: 'GET' });
        openEditForm(payload.data || {});
      } catch (err) { showErr(err); }
    });
 
    /* delete row */
    $('#flights-table-body').on('click.flights', '.js-delete', async function () {
      const id = $(this).closest('tr').data('id');
      if (!confirm('Xóa chuyến bay #' + id + '?')) return;
      try {
        await window.AdminAPI.request('/api/flights/' + id, { method: 'DELETE' });
        await loadData(currentPage);
      } catch (err) { showErr(err); }
    });
 
    /* ── EDIT FORM ── */
    $('#flights-edit-form').on('submit.flights', async function (e) {
      e.preventDefault();
      const id = $('#flights-edit-id').val();
      if (!id) return;
      const reason = $('#flights-edit-reason').val().trim();
      if (!reason) {
        window.AdminAPI.showMessage('#flights-alert', 'warning', 'Vui lòng nhập lý do cập nhật.');
        $('#flights-edit-reason').focus();
        return;
      }
      try {
        await window.AdminAPI.request('/api/flights/' + id, {
          method: 'PATCH',
          body: JSON.stringify({
            flightNumber:       $('#flights-edit-number').val().trim(),
            planeId:            Number($('#flights-edit-plane-id').val()),
            airlineId:          Number($('#flights-edit-airline-id').val()),
            departureAirportId: Number($('#flights-edit-departure-airport-id').val()),
            arrivalAirportId:   Number($('#flights-edit-arrival-airport-id').val()),
            departureTime:      new Date($('#flights-edit-departure-time').val()).toISOString(),
            arrivalTime:        new Date($('#flights-edit-arrival-time').val()).toISOString(),
            status:             $('#flights-edit-status').val(),
            reason,
          }),
        });
        window.AdminAPI.showMessage('#flights-alert', 'success', 'Cập nhật chuyến bay thành công!');
        await loadData(currentPage);
      } catch (err) { showErr(err); }
    });

    $('#flights-edit-toggle-btn').on('click.flights', function () {
      if ($('#flights-edit-card').hasClass('is-open')) {
        closeForms();
      } else {
        openEditForm({});
      }
    });
 
    /* ── CREATE FORM: airline changed → reload planes + preview ── */
    $('#flights-create-airline-id').on('change.flights', async function () {
      const airlineId = $(this).val();
      await loadPlanesByAirline(airlineId);
      await updateFlightNumberPreview();
    });
 
    /* ── CREATE FORM: departure changed → filter arrival options ── */
    $('#flights-create-departure-airport-id').on('change.flights', function () {
      const depId = $(this).val();
      const arrSelect = $('#flights-create-arrival-airport-id');
      const opts = _airports
        .filter(a => String(a.id) !== String(depId))
        .map(a =>
          '<option value="' + a.id + '">' + window.AdminAPI.escape(a.name || a.iataCode || a.code) +
          (a.iataCode ? ' (' + a.iataCode + ')' : '') + '</option>'
        ).join('');
      arrSelect.html('<option value="">-- Chọn sân bay đến --</option>' + opts);
    });

    $('#flights-create-toggle-btn').on('click.flights', function () {
      if ($('#flights-create-card').hasClass('is-open')) {
        closeForms();
      } else {
        openCreateForm();
      }
    });
 
    /* ── CREATE FORM submit ── */
    $('#flights-create-form').on('submit.flights', async function (e) {
      e.preventDefault();
      const airlineId = $('#flights-create-airline-id').val();
      if (!airlineId) {
        window.AdminAPI.showMessage('#flights-alert', 'warning', 'Vui lòng chọn hãng bay.');
        return;
      }
      await fetchFlightCountForAirline(airlineId);
      const flightNumber = buildFlightNumber(airlineId);
      try {
        await window.AdminAPI.request('/api/flights', {
          method: 'POST',
          body: JSON.stringify({
            flightNumber,
            planeId:            Number($('#flights-create-plane-id').val()),
            airlineId:          Number(airlineId),
            departureAirportId: Number($('#flights-create-departure-airport-id').val()),
            arrivalAirportId:   Number($('#flights-create-arrival-airport-id').val()),
            distance:           Number($('#flights-create-distance').val()),
            departureTime:      new Date($('#flights-create-departure-time').val()).toISOString(),
            arrivalTime:        new Date($('#flights-create-arrival-time').val()).toISOString(),
            status: 'WAITING',
          }),
        });
        // bump local counter so next preview is correct
        _flightCounts[airlineId] = (_flightCounts[airlineId] || 0) + 1;
        this.reset();
        $('#flights-create-fn-text').text('–');
        $('#flights-create-fn-preview').removeClass('ready');
        window.AdminAPI.showMessage('#flights-alert', 'success', 'Tạo chuyến bay ' + flightNumber + ' thành công!');
        await loadData(1);
      } catch (err) { showErr(err); }
    });
  }
 
  /* ────────────────────────────────────── */
  /*  INIT / DESTROY                        */
  /* ────────────────────────────────────── */
  window.AdminPages = window.AdminPages || {};
  window.AdminPages.flights = {
    init: function () {
      bind();
      closeForms();
      Promise.all([
        loadAirlines(),
        loadAirports(),
      ])
        .then(function () {
          return loadData(1);
        })
        .catch(showErr);
    },
    destroy: function () {
      $('#flights-refresh-btn').off('.flights');
      $('#flights-table-body').off('.flights');
      $('#flights-edit-form').off('.flights');
      $('#flights-create-form').off('.flights');
      $('#flights-create-airline-id').off('.flights');
      $('#flights-create-departure-airport-id').off('.flights');
      $('#flights-edit-toggle-btn').off('.flights');
      $('#flights-create-toggle-btn').off('.flights');
      $(document).off('.flights');
    },
  };
})();