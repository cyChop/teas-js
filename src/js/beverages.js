/**
 * @module beverages
 */
define([
    'jquery',
    'underscore',

    './view/beverages'
// eslint-disable-next-line no-inline-comments
], function (/** @exports module:beverages */$, _, BeveragesView) {
    'use strict';

    /**
     * The jQuery plugin namespace.
     *
     * @external "jQuery.fn"
     * @see {@link http://learn.jquery.com/plugins/|jQuery Plugins}
     */

    // This is a problem...
    // eslint-disable-next-line valid-jsdoc
    /**
     * Creates a {@link BeveragesView} in the selected elements.
     *
     * @function external:"jQuery.fn".beverages
     * @param {Object} options the options for the beverages view
     */
    $.fn.beverages = function (options) {
        var settings = _.clone(options);
        settings.el = this;
        new BeveragesView(settings).render();
    };
});