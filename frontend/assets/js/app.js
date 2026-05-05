/**
 * app.js — Ứng dụng SPA chính + Logic trang Mua Vé
 *
 * Gộp từ: app.js + mua-ve.js
 * - Booking panel (trang chủ): tab buy/manage/status, airport dropdown, pax counter
 * - Navigation SPA: loadPage, loadComponent, sidebar/footer
 * - Auth: login, register, logout
 * - Mua Vé (initMuaVe): tìm kiếm chuyến bay, render VNA cards, chọn vé
 *
 * Giải quyết xung đột #btn-search-flight:
 *   - Handler app.js (đã comment) được xóa hoàn toàn.
 *   - Handler duy nhất là attachSearchButton() trong initMuaVe, dùng namespace .mva-search.
 *   - Tất cả handler app.js dùng namespace .app để có thể .off() sạch khi cần.
 *   - DOMContentLoaded của mua-ve.js được tích hợp vào luồng init() / loadMuaVePage().
 */

const BASE_API_URL = `http://localhost:3000/api`;

$(function () {
    'use strict';

    const $pageContent = $('#page-content');
    const $main = $('#main');
    const $sidebarContainer = $('#sidebar-container');
    const $footerContainer = $('#footer-container');

    // ══════════════════════════════════════════
    //  SHARED DATA & HELPERS
    // ══════════════════════════════════════════

    const DEFAULT_AIRPORTS = [
        { code: 'HAN', name: 'Sân bay Nội Bài',       city: 'Hà Nội, Việt Nam' },
        { code: 'SGN', name: 'Sân bay Tân Sơn Nhất',  city: 'TP. Hồ Chí Minh, Việt Nam' },
        { code: 'DAD', name: 'Sân bay Đà Nẵng',        city: 'Đà Nẵng, Việt Nam' },
        { code: 'CXR', name: 'Sân bay Cam Ranh',       city: 'Khánh Hòa, Việt Nam' },
        { code: 'PQC', name: 'Sân bay Phú Quốc',       city: 'Kiên Giang, Việt Nam' },
        { code: 'HUI', name: 'Sân bay Phú Bài',        city: 'Huế, Việt Nam' },
        { code: 'VII', name: 'Sân bay Vinh',            city: 'Nghệ An, Việt Nam' },
        { code: 'VCA', name: 'Sân bay Cần Thơ',        city: 'Cần Thơ, Việt Nam' },
        { code: 'BMV', name: 'Sân bay Buôn Ma Thuột',  city: 'Đắk Lắk, Việt Nam' },
        { code: 'DLI', name: 'Sân bay Liên Khương',    city: 'Lâm Đồng, Việt Nam' },
        { code: 'NHA', name: 'Sân bay Nha Trang',      city: 'Khánh Hòa, Việt Nam' },
        { code: 'UIH', name: 'Sân bay Phù Cát',        city: 'Bình Định, Việt Nam' },
        { code: 'BPH', name: 'Sân bay Tuy Hòa',        city: 'Phú Yên, Việt Nam' },
        { code: 'VDH', name: 'Sân bay Đồng Hới',       city: 'Quảng Bình, Việt Nam' },
        { code: 'BKK', name: 'Suvarnabhumi Airport',   city: 'Bangkok, Thái Lan' },
        { code: 'SIN', name: 'Changi Airport',          city: 'Singapore' },
        { code: 'ICN', name: 'Incheon Airport',         city: 'Seoul, Hàn Quốc' },
        { code: 'NRT', name: 'Narita Airport',          city: 'Tokyo, Nhật Bản' },
        { code: 'PEK', name: 'Beijing Capital Airport', city: 'Bắc Kinh, Trung Quốc' },
        { code: 'CDG', name: 'Charles de Gaulle',       city: 'Paris, Pháp' },
        { code: 'LHR', name: 'Heathrow Airport',        city: 'London, Anh' },
        { code: 'SYD', name: 'Kingsford Smith Airport', city: 'Sydney, Úc' },
    ];

    // State dùng chung toàn bộ app
    let airports    = [...DEFAULT_AIRPORTS];
    let fromAirport = airports[0]; // HAN
    let toAirport   = null;
    let paxCounts   = { adult: 1, child: 0, infant: 0 };

    const INLINE_HINTS = {
        buy:    'Nhập thông tin để tìm chuyến bay.',
        manage: 'Nhập seat number và last name để tra cứu.',
        status: 'Nhập số hiệu chuyến bay và ngày bay để tra cứu.'
    };

    // ── Normalize helpers ──
    function normalizeAirport(raw) {
        return {
            id:   raw.id   ?? raw.airportId   ?? raw.airport_id   ?? null,
            code: String(raw.code ?? raw.iataCode ?? raw.iata_code ?? '').toUpperCase(),
            name: raw.name ?? raw.airportName  ?? raw.airport_name ?? '',
            city: raw.city ?? raw.region       ?? ''
        };
    }

    function extractDataArray(payload) {
        if (!payload) return [];
        if (Array.isArray(payload)) return payload;
        if (Array.isArray(payload.data)) return payload.data;
        if (payload.data && typeof payload.data === 'object') return [payload.data];
        if (typeof payload === 'object' && !('success' in payload)) return [payload];
        return [];
    }

    function extractDataObject(payload) {
        const items = extractDataArray(payload);
        return items.length ? items[0] : null;
    }

    async function fetchJsonOrNull(url) {
        try {
            const r = await fetch(url, { credentials: 'include' });
            if (!r.ok) return null;
            return await r.json();
        } catch { return null; }
    }

    function getBadgeClass(status) {
        const s = String(status || '').toUpperCase();
        if (s.includes('DELAY'))  return 'badge-delayed';
        if (s.includes('CANCEL')) return 'badge-cancel';
        if (s.includes('BOARD'))  return 'badge-boarding';
        return 'badge-ontime';
    }

    function toIsoDateOnly(value) {
        if (!value) return '';
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) return String(value).slice(0, 10);
        return parsed.toISOString().slice(0, 10);
    }

    function getAirportLabelById(airportId) {
        const found = airports.find(a => Number(a.id) === Number(airportId));
        if (!found) return `#${airportId}`;
        return `${found.code} (${found.city || found.name})`;
    }

    // ── Mua-vé helpers ──
    function fmtVND(n) {
        if (n == null) return '—';
        return Number(n).toLocaleString('vi-VN') + '₫';
    }

    function fmtTime(iso) {
        if (!iso) return '—';
        return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    }

    function fmtDateVN(str) {
        if (!str) return '—';
        const [y, m, d] = str.split('-');
        return `${d}/${m}/${y}`;
    }

    function calcDuration(dep, arr) {
        if (!dep || !arr) return null;
        const mins = Math.round((new Date(arr) - new Date(dep)) / 60000);
        if (mins <= 0) return null;
        return `${Math.floor(mins / 60)}h ${String(mins % 60).padStart(2, '0')}m`;
    }

    function showToast(msg, type = 'success') {
        const area = document.getElementById('toast-area');
        if (!area) return;
        const el = document.createElement('div');
        el.className = `toast-msg ${type}`;
        el.innerHTML = `<span class="t-icon">${type === 'success' ? '✅' : '⚠️'}</span><span>${msg}</span>`;
        area.appendChild(el);
        setTimeout(() => el.remove(), 3600);
    }

    // ── Lotusmiles loyalty/voucher helpers ──
    const lotusAuthFetch = (url, options = {}) => {
        const headers = { ...(options.headers || {}) };
        const token = localStorage.getItem('authToken');
        if (token) headers.Authorization = `Bearer ${token}`;
        return fetch(url, {
            ...options,
            headers,
            credentials: 'include'
        });
    };

    function lotusFormatDiscount(item = {}) {
        const discountType = (item.discount_type || item.discountType || '').toUpperCase();
        const discountValue = Number(item.discount_value ?? item.discountValue ?? 0);
        if (discountType === 'PERCENT') {
            const ratio = discountValue > 1 ? discountValue / 100 : discountValue;
            return `${Math.round(ratio * 100)}%`;
        }
        return `${discountValue}`;
    }

    async function lotusFetchLoyaltyBalance() {
        try {
            const res = await lotusAuthFetch(`${BASE_API_URL}/loyalty/me`, { method: 'GET' });
            const json = await res.json();
            if (!json.success || !json.data) return 0;
            const balance = json.data.loyalty_points || json.data.loyaltyPoints || 0;
            return Number(balance);
        } catch {
            return 0;
        }
    }

    async function lotusFetchMyVouchers() {
        try {
            const res = await lotusAuthFetch(`${BASE_API_URL}/vouchers/mine`, { method: 'GET' });
            const json = await res.json();
            if (!json.success) return [];
            const data = json.data || [];
            return Array.isArray(data) ? data : (data.items || data);
        } catch {
            return [];
        }
    }

    async function lotusFetchRedeemableVouchers() {
        try {
            const res = await fetch(`${BASE_API_URL}/vouchers`, { credentials: 'include' });
            const json = await res.json();
            if (!json.success) return [];
            const data = json.data || [];
            const list = Array.isArray(data) ? data : (data.items || data);
            return list.filter(v => Number(v.point_cost || 0) > 0 && !v.is_deleted);
        } catch {
            return [];
        }
    }

    function renderLotusmilesLoyaltyPanel({ user, balance, myVouchers, redeemables }) {
        const $root = $('#lotusmiles-loyalty-root');
        if (!$root.length) return;

        const ownedHtml = myVouchers.length
            ? `<div class="lotus-list">${myVouchers.map(v => {
                const code = v.code || v.voucher?.code || 'N/A';
                const status = v.status || v.voucher_status || 'AVAILABLE';
                const discount = lotusFormatDiscount(v.voucher || v);
                return `
                    <div class="lotus-item">
                        <div>
                            <div class="lotus-code">${code}</div>
                            <div class="lotus-sub">Giảm: ${discount} • Trạng thái: ${status}</div>
                        </div>
                    </div>
                `;
            }).join('')}</div>`
            : '<div class="lotus-empty">Bạn chưa sở hữu voucher nào.</div>';

        const redeemHtml = redeemables.length
            ? `<div class="lotus-list">${redeemables.map(v => {
                const cost = Number(v.point_cost || 0);
                const disabled = balance < cost;
                return `
                    <div class="lotus-item">
                        <div>
                            <div class="lotus-code">${v.code || 'N/A'}</div>
                            <div class="lotus-sub">Giảm: ${lotusFormatDiscount(v)} • Cần ${cost} điểm</div>
                        </div>
                        <button class="lotus-redeem-btn" data-id="${v.id}" data-cost="${cost}" ${disabled ? 'disabled' : ''}>
                            ${disabled ? 'Không đủ điểm' : 'Đổi ngay'}
                        </button>
                    </div>
                `;
            }).join('')}</div>`
            : '<div class="lotus-empty">Hiện chưa có voucher đổi bằng điểm.</div>';

        $root.html(`
            <div class="lotus-loyalty-top">
                <div>
                    <h2 style="margin:0;font-size:1.7rem;color:var(--navy);">Lotusmiles của ${user?.full_name || user?.username || 'bạn'}</h2>
                    <div class="lotus-balance">Điểm hiện có: <strong>${balance}</strong></div>
                </div>
            </div>
            <div class="lotus-grid">
                <section class="lotus-block">
                    <h3>Voucher đang sở hữu</h3>
                    ${ownedHtml}
                </section>
                <section class="lotus-block">
                    <h3>Voucher có thể đổi</h3>
                    ${redeemHtml}
                </section>
            </div>
        `);
    }

    async function initLotusmilesLoyaltyPanel() {
        const $root = $('#lotusmiles-loyalty-root');
        if (!$root.length) return;

        $root.html('<div class="lotus-empty">Đang tải thông tin Loyalty...</div>');

        try {
            const meRes = await lotusAuthFetch(`${BASE_API_URL}/auth/me`);
            const meJson = await meRes.json();

            if (!meJson.success) {
                $root.html(`
                    <div class="lotus-empty">
                        Vui lòng đăng nhập để xem điểm và đổi voucher.
                        <div style="margin-top:10px;"><a href="#login" class="miles-card-link" data-url="pages/auth/login.html">Đăng nhập ngay <i class="fa-solid fa-arrow-right"></i></a></div>
                    </div>
                `);
                return;
            }

            const user = meJson.data || {};
            if (user.role !== 'PASSENGER') {
                $root.html('<div class="lotus-empty">Chỉ tài khoản hành khách mới sử dụng tính năng đổi voucher bằng điểm.</div>');
                return;
            }

            const [balance, myVouchers, redeemables] = await Promise.all([
                lotusFetchLoyaltyBalance(),
                lotusFetchMyVouchers(),
                lotusFetchRedeemableVouchers()
            ]);

            renderLotusmilesLoyaltyPanel({ user, balance, myVouchers, redeemables });
        } catch {
            $root.html('<div class="lotus-empty">Không thể tải dữ liệu Loyalty. Vui lòng thử lại.</div>');
        }
    }

    // ══════════════════════════════════════════
    //  AIRPORT DATA
    // ══════════════════════════════════════════

    async function loadAirports() {
        const payload = await fetchJsonOrNull(BASE_API_URL + `/airports`);
        const apiAirports = extractDataArray(payload)
            .map(normalizeAirport)
            .filter(a => a.code);

        if (apiAirports.length) airports = apiAirports;
        if (!fromAirport || !fromAirport.code) fromAirport = airports[0] || null;

        updateAirportDisplay('from', fromAirport);
        updateAirportDisplay('to', toAirport);
    }

    // ══════════════════════════════════════════
    //  BOOKING PANEL — TRANG CHỦ (pane-buy/manage/status)
    // ══════════════════════════════════════════

    // ── Tabs ──
    $(document).on('click.app', '.booking-tab[data-tab]', function () {
        const tab = $(this).data('tab');
        $('.booking-tab').removeClass('active');
        $(this).addClass('active');
        $('.booking-pane').addClass('d-none');
        $(`#pane-${tab}`).removeClass('d-none');
        closeAllDropdownsHome();
        resetPaneValidation(tab);
    });

    // ── Airport Field (pane-buy trang chủ) ──
    $(document).on('click.app', '#pane-buy .airport-field', function (e) {
        const $field = $(this);
        const id   = $field.attr('id');
        const ddId = id === 'field-from' ? 'dd-from' : 'dd-to';
        const $dd  = $(`#${ddId}`);
        const isOpen = $dd.hasClass('show');

        closeAllDropdownsHome();
        if (!isOpen) {
            $field.addClass('open');
            renderDropdownHome($dd, '');
            $dd.addClass('show');
            $dd.find('.airport-search-input').focus();
        }
        e.stopPropagation();
    });

    $(document).on('click.app', '#pane-buy .airport-dropdown', function (e) { e.stopPropagation(); });

    $(document).on('input.app', '#pane-buy .airport-search-input', function () {
        const $dd = $(this).closest('.airport-dropdown');
        renderDropdownHome($dd, $(this).val());
    });

    $(document).on('click.app', '#pane-buy .airport-item', function (e) {
        e.stopPropagation();
        const code    = $(this).data('code');
        const airport = airports.find(a => a.code === code);
        if (!airport) return;

        const $dd = $(this).closest('.airport-dropdown');
        if ($dd.attr('id') === 'dd-from') {
            fromAirport = airport;
            updateAirportDisplay('from', airport);
        } else {
            toAirport = airport;
            updateAirportDisplay('to', airport);
            $('#field-to').removeClass('is-invalid-field');
            setInlineMessage('buy', INLINE_HINTS.buy, false);
        }
        closeAllDropdownsHome();
    });

    function renderDropdownHome($dd, query) {
        const q = query.trim().toLowerCase();
        const filtered = q
            ? airports.filter(a =>
                a.code.toLowerCase().includes(q) ||
                a.name.toLowerCase().includes(q) ||
                a.city.toLowerCase().includes(q))
            : airports;

        let html = `<div class="airport-search-wrap">
            <input class="airport-search-input" type="text" placeholder="Tìm sân bay..." value="${query}"/>
        </div><div class="airport-list">`;

        if (!filtered.length) {
            html += `<div class="airport-item-empty">Không tìm thấy sân bay phù hợp</div>`;
        } else {
            filtered.forEach(a => {
                html += `<div class="airport-item" data-code="${a.code}">
                    <div class="ai-code">${a.code}</div>
                    <div class="ai-info">
                        <div class="ai-name">${a.name}</div>
                        <div class="ai-city">${a.city}</div>
                    </div>
                </div>`;
            });
        }
        html += '</div>';
        $dd.html(html);
    }

    function updateAirportDisplay(which, airport) {
        if (!airport) {
            $(`#val-${which}`).text(which === 'from' ? 'Chọn điểm đi' : 'Chọn điểm đến').addClass('placeholder-text');
            $(`#sub-${which}`).text('Nhấn để chọn sân bay');
            $(`#input-${which}`).val('');
            return;
        }
        $(`#val-${which}`).text(airport.code).removeClass('placeholder-text');
        $(`#sub-${which}`).text(airport.city || airport.name);
        $(`#input-${which}`).val(airport.code);
    }

    // ── Swap (trang chủ) ──
    $(document).on('click.app', '#pane-buy #btn-swap', function () {
        if (!toAirport) return;
        [fromAirport, toAirport] = [toAirport, fromAirport];
        updateAirportDisplay('from', fromAirport);
        updateAirportDisplay('to', toAirport);
        $(this).css('transition', 'transform .4s').css('transform', 'rotate(180deg)');
        setTimeout(() => $(this).css('transform', ''), 400);
    });

    // ── Passenger Dropdown ──
    $(document).on('click.app', '#pax-display', function (e) {
        e.stopPropagation();
        const $dd = $('#pax-dd');
        const isOpen = $dd.hasClass('show');
        closeAllDropdownsHome();
        if (!isOpen) $dd.addClass('show');
    });
    $(document).on('click.app', '#pax-dd', function (e) { e.stopPropagation(); });

    $(document).on('click.app', '.pax-btn', function () {
        const type = $(this).data('type');
        const dir  = parseInt($(this).data('dir'));
        paxCounts[type] = Math.max(0, paxCounts[type] + dir);
        if (type === 'adult' && paxCounts.adult < 1) paxCounts.adult = 1;
        $(`#cnt-${type}`).text(paxCounts[type]);
        updatePaxLabel();
    });

    $(document).on('click.app', '#pax-confirm', function () {
        $('#pax-dd').removeClass('show');
    });

    function updatePaxLabel() {
        const parts = [];
        if (paxCounts.adult)  parts.push(`${paxCounts.adult} Người lớn`);
        if (paxCounts.child)  parts.push(`${paxCounts.child} Trẻ em`);
        if (paxCounts.infant) parts.push(`${paxCounts.infant} Em bé`);
        $('#pax-label').text(parts.join(', '));
    }

    function setInlineMessage(type, message, isError = false) {
        const $el = $(`#${type}-inline-error`);
        if (!$el.length) return;
        $el.text(message || INLINE_HINTS[type] || '');
        $el.toggleClass('has-error', Boolean(isError));
    }

    function resetPaneValidation(type) {
        const pane = type || 'buy';
        $(`#pane-${pane}`).find('.is-invalid-field').removeClass('is-invalid-field');
        setInlineMessage(pane, INLINE_HINTS[pane], false);
    }

    function markInvalid(selector) {
        $(selector).addClass('is-invalid-field');
    }

    $(document).on('input.app change.app', '#dep-date, #ret-date, #seat-number, #passenger-lastname, #flight-number, #flight-date', function () {
        $(this).removeClass('is-invalid-field');
        const active = $('.booking-tab.active').data('tab') || 'buy';
        setInlineMessage(active, INLINE_HINTS[active], false);
    });

    $(document).on('click.app', '#field-to', function () {
        $('#field-to').removeClass('is-invalid-field');
        setInlineMessage('buy', INLINE_HINTS.buy, false);
    });

    function closeAllDropdownsHome() {
        $('.airport-field').removeClass('open');
        $('.airport-dropdown').removeClass('show');
        $('#pax-dd').removeClass('show');
    }

    $(document).on('click.app', function () { closeAllDropdownsHome(); });

    // ══════════════════════════════════════════
    //  #btn-search-flight — HANDLER DUY NHẤT, đăng ký ngay khi app khởi động
    //  Hoạt động cả ở trang chủ lẫn trang mua-ve.html
    // ══════════════════════════════════════════
    $(document).on('click.app', '#btn-search-flight', async function () {
        const from = $('#input-from').val();
        const to   = $('#input-to').val();
        const date = $('#dep-date').val();

        const missing = [];
        if (!to)   { $('#field-to').addClass('is-invalid-field');  missing.push('điểm đến'); }
        if (!date) { $('#dep-date').addClass('is-invalid-field');   missing.push('ngày đi'); }
        if (missing.length) {
            // Dùng setInlineMessage nếu có, fallback showToast nếu ở trang mua-ve
            if ($('#buy-inline-error').length) {
                setInlineMessage('buy', `Vui lòng nhập ${missing.join(' và ')}.`, true);
            } else {
                showToast(`Vui lòng nhập ${missing.join(' và ')}.`, 'error');
            }
            return;
        }

        const $btn         = $(this);
        const originalText = $btn.html();
        $btn.prop('disabled', true).html('<i class="fa-solid fa-spinner fa-spin me-2"></i> Đang tìm…');

        try {
            // Dùng mvAirports nếu đang ở trang mua-ve, fallback về airports trang chủ
            const airportList = (mvAirports && mvAirports.length) ? mvAirports : airports;
            const fromAP = airportList.find(a => a.code === from) || null;
            const toAP   = airportList.find(a => a.code === to)   || null;

            const params = new URLSearchParams();
            if (fromAP && fromAP.id) params.append('departureAirportId', fromAP.id);
            if (toAP   && toAP.id)   params.append('arrivalAirportId',   toAP.id);
            if (date)                params.append('departureTime', date);

            const apiUrl   = `${BASE_API_URL}/flights?${params.toString()}`;
            const response = await fetchJsonOrNull(apiUrl);
            let flights    = extractDataArray(response);

            allFlights = flights;

            // Nếu đang ở trang mua-ve (có #mv-results-area) thì render tại chỗ
            const resultsArea = document.getElementById('mv-results-area');
            if (resultsArea) {
                resultsArea.style.display = 'block';
                const hint = document.getElementById('mv-initial-hint');
                if (hint) hint.style.display = 'none';
                const titleEl = document.getElementById('mv-results-title');
                if (titleEl) titleEl.textContent = `Chuyến bay ${from} → ${to}`;
                const countEl = document.getElementById('mv-results-count');
                if (countEl) countEl.textContent = flights.length
                    ? `Tìm thấy ${flights.length} chuyến bay · Ngày ${fmtDateVN(date)}`
                    : '';
                renderVNAirlinesCards(sortFlights(flights, currentSort));
            } else {
                // Đang ở trang chủ: lưu data rồi chuyển sang trang mua-ve
                window.flightSearchData = { from, to, date,
                    adult: paxCounts.adult, child: paxCounts.child, infant: paxCounts.infant,
                    flights, timestamp: Date.now()
                };
                await loadMuaVePage();
            }
        } catch (err) {
            console.error('Search flights error:', err);
            showToast('Lỗi khi tìm kiếm. Vui lòng thử lại.', 'error');
        } finally {
            $btn.prop('disabled', false).html(originalText);
        }
    });

    // ── Quản lý đặt chỗ ──
    $(document).on('click.app', '#btn-search-booking', async function () {
        const seatNumber = $('#seat-number').val().trim().toUpperCase();
        const lastname   = $('#passenger-lastname').val().trim();
        const $res       = $('#booking-result');

        resetPaneValidation('manage');
        $res.empty();

        const missing = [];
        if (!seatNumber) { markInvalid('#seat-number');          missing.push('seat number'); }
        if (!lastname)   { markInvalid('#passenger-lastname');   missing.push('last name'); }
        if (missing.length) {
            setInlineMessage('manage', `Vui lòng nhập ${missing.join(' và ')}.`, true);
            return;
        }

        setInlineMessage('manage', 'Đang tra cứu thông tin vé...', false);
        $res.html(`<div class="text-center py-3"><div class="spinner mx-auto"></div></div>`);

        const seatPayload   = await fetchJsonOrNull(`/api/seats?seatNumber=${encodeURIComponent(seatNumber)}`);
        const seat          = extractDataObject(seatPayload);

        if (!seat || !(seat.id ?? seat.seat_id)) {
            setInlineMessage('manage', `Không tìm thấy ghế ${seatNumber}.`, true);
            $res.empty(); return;
        }

        const seatId        = seat.id ?? seat.seat_id;
        const ticketPayload = await fetchJsonOrNull(`/api/tickets?seatId=${encodeURIComponent(seatId)}`);
        const ticket        = extractDataObject(ticketPayload);

        if (!ticket) {
            setInlineMessage('manage', `Không tìm thấy vé ứng với ghế ${seatNumber}.`, true);
            $res.empty(); return;
        }

        const passengerLastName = String(ticket.passenger_lastname ?? ticket.passengerLastname ?? '').trim();
        if (passengerLastName.toLowerCase() !== lastname.toLowerCase()) {
            setInlineMessage('manage', 'Không có vé phù hợp với seat number và last name đã nhập.', true);
            $res.empty(); return;
        }

        const bookingId      = ticket.booking_id ?? ticket.bookingId;
        const bookingPayload = bookingId ? await fetchJsonOrNull(`/api/booking/${bookingId}`) : null;
        const booking        = extractDataObject(bookingPayload);

        const flightId       = booking?.flight_id ?? booking?.flightId;
        const flightPayload  = flightId ? await fetchJsonOrNull(`/api/flights/${flightId}`) : null;
        const flight         = extractDataObject(flightPayload);

        const fullPassenger = `${passengerLastName} ${(ticket.passenger_firstname ?? ticket.passengerFirstname ?? '')}`.trim();
        const badgeClass    = getBadgeClass(ticket.status);

        setInlineMessage('manage', 'Đã tìm thấy vé phù hợp.', false);
        $res.html(`
            <div class="result-card">
                <div class="rc-title"><i class="fa-solid fa-ticket me-2"></i>Thông tin vé</div>
                <div class="rc-row">
                    <div class="rc-item"><div class="rc-label">Seat Number</div><div class="rc-val">${seat.seat_number ?? seat.seatNumber ?? seatNumber}</div></div>
                    <div class="rc-item"><div class="rc-label">Mã vé</div><div class="rc-val">${ticket.ticket_number ?? ticket.ticketNumber ?? '-'}</div></div>
                    <div class="rc-item"><div class="rc-label">Hành khách</div><div class="rc-val">${fullPassenger || '-'}</div></div>
                    <div class="rc-item"><div class="rc-label">Booking ID</div><div class="rc-val">${bookingId ?? '-'}</div></div>
                    <div class="rc-item"><div class="rc-label">Chuyến bay</div><div class="rc-val">${flight?.flight_number ?? flight?.flightNumber ?? '-'}</div></div>
                    <div class="rc-item"><div class="rc-label">Ngày xuất vé</div><div class="rc-val">${ticket.issue_date ?? ticket.issueDate ?? '-'}</div></div>
                    <div class="rc-item"><div class="rc-label">Giá cuối</div><div class="rc-val">${ticket.final_price ?? ticket.finalPrice ?? '-'}</div></div>
                    <div class="rc-item"><div class="rc-label">Trạng thái</div>
                        <div class="rc-val"><span class="flight-status-badge ${badgeClass}">${ticket.status ?? 'UNKNOWN'}</span></div>
                    </div>
                </div>
            </div>`);
    });

    // ── Trạng thái chuyến bay ──
    $(document).on('click.app', '#btn-check-flight', async function () {
        const flightNo   = $('#flight-number').val().trim().toUpperCase();
        const flightDate = $('#flight-date').val();
        const $res       = $('#flight-status-result');

        resetPaneValidation('status');
        $res.empty();

        const missing = [];
        if (!flightNo)   { markInvalid('#flight-number'); missing.push('số hiệu chuyến bay'); }
        if (!flightDate) { markInvalid('#flight-date');   missing.push('ngày bay'); }
        if (missing.length) {
            setInlineMessage('status', `Vui lòng nhập ${missing.join(' và ')}.`, true);
            return;
        }

        setInlineMessage('status', 'Đang tra cứu trạng thái chuyến bay...', false);
        $res.html(`<div class="text-center py-3"><div class="spinner mx-auto"></div></div>`);

        const flightsPayload = await fetchJsonOrNull(`/api/flights?flightNumber=${encodeURIComponent(flightNo)}`);
        const flights        = extractDataArray(flightsPayload);
        const matched        = flights.find(f => toIsoDateOnly(f.departure_time ?? f.departureTime) === flightDate);

        if (!matched) {
            setInlineMessage('status', 'Không tìm thấy chuyến bay phù hợp với số hiệu và ngày bay đã chọn.', true);
            $res.empty(); return;
        }

        const depAirportId = matched.departure_airport_id ?? matched.departureAirportId;
        const arrAirportId = matched.arrival_airport_id   ?? matched.arrivalAirportId;
        const status       = matched.status ?? 'UNKNOWN';
        const route        = `${getAirportLabelById(depAirportId)} -> ${getAirportLabelById(arrAirportId)}`;

        setInlineMessage('status', 'Đã tìm thấy trạng thái chuyến bay.', false);
        $res.html(`
            <div class="result-card">
                <div class="rc-title"><i class="fa-solid fa-satellite-dish me-2"></i>Trạng thái chuyến bay ${matched.flight_number ?? matched.flightNumber}</div>
                <div class="rc-row">
                    <div class="rc-item"><div class="rc-label">Hành trình</div><div class="rc-val">${route}</div></div>
                    <div class="rc-item"><div class="rc-label">Giờ cất cánh</div><div class="rc-val">${matched.departure_time ?? matched.departureTime ?? '-'}</div></div>
                    <div class="rc-item"><div class="rc-label">Giờ hạ cánh</div><div class="rc-val">${matched.arrival_time ?? matched.arrivalTime ?? '-'}</div></div>
                    <div class="rc-item"><div class="rc-label">Máy bay</div><div class="rc-val">${matched.plane_id ?? matched.planeId ?? '-'}</div></div>
                    <div class="rc-item"><div class="rc-label">Trạng thái</div>
                        <div class="rc-val"><span class="flight-status-badge ${getBadgeClass(status)}">${status}</span></div>
                    </div>
                </div>
            </div>`);
    });

    // ══════════════════════════════════════════
    //  MUA VÉ — initMuaVe()
    //  Gọi từ: loadMuaVePage() (AJAX) hoặc DOMContentLoaded (standalone)
    // ══════════════════════════════════════════

    // State riêng cho trang mua vé
    let mvAirports   = [];
    let mvFrom       = null;
    let mvTo         = null;
    let allFlights   = [];
    let currentSort  = 'price';

    function mvCloseAllDropdowns() {
        $('#mv-search-panel .airport-field').removeClass('open');
        $('#mv-search-panel .airport-dropdown').removeClass('show');
    }

    function mvRenderDropdown($dd, query) {
        if (!$dd || !$dd.length || !mvAirports.length) return;
        const q        = (query || '').trim().toLowerCase();
        const filtered = q
            ? mvAirports.filter(a =>
                a.code.toLowerCase().includes(q) ||
                a.name.toLowerCase().includes(q) ||
                a.city.toLowerCase().includes(q))
            : mvAirports;

        let html = `<div class="airport-search-wrap">
            <input class="airport-search-input" type="text" placeholder="Tìm sân bay..." value="${query}"/>
        </div><div class="airport-list">`;

        if (!filtered.length) {
            html += `<div class="airport-item-empty">Không tìm thấy sân bay phù hợp</div>`;
        } else {
            filtered.forEach(a => {
                html += `<div class="airport-item" data-code="${a.code}">
                    <div class="ai-code">${a.code}</div>
                    <div class="ai-info">
                        <div class="ai-name">${a.name}</div>
                        <div class="ai-city">${a.city}</div>
                    </div>
                </div>`;
            });
        }
        html += '</div>';
        $dd.html(html);
    }

    function mvUpdateAirportDisplay(which, airport) {
        if (!airport) {
            $(`#val-${which}`).text(which === 'from' ? 'Chọn điểm đi' : 'Chọn điểm đến').addClass('placeholder-text');
            $(`#sub-${which}`).text('Nhấn để chọn sân bay');
            $(`#input-${which}`).val('');
            return;
        }
        $(`#val-${which}`).text(airport.code).removeClass('placeholder-text');
        $(`#sub-${which}`).text(airport.city || airport.name);
        $(`#input-${which}`).val(airport.code);
    }

    async function mvLoadAirports() {
        try {
            const payload      = await fetchJsonOrNull(BASE_API_URL + `/airports`);
            const apiAirports  = extractDataArray(payload).map(normalizeAirport).filter(a => a.code);
            mvAirports         = apiAirports.length ? apiAirports : DEFAULT_AIRPORTS;
        } catch {
            mvAirports = DEFAULT_AIRPORTS;
        }
        if (!mvFrom || !mvFrom.code) mvFrom = mvAirports[0] || null;
        mvUpdateAirportDisplay('from', mvFrom);
        mvUpdateAirportDisplay('to', mvTo);
    }

    function attachAirportFieldClick() {
        $(document).off('click.mva', '#mv-search-panel .airport-field')
            .on('click.mva', '#mv-search-panel .airport-field', function (e) {
                const $field = $(this);
                const ddId   = $field.attr('id') === 'field-from' ? 'dd-from' : 'dd-to';
                const $dd    = $(`#${ddId}`);
                const isOpen = $dd.hasClass('show');

                mvCloseAllDropdowns();
                if (!isOpen) {
                    $field.addClass('open');
                    mvRenderDropdown($dd, '');
                    $dd.addClass('show');
                    $dd.find('.airport-search-input').focus();
                }
                e.stopPropagation();
            });
    }

    function attachAirportSearchInput() {
        $(document).off('input.mva-airport-search', '#mv-search-panel .airport-search-input')
            .on('input.mva-airport-search', '#mv-search-panel .airport-search-input', function () {
                mvRenderDropdown($(this).closest('.airport-dropdown'), $(this).val());
            });
    }

    function attachAirportItemSelect() {
        $(document).off('click.mva-airport-item', '#mv-search-panel .airport-item')
            .on('click.mva-airport-item', '#mv-search-panel .airport-item', function (e) {
                e.stopPropagation();
                const code    = $(this).data('code');
                const airport = mvAirports.find(a => a.code === code);
                if (!airport) return;

                const $dd = $(this).closest('.airport-dropdown');
                if ($dd.attr('id') === 'dd-from') {
                    mvFrom = airport;
                    mvUpdateAirportDisplay('from', airport);
                } else {
                    mvTo = airport;
                    mvUpdateAirportDisplay('to', airport);
                    $('#field-to').removeClass('is-invalid-field');
                }
                mvCloseAllDropdowns();
            });
    }

    function attachSwapButton() {
        $(document).off('click.mva-swap', '#mv-search-panel #btn-swap')
            .on('click.mva-swap', '#mv-search-panel #btn-swap', function () {
                if (!mvTo) return;
                [mvFrom, mvTo] = [mvTo, mvFrom];
                mvUpdateAirportDisplay('from', mvFrom);
                mvUpdateAirportDisplay('to', mvTo);
                $(this).css('transition', 'transform .4s').css('transform', 'rotate(180deg)');
                setTimeout(() => $(this).css('transform', ''), 400);
            });
    }

    function attachSortButtons() {
        $(document).off('click.mva-sort', '#mv-search-panel .sort-btn')
            .on('click.mva-sort', '#mv-search-panel .sort-btn', function () {
                document.querySelectorAll('#mv-search-panel .sort-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                currentSort = this.dataset.sort;
                if (allFlights.length) renderVNAirlinesCards(sortFlights(allFlights, currentSort));
            });
    }

    function sortFlights(flights, mode) {
        const key = {
            price:     f => f.basePrice || f.economyPrice || f.price || 0,
            departure: f => new Date(f.departureTime || f.departure_time),
            duration:  f => new Date(f.arrivalTime   || f.arrival_time) - new Date(f.departureTime || f.departure_time)
        }[mode];
        return key ? [...flights].sort((a, b) => key(a) - key(b)) : [...flights];
    }

    async function fetchFlightPricing(flightId) {
        try {
            const response = await fetchJsonOrNull(`${BASE_API_URL}/seats?flightId=${flightId}`);
            const seats    = extractDataArray(response);

            const pricing = {
                ECONOMY:  { minPrice: Infinity, available: 0 },
                BUSINESS: { minPrice: Infinity, available: 0 },
                FIRST:    { minPrice: Infinity, available: 0 }
            };

            seats.forEach(seat => {
                if (seat.status !== 'AVAILABLE') return;
                const cls = ['BUSINESS', 'FIRST'].includes(seat.class) ? seat.class : 'ECONOMY';
                pricing[cls].available++;
                if (seat.price < pricing[cls].minPrice) pricing[cls].minPrice = seat.price;
            });

            for (const key in pricing) {
                if (pricing[key].minPrice === Infinity) pricing[key].minPrice = null;
            }
            return pricing;
        } catch (err) {
            console.error(`Lỗi lấy giá chuyến ${flightId}:`, err);
            return null;
        }
    }

    async function renderVNAirlinesCards(flights) {
        const listContainer = document.getElementById('mv-flight-list');
        if (!listContainer) return;

        if (!flights.length) {
            listContainer.innerHTML = `
                <div class="state-box">
                    <div class="state-icon">🛫</div>
                    <div class="state-title">Không tìm thấy chuyến bay</div>
                    <div class="state-sub">Thử thay đổi ngày bay hoặc điểm đến khác.</div>
                </div>`;
            return;
        }

        listContainer.innerHTML = `<div class="text-center p-5"><i class="fa-solid fa-spinner fa-spin fs-2"></i> Đang tải giá vé...</div>`;
        let html = '';

        for (const flight of flights) {
            const depTime  = flight.departure_time || flight.departureTime;
            const arrTime  = flight.arrival_time   || flight.arrivalTime;
            const duration = calcDuration(depTime, arrTime);

            const depId  = flight.departure_airport_id || flight.departureAirportId;
            const arrId  = flight.arrival_airport_id   || flight.arrivalAirportId;
            const depAP  = mvAirports.find(a => Number(a.id) === Number(depId));
            const arrAP  = mvAirports.find(a => Number(a.id) === Number(arrId));
            const depCode = depAP ? depAP.code : '';
            const arrCode = arrAP ? arrAP.code : '';

            const pricing = await fetchFlightPricing(flight.id);
            if (!pricing) continue;

            html += `
            <div class="vna-card mb-4 shadow-lg" data-flight-id="${flight.id}">
                <div class="vna-info-sec">
                    <div class="row w-100 align-items-center">
                        <div class="col-md-5 vna-route-col">
                            <div class="d-flex justify-content-between align-items-center mb-1">
                                <span class="vna-time">${fmtTime(depTime)}</span>
                                <div class="vna-line">Bay thẳng</div>
                                <span class="vna-time">${fmtTime(arrTime)}</span>
                            </div>
                            <div class="d-flex justify-content-between">
                                <div class="text-start"><div class="vna-code">${depCode}</div></div>
                                <div class="text-end"><div class="vna-code">${arrCode}</div></div>
                            </div>
                        </div>
                        <div class="col-md-7 vna-detail-col">
                            <div class="vna-text-sm"><i class="fa-regular fa-clock me-1"></i> Thời gian bay: ${duration}</div>
                            <div class="vna-text-sm mt-1">
                                <i class="fa-solid fa-plane-departure me-1"></i> ${flight.flight_number || flight.flightNumber} Khai thác bởi BAirlines <i class="fa-solid fa-leaf text-warning ms-1"></i>
                            </div>
                            <a href="#" class="vna-link mt-2 d-inline-block">Chi tiết hành trình <i class="fa-solid fa-arrow-up-right-from-square" style="font-size:10px;"></i></a>
                        </div>
                    </div>
                </div>

                <div class="vna-price-sec eco" ${pricing.ECONOMY.minPrice
                    ? `onclick="mvSelectFlight(${flight.id}, 'ECONOMY', ${pricing.ECONOMY.minPrice})"`
                    : `onclick="showToast('Hạng Phổ thông đã hết chỗ.', 'error')"`}>
                    ${pricing.ECONOMY.available > 0 && pricing.ECONOMY.available <= 10
                        ? `<div class="vna-badge">${pricing.ECONOMY.available} ghế còn lại</div>` : ''}
                    <i class="fa-solid fa-tag vna-tag"></i>
                    <div class="vna-class-name">PHỔ THÔNG</div>
                    ${pricing.ECONOMY.minPrice ? `
                        <div class="vna-price-lbl">từ</div>
                        <div class="vna-price-val">${fmtVND(pricing.ECONOMY.minPrice)}</div>
                        <div class="vna-currency">VND</div>
                    ` : `<div class="vna-price-val mt-2">Hết chỗ</div>`}
                    <i class="fa-solid fa-chevron-down mt-auto mb-2"></i>
                </div>

                <div class="vna-price-sec prem" ${pricing.BUSINESS.minPrice
                    ? `onclick="mvSelectFlight(${flight.id}, 'BUSINESS', ${pricing.BUSINESS.minPrice})"`
                    : `onclick="showToast('Hạng Thương gia đã hết chỗ.', 'error')"`}>
                    <i class="fa-solid fa-tag vna-tag"></i>
                    <div class="vna-class-name">THƯƠNG GIA</div>
                    ${pricing.BUSINESS.minPrice ? `
                        <div class="vna-price-lbl">từ</div>
                        <div class="vna-price-val">${fmtVND(pricing.BUSINESS.minPrice)}</div>
                        <div class="vna-currency">VND</div>
                    ` : `<div class="vna-price-val mt-2">Hết chỗ</div>`}
                    <i class="fa-solid fa-chevron-down mt-auto mb-2"></i>
                </div>

                <div class="vna-price-sec biz" ${pricing.FIRST.minPrice
                    ? `onclick="mvSelectFlight(${flight.id}, 'FIRST', ${pricing.FIRST.minPrice})"`
                    : `onclick="showToast('Hạng Nhất đã hết chỗ.', 'error')"`}>
                    ${pricing.FIRST.available > 0 && pricing.FIRST.available <= 5
                        ? `<div class="vna-badge bg-teal">${pricing.FIRST.available} ghế còn lại</div>` : ''}
                    <i class="fa-solid fa-tag vna-tag"></i>
                    <div class="vna-class-name">HẠNG NHẤT</div>
                    ${pricing.FIRST.minPrice ? `
                        <div class="vna-price-lbl">từ</div>
                        <div class="vna-price-val">${fmtVND(pricing.FIRST.minPrice)}</div>
                        <div class="vna-currency">VND</div>
                    ` : `<div class="vna-price-val mt-2">Hết chỗ</div>`}
                    <i class="fa-solid fa-chevron-down mt-auto mb-2"></i>
                </div>
            </div>`;
        }

        listContainer.innerHTML = html;
    }

    // ── Public: chọn chuyến bay ──
    window.mvSelectFlight = function (flightId, classType, price) {
        const f = allFlights.find(x => Number(x.id) === Number(flightId));
        if (!f) return;

        if (!price) { showToast('Hạng ghế này hiện đã hết chỗ.', 'error'); return; }

        const num   = f?.flightNumber || f?.flight_number || flightId;
        const depId = f.departure_airport_id || f.departureAirportId;
        const arrId = f.arrival_airport_id   || f.arrivalAirportId;
        const depAP = mvAirports.find(a => Number(a.id) === Number(depId));
        const arrAP = mvAirports.find(a => Number(a.id) === Number(arrId));

        const classMap = { ECONOMY: 'Phổ thông', BUSINESS: 'Thương gia', FIRST: 'Hạng Nhất' };

        const bookingData = {
            flight:           f,
            classType,
            basePrice:        price,
            departureAirport: depAP,
            arrivalAirport:   arrAP,
            passengers: {
                adult:  parseInt($('#cnt-adult').text())  || 1,
                child:  parseInt($('#cnt-child').text())  || 0,
                infant: parseInt($('#cnt-infant').text()) || 0
            }
        };

        sessionStorage.setItem('selectedFlightBooking', JSON.stringify(bookingData));
        sessionStorage.removeItem('currentBookingStep');
        showToast(`Đã chọn chuyến ${num} - Hạng: ${classMap[classType] || classType}. Đang chuyển trang...`, 'success');
        setTimeout(() => { window.location.href = 'pages/booking/index.html'; }, 1200);
    };

    // ── Khởi tạo trang Mua Vé (gọi sau khi HTML đã có trong DOM) ──
    window.initMuaVe = async function () {
        await mvLoadAirports();

        const now      = new Date();
        const today    = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const depEl    = document.getElementById('dep-date');
        if (depEl) {
            depEl.setAttribute('min', today);
            if (!depEl.value) depEl.value = today;
        }

        attachAirportFieldClick();
        attachAirportSearchInput();
        attachAirportItemSelect();
        attachSwapButton();
        attachSortButtons();

        $(document).off('click.mva-dropdown').on('click.mva-dropdown', mvCloseAllDropdowns);
        $('#mv-search-panel .airport-dropdown').off('click.mva-dd').on('click.mva-dd', e => e.stopPropagation());

        // Khôi phục kết quả tìm kiếm nếu được điều hướng từ trang chủ
        const searchData = window.flightSearchData || null;
        let sessionData  = null;

        if (!searchData) {
            try {
                const stored = sessionStorage.getItem('flightSearchResults');
                if (stored) sessionData = JSON.parse(stored);
            } catch { /* ignore */ }
        }

        const dataSource = searchData || sessionData;
        if (dataSource) {
            const { from, to, date, flights } = dataSource;
            const apFrom = mvAirports.find(a => a.code === from);
            const apTo   = mvAirports.find(a => a.code === to);

            if (apFrom) { mvFrom = apFrom; mvUpdateAirportDisplay('from', apFrom); }
            if (apTo)   { mvTo   = apTo;   mvUpdateAirportDisplay('to',   apTo); }
            if (date && depEl) depEl.value = date;

            if (flights && flights.length) {
                allFlights = flights;
                const resultsArea = document.getElementById('mv-results-area');
                if (resultsArea) resultsArea.style.display = 'block';
                const hint = document.getElementById('mv-initial-hint');
                if (hint) hint.style.display = 'none';
                const titleEl = document.getElementById('mv-results-title');
                if (titleEl) titleEl.textContent = `Chuyến bay ${from} → ${to}`;
                const countEl = document.getElementById('mv-results-count');
                if (countEl) countEl.textContent = `Tìm thấy ${flights.length} chuyến bay · Ngày ${fmtDateVN(date)}`;
                renderVNAirlinesCards(sortFlights(flights, currentSort));
            }

            window.flightSearchData = null;
            if (sessionData) sessionStorage.removeItem('flightSearchResults');
        }
    };

    // ══════════════════════════════════════════
    //  LOAD MUA-VE PAGE (AJAX vào SPA)
    // ══════════════════════════════════════════

    async function loadMuaVePage() {
        try {
            const response = await fetch('./pages/booking/mua-ve.html');
            const html     = await response.text();
            const parser   = new DOMParser();
            const doc      = parser.parseFromString(html, 'text/html');
            const content  = doc.querySelector('#page-content');

            if (content) {
                $pageContent.html(content.innerHTML);
                window.scrollTo(0, 0);
                if (typeof window.initMuaVe === 'function') window.initMuaVe();
            }
        } catch (err) {
            console.error('Failed to load mua-ve page:', err);
            alert('Lỗi khi tải trang mua vé. Vui lòng thử lại.');
        }
    }

    // ══════════════════════════════════════════
    //  UI CHUNG
    // ══════════════════════════════════════════

    function loadPageStyle(href) {
        const cleanHref = href.replace('../../', '');
        if (!document.querySelector(`link[href="${href}"]`)) {
            const link   = document.createElement('link');
            link.rel     = 'stylesheet';
            link.href    = cleanHref;
            document.head.appendChild(link);
        }
    }

    function initDynamicScripts() {
        $('.booking-tab, .hero-slide-btn, .service-menu-item, .dest-filter, .tab-btn')
            .off('click').on('click', function () {
                $(this).addClass('active').siblings().removeClass('active');
            });

        $('.booking-swap').off('click').on('click', function () {
            $(this).css('transition', 'transform 0.4s').css('transform', 'rotate(180deg)');
            setTimeout(() => $(this).css('transform', ''), 400);
        });

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting)
                    $(entry.target).css({ opacity: '1', transform: 'translateY(0)' });
            });
        }, { threshold: 0.1 });

        $('.anim').each(function () {
            $(this).css({ opacity: '0', transform: 'translateY(20px)', transition: 'all 0.6s' });
            observer.observe(this);
        });

        updatePaxLabel();
        setInlineMessage('buy',    INLINE_HINTS.buy,    false);
        setInlineMessage('manage', INLINE_HINTS.manage, false);
        setInlineMessage('status', INLINE_HINTS.status, false);

        const now      = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

        const $depDate = $('#dep-date');
        if ($depDate.length) {
            $depDate.attr('min', todayStr);
            if (!$depDate.val()) $depDate.val(todayStr);
        }
        const $flightDate = $('#flight-date');
        if ($flightDate.length && !$flightDate.val()) $flightDate.val(todayStr);

        updateAirportDisplay('from', fromAirport);
        updateAirportDisplay('to',   toAirport);

        initLotusmilesLoyaltyPanel();
    }

    $(document)
        .off('click.app-lotus-redeem', '#lotusmiles-loyalty-root .lotus-redeem-btn')
        .on('click.app-lotus-redeem', '#lotusmiles-loyalty-root .lotus-redeem-btn', async function () {
            const voucherId = Number($(this).data('id'));
            const pointCost = Number($(this).data('cost')) || 0;

            const latestBalance = await lotusFetchLoyaltyBalance();
            if (latestBalance < pointCost) {
                alert('Điểm hiện tại không đủ để đổi voucher này.');
                await initLotusmilesLoyaltyPanel();
                return;
            }

            if (!confirm('Xác nhận đổi điểm lấy voucher này?')) return;

            try {
                const res = await lotusAuthFetch(`${BASE_API_URL}/vouchers/redeem`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ voucherId })
                });
                const json = await res.json();
                if (!json.success) throw new Error(json.message || 'Đổi voucher thất bại');

                alert('Đổi voucher thành công. Danh sách sẽ được cập nhật.');
                await initLotusmilesLoyaltyPanel();
            } catch (err) {
                alert(err.message || 'Có lỗi khi đổi voucher');
            }
        });

    // ══════════════════════════════════════════
    //  SIDEBAR & NAVIGATION
    // ══════════════════════════════════════════

    $(document).on('click.app', '#hamburger', function () {
        $('#sidebar').toggleClass('open');
        $('#overlay').toggleClass('show');
        $('#hamburger').hide();
    });

    $(document).on('click.app', '#overlay', function () {
        $('#sidebar').removeClass('open');
        $('#hamburger').show();
        $(this).removeClass('show');
    });

    function setActiveSidebarLink() {
        const hash = window.location.hash || '#index';
        $('.sidebar-link').each(function () {
            $(this).toggleClass('active', `#${$(this).data('page')}` === hash);
        });
    }

    // ══════════════════════════════════════════
    //  AUTH
    // ══════════════════════════════════════════

    function showAuthMessage(formId, message, isError = false) {
        const $el = $(`#${formId}-message`);
        if (!$el.length) return;
        $el.html(`<div class="alert ${isError ? 'alert-danger' : 'alert-success'}" style="font-size:13px;padding:10px 15px;margin-bottom:0;">${message}</div>`).show();
    }

    function clearAuthMessage(formId) {
        $(`#${formId}-message`).empty().hide();
    }

    $(document).on('submit', '#loginForm', function (e) {
        e.preventDefault();
        const $form   = $(this);
        const $button = $form.find('button[type="submit"]');
        const origBtn = $button.html();

        const data = {
            username: $form.find('input[name="username"]').val().trim(),
            password: $form.find('input[name="password"]').val().trim()
        };
        if (!data.username || !data.password) {
            showAuthMessage('loginForm', 'Vui lòng nhập đầy đủ tài khoản và mật khẩu.', true);
            return;
        }

        $button.html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Đang xử lý...').prop('disabled', true);
        clearAuthMessage('loginForm');

        $.ajax({
            url: `${BASE_API_URL}/auth/login`,
            type: 'POST', contentType: 'application/json',
            data: JSON.stringify(data),
            xhrFields: { withCredentials: true }
        })
        .done(res => {
            const token = res?.data?.token || res?.token;
            const role  = res?.data?.user?.role || res?.data?.role || res?.role;
            if (token) localStorage.setItem('authToken', token);
            if (role)  localStorage.setItem('userRole', role);

            if (role === 'ADMIN') {
                showAuthMessage('loginForm', 'Đăng nhập thành công! Đang chuyển hướng...', false);
                setTimeout(() => window.location.href = 'pages/admin/index.html', 1000);
            } else {
                showAuthMessage('loginForm', 'Đăng nhập thành công! Đang tải lại trang...', false);
                setTimeout(() => { window.location.hash = '#index'; window.location.reload(); }, 1500);
            }
        })
        .fail(err => {
            showAuthMessage('loginForm', err.responseJSON?.message || 'Đăng nhập thất bại. Vui lòng thử lại.', true);
            $button.html(origBtn).prop('disabled', false);
        });
    });

    $(document).on('submit', '#registerForm', function (e) {
        e.preventDefault();
        const $form   = $(this);
        const $button = $form.find('button[type="submit"]');
        const origBtn = $button.html();

        const data = {
            username:  $form.find('input[name="email"]').val(),
            email:     $form.find('input[name="email"]').val(),
            password:  $form.find('input[name="password"]').val(),
            full_name: $form.find('input[name="fullname"]').val(),
            phone:     $form.find('input[name="phone"]').val(),
            role: 'PASSENGER'
        };

        if (!data.email || !data.password || !data.full_name) {
            showAuthMessage('registerForm', 'Vui lòng điền các trường bắt buộc.', true); return;
        }
        if (data.password.length < 6) {
            showAuthMessage('registerForm', 'Mật khẩu phải có ít nhất 6 ký tự.', true); return;
        }

        $button.html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Đang xử lý...').prop('disabled', true);
        clearAuthMessage('registerForm');

        $.ajax({
            url: `${BASE_API_URL}/auth/register`,
            type: 'POST', contentType: 'application/json',
            data: JSON.stringify(data),
            xhrFields: { withCredentials: true }
        })
        .done(() => {
            showAuthMessage('registerForm', 'Đăng ký thành công! Đang chuyển đến trang đăng nhập.', false);
            setTimeout(() => $('.ls-btn.login').trigger('click'), 2000);
        })
        .fail(err => {
            showAuthMessage('registerForm', err.responseJSON?.message || 'Đăng ký thất bại. Vui lòng thử lại.', true);
            $button.html(origBtn).prop('disabled', false);
        });
    });

    $(document).on('click.app', '#btnLogout', function () {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userRole');
        window.location.hash = '#index';
        window.location.reload();
    });

    // ══════════════════════════════════════════
    //  SPA CORE
    // ══════════════════════════════════════════

    function updateAuthUI() {
        const authToken = localStorage.getItem('authToken');
        const userRole  = localStorage.getItem('userRole');
        if (authToken && userRole === 'PASSENGER') {
            $('.ls-btns').hide();
            if ($('.sidebar-lotusmiles').length && !$('#btnLogout').length) {
                $('.sidebar-lotusmiles').append('<button class="ls-btn login mt-2 btn-danger" id="btnLogout" style="width:100%;color:red;">Đăng xuất</button>');
            }
        } else {
            $('.ls-btns').show();
            $('#btnLogout').remove();
        }
    }

    async function loadComponent(url, $container) {
        try {
            const html = await $.get(url);
            $container.html(html);
        } catch (err) {
            console.error('Lỗi load component:', url, err);
        }
    }

    function extractRenderableHtml(rawHtml, targetSelector) {
        const $wrapper = $('<div>').append($.parseHTML(rawHtml, document, true));
        if (targetSelector === '#main') {
            const $m = $wrapper.find('#main').first();
            if ($m.length) return $m.html();
        }
        const $pc = $wrapper.find('#page-content').first();
        if ($pc.length) return $pc.html();
        const $b = $wrapper.find('body').first();
        if ($b.length) return $b.html();
        return rawHtml;
    }

    function loadPage(url, targetSelector = '#page-content') {
        const $target = targetSelector === '#main' ? $main : $pageContent;
        $target.stop().animate({ opacity: 0 }, 200, async function () {
            try {
                const rawHtml      = await $.get(url);
                const renderedHtml = extractRenderableHtml(rawHtml, targetSelector);
                $target.html(renderedHtml).animate({ opacity: 1 }, 200);
                window.scrollTo({ top: 0, behavior: 'smooth' });
                initDynamicScripts();
            } catch {
                $target.html(`<div class="p-5"><h2>Không tìm thấy nội dung: ${url}</h2></div>`).animate({ opacity: 1 }, 200);
            }
        });
    }

    function setupNavigation() {
        $(document).on('click.app', '.sidebar-link, .ls-btn', function (e) {
            const $this = $(this);
            const url   = $this.data('url');
            const href  = $this.attr('href');

            if (url) {
                e.preventDefault();
                if (href === '#mua-ve') loadPageStyle('assets/css/booking.css');
                window.location.hash = href;
                loadPage(url, '#page-content');
                $('.sidebar-link').removeClass('active');
                if ($this.hasClass('sidebar-link')) $this.addClass('active');
            }
        });
    }

    // ══════════════════════════════════════════
    //  INIT
    // ══════════════════════════════════════════

    async function init() {
        await loadAirports();
        await loadComponent('/../../frontend/components/sidebar.html', $sidebarContainer);
        await loadComponent('/../../frontend/components/footer.html',  $footerContainer);

        updateAuthUI();
        setupNavigation();
        setActiveSidebarLink();

        const currentHash = window.location.hash;
        if (currentHash && currentHash !== '#index') {
            if (currentHash === '#mua-ve') loadPageStyle('assets/css/booking.css');
            setTimeout(() => {
                const $targetLink = $(`a[href="${currentHash}"]`);
                if ($targetLink.length && $targetLink.data('url')) {
                    loadPage($targetLink.data('url'), '#page-content');
                    $('.sidebar-link').removeClass('active');
                    if ($targetLink.hasClass('sidebar-link')) $targetLink.addClass('active');
                } else {
                    loadPage('pages/common/home.html', '#page-content');
                }
            }, 100);
        } else {
            loadPage('pages/common/home.html', '#page-content');
        }
    }

    init();
});