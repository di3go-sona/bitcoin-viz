var ticks = 0
var graph_data

// set the dimensions and margins of the graph
const graph_margin = {top: 0, right: 0, bottom: 0, left: 0},
      graph_width  = $("#graph-container").width() - graph_margin.left - graph_margin.right,
      graph_height = $("#graph-container").height() - graph_margin.top - graph_margin.bottom

function node_color(node){
  if (node.type == "wa"){
    return  "#69b3a2"
  } else {
    return "#de6262"
  }  
}

const graph_svg = d3.select("#graph-container")
                    .append("svg")
                      .attr("width", graph_width)
                      .attr("height", graph_height)
                    .append("g")

// Add zoom stuff
function handleZoom(e) {
  graph_svg.attr('transform', e.transform);
}
let zoom = d3.zoom().on('zoom', handleZoom);
d3.select("#graph-container > svg").call(zoom);

// Per-type markers, as they don't inherit styles.
graph_svg.append("defs").selectAll("marker")
        .data(["line-end-arrow"])
        .join("marker")
        .attr("id", d => `arrow-${d}`)
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 19)
        .attr("refY", 0)
        .attr("markerWidth", 3)
        .attr("markerHeight", 3)
        .attr("orient", "auto") 
        .append("path")
        .attr("fill", "#999")
        .attr("d", 'M0,-5L10,0L0,5');

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

var simulation

function display_graph(data) {
   simulation = d3.forceSimulation(data.nodes)
                        .force("link", d3.forceLink(data.links).id(d => d.id))
                        .force("charge", d3.forceManyBody().strength(-10).distanceMax(1000))
                        .force("center", d3.forceCenter(graph_width / 2, graph_height / 2))
                        .alphaMin(0.1);

  const links = graph_svg.append("g")
                          .attr("stroke", "#999")
                          .attr("stroke-opacity", 0.6)
                        .selectAll("line")
                        .data(data.links)
                        .join("line")
                          .attr("class", "graph-line")
                          .attr("stroke-width", 2)
                          .attr("marker-end", d => `url(${new URL(`#arrow-line-end-arrow`, location)})`);

    const nodes = graph_svg.append("g")
                          .attr("stroke", "#fff")
                          .attr("stroke-width", 1.5)
                        .selectAll("circle")
                        .data(data.nodes)
                        .join("circle")
                          .attr("class", "graph-circle")
                          .attr("r", 5)
                          .attr("fill", n => node_color(n))
                          .call(drag(simulation));

  simulation.on("tick", () => {
    links
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y);
    nodes
      .attr("cx", d => d.x)
      .attr("cy", d => d.y);
  });
} 

d3.json(`/graph?types=${checkboxes.toArray().join(',')}`).then(function(data) {
  display_graph(data)
});

// Manage filters change custom event
function reload() {
  simulation.stop()
  d3.selectAll("circle.graph-circle").transition().duration(500).attr("r", 0).remove()
  d3.selectAll("line.graph-line").transition().duration(500).attr("opacitiy", 0).remove()

  d3.json(`/graph?&block=${d3.select(".bar.selected").data()[0].hash}&min=${min}&max=${max}&types=${checkboxes.toArray().join(',')}`).then(function(data) {
    display_graph(data)
  });
}

$(document).on("load_new_graph", function(event) {
  reload()
});

$(document).on("block_changed", function(event) {
  reload()
});

