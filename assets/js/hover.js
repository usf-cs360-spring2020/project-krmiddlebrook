
// source: http://bl.ocks.org/sjengle/f6f522f3969752b384cfec5449eacd98

// tailored for this example (assumes g#plot, d.id)
function setupTooltip(nodes) {
  nodes.on("mouseover.tooltip", function(d) {
    let tooltip = d3.select("text#tooltip");

    // initialize if missing
    if (tooltip.size() < 1) {
      tooltip = d3.select("g#plot").append("text").attr("id", "tooltip");
    }

    // calculate bounding box of plot WITHOUT tooltip
    tooltip.style("display", "none");
    updatePosition(d);

    let bbox = {
      plot: d3.select("g#plot").node().getBBox()
    }

    // restore tooltip display but keep it invisible
    tooltip.style("display", null);
    tooltip.style("visibility", "hidden");

    // now set tooltip text and attributes
    tooltip.text(d.id);
    tooltip.attr("text-anchor", "end");
    tooltip.attr("dx", -5);
    tooltip.attr("dy", -5);

    // calculate resulting bounding box of text
    bbox.text = tooltip.node().getBBox();

    // determine if need to show right of pointer
    if (bbox.text.x < bbox.plot.x) {
      tooltip.attr("text-anchor", "start");
      tooltip.attr("dx", 5);
    }

    // determine if need to show below pointer
    if (bbox.text.y < bbox.plot.y) {
      tooltip.attr("dy", bbox.text.height / 2);

      // also need to fix dx in this case
      // so it doesn't overlap the mouse pointer
      if (bbox.text.x < bbox.plot.x) {
        tooltip.attr("dx", 15);
      }
    }

    tooltip.style("visibility", "visible");
    d3.select(this).classed("selected", true);
  });

  nodes.on("mousemove.tooltip", updatePosition);

  nodes.on("mouseout.tooltip", function(d) {
    d3.select(this).classed("selected", false);
    d3.select("text#tooltip").style("visibility", "hidden");
  });
}

function updatePosition(d) {
  let coords = d3.mouse(d3.select("g#plot").node());
  d3.select("text#tooltip").attr("x", coords[0]);
  d3.select("text#tooltip").attr("y", coords[1]);
}

// not an efficient approach but a simple one
// can otherwise save the links associated with each node
function setupHighlight(nodes, links) {
  nodes.on("mouseover.brush", function(v) {
    // highlight all edges
    links.filter(function (e) {
        if (Array.isArray(e)) {
          // edge bundling example
          return e[0].id === v.id || e[e.length - 1].id === v.id;
        }

        return e.source.id === v.id || e.target.id === v.id;
      })
      .classed("selected", true)
      .raise();
  });

  nodes.on("mouseout.brush", function(v) {
    links.classed("selected", false);
  });
}
