
# Editable

This is a simple event-driven jQuery in-place editing plugin. It allows to easily add in-place
editing to your pages with no extra markup necessary. Here is an example of how to use it:

```
// script
$('.edit').editable();

// html
<div class="edit">Some text to edit</div>
```


##About##

What makes this library different from many of other in-place plugins such as
[*jeditable*](http://www.appelsiini.net/projects/jeditable), which is an excellent plugin and from which
this plugin is based on, is that this plugin is event driven as much as possible.
This allows for the plugin to be extremely dynamic and expandable, which in turn allows for things like that:

```
var edit = $('.edit').editable(...);

// some time later
edit.bind('committed.editable', function(commit_val, val, original_val) {
    alert('Hey. Congrats! You just changed ' + original_val + ' to ' + val);
}
```

without passing a million callback functions to the constructor function. Please read below
for the full list of available events and their parameters.



##Requirements##

This library is dependent on a couple of other jQuery plugins.

* [`jQuery.Class`](https://github.com/miki725/jquery-class)

  Widgets in this plugin are class based in order to enable inheritance, hence allowing to create
  new widget types with ease. **Note** Use this specific fork and not the original since I have changed
  it a bit so the original will break on you. If you are already using this plugin, you can replace
  it with my fork. It is a superset of the original repo, so nothing should break. I just added an option
  to be able to extend static properties.


##Options##

Here are the supported options which can be passed to the plugin such as:

```
$('.edit').editable({
   key: value,
   ...
})
```

###`event`###

  {*str*}

  Any jQuery supported event which will be used to trigger the editing. The default is *dblclick*.

###`on_blur`###

  {*str*} [*cancel*, *submit* or *none*]

  Specifies what should happen when the user blurs from the edit element. Please note that each widget
  when triggering a blur mechanism can pass a *force* parameter which if true, this options is ignored
  and blur is forced. Default is *cancel*.

###`auto_widget`###

  {*bool*}

  If true, the widget type will be tried to be looked up from the element's *data-widget* attribute.
  Otherwise it will use the given widget type in the options, or the default if one is not given.
  Default is *true*.

###`widget`###

  {*str*}

  The widget type to be used for the edit. Default is *text*.

###`widget_options`###

  {*object*}

  An object which will be passed to the widget when it is initialized. If you make a custom widget, you
  can pass anything here. The default options are:

  * `width` {*str*, *int*}

    The width of editable element. If '*auto*', the width of the element will match the width of the
    original edit element. Default is *auto*.

  * `height` {*str*, *int*}

    The height of editable element. If '*auto*', the height of the element will match the height of the
    original edit element. Default is *auto*.

  * `inline` {*bool*}

    If the editable element should be inline. Default is *false*.

###`null_val`###

  {*str*}

  The null value of the widget. Sometimes when the value is null, something else is displayed to the
  user instead of an empty string, so this options is used in order to figure which value to ignore
  when the edit is initialized and which value to display if user changed the value to an empty string.
  Default is *none*.

###`parent_width`###

  {*str*}

  The width of the parent element during the edit. If the edit field is inside of fluid table,
  even if the *widget_options.widht* is *true*, just by introducing a dom element to the table,
  it can cause the table sizes to shift which is not necessarily pleasing. This options if set
  to *fixed* then while the edit is happening, it will set the width of the parent element
  to a fixed number fixing the issue. Default is *fixed*.

###`parent_height`###

  {*str*}

  Same as for *parent_width* but for height.

###`widget_value`###

  {*function*}

  Sometimes creating a new widget might be an overkill for some basic preprocessing. This hook
  if given, should take a value and return a processed value. it will be called before calling
  the widget's *render* method. Some possible usage is to convert original value to lower case.

  **Parameters**

  * `val` {*str*} The original value to be edited
  * `settings` {*object*} The editable settings. This is mainly oriented for extending Editable.

###`invert_value`###

  {*function*}

  This is an inverse of the *widget_value* hook. It will be called before changing the replacing
  the edit element value.

  **Parameters**

  * `val` {*str*} The edited value
  * `settings` {*object*} The editable settings. This is mainly oriented for extending Editable.

###`process_commit`###

  {*function*}

  This hook is mainly made when the value has to be submitted to the server. After this function
  processes the value (gets the response from the server), it's job is to trigger the validation
  of the value. Since it is called with the context of the original edit element, *this* can be
  used:

  ```
  function process_commit(commit_val, val, original_val) {
      this.trigger('validate.editable', [...]);
  }
  ```

  **Parameters**

  * `commit_val` {*str*} The commit value as returned by the widget
  * `val` {*str*} The visible value as returned by the widget
  * `original_val` {*str*} The original value of the element
  * `settings` {*object*} The editable settings. This is mainly oriented for extending Editable.

###`validate_value`###

  {*function*}

  The job of this function is to validate the processed value in the commit cycle. All arguments passed to
  the *validate.editable* event are going to be passed to this function. If the value is invalid,
  it should throw an error. If valid, it should just return the valid value which is going to be
  passed to the *validate_success* hook if given.

  **Parameters**

  * `val` {*str*} The value to be validated
  * `settings` {*object*} The editable settings. This is mainly oriented for extending Editable.

###`validate_error`###

  {*function*}

  Normally if validation fails, the commit cycle is cancelled and the value is not committed
  (the edit widget (e.g. textbox) still appears allowing the user to correct the mistake).
  However if for some reason, after the invalid input, the value still has to be committed on the screen
  (the server already failed), this function can be used to do that. In that case it should trigger
  *replace.editable* event.

  **Note** do not use this hook in order to display error messages to the user. For that, you can bing
  to the *errorful.editable* event. This hook is allowed for changing the default behaviour of the plugin.
  For everything else, events should be used.

  **Parameters**

  * `err` {*str*} The error which was raised during validation
  * `settings` {*object*} The editable settings. This is mainly oriented for extending Editable.

###`validate_success`###

  {*function*}

  If the validation is successful, normally the returned value from *validate_value* is going to be used
  (after passing it through *invert_value*) in order to replace the value, however if any other
  additional processing has to be applied to the value, this function is for that. It should take
  a value and returned a processed value which will be used in order to replace the original element.

  **Parameters**

  * `val` {*str*} The value which was successfully validated
  * `settings` {*object*} The editable settings. This is mainly oriented for extending Editable.


##Events##

###`preedit.editable`###

  Triggered before the body of the *edit.editable* is executed therefore therefore allowing to apply
  any actions necessary before the widget is going to be rendered.

###`edit.editable`###

  Triggered whenever the edit trigger action occurs. That can either be a user action (e.g. *dblclick*) or
  function call in JavaScript (e.g. *$(el).trigger('edit.editable')*).

###`blur.editable`###

  When a user blurs away from the edit widget. Please note that each widget provides it's own
  callback for blur event since blur can be triggered with different actions in different widgets.

  **Parameters**:

  * *force* {*bool*} If the blur has to be forced (e.g. Esc was pressed)

###`blurred.editable`###

  *blur.editable* just starts the blur process but does not guarantee that the blur will happen
  for whatever reason (e.g. *on_blur == 'none'*). This event is triggered only when the blur
  actually happens.

  **Parameters**:

  * *force* {*bool*} If the blur was forced

###`revert.editable`###

  Start the revert process where the value is changed back to its original state. All changes
  are discarded.

###`reverted.editable`###

  When the revert is complete.

  **Parameters**

  * *original_val* {*str*} The original html value of the editable element to which the revert changed

###`commit.editable`###

  When the editable value was committed by the widget or via a function call (*$(el).trigger('commit.editable')*).

###`committed.editable`###

  The *commit* triggers the commit of the value whereas this event is to let the listener know that
  commit happened.

  **Parameters**

  * *commit_val* {*str*} The value to be committed to a program interface returned by a widget. Good example
    is the value of the *option* returned in the *select* tag.
  * *val* {*str*} The value to be displayed back to the user if validation is successful.
  * *original_val* {*str*} The original value of the editable element.

###`validate.editable`###

  Is triggered after the value is processed.

  **Parameters**

  * `val` {*str*} the value to validate.

###`validating.editable`###

  *validate.editable* triggers an action whereas this event is just a consumer of data.
  It is passed also passed the value which has to be validated.

  **Parameters**

  * `val` {*str*} the value which is being validated - the only passed from *process_commit*

###`success.editable`###

  Used to trigger the processing of successfully validated value

  **Parameters**

  * `val` {*str*} the value to be processed which was previously successfully validated

###`successful.editable`###

  Event which is triggered when the validation was successful and is passed the value which was validated

  **Parameters**

  * `val` {*str*} the value successfully validated

###`error.editable`###

  Used to trigger the processing of not successfully validated value

  **Parameters**

  * `val` {*str*} the value to be processed which was previously not successfully validated

###`errorful.editable`###

  Event which is triggered when the validation was not successful and is passed the value which was validated

  **Parameters**

  * `val` {*str*} the value not successfully validated

###`replace.editable`###

  Used to replace the widget, where the original element is with some other value. Please note that
  whatever value is passed into this event is going to go through `invert_value` before actually changing
  the value.

  **Parameters**

  * `val` {*str*} The value to which change the edit element

###`replaced.editable`###

  When the replace is complete.

  **Parameters**

  * `to` {*str*} To which the value was changed to
  * `from` {*str*} The original value of the edit element

