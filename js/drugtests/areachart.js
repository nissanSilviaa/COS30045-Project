console.log('areachart.js loaded');

document.addEventListener('DOMContentLoaded', () => {
  const container = d3.select('#areachart');
  const margin = { top: 40, right: 20, bottom: 50, left: 100 };
  const fullWidth = container.node().clientWidth;
  const fullHeight = container.node().clientHeight;
  const width = fullWidth - margin.left - margin.right;
  const height = fullHeight - margin.top - margin.bottom;

  // Clear container and setup SVG
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

  // Load and parse data, preserving ageGroup
  d3.csv('database/drug_police_enforcement_2023_positive_drug_tests_2024-09-20.csv')
    .then(rawData => {
      const records = rawData.map(d => ({
        year: +d.YEAR,
        count: +d.COUNT.replace(/[^0-9.-]+/g, '') || 0,
        state: d.JURISDICTION,
        ageGroup: d.AGE_GROUP
      })).filter(d => d.year && d.state);

      // Unique years and states
      const years = Array.from(new Set(records.map(d => d.year))).sort((a,b) => a - b);
      const states = Array.from(new Set(records.map(d => d.state))).sort();

      // Build table: year rows with state columns
      const table = years.map(year => {
        const row = { year };
        states.forEach(state => {
          row[state] = d3.sum(
            records.filter(r => r.year === year && r.state === state),
            r => r.count
          );
        });
        return row;
      });

      // Compute total per state for ordering
      const totalsByState = states.map(state => ({
        state,
        total: d3.sum(table, r => r[state] || 0)
      }));
      totalsByState.sort((a,b) => b.total - a.total);
      const orderedStates = totalsByState.slice().reverse().map(d => d.state);

      // Stack layout
      const stack = d3.stack().keys(orderedStates);
      const series = stack(table);

      // Scales
      const x = d3.scaleLinear().domain(d3.extent(years)).range([0, width]);
      const y = d3.scaleLinear()
        .domain([0, d3.max(series, s => d3.max(s, d => d[1]))]).nice()
        .range([height, 0]);

      // Color scale
      const color = d3.scaleOrdinal(d3.schemeCategory10).domain(orderedStates);

      // Area generator
      const areaGen = d3.area()
        .x(d => x(d.data.year))
        .y0(d => y(d[0]))
        .y1(d => y(d[1]));

      // Draw stacked areas with age-group tooltip
      svg.selectAll('.layer')
        .data(series)
        .join('path')
          .attr('class', 'layer')
          .attr('d', areaGen)
          .attr('fill', d => color(d.key))
          .on('mouseover', (event, d) => {
            // roll-up ageGroups for this state
            const ageMap = d3.rollup(
              records.filter(r => r.state === d.key),
              v => d3.sum(v, r => r.count),
              r => r.ageGroup
            );
            let html = `<strong>${d.key}</strong><br/>Total: ${d3.format(',')(totalsByState.find(s=>s.state===d.key).total)}<br/><em>By Age Group:</em><ul>`;
            Array.from(ageMap).forEach(([age, val]) => {
              html += `<li>${age}: ${d3.format(',')(val)}</li>`;
            });
            html += '</ul>';
            tooltip.transition().duration(200).style('opacity', 0.95);
            tooltip.html(html)
              .style('left', `${event.pageX+10}px`)
              .style('top', `${event.pageY-28}px`);
          })
          .on('mouseout', () => tooltip.transition().duration(200).style('opacity', 0));

      // Axes
      svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x).tickFormat(d3.format('d')));
      svg.append('g').call(d3.axisLeft(y));

      // Axis labels
      svg.append('text')
        .attr('x', width/2).attr('y', height + margin.bottom - 10)
        .attr('text-anchor','middle').text('Year');
      svg.append('text')
        .attr('transform','rotate(-90)')
        .attr('x', -height/2).attr('y', -margin.left + 15)
        .attr('text-anchor','middle').text('Positive Tests');

      // Legend on left
      const legend = svg.append('g')
        .attr('transform', `translate(${-margin.left + 20},0)`);
      totalsByState.forEach((d, i) => {
        legend.append('rect')
          .attr('x', 100)
          .attr('y', i*20)
          .attr('width', 12)
          .attr('height', 12)
          .attr('fill', color(d.state));
        legend.append('text')
          .attr('x', 118)
          .attr('y', i*20 + 10)
          .text(`${d.state} (${d3.format(',')(d.total)})`)
          .style('font-size', '12px');
      });
    })
    .catch(err => console.error('Error loading area chart data:', err));
});
