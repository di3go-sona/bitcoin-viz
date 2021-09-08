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
const margin_y = {top: 40, right: 0, bottom: 40, left: 10},
      width_y  = (70 - margin_y.left - margin_y.right),
      height_y = (window.innerWidth/7 - margin_y.top - margin_y.bottom)

const margin_x = {top: 40, right: 10, bottom: 40, left: 0},
      width_x  = (window.innerWidth*3 - margin_x.left - margin_x.right),
      height_x = (window.innerWidth/7 - margin_x.top - margin_x.bottom)

// append the svg object to the body of the page
const svg_y = d3.select("#col-y-axis")
                .append("svg")
                .attr("width", width_y + margin_y.left + margin_y.right)
                .attr("height", height_y + margin_y.top + margin_y.bottom)

const svg_x = d3.select("#col-x-axis")
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
                                .attr("transform", `translate(${margin_x.left-1},${margin_x.top})`)

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
                               .attr("transform", `translate(${margin_y.left+width_y-1},${margin_y.top})`)

   //Y axis label
   const label_y_axis =  svg_margined_y.append("text").attr("transform", "rotate(-90)")
                                       .attr("y", 0 - margin_y.left - width_y + 5)
                                       .attr("x",0 - (height_y / 2))
                                       .attr("dy", ".8em")
                                       .style("text-anchor", "middle")
                                       .text("Transactions"); 

   // Y Axis
   const y_axis = svg_margined_y.append("g")
                                .attr("class", "y axis")
                                .call(d3.axisLeft(yScale));

   // tooltips
   var tooltip = d3.select('body').append('div')
                                  .attr('class', 'tooltip')
                                  .style("opacity", 0);

   // Bars
   svg_margined_x.selectAll(".bar")
      .data(data)
      .join("rect")
      .attr("id", b => "rect_" + b.hash)
      .attr("class", "bar")
      .attr("x", b => xScale(new Date(b.time)))
      .attr("width", xScale.bandwidth())
      .attr("height", height_x)
      .attr("y", 0)
      .attr("fill", "#69b3a2")
      .attr("opacity", 0.75)
      .on("click", function(event, d) {
         console.log("ciao")
      })
      .transition()
         .duration(1000)
         .attr("y", b => yScale(parseInt(b.n_tx)))
         .attr("height", b => height_y - yScale(parseInt(b.n_tx)))
      

   svg_margined_x.selectAll(".background-bar")
      .data(data)
      .join("rect")
      .attr("id", b => "bg_rect_" + b.hash)
      .attr("class", "background-bar")
      .attr("fill", "transparent")
      .attr("hash", b => b.hash)
      .attr("x", b => xScale(new Date(b.time)))
      .attr("width", xScale.bandwidth())
      .attr("height", height_x)
      .attr("y", 0)
      .on("mouseover", function(event, d) {
         tooltip.style('opacity', '.8');
      })
      .on("mousemove", function(event, d) {
         tooltip_width = tooltip.node().getBoundingClientRect().width
         tooltip_height = tooltip.node().getBoundingClientRect().height

         tooltip.transition()
           .duration(200)
           .style("opacity", .75)
         tooltip
           .html(`Block num: ${d.height}<hr class="my-1"/>N. tx: ${d.n_tx}`)
           .style('left', (event.pageX < window.innerWidth/2) ? (event.pageX + 2)+'px' : (event.pageX - 2 - tooltip_width)+'px')
           .style('top', (event.pageY - tooltip_height - 2) + 'px')
      })
      .on("mouseout", function(event, d) {
         tooltip.transition()
            .duration(500)
            .style("opacity", 0)
      })

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
               self.append("tspan").attr("x", 0).attr("dy","1em").text(split[0])
               self.append("tspan").attr("x", 0).attr("dy","1em").text(split[1])
            }
            else {
               self.append("tspan").attr("x", 0).attr("dy","2em").text(split[0])
            }
         })
      })
})