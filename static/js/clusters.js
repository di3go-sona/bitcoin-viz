// set the dimensions and clusters_margins of the graph
const clusters_margin = {top: 5, right: 15, bottom: 120, left: 60};
const width  = $('#clusters-card').width() - clusters_margin.left - clusters_margin.right;
const height = $('#clusters-card').height() - clusters_margin.top - clusters_margin.bottom;
    
// append the svg object to the body of the page
const svg = d3.select("#clusters-card")
    .append("svg")
    .attr("width", width + clusters_margin.left + clusters_margin.right)
    .attr("height", height + clusters_margin.top + clusters_margin.bottom)
    .append("g")
    .attr("transform", `translate(${clusters_margin.left}, ${clusters_margin.top})`);

//Read the data
d3.csv("/clusters/csv").then( function(data) {

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
        .style("fill", "#69b3a2")

})