// create a global wallets variable where to store things
var wallets = {
    margin_top : 5,
    margin_right : 5, 
    margin_bottom : 5,
    margin_left : 5,

    clusters_map: new Map(),
    transform : null, 

    update_clustering_timer: null,

    stop_clustering : function(){
        console.log("Ended clustering")
                wallets.clustering_start_button.prop("disabled",false)
                wallets.clustering_start_button.find(".spinner").hide()
                wallets.clustering_start_button.find(".text").show()

                clearInterval(wallets.update_clustering_timer)
                wallets.update_clustering_timer = null;
    },

    update_clustering : function(){
        if (!wallets.update_clustering_timer) {return}
        d3.json(`/wallets/clusters?block=${timeline.current_block}`).then( function(data_wrapper) {

            console.log("Updating clustering")
            
            data = d3.csvParse(data_wrapper.csv, d3.autoType)
            wallets.clusters_map = new Map(data.map( d => {return [d.addr, d.cluster]}));

            wallets.dots_g.selectAll("circle")
                .data(data)
                .style("fill",function (d) { return wallets.color( d.cluster ); }) 

            if ( data_wrapper.last ) {
                wallets.stop_clustering();
            }
            $(document).trigger("clustering_changed")
        })
    },

    start_clustering: function(){
        console.log("Start clustering")
        wallets.clustering_start_button.prop("disabled",true)
        wallets.clustering_start_button.find(".spinner").show()
        wallets.clustering_start_button.find(".text").hide()

        n_clusters = $("#n_clusters").val()
        xhttp = new XMLHttpRequest()
        xhttp.open("GET", `/wallets/clusters/start?n_clusters=${n_clusters}`, true);
        xhttp.send();

        // Update colors
        wallets.svg.selectAll("circle")
                .data(data)
                .style("fill",function (d) { return wallets.color(null); }) 
        
        // Start polling for updates
        wallets.update_clustering_timer = setInterval(wallets.update_clustering, 300)
        setTimeout(d => {$(document).trigger("clustering_started")}, 300)

        
        
    },

    reset_clustering: function(){
        console.log("Reset clustering")

        xhttp = new XMLHttpRequest()
        xhttp.open("GET", `/wallets/clusters/reset`, false);
        xhttp.send();

        // Stop polling for updates
        wallets.stop_clustering()

        // Update colors
        wallets.svg.selectAll("circle")
            .data(data)
            .style("fill",function (d) { return wallets.color(null); }) 
        
        // Remove saved colors
        wallets.clusters_map = new Map()

        // Remove selected clusters
        wallets.deselected_clusters = []

        $(document).trigger("clustering_reset")
    },

    handleZoom: function(e) {
        var new_XScale = e.transform.rescaleX(wallets.x)
        var new_yScale = e.transform.rescaleY(wallets.y)

        // update axes with these new boundaries
        wallets.x_axis.call(d3.axisTop(new_XScale))
        wallets.y_axis.call(d3.axisRight(new_yScale))

        wallets.dots_g.attr("transform", e.transform)

        wallets.dots_g.selectAll('circle')
            .attr("r", 3 / ( e.transform.k || 1) )
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

            } 

            wallets.dots_g
                .selectAll("dot")
                .data(data)
                .join("circle")
                    .attr("cx", function (d) { return wallets.x(d.x); } )
                    .attr("cy", function (d) { return wallets.y(d.y); } )
                    .attr("r", 3 / ( wallets.transform_k || 1) )
                    .attr("cluster", function (d) { d.cluster || null })
                    .style("fill",function (d) { return wallets.color(d.cluster || null ) })

            if (wallets.update_clustering_timer){
                wallets.update_clustering_timer = setInterval(wallets.update_clustering, 300)
            }
        })

    },
    deselected_clusters : [],

    toggle_cluster : function(cluster_id){
        console.log( `Toggle cluster ${cluster_id}`)
        if (this.deselected_clusters.includes(cluster_id)) {
            this.deselected_clusters = this.deselected_clusters.filter(d => {return d != cluster_id})
        } else {
            this.deselected_clusters.push(cluster_id.toString(), parseInt(cluster_id))
        }

        wallets.dots_g.selectAll('circle')
            .filter( d => {return d.cluster == cluster_id })
            .style('fill', d => { return wallets.color(d.cluster) } )

        $(document).trigger("clustering_changed")
    },

    _color :  d3.scaleOrdinal()
        .domain([0, 1, 2, 3, 4, 5, 6, 7,  null])
        // .range(["#ff1f1f", "#78ff1f", "#1f5aff", "#ff961f", "#1fffb4", "#d21fff", "#f0ff1f", "#1fd2ff", "#ff1fb4"]),
        .range([ "#dc3545",  "#4576ff", "#ffa845", "#45ffc1", "#7645ff", "#f3ff45", "#45daff", "#ff45c1", "#ccc"]),

    color: function(cluster_id){
        c =  wallets._color(cluster_id)

        if (wallets.deselected_clusters.includes(cluster_id) ){
           return d3.color(c).darker(3) 
        } else {
            return c 
        }
    }
}



$(document).ready(function(){
    wallets.width  = $('#clusters-container').width() - wallets.margin_left - wallets.margin_right;
    wallets.height = $('#clusters-container').height() - wallets.margin_top - wallets.margin_bottom;

    wallets.clustering_start_button = $('#clusters-start-button')
    wallets.clustering_reset_button = $('#clusters-reset-button')

    wallets.clustering_start_button.click(wallets.start_clustering)
    wallets.clustering_reset_button.click(wallets.reset_clustering)

    update_graph_header()

    // append the svg object to the body of the page
    wallets.svg = d3.select("#clusters-container")
        .append("svg")
            .attr("width", wallets.width + wallets.margin_left + wallets.margin_right)
            .attr("height", wallets.height + wallets.margin_top + wallets.margin_bottom)
    
    wallets.svg.append("clipPath")
        .attr("id", "clip-clusters")
        .append("rect")
            .attr("x", wallets.margin_left + 25)
            .attr("y", wallets.margin_top)
            .attr("width", wallets.width - wallets.margin_left - wallets.margin_right - 15)
            .attr("height", wallets.height - wallets.margin_top - wallets.margin_bottom - 15)

    wallets.dots_g = wallets.svg.append("g")

    wallets.dots_g = wallets.svg.append('g')
        .attr("clip-path", "url(#clip-clusters)")
        .append("g")


    d3.zoom()
        .scaleExtent([1, 10])
        .extent([[wallets.margin_left, 0], [wallets.width - wallets.margin_right, wallets.height]])
        .translateExtent([[wallets.margin_left, -Infinity], [wallets.width - wallets.margin_right, Infinity]])
        .on("zoom", wallets.handleZoom);


    wallets.load_wallets(null)

    wallets.svg.call(d3.zoom().on('zoom', wallets.handleZoom))

    $(document).on("block_changed", function() {
        
        if (wallets.update_clustering_timer) {
            clearInterval(wallets.update_clustering_timer)
        }

        wallets.dots_g.selectAll("circle")
            .transition()
                .duration(globals.BLOCK_CHANGED_DELAY)
                .attr("r", 0)
                .remove()

        wallets.load_wallets(timeline.current_block)
     });

    $(document).trigger("wallets_loaded")
})