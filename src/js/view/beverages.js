define([
    'underscore',
    'backbone',
    'lib/rivets-cfg',
    'jquery',

    '../template/beverages.html',

    '../collection/beverages',
    '../i18n/i18n',

    'bootstrap/dist/js/umd/tooltip',

    '../../scss/beverages.scss'
], function (_, Backbone, rivets, $, template, Beverages, i18n) { // eslint-disable-line max-params
    'use strict';

    /* === Constants === */
    /* eslint-disable no-magic-numbers */
    /**
     * The value of the progress bar for the theine level (max is 100).
     *
     * The 'unknown' value is 100: the bar must be fully filled and will be styled differently.s
     * @type {Object}
     */
    var THEINE_LEVEL_PC = Object.freeze({
            none: 0,
            low: 25,
            medium: 50,
            high: 75,
            coffee: 100,
            unknown: 100
        }),
        AUTO_TIME_RANGE = Object.freeze({
            morning: [5, 11],
            daytime: [10, 20],
            evening: [18, 2],
            unknown: [0, 24]
        });
    /* eslint-enable no-magic-numbers */ // eslint-disable-line lines-around-comment

    /* === Rivets configuration === */
    rivets.formatters.theineLevel100 = function (value) {
        return THEINE_LEVEL_PC[value || 'unknown'];
    };

    rivets.formatters.minMax = function (value, separator) {
        if (value) {
            if (value.min) {
                return value.max && value.min !== value.max
                    ? value.min + (separator ? separator : '-') + value.max
                    : value.min;
            } else if (value.max) {
                return value.max;
            }
        }
        return '';
    };

    rivets.formatters.showMinMax = function (value) {
        return value && (value.min || value.max);
    };

    rivets.formatters.filtered = function (array) {
        return _.filter(array, function (beverage) {
            return beverage._show;
        });
    };

    /* === Constants & functions === */
    var isInTimeRange = function (range) {
        var min = AUTO_TIME_RANGE[range][0],
            max = AUTO_TIME_RANGE[range][1],
            time = new Date().getHours();
        return min <= max ? min <= time && time < max : min <= time || time < max;
    };

    /* === Backbone view === */
    return Backbone.View.extend({

        /** {Beverages} The full collection of all available beverages. */
        beverages: null,

        /** Filters */
        filters: null,

        context: null,

        rview: null,

        events: {
            'click .filters .bev-icon': '_toggleBeverageFilter',
            'click .filters .moment-icon': '_toggleMomentFilter',
            'click .beverage .btn-more': '_toggleDetail',
            'click .beverage .btn-pick': '_pick'
        },

        initialize: function (options) {
            this.context = {
                i18n: null,
                ready: false,
                error: false
            };

            var gSheetId;
            if (options) {
                gSheetId = options.gSheetId;
                this.context.i18n = i18n(options.lang);
            } else {
                this.context.i18n = i18n();
            }

            this._initFilters(options.filters);
            if (gSheetId) {
                this._initAndFetchBeverages(gSheetId);
            } else {
                this.context.error = this.context.i18n.error.configuration;
            }
        },

        render: function () {
            // remove any previous binding
            if (this.rview) {
                this.rview.unbind();
            }

            // bind template to context
            this.context.beverages = this.beverages;
            this.context.filters = this.filters;
            this.rview = rivets.bind(this.$el.html(template), this.context);

            // init tooltips
            this._tooltip();

            // done, return the result
            return this;
        },

        _initFilters: function (options) {
            var availableBases = _.keys(this.context.i18n.basis),
                availableMoments = _.keys(this.context.i18n.moment);

            var settings = _.defaults(options || {}, {
                basis: availableBases
            });
            if (!settings.autoTime && !settings.moments) {
                settings.moments = availableMoments;
            }

            if (_.contains(settings.basis, 'teas')) {
                settings.basis = settings.basis.concat(_.filter(availableBases, function (basis) {
                    return basis.startsWith('tea-');
                }));
            }

            this.filters = {
                bases: null,
                moments: null
            };

            this.filters.bases = [];
            for (var iBases = 0; iBases < availableBases.length; iBases++) {
                var basis = availableBases[iBases];
                this.filters.bases.push({
                    key: basis,
                    active: _.indexOf(settings.basis, basis) > -1
                });
            }

            this.filters.moments = [];
            for (var iTimes = 0; iTimes < availableMoments.length; iTimes++) {
                var moment = availableMoments[iTimes];
                this.filters.moments.push({
                    key: moment,
                    active: _.indexOf(settings.moments, moment) > -1 || options.autoTime && isInTimeRange(moment)
                });
            }
        },

        _initAndFetchBeverages: function (gSheetId) {
            this.beverages = new Beverages(null, {
                gSheetId: gSheetId
            });


            this.beverages
                .on('request', function () {
                    this.context.ready = false;
                }, this)
                .on('sync', function () {
                    this._filterBeverages();
                    this.context.ready = true;
                    this._tooltip();
                }, this)
                .fetch({
                    error: _.bind(function () {
                        this.context.error = this.context.i18n.error.loading;
                    }, this)
                });
        },

        _filterBeverages: function () {
            this.beverages.each(function (beverage) {
                beverage._show = this._isBasisActive(beverage) && this._isMomentActive(beverage);
            }.bind(this));
        },

        _isBasisActive: function (beverage) {
            return _.find(this.filters.bases, function (basis) {
                return beverage.get('basis') === basis.key;
            }).active;
        },

        _isMomentActive: function (beverage) {
            var times = beverage.get('time'),
                keys = _.keys(times);
            for (var i = 0; i < keys.length; i++) {
                var key = keys[i],
                    time = times[key];
                if (!rivets.formatters.defined(time) && _.findWhere(this.filters.moments, {key: 'unknown'}).active
                    || time && _.findWhere(this.filters.moments, {key: key}).active) {
                    return true;
                }
            }
            return false;
        },

        /**
         * Initializes the tooltips and popovers of the rendered page. This is set only on existing elements: the method
         * should be called again any time a new tooltip trigger element is added to the page.
         */
        _tooltip: function () {
            this.$('[data-toggle="tooltip"]').tooltip();
        },

        _toggleBeverageFilter: function (event) {
            this._toggleFilter(event, this.filters.bases);
        },

        _toggleMomentFilter: function (event) {
            this._toggleFilter(event, this.filters.moments);
        },

        _toggleFilter: function (event, filterCollection) {
            var key = $(event.currentTarget).data('key');
            var filter = _.find(filterCollection, function (basis) {
                return key === basis.key;
            });
            filter.active = !filter.active;
            this._filterBeverages();
        },

        _toggleDetail: function (event) {
            // FIXME manipulating with jQuery is BAD
            // Use jQuery only to browse the DOM, use data-binding to update it
            $(event.currentTarget).closest('.beverage').toggleClass('detailed');
        },

        _pick: function (event) {
            var id = $(event.currentTarget).closest('.beverage').data('id'),
                picked = this.beverages.get(id);
            // FIXME returns the clicked tea
            // We only need to store it into a collection
            return picked;
        },

        remove: function () {
            if (this.rview) {
                this.rview.unbind();
            }
            return _.bind(Backbone.View.prototype.remove, this)();
        }
    });
});