var ticks = 0;
var graph_data;
// set the dimensions and margins of the graph
const margin = {top: 10, right: 30, bottom: 30, left: 40},
  width = window.innerWidth - margin.left - margin.right,
  height = window.innerHeight  - margin.top - margin.bottom;

function node_color(node){
  if (node.type == "wallet"){
    return  "#69b3a2"
  } else {
    return "#de6262"
  }  
}
function node_opacity(node){
  if (node.type == "wallet"){
    return  "#69b3a2"
  } else {
    return "#de6262"
  }  
}

// append the svg object to the body of the page
const svg = d3.select("#my_dataviz")
.append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
.append("g")
  .attr("transform",
        `translate(${margin.left}, ${margin.top})`);

// Add zoom stuff
function handleZoom(e) {
  d3.select('svg g')
    .attr('transform', e.transform);
}

let zoom = d3.zoom()
  .on('zoom', handleZoom);

d3.select('svg')
  .call(zoom);

d3.json("/graph").then( function( data) {
  graph_data = data



  // Initialize the links
  const link = svg
    .selectAll("line")
    .data(data.links)
    .join("line")
      .style("stroke", "#aaa") 
      .attr('marker-end','url(#arrowhead)')

  // Initialize the nodes
  const node = svg
    .selectAll("circle")
    .data(data.nodes)
    .join("circle")
      .style("fill", node_color)
      // .style("opacity", .5) 
      .attr("x", Math.random * svg.width )
      .attr("y", Math.random * svg.height )
      .attr("r", function(d) { return ((Math.log(d.w+1)+1) * 5 ) || 6; })

      



  // Let's list the force we wanna apply on the network
  const simulation =  d3.forceSimulation(data.nodes)
                        .alphaDecay(0.05)
                        // .alphaTarget(0.4) // stay hot
                        .force("link", d3.forceLink()                               // This force provides links between nodes
                              .id(function(d) { return d.id; })                     // This provide  the id of a node
                              .links(data.links)                                    // and this the list of links
                              )
                        .force("charge", d3.forceManyBody()
                                           .strength(function(d){return d.w* -1 })
                                           .distanceMax(1024)
                                           )
                                          
                                                    // This adds repulsion between nodes. Play with the -400 for the repulsion strength
                        // .force("collide", d3.forceCollide().radius(d => d.r + 1), )
                        .force("center", d3.forceCenter(width/2  , height/2 ))     // This force attracts nodes to the center of the svg area
                        .on("tick", ticked);


  // This function is run at each iteration of the force algorithm, updating the nodes position.
  function ticked() {
    ticks +=1

    link
        .attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    node
         .attr("cx", function (d) { return d.x+1; })
         .attr("cy", function(d) { return d.y-1; });
  }

});