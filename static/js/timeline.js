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

const timeline = {
   current_block: null
}
// Set the dimensions and margins of the timeline
const tm_margin_y = {top: 40, right: 0, bottom: 60, left: 20},
      tm_width_y  = (70 - tm_margin_y.left - tm_margin_y.right),
      tm_height_y = (window.innerHeight/4.5 - tm_margin_y.top - tm_margin_y.bottom)

const tm_margin_x = {top: 40, right: 20, bottom: 60, left: 0},
      tm_width_x  = ($("#col-x-axis").width() - tm_width_y - tm_margin_y.left - tm_margin_x.right),
      tm_height_x = (window.innerHeight/4.5 - tm_margin_x.top - tm_margin_x.bottom)

// Append the svg object to the body of the page
const tm_svg_y = d3.select("#col-y-axis")
                .append("svg")
                .attr("width", tm_width_y + tm_margin_y.left + tm_margin_y.right)
                .attr("height", tm_height_y + tm_margin_y.top + tm_margin_y.bottom)
                .append("g") 
                .attr("transform", `translate(${tm_margin_y.left+tm_width_y-1},${tm_margin_y.top})`)

const tm_svg_x = d3.select("#col-x-axis")
                .append("svg")
                .attr("width", tm_width_x + tm_margin_x.left + tm_margin_x.right)
                .attr("height", tm_height_x + tm_margin_x.top + tm_margin_x.bottom)
                .append("g") 
                .attr("transform", `translate(${tm_margin_x.left-1},${tm_margin_x.top})`)

// X axis scale
const tm_xScale = d3.scaleBand()
                 .range([0, tm_width_x])
                 .padding(0.4)

// X Axis
const tm_x_axis = tm_svg_x.append("g")
                    .attr("transform", `translate(0, ${tm_height_x})`)
                    .attr("class", "x axis")

// Y axis scale
const tm_yScale = d3.scaleLinear()
                 .range([tm_height_y, 0])

const tm_y_axis = tm_svg_y.append("g")
                    .attr("class", "y axis")

var radio_button = $("input[type='radio']:checked")

// Parse the Data
d3.csv(`/timeline/csv?plot=${$(radio_button).val()}&types=${checkboxes.toArray().join(',')}`).then( function(data) {

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
   tm_xScale.domain(data.map(b => new Date(b.time)))
   tm_x_axis.call(d3.axisBottom(tm_xScale))

   // Setting labels x axis
   const tm_labels_ordinal = d3.scaleOrdinal()
                            .domain(data.map(b => b.time))
                            .range(labels_color)

   tm_x_axis.selectAll("text")
   .attr("fill", l => tm_labels_ordinal(l))
   .style("text-anchor", "center")
   .style("font-size", "12px")
   .call(function(t) { 
      t.each(function(d) {
         var self = d3.select(this)
         var split = format_date(new Date(self.text()), tm_labels_ordinal(self.text())=="white").split(' ')  // get the text and split it
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
   tm_yScale.domain([0, d3.max(data.map(b => parseInt(b.bar_value)))])

   //Y axis label
   const label_tm_y_axis =  tm_svg_y.append("text").attr("transform", "rotate(-90)")
                                       .attr("y", 0 - tm_margin_y.left - tm_width_y + 5)
                                       .attr("x",0 - (tm_height_y / 2))
                                       .attr("dy", ".45em")
                                       .attr("class", "label-y")
                                       .attr("fill", "white")
                                       .style("text-anchor", "middle")
                                       .text($(radio_button).next().text())

   tm_y_axis.call(d3.axisLeft(tm_yScale))

   // tooltip
   var tooltip = d3.select('body').append('div')
                                  .attr('class', 'tooltip')
                                  .style("opacity", 0)

   // Bars
   bar_wrappers = tm_svg_x.selectAll(".wrapper-bar")
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
                     .style("opacity", 1)
                     .style("color", "white")
                     tooltip
                     .html(`Block num: ${d.height}<hr class="my-1 bg-white"/>${$("input[type='radio']:checked").next().text()}: ${d.bar_value}`)
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
                     prev_clicked = d3.select(".bar.selected")

                     if (clicked_bar.node() != prev_clicked.node()) {
                        prev_clicked.transition().duration(200).attr("opacity", 0.15)
                        prev_clicked.node().classList.remove("selected")
                        tm_svg_x.select("#selection_rect_"+prev_clicked.data()[0].hash).remove()
                        
                        clicked_bar.transition().duration(200).attr("opacity", 0.8)
                        clicked_bar.node().classList.add("selected")
                        tm_svg_x
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
                        
                        timeline.current_block = clicked_bar.data()[0].hash
                        $(document).trigger("block_changed")
                     }
                  })

   // Background
   bar_wrappers.append("rect")
      .attr("id", b => "bg_rect_" + b.hash)
      .attr("class", "background-bar")
      .attr("fill", "transparent")
      .attr("hash", b => b.hash)
      .attr("x", b => tm_xScale(new Date(b.time)))
      .attr("width", tm_xScale.bandwidth())
      .attr("y", b => Math.min(tm_yScale(parseInt(b.bar_value)), tm_height_y/2))
      .attr("height", b =>  Math.max(tm_height_y - tm_yScale(parseInt(b.bar_value)), tm_height_y/2))

   var theshold = d3.max(data.map(b => b.height))-1
   const bars_color_ordinal = d3.scaleOrdinal()
                                .domain(data.map(b => b.hash))
                                .range(data.map(b => (b.height>theshold) ? 0.8:0.15))
   
   // Foreground
   bar_wrappers.append('rect')
      .attr("id", b => "rect_" + b.hash)
      .attr("class", b => bars_color_ordinal(b.hash)==0.8? "bar selected":"bar")
      .attr("x", b => tm_xScale(new Date(b.time)))
      .attr("width", tm_xScale.bandwidth())
      .attr("height", tm_height_x)
      .attr("y", 0)
      .attr("fill", $(radio_button).css("background-color"))
      .attr("opacity", b => bars_color_ordinal(b.hash))
      .transition()
         .duration(1500)
         .attr("y", b => tm_yScale(parseInt(b.bar_value)))
         .attr("height", b => tm_height_y - tm_yScale(parseInt(b.bar_value)))
   
   // Add selected image to pre selected bars
   bar_wrappers.selectAll(".bar.selected").each(function(d) {
      tm_svg_x
         .append("svg")
         .attr("id", "selection_rect_"+d.hash)
         .attr("class", "tick-selected")
         // .attr("for", d.hash)
         .attr("xmlns", "http://www.w3.org/2000/svg")
            .attr("y", tm_yScale(parseInt(d.bar_value)) - 40)
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

function load_data(min, max, checkboxes) {

   d3.csv(`/timeline/csv?plot=${$(radio_button).val()}&min=${min}&max=${max}&types=${checkboxes.toArray().join(',')}`).then( function(data) {
      tm_svg_y.select("text.label-y").transition().duration(500).text($(radio_button).next().text())
      tm_yScale.domain([0, d3.max(data.map(b => parseInt(b.bar_value)))])
      bar_wrappers.data(data)

      tm_svg_x.selectAll("rect.bar").data(data)
         .join("rect") // Add a new rect for each new elements
         .transition() 
         .duration(500)
            .attr("y", d => tm_yScale(parseInt(d.bar_value)))
            .attr("height", d => tm_height_y - tm_yScale(parseInt(d.bar_value)))
            .attr("fill", $(radio_button).css("background-color"))

      tm_y_axis.transition().duration(500).call(d3.axisLeft(tm_yScale))

      bar_wrappers.selectAll(".bar.selected").each(function(d) {
         d3.select("#selection_rect_"+d.hash).transition().duration(500).attr("stroke", $(radio_button).css("background-color")).attr("y", tm_yScale(d.bar_value) - 40)
      })
   })
}

$("input[type='radio']").click(function(){
   radio_button = $(this)
   load_data(min, max, checkboxes)
})

// Manage filters change custom event
$(document).on("filters_changed", function(event) {
   load_data(min, max, checkboxes)
   setTimeout(function(){ $(document).trigger("load_new_graph") }, 1000);
});