(function ($) {

    var base = $.editable.widgets.base;

    $.extend(
        $.editable.widgets,
        {
            'bootstrap-date': $.editable.widgets.text.extend(
                {
                    settings: {
                        widget_date_format: 'MM/DD/YYYY',
                        bootstrap_format  : 'mm/dd/yyyy',
                        invert_date_format: 'ddd, MMM D, YY'
                    },

                    destroy: function () {
                        this.rendered_html.blur();
                        this.Super();
                    },

                    focus: function (f) {
                        this.rendered_html.focus().datepicker();
                        this.Super(f);
                    },

                    render: function (value, properties) {
                        var dom;

                        if (value) {
                            value = moment(value).format(this.settings.widget_date_format);
                        } else {
                            value = moment().format(this.settings.widget_date_format);
                        }

                        dom = this.Super(value, properties);
                        dom.find('input')
                            .attr({
                                      'data-date'       : value,
                                      'date-date-format': this.settings.bootstrap_format,
                                      'placeholder'     : this.settings.bootstrap_format
                                  });

                        return dom;
                    },

                    val: function () {
                        var commit_value = this.commit_val();
                        if (commit_value) {
                            return moment(this.commit_val()).format(this.settings.invert_date_format);
                        } else {
                            return commit_value;
                        }
                    }
                }
            )
        }
    )

})(jQuery);
