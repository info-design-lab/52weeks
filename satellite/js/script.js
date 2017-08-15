// set the dimensions and margins of the graph
var margin = {top: 30, right: 20, bottom: 80, left: 50},
    width = $('#viz').width() - margin.left - margin.right,
    height = $('#viz').width()*0.6 - margin.top - margin.bottom;

var svg = d3.select('#viz').append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + + margin.top + margin.bottom)
    .append("g")
    .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")");

var legend_svg = d3.select('#legend').append('svg')
    .attr('width', $('#legend').width())
    .attr('height', 150)
    .append("g");

queue()
    .defer(d3.csv, 'data/data.csv')
    .await(make);

var satellite_tooltip = d3.select("#viz")
    .append("div")
    .attr('class', 'd3-tip')
    .style("position", "absolute")
    .style("z-index", "10")
    .style("visibility", "hidden")
    .style('background', 'white')
    .style('font-size', '15')
    .style('font-weight', 'light')
    .style("fill", '#808080')
    .html('');

// parse the date / time
function parseTime(s){
  var date = new Date(s);
  date = date.getFullYear() + '-' + date.getMonth() + '-'+ date.getDay();
  return d3.timeParse("%Y-%m-%d")(date);
}
//var parseTime = d3.timeParse("%d-%m-%y");

// set the ranges
var x = d3.scaleTime().range([0, width]);
var y = d3.scaleLinear().range([height, 0]);

// define the line
var valueline = d3.line()
    .x(function(d) { return x(d.date); })
    .y(function(d) { return y(d.close); });

var selected_value = 'Launch Mass(kg)'
var all_data, scatter, y_axis;

function make(error, data){
  if (error) throw error;

  all_data = data;
  // format the data
  data.forEach(function(d) {
      d['Launch Mass(kg)'] = +d['Launch Mass(kg)'];
      d['Onboard Power(W)'] = +d['Onboard Power(W)'];
      d['Periapsis(km)'] = +d['Periapsis(km)'];
      d['Apoapsis(km)'] = +d['Apoapsis(km)'];
      d['Period(min)'] = +d['Period(min)'];
      d['Inclination(degrees)'] = +d['Inclination(degrees)'];
      d['Longitude(E)'] = +d['Longitude(E)'];
      d['Eccentricity'] = +d['Eccentricity'];
      d['Launch Date'] = parseTime(d['Launch Date'])
  });

  // Scale the range of the data
  x.domain(d3.extent(data, function(d) { return d['Launch Date']; }));
  y.domain([0, d3.max(data, function(d) { return 0; })]);

  // Add the X Axis
  var x_axis = svg.append("g")
      .attr("transform", "translate(0," + height + ")")
      .style("font-size","15px")
      .attr('fill', 'red')
      .attr("class","axis")
      .call(d3.axisBottom(x));
  x_axis.selectAll('text').style('fill', 'white');
  x_axis.selectAll('line').style('stroke', 'white');
  x_axis.selectAll('path').style('stroke', '#545454');

  // Add the Y Axis
  y_axis = svg.append("g")
      .style("font-size","15px")
      .attr("class","axis")
      .call(d3.axisLeft(y));
  y_axis.selectAll('text').style('fill', 'white');
  y_axis.selectAll('line').style('stroke', 'white');
  y_axis.selectAll('path').style('stroke', '#545454');


  // Add axis Labels
  svg.append('text')
    .attr('x', width + margin.left - 100)
    .attr('y', height + margin.top + 30)
    .attr('fill', 'white')
    .text('Years');

    // Add axis Labels
  y_label = svg.append('text')
    .attr('x', -margin.left + 5)
    .attr('y', -15)
    .attr('fill', 'white')
    .text(selected_value);

  // Add the scatterplot
  scatter = svg.selectAll("circle")
      .data(data)
      .enter().append("circle")
      .attr('fill', 'white')
      .attr("r", function(d){
          return 0;
      })
      .attr('fill', function(d){
        return satellite_color(d['Name']);
      })
      .attr('opacity', 0.9)
      .attr("cx", function(d) { return x(d['Launch Date']); })
      .attr("cy", function(d) { return y(0); })
      .on('mouseover', function(d) {
          satellite_tooltip.style("visibility", "visible");
          satellite_tooltip.html('<p><b>' + d['Name'] + '</b><br> ' + 'Launched on: <b>' + d['Launch Date'].getDate() + '/' + d['Launch Date'].getMonth() + '/' + d['Launch Date'].getFullYear() + '</b><br>' + 'Discipline: <b>' + d['Discipline'] + '</b>  '+ '<br>Launch Vehicle: <b>' + d['Launch Vehicle'] + '</b>'+ '<br>Launch Site: <b>' + d['Launch Site'] + '</b></p>');
          d3.select(this).transition().duration(100).attr('r', 10);
          //Launch Vehicle,Launch Site,Discipline
      })
      .on("mousemove", function(d) {
          mouse = d3.mouse(this);
          return satellite_tooltip.style("top", (mouse[1] - 120) + "px").style("left", (mouse[0] - 75) + "px");
      })
      .on("mouseout", function(d) {
          d3.select(this).transition().duration(100).attr('r', 4);
          return satellite_tooltip.style("visibility", "hidden");
      });

  create_legend();
  animate_viz();
}

function updateviz(option){
  selected_value = option.value;
  y_label.text(selected_value);
  animate_viz();
}

function animate_viz(){
    if (selected_value == 'Longitude(E)'){
      y.domain(d3.extent(all_data, function(d) { return d[selected_value]; }));

    }
    else{
      y.domain([0, d3.max(all_data, function(d) { return d[selected_value]; })]);
    }
    y_axis.transition().duration(1000).call(d3.axisLeft(y));
    y_axis.selectAll('text').style('fill', 'white');
    y_axis.selectAll('line').style('stroke', 'white');
    y_axis.selectAll('path').style('stroke', '#545454');

    svg.selectAll('circle')
      .transition()
      .duration(1000)
      .attr("r", function(d){
        if (d[selected_value]){
          return 4;
        }
        return 0;
      })
      .attr("cx", function(d) { return x(d['Launch Date']); })
      .attr("cy", function(d) { return y(d[selected_value]); });
}

function create_legend(){
  var satellties = [
    'Bhaskara',
    'CartoSat',
    'GSAT',
    'INSAT',
    'INS',
    'IRNSS',
    'IRS',
    'RISAT',
    'ResourceSat',
    'Rohini',
    'SROSS',
    'Other'
  ]
  var satellite_color = ['#FFC0FF', '#C0FFFF', '#40FFC0', '#80FF40', '#C0C0FF', '#4080FF', '#C040FF', '#FFFF00', '#FF8000', '#FF4040', 'white', '#E0E0E0']
  var spacing = 15
  for(var i=0; i < satellties.length/2; i++){
    legend_svg.append('text')
      .attr('x', spacing + 3)
      .attr('y', spacing + spacing*i)
      .attr('fill', 'white')
      .style('font-size', '12px')
      .text(satellties[i]);
    legend_svg.append('rect')
      .attr('x', 0)
      .attr('y', 4 + spacing*i)
      .attr('width', spacing - 2)
      .attr('height', spacing - 2)
      .attr('fill', satellite_color[i])
  }
  for(var i=parseInt(satellties.length/2); i < satellties.length; i++){
    legend_svg.append('text')
      .attr('x', spacing + $('#legend').width()/2 + 3)
      .attr('y', spacing + spacing*i - spacing*(parseInt(satellties.length/2)))
      .attr('fill', 'white')
      .style('font-size', '12px')
      .text(satellties[i]);
    legend_svg.append('rect')
      .attr('x', 0 + $('#legend').width()/2)
      .attr('y', 4 + spacing*i - spacing*(parseInt(satellties.length/2)))
      .attr('width', spacing - 2)
      .attr('height', spacing - 2)
      .attr('fill', satellite_color[i])
  }
}

function satellite_color(name){
  // Bhaskara
  // CartoSat
  // GSAT
  // INSAT
  // INS
  // IRNSS
  // IRS
  // RISAT
  // ResourceSat
  // Rohini
  // SROSS
  if (name.includes('Bhaskara')){
    return '#FFC0FF'
  }
  else if (name.includes('CartoSat')){
    return '#C0FFFF'
  }
  else if (name.includes('GSAT')){
    return '#40FFC0'
  }
  else if (name.includes('ResourceSat')){
    return '#FF8000'
  }
  else if (name.includes('INSAT')){
    return '#80FF40'
  }
  else if (name.includes('INS')){
    return '#C0C0FF'
  }
  else if (name.includes('IRNSS')){
    return '#4080FF'
  }
  else if (name.includes('IRS')){
    return '#C040FF'
  }
  else if (name.includes('RISAT')){
    return '#FFFF00'
  }
  else if (name.includes('Rohini')){
    return '#FF4040'
  }
  else if (name.includes('SROSS')){
    return 'white'
  }
  return '#E0E0E0'
}
