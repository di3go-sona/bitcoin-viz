function update_graph_header_colors(){
    $(".clustered .legend-dot.wallets").each(function(){
        n = parseInt($(this).attr("cluster"))
        $(this).css("background-color",wallets.color(n));
    })
}