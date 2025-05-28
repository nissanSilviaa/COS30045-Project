console.log('dotplot.js loaded');

document.addEventListener('DOMContentLoaded', function () {
  const margin = { top: 40, right: 180, bottom: 60, left: 160 },
        width = 1000 - margin.left - margin.right,
        height = 650 - margin.top - margin.bottom;

  const svg = d3.select("#dotplot")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

  const color = d3.scaleOrdinal(d3.schemeTableau10);

  d3.csv("database/drug_police_enforcement_2023_positive_drug_tests_2024-09-20.csv").then(data => {
    data = data.filter(d => d.METRIC === "positive_drug_tests" && d.JURISDICTION && d.YEAR && d.COUNT);
    data.forEach(d => {
      d.YEAR = +d.YEAR;
      d.COUNT = +d.COUNT;
    });

    const jurisdictions = Array.from(new Set(data.map(d => d.JURISDICTION))).sort();
    const years = Array.from(new Set(data.map(d => d.YEAR))).sort();

    const x = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.COUNT)]).nice()
      .range([0, width]);

    const y = d3.scaleBand()
      .domain(jurisdictions)
      .range([0, height])
      .padding(0.8); // increased for more spacing

    // X-axis
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(6))
      .append("text")
      .attr("x", width / 2)
      .attr("y", 40)
      .attr("fill", "#000")
      .attr("text-anchor", "middle")
      .attr("class", "axis-text")
       .style("font-size", "12px")
      .style("font-weight", "bold")
      .text("Positive Drug Test Count");

    // Y-axis
    svg.append("g")
      .call(d3.axisLeft(y))
      .selectAll("text")
      .style("font-size", "13px");

    // Connecting lines per jurisdiction
    jurisdictions.forEach(jurisdiction => {
      const row = data.filter(d => d.JURISDICTION === jurisdiction);

      svg.append("path")
        .datum(row)
        .attr("fill", "none")
        .attr("stroke", "#ddd")
        .attr("stroke-width", 1)
        .attr("d", d3.line()
          .x(d => x(d.COUNT))
          .y(d => y(d.JURISDICTION) + y.bandwidth() / 2)
        );
    });

    // Draw dots
    svg.selectAll("dot")
      .data(data)
      .enter()
      .append("circle")
      .attr("cx", d => x(d.COUNT))
      .attr("cy", d => y(d.JURISDICTION) + y.bandwidth() / 2)
      .attr("r", 5)
      .attr("fill", d => color(d.YEAR))
      .on("mouseover", (event, d) => {
        tooltip.transition().duration(200).style("opacity", 0.9);
        tooltip.html(
          `<strong>${d.JURISDICTION}</strong><br/>
          Year: ${d.YEAR}<br/>
          Positive Tests: ${d3.format(",")(d.COUNT)}`
        )
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 30) + "px");
      })
      .on("mouseout", () => {
        tooltip.transition().duration(400).style("opacity", 0);
      });

    // Legend
    const legend = svg.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${width + 20}, 10)`);

    years.forEach((year, i) => {
      const g = legend.append("g").attr("transform", `translate(0, ${i * 20})`);
      g.append("rect").attr("width", 10).attr("height", 10).attr("fill", color(year));
      g.append("text")
        .attr("x", 15)
        .attr("y", 10)
        .text(year)
        .attr("alignment-baseline", "middle")
        .style("font-size", "12px");
    });

    // Chart Title
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", -10)
      .attr("text-anchor", "middle")
      .attr("class", "title-text")
      .style("font-size", "18px")
      .style("font-weight", "bold")
      
  });
});
