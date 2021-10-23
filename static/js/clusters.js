var clusters = {
    slider : noUiSlider.create(document.getElementById('n-clusters-slider'),
    { 
        'start' : 2,     
        range: {
            'min': 2,
            'max': 7
        },
        tooltips: [true],
        step: 1
    }),
    prev_n_clusters: 2
}

var timeout_clusters = null;

function set_timer_reset_clusters() {
    if (timeout_clusters != null) window.clearTimeout(timeout_clusters);
    timeout_clusters = window.setTimeout(reset_clusters, 10000);
}

function reset_clusters() {
    clusters.slider.set(clusters.prev_n_clusters);
}

$(document).ready(function() {
    clusters.slider.on('set.two', set_timer_reset_clusters);
})