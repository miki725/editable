/*!
 * Server extension for Editable - jQuery in place edit plugin
 *
 * Copyright (c) 2012 Miroslav Shubernetskiy
 *
 * Based on Jeditable:
 *    http://www.appelsiini.net/projects/jeditable
 */


(function ($) {

    $.fn.editable_server = function (options) {
        "use strict";

        var settings = $.extend({}, $.editable_server.defaults, options);

        var get_elementset = function (selector) {
            var $el;
            if (settings.selector !== null) {
                if (typeof settings.selector === 'function') {
                    $el = settings.selector.call(this);
                } else {
                    $el = $(settings.selector);
                }
            } else {
                $el = $(this);
            }
            if (selector !== null) {
                if (typeof selector === 'function') {
                    $el = selector.call($el);
                } else {
                    $el = $(selector);
                }
            }
            return $el;
        };

        return this.editable(settings).bind(
            {
                'successful.editable': function () {
                    if (settings.success_class !== '') {
                        var $el = get_elementset.call(this, settings.success_selector);
                        $el.addClass(settings.success_class);
                        setTimeout(function () {
                            $el.removeClass(settings.success_class);
                        }, settings.timeout);
                    }
                },
                'errorful.editable'  : function () {
                    if (settings.error_class !== '') {
                        var $el = get_elementset.call(this, settings.error_selector);
                        $el.addClass(settings.error_class);
                        setTimeout(function () {
                            $el.removeClass(settings.error_class);
                        }, settings.timeout);
                    }
                }
            }
        );

    };

    $.editable_server = {
        defaults: {
            ajax_options    : {
                type    : 'POST',
                dataType: 'json'
            },
            selector        : null,
            error_selector  : null,
            error_class     : 'editable-error',
            success_selector: null,
            success_class   : 'editable-success',
            timeout         : 3000,
            process_commit  : function (commit_val, val, original_val, settings) {
                var $el = this,
                    data = {},
                    url = $el.attr('data-commit-url'),
                    attr = $el.attr('data-commit-data');

                data[attr] = commit_val;

                var ajax_options = $.extend(
                    {
                        url    : url,
                        data   : data,
                        success: function (data) {
                            $el.trigger('validate.editable', [data, val]);
                        },
                        error  : function () {
                            $el.trigger('error.editable', ['Error with the server']);
                        }
                    },
                    settings.ajax_options
                );

                $.ajax(ajax_options);
            },
            validate_value  : function (data, val, settings) {
                if (!$.isEmptyObject(data.errors)) {
                    throw 'Invalid value';
                } else {
                    return val;
                }
            }
        }
    }

})(jQuery);
