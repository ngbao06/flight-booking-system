$(function () {
    window.AdminPages = window.AdminPages || {};
    const API_BASE_URL = 'http://localhost:3000';

    const pageMeta = {
        'dashboard.html': { title: 'Dashboard', breadcrumb: '/ Trang chủ', icon: 'fa-chart-pie' },
        'airlines.html': { title: 'Hãng hàng không', breadcrumb: '/ Quản lý', icon: 'fa-building' },
        'airports.html': { title: 'Sân bay', breadcrumb: '/ Quản lý', icon: 'fa-tower-control' },
        'planes.html': { title: 'Máy bay', breadcrumb: '/ Quản lý', icon: 'fa-jet-fighter-up' },
        'flights.html': { title: 'Chuyến bay', breadcrumb: '/ Quản lý', icon: 'fa-plane' },
        'bookings.html': { title: 'Giao dịch', breadcrumb: '/ Quản lý', icon: 'fa-credit-card' },
        'staff.html': { title: 'Nhân viên', breadcrumb: '/ Người dùng', icon: 'fa-user-tie' },
        'passengers.html': { title: 'Hành khách', breadcrumb: '/ Người dùng', icon: 'fa-users' },
        'logs.html': { title: 'Logs', breadcrumb: '/ Hệ thống', icon: 'fa-scroll' },
    };

    const pageScripts = {
        dashboard: '../../assets/js/admin/dashboard.js',
        airlines: '../../assets/js/admin/airlines.js',
        airports: '../../assets/js/admin/airports.js',
        planes: '../../assets/js/admin/planes.js',
        flights: '../../assets/js/admin/flights.js',
        bookings: '../../assets/js/admin/bookings.js',
        staff: '../../assets/js/admin/staff.js',
        passengers: '../../assets/js/admin/passengers.js',
        logs: '../../assets/js/admin/logs.js',
    };

    let currentPageKey = '';
    let currentScriptTag = null;

    window.AdminAPI = {
        toBackendUrl: function (url) {
            if (!url) {
                return API_BASE_URL;
            }
            if (/^https?:\/\//i.test(url)) {
                return url;
            }
            if (url.startsWith('/api/')) {
                return API_BASE_URL + url;
            }
            if (url.startsWith('api/')) {
                return API_BASE_URL + '/' + url;
            }
            return url;
        },
        request: async function (url, method) {
            const response = await fetch(this.toBackendUrl(url), {
                headers: {
                    'Content-Type': 'application/json',
                    ...(method && method.headers ? method.headers : {}),
                },
                credentials: 'include',
                ...method,
            });
            const raw = await response.text();
            let payload = {};
            if (raw) {
                try {
                    payload = JSON.parse(raw);
                } catch (e) {
                    payload = { message: raw };
                }
            }
            if (!response.ok) {
                throw new Error(payload.message || 'Yêu cầu thất bại');
            }
            return payload;
        },
        escape: function (value) {
            return String(value == null ? '' : value)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        },
        showMessage: function (selector, type, text) {
            $(selector).html('<div class="alert alert-' + type + ' mb-3">' + this.escape(text) + '</div>');
        },
        formatDate: function (dateStr) {
            const d = new Date(dateStr);

            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = String(d.getFullYear()).slice(-2);

            const hours = String(d.getHours()).padStart(2, '0');
            const minutes = String(d.getMinutes()).padStart(2, '0');

            return `${day}/${month}/${year} - ${hours}:${minutes}`;
        }
    };

    function pageKeyFromName(pageName) {
        return (pageName || '').replace('.html', '');
    }

    function updateHeader(pageName) {
        const meta = pageMeta[pageName] || {};
        const pageTitle = meta.title || pageKeyFromName(pageName);
        $('#page-title').text(pageTitle);
        $('#page-breadcrumb').text(meta.breadcrumb || '');

        const icon = meta.icon || 'fa-plane-circle-check';
        $('.empty-icon i').attr('class', 'fa-solid ' + icon);
        $('.empty-title').text('Trang ' + pageTitle);
    }

    function setActiveLink(pageName) {
        $('.nav-link-custom').removeClass('active');
        $('.nav-link-custom').each(function () {
            if ($(this).attr('href') === pageName) {
                $(this).addClass('active');
            }
        });
    }

    function renderPageContent(html) {
        const parsed = new DOMParser().parseFromString(html, 'text/html');
        const content = parsed.querySelector('main#content, main, .page-content, body');
        if (!content) {
            $('#content').html('<div class="alert alert-danger">Không tải được nội dung trang.</div>');
            return;
        }
        const fragment = content.cloneNode(true);
        $('#content').html(fragment.innerHTML.trim() || '<div class="alert alert-warning">Trang chưa có nội dung.</div>');
    }

    function destroyCurrentPage() {
        if (!currentPageKey) {
            return;
        }
        const module = window.AdminPages[currentPageKey];
        if (module && typeof module.destroy === 'function') {
            module.destroy();
        }
    }

    function runPageInit(pageKey) {
        const module = window.AdminPages[pageKey];
        if (module && typeof module.init === 'function') {
            module.init({ pageKey, contentSelector: '#content' });
        }
    }

    function loadPageScript(pageName) {
        const pageKey = pageKeyFromName(pageName);
        const src = pageScripts[pageKey];

        destroyCurrentPage();
        currentPageKey = pageKey;

        if (!src) {
            return;
        }

        if (currentScriptTag) {
            currentScriptTag.remove();
            currentScriptTag = null;
        }

        const script = document.createElement('script');
        script.src = src + '?v=' + Date.now();
        script.onload = function () { runPageInit(pageKey); };
        script.onerror = function () {
            $('#content').prepend('<div class="alert alert-danger">Không tải được script trang ' + pageKey + '.</div>');
        };
        document.body.appendChild(script);
        currentScriptTag = script;
    }

    function loadPage(pageName, options = {}) {
        const target = pageName || 'dashboard.html';
        const meta = pageMeta[target] || {};

        updateHeader(target);
        setActiveLink(target);

        return $.ajax({
            url: target,
            method: 'GET',
            dataType: 'html',
            success: function (html) {
                renderPageContent(html);
                loadPageScript(target);
                if (options.pushState !== false) {
                    window.history.pushState(
                        { page: target },
                        meta.title || target,
                        '?page=' + target.replace('.html', '')
                    );
                }
            },
            error: function () {
                $('#content').html('<div class="alert alert-danger">Không thể tải ' + target + '.</div>');
            },
        });
    }

    $('#hamburger').on('click', function () {
        $('#sidebar').toggleClass('open');
        $('#overlay').toggleClass('show');
    });

    $('#overlay').on('click', function () {
        $('#sidebar').removeClass('open');
        $(this).removeClass('show');
    });

    $('.nav-link-custom').on('click', function (e) {
        e.preventDefault();
        const pageName = $(this).attr('href');
        loadPage(pageName);

        if ($(window).width() < 992) {
            $('#sidebar').removeClass('open');
            $('#overlay').removeClass('show');
        }
    });

    $('#accountBtn').on('click', function (e) {
        e.stopPropagation();
        const $dropdown = $('#accountDropdown');
        $(this).toggleClass('open');
        if ($dropdown.hasClass('show')) {
            $dropdown.removeClass('show').slideUp(180);
        } else {
            $dropdown.addClass('show').hide().slideDown(180);
        }
    });

    $(document).on('click', function () {
        $('#accountDropdown').removeClass('show').slideUp(180);
        $('#accountBtn').removeClass('open');
    });

    $('#accountDropdown').on('click', function (e) {
        e.stopPropagation();
    });

    $('.logout-btn, .dropdown-item-custom.danger').on('click', function () {
        if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('userRole');
            window.location.href = '../../index.html';
        }
    });

    $(window).on('popstate', function (e) {
        const statePage = e.originalEvent.state && e.originalEvent.state.page;
        if (statePage) {
            loadPage(statePage, { pushState: false });
        }
    });

    const initialPage = new URLSearchParams(window.location.search).get('page') || 'dashboard';
    loadPage(initialPage.endsWith('.html') ? initialPage : initialPage + '.html', { pushState: false });
});