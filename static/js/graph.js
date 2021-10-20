var ticks = 0
var graph_data

NODE_RADIUS = 8
LINK_LEN = 30

// set the dimensions and margins of the graph
const graph_margin = {top: 0, right: 0, bottom: 0, left: 0},
      graph_width  = $("#graph-container").width() - graph_margin.left - graph_margin.right,
      graph_height = $("#graph-container").height() - graph_margin.top - graph_margin.bottom

function node_color(node){
  if (wallets.clusters_map.size > 0){
    return  clusters_color(node)
  } else {
    return default_color(node)
  }  
}

function clusters_color(node) {
  if (node.type == "wa"){

    return wallets.color(node.cluster)
  } else {
    return "black"
  }  
}

function default_color(node) {
  if (node.type == "wa"){
    return  "#ccc"
  } else {
    return "black"
  }  
}

function update_colors(){
  d3.selectAll('.graph-circle').attr("fill", d => {return node_color(d)})
}

$(document).on("clustering_changed",function(){
  graph_svg.selectAll('circle').data().forEach(d=> {  d.cluster = wallets.clusters_map.get(d.id) });
  update_colors() 
})

$(document).on("clustering_reset",function(){
  $(".graph-header").parent().load('/graph_header', null, update_graph_header)
  update_colors() 
})

$(document).on("clustering_started",function(){
  $(".graph-header").parent().load('/graph_header', null, update_graph_header)
})

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
graph_svg.append("defs")
        .append("marker")
        .attr("id", "arrow-out")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 26)
        .attr("refY", 0)
        .attr("markerWidth", 5)
        .attr("markerHeight", 5)
        .attr("orient", "auto") 
        .append("path")
        .attr("fill", "#dc3545")
        .attr("d", 'M0,-5L10,0L0,5');

graph_svg.append("defs")
        .append("marker")
        .attr("id", "arrow-in")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 26)
        .attr("refY", 0)
        .attr("markerWidth", 5)
        .attr("markerHeight", 5)
        .attr("orient", "auto") 
        .append("path")
        .attr("fill", "#69b3a2")
        .attr("d", 'M0,-5L10,0L0,5');
   

        
// drag = simulation => {
//   function dragstarted(event) {
//     if (!event.active) simulation.alphaTarget(0.3).restart();
//     event.subject.fx = event.subject.x;
//     event.subject.fy = event.subject.y;
//   }
  
//   function dragged(event) {
//     event.subject.fx = event.x;
//     event.subject.fy = event.y;
//   }
  
//   function dragended(event) {
//     if (!event.active) simulation.alphaTarget(0);
//     event.subject.fx = null;
//     event.subject.fy = null;
//   }
  
//   return d3.drag()
//       .on("start", dragstarted)
//       .on("drag", dragged)
//       .on("end", dragended);
// }

// For all browser
var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;

var simulation, links, nodes
var loading_graph = false
var g_tooltip = d3.select('body').append('div')
                               .attr('class', 'tooltip graph-tooltip')
                               .style("opacity", 0)

function distance_link(d) {
  // for (i=0; i<10; i++){
  //   r = 40 + i * ( NODE_RADIUS + (i%2)*(NODE_RADIUS / 2 ) ) 
  //   d = 2*r*3.14
  //   n = 
  // }


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

function saveGraphPosition(block_id, nodes) {
  var open = indexedDB.open("NodesPositionsByBlock", 4);

  open.onerror = function() {
    console.log("Error opening NodesPositionsByBlock db");
  };

  open.onsuccess = function() {
    var db = open.result;
    var tx = db.transaction("Nodes", "readwrite");
    var store = tx.objectStore("Nodes");

    // Formatting nodes dictionary for current selected block
    var nodes_dict = nodes.nodes().reduce((nodes_dict, e) => (nodes_dict[e.getAttribute('node_id')] = [parseFloat(e.getAttribute('cx')), parseFloat(e.getAttribute('cy'))], nodes_dict), {});

    store.put({block_id: block_id, nodes: nodes_dict});

    // Close the db when the transaction is done
    tx.oncomplete = function() {
      db.close();
    };  
   };
}

function retrieveGraphPosition(block_id) {
  return new Promise (function(resolve) {
    var open = indexedDB.open("NodesPositionsByBlock", 4);

    //Handlers
    open.onupgradeneeded = function() {
      var db = open.result;
      db.createObjectStore("Nodes", {keyPath: "block_id"});
    };

    open.onerror = function() {
      console.log("Error opening NodesPositionsByBlock db");
      return resolve(null);
    };

    open.onsuccess = function() {
      var db = open.result;
      var tx = db.transaction("Nodes", "readwrite");
      var store = tx.objectStore("Nodes");
      
      var value = store.get(block_id);

      value.onsuccess = function() {
        if (value.result)
          return resolve(value.result.nodes);
        else 
          console.log("No matching block found, returning null");
          return resolve(null);
      };

      // Close the db when the transaction is done
      tx.oncomplete = function() {
        db.close();
      };  
    };
  });
}

// Apply filters to graph
function apply_fitlers_graph() {

  var local_nodes = d3.selectAll(nodes).nodes();
  var local_links = d3.selectAll(links).nodes();

  var txs = local_nodes.filter(n => $(n).attr("node_type") == "tx");
  var wallets = local_nodes.filter(n => $(n).attr("node_type") == "wa");

  var txs_show = txs.filter(t => $(t).attr("tx_tot_value") >= min && $(t).attr("tx_tot_value") <= max && checkboxes.includes($(t).attr("tx_type")));
  var txs_show_ids = txs_show.map(t => $(t).attr("node_id"));
  var txs_hide = txs.filter(t => !txs_show.includes(t));

  var links_show = local_links.filter(l => txs_show_ids.includes($(l).attr("source")) || txs_show_ids.includes($(l).attr("target")));
  var links_hide = local_links.filter(l => !links_show.includes(l));
  var links_show_ids_source = links_show.map(l => $(l).attr("source"));
  var links_show_ids_target = links_show.map(l => $(l).attr("target"));

  var wallets_show = wallets.filter(w => links_show_ids_source.includes($(w).attr("node_id")) || links_show_ids_target.includes($(w).attr("node_id")))
  var wallets_hide = wallets.filter(w => !links_show_ids_source.includes($(w).attr("node_id")) && !links_show_ids_target.includes($(w).attr("node_id")))

  $(txs_show).attr("opacity", 1);
  $(txs_hide).attr("opacity", 0);

  $(links_show).attr("opacity", 1);
  $(links_hide).attr("opacity", 0);
  
  $(wallets_show).attr("opacity", 1);
  $(wallets_hide).attr("opacity", 0);
}

function mouse_over_node(event, d) {
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
  else {
    if (!g_tooltip.html().includes("<hr")) {
      g_tooltip.html(g_tooltip.html() + 
      ` <hr class='my-1 bg-white'/>
        <ul style="padding-left: 2px; margin: 0; list-style-type: none;">
        <li class='mb-1'>N. links   : ${d['n_links']}</li>
        <li class='mb-1'>Tot. value : ${d['tot_value']}</li>
        <li class='mb-1'>Tx type : ${d['tx_type']}</li>
        </ul>`)
    }
  }
}

function mouse_move_node(event, d) {
  tooltip_width = g_tooltip.node().getBoundingClientRect().width
  tooltip_height = g_tooltip.node().getBoundingClientRect().height
  g_tooltip.transition()
            .duration(200)
            .style('opacity', 0.9)
            .style("color", "white")
            .style('left', (event.pageX < ($("#graph-container").offset()['left'] + $("#graph-container").width()/2)) ? (event.pageX + 2)+'px' : (event.pageX - 2 - tooltip_width)+'px')
            .style('top', (event.pageY < ($("#graph-container").offset()['top'] + $("#graph-container").height()/2)) ? (event.pageY + 15)+'px' : (event.pageY - tooltip_height - 2)+'px')
}

function mouse_out_node(event, d) {
  g_tooltip.transition()
            .duration(500)
            .style("opacity", 0)
}

// Only on block changed
function display_graph(data) {

  // Preventing bad behaviors
  $("#filters-apply-button, #filters-reset-button").attr('disabled',true);

  data.nodes = data.nodes.map(d => ({ ...d, cluster: wallets.clusters_map.get(d.id) }))

  links = graph_svg.append("g")
                      
                      .selectAll("line")
                      .data(data.links)
                      .join("line")
                      .attr("stroke", l => { if (l.type=='out') {return '#69b3a2'}else {return '#dc3545'} })
                      .attr("stroke-opacity", l => { if (l.type=='out') {return 0.9} else {return 0.6} })
                      .attr("source", l => l.source)
                      .attr("target", l => l.target)
                      .attr("class", "graph-line")
                      .attr("stroke-width", 1)
                      .attr("marker-end", l => { if (l.type=='out') 
                                                  {return `url(${new URL(`#arrow-in`, location)})`}
                                                 else 
                                                  {return `url(${new URL(`#arrow-out`, location)})`} })


  nodes = graph_svg.append("g")
                      .attr("stroke", "#fff")
                      .attr("stroke-width", 0.7)
                      .selectAll("circle")
                      .data(data.nodes)
                      .join("circle")
                      .attr("node_id", n => n.id)
                      .attr("node_type", n => n.type)
                      .attr("tx_type", n => n.type == "tx" ? n.tx_type : "")
                      .attr("tx_tot_value", n => n.type == "tx" ? n.tot_value: 0)
                      .attr("class", "graph-circle")
                      .attr("r", NODE_RADIUS)
                      .attr("cursor", "pointer")
                      .attr("fill", n => node_color(n))
                      // .call(drag(simulation))
                      .on("mouseover", mouse_over_node)
                      .on("mousemove", mouse_move_node)
                      .on("mouseout", mouse_out_node);
  
  // On block changed we must respect the filters applied
  apply_fitlers_graph()

  // Initial zooming out
  d3.select("#graph-container > svg").call(zoom.transform, d3.zoomIdentity.translate((graph_width-0.1*graph_width)/2, (graph_height-0.1*graph_height)/2).scale(0.1));

  retrieveGraphPosition(data.block_id).then(function(nodes_dict) {

    if (nodes_dict == null) {
      simulation = d3.forceSimulation(data.nodes)
                      .force("link", d3.forceLink(data.links).id(d => d.id).distance(d => distance_link(d)))
                      .force("charge", d3.forceManyBody().strength(-50))
                      .force("center", d3.forceCenter(graph_width / 2, graph_height / 2))
                      .alphaMin(0.2)
                      .on('end', function() { saveGraphPosition(data.block_id, nodes); $("#filters-apply-button, #filters-reset-button").attr('disabled', false); });

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

    else {
      nodes.attr("cx", graph_width / 2).attr("cy", graph_height / 2)
          .transition().duration(2000)
          .attr("cx", function(d) { return nodes_dict[d['id']][0] }).attr("cy", function(d) { return nodes_dict[d['id']][1] });
      links
          .attr("x1", graph_width / 2)
          .attr("y1", graph_height / 2)
          .attr("x2", graph_width / 2)
          .attr("y2", graph_height / 2)
          .transition().duration(2000)
          .attr("x1", d => nodes_dict[d['source']][0])
          .attr("y1", d => nodes_dict[d['source']][1])
          .attr("x2", d => nodes_dict[d['target']][0])
          .attr("y2", d => nodes_dict[d['target']][1]);
      $("#filters-apply-button, #filters-reset-button").attr('disabled', false);
    }
  });

  loading_graph = false;
} 

// d3.json(`/graph`).then(function(data) {
//   display_graph(data);
// });

// Manage filters change custom event
function remove_graph() {
  simulation?.stop();
  graph_svg.selectAll("g").remove();
}

function reload() {
  loading_graph = true;
  d3.json(`/graph?&block=${timeline.current_block}`).then(function(data) {
    remove_graph();
    setTimeout(function(){ display_graph(data) }, globals.BLOCK_CHANGED_DELAY);
  });
}

$(document).on("filters_changed", function() {
  apply_fitlers_graph();
});

$(document).on("block_changed", function() {
  reload();
});

