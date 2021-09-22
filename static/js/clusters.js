// set the dimensions and clusters_margins of the graph
const clusters_margin = {top: 5, right: 15, bottom: 120, left: 60};
const width  = $('#clusters-card').width() - clusters_margin.left - clusters_margin.right;
const height = $('#clusters-card').height() - clusters_margin.top - clusters_margin.bottom;
var last_clusters = null;

function get_color(cluster){

    switch (cluster) {
        case "-1":
            return "white"
        case "0":
            return "#69b3a2"
        case "1":
            return "orange"
        case "2":
            return "green"
        
        default:
            return "red"
    }

}


function arraysEqual(a, b) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length !== b.length) return false;
  
    // If you don't care about the order of the elements inside
    // the array, you should sort both arrays here.
    // Please note that calling sort on an array will modify that array.
    // you might want to clone your array first.
  
    for (var i = 0; i < a.length; ++i) {
      if (a[i].cluster !== b[i].cluster) return false;
    }
    return true;
  }



function update_clustering(){

    // console.log(i)

 
        // console.log("Giada e' patata ogni secondo")
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
const svg = d3.select("#clusters-card")
    .append("svg")
    .attr("width", width + clusters_margin.left + clusters_margin.right)
    .attr("height", height + clusters_margin.top + clusters_margin.bottom)
    .append("g")
    .attr("transform", `translate(${clusters_margin.left}, ${clusters_margin.top})`);

//Read the data
d3.csv("/wallets/csv").then( function(data) {

    // Add X axis
    const x = d3.scaleLinear()
    .domain([min_pca_1,max_pca_1])
    .range([ 0, width ]);
    svg.append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(x));

    // Add Y axis
    const y = d3.scaleLinear()
    .domain([min_pca_2,max_pca_2])
    .range([ height, 0]);
    svg.append("g")
    .call(d3.axisLeft(y));

    // Add dots
    svg.append('g')
    .selectAll("dot")
    .data(data)
    .join("circle")
        .attr("cx", function (d) { return x(d.pca_1); } )
        .attr("cy", function (d) { return y(d.pca_2); } )
        .attr("r", 1.5)
        .style("fill",function (d) { return get_color(d.cluster); })

})