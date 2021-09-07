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
const margin_y = {top: 40, right: 0, bottom: 40, left: 50},
      width_y = 55 - margin_y.left - margin_y.right,
      height_y = window.innerWidth/7 - margin_y.top - margin_y.bottom;

const margin_x = {top: 40, right: 50, bottom: 40, left: 1},
      width_x = window.innerWidth*3 - margin_x.left - margin_x.right,
      height_x = window.innerWidth/7 - margin_x.top - margin_x.bottom;

// append the svg object to the body of the page
const svg_y = d3.select("#timeline1")
                .append("svg")
                .attr("width", width_y + margin_y.left + margin_y.right)
                .attr("height", height_y + margin_y.top + margin_y.bottom)

const svg_x = d3.select("#timeline2")
                .append("svg")
                .attr("width", width_x + margin_x.left + margin_x.right)
                .attr("height", height_x + margin_x.top + margin_x.bottom)

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
                .range([0, width_x])
                .domain(data.map(b => new Date(b.time)))
                .padding(0.4);

   const labels_ordinal = d3.scaleOrdinal()
                           .domain(data.map(b => b.time))
                           .range(labels_color)

   const svg_margined_x = svg_x.append("g") 
                                .attr("transform", `translate(${margin_x.left},${margin_x.top})`)

   // X Axis
   const x_axis = svg_margined_x.append("g")
                              .attr("transform", `translate(0, ${height_x})`)
                              .attr("class", "x axis")
                              .call(d3.axisBottom(xScale))

   // Y axis scale
   const yScale = d3.scaleLinear()
                    .domain([0, d3.max(data.map(b => parseInt(b.n_tx)))])
                    .range([height_y, 0]);

   const svg_margined_y = svg_y.append("g") 
                               .attr("transform", `translate(${margin_y.left},${margin_y.top})`)

   // Y Axis
   const y_axis = svg_margined_y.append("g")
                                .attr("class", "y axis")
                                .call(d3.axisLeft(yScale));

   // Bars
   svg_margined_x.selectAll(".bar")
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
      .attr("y", height_y)
      .transition()
         .duration(1000)
         .attr("y", b => yScale(parseInt(b.n_tx)))
         .attr("height", b => height_y - yScale(parseInt(b.n_tx)))

   // Setting labels
   x_axis.selectAll("text")
      .attr("fill", l => labels_ordinal(l))
      .style("text-anchor", "center")
      .style("font-size", "12px")
      .call(function(t) { 
         t.each(function(d) {
            var self = d3.select(this)
            var split = format_date(new Date(self.text()), labels_ordinal(self.text())=="black").split(' ')  // get the text and split it
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

})