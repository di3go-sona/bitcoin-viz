function toggle_cluster_wrapper(e) {
    n = e.data
    wallets.toggle_cluster(n)
    $(e.target).css("background-color", wallets.color(n))
}
function update_graph_header_colors(){
    $(".clustered .legend-dot.wallets").each(function(){
        n = $(this).attr("cluster")
        $(this).css("background-color", wallets.color(n));
        $(this).click(n, toggle_cluster_wrapper);
    })
}