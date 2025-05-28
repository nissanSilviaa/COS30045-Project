// js/drugtests/boxplot.js

// Bar chart of total positive drug tests by age group (top 6)
console.log('boxplot.js loaded');

document.addEventListener('DOMContentLoaded', () => {
  const container = d3.select('#boxplot');
  const margin = { top: 20, right: 20, bottom: 60, left: 80 };
  const fullWidth  = container.node().clientWidth;
  const fullHeight = container.node().clientHeight;
  const width  = fullWidth  - margin.left - margin.right;
  const height = fullHeight - margin.top  - margin.bottom;

  // Clear and append SVG
  container.selectAll('*').remove();
  const svg = container.append('svg')
    .attr('width', fullWidth)
    .attr('height', fullHeight)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // Tooltip
  const tooltip = d3.select('body').append('div')
    .attr('class', 'tooltip')
    .style('opacity', 0);

  // Load and preprocess data
  d3.csv('database/drug_police_enforcement_2023_positive_drug_tests_2024-09-20.csv')
    .then(raw => {
      // Filter unwanted groups
      const filtered = raw.filter(d => d.AGE_GROUP && d.AGE_GROUP !== 'All ages' && d.COUNT);

      // Compute total by age group
      const rolled = d3.rollup(
        filtered,
        v => d3.sum(v, d => +d.COUNT.replace(/[^0-9.-]+/g, '') || 0),
        d => d.AGE_GROUP
      );
      let data = Array.from(rolled, ([age, total]) => ({ age, total }));
      // Sort descending and take top 6
      data.sort((a,b) => b.total - a.total);
      data = data.slice(0, 6);

      // X scale: age groups
      const x = d3.scaleBand()
        .domain(data.map(d => d.age))
        .range([0, width])
        .padding(0.3);
      svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll('text')
          .attr('transform', 'rotate(-40)')
          .style('text-anchor', 'end');

      // Y scale: counts
      const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.total)])
        .range([height, 0])
        .nice();
      svg.append('g')
        .call(d3.axisLeft(y).tickFormat(d3.format(',')).ticks(6));

      // Bars
      svg.selectAll('.bar')
        .data(data)
        .enter().append('rect')
          .attr('class', 'bar')
          .attr('x', d => x(d.age))
          .attr('y', d => y(d.total))
          .attr('width', x.bandwidth())
          .attr('height', d => height - y(d.total))
          .attr('fill', '#69b3a2')
          .on('mouseover', (event, d) => {
            tooltip.transition().duration(200).style('opacity', 0.9);
            tooltip.html(`<strong>${d.age}</strong><br/>Total: ${d3.format(',')(d.total)}`)
              .style('left', `${event.pageX+10}px`)
              .style('top', `${event.pageY-28}px`);
          })
          .on('mouseout', () => tooltip.transition().duration(200).style('opacity', 0));

      // Axis labels
      svg.append('text')
        .attr('x', width/2).attr('y', height + margin.bottom - 10)
        .attr('text-anchor', 'middle').text('Age Group');
      svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height/2).attr('y', -margin.left + 15)
        .attr('text-anchor', 'middle').text('Total Positive Tests');
    })
    .catch(err => console.error('Error loading boxplot data:', err));
});
