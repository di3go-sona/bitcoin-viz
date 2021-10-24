var min = 0, max = 0;
var slider_container = document.getElementById('n-tx-slider');
var checkboxes = $("input[type='checkbox'].filters-checkbox:checked").map(function(i) { return $(this).attr("id") }).toArray();
var timeout_filters = null;

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

    mergeTooltips(slider_container, 15, ' - ');
    // For resetting filters
    slider_container.noUiSlider.on('set.one', set_timer_reset_filters);
});

function set_timer_reset_filters() {
    if (timeout_filters != null) window.clearTimeout(timeout_filters)
    timeout_filters = window.setTimeout(reset_filters, 10000)
}

function reset_filters() {
    // Slider
    slider_container.noUiSlider.set([min, max])
    // Checkboxes
    prev_checked = checkboxes.length > 0 ? '#' + checkboxes.join(',#') : ""
    $(prev_checked).prop("checked", true)
    $("input[type='checkbox'].filters-checkbox").not(prev_checked).prop("checked", false)
}

// For resetting filters
$("input[type='checkbox'].filters-checkbox").click(set_timer_reset_filters);

$("#filters-apply-button").click(function() {
    if (timeout_filters != null) window.clearTimeout(timeout_filters)
    var range = slider_container.noUiSlider.get()
    var min_selected = parseFloat(range[0])
    var max_selected = parseFloat(range[1])
    var checkboxes_selected = $("input[type='checkbox']:checked").map(function(i) { return $(this).attr("id") }).toArray()

    if (min_selected != min || max_selected != max || !($(checkboxes_selected).not(checkboxes).length === 0 && $(checkboxes).not(checkboxes_selected).length === 0)) {
        min = min_selected
        max = max_selected
        checkboxes = checkboxes_selected
        $(document).trigger("filters-changed")
    }
})

$("#filters-reset-button").click(function() {
    min = slider_container.noUiSlider.options['range']['min'][0]
    max = slider_container.noUiSlider.options['range']['max'][0]
    slider_container.noUiSlider.set([min, max])
    
    c = $("input[type='checkbox'].filters-checkbox")
    c.prop('checked', true)
    checkboxes = c.map(function(i) { return $(this).attr("id") }).toArray()

    $(document).trigger("filters-changed")
})

// Copied from internet lol for merging tooltips
function mergeTooltips(slider, threshold, separator) {

    var textIsRtl = getComputedStyle(slider).direction === 'rtl';
    var isRtl = slider.noUiSlider.options.direction === 'rtl';
    var isVertical = slider.noUiSlider.options.orientation === 'vertical';
    var tooltips = slider.noUiSlider.getTooltips();
    var origins = slider.noUiSlider.getOrigins();

    // Move tooltips into the origin element. The default stylesheet handles this.
    tooltips.forEach(function (tooltip, index) {
        if (tooltip) {
            origins[index].appendChild(tooltip);
        }
    });

    slider.noUiSlider.on('update', function (values, handle, unencoded, tap, positions) {

        var pools = [[]];
        var poolPositions = [[]];
        var poolValues = [[]];
        var atPool = 0;

        // Assign the first tooltip to the first pool, if the tooltip is configured
        if (tooltips[0]) {
            pools[0][0] = 0;
            poolPositions[0][0] = positions[0];
            poolValues[0][0] = values[0];
        }

        for (var i = 1; i < positions.length; i++) {
            if (!tooltips[i] || (positions[i] - positions[i - 1]) > threshold) {
                atPool++;
                pools[atPool] = [];
                poolValues[atPool] = [];
                poolPositions[atPool] = [];
            }

            if (tooltips[i]) {
                pools[atPool].push(i);
                poolValues[atPool].push(values[i]);
                poolPositions[atPool].push(positions[i]);
            }
        }

        pools.forEach(function (pool, poolIndex) {
            var handlesInPool = pool.length;

            for (var j = 0; j < handlesInPool; j++) {
                var handleNumber = pool[j];

                if (j === handlesInPool - 1) {
                    var offset = 0;

                    poolPositions[poolIndex].forEach(function (value) {
                        offset += 1000 - 10 * value;
                    });

                    var direction = isVertical ? 'bottom' : 'right';
                    var last = isRtl ? 0 : handlesInPool - 1;
                    var lastOffset = 1000 - 10 * poolPositions[poolIndex][last];
                    offset = (textIsRtl && !isVertical ? 100 : 0) + (offset / handlesInPool) - lastOffset;

                    // Center this tooltip over the affected handles
                    tooltips[handleNumber].innerHTML = poolValues[poolIndex].join(separator);
                    tooltips[handleNumber].style.display = 'block';
                    tooltips[handleNumber].style[direction] = offset + '%';
                } else {
                    // Hide this tooltip
                    tooltips[handleNumber].style.display = 'none';
                }
            }
        });
    });
}