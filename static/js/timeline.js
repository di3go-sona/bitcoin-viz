// set the dimensions and margins of the graph
const margin = {top: 30, right: 30, bottom: 70, left: 60},
    width = window.innerWidth - margin.left - margin.right,
    height = window.innerHeight - margin.top - margin.bottom;

// append the svg object to the body of the page
const svg = d3.select("#timeline")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

var dataset

// Parse the Data
// d3.csv("https://raw.githubusercontent.com/holtzy/data_to_viz/master/Example_dataset/7_OneCatOneNum_header.csv").then( function(data) {
d3.csv("/timeline/csv").then( function(data) {

    // Debugging purpose
    dataset = data

    // X axis
    const x = d3.scaleBand()
                .range([ 0, width ])
                .domain(data.map(b => new Date(b.time)))
                .padding(0.1);

    svg.append("g")
       .attr("transform", `translate(0, ${height})`)
       .call(d3.axisBottom(x))
       .selectAll("text")
          .attr("transform", "translate(-10,0)rotate(-45)")
          .style("text-anchor", "end");

    // Add Y axis
    const y = d3.scaleLinear()
                .domain([0, 3000])
                .range([ height, 0]);

    svg.append("g")
       .call(d3.axisLeft(y));

    // Bars
    svg.selectAll("mybar")
       .data(data)
       .join("rect")
       .attr("x", d => x(new Date(d.time)))
       .attr("y", d => y(parseInt(d.n_tx)))
       .attr("width", x.bandwidth())
       .attr("height", d => height - y(d.n_tx))
       .attr("fill", "#69b3a2")

})