// create a global wallets variable where to store things
const percentile = (arr, val) =>
  (100 *
    arr.reduce(
      (acc, v) => acc + (v < val ? 1 : 0) + (v === val ? 0.5 : 0),
      0
    )) /
  arr.length;
  
var wallets = {
    LINES_TICKS :5,
    LINES_WIDTH: 2,
    LINES_OPACITY: 0.2,
    CIRCLES_OPACITY: 1,
    CIRCLES_RADIUS: 3,
    LINES_WIDTH: 2,

    xmin: null,
    xmax: null,
    ymin: null,
    ymax: null,


    clusters_map: new Map(),
    transform : null, 
    circles_svg : null,
    data:null, 
    lines_y : {},

    update_clustering_timer: null,
    update_visible_timer : null,
    rescale_lines_timer : null, 

    CIRCLES_SCALE : 1,

    dimensions : [ "received_value",'deg_in',"unique_deg_in", "avg_vin",    "balance",  "avg_vout",  "unique_deg_out",  "deg_out", "total_txs"],
    dimensions_names : new Map([ ["received_value", "BTC_IN" ],["deg_in", "TXS_IN"], ["unique_deg_in", "uTXS_IN" ], ["avg_vin", "AVG_VIN" ],    ["balance", "BALANCE" ], ["avg_vout", "AVG_OUT" ],  ["unique_deg_out", "uTXS_OUT" ],  ["deg_out", "TXS_OUT" ], ["total_txs", "TOT_TXS" ]]),
    deselected_clusters : [],

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


            wallets.circles.data().forEach(function(d,i) {d.cluster = data[i].cluster})
            wallets.circles.style("fill",function (d) { return wallets.color( d.cluster); }) 
            

            wallets.lines.data().forEach(function(d,i) {d.cluster = data[i].cluster})
            wallets.lines.style("stroke",function (d) { return wallets.color(d.cluster ); }) 

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

        n_clusters = parseInt(clusters.slider.get())
        clusters.prev_n_clusters = n_clusters
        xhttp = new XMLHttpRequest()
        xhttp.open("GET", `/wallets/clusters/start?n_clusters=${n_clusters}`, true);
        xhttp.send();

        // Update colors
        wallets.circles_svg.selectAll(".wallet-circle")
                .style("fill",function (d) { return wallets.color(null); }) 
        wallets.lines_svg.selectAll(".wallet-line")
                .style("stroke",function (d) { return wallets.color(null); }) 
        
        // Start polling for updates
        wallets.update_clustering_timer = setInterval(wallets.update_clustering, 300)
        setTimeout(d => {$(document).trigger("clustering_started")}, 300)
    },

    reset_clustering: function(){
        console.log("Reset clustering")

        clusters.prev_n_clusters = 2;
        reset_clusters();

        xhttp = new XMLHttpRequest();
        xhttp.open("GET", `/wallets/clusters/reset`, false);
        xhttp.send();

        // Stop polling for updates
        wallets.stop_clustering();

        // Update colors
        wallets.circles
                .style("fill",function (d) { return wallets.color(null); }) 
        wallets.lines
                .style("stroke",function (d) { return wallets.color(null); }) 
        // Remove saved colors
        wallets.clusters_map = new Map()

        // Remove selected clusters
        wallets.deselected_clusters = []

        $(document).trigger("clustering_reset")
    },

    handleZoom: function(e) {
        // var new_XScale = e.transform.rescaleX(wallets.circles_x)
        // var new_yScale = e.transform.rescaleY(wallets.circles_y)

        // update axes with these new boundaries
        // wallets.circles_x_axis.call(d3.axisTop(new_XScale))
        // wallets.circles_y_axis.call(d3.axisRight(new_yScale))

        wallets.circles_container.attr("transform", e.transform)

        // wallets.circles.selectAll('circle')
        //     .attr("r", 3 / ( e.transform.k || 1) )
    },

    //Read the data
    load_wallets: function(block){

        if (!block){
            var endpoint = d3.json("/wallets")
        } else {
            var endpoint = d3.json(`/wallets?block=${block}`)
        }

        endpoint.then( function(data_wrapper) {
            console.log('loaded_wallets')
            data = d3.csvParse(data_wrapper.csv, d3.autoType)
            wallets.data = data

            if (data_wrapper.n_clusters){
                wallets.clusters_map = new Map(data.map( d => {return [d.addr, d.cluster]}));
            }

            // Add circles X axis
            wallets.circles_x = d3.scaleLinear()
                .domain([data_wrapper.min_x * 1.1, data_wrapper.max_x * 1.1])
                .range([0, wallets.width * wallets.CIRCLES_SCALE]);
            
            // Add circles Y axis
            wallets.circles_y = d3.scaleLinear()
                .domain([data_wrapper.min_y * 1.1, data_wrapper.max_y * 1.1])
                .range([wallets.height /2 * wallets.CIRCLES_SCALE, 0]);

            // wallets.circles_container.attr("transform", "scale(0.5)")


            wallets.circles = wallets.circles_container
                .selectAll("Dummy")
                .data(data)
                .join("circle")
                    .attr("cx", function (d) { return wallets.circles_x(d.x); } )
                    .attr("cy", function (d) { return wallets.circles_y(d.y); } )
                    .attr("r", wallets.CIRCLES_RADIUS / ( wallets.transform_k || 1) )
                    .attr("cluster", function (d) { d.cluster })
                    .attr("class", "wallet-circle")
                    .style("fill",function (d) { return wallets.color(d.cluster ) })
                    .attr("opacity", 0)

                             
            

            for (i in wallets.dimensions) {
                p = wallets.dimensions[i]
                wallets.lines_y[p] = d3.scaleSymlog().clamp(true)
                    .domain( [Math.min(...data.map( d => d[p])) , Math.max(...data.map( d => d[p])) ] ) 
                    .range([0,wallets.height/2 - wallets.lines_margin.top - wallets.lines_margin.bot ])
            }
            
            // Build the X scale -> it find the best position for each Y axis


            wallets.lines = wallets.lines_container.append("g")
                .selectAll(".wallet-circle")
                .data(data)
                .enter()
                .append("path")
                    .attr("class", "wallet-line" ) // 2 class for each line: 'line' and the group name
                    .attr("d",  wallets.path)
                    .style("fill","none")
                    .style("stroke", function(d){ return( wallets.color(d.cluster ))} )
                    .attr("stroke-width", 2 )
                    .attr("opacity", 0)
            
            // wallets.lines_svg.selectAll("g.axis").call(yAxis)
            // Draw the axis:
            wallets.lines_container.selectAll("myAxis")
            // For each dimension of the dataset I add a 'g' element:
                .data(wallets.dimensions).enter()
                .append("g")
                    .attr("class", "axis")
                    // I translate this element to its right position on the x axis
                    .attr("transform", function(d) { return "translate(" + wallets.lines_x(d) + ") scale(0.92)"; })
                    .append("text")
                        .style("text-anchor", "middle")
                        .attr("y", -5)
                        .text(function(d) { return wallets.dimensions_names.get(d); })
                        .style("fill", "white")
                        

            if (wallets.update_clustering_timer){
                wallets.update_clustering_timer = setInterval(wallets.update_clustering, 500)
            }
            if (! wallets.update_visible_timer){
                wallets.update_visible_timer = setInterval(wallets.update_visible, 300)
            }
            
            $(document).trigger("wallets_loaded")
            
        })
    },


    toggle_cluster : function(cluster_id){
        console.log( `Toggle cluster ${cluster_id}`)
        if (this.deselected_clusters.includes(cluster_id)) {
            this.deselected_clusters = this.deselected_clusters.filter(d => {return d != cluster_id})
        } else {
            this.deselected_clusters.push(cluster_id.toString(), parseInt(cluster_id))
        }

        wallets.circles.selectAll('circle')
            .filter( d => {return d.cluster == cluster_id })
            .style('fill', d => { return wallets.color(d.cluster) } )

        $(document).trigger("clustering_changed")
    },

    _color :  d3.scaleOrdinal()
        .domain([0, 1, 2, 3, 4, 5, 6, 7,  null, undefined])
        // .range(["#ff1f1f", "#78ff1f", "#1f5aff", "#ff961f", "#1fffb4", "#d21fff", "#f0ff1f", "#1fd2ff", "#ff1fb4"]),
        .range([ "#dc3545",  "#4576ff", "#ffa845", "#45ffc1", "#7645ff", "#f3ff45", "#45daff", "#ff45c1", "#ccc","#ccc"]),

    color: function(cluster_id){
        c =  wallets._color(cluster_id)

        if (wallets.deselected_clusters.includes(cluster_id) ){
           return d3.color(c).darker(6) 
        } else {
            return c 
        }
    },

    update_visible: function(event){
        t = graph.svg.attr('transform')
        re = /translate\(([0-9.-]*),([0-9.-]*)\) scale\(([0-9.-]*)\)/

        match = re.exec(t)
        if (!match) return 
        
        translate_x = parseFloat(match[1])
        translate_y = parseFloat(match[2])
        scale = parseFloat(match[3])

        xmin = (0 - translate_x ) / scale
        xmax = (graph.width - translate_x ) / scale
        ymin = (0 - translate_y ) / scale
        ymax = (graph_height - translate_y ) / scale
        
        

        if ( xmin != wallets.xmin || xmax != wallets.xmax || ymin != wallets.ymin || ymax != wallets.ymax ){
            

            _iscontained = d3.selectAll('.graph-circle').nodes().map(n => { return [n.__data__.id,   
                n.cx.baseVal.value >= xmin &&  
                n.cx.baseVal.value <= xmax && 
                n.cy.baseVal.value >= ymin &&  
                n.cy.baseVal.value <= ymax &&
                n.attributes.opacity.value != "0" &&
                ! wallets.deselected_clusters.includes(wallets.clusters_map.get(n.__data__.id))
            ]})

            iscontained = new Map(_iscontained)

            

            for (i in wallets.dimensions) {
                p = wallets.dimensions[i]
                

                wallets.lines_y[p] = wallets.lines_y[p]
                    .domain( [Math.min(...wallets.data.filter(d => iscontained.get(d.addr)).map( d => d[p])), 
                            Math.max(...wallets.data.filter(d => iscontained.get(d.addr)).map( d => d[p]))] ) 

                
            }
            
            wallets.circles
                .attr('opacity', d => {return iscontained.get(d.address) == true ? wallets.CIRCLES_OPACITY: 0})
            
            wallets.lines
                .attr('opacity', d => {return iscontained.get(d.address) == true ? wallets.LINES_OPACITY: 0})


            clearTimeout(wallets.rescale_lines_timer)
            wallets.rescale_lines_timer = setTimeout(function(){
                console.log("Updating wallets lines")
                wallets.lines.transition().duration(500)
                    .attr("d",  wallets.path)
    
                wallets.lines_svg.selectAll("g.axis")
                    .each(function(d) {  d3.select(this).transition().duration(500).call(d3.axisRight().ticks(wallets.LINES_TICKS).scale( wallets.lines_y[d]))})
    
    
    
            }, 1000)



        } 

        wallets.xmin = xmin;
        wallets.xmax = xmax;
        wallets.ymin = ymin;
        wallets.ymax = ymax;


    },
    path : function (d) {
        return d3.line()(wallets.dimensions.map(function(p) { return [wallets.lines_x(p), wallets.lines_y[p](d[p])]; }));
    }
}





$(document).ready( function() {
    wallets.width  = $('#wallets-container').width() 
    wallets.height = $('#wallets-container').height() - 5

    wallets.clustering_start_button = $('#clusters-start-button')
    wallets.clustering_reset_button = $('#clusters-reset-button')

    wallets.clustering_start_button.click(wallets.start_clustering)
    wallets.clustering_reset_button.click(wallets.reset_clustering)


    wallets.lines_margin = {left:30, top:20, right:50, bot:10}
    update_graph_card_header()

    // append the svg object to the body of the page
    wallets.circles_svg = d3.select("#wallets-container")
        .append("svg")
            .attr("width", wallets.width )
            .attr("height", wallets.height /2)
    
    d3.select("#wallets-container")
        .append("hr")
        .attr("class", "m-0")

    wallets.lines_svg = d3.select("#wallets-container")
        .append("svg")
            .attr("width", wallets.width)
            .attr("height", wallets.height /2)


    wallets.lines_container = wallets.lines_svg
            .append("g")
            .attr("transform",
                `translate(${wallets.lines_margin.left},${wallets.lines_margin.top})`);

    wallets.circles_container = wallets.circles_svg
            // .append("g")
            // .attr("clip-path", "url(#clip-clusters)")
            .append("g")

    wallets.lines_x = d3.scalePoint()
        .range([0, wallets.width - wallets.lines_margin.left - wallets.lines_margin.right ])
        .domain(wallets.dimensions);
    
    

    // wallets.circles_svg.append("clipPath")
    //     .attr("id", "clip-clusters")
    //     .append("rect")
    //         .attr("x", wallets.margin_left + 25)
    //         .attr("y", wallets.margin_top)
    //         .attr("width", wallets.width - wallets.margin_left - wallets.margin_right - 15)
    //         .attr("height", wallets.height /2 - wallets.margin_top - wallets.margin_bottom - 15)





    wallets.zoom = d3.zoom()
        .on("zoom", wallets.handleZoom)
        
        



    wallets.circles_svg.call(d3.zoom().on('zoom', wallets.handleZoom))

    $(document).on("block_changed", function() {
        
        if (wallets.update_clustering_timer) {
            clearInterval(wallets.update_clustering_timer)
        }
        if (wallets.circles) {
            wallets.circles
                .transition()
                .duration(globals.BLOCK_CHANGED_DELAY)
                .attr("opacity", 0)
                .remove()
        }
        if (wallets.lines) {
            wallets.lines
                .transition()
                .duration(globals.BLOCK_CHANGED_DELAY)
                .attr("opacity", 0)
                .remove()
        }


        wallets.load_wallets(timeline.current_block)
    });
    

    $(document).trigger("wallets_loaded")
    $(document).on("graph-loaded", function(){
        wallets.update_visible()
    })
})
