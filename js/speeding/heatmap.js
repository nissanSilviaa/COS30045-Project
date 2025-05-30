console.log('heatmap.js loaded');

document.addEventListener('DOMContentLoaded', function () {
  const margin = { top: 80, right: 20, bottom: 80, left: 120 };
  const width = 800 - margin.left - margin.right;
  const height = 500 - margin.top - margin.bottom;

  const svg = d3.select("#chart-speeding")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom + 80)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

  d3.csv("database/speeding.csv").then(data => {
    data.forEach(d => d.FINES = +d.FINES || 0);

    const nested = d3.rollups(
      data,
      v => d3.sum(v, d => d.FINES),
      d => d.JURISDICTION,
      d => d.AGE_GROUP
    );

    const jurisdictions = Array.from(new Set(data.map(d => d.JURISDICTION)));
    const ageGroups = Array.from(new Set(data.map(d => d.AGE_GROUP)));

    const heatData = [];
    nested.forEach(([jurisdiction, ageMap]) => {
      ageMap.forEach(([age, fines]) => {
        heatData.push({ jurisdiction, age, fines });
      });
    });

    const x = d3.scaleBand().domain(ageGroups).range([0, width]).padding(0.05);
    const y = d3.scaleBand().domain(jurisdictions).range([0, height]).padding(0.05);
    const maxFines = d3.max(heatData, d => d.fines);
    const color = d3.scaleSequential().interpolator(d3.interpolateYlOrRd).domain([0, maxFines]);

    svg.selectAll()
      .data(heatData, d => d.jurisdiction + ':' + d.age)
      .enter()
      .append("rect")
      .attr("x", d => x(d.age))
      .attr("y", d => y(d.jurisdiction))
      .attr("width", x.bandwidth())
      .attr("height", y.bandwidth())
      .style("fill", d => color(d.fines))
      .style("stroke", "#fff")
      .on("mouseover", function (event, d) {
        tooltip.transition().duration(200).style("opacity", .9);
        tooltip.html(`<strong>${d.jurisdiction}</strong><br/>Age ${d.age}<br/>Fines: ${d3.format(",")(d.fines)}`)
          .style("left", (event.pageX + 15) + "px")
          .style("top", (event.pageY - 30) + "px");
        d3.select(this).style("stroke", "#000");
      })
      .on("mouseout", function () {
        tooltip.transition().duration(500).style("opacity", 0);
        d3.select(this).style("stroke", "#fff");
      });

    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("class", "axis-text");

    svg.append("g")
      .call(d3.axisLeft(y))
      .selectAll("text")
      .attr("class", "axis-text");

    svg.append("text")
      .attr("x", width / 2)
      .attr("y", -40)
      .attr("class", "title-text")
      .attr("text-anchor", "middle")
      .text("Speeding Fines Heatmap: Jurisdiction vs Age Group");

    svg.append("text")
      .attr("x", width / 2)
      .attr("y", height + 50)
      .attr("class", "axis-text")
      .attr("text-anchor", "middle")
      .text("Age Group");

    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", -80)
      .attr("class", "axis-text")
      .attr("text-anchor", "middle")
      .text("Jurisdiction");

    const legendWidth = 300;
    const legendHeight = 20;
    const legendMargin = { top: height + 70, left: (width - legendWidth) / 2 };

    const legendSvg = svg.append("g")
      .attr("transform", `translate(${legendMargin.left},${legendMargin.top})`);

    const defs = svg.append("defs");
    const gradient = defs.append("linearGradient")
      .attr("id", "legend-gradient")
      .attr("x1", "0%").attr("x2", "100%")
      .attr("y1", "0%").attr("y2", "0%");

    gradient.selectAll("stop")
      .data(color.range())
      .enter().append("stop")
      .attr("offset", (d, i) => i / (color.range().length - 1))
      .attr("stop-color", d => d);

    legendSvg.append("rect")
      .attr("width", legendWidth)
      .attr("height", legendHeight)
      .style("fill", "url(#legend-gradient)")
      .style("stroke", "#999");

    legendSvg.append("text")
      .attr("x", 0)
      .attr("y", -10)
      .attr("class", "legend-text")
      .text("Number of Fines");

    const legendScale = d3.scaleLinear()
      .domain([0, maxFines])
      .range([0, legendWidth]);

    const legendAxis = d3.axisBottom(legendScale).ticks(5).tickFormat(d3.format(","));

    legendSvg.append("g")
      .attr("transform", `translate(0,${legendHeight})`)
      .call(legendAxis)
      .selectAll("text")
      .attr("class", "legend-text");
  }); // <-- closes d3.csv().then
}); // <-- closes DOMContentLoaded
