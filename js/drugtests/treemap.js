// js/drugtests/treemap.js

// This script renders a treemap of positive drug tests by state with enlarged white labels.
console.log('treemap.js loaded');

document.addEventListener('DOMContentLoaded', () => {
  // Select and size container
  const container = d3.select('#treemap');
  const width = container.node().clientWidth;
  const height = container.node().clientHeight;

  // Clear previous content and create SVG
  container.selectAll('*').remove();
  const svg = container.append('svg')
    .attr('width', width)
    .attr('height', height);

  // Tooltip setup
  const tooltip = d3.select('body')
    .append('div')
    .attr('class', 'tooltip')
    .style('opacity', 0);

  // Load data relative to HTML
  d3.csv('database/drug_police_enforcement_2023_positive_drug_tests_2024-09-20.csv')
    .then(data => {
      // Parse counts, state, ageGroup
      data.forEach(d => {
        d.count = +d['COUNT'].replace(/[^0-9.-]+/g, '') || 0;
        d.state = d['JURISDICTION'] || 'Unknown';
        d.ageGroup = d['AGE_GROUP'] || 'All ages';
      });

      // Aggregate by state with age breakdown
      const stateAgeMap = d3.rollup(
        data,
        v => d3.sum(v, d => d.count),
        d => d.state,
        d => d.ageGroup
      );
      const testsByState = Array.from(stateAgeMap, ([state, ageMap]) => {
        const ageCounts = Array.from(ageMap, ([age, total]) => ({ age, total }));
        const total = d3.sum(ageCounts, d => d.total);
        return { state, total, ageCounts };
      }).filter(d => d.state);

      // Color scale
      const color = d3.scaleOrdinal(d3.schemeCategory10)
        .domain(testsByState.map(d => d.state));

      // Hierarchy and layout
      const root = d3.hierarchy({ children: testsByState })
        .sum(d => d.total)
        .sort((a, b) => b.value - a.value);
      d3.treemap().size([width, height]).paddingInner(2)(root);

      // Render nodes
      const nodes = svg.selectAll('g.node')
        .data(root.leaves())
        .join('g')
          .attr('class', 'node')
          .attr('transform', d => `translate(${d.x0},${d.y0})`);

      // Draw rectangles
      nodes.append('rect')
        .attr('width', d => d.x1 - d.x0)
        .attr('height', d => d.y1 - d.y0)
        .attr('fill', d => color(d.data.state))
        .on('mouseover', (event, d) => {
          tooltip.transition().duration(200).style('opacity', 0.95);
          let html = `<strong>${d.data.state}</strong><br/>Total Tests: ${d3.format(',')(d.data.total)}<br/><em>By Age Group:</em><ul>`;
          d.data.ageCounts.forEach(a => {
            html += `<li>${a.age}: ${d3.format(',')(a.total)}</li>`;
          });
          html += '</ul>';
          tooltip.html(html)
            .style('left', `${event.pageX + 10}px`)
            .style('top', `${event.pageY - 28}px`);
        })
        .on('mouseout', () => tooltip.transition().duration(200).style('opacity', 0));

      // Append larger white labels
      nodes.append('text')
        .attr('x', 6)
        .attr('y', 20)
        .text(d => `${d.data.state}: ${d3.format(',')(d.data.total)}`)
        .attr('fill', '#ffffff')
        .style('font-family', 'Arial, sans-serif')
        .style('font-size', '16px')
        .style('font-weight', '700');
    })
    .catch(err => {
      console.error('Error loading or parsing data:', err);
      svg.append('text')
        .attr('x', width / 2)
        .attr('y', height / 2)
        .attr('text-anchor', 'middle')
        .style('fill', 'red')
        .text('Unable to load data.');
    });
});


