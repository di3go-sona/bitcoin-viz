var ticks = 0
var graph_data

// set the dimensions and margins of the graph
const graph_margin = {top: 0, right: 0, bottom: 0, left: 0},
      graph_width  = $("#graph-container").width() - graph_margin.left - graph_margin.right,
      graph_height = $("#graph-container").height() - graph_margin.top - graph_margin.bottom

function node_color(node){
  if (node.type == "wa_in"){
    return  "#69b3a2"
  } else {
    return "#de6262"
  }  
}
// function node_opacity(node){
//   if (node.type == "wallet"){
//     return  "#69b3a2"
//   } else {
//     return "#de6262"
//   }  
// }

// append the svg object to the body of the page
const graph_svg = d3.select("#graph-container")
                    .append("svg")
                      .attr("width", graph_width)
                      .attr("height", graph_height)
                    .append("g")

// Add zoom stuff
// function handleZoom(e) {
//   d3.select('svg g')
//     .attr('transform', e.transform);
// }

// let zoom = d3.zoom()
//   .on('zoom', handleZoom);

// d3.select('svg')
//   .call(zoom);
drag = simulation => {
  
  function dragstarted(event) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    event.subject.fx = event.subject.x;
    event.subject.fy = event.subject.y;
  }
  
  function dragged(event) {
    event.subject.fx = event.x;
    event.subject.fy = event.y;
  }
  
  function dragended(event) {
    if (!event.active) simulation.alphaTarget(0);
    event.subject.fx = null;
    event.subject.fy = null;
  }
  
  return d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);
}


d3.json("/graph").then( function(data) {
  graph_data = data
  console.log(data)

  const simulation = d3.forceSimulation(data.nodes)
                      .force("link", d3.forceLink(data.links).id(d => d.id))
                      .force("charge", d3.forceManyBody().strength(-2))
                      .force("center", d3.forceCenter(graph_width / 2, graph_height / 2));

  const link = graph_svg.append("g")
                          .attr("stroke", "#999")
                          .attr("stroke-opacity", 0.6)
                        .selectAll("line")
                        .data(data.links)
                        .join("line")
                          .attr("stroke-width", 2);

  const node = graph_svg.append("g")
                          .attr("stroke", "#fff")
                          .attr("stroke-width", 1.5)
                        .selectAll("circle")
                        .data(data.nodes)
                        .join("circle")
                          .attr("r", 5)
                          .attr("fill", n => node_color(n))
                          .call(drag(simulation));
  
  simulation.on("tick", () => {
    link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);
    node
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);
  });
                  
});