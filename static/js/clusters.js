// create a global wallets variable where to store things
var wallets = {
    margin_top : 5,
    margin_right :15, 
    margin_bottom : 30,
    margin_left : 45,

    clusters : null

}


$(document).ready(function(){

    wallets.width  = $('#clusters-container').width() - wallets.margin_left - wallets.margin_right;
    wallets.height = $('#clusters-container').height() - wallets.margin_top - wallets.margin_bottom;
    
    wallets.color = d3.scaleOrdinal().domain([null, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
        .range(d3.schemeSet3);





    function update_clustering(){
            d3.csv("/wallets/clusters/csv").then( function(data) {
                if (arraysEqual(last_clusters, data) ) return
                console.log(data)
                last_clusters = data
                svg.selectAll("circle")
                    .data(data)
                    .style("fill",function (d) { return get_color(d.cluster ) } ) 

                setTimeout(update_clustering, 800)
        })

    }

    function start_clustering(){
        console.log("Start clustering")
        xhttp = new XMLHttpRequest()
        xhttp.open("GET", "/wallets/clusters/start", true);
        xhttp.send();
        last_clusters = null
        update_clustering()
        
        
    }



    $('#start-clustering-button').click(start_clustering)

    // append the svg object to the body of the page
    wallets.svg = d3.select("#clusters-card")
        .append("svg")
        .attr("width", wallets.width + wallets.margin_left + wallets.margin_right)
        .attr("height", wallets.height + wallets.margin_top + wallets.margin_bottom)
        .append("g")
        .attr("transform", `translate(${wallets.margin_left}, ${wallets.margin_top})`);

    // function handleZoom(e) {
    //     g.attr('transform', e.transform);
    // }

    // let zoom = d3.zoom()
    //   .on('zoom', handleZoom);

    // d3.select('svg')
    //   .call(zoom);

    //Read the data
    d3.json("/wallets").then( function(data_wrapper) {

        data = d3.csvParse(data_wrapper.csv)

        // Add X axis
        wallets.x = d3.scaleLinear()
            .domain([data_wrapper.min_pca_1,data_wrapper.max_pca_1])
            .range([ 0, wallets.width ]);

        wallets.svg.append("g")
            .attr("transform", `translate(0, ${wallets.height})`)
            .call(d3.axisBottom(wallets.x));

        // Add Y axis
        wallets.y = d3.scaleLinear()
            .domain([data_wrapper.min_pca_2,data_wrapper.max_pca_2])
            .range([ wallets.height, 0]);

        wallets.svg.append("g")
            .call(d3.axisLeft(wallets.y));

        // Add dots
        wallets.svg.append('g')
            .selectAll("dot")
            .data(data)
            .join("circle")
                .attr("cx", function (d) { return wallets.x(d.pca_1); } )
                .attr("cy", function (d) { return wallets.y(d.pca_2); } )
                .attr("r", 1.5)
                .style("fill",function (d) { return wallets.color(d.cluster || null); })

    })



})