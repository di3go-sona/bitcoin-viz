var min = 0, max = 0
var slider_container = document.getElementById('no-ui-slider')

d3.json("/range_bitcoin").then( function(data) {
    min = data["min"]
    max = data["max"]

    var range_all_sliders = {
        'min': [min],
        '20%': [0.001],
        '30%': [0.01],
        '40%': [0.1],
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
