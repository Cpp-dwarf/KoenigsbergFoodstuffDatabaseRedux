queue()
  .defer(d3.csv, "/files/theme/altParallel/data/foods.joined.csv")
  .defer(d3.csv, "/files/theme/altParallel/data/visit_percentage.csv")
  .await(ready);

var width = document.body.clientWidth,
    height = 300;

// Global Variables
//-----------------------------------------------------
var m = [60, 0, 10, 0],
    w = width - m[1] - m[3],
    h = height - m[0] - m[2],
    dragging = {},
    line = d3.svg.line(),
    formatPercent = d3.format(".0%"),
    axis = d3.svg.axis().orient("left").ticks(1 + height / 50),
    data,
    foreground,
    background,
    highlighted,
    dimensions,
    legend,
    subcategories,
    render_speed = 50,
    brush_count = 0,
    excluded_groups = [],
    excluded_subcategories = [],
    rows,
    cells,
    shuffled_data,
    pattern;

// Scales
//-----------------------------------------------------
var xscale = d3.scale.ordinal().rangePoints([0, w], 1),
    x = d3.scale.ordinal().range([0, w]),
    y = {},
    yscale = {};

// Colors
//-----------------------------------------------------
var colors = {
  "Dairy": [27,158,119],
  "Grain": [217,95,2],
  "Meat": [117,112,179],
  "Flavorings": [231,41,138],
  "Organics": [102,166,30],
  "Fish": [230,171,2]
};

var subcolors = {
  "Acid": [231,41,138],
  "Cooking oil": [231,41,138],
  "Dairy": [27,158,119],
  "Eggs": [117,112,179],
  "Fish": [230,171,2],
  "Fruit": [102,166,30],
  "Grain": [217,95,2],
  "Honey": [231,41,138],
  "Meat": [117,112,179],
  "Nuts": [102,166,30],
  "Olives": [102,166,30],
  "Salt": [231,41,138],
  "Seafood": [117,112,179],
  "Seasoning": [102,166,30],
  "Seeds": [102,166,30],
  "Spice": [231,41,138],
  "Sugar": [231,41,138],
  "Vegetable": [102,166,30]
};

// Scale chart and canvas height
//-----------------------------------------------------
d3.select("#chart")
    .style("height", (h + m[0] + m[2]) + "px");

d3.selectAll("canvas")
    .attr("width", w)
    .attr("height", h)
    .style("padding", m.join("px ") + "px");

// Foreground canvas for primary view
//-----------------------------------------------------
foreground = document.getElementById('foreground').getContext('2d');
foreground.globalCompositeOperation = "destination-over";
foreground.strokeStyle = "rgba(0,100,160,0.5)";
foreground.lineWidth = 1.7;
foreground.fillText("Loading...",w/2,h/2);

// Highlight canvas for temporary interactions
//-----------------------------------------------------
highlighted = document.getElementById('highlight').getContext('2d');
highlighted.strokeStyle = "rgba(0,100,160,1)";
highlighted.lineWidth = 4;

// Background canvas
//-----------------------------------------------------
background = document.getElementById('background').getContext('2d');
background.strokeStyle = "rgba(0,100,160,0.1)";
background.lineWidth = 1.7;

// SVG for the chart and interactions
//-----------------------------------------------------
var svg = d3.select("#parallel_svg").append("svg")
    .attr("width", w + m[1] + m[3])
    .attr("height", h + m[0] + m[2])
  .append("g")
    .attr("transform", "translate(" + m[3] + "," + m[0] + ")");

// Main
//-----------------------------------------------------
function ready(error, zscore_data, raw_data) {
  if (error) { console.log(error); }

  // Convert quantitative scales to floats
  data = zscore_data.map(function(d) {
    for (var k in d) {
      if (!_.isNaN(zscore_data[0][k] - 0) && k != 'subcategory') {
        d[k] = parseFloat(d[k]) || 0;
      }
    };
    return d;
  });

  // Extract the list of numerical dimensions and create a scale for each
  xscale.domain(dimensions = d3.keys(data[0]).filter(function(k) {
    // Filter out all but the years (_.isNumber) and set the domain for y-axis
      return k != "translation" && k != "subcategory" && k != "category" && k != "macrocategory" && 
             k != "1640" && k != "1641" && k != "1642"  && k != "macrocategory"  && k != "1643"  && 
             k != "1644"  && k != "1645"  && k != "1646"  && k != "1647"  && k != "1648"  && k != "1649" && 
             k != "1650"  && k != "1651"  && k != "1652"  && k != "1653"  && k != "1654"  && k != "1655"  && 
             k != "1656"  && k != "1657"  && k != "1658"  && k != "1659"  && k != "1660"  && k != "1661"  && 
             k != "1662"  && k != "1663"  && k != "1664"  && k != "1665"  && k != "1666"  && k != "1667"  && 
             k != "1668"  && k != "1669"  && k != "1670"  && k != "1671"  && k != "1672"  && k != "1673"  && 
             k != "1674"  && k != "1675"  && k != "1676"  && k != "1677"  && k != "1678"  && k != "1679"  && 
             k != "1680"  && k != "1681"  && k != "1682"  && k != "1683"  && k != "1684"  && k != "1685"  && 
             k != "1686"  && k != "1687"  && k != "1688"  && k != "mean" && k != "max" && k != "min" && 
             (yscale[k] = d3.scale.linear()
    .domain([-2,4])
    .range([h, 0]));
  }).sort());

  // add a group element for each dimension
  var g = svg.selectAll(".dimension")
      .data(dimensions)
    .enter().append("g")
      .attr("class", "dimension")
      .attr("transform", function(d) { return "translate(" + xscale(d) + ")"; });

  // add axis and title
  g.append("g")
      .attr("class", "axis")
      .attr("transform", "translate(0,0)")
      .each(function(d) { d3.select(this).call(axis.scale(yscale[d])); })
    .append("text")
      .attr("text-anchor", "middle")
      .attr("y", function(d,i) { return i % 2 == 0 ? -14 : -30 } )
      .attr("x", 0)
      .attr("class", "label year")
      .text(function(d) { return d.slice(1,5)});

  // add a brush for each axis
  g.append("g")
    .attr("class", "brush")
    .each(function(d) { d3.select(this).call(yscale[d].brush = d3.svg.brush().y(yscale[d]).on("brush", brush)); })
  .selectAll("rect")
    .style("visibility", null)
    .attr("x", -23)
    .attr("width", 36)
    .append("title")
    .text("Click and drag up or down to brush along this axis");

  g.selectAll(".extent")
    .append("title")
    .text("Drag or resize this filter");

  legend = create_legend(colors,brush);
  subcategories = create_subcategories(subcolors, brush);

  data_table(zscore_data);
  brush();
};

// Legend function
//-----------------------------------------------------
function create_legend(colors,brush) {
  // create legend
  var legend_data = d3.select("#legend")
    .html("")
    .selectAll(".legend-row")
    .data( _.keys(colors).sort() )

  // filter by group
  var legend = legend_data
    .enter().append("div")
      .attr("title", "Hide group")
      .on("click", function(d) {
        // toggle food group
        if (_.contains(excluded_groups, d)) {
          d3.select(this).attr("title", "Hide group");
          excluded_groups = _.difference(excluded_groups,[d]);
          brush();
        } else {
          d3.select(this).attr("title", "Show group")
          excluded_groups.push(d);
          brush();
        }
      });

  legend
    .append("span")
    .style("background", function(d,i) { return color(d,0.85)})
    .attr("class", "color-bar");

  legend
    .append("span")
    .attr("class", "tally")
    .text(function(d,i) { return 0});

  legend
    .append("span")
    .text(function(d,i) { return " " + d});

  return legend;
}

// Table
//-----------------------------------------------------
function data_table(fdata) {
  var columns = ["legend","translation","category","macrocategory","unit of measure","min","max","mean",
                 "1641","1644","1645","1646","1648","1656","1657","1659","1662","1663","1664","1665","1668",
                 "1670","1671","1672","1673","1674","1675","1676","1677","1678","1679","1680","1681","1682",
                 "1683","1684","1685","1686","1687","1688"];

  var table = d3.select("#foods_table").append("table"),
      thead = table.append("thead"),
      tbody = table.append("tbody");

  thead.append("tr")
    .selectAll("th")
    .data(columns)
  .enter().append("th")
    .text(function(column) { return column; });

  rows = tbody.selectAll("tr")
    .data(fdata)
  .enter().append("tr")
    .attr("id", function(d) { return d.macrocategory; })
    .attr("class", "foodItem")
    .on("mouseover", highlight)
    .on("mouseout", unhighlight);

  rows
    .append("td")
    .style("background", function(d,i) { return color(d.macrocategory,0.85)})
    .attr("class", "color-box");

  cells = rows.selectAll("td")
    .data(function(row) {
        return columns.map(function(column) {
          return {column: column, value: row[column]};
        });
      })
  .enter().append("td")
    .html(function(d,i) { return d.value; });

}

// Subcategory legend function
//-----------------------------------------------------
function create_subcategories(subcolors,brush) {
  // create legend
  var categories_data = d3.select("#subcategories")
  .html("")
  .selectAll(".subcategory-row")
  .data( _.keys(subcolors).sort() )

  // filter by group
  var subcategorylegend = categories_data
  .enter().append("div")
    // .attr("title", "Hide group")
    // .on("click", function(d) {
    //   // toggle food group
    //   if (_.contains(excluded_subcategories, d)) {
    //     d3.select(this).attr("title", "Hide group")
    //     excluded_subcategories = _.difference(excluded_subcategories,[d]);
    //     brush();
    //   } else {
    //     d3.select(this).attr("title", "Show group")
    //     excluded_subcategories.push(d);
    //     brush();
    //   }
  // });

  subcategorylegend
    .append("span")
    .style("background", function(d,i) { return colorsub(d,0.85)});
    // .attr("class", "color-bar"); // turn this back on to turn on the barchart view

  subcategorylegend
    .append("span")
    .attr("class", "tally")
    .text(function(d,i) { return 0});

  subcategorylegend
    .append("span")
    .text(function(d,i) { return " " + d});

  return subcategorylegend;
}

// render polylines i to i+render_speed
function render_range(selection, i, max, opacity) {
  selection.slice(i,max).forEach(function(d) {
    path(d, foreground, color(d.macrocategory,opacity));
  });
};

// Adjusts rendering speed
function optimize(timer) {
  var delta = (new Date()).getTime() - timer;
  render_speed = Math.max(Math.ceil(render_speed * 30 / delta), 8);
  render_speed = Math.min(render_speed, 300);
  return (new Date()).getTime();
}

function highlight(d) {
  d3.select("#foreground").style("opacity", "0.25");
  path(d, highlighted, color(d.macrocategory,1)); // update this to read the right CSV file (foods.zscore)
}

function unhighlight() {
  d3.select("#foreground").style("opacity", null);
  highlighted.clearRect(0,0,w,h);
}

function path(d, ctx, color) {
  if (color) ctx.strokeStyle = color;
  ctx.beginPath();
  var x0 = xscale(0)-15,
      y0 = yscale[dimensions[0]](d[dimensions[0]]);   // left edge
  ctx.moveTo(x0,y0);
  dimensions.map(function(p,i) {
    var x = xscale(p),
        y = yscale[p](d[p]);
    var cp1x = x - 0.88*(x-x0);
    var cp1y = y0;
    var cp2x = x - 0.12*(x-x0);
    var cp2y = y;
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);
    x0 = x;
    y0 = y;
  });
  ctx.lineTo(x0+15, y0);                               // right edge
  ctx.stroke();
}

function color(d,a) {
  var c = colors[d];
  return ["rgba(",c[0],",",c[1],",",c[2],",",a,")"].join("");
}

function colorsub(d,a) {
  var c = subcolors[d];
  return ["rgba(",c[0],",",c[1],",",c[2],",",a,")"].join("");
}

// Brush, toggling the display of foreground lines
function brush() {
  var actives = dimensions.filter(function(p) { return !yscale[p].brush.empty(); }),
      extents = actives.map(function(p) { return yscale[p].brush.extent(); });

  // bold dimensions with label
  d3.selectAll('.label')
    .style("font-weight", function(dimension) {
      if (_.include(actives, dimension)) return "bold";
      return null;
  });

  // get lines within extents
  var selected = [];
  data
    .filter(function(d) {
      return !_.contains(excluded_groups, d.macrocategory);
    })
    .map(function(d) {
      return actives.every(function(p, dimension) {
        return extents[dimension][0] <= d[p] && d[p] <= extents[dimension][1];
      }) ? selected.push(d) : null;
    });

  // free text search
  var query = d3.select("#search")[0][0].value;
  if (query.length > 0) {
    selected = search(selected, query);
  }

  // total by food group
  var tallies = _(selected)
    .groupBy(function(d) { return d.macrocategory; })

  var subcategoryTallies = _(selected)
    .groupBy(function(d) { return d.category; })

  // include empty groups
  _(colors).each(function(v,k) { tallies[k] = tallies[k] || []; });
  _(subcolors).each(function(v,k) { subcategoryTallies[k] = subcategoryTallies[k] || []; });

  legend
    .attr("class", function(d) {
      return (tallies[d].length > 0)
           ? "legend-row"
           : "legend-row off";
    });

  legend.selectAll(".color-bar")
    .style("width", "8px"); //function(d) {
      // return Math.ceil(400 * tallies[d].length / data.length) + "px"
    // });

  legend.selectAll(".tally")
    .text(function(d,i) { return tallies[d].length });

  subcategories
    .attr("class", function(d) {
      return (subcategoryTallies[d].length > 0)
      ? "sublegend-row"
      : "sublegend-row off";
    });

  subcategories.selectAll(".color-bar")
    .style("width", "8px"); //function(d) {
      // return Math.ceil(600*subcategoryTallies[d].length/data.length) + "px"
    // });

  subcategories.selectAll(".tally")
    .text(function(d,i) { return subcategoryTallies[d].length });

  // render selected lines
  paths(selected, foreground, brush_count, true);

  // update table on brush
  rows
    .style("display", function(d) {
      return actives.every(function(p ,i) {
        return extents[i][0] <= d[p] && d[p] <= extents[i][1];
      }) ? null : "none";
    });

  for (var i = 0; i <= excluded_groups.length; i++) {
    d3.selectAll("tr#" + excluded_groups[i]).style("display", "none");
  }

}

// render polylines on canvas
function paths(selected, ctx, count) {
  var n = selected.length,
      i = 0,
      opacity = d3.min([2/Math.pow(n,0.3),1]),
      timer = (new Date()).getTime();

  shuffled_data = _.shuffle(selected);

  ctx.clearRect(0,0,w+1,h+1);

  // render all lines until finished or a new brush event
  function animloop(){
    if (i >= n || count < brush_count) return true;
    var max = d3.min([i+render_speed, n]);
    render_range(shuffled_data, i, max, opacity);
    // render_stats(max,n,render_speed);
    i = max;
    timer = optimize(timer);  // adjust render_speed
  };

  d3.timer(animloop);
}

// rescale to new dataset domain
function rescale() {
  // reset yscales, preserving inverted state
  dimensions.forEach(function(d,i) {
    if (yscale[d].inverted) {
      yscale[d] = d3.scale.linear()
          .domain(d3.extent(data, function(p) { return +p[d]; }))
          .range([0, h]);
      yscale[d].inverted = true;
    } else {
      yscale[d] = d3.scale.linear()
          .domain(d3.extent(data, function(p) { return +p[d]; }))
          .range([h, 0]);
    }
  });

  // update_ticks();

  // Render selected data
  paths(data, foreground, brush_count);
}

// grab polylines in extents
function actives() {
  var actives = dimensions.filter(function(p) { return !yscale[p].brush.empty(); }),
      extents = actives.map(function(p) { return yscale[p].brush.extent(); });

  // filter extents
  var selected = [];
  data
    .filter(function(d) {
      return !_.contains(excluded_groups, d.macrocategory);
    })
    .filter(function(d) {
      return !_.contains(excluded_subcategories, d.category);
    })
    .map(function(d) {
    return actives.every(function(p, i) {
      return extents[i][0] <= d[p] && d[p] <= extents[i][1];
    }) ? selected.push(d) : null;
  });

  // free text search
  var query = d3.select("#search")[0][0].value;
  if (query > 0) {
    selected = search(selected, query);
  }

  return selected;
}

d3.select("#search").on("keyup", brush);

function search(selection,str) {
  pattern = new RegExp(str,"i");
  return _(selection).filter(function(d) { return pattern.exec(d.translation); });
}

d3.select("#unselect-all").on("click", unselectAll);
d3.select("#select-all").on("click", selectAll);

function unselectAll() {
  excluded_groups = _.keys(colors);
  d3.selectAll("#select-all").attr("disabled", null);
  d3.selectAll("#unselect-all").attr("disabled", "disabled");
  brush();
}

function selectAll() {
  excluded_groups = [];
  d3.selectAll("#select-all").attr("disabled", "disabled");
  d3.selectAll("#unselect-all").attr("disabled", null);
  brush();
}

// Timeline
//-----------------------------------------------------
 var time_chart_height = 70;

 var time_scale_x = d3.scale.ordinal()
     .rangeRoundBands([0, width], .1);

 var time_scale_y = d3.scale.linear()
     .range([time_chart_height, 0]);

 var time_x_axis = d3.svg.axis()
     .scale(time_scale_x)
     .orient("bottom");

 var time_y_axis = d3.svg.axis()
     .scale(time_scale_y)
     .orient("left")
     .ticks(10, "%");

 var chart_svg = d3.select("#timeline").append("svg")
     .attr("width", width)
     .attr("height", 170)
   .append("g")
     .attr("transform", "translate(" + m[1] + "," + m[0] + ")");

d3.csv("/files/theme/altParallel/data/visit_percentage.csv", type, function(error, timechart) {
  time_scale_x.domain(timechart.map(function(d) { return d.year; }));
  time_scale_y.domain([0, d3.max(timechart, function(d) { return d.perc_year; })]);

  chart_svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + time_chart_height + ")")
      .call(time_x_axis)
    .selectAll("text")
      .attr("y", 0)
      .attr("x", 9)
      .attr("dy", ".35em")
      .attr("transform", "rotate(90)")
      .style("text-anchor", "start");

  chart_svg.append("g")
    .attr("class", "y axis")
  .call(time_y_axis)
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 6)
    .attr("dy", ".71em");
    // .style("text-anchor", "end")
    // .text("% of time at court");

  chart_svg.selectAll(".bar")
    .data(timechart)
  .enter().append("rect")
    .attr("class", "bar")
    .attr("x", function(d) { return time_scale_x(d.year); })
    .attr("width", time_scale_x.rangeBand())
    .attr("y", function(d) { return time_scale_y(d.perc_year); })
    .attr("height", function(d) { return time_chart_height - time_scale_y(d.perc_year); })
    .style("fill", "steelblue");
});

function type(d) {
  d.perc_year = +d.perc_year;
  return d;
}
