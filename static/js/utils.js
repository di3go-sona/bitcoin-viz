function toggle_cluster_wrapper(e) {
    n = e.data
    wallets.toggle_cluster(n)
    $(e.target).css("background-color", wallets.color(n))
}

function update_graph_header(){
    $(".clustered .legend-dot.wallets").each(function(){
        n = $(this).attr("cluster")
        $(this).css("background-color", wallets.color(n));
        $(this).click(n, toggle_cluster_wrapper);
    })
}

function update_n_clusters_selector(event) {
    v = $(event.target).val()
    if (parseInt(v)){
        wallets.clustering_start_button.prop("disabled",false)
    } else {
        wallets.clustering_start_button.prop("disabled",true)
    }
}

$(document).on("wallets-loaded", function(){
    $('#n_clusters').change(update_n_clusters_selector)
    $('#n_clusters').trigger("change")
})


