// source http://bl.ocks.org/sjengle/f6f522f3969752b384cfec5449eacd98
function toCartesian(radial, theta) {
  var x = radial * Math.cos(theta);
  var y = radial * Math.sin(theta);
  return {"x": x, "y": y};
}

// source: http://bl.ocks.org/sjengle/f6f522f3969752b384cfec5449eacd98
function distance(source, target) {
  // sqrt( (x2 - x1)^2 + (y2 - y1)^2 )
  var dx2 = Math.pow(target.x - source.x, 2);
  var dy2 = Math.pow(target.y - source.y, 2);

  return Math.sqrt(dx2 + dy2);
}
