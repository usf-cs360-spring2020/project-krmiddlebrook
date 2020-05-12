// global object to store graph data
let graph;

// svg objects
const margin = {
  left: 20,
  right: 10,
  top: 20,
  bottom: 10
}
let nodes, links;
let w, h;

const r = 2; // node radius

// calculate fixed radial amount
const radial = (Math.min(w, h) / 2) - (2 * r);

const scales = {
  // color: d3.scaleOrdinal(d3.schemeCategory20c).range(50),
  color: d3.scaleSequential(d3.interpolateRdYlBu),
  radius: d3.scaleSqrt().range([2, 12]),
  stroke: d3.scaleSqrt().range([1, 8])
};

const svg = d3.select('#genre_proto')
  .append('svg');

const g = {
  plot: svg.append('g').attr('id', 'plot')
};

//////////// FORCE SIMULATION ////////////
// values for all forces
const forceProperties = {
  center: {
    x: 0.5,
    y: 0.5
  },
  charge: {
    enabled: true,
    strength: -20,
    distanceMin: 1,
    distanceMax: 100
  },
  collide: {
    enabled: false,
    strength: .5,
    iterations: 1,
    radius: 5
  },
  forceX: {
    enabled: false,
    strength: .1,
    x: .5
  },
  forceY: {
    enabled: false,
    strength: .1,
    y: .5
  },
  link: {
    enabled: true,
    distance: 20,
    iterations: 1
  }
}
// force simulator object
const simulation = d3.forceSimulation();

// craft url where datafile is located
const file = 'top100-filtered-reduced.json';
const path = 'assets/data/genre_network/' + file;

// load data and initialize graph display
d3.json(path).then(initializeDisplay);

//////////// DISPLAY ////////////
// generate the svg objects and force simulation
function initializeDisplay(data) {
  // get svg size
  w = +svg.node().getBoundingClientRect().width;
  h = +svg.node().getBoundingClientRect().height;

  // save data globally for debugging
  graph = data;

  // shift plot so (0, 0) is in center
  g.plot.attr('transform', `translate(${w*0.5}, ${h*0.5})`);

  // place links underneath nodes
  g.links = g.plot.append('g').attr('id', 'links');
  g.nodes = g.plot.append('g').attr('id', 'nodes');

  // now we can safely sort the nodes without causing issues with links
  // try different sort orders
  graph.nodes.sort((a, b) => d3.ascending(a.katz_centrality, b.katz_centrality));

  // update scales
  let genres = graph.nodes.filter(d => d.type == 'genre');

  // scales.color.domain(d3.extent(genres, v => v.id));
  scales.color.domain([0, d3.max(genres, v => v.degree)]);


  // scales.color.domain(d3.extent(graph.nodes, v => v.degree));
  scales.radius.domain(d3.extent(graph.nodes, v => v.degree));
  // scales.stroke.domain(d3.extent(graph.links, e => e.value));


  // set up simulation forces with default values
  simulation.nodes(graph.nodes)
    .force('link', d3.forceLink(graph.links).id(d => d.id))
    .force('center', d3.forceCenter());

  simulation.force('forceX', d3.forceX()
    .strength(forceProperties.forceX.strength * forceProperties.forceX.enabled)
    .x(w * forceProperties.forceX.x));

  simulation.force('forceY', d3.forceY()
    .strength(forceProperties.forceY.strength * forceProperties.forceY.enabled)
    .y(h * forceProperties.forceY.y));

  // simulation.force('collide', d3.forceCollide());

  simulation
    .force('charge', d3.forceManyBodyReuse()
      .strength(forceProperties.charge.strength * forceProperties.charge.enabled)
      .distanceMin(forceProperties.charge.distanceMin)
      .distanceMax(forceProperties.charge.distanceMax));

  simulation.on('tick', ticked)


  console.log(file, 'graph loaded:', graph);

  // output node and link before and after layout
  // const last_node = graph.nodes[graph.nodes.length - 1];
  const last_node = graph.nodes[graph.nodes.length - 1];

  const last_link = graph.links[graph.links.length - 1];

  console.log('node (before):', last_node);
  console.log('node (after):', last_node);


  console.log('link (before):', last_link);
  console.log('link (after):', last_link);


  // draw links at initial positions
  links = g.links.selectAll('line.link')
    .data(graph.links)
    .enter()
    .append('line')
    .attr('class', 'link')
    .attr('x1', e => e.source.x)
    .attr('y1', e => e.source.y)
    .attr('x2', e => e.target.x)
    .attr('y2', e => e.target.y);
  // .style('stroke-width', e => scales.stroke(e.value))
  // .style('stroke', e => scales.color(d3.mean([e.source.katz_centrality, e.target.katz_centrality])));

  // draw nodes at initial positions
  nodes = g.nodes.selectAll('circle.node')
    .data(graph.nodes)
    .enter()
    .append('circle')
    .attr('class', 'node')
    .attr('r', v => scales.radius(v.degree))
    .attr('cx', v => v.x)
    .attr('cy', v => v.y)
    .attr('fill', v => (v.type === 'genre') ? scales.color(v.degree) : 'gray')
    .call(drag(simulation));

  // setup node tooltips
  setupTooltip(nodes);
  setupHighlight(nodes, links);

  // restart the layout now that everything is set
  simulation.restart();
}

// setup node dragging
// https://observablehq.com/@d3/disjoint-force-directed-graph
let drag = simulation => {

  function dragstarted(d) {
    // avoid restarting except on the first drag start event
    if (!d3.event.active) simulation.alphaTarget(0.3).restart();
    // fix this node position in the layout
    // https://github.com/d3/d3-force#simulation_nodes
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
    updatePosition(v);
  }

  function dragended(d) {
    // restore alphaTarget to normal value
    if (!d3.event.active) simulation.alphaTarget(0);
    // no longer fix the node position after drag ended
    // allows layout to calculate its position again
    d.fx = null;
    d.fy = null;
  }

  return d3.drag()
    .on("start", dragstarted)
    .on("drag", dragged)
    .on("end", dragended);
}

// update the display positions after each simulation tick
function ticked() {
  links
    .attr("x1", d => d.source.x)
    .attr("y1", d => d.source.y)
    .attr("x2", d => d.target.x)
    .attr("y2", d => d.target.y);

  nodes
    .attr("cx", d => d.x)
    .attr("cy", d => d.y);
}


// apply new force properties
// https://blockbuilder.org/steveharoz/8c3e2524079a8c440df60c1ab72b5d03
function updateForces() {
  // shift plot so (0, 0) is in center
  g.plot.attr('transform', `translate(${w*0.5}, ${h*0.5})`);

  // get each force by name and update the properties
  simulation.force("center")
    .x(0)
    .y(0);
  simulation.force("charge")
    .strength(forceProperties.charge.strength * forceProperties.charge.enabled)
    .distanceMin(forceProperties.charge.distanceMin)
    .distanceMax(forceProperties.charge.distanceMax);
  simulation.force("collide")
    .strength(forceProperties.collide.strength * forceProperties.collide.enabled)
    .radius(forceProperties.collide.radius)
    .iterations(forceProperties.collide.iterations);
  simulation.force("forceX")
    .strength(forceProperties.forceX.strength * forceProperties.forceX.enabled)
    .x(w * forceProperties.forceX.x);
  simulation.force("forceY")
    .strength(forceProperties.forceY.strength * forceProperties.forceY.enabled)
    .y(h * forceProperties.forceY.y);
  simulation.force("link").id(d => d.id)
    .distance(forceProperties.link.distance)
    .iterations(forceProperties.link.iterations)
    .links(forceProperties.link.enabled ? graph.links : []);

  // updates ignored until this is run
  // restarts the simulation (important if simulation has already slowed down)
  simulation.alpha(1).restart();
}

setTimeout(function() {simulation.stop(); }, 10000*10);

// update size-related forces
d3.select(window).on("resize", function() {
  w = +svg.node().getBoundingClientRect().width;
  h = +svg.node().getBoundingClientRect().height;
  updateForces();
});
