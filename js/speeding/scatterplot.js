console.log('scatterplot.js loaded');

document.addEventListener('DOMContentLoaded', function () {
  const scatterMargin = { top: 60, right: 30, bottom: 80, left: 80 };
  const scatterWidth = 800 - scatterMargin.left - scatterMargin.right;
  const scatterHeight = 450 - scatterMargin.top - scatterMargin.bottom;

  const scatterSvg = d3.select("#chart-connected-scatter")
    .append("svg")
    .attr("width", scatterWidth + scatterMargin.left + scatterMargin.right)
    .attr("height", scatterHeight + scatterMargin.top + scatterMargin.bottom)
    .append("g")
    .attr("transform", `translate(${scatterMargin.left},${scatterMargin.top})`);

  const scatterTooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

  d3.csv("database/speeding.csv").then(data => {
    const scatterData = data.filter(d => d.YEAR && d.JURISDICTION && d.FINES);
    scatterData.forEach(d => {
      d.YEAR = +d.YEAR;
      d.FINES = +d.FINES;
    });

    const scatterJurisdictions = Array.from(new Set(scatterData.map(d => d.JURISDICTION)));
    const scatterColor = d3.scaleOrdinal()
      .domain(scatterJurisdictions)
      .range(d3.schemeTableau10);

    const xScatter = d3.scaleLinear()
      .domain(d3.extent(scatterData, d => d.YEAR))
      .range([0, scatterWidth])
      .nice();

    const yScatter = d3.scaleLinear()
      .domain([0, d3.max(scatterData, d => d.FINES) * 1.1])
      .range([scatterHeight, 0])
      .nice();

    // Grid lines
    scatterSvg.append("g")
      .attr("class", "grid")
      .call(d3.axisLeft(yScatter)
        .tickSize(-scatterWidth)
        .tickFormat("")
        .tickValues(yScatter.ticks(5))
      )
      .selectAll("line")
      .attr("stroke", "#eee")
      .attr("stroke-dasharray", "2,2");

    // Axes
    scatterSvg.append("g")
      .attr("transform", `translate(0,${scatterHeight})`)
      .call(d3.axisBottom(xScatter).tickFormat(d3.format("d")))
      .selectAll("text")
      .attr("class", "axis-text")
      .attr("transform", "translate(0,5)");

    scatterSvg.append("g")
      .call(d3.axisLeft(yScatter).tickFormat(d3.format(",")))
      .selectAll("text")
      .attr("class", "axis-text");

    // Labels
    scatterSvg.append("text")
      .attr("x", scatterWidth / 2)
      .attr("y", scatterHeight + 45)
      .attr("text-anchor", "middle")
      .attr("class", "axis-text")
      .text("Year");

    scatterSvg.append("text")
      .attr("text-anchor", "middle")
      .attr("transform", "rotate(-90)")
      .attr("x", -scatterHeight / 2)
      .attr("y", -60)
      .attr("class", "axis-text")
      .text("Fines Issued");

    scatterSvg.append("text")
      .attr("x", scatterWidth / 2)
      .attr("y", -20)
      .attr("text-anchor", "middle")
      .attr("class", "title-text")
      .text("Connected Scatter Plot: Fines per Year by Jurisdiction");

    // Line generator
    const line = d3.line()
      .x(d => xScatter(d.YEAR))
      .y(d => yScatter(d.FINES))
      .curve(d3.curveMonotoneX);

    // Plot by jurisdiction
    const dataNest = d3.group(scatterData, d => d.JURISDICTION);
    dataNest.forEach((values, key) => {
      values.sort((a, b) => a.YEAR - b.YEAR);

      // Line
      scatterSvg.append("path")
        .datum(values)
        .attr("fill", "none")
        .attr("stroke", scatterColor(key))
        .attr("stroke-width", 2.5)
        .attr("d", line);

      // Points
      scatterSvg.selectAll(`.circle-${key}`)
        .data(values)
        .enter()
        .append("circle")
        .attr("cx", d => xScatter(d.YEAR))
        .attr("cy", d => yScatter(d.FINES))
        .attr("r", 5)
        .attr("fill", scatterColor(key))
        .attr("stroke", "#fff")
        .attr("stroke-width", 1)
        .on("mouseover", (event, d) => {
          scatterTooltip.transition().duration(200).style("opacity", 0.9);
          scatterTooltip.html(`<strong>${d.JURISDICTION}</strong><br>Year: ${d.YEAR}<br>Fines: ${d3.format(",")(d.FINES)}`)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", () => {
          scatterTooltip.transition().duration(500).style("opacity", 0);
        });
    });

    // Legend
    const legend = scatterSvg.selectAll(".legend")
      .data(scatterJurisdictions)
      .enter().append("g")
      .attr("class", "legend")
      .attr("transform", (d, i) => `translate(${(i % 4) * 200}, ${scatterHeight + 60 + Math.floor(i / 4) * 20})`);

    legend.append("circle")
      .attr("r", 6)
      .attr("fill", d => scatterColor(d))
      .attr("cy", -6);

    legend.append("text")
      .text(d => d)
      .attr("x", 10)
      .attr("y", 0)
      .attr("class", "legend-text");
  });
});
