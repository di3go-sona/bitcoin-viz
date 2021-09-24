var min = 0, max = 0
var slider_container = document.getElementById('no-ui-slider')
var checkboxes = $("input[type='checkbox']:checked").map(function(i) { return $(this).attr("id") })

d3.json("/range_bitcoin").then( function(data) {
    min = data["min"]
    max = Math.round(data["max"])

    var range_all_sliders = {
        'min': [min],
        '15%': [0.001],
        '30%': [0.01],
        '45%': [0.1],
        '60%': [1],
        '70%': [10],
        '80%': [20],
        '90%': [50],
        'max': [max]
    };

    noUiSlider.create(slider_container, {
        start: [min, max],
        connect: [false, true, false],
        tooltips: [
            true,
            true
        ],
        format: {
            // 'to' the formatted value. Receives a number.
            to: function (value) {
                if (value < 1) return `${parseFloat(value).toExponential(2)}`
                else           return `${parseFloat(value).toFixed(2)}`
            },
            // 'from' the formatted value.
            // Receives a string, should return a number.
            from: function (value) {
                return Number(value.replace(',-', ''));
            }
        },
        range: range_all_sliders,
        behaviour: 'tap',
        pips: {
            mode: 'range',
            density: 2,
            format: {
                // 'to' the formatted value. Receives a number.
                to: function (value) {
                    if (value < 1) return `${parseFloat(value).toExponential(0)}`
                    else           return `${parseInt(value)}`
                },
                // 'from' the formatted value.
                // Receives a string, should return a number.
                from: function (value) {
                    return Number(value.replace(',-', ''));
                }
            },
        }
    });
});

$("#apply-button").click(function() {
    var range = slider_container.noUiSlider.get()
    var min_selected = parseFloat(range[0])
    var max_selected = parseFloat(range[1])
    var checkboxes_selected = $("input[type='checkbox']:checked").map(function(i) { return $(this).attr("id") })

    if (min_selected != min || max_selected != max || !($(checkboxes_selected).not(checkboxes).length === 0 && $(checkboxes).not(checkboxes_selected).length === 0)) {
        min = min_selected
        max = max_selected
        checkboxes = checkboxes_selected
        $(document).trigger("filters_changed")
    }
})

$("#reset-button").click(function() {
    min = slider_container.noUiSlider.options['range']['min'][0]
    max = slider_container.noUiSlider.options['range']['max'][0]
    slider_container.noUiSlider.set([min, max])
    
    $("input[type='checkbox']").prop('checked', true)
    checkboxes = $("input[type='checkbox']:checked").map(function(i) { return $(this).attr("id") })

    $(document).trigger("filters_changed")
})