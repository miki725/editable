/*
 * Editable - jQuery in place edit plugin
 *
 * This module is for debugging purposes. It reports whenever any of the editable
 * events are triggered.
 *
 * Copyright (c) 2012 Miroslav Shubernetskiy
 *
 * Based on Jeditable:
 *    http://www.appelsiini.net/projects/jeditable
 *
 */


(function ($) {

    $.fn.editable_debug = function () {

        var NAMESPACE = 'editable',
            EVENTS = [
                'edit',
                'blur',
                'blurred',
                'revert',
                'reverted',
                'commit',
                'committed',
                'validate',
                'validating',
                'success',
                'successful',
                'error',
                'errorful',
                'replace',
                'replaced'
            ];

        var debug = function (e) {
            console.log(e.type);
            console.log(arguments);
        };

        for (var i = -1, len = EVENTS.length; ++i < len;) {
            this.bind(EVENTS[i] + '.' + NAMESPACE, debug);
        }

        return this;
    };

})(jQuery);