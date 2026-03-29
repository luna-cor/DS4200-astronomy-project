
const FILEPATH = 'exoplanet_archive_data_sans_header.csv';

const MAJOR_METHODS = [
  'Transit',
  'Radial Velocity',
  'Microlensing',
  'Imaging',
  'Astrometry',
  'Pulsar Timing'
];

const COLOR = {
  'Transit':         '#4e8ec7',
  'Radial Velocity': '#2aaa85',
  'Imaging':         '#d45f2e',
  'Microlensing':    '#c99220',
  'Astrometry':      '#c45e9f',
  'Pulsar Timing':   '#7a6bc9'
};

let width  = 700,
    height = 500;

let margin = {
  top:    30,
  bottom: 60,
  left:   70,
  right:  30
};

// Create the SVG 

let svg = d3.select('body')
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .style('background', 'lightyellow');

// Load CSV and filter (employed external research and AI use)

d3.csv(FILEPATH).then(function(rawData) {

  rawData = rawData.filter(d => d.pl_controv_flag !== '1');

  rawData = rawData.filter(d => MAJOR_METHODS.includes(d.discoverymethod));

  // Remove duplicate planet entries
  let seen = new Set();
  rawData = rawData.filter(function(d) {
    let key = d.pl_name + '|' + d.discoverymethod + '|' + d.disc_year;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Convert to numbers
  let data = rawData.map(function(d) {
    return {
      pl_name:         d.pl_name,
      discoverymethod: d.discoverymethod,
      pl_orbper:       +d.pl_orbper,   // orbital period (days)
      pl_rade:         +d.pl_rade      // planet radius (Earth radii)
    };
  }).filter(d => d.pl_orbper > 0 && d.pl_rade > 0);


  let xScale = d3.scaleLinear()
                 .domain([0, 10000])
                 .range([margin.left, width - margin.right]);

  let yScale = d3.scaleLinear()
                 .domain([0, 200])
                 .range([height - margin.bottom, margin.top]);

  // Axes 

  let xAxis = svg.append('g')
                 .call(d3.axisBottom().scale(xScale))
                 .attr('transform', `translate(0, ${height - margin.bottom})`);

  let yAxis = svg.append('g')
                 .call(d3.axisLeft().scale(yScale))
                 .attr('transform', `translate(${margin.left}, 0)`);

  // Axis labels 

  svg.append('text')
     .attr('x', width / 2)
     .attr('y', height - 15)
     .text('Orbital Period (days)')
     .style('text-anchor', 'middle');

  svg.append('text')
     .attr('x', 0 - height / 2)
     .attr('y', 20)
     .text('Planet Radius (Earth Radii)')
     .style('text-anchor', 'middle')
     .attr('transform', 'rotate(-90)');

  // Draw the circles 
  let circles = svg.selectAll('circle')
                   .data(data)
                   .enter()
                   .append('circle')
                   .attr('class', 'datapoint')
                   .attr('r', 4)
                   .attr('cx', d => xScale(d.pl_orbper))
                   .attr('cy', d => yScale(d.pl_rade))
                   .attr('fill', d => COLOR[d.discoverymethod])
                   .attr('opacity', 0.5);

  // ── "Hot Jupiter" zone lines (large planets, short periods) 

  // Vertical line at 10-day period boundary
  svg.append('line')
     .attr('x1', xScale(10)).attr('x2', xScale(10))
     .attr('y1', margin.top).attr('y2', height - margin.bottom)
     .attr('stroke', 'red')
     .attr('stroke-dasharray', '5,4')
     .attr('stroke-width', 1.5);

  // Horizontal line at 5 Earth radii boundary
  svg.append('line')
     .attr('x1', margin.left)  .attr('x2', xScale(10))
     .attr('y1', yScale(5))    .attr('y2', yScale(5))
     .attr('stroke', 'red')
     .attr('stroke-dasharray', '5,4')
     .attr('stroke-width', 1.5);

  svg.append('text')
     .attr('x', xScale(10) - 4)
     .attr('y', margin.top + 14)
     .attr('text-anchor', 'end')
     .style('font-size', '11px')
     .attr('fill', 'red')
     .text('"Hot Jupiter" zone →');

  // Legend (employed external and AI use)
  let legendX = width - margin.right - 130;
  let legendY = margin.top + 10;

  MAJOR_METHODS.forEach(function(method, i) {
    svg.append('circle')
       .attr('cx', legendX)
       .attr('cy', legendY + i * 20)
       .attr('r', 5)
       .attr('fill', COLOR[method]);

    svg.append('text')
       .attr('x', legendX + 12)
       .attr('y', legendY + i * 20 + 4)
       .text(method)
       .style('font-size', '11px');
  });


  // Interactive filter by discovery method feeature (used external d3 documentation to create)
  function updateChart(selectedMethod) {

    // Filter data based on dropdown selection
    let filtered;
    if (selectedMethod === 'All Methods') {
      // Draw transit dots first so others go on top
      filtered = data.slice().sort(function(a, b) {
        if (a.discoverymethod === 'Transit') return -1;
        if (b.discoverymethod === 'Transit') return 1;
        return 0;
      });
    } else {
      filtered = data.filter(d => d.discoverymethod === selectedMethod);
    }

    // Remove the old circles
    svg.selectAll('circle.datapoint').remove();

    // Redraw new circles 
    svg.selectAll('circle.datapoint')
       .data(filtered)
       .enter()
       .append('circle')
       .attr('class', 'datapoint')
       .attr('r', 4)
       .attr('cx', d => xScale(d.pl_orbper))
       .attr('cy', d => yScale(d.pl_rade))
       .attr('fill', d => COLOR[d.discoverymethod])
       .attr('opacity', 0.5);
  }

  // Dropdown 

  let options = ['All Methods'].concat(MAJOR_METHODS);

  d3.select('body')
    .insert('div', 'svg')   // place the div above the svg
    .style('margin-bottom', '8px')
    .append('select')
    .on('change', function() {
      updateChart(this.value);
    })
    .selectAll('option')
    .data(options)
    .enter()
    .append('option')
    .attr('value', d => d)
    .text(d => d);

  // When updated, draw with all methods first
  updateChart('All Methods');

});