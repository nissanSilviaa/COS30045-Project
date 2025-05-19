// js/drugtests/areachart.js

// Stacked area chart of positive drug tests by state over time
console.log('areachart.js loaded');

document.addEventListener('DOMContentLoaded', () => {
  const container = d3.select('#areachart');
  const margin = { top: 40, right: 20, bottom: 50, left: 60 };
  const fullWidth = container.node().clientWidth;
  const fullHeight = container.node().clientHeight;
  const width = fullWidth - margin.left - margin.right;
  const height = fullHeight - margin.top - margin.bottom;

  // Clear and set up SVG
  container.selectAll('*').remove();
  const svg = container.append('svg')
    .attr('width', fullWidth)
    .attr('height', fullHeight)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // Tooltip
  const tooltip = d3.select('body')
    .append('div')
    .attr('class', 'tooltip')
    .style('opacity', 0);

  // Load data
  d3.csv('database/drug_police_enforcement_2023_positive_drug_tests_2024-09-20.csv')
    .then(data => {
      // Parse and normalize data
      data.forEach(d => {
        d.year = +d.YEAR;
        d.count = +d.COUNT.replace(/[^0-9.-]+/g, '') || 0;
        d.state = d.JURISDICTION;
      });

      // Get sorted list of years and states
      const years = Array.from(new Set(data.map(d => d.year))).sort((a, b) => a - b);
      const states = Array.from(new Set(data.map(d => d.state))).sort();

      // Build array of yearly totals per state, defaulting missing to 0
      const yearData = years.map(year => {
        const row = { year };
        states.forEach(state => {
          const sumVal = d3.sum(data.filter(d => d.year === year && d.state === state), d => d.count);
          row[state] = sumVal;  // always assign, even if 0
        });
        return row;
      });

      // Stack layout
      const stack = d3.stack().keys(states).order(d3.stackOrderNone).offset(d3.stackOffsetNone);
      const series = stack(yearData);

      // Scales
      const x = d3.scaleLinear()
        .domain(d3.extent(years))
        .range([0, width]);
      const y = d3.scaleLinear()
        .domain([0, d3.max(series, s => d3.max(s, d => d[1]))]).nice()
        .range([height, 0]);

      // Color matching treemap states
      const color = d3.scaleOrdinal(d3.schemeCategory10).domain(states);

      // Area generator
      const area = d3.area()
        .x(d => x(d.data.year))
        .y0(d => y(d[0]))
        .y1(d => y(d[1]));

      // Draw layers
      svg.selectAll('.layer')
        .data(series)
        .join('path')
          .attr('class', 'layer')
          .attr('d', area)
          .attr('fill', d => color(d.key))
          .on('mouseover', (event, d) => {
            tooltip.transition().duration(200).style('opacity', 0.9);
            tooltip.html(`<strong>${d.key}</strong><br/>Total Tests: ${d3.format(',')(d3.sum(d, dd => dd[1] - dd[0]))}`)
              .style('left', `${event.pageX + 10}px`)
              .style('top', `${event.pageY - 28}px`);
          })
          .on('mouseout', () => tooltip.transition().duration(200).style('opacity', 0));

      // Axes
      svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(years.length).tickFormat(d3.format('d')));
      svg.append('g')
        .call(d3.axisLeft(y));

      // Axis labels
      svg.append('text')
        .attr('x', width / 2).attr('y', height + margin.bottom - 10)
        .attr('text-anchor', 'middle').text('Year');
      svg.append('text')
        .attr('transform', 'rotate(-90)').attr('x', -height / 2).attr('y', -margin.left + 15)
        .attr('text-anchor', 'middle').text('Positive Tests');
    })
    .catch(err => {
      console.error('Error loading area chart data:', err);
    });
});
