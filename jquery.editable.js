/*!
 * Editable - jQuery in place edit plugin based on Jeditable
 *
 * Copyright (c) 2012 Miroslav Shubernetskiy
 *
 * Based on Jeditable:
 *    http://www.appelsiini.net/projects/jeditable
 */

(function ($) {

    $.fn.editable = function (options) {
        "use strict";

        var global_settings = $.extend({}, $.editable.defaults, options);

        // process each element in the element set
        return this.each(function () {


            // some initialization variables
            // ---------------------------------------------------------------------------------------------------------
            {
                var original = this, $original = $(original),
                    original_val, // changes on every event
                    key, attr,
                    attr_settings = {
                        'data-null-val'     : 'null_val',
                        'data-parent-width' : 'parent_width',
                        'data-parent-height': 'parent_height'
                    },

                // extend from global_settings to have a unique copy instead of changing
                // attributes on the global variable
                    settings = $.extend({}, global_settings);

                // add settings from the element if present
                for (key in attr_settings) {
                    if (attr_settings.hasOwnProperty(key)) {
                        attr = $original.attr(key);
                        if (attr !== undefined) {
                            settings[attr_settings[key]] = attr;
                        }
                    }
                }

            }

            // get the widget class to improve the performance
            // this way during the actual event, widget only has to be initialized
            // ---------------------------------------------------------------------------------------------------------
            {
                var widget_class = null,
                    widget_options = $.extend({}, settings.widget_options),
                    widgets = $.editable.widgets,
                    widget; // replaced each time the event is triggered

                // if the widget type is specified in the element by using data-widget attribute
                var auto_widget = function () {
                    if (settings.auto_widget === true) {
                        var widget = $original.attr('data-widget'),
                            options = $original.attr('data-widget-options');

                        if (options !== undefined && options) {
                            // get the options for the widget
                            // get the options from the element attribute if exists
                            if (options !== undefined) {
                                $.extend(widget_options, JSON.parse(options));
                            }
                        }

                        // if the attribute exists and it has a value
                        if (widget !== undefined && widget) {
                            // widget type is provided
                            // make sure it is supported
                            if (!widgets.hasOwnProperty(widget)) {
                                throw 'Not supported widget \'' + widget + '\'';
                            }
                            widget_class = widgets[widget];

                            return true;
                        }
                    }
                    return false;
                };

                // the widget type is provided as part of editable initialization
                // e.g.   $(elm).editable(...)
                var provided_widget = function () {
                    if (widgets.hasOwnProperty(settings.widget)) {
                        widget_class = widgets[settings.widget];
                    } else {
                        throw 'Not supported widget \'' + settings.widget + '\'';
                    }
                };

                // try to find the widget type in the element
                // if fails, falls back to value given at initialization (or default)
                if (settings.auto_widget === true) {
                    if (auto_widget() === false) {
                        provided_widget();
                    }
                } else if (typeof(settings.widget) === 'string') {
                    provided_widget();
                } else {
                    throw 'Not supported widget type \'' + typeof(settings.widget) + '\'';
                }

                // get the options specific to each widget
                // make the function exists
                var el_options = widget_class.hasOwnProperty('get_el_options') &&
                    typeof(widget_class.get_el_options) === 'function' ?
                    widget_class.get_el_options($original) : {};
                $.extend(widget_options, el_options);

            }


            // event handlers
            // ---------------------------------------------------------------------------------------------------------
            {

                var event_process = function (e) {

                    e.preventDefault();
                    e.stopPropagation();

                    original_val = $.trim($original.html());
                    original_val = original_val === settings.null_val ? '' : original_val;
                    var original_properties = {
                        width : $original.width(),
                        height: $original.height()
                    };

                    $original.trigger('preedit.editable');


                    // modify the parent if necessary
                    // -------------------------------------------------------------------------------------------------
                    if (settings.parent_width === 'fixed') {
                        $original.parent().width(original_properties.width + 'px');
                    }
                    if (settings.parent_height === 'fixed') {
                        $original.parent().height(original_properties.height + 'px');
                    }


                    // generate the edit html using widget and replace it with the original value
                    // -------------------------------------------------------------------------------------------------
                    widget = new widget_class(widget_options);
                    var widget_val = original_val;
                    if (typeof(settings.widget_value) === 'function') {
                        widget_val = settings.widget_value(widget_val, settings);
                    }
                    var edit_html = widget.render(widget_val, original_properties);
                    $original.html(edit_html);
                    widget.focus();


                    // define what should happen
                    // -------------------------------------------------------------------------------------------------
                    widget.blur(function (e, force) {
                        $original.trigger('blur.editable', [force || false]);
                    });
                    widget.commit(function () {
                        $original.trigger('commit.editable');
                    });

                };

                var replace = function (e, val) {
                    // cleanup
                    unbind_edit_events();
                    widget.destroy();

                    val = !val ? settings.null_val : val;
                    if (typeof(settings.invert_value) === 'function') {
                        val = settings.invert_value(val, settings);
                    }
                    $original.html(val);

                    if (settings.parent_width === 'fixed') {
                        $original.parent().css('width', '');
                    }
                    if (settings.parent_height === 'fixed') {
                        $original.parent().css('height', '');
                    }

                    bind_trigger_events();

                    $original.trigger('replaced.editable', [val, original_val]);
                };

                var blur = function (e, force) {

                    // force blur
                    if (force) {
                        $original.trigger('blurred.editable', [force]);
                        $original.trigger('revert.editable');
                        return;
                    }
                    // else follow the on_blur rules
                    if (settings.on_blur === 'cancel') {
                        $original.trigger('blurred.editable', [force]);
                        $original.trigger('revert.editable');
                    } else if (settings.on_blur === 'commit') {
                        $original.trigger('blurred.editable', [force]);
                        $original.trigger('commit.editable');
                    } else if (settings.on_blur === 'none') {

                    } else {
                        throw 'Unsupported on_blur action type \'' + settings.on_blur + '\'';
                    }
                };

                var revert = function () {
                    $original.trigger('replace.editable', [original_val]);
                    $original.trigger('reverted.editable', [original_val]);
                };

                var commit = function () {
                    var commit_val = widget.commit_val(), val = widget.val();
                    $original.trigger('committed.editable', [commit_val, val, original_val]);
                    // process the value
                    if (typeof(settings.process_commit) === 'function') {
                        settings.process_commit.call($original, commit_val, val, original_val, settings);
                    } else {
                        // call the validation
                        $original.trigger('validate.editable', [val]);
                    }
                };

                var validate = function () {
                    var args = Array.prototype.slice.call(arguments);
                    args.splice(0, 1);
                    $original.trigger('validating.editable', args);
                    try {
                        if (typeof(settings.validate_value) === 'function') {
                            args.push(settings);
                            args = settings.validate_value.apply($original, args);
                        }
                        $original.trigger('success.editable', args)
                    } catch (err) {
                        $original.trigger('error.editable', [err]);
                    }
                };

                var success = function () {
                    var args = Array.prototype.slice.call(arguments);
                    args.splice(0, 1);
                    $original.trigger('successful.editable', args);
                    if (typeof(settings.validate_success) === 'function') {
                        args.push(settings);
                        args = settings.validate_success.apply($original, args);
                    }
                    $original.trigger('replace.editable', args);
                };

                var error = function (e, err) {
                    var args = Array.prototype.slice.call(arguments);
                    args.splice(0, 1);
                    $original.trigger('errorful.editable', args);
                    if (typeof(settings.validate_error) === 'function') {
                        args.push(settings);
                        settings.validate_error.apply($original, args);
                    } else {
                        console.error('Error validating:');
                        console.log(err);
                    }
                };

                var call_event_process_event = function () {
                    $original.trigger('edit.editable');
                };

                var call_event_process_api = function (e) {
                    unbind_trigger_events();
                    event_process(e);
                    bind_edit_events();

                    // if instant_commit, then commit immediately
                    if (widget_class.hasOwnProperty('instant_commit') && widget_class.instant_commit === true) {
                        widget.commit();
                    }
                };

                /**
                 * Bind events to the original dom element which can trigger the editing process,
                 * or anything to do with triggering the edit process. This does not bind any
                 * events which occur during the editing process such as blur or commit.
                 */
                var bind_trigger_events = function () {
                    $original.bind(settings.event, call_event_process_event);
                    $original.bind('edit.editable', call_event_process_api)
                };

                /**
                 * Unbind all the events from the original dom element which trigger the editing process.
                 * The reason why that is necessary is because when the editing process is started lets say
                 * due to a click, then if the user clicks again on the element, it can cause unwanted
                 * side-effects, so to avoid them, events are unbinded from the element. This is also better
                 * compared to having an editing flag because if the event is not fired at all, it is faster
                 * compared to the event being fired and then checking if it should do anything.
                 */
                var unbind_trigger_events = function () {
                    $original.unbind(settings.event, call_event_process_event);
                    $original.unbind('edit.editable', call_event_process_api);
                };

                /**
                 * Bind all the events which can happen during the editing such as revert and commit
                 */
                var bind_edit_events = function () {
                    $original.bind('blur.editable', blur);
                    $original.bind('revert.editable', revert);
                    $original.bind('commit.editable', commit);
                    $original.bind('validate.editable', validate);
                    $original.bind('error.editable', error);
                    $original.bind('success.editable', success);
                    $original.bind('replace.editable', replace);
                };

                /**
                 * Unbind all the events which can happen during the editing such as revert and commit
                 * in order to avoid undesired effects when the same element is edited more then once.
                 */
                var unbind_edit_events = function () {
                    $original.unbind('blur.editable', blur);
                    $original.unbind('revert.editable', revert);
                    $original.unbind('commit.editable', commit);
                    $original.unbind('validate.editable', validate);
                    $original.unbind('error.editable', error);
                    $original.unbind('success.editable', success);
                    $original.unbind('replace.editable', replace);
                };

            }

            bind_trigger_events();

        });

    };

    $.editable = {
        defaults: {
            event           : 'dblclick',
            on_blur         : 'cancel',
            auto_widget     : true,
            widget          : 'text',
            widget_options  : {
                width : 'auto',
                height: 'auto',
                inline: false
            },
            null_val        : 'none',
            parent_width    : 'fixed',
            parent_height   : 'fixed',
            // hooks
            widget_value    : null,
            invert_value    : null,
            process_commit  : null,
            validate_value  : null,
            validate_success: null,
            validate_error  : null
        },
        widgets : {
            defaults: {
                classes: 'editable_input'
            }
        },
        helpers : {
            get_caret_position: function (el) {
                // from http://flightschool.acylt.com/devnotes/caret-position-woes/

                // Initialize
                var iCaretPos = 0;

                // IE Support
                if (document.selection) {

                    // Set focus on the element
                    el.focus();

                    // To get cursor position, get empty selection range
                    var oSel = document.selection.createRange();

                    // Move selection start to 0 position
                    oSel.moveStart('character', -el.value.length);

                    // The caret position is selection length
                    iCaretPos = oSel.text.length;
                }

                // Firefox support
                else if (el.selectionStart || el.selectionStart == '0')
                    iCaretPos = el.selectionStart;

                return iCaretPos;
            }
        }
    };


    var base = $.editable.widgets.base = $.Class.extend(
        {
            init: function (options) {
                this.settings = $.extend({}, $.editable.widgets.defaults, this.settings, options);
                this.rendered_html = '';
            },

            destroy: function () {
                this.rendered_html.unbind();
            },

            settings: null,

            render: function (el, properties) {
                // adjust the width and height
                var width = this.settings.width === 'auto' ?
                        properties.width + 'px' : this.settings.width,
                    height = this.settings.height === 'auto' ?
                        properties.height + 'px' : this.settings.height;
                el.css({
                           width : width,
                           height: height
                       });

                this.rendered_html = el;
                var div = $('<div></div>').append(this.rendered_html);
                if ([true, 'true'].indexOf(this.settings.inline) !== -1) {
                    div.css({display: 'inline'});
                }

                return div
            },

            val: function () {
                return this.commit_val();
            },

            commit_val: function () {
                return $(this.rendered_html).val();
            },

            blur: function (f) {
                if (typeof(f) !== 'function') {
                    return;
                }
                $(this.rendered_html).blur(function (e) {
                    f(e, false);
                });
                $(this.rendered_html).keydown(function (e) {
                    if (e.keyCode === 27) {
                        f(e, true);
                    }
                });
            },

            commit: function (f) {
                $(this.rendered_html).bind('keydown', $.proxy(function (e) {
                    if (e.keyCode === 13) {
                        if (typeof(f) === 'function') {
                            f(this);
                        }
                    }
                }, this));
            },

            focus: function (f) {
                $(this.rendered_html).focus();
                if (typeof(f) === 'function') {
                    f();
                }
            }
        }
    );

    var toggle = $.editable.widgets.toggle = base.extend(
        {
            render: function (value, properties) {
                this.rendered_html = $(value);
                $.extend(this.settings, properties);
            },

            commit: function (f) {
                if (f !== undefined) {
                    if (typeof f === 'function') {
                        this.commit_callback = f;
                    }
                } else {
                    if (this.commit_callback) {
                        var is_on = this.is_on();
                        if (is_on === true) {
                            this.toggle_off();
                        } else {
                            this.toggle_on();
                        }
                        $.proxy(this.commit_callback(this), this);
                    }
                }
            },

            commit_val: function () {
                console.log('commit_val');
                return this.is_on() ? 'on' : '';
            },

            val       : function () {
                console.log('val');
                return this.rendered_html;
            },

            // for toggling, these methods should not do anything
            blur      : function (f) {
            },
            focus     : function () {
            },

            // placeholders
            is_on     : null,
            toggle_on : null,
            toggle_off: null

        },
        {
            instant_commit: true
        }
    );

    $.extend(
        $.editable.widgets,
        {
            text: base.extend(
                {
                    render: function (value, properties) {
                        value = Encoder.htmlDecode(value);
                        var el = $('<input>').attr(
                            {
                                'class': this.settings.classes,
                                value  : value
                            }
                        );
                        return this.Super(el, properties);
                    }
                }
            ),

            textarea: base.extend(
                {
                    cursor_position: 0,

                    render: function (value, properties) {
                        value = value.replace(/<br>/g, '\n');
                        var el = $('<textarea></textarea>').html(value).attr(
                            {
                                'class': this.settings.classes
                            }
                        );
                        el.autosize();
                        return this.Super(el, properties);
                    },

                    commit_val: function () {
                        var commit_val = this.Super();
                        return commit_val.substring(0, this.cursor_position - 1) +
                            commit_val.substring(this.cursor_position);
                    },

                    val: function () {
                        return this.Super().replace(/\n/g, '<br>');
                    },

                    commit: function (f) {
                        var g = $.proxy(function (e) {

                            if (e.keyCode !== 13) {
                                return;
                            }

                            // unbind the function to avoid second clicks
                            this.rendered_html.unbind('keydown', g);

                            var h = $.proxy(function (e) {
                                if (e.keyCode === 13) {
                                    e.preventDefault();

                                    this.cursor_position = $.editable.helpers.get_caret_position(this.rendered_html[0]);

                                    if (typeof(f) === 'function') {
                                        f(this);
                                    }
                                }
                            }, this);

                            this.rendered_html.bind('keydown', h);

                            var t = setTimeout($.proxy(function (e) {
                                this.rendered_html.unbind('keydown', h);
                                this.rendered_html.bind('keydown', g);
                            }, this), 300);

                        }, this);
                        this.rendered_html.bind('keydown', g);
                    }
                }
            ),

            select: base.extend(
                {
                    render: function (value, properties) {
                        var choices = this.settings.choices,
                            el = $('<select></select>').attr({'class': this.settings.classes}),
                            key, option, option_el;
                        for (key in choices) {
                            if (choices.hasOwnProperty(key)) {
                                option = choices[key];
                                option_el = $('<option></option>').html(option).attr({value: key});
                                if (value === option || value === key) {
                                    option_el.attr({selected: 'selected'});
                                }
                                el.append(option_el);
                            }
                        }
                        return this.Super(el, properties);
                    },


                    val: function () {
                        var value,
                            val = this.commit_val(),
                            choices = this.settings.choices,
                            i;
                        for (i in choices) {
                            if (choices.hasOwnProperty(i)) {
                                if (i === val) {
                                    return choices[i];
                                }
                            }
                        }
                    },

                    commit: function (f) {
                        this.Super(f);
                        $(this.rendered_html).bind('change', $.proxy(function (e) {
                            if (typeof(f) === 'function') {
                                f(this);
                            }
                        }, this));
                    }
                },
                {
                    get_el_options: function (el) {
                        var choices = el.attr('data-widget-choices'),
                            options = {};
                        if (choices !== undefined) {
                            options.choices = JSON.parse(choices);
                        }
                        return options;
                    }
                }
            ),

            'icon-toggle': toggle.extend(
                {
                    is_on: function () {
                        return this.rendered_html.hasClass(this.settings.on_class);
                    },

                    toggle_on: function () {
                        this.rendered_html
                            .addClass(this.settings.on_class)
                            .removeClass(this.settings.off_class);
                    },

                    toggle_off: function () {
                        this.rendered_html
                            .addClass(this.settings.off_class)
                            .removeClass(this.settings.on_class);
                    }
                },
                {
                    instant_commit: true
                }
            )
        }
    );


})(jQuery);
