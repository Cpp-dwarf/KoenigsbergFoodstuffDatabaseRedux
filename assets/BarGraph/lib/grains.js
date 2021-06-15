queue()
  .defer(d3.csv, "/files/theme/BarGraph/data/grains_transformed.csv")
  .defer(d3.csv, "/files/theme/BarGraph/data/null-data.csv")
  .await(ready);

var legendWidth = 120;

var margin = {top: 20, right: 20, bottom: 30, left: 60},
    width = 860 - margin.left - margin.right+legendWidth,
    height = 500 - margin.top - margin.bottom,
    time_chart_height = 150 - margin.top - margin.bottom,
    parseDate = d3.time.format("%Y").parse;

var xscale = d3.scale.ordinal()
  .rangeRoundBands([0, width], 0.1);

var yscale = d3.scale.linear()
  .rangeRound([height, 0]);

var colors = d3.scale.ordinal()
    .range(["#1f77b4","#aec7e8","#ff7f0e","#ffbb78","#2ca02c","#98df8a","#d62728","#ff9896","#9467bd","#c5b0d5","#8c564b","#c49c94","#e377c2","#f7b6d2","#7f7f7f","#c7c7c7","#bcbd22","#dbdb8d","#17becf","#9edae5","#393b79","#5254a3","#6b6ecf","#9c9ede","#637939","#8ca252","#b5cf6b","#cedb9c","#8c6d31","#bd9e39","#e7ba52","#e7cb94","#843c39","#ad494a","#d66z16b","#e7969c","#7b4173","#a55194","#ce6dbd","#de9ed6"]);

var xaxis = d3.svg.axis()
  .scale(xscale)
  .orient("bottom");

var yaxis = d3.svg.axis()
  .scale(yscale)
  .orient("left")
  .tickFormat(d3.format(".0%"));

var svg = d3.select("#mainchart").append("svg")
  .attr("width", width + margin.left + margin.right + legendWidth)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Timeline

var formatYear = d3.format("02d"),
    formatDate = function(d) { return formatYear(d.getFullYear()); };

var timeline_margin = {top: 10, right: 20, bottom: 20, left: 60},
    timeline_width = 980 - timeline_margin.left - timeline_margin.right,
    timeline_height = 200 - timeline_margin.top - timeline_margin.bottom;

var timeline_y0 = d3.scale.ordinal()
    .rangeRoundBands([timeline_height, 0], .2);

var timeline_y1 = d3.scale.linear();

var timeline_x = d3.scale.ordinal()
    .rangeRoundBands([0, timeline_width], .1, 0);

var timeline_xAxis = d3.svg.axis()
    .scale(timeline_x)
    .orient("bottom")
    .tickFormat(formatDate);

var timeline_nest = d3.nest()
    .key(function(d) { return d.group; });

var timeline_stack = d3.layout.stack()
    .values(function(d) { return d.values; })
    .x(function(d) { return d.date; })
    .y(function(d) { return d.value; })
    .out(function(d, timeline_y0) { d.valueOffset = timeline_y0; });

var timeline_color = d3.scale.category20();

var timeline_svg = d3.select("#timechart").append("svg")
    .attr("width", timeline_width + timeline_margin.left + timeline_margin.right)
    .attr("height", timeline_height + timeline_margin.top + timeline_margin.bottom)
  .append("g")
    .attr("transform", "translate(" + timeline_margin.left + "," + timeline_margin.top + ")");

var loadingText = svg.append('text')
        .attr('x', width / 2)
        .attr('y', height / 2)
        .attr('text-anchor', 'middle')
        .attr('font-size', 32)
        .attr("class","loading-text")
        .text('Loading...');

var loadingTextTimeline = timeline_svg.append('text')
        .attr('x', timeline_width / 2)
        .attr('y', timeline_height / 2)
        .attr('text-anchor', 'middle')
        .attr('font-size', 24)
        .attr("class","loading-text")
        .text('Loading...');

// Tooltip
var tooltip = d3.select("body").append("div")
  .classed("tooltip", true)
  .classed("hidden", true);

// load data
// d3.csv(csvpath, function(error, data) {
function ready(error, data, empty) {

  loadingText.transition().remove();

  // Create array of column headers and map colors to them
  colors.domain(d3.keys(data[0]).filter(function(key) { return key !== "date"; }));

  // Add a `foodTypes` parameter to each row as a percentage
  data.forEach(function(pd) {
    var y0 = 0;
    // pd.foodTypes will be an array of objects with the column header
    // and range of values
    pd.foodTypes = colors.domain().map(function(foodKeyItem) {
      var foodKeyItemobj = {name: foodKeyItem, y0: y0, yp0: y0};
      y0 += +pd[foodKeyItem];
      foodKeyItemobj.y1 = y0;
      foodKeyItemobj.yp1 = y0;
      return foodKeyItemobj;
    });

    // y0 is the sum of all the values in the row for a food foodCategory
    // Convert the range values to percentages
    pd.foodTypes.forEach(function(d) { d.yp0 /= y0; d.yp1 /= y0; });
    // Save the total
    pd.totalfoodTypes = pd.foodTypes[pd.foodTypes.length - 1].y1;
  });
  console.log(data);

  xscale.domain(data.map(function(d) { return d.date; }));

  // x axis
  svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xaxis)
    .selectAll("text")
    .attr("y", 5)
    .attr("x", 7)
    .attr("dy", ".35em")
    .attr("transform", "rotate(65)")
    .style("text-anchor", "start");

  // y axis
  svg.append("g")
    .attr("class", "y axis")
    .call(yaxis)
  .append("text")
    .attr("transform","rotate(-90)")
    .attr("y", 6)
    .attr("dy", ".71em")
    .style("text-anchor", "end")
    .text("Pfund (lb)");

  var foodCategory = svg.selectAll(".foodCategory")
    .data(data)
  .enter().append("g")
    .attr("class", "foodCategory")
    .attr("transform", function(d) { return "translate(" + xscale(d.date) + ",0)"; });

  // Draw rects within groups
  foodCategory.selectAll("rect")
    .data(function(d) { return d.foodTypes; })
  .enter().append("rect")
    .attr("class", function(d) { return d.name.split(' ').join('_'); })
    .attr("id", "food-rect")
    .attr("width", xscale.rangeBand())
    .attr("y", function(d) { return yscale(d.yp1); })
    .attr("height", function(d) { return yscale(d.yp0) - yscale(d.yp1); })
    .style("fill", function(d) { return colors(d.name); });

  // Missing data
  var missingFoods = svg.selectAll(".null-data")
    .data(empty.filter(function(d) { return d.missing === "TRUE"; }))
  .enter().append("g")
    .attr("class","null-data")
    .attr("transform", function(d) { return 'translate(' + xscale(d.date) + ",0)"; });

  // Render missing data
  missingFoods.selectAll("rect")
    .data(data.filter(function(d) { return d.totalfoodTypes === 0; }))
  .enter().append("rect")
    .attr("width", xscale.rangeBand())
    .attr("height", "90%")
    .attr("y", 0);

    // Mouseover events
  foodCategory.selectAll("rect")
    .on("mousemove", function(d, i) {
      var mouse = d3.mouse(d3.select("body").node());
      tooltip
        .classed("hidden", false)
        .attr("style", "left:" + (mouse[0] + 20) + "px; top:" + (mouse[1] - 50) + "px")
        .html(tooltipText(d));
    })
    .on("mouseover", function(d) {
      selectBars(d.name);
    })
    .on("mouseout", function(d, i) {
      tooltip.classed("hidden", true);
      tooltip.attr("stroke", "none");
      selectBars(null);
    });

  // Legend
  //-----------------------------------------------------
  var legend_data = d3.select("#legend")
    .html("")
    .selectAll(".legend-row")
    .data(colors.domain().slice());

  var legend = legend_data
    .enter().append("div")
      .attr("id", function(d) { return d.split(' ').join('_'); });

  legend.append("span")
    .style("background", function(d) { return colors(d); })
    .attr("class","color-bar");

    legend
      .attr("class", "legend-row");

  legend
    .append("span")
    .text(function(d,i) { return " " + d; });

  legend
    .on("mouseover", function(d) {
      selectBars(d);
    })
    .on("mouseout", function(d, i) {
      selectBars(null);
    });

  // Animation and selection
  d3.selectAll("input").on("change", fieldSelected);

  function fieldSelected() {
    field = fieldSelector.node().value;
    if (this.value === "barchartNormalized") {
      transitionPercent();
    } else if (this.value === "barchartAmount") {
      transitionCount();
    } else if (this.value === "linechartAmount") {
      transitionLine();
    }
  }

  // Transition to 'normalized'
  function transitionPercent() {
    d3.select("svg").style("display", "block");
    d3.select("#timechart").style("display","block");
    d3.selectAll(".foodCategory").style("display", "block");
    d3.selectAll(".foodLine").style("display","none");
    d3.selectAll(".tabulate").style("display","none");

    // reset the yscale domain to default
    yscale.domain([0, 1]);

    // create the transition
    var trans = svg.transition().duration(250);

    // transition the bars
    var categories = trans.selectAll(".foodCategory");
    categories.selectAll("rect")
      .attr("y", function(d) { return yscale(d.yp1); })
      .attr("height", function(d) { return yscale(d.yp0) - yscale(d.yp1); });

    // change the y-axis
    // set the y axis tick format
    yaxis.tickFormat(d3.format(".0%"));
    svg.selectAll(".y.axis").call(yaxis);

  }

  // Transition to 'count'
  function transitionCount() {
    d3.select("svg").style("display", "block");
    d3.select("#timechart").style("display","block");
    d3.selectAll(".foodCategory").style("display","block");
    d3.selectAll(".foodLine").style("display","none");
    d3.selectAll(".tabulate").style("display","none");

    // set the yscale domain
    yscale.domain([0, d3.max(data, function(d) { return d.totalfoodTypes; })]);

    // create the transition
    var transone = svg.transition()
      .duration(250);

    // transition the bars (step one)
    var categoriesone = transone.selectAll(".foodCategory");
    categoriesone.selectAll("rect")
      .attr("y", function(d) { return this.getBBox().y + this.getBBox().height - (yscale(d.y0) - yscale(d.y1)) })
      .attr("height", function(d) { return yscale(d.y0) - yscale(d.y1); });

    // transition the bars (step two)
    var transtwo = transone.transition()
      .delay(500)
      .duration(350)
      .ease("bounce");
    var categoriestwo = transtwo.selectAll(".foodCategory");
    categoriestwo.selectAll("rect")
      .attr("y", function(d) { return yscale(d.y1); });

    // change the y-axis
    // set the y axis tick format
    yaxis.tickFormat(d3.format(".2s"));
    svg.selectAll(".y.axis").call(yaxis);
  }

  function transitionLine() {
    d3.select("svg").style("display", "block");
    d3.select("#timechart").style("display","block");
    d3.selectAll(".tabulate").style("display","none");
    d3.selectAll(".foodCategory").style("display","none");
    d3.selectAll(".foodLine").style("display","block");

    d3.csv(csvpath, function(error, data) {
      colors.domain(d3.keys(data[0]).filter(function(key) { return key !== "date"; }));

      data.forEach(function(d) {
        d.date = d.date;
      });

      var foods = colors.domain().map(function(name) {
        return {
          name: name,
          values: data.map(function(d) {
            return {date: d.date, amount: +d[name]};
          })
        };
      });

      xscale.domain(data.map(function(d) { return d.date; }));

      yscale.domain([
        d3.min(foods, function(c) { return d3.min(c.values, function(v) { return v.amount; }); }),
        d3.max(foods, function(c) { return d3.max(c.values, function(v) { return v.amount; }); })
      ]);

      var line = d3.svg.line()
          .interpolate("linear")
          .x(function(d) { return xscale(d.date); })
          .y(function(d) { return yscale(d.amount); });

      var fooditem = svg.selectAll(".foodLine")
          .data(foods)
        .enter().append("g")
          .attr("class", "foodLine");

      fooditem.append("path")
          .attr("class", "line")
          .attr("d", function(d) { return line(d.values); })
          .style("stroke", function(d) { return colors(d.name); });

      fooditem.append("text")
          .datum(function(d) { return {name: d.name, value: d.values[d.values.length - 1]}; })
          .attr("transform", function(d) { return "translate(" + xscale(d.value.date) + "," + yscale(d.value.amount) + ")"; })
          .attr("x", 3)
          .attr("dy", ".35em");

      // change the y-axis
      // set the y axis tick format
      yaxis.tickFormat(d3.format(".2s"));
      svg.selectAll(".y.axis").call(yaxis);
    });
  }

  var foodMenu = {
    "barchartNormalized": {
      "field": "barchartNormalized",
      "label": "Barchart (Normalized)"
    },
    "barchartAmount": {
      "field": "barchartAmount",
      "label": "Barchart (Count)"
    },

  };

  // Selector fields
  var fieldSelector = d3.select("#field-selector")
    .on("change", fieldSelected);

  for (var key in foodMenu) {
    fieldSelector.append("option")
    .attr("value", key)
    .text(foodMenu[key].label);
  }

}

function selectBars(type) {
  if (type == null) d3.selectAll("#food-rect").style("opacity","1.0").style("stroke","none");
  else d3.selectAll("#food-rect" + "." + type.split(' ').join('_'))
    .style("stroke", (type.split(' ').join('_') !== type.split(' ').join('_')) ? "none" : "red")
    .style("stroke-width", (type.split(' ').join('_') !== type.split(' ').join('_')) ? "none" : "3");
}

function tooltipText(d) {
 return "<h5>" + d.name + "</h5>" +
   "<table>" +
   "<tr>" +
   "<td><strong>Count</strong>: " + (d.y1 - d.y0) + "</td>" +
   "</tr>"+
   "<tr>" +
   "<td><strong>Proportion</strong>: " + d3.format("%")(d.yp1 - d.yp0) + "</td>" +
   "</tr>" +
   "</table>";
}

function tooltipTimeline(d) {
  return "<h5>" + d.group + "</h5>" +
  "<table>" +
  "<tr>" +
  "<td><strong>Percent of Year</strong>: " + d3.format("%")(d.value) + "</td>" +
  "</tr>" +
  "</table>";
}


// title case helper
function toTitleCase(str) {
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

// Timeline chart
d3.csv("/files/theme/BarGraph/data/season.csv", function(error, data) {
  loadingTextTimeline.transition()
        .remove();

  data.forEach(function(d) {
    d.date = parseDate(d.date);
    d.value = +d.value;
  });

  var dataByGroup = timeline_nest.entries(data);

  timeline_stack(dataByGroup);
  timeline_x.domain(dataByGroup[0].values.map(function(d) { return d.date; }));
  timeline_y0.domain(dataByGroup.map(function(d) { return d.key; }));
  timeline_y1.domain([0, d3.max(data, function(d) { return d.value; })]).range([timeline_y0.rangeBand(), 0]);

  var group = timeline_svg.selectAll(".group")
      .data(dataByGroup)
    .enter().append("g")
      .attr("class", "group")
      .attr("transform", function(d) { return "translate(0," + timeline_y0(d.key) + ")"; });

  group.append("text")
      .attr("class", "group-label")
      .attr("x", -6)
      .attr("y", function(d) { return timeline_y1(d.values[0].value / 2); })
      .attr("dy", ".35em")
      .text(function(d) { return d.key; });

  group.selectAll("rect")
      .data(function(d) { return d.values; })
    .enter().append("rect")
      .style("fill", function(d) { return timeline_color(d.group); })
      .attr("x", function(d) { return timeline_x(d.date); })
      .attr("y", function(d) { return timeline_y1(d.value); })
      .attr("width", timeline_x.rangeBand())
      .attr("height", function(d) { return timeline_y0.rangeBand() - timeline_y1(d.value); });

  group.selectAll("rect")
    .on("mousemove", function(d, i) {
      var mouse = d3.mouse(d3.select("body").node());
      tooltip
        .classed("hidden", false)
        .attr("style", "left:" + (mouse[0] + 20) + "px; top:" + (mouse[1] - 50) + "px")
        .html(tooltipTimeline(d));
    })
    .on("mouseout", function(d, i) {
      tooltip.classed("hidden", true);
      tooltip.attr("stroke", "none");
    });

  group.filter(function(d, i) { return !i; }).append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + timeline_y0.rangeBand() + ")")
      .call(timeline_xAxis)
    .selectAll("text")
      .attr("y", 5)
      .attr("x", 7)
      .attr("dy", ".35em")
      .attr("transform", "rotate(65)")
      .style("text-anchor", "start");

});