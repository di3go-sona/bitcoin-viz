var clusters = {
    slider : noUiSlider.create(document.getElementById('n-clusters-slider'),
    { 
        'start' : 2,     
        range: {
            'min': 2,
            'max': 8
        },
        step: 1,
        format: wNumb({
            decimals: 0
        })
    }),
    prev_n_clusters: 2,
    timeout_clusters: null
}

function set_timer_reset_clusters() {
    if (clusters.timeout_clusters != null) window.clearTimeout(clusters.timeout_clusters);
    clusters.timeout_clusters = window.setTimeout(reset_clusters, 10000);
}

function reset_clusters() {
    clusters.slider.set(clusters.prev_n_clusters);
    set_n_clusters_value();
}

function set_n_clusters_value() {
    $("#n_clusters_value").text(clusters.slider.get());
}

$(document).ready(function() {
    clusters.slider.on('set.two', set_timer_reset_clusters);
    clusters.slider.on('slide.two', set_n_clusters_value);
    clusters.prev_n_clusters = parseInt($("#n_clusters_value").text());
    reset_clusters();
})