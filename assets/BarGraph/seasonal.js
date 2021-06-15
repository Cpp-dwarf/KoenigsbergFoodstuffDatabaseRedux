var parseDate = d3.time.format("%Y").parse,
    formatYear = d3.format("02d"),
    formatDate = function(d) { return formatYear(d.getFullYear()); };

var timeline_margin = {top: 10, right: 20, bottom: 20, left: 60},
    timeline_width = 960 - timeline_margin.left - timeline_margin.right,
    timeline_height = 500 - timeline_margin.top - timeline_margin.bottom;

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

var timeline_color = d3.scale.category10();

var timeline_svg = d3.select("#timechart").append("svg")
    .attr("width", timeline_width + timeline_margin.left + timeline_margin.right)
    .attr("height", timeline_height + timeline_margin.top + timeline_margin.bottom)
  .append("g")
    .attr("transform", "translate(" + timeline_margin.left + "," + timeline_margin.top + ")");

d3.csv("/files/theme/BarGraph/data/season.csv", function(error, data) {

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

  group.filter(function(d, i) { return !i; }).append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + timeline_y0.rangeBand() + ")")
      .call(timeline_xAxis)
    .selectAll("text")
      .attr("y", 5)
      .attr("x", 7)
      .attr("dy", ".35em")
      .attr("transform", "rotate(90)")
      .style("text-anchor", "start");

  d3.selectAll("input").on("change", change);

  function change() {
    if (this.value === "multiples") transitionMultiples();
    else transitiontimeline_stacked();
  }

  function transitionMultiples() {
    var t = timeline_svg.transition().duration(750),
        g = t.selectAll(".group").attr("transform", function(d) { return "translate(0," + timeline_y0(d.key) + ")"; });
    g.selectAll("rect").attr("y", function(d) { return timeline_y1(d.value); });
    g.select(".group-label").attr("y", function(d) { return timeline_y1(d.values[0].value / 2); });
  }

  function transitiontimeline_stacked() {
    var t = timeline_svg.transition().duration(750),
        g = t.selectAll(".group").attr("transform", "translate(0," + timeline_y0(timeline_y0.domain()[0]) + ")");
    g.selectAll("rect").attr("y", function(d) { return timeline_y1(d.value + d.valueOffset); });
    g.select(".group-label").attr("y", function(d) { return timeline_y1(d.values[0].value / 2 + d.values[0].valueOffset); });
  }
});