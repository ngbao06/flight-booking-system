(function () {
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

  async function loadData() {
    const payload = await window.AdminAPI.request('/api/airlines', { method: 'GET' });
    const items = Array.isArray(payload.data) ? payload.data : [];
    renderRows(items);
    if (items.length && !selected) {
      fillEdit(items[0]);
    }
  }

  async function remove(id) {
    await window.AdminAPI.request('/api/airlines/' + id, { method: 'DELETE' });
  }

  function bind() {
    $('#airlines-refresh-btn').on('click.airlines', function () { loadData().catch(showErr); });

    $('#airlines-table-body').on('click.airlines', '.js-edit', function () {
      const id = $(this).closest('tr').data('id');
      const row = $(this).closest('tr').children('td');
      fillEdit({ id: id, code: row.eq(1).text().trim(), name: row.eq(2).text().trim(), status: row.eq(3).text().trim() });
    });

    $('#airlines-table-body').on('click.airlines', '.js-delete', async function () {
      const id = $(this).closest('tr').data('id');
      if (!confirm('Xóa hãng #' + id + '?')) return;
      try { await remove(id); await loadData(); }
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
        await loadData();
        window.AdminAPI.showMessage('#airlines-alert', 'success', 'Đã cập nhật hãng.');
      } catch (err) { showErr(err); }
    });

    $('#airlines-delete-btn').on('click.airlines', async function () {
      e.preventDefault();
      const id = $('#airlines-edit-id').val();
      if (!id || !confirm('Xóa hãng #' + id + '?')) return;
      try { 
        await remove(id); 
        await loadData(); 
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
        await loadData();
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
      loadData().catch(showErr);
    },
    destroy: function () {
      $('#airlines-refresh-btn').off('.airlines');
      $('#airlines-table-body').off('.airlines');
      $('#airlines-edit-form').off('.airlines');
      $('#airlines-delete-btn').off('.airlines');
      $('#airlines-create-form').off('.airlines');
    },
  };
})();
