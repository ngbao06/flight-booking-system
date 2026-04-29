const BASE_API_URL = `http://localhost:3000/api`

$(function() {
    'use strict';

    const $pageContent = $('#page-content');
    const $main = $('#main');
    const $sidebarContainer = $('#sidebar-container');
    const $footerContainer = $('#footer-container');

    // ══════════════════════════════════════════
    //  BOOKING PANEL LOGIC
    // ══════════════════════════════════════════

    // ── Airports data (fallback nếu API chưa có) ──
    const DEFAULT_AIRPORTS = [
        { code: 'HAN', name: 'Sân bay Nội Bài',      city: 'Hà Nội, Việt Nam' },
        { code: 'SGN', name: 'Sân bay Tân Sơn Nhất',  city: 'TP. Hồ Chí Minh, Việt Nam' },
        { code: 'DAD', name: 'Sân bay Đà Nẵng',       city: 'Đà Nẵng, Việt Nam' },
        { code: 'CXR', name: 'Sân bay Cam Ranh',      city: 'Khánh Hòa, Việt Nam' },
        { code: 'PQC', name: 'Sân bay Phú Quốc',      city: 'Kiên Giang, Việt Nam' },
        { code: 'HUI', name: 'Sân bay Phú Bài',       city: 'Huế, Việt Nam' },
        { code: 'VII', name: 'Sân bay Vinh',           city: 'Nghệ An, Việt Nam' },
        { code: 'VCA', name: 'Sân bay Cần Thơ',       city: 'Cần Thơ, Việt Nam' },
        { code: 'BMV', name: 'Sân bay Buôn Ma Thuột', city: 'Đắk Lắk, Việt Nam' },
        { code: 'DLI', name: 'Sân bay Liên Khương',   city: 'Lâm Đồng, Việt Nam' },
        { code: 'NHA', name: 'Sân bay Nha Trang',     city: 'Khánh Hòa, Việt Nam' },
        { code: 'UIH', name: 'Sân bay Phù Cát',       city: 'Bình Định, Việt Nam' },
        { code: 'BPH', name: 'Sân bay Tuy Hòa',       city: 'Phú Yên, Việt Nam' },
        { code: 'VDH', name: 'Sân bay Đồng Hới',      city: 'Quảng Bình, Việt Nam' },
        // Quốc tế
        { code: 'BKK', name: 'Suvarnabhumi Airport',  city: 'Bangkok, Thái Lan' },
        { code: 'SIN', name: 'Changi Airport',         city: 'Singapore' },
        { code: 'ICN', name: 'Incheon Airport',        city: 'Seoul, Hàn Quốc' },
        { code: 'NRT', name: 'Narita Airport',         city: 'Tokyo, Nhật Bản' },
        { code: 'PEK', name: 'Beijing Capital Airport',city: 'Bắc Kinh, Trung Quốc' },
        { code: 'CDG', name: 'Charles de Gaulle',      city: 'Paris, Pháp' },
        { code: 'LHR', name: 'Heathrow Airport',       city: 'London, Anh' },
        { code: 'SYD', name: 'Kingsford Smith Airport',city: 'Sydney, Úc' },
    ];

    let airports = [...DEFAULT_AIRPORTS];
    let fromAirport = airports[0]; // HAN
    let toAirport   = null;
    let paxCounts   = { adult: 1, child: 0, infant: 0 };
    const INLINE_HINTS = {
        buy: 'Nhập thông tin để tìm chuyến bay.',
        manage: 'Nhập seat number và last name để tra cứu.',
        status: 'Nhập số hiệu chuyến bay và ngày bay để tra cứu.'
    };

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

    function normalizeAirport(raw) {
        return {
            id: raw.id ?? raw.airportId ?? raw.airport_id ?? null,
            code: String(raw.code ?? raw.iataCode ?? raw.iata_code ?? '').toUpperCase(),
            name: raw.name ?? raw.airportName ?? raw.airport_name ?? '',
            city: raw.city ?? raw.region ?? ''
        };
    }

    async function fetchJsonOrNull(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) return null;
            return await response.json();
        } catch (error) {
            return null;
        }
    }

    function getBadgeClass(status) {
        const s = String(status || '').toUpperCase();
        if (s.includes('DELAY')) return 'badge-delayed';
        if (s.includes('CANCEL')) return 'badge-cancel';
        if (s.includes('BOARD')) return 'badge-boarding';
        return 'badge-ontime';
    }

    function toIsoDateOnly(value) {
        if (!value) return '';
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) return String(value).slice(0, 10);
        return parsed.toISOString().slice(0, 10);
    }

    function getAirportLabelById(airportId) {
        const found = airports.find((a) => Number(a.id) === Number(airportId));
        if (!found) return `#${airportId}`;
        return `${found.code} (${found.city || found.name})`;
    }

    // Fetch API airports từ DB
    async function loadAirports() {
        const payload = await fetchJsonOrNull(BASE_API_URL + `/airports`);
        const apiAirports = extractDataArray(payload)
            .map(normalizeAirport)
            .filter((a) => a.code);

        if (apiAirports.length) {
            airports = apiAirports;
        }

        if (!fromAirport || !fromAirport.code) {
            fromAirport = airports[0] || null;
        }

        updateAirportDisplay('from', fromAirport);
        updateAirportDisplay('to', toAirport);
    }

    // Load common/booking/mua-ve.html content into page-content and initialize
    async function loadMuaVePage() {
        try {
            // Remove old event handlers that might conflict with mua-ve.js
            $(document).off('click', '.airport-field');
            $(document).off('input', '.airport-search-input');
            $(document).off('click', '.airport-item');
            $(document).off('click', '#btn-swap');
            
            const response = await fetch('./pages/common/booking/mua-ve.html');
            const html = await response.text();
            
            // Parse and extract just the content section
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const content = doc.querySelector('#page-content');
            
            if (content) {
                $pageContent.html(content.innerHTML);
                
                // Scroll to top
                window.scrollTo(0, 0);
                
                // Reinitialize mua-ve.js
                if (typeof initMuaVe === 'function') {
                    initMuaVe();
                }
            }
        } catch (error) {
            console.error('Failed to load mua-ve page:', error);
            alert('Lỗi khi tải trang mua vé. Vui lòng thử lại.');
        }
    }

    // ── Booking Tabs ──
    $(document).on('click', '.booking-tab[data-tab]', function() {
        const tab = $(this).data('tab');
        $('.booking-tab').removeClass('active');
        $(this).addClass('active');
        $('.booking-pane').addClass('d-none');
        $(`#pane-${tab}`).removeClass('d-none');
        closeAllDropdowns();
        resetPaneValidation(tab);
    });

    // ── Airport Field Click ──
    $(document).on('click', '#pane-buy .airport-field', function(e) {
        const $field = $(this);
        const id = $field.attr('id');
        const ddId = id === 'field-from' ? 'dd-from' : 'dd-to';
        const $dd = $(`#${ddId}`);
        const isOpen = $dd.hasClass('show');

        closeAllDropdowns();
        if (!isOpen) {
            $field.addClass('open');
            renderDropdown($dd, '');
            $dd.addClass('show');
            $dd.find('.airport-search-input').focus();
        }
        e.stopPropagation();
    });

    // Stop clicks inside dropdown from bubbling
    $(document).on('click', '.airport-dropdown', function(e) { e.stopPropagation(); });

    // Airport search input
    $(document).on('input', '.airport-search-input', function() {
        const $dd = $(this).closest('.airport-dropdown');
        renderDropdown($dd, $(this).val());
    });

    // Airport item select
    $(document).on('click', '.airport-item', function(e) {
        e.stopPropagation();
        const code = $(this).data('code');
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
        closeAllDropdowns();
    });

    function renderDropdown($dd, query) {
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

    // ── Swap ──
    $(document).on('click', '#btn-swap', function() {
        if (!toAirport) return;
        [fromAirport, toAirport] = [toAirport, fromAirport];
        updateAirportDisplay('from', fromAirport);
        updateAirportDisplay('to', toAirport);
        $(this).css('transition','transform .4s').css('transform','rotate(180deg)');
        setTimeout(() => $(this).css('transform', ''), 400);
    });

    // ── Passenger Dropdown ──
    $(document).on('click', '#pax-display', function(e) {
        e.stopPropagation();
        const $dd = $('#pax-dd');
        const isOpen = $dd.hasClass('show');
        closeAllDropdowns();
        if (!isOpen) $dd.addClass('show');
    });
    $(document).on('click', '#pax-dd', function(e) { e.stopPropagation(); });

    $(document).on('click', '.pax-btn', function() {
        const type = $(this).data('type');
        const dir  = parseInt($(this).data('dir'));
        paxCounts[type] = Math.max(0, paxCounts[type] + dir);
        if (type === 'adult' && paxCounts.adult < 1) paxCounts.adult = 1;
        $(`#cnt-${type}`).text(paxCounts[type]);
        updatePaxLabel();
    });

    $(document).on('click', '#pax-confirm', function() {
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

    $(document).on('input change', '#dep-date, #ret-date, #seat-number, #passenger-lastname, #flight-number, #flight-date', function() {
        $(this).removeClass('is-invalid-field');
        const active = $('.booking-tab.active').data('tab') || 'buy';
        setInlineMessage(active, INLINE_HINTS[active], false);
    });

    $(document).on('click', '#field-to', function() {
        $('#field-to').removeClass('is-invalid-field');
        setInlineMessage('buy', INLINE_HINTS.buy, false);
    });

    function closeAllDropdowns() {
        $('.airport-field').removeClass('open');
        $('.airport-dropdown').removeClass('show');
        $('#pax-dd').removeClass('show');
    }

    $(document).on('click', function() {
        closeAllDropdowns();
    });

    // ── Search Flight ──
    $(document).on('click', '#btn-search-flight', async function() {
        const from = $('#input-from').val();
        const to   = $('#input-to').val();
        const date = $('#dep-date').val();

        resetPaneValidation('buy');

        const missing = [];
        if (!to) {
            markInvalid('#field-to');
            missing.push('điểm đến');
        }
        if (!date) {
            markInvalid('#dep-date');
            missing.push('ngày đi');
        }
        if (missing.length) {
            setInlineMessage('buy', `Vui lòng nhập ${missing.join(' và ')}.`, true);
            return;
        }

        // Disable button and show loading
        const $btn = $(this);
        $btn.prop('disabled', true);
        const originalText = $btn.html();
        $btn.html('<i class="fa-solid fa-spinner fa-spin me-2"></i> Đang tìm kiếm...');
        setInlineMessage('buy', 'Đang tìm kiếm chuyến bay...', false);

        try {
            // Find airport objects from codes
            const fromAP = airports.find(a => a.code === from) || null;
            const toAP = airports.find(a => a.code === to) || null;

            // Build API query
            const params = new URLSearchParams();
            if (fromAP && fromAP.id) params.append('departureAirportId', fromAP.id);
            if (toAP && toAP.id) params.append('arrivalAirportId', toAP.id);
            
            const apiUrl = `${BASE_API_URL}/flights${params.toString() ? '?' + params.toString() : ''}`;
            const response = await fetchJsonOrNull(apiUrl);
            
            let flights = extractDataArray(response) || [];

            // If no results from specific query, try fetching all and filtering
            if (!flights.length && (!params.toString())) {
                const allResponse = await fetchJsonOrNull(`${BASE_API_URL}/flights`);
                flights = extractDataArray(allResponse) || [];
            }

            // Client-side filtering by date and route
            flights = flights.filter(f => {
                const depTime = f.departureTime || f.departure_time || '';
                const depDateStr = String(depTime).slice(0, 10);
                return depDateStr === date;
            });

            // Filter by route if airport IDs available
            if (fromAP && fromAP.id && toAP && toAP.id) {
                flights = flights.filter(f => {
                    const depAirportId = f.departureAirportId || f.departure_airport_id;
                    const arrAirportId = f.arrivalAirportId || f.arrival_airport_id;
                    return Number(depAirportId) === Number(fromAP.id) && 
                           Number(arrAirportId) === Number(toAP.id);
                });
            }

            // Save search data to window object for mua-ve to access
            window.flightSearchData = {
                from: from,
                to: to,
                date: date,
                adult: paxCounts.adult,
                child: paxCounts.child,
                infant: paxCounts.infant,
                flights: flights,
                timestamp: Date.now()
            };

            // Load common/booking/mua-ve.html content into page-content div
            await loadMuaVePage();
        } catch (error) {
            console.error('Search flights error:', error);
            setInlineMessage('buy', 'Lỗi khi tìm kiếm. Vui lòng thử lại.', true);
        } finally {
            $btn.prop('disabled', false);
            $btn.html(originalText);
        }
    });

    // ── Quản lý đặt chỗ ──
    $(document).on('click', '#btn-search-booking', async function() {
        const seatNumber = $('#seat-number').val().trim().toUpperCase();
        const lastname = $('#passenger-lastname').val().trim();
        const $res = $('#booking-result');

        resetPaneValidation('manage');
        $res.empty();

        const missing = [];
        if (!seatNumber) {
            markInvalid('#seat-number');
            missing.push('seat number');
        }
        if (!lastname) {
            markInvalid('#passenger-lastname');
            missing.push('last name');
        }
        if (missing.length) {
            setInlineMessage('manage', `Vui lòng nhập ${missing.join(' và ')}.`, true);
            return;
        }

        setInlineMessage('manage', 'Đang tra cứu thông tin vé...', false);
        $res.html(`<div class="text-center py-3"><div class="spinner mx-auto"></div></div>`);

        const seatPayload = await fetchJsonOrNull(`/api/seats?seatNumber=${encodeURIComponent(seatNumber)}`);
        const seat = extractDataObject(seatPayload);

        if (!seat || !(seat.id ?? seat.seat_id)) {
            setInlineMessage('manage', `Không tìm thấy ghế ${seatNumber}.`, true);
            $res.empty();
            return;
        }

        const seatId = seat.id ?? seat.seat_id;
        const ticketPayload = await fetchJsonOrNull(`/api/tickets?seatId=${encodeURIComponent(seatId)}`);
        const ticket = extractDataObject(ticketPayload);

        if (!ticket) {
            setInlineMessage('manage', `Không tìm thấy vé ứng với ghế ${seatNumber}.`, true);
            $res.empty();
            return;
        }

        const passengerLastName = String(ticket.passenger_lastname ?? ticket.passengerLastname ?? '').trim();
        if (passengerLastName.toLowerCase() !== lastname.toLowerCase()) {
            setInlineMessage('manage', 'Không có vé phù hợp với seat number và last name đã nhập.', true);
            $res.empty();
            return;
        }

        const bookingId = ticket.booking_id ?? ticket.bookingId;
        const bookingPayload = bookingId ? await fetchJsonOrNull(`/api/booking/${bookingId}`) : null;
        const booking = extractDataObject(bookingPayload);

        const flightId = booking?.flight_id ?? booking?.flightId;
        const flightPayload = flightId ? await fetchJsonOrNull(`/api/flights/${flightId}`) : null;
        const flight = extractDataObject(flightPayload);

        const fullPassenger = `${passengerLastName} ${(ticket.passenger_firstname ?? ticket.passengerFirstname ?? '')}`.trim();
        const badgeClass = getBadgeClass(ticket.status);

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
    $(document).on('click', '#btn-check-flight', async function() {
        const flightNo = $('#flight-number').val().trim().toUpperCase();
        const flightDate = $('#flight-date').val();
        const $res = $('#flight-status-result');

        resetPaneValidation('status');
        $res.empty();

        const missing = [];
        if (!flightNo) {
            markInvalid('#flight-number');
            missing.push('số hiệu chuyến bay');
        }
        if (!flightDate) {
            markInvalid('#flight-date');
            missing.push('ngày bay');
        }
        if (missing.length) {
            setInlineMessage('status', `Vui lòng nhập ${missing.join(' và ')}.`, true);
            return;
        }

        setInlineMessage('status', 'Đang tra cứu trạng thái chuyến bay...', false);
        $res.html(`<div class="text-center py-3"><div class="spinner mx-auto"></div></div>`);

        const flightsPayload = await fetchJsonOrNull(`/api/flights?flightNumber=${encodeURIComponent(flightNo)}`);
        const flights = extractDataArray(flightsPayload);

        const matched = flights.find((flight) => {
            const depTime = flight.departure_time ?? flight.departureTime;
            return toIsoDateOnly(depTime) === flightDate;
        });

        if (!matched) {
            setInlineMessage('status', 'Không tìm thấy chuyến bay phù hợp với số hiệu và ngày bay đã chọn.', true);
            $res.empty();
            return;
        }

        const depAirportId = matched.departure_airport_id ?? matched.departureAirportId;
        const arrAirportId = matched.arrival_airport_id ?? matched.arrivalAirportId;
        const status = matched.status ?? 'UNKNOWN';
        const route = `${getAirportLabelById(depAirportId)} -> ${getAirportLabelById(arrAirportId)}`;

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

    async function init() {
        await loadAirports();
        updatePaxLabel();
        setInlineMessage('buy', INLINE_HINTS.buy, false);
        setInlineMessage('manage', INLINE_HINTS.manage, false);
        setInlineMessage('status', INLINE_HINTS.status, false);

        // Load sidebar trước
        await loadComponent('/../../frontend/components/sidebar.html', $sidebarContainer);
        await loadComponent('/../../frontend/components/footer.html', $footerContainer);

        // Kiểm tra session và ẩn/hiện nút đăng nhập
        updateAuthUI();

        setupNavigation();
        setActiveSidebarLink();

        // Kiểm tra hash trên URL để load trang tương ứng (hỗ trợ refresh trang)
        const currentHash = window.location.hash;
        if (currentHash && currentHash !== '#index') {
            setTimeout(() => {
                const $targetLink = $(`a[href="${currentHash}"]`);
                if ($targetLink.length && $targetLink.data('url')) {
                    loadPage($targetLink.data('url'), '#page-content');
                    $('.sidebar-link').removeClass('active');
                    if ($targetLink.hasClass('sidebar-link')) $targetLink.addClass('active');
                }
            }, 100); // Chờ sidebar component được load xong
        }
    }

    function updateAuthUI() {
        const userRole = localStorage.getItem('userRole');
        const authToken = localStorage.getItem('authToken');
        
        if (authToken && userRole === 'PASSENGER') {
            $('.ls-btns').hide(); // Lúc này chắc chắn đã có sidebar
            if ($('.sidebar-lotusmiles').length && !$('#btnLogout').length) {
                $('.sidebar-lotusmiles').append('<button class="ls-btn login mt-2 btn-danger" id="btnLogout" style="width: 100%; color: red;">Đăng xuất</button>');
            }
        } else {
            $('.ls-btns').show();
            $('#btnLogout').remove();
        }
    }

    // 2. Hàm load component (Sidebar/Footer)
    async function loadComponent(url, $container) {
        try {
            const html = await $.get(url);
            $container.html(html);
        } catch (err) {
            console.error("Lỗi load component:", url, err);
        }
    }

    function extractRenderableHtml(rawHtml, targetSelector) {
        const $wrapper = $('<div>').append($.parseHTML(rawHtml, document, true));

        if (targetSelector === '#main') {
            const $embeddedMain = $wrapper.find('#main').first();
            if ($embeddedMain.length) return $embeddedMain.html();
        }

        const $embeddedPageContent = $wrapper.find('#page-content').first();
        if ($embeddedPageContent.length) return $embeddedPageContent.html();

        const $body = $wrapper.find('body').first();
        if ($body.length) return $body.html();

        return rawHtml;
    }

    // 3. Hàm load nội dung trang (SPA Core)
    function loadPage(url, targetSelector = '#page-content') {
        const $target = targetSelector === '#main' ? $main : $pageContent;

        $target.stop().animate({ opacity: 0 }, 200, async function() {
            try {
                const rawHtml = await $.get(url);
                const renderedHtml = extractRenderableHtml(rawHtml, targetSelector);
                
                $target.html(renderedHtml).animate({ opacity: 1 }, 200);
                // Khởi tạo lại các plugin/script sau khi có HTML mới
                initDynamicScripts();
            } catch (err) {
                $target.html(`<div class="p-5"><h2>Không tìm thấy nội dung: ${url}</h2></div>`).animate({ opacity: 1 }, 200);
            }
        });
    }

    // 4. Xử lý điều hướng
    function setupNavigation() {
        // Sử dụng Event Delegation cho các link trong sidebar
        $(document).on('click', '.sidebar-link, .ls-btn', function(e) {
            const $this = $(this);
            const url = $this.data('url');
            const href = $this.attr('href');
            
            if (url) {
                e.preventDefault();

                console.log('here');
                
                // Đổi hash thay vì pushState để dễ quản lý hơn trong project nhỏ
                window.location.hash = href;
                loadPage(url, '#page-content');

                // Cập nhật UI
                $('.sidebar-link').removeClass('active');
                if ($this.hasClass('sidebar-link')) {
                    $this.addClass('active');
                }
            }
        });
    }

    // Xử lý sự kiện đăng xuất cho Passenger
    $(document).on('click', '#btnLogout', function() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userRole');
        window.location.hash = '#index';
        window.location.reload();
    });

    // 5. Các hiệu ứng UI (Hamburger, Tabs, Swaps)
    function initDynamicScripts() {
        // Tái sử dụng logic cũ nhưng viết bằng jQuery
        $('.booking-tab, .hero-slide-btn, .service-menu-item, .dest-filter, .tab-btn').off('click').on('click', function() {
            $(this).addClass('active').siblings().removeClass('active');
        });

        $('.booking-swap').off('click').on('click', function() {
            $(this).css('transition', 'transform 0.4s').css('transform', 'rotate(180deg)');
            setTimeout(() => $(this).css('transform', ''), 400);
        });

        // Intersection Observer cho hiệu ứng ẩn hiện
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    $(entry.target).css({ 'opacity': '1', 'transform': 'translateY(0)' });
                }
            });
        }, { threshold: 0.1 });

        $('.anim').each(function() {
            $(this).css({ 'opacity': '0', 'transform': 'translateY(20px)', 'transition': 'all 0.6s' });
            observer.observe(this);
        });

        $('.booking-panel').css({
            'opacity': '0',
            'transform': 'translateY(30px)'
        }).animate({
            'opacity': '1',
            'transform': 'translateY(0)'
        }, 600);
    }

    // 6. Sidebar Mobile & Active Link
    $(document).on('click', '#hamburger', function() {
        $('#sidebar').toggleClass('open');
        $('#overlay').toggleClass('show');
    });

    $(document).on('click', '#overlay', function() {
        $('#sidebar').removeClass('open');
        $(this).removeClass('show');
    });

    function setActiveSidebarLink() {
        const hash = window.location.hash || '#index';
        $('.sidebar-link').each(function() {
            const isMatch = `#${$(this).data('page')}` === hash;
            $(this).toggleClass('active', isMatch);
        });
    }

    // 7. Auth Logic
    function showAuthMessage(formId, message, isError = false) {
        const $msgPlaceholder = $(`#${formId}-message`);
        if (!$msgPlaceholder.length) return;

        const alertClass = isError ? 'alert-danger' : 'alert-success';
        const html = `<div class="alert ${alertClass}" style="font-size: 13px; padding: 10px 15px; margin-bottom: 0;">${message}</div>`;
        $msgPlaceholder.html(html).show();
    }

    function clearAuthMessage(formId) {
        $(`#${formId}-message`).empty().hide();
    }

    $(document).on('submit', '#loginForm', function (e) {
        e.preventDefault();
        const $form = $(this);
        const $button = $form.find('button[type="submit"]');
        const originalButtonText = $button.html();

        const data = {
            "username": $form.find('input[name="username"]').val(),
            "password": $form.find('input[name="password"]').val()
        };

        if (!data.username || !data.password) {
            showAuthMessage('loginForm', 'Vui lòng nhập đầy đủ tài khoản và mật khẩu.', true);
            return;
        }

        $button.html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Đang xử lý...').prop('disabled', true);
        clearAuthMessage('loginForm');

        $.ajax({
            url: `${BASE_API_URL}/auth/login`,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(data),
            xhrFields: {
                withCredentials: true // Để trình duyệt gửi và nhận Cookie/Session
            }
        })
        .done(res => {
            const token = res?.data?.token || res?.token;
            const role = res?.data?.user?.role || res?.data?.role || res?.role;
            
            if (token) localStorage.setItem('authToken', token);
            if (role) localStorage.setItem('userRole', role);

            if (role === 'ADMIN') {
                showAuthMessage('loginForm', 'Đăng nhập thành công! Đang chuyển hướng...', false);
                setTimeout(() => window.location.href = 'pages/admin/index.html', 1000);
            } else {
                showAuthMessage('loginForm', 'Đăng nhập thành công! Đang tải lại trang...', false);
                setTimeout(() => {
                    window.location.hash = '#index';
                    window.location.reload();
                }, 1500);
            }
        })
            .fail(err => {
                const message = err.responseJSON?.message || 'Đăng nhập thất bại. Vui lòng thử lại.';
                showAuthMessage('loginForm', message, true);
                $button.html(originalButtonText).prop('disabled', false);
            });
    });

    $(document).on('submit', '#registerForm', function (e) {
        e.preventDefault();
        const $form = $(this);
        const $button = $form.find('button[type="submit"]');
        const originalButtonText = $button.html();

        const data = {
            username: $form.find('input[name="email"]').val(),
            email: $form.find('input[name="email"]').val(),
            password: $form.find('input[name="password"]').val(),
            full_name: $form.find('input[name="fullname"]').val(),
            phone: $form.find('input[name="phone"]').val(),
            role: 'PASSENGER'
        };

        if (!data.email || !data.password || !data.full_name) {
            showAuthMessage('registerForm', 'Vui lòng điền các trường bắt buộc.', true);
            return;
        }
        if (data.password.length < 6) {
            showAuthMessage('registerForm', 'Mật khẩu phải có ít nhất 6 ký tự.', true);
            return;
        }

        $button.html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Đang xử lý...').prop('disabled', true);
        clearAuthMessage('registerForm');

        $.ajax({
            url: `${BASE_API_URL}/auth/register`,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(data),
            xhrFields: {
                withCredentials: true // Để trình duyệt gửi và nhận Cookie/Session
            }
        })
        .done(res => {
            showAuthMessage('registerForm', 'Đăng ký thành công! Đang chuyển đến trang đăng nhập.', false);
            setTimeout(() => {
                $('.ls-btn.login').trigger('click');
            }, 2000);
        })
        .fail(err => {
            const message = err.responseJSON?.message || 'Đăng ký thất bại. Vui lòng thử lại.';
            showAuthMessage('registerForm', message, true);
            $button.html(originalButtonText).prop('disabled', false);
        });
    });

    // Chạy khởi tạo
    init();
});