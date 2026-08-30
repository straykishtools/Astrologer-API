/**
 * City Selector — Vanilla JS
 * Province → City dropdown for Iran (PersianLabs-style)
 * 31 provinces, 1119 cities
 * Searchable, RTL, auto-fills lat/lng/tz
 *
 * Usage:
 *   CitySelector(containerId, { inputId, onSelect, locale })
 *
 * API matches @persianlabsui/city-selector:
 *   value: { province: {id,name,nameEn}, city: {id,name,nameEn} }
 *   onValueChange: (value) => void
 */
(function () {
    'use strict';

    // ================================================================
    //  DATA: Province → City mapping with coordinates
    // ================================================================
    // PERSIAN_PROVINCES is loaded from persian-provinces.js (data only: id, name, nameEn, cities)
    // CITY_COORDS is loaded from iran-cities.json (city name → lat, lng, tz)
    var _provinceCoords = {}; // city name → {lat, lng, tz, province}

    function buildCoordsIndex(callback) {
        if (Object.keys(_provinceCoords).length > 0) { callback(); return; }
        fetch('/static/iran-cities.json')
            .then(function (r) { return r.json(); })
            .then(function (data) {
                data.forEach(function (c) {
                    _provinceCoords[c.city] = { lat: c.lat, lng: c.lng, tz: c.tz, province: c.province };
                });
                callback();
            })
            .catch(function () { callback(); });
    }

    // ================================================================
    //  STRINGS
    // ================================================================
    var STRINGS = {
        fa: {
            province: 'محل سکونت و تولد',
            city: 'شهر',
            selectProvinceFirst: 'ابتدا استان را انتخاب کنید',
            noProvinces: 'استانی یافت نشد.',
            noCities: 'شهری یافت نشد.',
            searchProvince: 'جستجوی استان...',
            searchCity: 'جستجوی شهر...'
        },
        en: {
            province: 'Province',
            city: 'City',
            selectProvinceFirst: 'Select a province first',
            noProvinces: 'No provinces found.',
            noCities: 'No cities found.',
            searchProvince: 'Search province...',
            searchCity: 'Search city...'
        }
    };

    // ================================================================
    //  CITY SELECTOR
    // ================================================================
    function createCitySelector(containerId, opts) {
        var container = document.getElementById(containerId);
        if (!container) return;

        opts = opts || {};
        var onSelect = opts.onSelect || function () {};
        var locale = opts.locale || 'fa';
        var str = STRINGS[locale] || STRINGS.fa;
        var inputId = opts.inputId || '';
        var value = { province: null, city: null };

        // Build DOM
        container.style.position = 'relative';
        container.innerHTML =
            '<div class="cs-row">' +
            '<div class="cs-select-wrap" id="' + containerId + '_province_wrap">' +
            '<label class="cs-label">' + str.province + '</label>' +
            '<div class="cs-select" id="' + containerId + '_province" tabindex="0">' +
            '<span class="cs-select-value">' + str.province + '</span>' +
            '<span class="cs-select-arrow">▾</span>' +
            '</div>' +
            '<div class="cs-dropdown" id="' + containerId + '_province_dd" style="display:none;">' +
            '<input type="text" class="cs-search" placeholder="' + str.searchProvince + '">' +
            '<div class="cs-dropdown-list"></div>' +
            '</div>' +
            '</div>' +
            '<div class="cs-select-wrap" id="' + containerId + '_city_wrap">' +
            '<label class="cs-label">' + str.city + '</label>' +
            '<div class="cs-select cs-disabled" id="' + containerId + '_city" tabindex="0">' +
            '<span class="cs-select-value cs-placeholder">' + str.selectProvinceFirst + '</span>' +
            '<span class="cs-select-arrow">▾</span>' +
            '</div>' +
            '<div class="cs-dropdown" id="' + containerId + '_city_dd" style="display:none;">' +
            '<input type="text" class="cs-search" placeholder="' + str.searchCity + '">' +
            '<div class="cs-dropdown-list"></div>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '<input type="hidden" id="' + inputId + '" value="">' +
            '<input type="hidden" id="' + containerId + '_lat" value="">' +
            '<input type="hidden" id="' + containerId + '_lng" value="">' +
            '<input type="hidden" id="' + containerId + '_tz" value="">';

        var provinceEl = document.getElementById(containerId + '_province');
        var provinceDD = document.getElementById(containerId + '_province_dd');
        var provinceList = provinceDD.querySelector('.cs-dropdown-list');
        var provinceSearch = provinceDD.querySelector('.cs-search');

        var cityEl = document.getElementById(containerId + '_city');
        var cityDD = document.getElementById(containerId + '_city_dd');
        var cityList = cityDD.querySelector('.cs-dropdown-list');
        var citySearch = cityDD.querySelector('.cs-search');

        var cityInput = document.getElementById(inputId);
        var latInput = document.getElementById(containerId + '_lat');
        var lngInput = document.getElementById(containerId + '_lng');
        var tzInput = document.getElementById(containerId + '_tz');

        // ============================================================
        //  PROVINCE DROPDOWN
        // ============================================================
        function renderProvinceList(filter) {
            var q = (filter || '').trim().toLowerCase();
            var provinces = typeof PERSIAN_PROVINCES !== 'undefined' ? PERSIAN_PROVINCES : [];
            var html = '';
            var count = 0;
            provinces.forEach(function (p) {
                var label = locale === 'en' ? p.nameEn : p.name;
                if (q && label.indexOf(q) === -1 && p.nameEn.toLowerCase().indexOf(q) === -1) return;
                var active = value.province && value.province.id === p.id ? ' active' : '';
                html += '<div class="cs-dropdown-item' + active + '" data-id="' + p.id + '">' + label + '</div>';
                count++;
            });
            if (count === 0) html = '<div class="cs-dropdown-empty">' + str.noProvinces + '</div>';
            provinceList.innerHTML = html;

            // Attach click handlers
            provinceList.querySelectorAll('.cs-dropdown-item').forEach(function (item) {
                item.addEventListener('click', function () {
                    var pid = parseInt(item.dataset.id);
                    var province = provinces.find(function (p) { return p.id === pid; });
                    if (province) selectProvince(province);
                    closeProvinceDD();
                });
            });
        }

        function selectProvince(province) {
            value.province = province;
            value.city = null;
            provinceEl.querySelector('.cs-select-value').textContent = locale === 'en' ? province.nameEn : province.name;
            provinceEl.querySelector('.cs-select-value').classList.remove('cs-placeholder');

            // Enable city dropdown
            cityEl.classList.remove('cs-disabled');
            cityEl.querySelector('.cs-select-value').textContent = str.city;
            cityEl.querySelector('.cs-select-value').classList.add('cs-placeholder');

            // Clear city inputs
            if (cityInput) cityInput.value = '';
            if (latInput) latInput.value = '';
            if (lngInput) lngInput.value = '';
            if (tzInput) tzInput.value = '';

            renderCityList('');
            fireChange();
        }

        function openProvinceDD() {
            closeCityDD();
            renderProvinceList('');
            provinceDD.style.display = 'block';
            provinceSearch.value = '';
            provinceSearch.focus();
        }

        function closeProvinceDD() {
            provinceDD.style.display = 'none';
        }

        provinceEl.addEventListener('click', function (e) {
            e.stopPropagation();
            if (provinceDD.style.display === 'block') closeProvinceDD();
            else openProvinceDD();
        });

        provinceSearch.addEventListener('input', function () {
            renderProvinceList(provinceSearch.value);
        });

        provinceSearch.addEventListener('click', function (e) { e.stopPropagation(); });

        // ============================================================
        //  CITY DROPDOWN
        // ============================================================
        function renderCityList(filter) {
            if (!value.province) return;
            var q = (filter || '').trim().toLowerCase();
            var cities = value.province.cities || [];
            var html = '';
            var count = 0;
            cities.forEach(function (c) {
                var label = locale === 'en' ? c.nameEn : c.name;
                if (q && label.indexOf(q) === -1 && c.nameEn.toLowerCase().indexOf(q) === -1) return;
                var active = value.city && value.city.id === c.id ? ' active' : '';
                html += '<div class="cs-dropdown-item' + active + '" data-id="' + c.id + '">' + label + '</div>';
                count++;
            });
            if (count === 0) html = '<div class="cs-dropdown-empty">' + str.noCities + '</div>';
            cityList.innerHTML = html;

            cityList.querySelectorAll('.cs-dropdown-item').forEach(function (item) {
                item.addEventListener('click', function () {
                    var cid = parseInt(item.dataset.id);
                    var city = cities.find(function (c) { return c.id === cid; });
                    if (city) selectCity(city);
                    closeCityDD();
                });
            });
        }

        function selectCity(city) {
            value.city = city;
            var label = locale === 'en' ? city.nameEn : city.name;
            cityEl.querySelector('.cs-select-value').textContent = label;
            cityEl.querySelector('.cs-select-value').classList.remove('cs-placeholder');

            // Set hidden input values
            if (cityInput) cityInput.value = label;

            // Auto-fill lat/lng/tz from coords database
            var coords = _provinceCoords[city.name];
            if (coords) {
                if (latInput) latInput.value = coords.lat;
                if (lngInput) lngInput.value = coords.lng;
                if (tzInput) tzInput.value = coords.tz;
            }
            fireChange();
        }

        function openCityDD() {
            if (!value.province) return;
            closeProvinceDD();
            renderCityList('');
            cityDD.style.display = 'block';
            citySearch.value = '';
            citySearch.focus();
        }

        function closeCityDD() {
            cityDD.style.display = 'none';
        }

        cityEl.addEventListener('click', function (e) {
            e.stopPropagation();
            if (cityEl.classList.contains('cs-disabled')) return;
            if (cityDD.style.display === 'block') closeCityDD();
            else openCityDD();
        });

        citySearch.addEventListener('input', function () {
            renderCityList(citySearch.value);
        });

        citySearch.addEventListener('click', function (e) { e.stopPropagation(); });

        // ============================================================
        //  CLOSE ON OUTSIDE CLICK
        // ============================================================
        document.addEventListener('click', function () {
            closeProvinceDD();
            closeCityDD();
        });

        // ============================================================
        //  CHANGE EVENT
        // ============================================================
        function fireChange() {
            onSelect({
                province: value.province ? { id: value.province.id, name: value.province.name, nameEn: value.province.nameEn } : null,
                city: value.city ? { id: value.city.id, name: value.city.name, nameEn: value.city.nameEn } : null,
                lat: latInput ? parseFloat(latInput.value) || null : null,
                lng: lngInput ? parseFloat(lngInput.value) || null : null,
                tz: tzInput ? parseFloat(tzInput.value) || null : null
            });
        }

        // ============================================================
        //  PUBLIC API
        // ============================================================
        return {
            getValue: function () { return { province: value.province, city: value.city }; },
            setValue: function (province, city) {
                if (province) selectProvince(province);
                if (city && value.province) selectCity(city);
            },
            clear: function () {
                value.province = null;
                value.city = null;
                provinceEl.querySelector('.cs-select-value').textContent = str.province;
                provinceEl.querySelector('.cs-select-value').classList.add('cs-placeholder');
                cityEl.classList.add('cs-disabled');
                cityEl.querySelector('.cs-select-value').textContent = str.selectProvinceFirst;
                cityEl.querySelector('.cs-select-value').classList.add('cs-placeholder');
                if (cityInput) cityInput.value = '';
                if (latInput) latInput.value = '';
                if (lngInput) lngInput.value = '';
                if (tzInput) tzInput.value = '';
            }
        };
    }

    // Load coordinate data on init
    buildCoordsIndex(function () {});

    window.CitySelector = createCitySelector;

})();
