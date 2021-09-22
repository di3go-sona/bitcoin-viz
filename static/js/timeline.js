function format_date(date, isFull) {
   year = date.getFullYear()
   month = date.getMonth().toString().padStart(2, "0")
   day = date.getDay().toString().padStart(2, "0")
   hours = date.getHours().toString().padStart(2, "0")
   minutes = date.getMinutes().toString().padStart(2, "0")
   seconds = date.getSeconds().toString().padStart(2, "0")
   
   if (isFull) return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`
   else        return `${hours}:${minutes}:${seconds}`
}

// Set the dimensions and margins of the timeline
const margin_y = {top: 40, right: 0, bottom: 60, left: 20},
      width_y  = (70 - margin_y.left - margin_y.right),
      height_y = (window.innerHeight/4.5 - margin_y.top - margin_y.bottom)

const margin_x = {top: 40, right: 20, bottom: 60, left: 0},
      width_x  = ($("#col-x-axis").width() - width_y - margin_y.left - margin_x.right),
      height_x = (window.innerHeight/4.5 - margin_x.top - margin_x.bottom)

// Append the svg object to the body of the page
const svg_y = d3.select("#col-y-axis")
                .append("svg")
                .attr("width", width_y + margin_y.left + margin_y.right)
                .attr("height", height_y + margin_y.top + margin_y.bottom)
                .append("g") 
                .attr("transform", `translate(${margin_y.left+width_y-1},${margin_y.top})`)

const svg_x = d3.select("#col-x-axis")
                .append("svg")
                .attr("width", width_x + margin_x.left + margin_x.right)
                .attr("height", height_x + margin_x.top + margin_x.bottom)
                .append("g") 
                .attr("transform", `translate(${margin_x.left-1},${margin_x.top})`)

// var dataset

// X axis scale
const xScale = d3.scaleBand()
                 .range([0, width_x])
                 .padding(0.4)

// X Axis
const x_axis = svg_x.append("g")
                    .attr("transform", `translate(0, ${height_x})`)
                    .attr("class", "x axis")

// Y axis scale
const yScale = d3.scaleLinear()
                 .range([height_y, 0])

const y_axis = svg_y.append("g")
                    .attr("class", "y axis")

// Parse the Data
d3.csv("/timeline/csv?param=transactions").then( function(data) {

   // Debugging purpose
   // dataset = data
   
   //Setting labels color
   last_hour = null
   labels_color = []
   for (let time of data.map(b => new Date(b.time))) {
      if (last_hour == null || time.getHours() != last_hour) {
         labels_color.push("white")
         last_hour = time.getHours()
      }
      else {
         labels_color.push("gray")
      }
   }

   // X Axis
   xScale.domain(data.map(b => new Date(b.time)))
   x_axis.call(d3.axisBottom(xScale))

   // Setting labels x axis
   const labels_ordinal = d3.scaleOrdinal()
                            .domain(data.map(b => b.time))
                            .range(labels_color)

   x_axis.selectAll("text")
   .attr("fill", l => labels_ordinal(l))
   .style("text-anchor", "center")
   .style("font-size", "12px")
   .call(function(t) { 
      t.each(function(d) {
         var self = d3.select(this)
         var split = format_date(new Date(self.text()), labels_ordinal(self.text())=="white").split(' ')  // get the text and split it
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

   // Y axis
   yScale.domain([0, d3.max(data.map(b => parseInt(b.bar_value)))])

   //Y axis label
   const label_y_axis =  svg_y.append("text").attr("transform", "rotate(-90)")
                                       .attr("y", 0 - margin_y.left - width_y + 5)
                                       .attr("x",0 - (height_y / 2))
                                       .attr("dy", ".45em")
                                       .attr("class", "label-y")
                                       .attr("fill", "white")
                                       .style("text-anchor", "middle")
                                       .text("Transactions")

   y_axis.call(d3.axisLeft(yScale))

   // tooltips
   var tooltip = d3.select('body').append('div')
                                  .attr('class', 'tooltip')
                                  .style("opacity", 0)

   // Bars
   bar_wrappers = svg_x.selectAll(".wrapper-bar")
                  .data(data)
                  .join("g")
                  .attr("class", "wrapper-bar")
                  .attr("style", "cursor: pointer;")
                  .on("mouseover", function(event, d) {
                     tooltip.style('opacity', '.8')
                  })
                  .on("mousemove", function(event, d) {
                     tooltip_width = tooltip.node().getBoundingClientRect().width
                     tooltip_height = tooltip.node().getBoundingClientRect().height

                     tooltip.transition()
                     .duration(200)
                     .style("opacity", .75)
                     tooltip
                     .html(`Block num: ${d.height}<hr class="my-1"/>${$("input[type='radio']:checked").next().text()}: ${d.bar_value}`)
                     .style('left', (event.pageX < window.innerWidth/2) ? (event.pageX + 2)+'px' : (event.pageX - 2 - tooltip_width)+'px')
                     .style('top', (event.pageY - tooltip_height - 2) + 'px')
                  })
                  .on("mouseout", function(event, d) {
                     tooltip.transition()
                        .duration(500)
                        .style("opacity", 0)
                  })
                  .on("click", function(event, d) {
                     clicked_bar = d3.select("#rect_"+d.hash)
                     if(clicked_bar.node().getAttribute("class").split(/\s+/).includes("selected")) {
                        clicked_bar.transition().duration(200).attr("opacity", 0.15)
                        clicked_bar.node().classList.remove("selected")
                        svg_x.select("#selection_rect_"+d.hash).remove()
                     }
                     else if(d3.selectAll(".bar.selected").nodes().length < 5){
                        clicked_bar.transition().duration(200).attr("opacity", 0.8)
                        clicked_bar.node().classList.add("selected")
                        svg_x
                           .append("svg")
                           .attr("id", "selection_rect_"+d.hash)
                           .attr("class", "tick-selected")
                           .attr("xmlns", "http://www.w3.org/2000/svg")
                              .attr("x", parseFloat($(clicked_bar.node()).attr("x")) + parseFloat($(clicked_bar.node()).attr("width"))/2 - 15)
                              .attr("y", $(clicked_bar.node()).attr("y") - 40)
                              .attr("opacity", 1)
                              .attr("width", "30")
                              .attr("height", "30")
                              .attr("viewBox", "0 0 24 24")
                              .attr("stroke", $(clicked_bar.node()).attr("fill"))
                              .attr("fill", "none")
                              .attr("stroke-width", "2.5")
                              .attr("stroke-linecap", "round")
                              .attr("stroke-linejoin", "round")
                              .append("polyline").attr("points", "20 6 9 17 4 12")
                     }
                     // Maybe we must find a better solution
                     update_info_card()
                  })

   // Background
   bar_wrappers.append("rect")
      .attr("id", b => "bg_rect_" + b.hash)
      .attr("class", "background-bar")
      .attr("fill", "transparent")
      .attr("hash", b => b.hash)
      .attr("x", b => xScale(new Date(b.time)))
      .attr("width", xScale.bandwidth())
      .attr("y", b => Math.min(yScale(parseInt(b.bar_value)), height_y/2))
      .attr("height", b =>  Math.max(height_y - yScale(parseInt(b.bar_value)), height_y/2))

   var theshold = d3.max(data.map(b => b.height))-5
   const bars_color_ordinal = d3.scaleOrdinal()
                                .domain(data.map(b => b.hash))
                                .range(data.map(b => (b.height>theshold) ? 0.8:0.15))
   
   // Foreground
   bar_wrappers.append('rect')
      .attr("id", b => "rect_" + b.hash)
      .attr("class", b => bars_color_ordinal(b.hash)==0.8? "bar selected":"bar")
      .attr("x", b => xScale(new Date(b.time)))
      .attr("width", xScale.bandwidth())
      .attr("height", height_x)
      .attr("y", 0)
      .attr("fill", "#69b3a2")
      .attr("opacity", b => bars_color_ordinal(b.hash))
      .transition()
         .duration(1500)
         .attr("y", b => yScale(parseInt(b.bar_value)))
         .attr("height", b => height_y - yScale(parseInt(b.bar_value)))
   
   // Add selected image to pre selected bars
   bar_wrappers.selectAll(".bar.selected").each(function(d) {
      svg_x
         .append("svg")
         .attr("id", "selection_rect_"+d.hash)
         .attr("class", "tick-selected")
         // .attr("for", d.hash)
         .attr("xmlns", "http://www.w3.org/2000/svg")
            .attr("y", yScale(parseInt(d.bar_value)) - 40)
            .attr("x", parseFloat($(this).attr("x")) + parseFloat($(this).attr("width"))/2 - 15)
            .attr("opacity", 1)
            .attr("width", "30")
            .attr("height", "30")
            .attr("viewBox", "0 0 24 24")
            .attr("stroke", $(this).attr("fill"))
            .attr("fill", "none")
            .attr("stroke-width", "2.5")
            .attr("stroke-linecap", "round")
            .attr("stroke-linejoin", "round")
            .append("polyline").attr("points", "20 6 9 17 4 12")
   })
})

$("input[type='radio']").click(function(){

   plot_name = $(this).val()
   bg_color = $(this).css("background-color")
   svg_y.select("text.label-y").transition().duration(500).text($(this).next().text())

   d3.csv("/timeline/csv?param="+plot_name).then( function(data) {

      yScale.domain([0, d3.max(data.map(b => parseInt(b.bar_value)))])

      bar_wrappers.data(data)

      svg_x.selectAll("rect.bar").data(data)
         .join("rect") // Add a new rect for each new elements
         .transition() 
         .duration(500)
            .attr("y", d => yScale(parseInt(d.bar_value)))
            .attr("height", d => height_y - yScale(parseInt(d.bar_value)))
            .attr("fill", bg_color)

      y_axis.transition().duration(500).call(d3.axisLeft(yScale))

      bar_wrappers.selectAll(".bar.selected").each(function(d) {
         d3.select("#selection_rect_"+d.hash).transition().duration(500).attr("stroke", bg_color).attr("y", yScale(d.bar_value) - 40)
      })

   })
 })