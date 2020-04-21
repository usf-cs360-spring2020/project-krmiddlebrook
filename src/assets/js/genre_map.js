let graph = null;

const margin = {left: 20, right: 10, top: 20, bottom: 10}
let w = 960 - margin.left - margin.right; // svg width
let h = 600 - margin.top - margin.bottom; // svg height

const r = 2;   // node radius


// calculate fixed radial amount
const radial = (Math.min(w, h) / 2) - (2 * r);

const scales = {
  color: d3.scaleSequential(d3.interpolateYlGnBu),
  radius: d3.scaleSqrt().range([2, 12]),
  stroke: d3.scaleSqrt().range([1, 8])
};

const svg = d3.select('#genre_proto')
  .append('svg')
  // .attr('width', w)
  // .attr('height', h)
  .attr('width',  '100%')
  .attr('height', '100%')
  .style('min-width', `${(w + margin.left + margin.right ) / 2 + (w + margin.left + margin.right ) / 4}px`)
  .style('min-height', `${(w + margin.left + margin.right )}px`)
  .attr("preserveAspectRatio", "xMinYMin meet");

w = +svg.node().getBoundingClientRect().width,
h = +svg.node().getBoundingClientRect().height;


const g = {
  plot: svg.append('g').attr('id', 'plot')
};

// shift plot so (0, 0) is in center
g.plot.attr('transform', `translate(${margin.left}, ${margin.top})`);

// place links underneath nodes
g.links = g.plot.append('g').attr('id', 'links');
g.nodes = g.plot.append('g').attr('id', 'nodes');

// craft url where datafile is located
const file = 'top100-filtered-reduced.json';
const path = 'assets/data/genre_network/'+file;


d3.json(path).then(callback);

function callback(data) {
  // save data globally for debugging
  graph = data;

  // setup layout with default values
  const layout = d3.forceSimulation(graph.nodes)
    .force('link', d3.forceLink().id(d => d.id))
    .force('center', d3.forceCenter(w / 2,  h / 2))
    .force('forceX', d3.forceX())
    .force('forceY', d3.forceY())
    .force('collide', d3.forceCollide())
    .force('charge', d3.forceManyBody());

  // stop layout until we are ready
  layout.stop();

  // console.log(file, 'graph loaded (before):', graph);

  console.log('graph loaded (after):', graph);

  // now we can safely sort the nodes without causing issues with links
  // try different sort orders
  graph.nodes.sort((a, b) => d3.ascending(a.katz_centrality, b.katz_centrality));

  // update scalese
  scales.color.domain(d3.extent(graph.nodes, v => v.degree));
  scales.radius.domain(d3.extent(graph.nodes, v => v.degree));
  // scales.stroke.domain(d3.extent(graph.links, e => e.value));

  // output node and link before and after layout
  // const last_node = graph.nodes[graph.nodes.length - 1];
  const last_node = graph.nodes[graph.nodes.length - 10];

  const last_link = graph.links[graph.links.length - 10];

  console.log('node (before):', last_node);
  console.log('node (after):', last_node);


  console.log('link (before):', last_link);
  console.log('link (after):', last_link);

  // draw nodes at initial positions
  const nodes = g.nodes.selectAll('circle.node')
    .data(graph.nodes)
    .enter()
    .append('circle')
    .attr('class', 'node')
    .attr('r',  v => scales.radius(v.degree))
    .attr('cx', v => v.x)
    .attr('cy', v => v.y)
    .style('fill', v => scales.color(v.degree));

  // draw links at initial positions
  const links = g.links.selectAll('line.link')
    .data(graph.links)
    .enter()
    .append('line')
    .attr('class', 'link')
    .attr('x1', e => e.source.x)
    .attr('y1', e => e.source.y)
    .attr('x2', e => e.target.x)
    .attr('y2', e => e.target.y)
    // .style('stroke-width', e => scales.stroke(e.value))
    // .style('stroke', e => scales.color(d3.mean([e.source.katz_centrality, e.target.katz_centrality])));

  // now, lets setup different force-directed layout parameters
  layout.force("link").links(graph.links);
  // layout.force('link').strength(0.2).distance(function(e) {
  //   return 1.5 * (scales.radius(e.source.degree) + scales.radius(e.target.degree));
  // });
  // layout.force('center').x(w / 2).y(h / 2);
  // layout.force('collide')
  //   .strength(-2)
  //   .radius(v => scales.radius(v.degree) + 2);
  layout.force('charge').strength(-5);

  // updates node and link positions every tick
  layout.on('tick', function(v) {
    nodes.attr('cx', v => v.x);
    nodes.attr('cy', v => v.y);

    links.attr('x1', e => e.source.x);
    links.attr('y1', e => e.source.y);
    links.attr('x2', e => e.target.x);
    links.attr('y2', e => e.target.y);
  });

  // setup node dragging
  // https://github.com/d3/d3-drag
  const drag = d3.drag()
    .on('start', function(v) {
      // avoid restarting except on the first drag start event
      if (!d3.event.active) layout.alphaTarget(0.3).restart();

      // fix this node position in the layout
      // https://github.com/d3/d3-force#simulation_nodes
      v.fx = v.x;
      v.fy = v.y;
    })
    .on('drag', function(v) {
      v.fx = d3.event.x;
      v.fy = d3.event.y;

      updatePosition(v);
    })
    .on('end', function(v) {
      // restore alphaTarget to normal value
      if (!d3.event.active) layout.alphaTarget(0);

      // no longer fix the node position after drag ended
      // allows layout to calculate its position again
      v.fx = null;
      v.fy = null;
    });

  nodes.call(drag);

  // setup node tooltips
  setupTooltip(nodes);
  setupHighlight(nodes, links);

  // restart the layout now that everything is set
  layout.restart();
}
