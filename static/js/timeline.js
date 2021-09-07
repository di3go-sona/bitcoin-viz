function format_date(date, isFull) {
   year = date.getFullYear()
   month = date.getMonth().toString().padStart(2, "0")
   day = date.getDay().toString().padStart(2, "0")
   hours = date.getHours().toString().padStart(2, "0")
   minutes = date.getMinutes().toString().padStart(2, "0")
   seconds = date.getSeconds().toString().padStart(2, "0")

   if (isFull) {
      return day+'/'+month+'/'+year+' '+hours+':'+minutes+':'+seconds
   }
   else {
      return hours+':'+minutes+':'+seconds
   }
}

// set the dimensions and margins of the graph
const margin = {top: 40, right: 50, bottom: 40, left: 50},
      width = window.innerWidth*3 - margin.left - margin.right,
      height = window.innerWidth/7 - margin.top - margin.bottom;

// append the svg object to the body of the page
const svg = d3.select("#timeline")
   .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)

const svg_margined = svg.append("g") 
                        .attr("transform", `translate(${margin.left},${margin.top})`)

var dataset

// // Parse the Data
d3.csv("/timeline/csv").then( function(data) {

   // Debugging purpose
   dataset = data

   //Setting labels color
   last_hour = null
   labels_color = []
   for (let time of data.map(b => new Date(b.time))) {
      if (last_hour == null || time.getHours() != last_hour) {
         labels_color.push("black")
         last_hour = time.getHours()
      }
      else {
         labels_color.push("#ccc")
      }
   }

   // X axis scale
   const xScale = d3.scaleBand()
                .range([0, width])
                .domain(data.map(b => new Date(b.time)))
                .padding(0.4);

   const labels_ordinal = d3.scaleOrdinal()
                           .domain(data.map(b => b.time))
                           .range(labels_color)
   
   // Y axis scale
   const yScale = d3.scaleLinear()
               .domain([0, d3.max(data.map(b => parseInt(b.n_tx)))])
               .range([height, 0]);

   // X Axis
   const x_axis = svg_margined.append("g")
                     .attr("transform", `translate(0, ${height})`)
                     .call(d3.axisBottom(xScale))

   const y_axis = svg_margined.append("g")
                     .call(d3.axisLeft(yScale));

   // Bars
   svg_margined.selectAll(".bar")
      .data(data)
      .join("rect")
      .attr("id", b => "rect_" + b.hash)
      .attr("class", "bar")
      .attr("hash", b => b.hash)
      .attr("fill", "#69b3a2")
      .attr("opacity", 0.75)
      .attr("x", b => xScale(new Date(b.time)))
      .attr("width", xScale.bandwidth())
      .attr("height", 0)
      .attr("y", height)
      .transition()
         .duration(1000)
         .attr("y", b => yScale(parseInt(b.n_tx)))
         .attr("height", b => height - yScale(parseInt(b.n_tx)))

   // Setting labels
   x_axis.selectAll("text")
      .attr("fill", l => labels_ordinal(l))
      .style("text-anchor", "center")
      .style("font-size", "12px")
      .call(function(t) { 
         t.each(function(d) {
            var self = d3.select(this)
            var split = format_date(new Date(self.text()), labels_ordinal(self.text())=="black" ).split(' ')  // get the text and split it
            self.text(l => '')
            if (split.length > 1) {
               self.append("tspan")
                     .attr("x", 0)
                     .attr("dy","1em")
                     .text(split[0])
               self.append("tspan")
                     .attr("x", 0)
                     .attr("dy","1em")
                     .text(split[1])
            }
            else {
               self.append("tspan")
                     .attr("x", 0)
                     .attr("dy","2em")
                     .text(split[0])
            }
         })
      })



   
//    // //Drag
//    // var zoom = d3.zoom()
//    //            .scaleExtent([1, 1])
//    //            .translateExtent([[0, 1000], [width, height]])
//    //            .on("zoom", zoomed);
   
//    // function zoomed(event, d) {
//    //    svg.attr('transform', event.transform)
//    // }
   
//    // svg.call(zoom);


   
   const zoom = d3.zoom()
    .on('zoom', (event) => {
      svg.attr('transform', event.transform);
    })
    .scaleExtent([1, 40]);

   svg.call(zoom)
//    console.log(d3.select("svg"))

})