// create a global wallets variable where to store things
var wallets = {
    margin_top : 5,
    margin_right : 5, 
    margin_bottom : 5,
    margin_left : 5,
    init : false,
    clusters_map: null,
    transform : null, 

    interval_function: null,
    update_clustering : function(){
        d3.json(`/wallets/clusters?block=${timeline.current_block}`).then( function(data_wrapper) {
            console.log("Updating clustering")
            
            data = d3.csvParse(data_wrapper.csv, d3.autoType)
            
            wallets.clusters_map = new Map(data.map( d => {return [d.addr, d.cluster]}));

            wallets.svg.selectAll("circle")
                .data(data)
                .style("fill",function (d) { return wallets.color( d.cluster  || 0 ); }) 

            if ( data_wrapper.last ) {
                console.log("Ended clustering")
                wallets.clustering_button.prop("disabled",false)
                wallets.clustering_button.find(".spinner").hide()
                wallets.clustering_button.find(".text").show()

                clearInterval(wallets.interval_function)
                wallets.interval_function = null;
            }
            $(document).trigger("clusters_changed")
        })
    },

    start_clustering: function(){
        console.log("Start clustering")
        wallets.clustering_button.prop("disabled",true)
        wallets.clustering_button.find(".spinner").show()
        wallets.clustering_button.find(".text").hide()

        n_clusters = $("#n_clusters").val()
        xhttp = new XMLHttpRequest()
        xhttp.open("GET", `/wallets/clusters/start?n_clusters=${n_clusters}`, true);
        xhttp.send();

        wallets.svg.selectAll("circle")
                .data(data)
                .style("fill",function (d) { return wallets.color(null); }) 
        
        wallets.interval_function = setInterval(wallets.update_clustering, 300)
    },

    handleZoom: function(e) {
        var new_XScale = e.transform.rescaleX(wallets.x)
        var new_yScale = e.transform.rescaleY(wallets.y)

        // update axes with these new boundaries
        wallets.x_axis.call(d3.axisTop(new_XScale))
        wallets.y_axis.call(d3.axisRight(new_yScale))

        var circles = wallets.dots_g.selectAll('circle')
        circles.attr("cx", function (d) { return new_XScale(d.x) })
        circles.attr("cy", function (d) { return new_yScale(d.y) })
    },

    //Read the data
    load_wallets: function(block){

        if (!block){
            var endpoint = d3.json("/wallets")
        } else {
            var endpoint = d3.json(`/wallets?block=${block}`)
        }

        endpoint.then( function(data_wrapper) {
            data = d3.csvParse(data_wrapper.csv)
            if (data_wrapper.n_clusters){
                console.log(data_wrapper.n_clusters)
                wallets.clusters_map = new Map(data.map( d => {return [d.addr, d.cluster]}));
            }

            // Add X axis
            wallets.x = d3.scaleLinear()
                .domain([data_wrapper.min_x * 1.5, data_wrapper.max_x * 1.2])
                .range([0, wallets.width]);
            
            // Add Y axis
            wallets.y = d3.scaleLinear()
                .domain([data_wrapper.min_y * 1.5, data_wrapper.max_y * 1.2])
                .range([wallets.height, 0]);

            if (! (wallets.x_axis &&  wallets.y_axis) ){
                wallets.x_axis = wallets.svg.append("g")
                    .attr("transform", `translate(0, ${wallets.height})`)
                    .call(d3.axisTop(wallets.x))
                    .call(g => g.select(".domain").attr("display", "none"))

                wallets.y_axis = wallets.svg.append("g")
                    .call(d3.axisRight(wallets.y))
                    .call(g => g.select(".domain").attr("display", "none"))
                
                wallets.init = true
            } 

            wallets.dots_g
                .selectAll("dot")
                .data(data)
                .join("circle")
                    .attr("cx", function (d) { return wallets.x(d.x); } )
                    .attr("cy", function (d) { return wallets.y(d.y); } )
                    .attr("r", 3 / ( wallets.transform_k || 1) )
                    .style("fill",function (d) { return wallets.color(d.cluster || null); })

            if (wallets.interval_function){
                wallets.interval_function = setInterval(wallets.update_clustering, 300)
            }
        })
    }
}

$(document).ready(function(){
    wallets.width  = $('#clusters-container').width() - wallets.margin_left - wallets.margin_right;
    wallets.height = $('#clusters-container').height() - wallets.margin_top - wallets.margin_bottom;
    wallets.clustering_button = $('#clusters-start-button')
    wallets.color = d3.scaleOrdinal()
        .domain([null, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
        .range(d3.schemeSet2);

    update_graph_header_colors()

    // append the svg object to the body of the page
    wallets.svg = d3.select("#clusters-container")
        .append("svg")
            .attr("width", wallets.width + wallets.margin_left + wallets.margin_right)
            .attr("height", wallets.height + wallets.margin_top + wallets.margin_bottom)

    const zoom = d3.zoom()
        .scaleExtent([1, 10])
        .extent([[wallets.margin_left, 0], [wallets.width - wallets.margin_right, wallets.height]])
        .translateExtent([[wallets.margin_left, -Infinity], [wallets.width - wallets.margin_right, Infinity]])
        .on("zoom", wallets.handleZoom);

    wallets.svg.append("clipPath")
        .attr("id", "clip-clusters")
        .append("rect")
            .attr("x", wallets.margin_left + 25)
            .attr("y", wallets.margin_top)
            .attr("width", wallets.width - wallets.margin_left - wallets.margin_right - 15)
            .attr("height", wallets.height - wallets.margin_top - wallets.margin_bottom - 15); // -25 because i dont't know why there is a margin top

    wallets.dots_g = wallets.svg.append('g').attr("clip-path", "url(#clip-clusters)")

    wallets.clustering_button.click(wallets.start_clustering)
    wallets.load_wallets(null)

    wallets.svg.call(d3.zoom().on('zoom', wallets.handleZoom))

    $(document).on("block_changed", function(event) {
        if (wallets.interval_function){
            clearInterval(wallets.interval_function)
        }
        wallets.dots_g.selectAll("circle").transition().duration(globals.BLOCK_CHANGED_DELAY).attr("r", 0).remove()
        wallets.load_wallets(timeline.current_block)
     });
})