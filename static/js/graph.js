var ticks = 0
var graph_data

// set the dimensions and margins of the graph
const graph_margin = {top: 0, right: 0, bottom: 0, left: 0},
      graph_width  = $("#graph-container").width() - graph_margin.left - graph_margin.right,
      graph_height = $("#graph-container").height() - graph_margin.top - graph_margin.bottom

function node_color(node){
  // console.log(node)
  // console.log(wallets.clusters_map)
  if (wallets.clusters_map){
    return  clusters_color(node)
  } else {
    return default_color(node)
  }  
}

function clusters_color(node) {
  if (node.type == "wa"){
    return wallets.color(wallets.clusters_map.get(node.id))
  } else {
    return "white"
  }  
}

function default_color(node) {
  if (node.type == "wa"){
    return  "#69b3a2"
  } else {
    return "#de6262"
  }  
}

function update_colors(){
  d3.selectAll('.graph-circle').attr("fill", d => {return node_color(d)})
  console.log(wallets.clusters_map)
  console.log(wallets.color)
}






$(document).on("clusters_changed",function(){
  update_colors()
  $(".graph-header").load('/graph_header')
  update_graph_header_colors()
} )

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
        .attr("refX", 28)
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
var loading_graph = true
// g_tooltip
var g_tooltip = d3.select('body').append('div')
                               .attr('class', 'tooltip graph-tooltip')
                               .style("opacity", 0)

function distance_link(d) {

  var n_links = 0
  if (d["source"]["type"] == "tx") {
    n_links = d["source"]["n_links"]
  }
  else {
    n_links = d["target"]["n_links"]
  }

  if (n_links > 10){
    n = parseInt(n_links / 10)
    steps = [...Array(n).keys()]
    taken = steps[Math.floor(Math.random() * steps.length)]
    return 40 + (taken * 5)
  } 
  else{
    return 40
  }                    
}

function display_graph(data) {
  
  simulation = d3.forceSimulation(data.nodes)
                        .force("link", d3.forceLink(data.links).id(d => d.id).distance(d => distance_link(d)))
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
                          .attr("stroke-width", 1)
                          .attr("marker-end", d => `url(${new URL(`#arrow-line-end-arrow`, location)})`);

  const nodes = graph_svg.append("g")
                        .attr("stroke", "#fff")
                        .attr("stroke-width", 0.5)
                      .selectAll("circle")
                      .data(data.nodes)
                      .join("circle")
                        .attr("class", "graph-circle")
                        .attr("r", 5)
                        .attr("cursor", "pointer")
                        .attr("fill", n => node_color(n))
                        .call(drag(simulation))
                        .on("mouseover", function(event, d) {
                          g_tooltip.html(`${d['type'] === 'wa'? 'Address' : 'Tx id'}: ${d['id']}`)
                          if (d['type'] === 'wa') {
                            d3.json(`/wallet?wallet_id=${d['id']}`).then(function(data) {
                              if (!g_tooltip.html().includes("<hr")) {
                                g_tooltip.html(g_tooltip.html() + 
                                ` <hr class='my-1 bg-white'/>
                                  <ul style="padding-left: 2px; margin: 0; list-style-type: none;">
                                  <li class='mb-1'>Avg vin/vout : ${data['avg_vin'].toFixed(6)}/${data['avg_vout'].toFixed(6)}</li>
                                  <li class='mb-1'>Var vin/vout : ${data['var_vin'].toFixed(6)}/${data['var_vout'].toFixed(6)}</li>
                                  <li class='mb-1'>Deg in/out   : ${data['deg_in']}/${data['deg_out']}</li>
                                  <li class='mb-1'>Unique deg in/out : ${data['unique_deg_in']}/${data['unique_deg_out']}</li>
                                  <li class='mb-1'>Total txs : ${data['total_txs']}</li>
                                  <li class='mb-1'>Received value : ${data['received_value']}</li>
                                  <li class='mb-1'>Balance : ${data['balance']}</li>
                                  </ul>`)
                              }
                            })
                          }
                       })
                       .on("mousemove", function(event, d) {
                          tooltip_width = g_tooltip.node().getBoundingClientRect().width
                          tooltip_height = g_tooltip.node().getBoundingClientRect().height
                          g_tooltip.transition()
                          .duration(200)
                          .style('opacity', 0.9)
                          .style("color", "white")
                          .style('left', (event.pageX < ($("#graph-container").offset()['left'] + $("#graph-container").width()/2)) ? (event.pageX + 2)+'px' : (event.pageX - 2 - tooltip_width)+'px')
                          .style('top', (event.pageY < ($("#graph-container").offset()['top'] + $("#graph-container").height()/2)) ? (event.pageY + 15)+'px' : (event.pageY - tooltip_height - 2)+'px')
                       })
                       .on("mouseout", function(event, d) {
                          g_tooltip.transition()
                             .duration(500)
                             .style("opacity", 0)
                       });
  
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

  loading_graph = false
} 

d3.json(`/graph?types=${checkboxes.toArray().join(',')}`).then(function(data) {
  display_graph(data)
});

// Manage filters change custom event
function remove_graph() {
  simulation.stop()
  d3.selectAll("circle.graph-circle").transition().duration(globals.BLOCK_CHANGED_DELAY).attr("r", 0).remove()
  d3.selectAll("line.graph-line").transition().duration(globals.BLOCK_CHANGED_DELAY).attr("opacitiy", 0).remove()
}

function reload() {
  loading_graph = true
  d3.json(`/graph?&block=${d3.select(".bar.selected").data()[0].hash}&min=${min}&max=${max}&types=${checkboxes.toArray().join(',')}`).then(function(data) {
    remove_graph()
    // display_graph(data)
    setTimeout(function(){ display_graph(data) }, 1000);
  });
}

$(document).on("filters_changed", function(event) {
  reload()
});

$(document).on("block_changed", function(event) {
  reload()
});

