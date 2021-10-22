function update_graph_card_header(){
    $(".clustered .legend-dot.wallets").each(function(){
        n = $(this).attr("cluster")
        
        $(this).css("background-color", wallets.color(n));
        
        $(this).click(n, function(e){
            n = e.data
            wallets.toggle_cluster(n)
            $(e.target).css("background-color", wallets.color(n))
        });
    })
}



