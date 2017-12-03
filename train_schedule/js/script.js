queue()
    .defer(d3.json, 'data/data.json')
    .await(make_chart);

var tooltip = d3.select("body")
    .append("div")
    .attr('class', 'd3-tip')
    .style("position", "absolute")
    .style("z-index", "10")
    .style("visibility", "hidden")
    .style('background', 'white')
    .style('font-size', '15')
    .style('font-weight', 'light')
    .style("fill", '#808080')
    .style("border-radius", '3px')
    .style("border-style", 'solid')
    .style("border-width", '2px')
    .style("border-color", '#1a1a1a')
    .style("width", '250px')
    .style("opacity", 0.8)
    .attr('id', 'tooltip')
    .html('');

function make_chart(error, data){
    var departure = 'MUMBAI CST';
    var arrival = 'HOWRAH JN';
    var time_format = d3.timeParse("%H:%M:%S");
    for(var key in data){
        for(var station in data[key]){
          data[key][station]['Departure time'] = data[key][station]['Departure time'].replace("'", "");
          data[key][station]['Departure time'] = data[key][station]['Departure time'].replace("'", "");
          data[key][station]['Departure time'] = time_format(data[key][station]['Departure time']);
          data[key][station]['Distance'] = parseFloat(data[key][station]['Distance']);
        }
    }
    var margin = {top: 50, right: 100, bottom: 50, left: 120}
    var width = $('#chart').width();
    var chart_width = width - (margin.left + margin.right);
    var chart_height = chart_width - (margin.top + margin.bottom);
    var svg = d3.select('#chart').append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', chart_height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
              "translate(" + margin.left + "," + margin.top + ")");
    var x = d3.scaleTime().range([0, chart_width]);
    x.domain([time_format('0:0:0'), time_format('24:0:0')]);
    var y = d3.scaleLinear().range([0, chart_height]);
    var color = d3.scaleLinear().domain([0, 12])
      .interpolate(d3.interpolateHcl)
      .range([d3.rgb("#180c2f"), d3.rgb('#f8ed62')]);
    svg.append('line')
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('x2', 100)
        .attr('y2', 100)
        .attr('id', 'time-line')
        .attr('stroke-width', 1)
        .attr('stroke', '#696969')
        .attr('opacity', 0);
    svg.append('circle')
        .attr('id','time-label')
        .attr('cx', 0)
        .attr('cy', 0)
        .attr('r', 5)
        .attr('fill', '#696969')
        .attr('opacity', 0);
    svg.append('line')
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('x2', 100)
        .attr('y2', 100)
        .attr('id', 'distance-line')
        .attr('stroke-width', 1)
        .attr('stroke', '#696969')
        .attr('opacity', 0);
    svg.append('text')
        .attr('x', -30)
        .attr('y', 0)
        .attr('opacity', 0)
        .attr('id', 'distance-label')
        .attr('text-anchor', 'end')
        .attr('font-size', '20px')
        .attr('alignment-baseline', 'ideographic')
        .attr('fill', '#2a2a2a');
    var tooltip_height = 40;
    var tooltip_width = 100;
    var max_distance = 0;
    var train_name = {};
    create_time_axis();
    // Sort the trains form departure to arrival
    var trains = get_train_data(data);
    console.log(trains);
    var left_axis = svg.append("g")
        .attr("transform", "translate(0," + 0 + ")")
        .style("font-size","10px")
        .attr('fill', 'red')
        .attr("class","axis")
        .call(d3.axisLeft(y).ticks(15));
    train_chart = svg.append('g');
    create_initial_lines();
    create_transition(true);
    $(".selection-box").change(function() {
        arrival = String($(".selection-box option:selected").val());
        create_transition(false);
        setTimeout(function() {
          train_chart.remove();
          train_chart = svg.append('g');
          trains = get_train_data(data);
          left_axis.transition().duration(500).call(d3.axisLeft(y).ticks(15));
          create_initial_lines();
          create_transition(true);
        }, 500);
     });
    function get_train_data(data){
        var trains = []; // trains which pass go from departure to arrival
        var d1, d2, d0, d4 = [], d5, stations = [];
        for(var key in data){
            d0 = 0,
            d1 = false,
            d2 = false,
            d = [];
            for(station in data[key]){
                if(data[key][station]){
                    if(data[key][station]['Station Name'] == departure){
                        d1 = true;
                        d0 = data[key][station]['Distance'];
                    }
                    if(d1){
                        train_name[key] = data[key][station]['train Name'];
                        d.push({
                                'Station Name': data[key][station]['Station Name'],
                                'Departure time': data[key][station]['Departure time'],
                                'Distance': data[key][station]['Distance'] - d0,
                               });
                        if(data[key][station]['Station Name'] == arrival){
                          d2 = true;
                          break;
                        }
                    }
                }
            }
            if(d1 && d2){
                trains.push({'Train No' : key,
                             'Stops' : d
                            });
                for(var i in d){
                    if(!d4.includes(d[i]['Station Name'])){
                        d4.push(d[i]['Station Name']);
                        stations.push({
                          'Station Name': d[i]['Station Name'],
                          'Distance': d[i]['Distance']
                        })
                    }
                }
            }
        }
        stations.sort(function(a, b){return a['Distance'] > b['Distance']});
        max_distance = d3.max(trains, function(d){
              return d['Stops'][d['Stops'].length - 1]['Distance'];
            });
        d1 = [];
        for(var key in stations){
            d1.push(stations[key]['Station Name']);
        }
        stations = d1;
        y.domain([0, max_distance]);
        return trains;
    }
    function create_initial_lines(){
      for(var i in trains){
          train = trains[i];
          trains[i]['vis'] = {};
          trains[i]['vis']['circle'] = [];
          trains[i]['vis']['line'] = [];
          // Create_tooltip
          for(var j = 1; j < train['Stops'].length; j++){
              stop = train['Stops'][j];
              train_chart.append('text')
                  .attr('x', x(stop['Departure time']) - ((j%2 === 0) ? -10 : (10)))
                  .attr('y', y(stop['Distance']) - ((j%2 === 0) ? 0 : 0))
                  .attr('text-anchor', function(){
                      if(j%2 === 0){
                        return 'start';
                      } else{
                        return 'end';
                      }
                  })
                  .attr('alignment-baseline', function(){
                    if(j%2 === 0){
                       return 'alphabetic';
                    } else{
                      return 'hanging';
                    }
                  })
                  .attr('class', 'tooltip_' + train['Train No'].replace("'", "").replace("'", ""))
                  .attr('font-size', '15px')
                  .attr('visibility', 'hidden')
                  .text(stop['Station Name']);
          }
          // Create circles
          for(var j = 0; j < train['Stops'].length - 1; j++){
              stop1 = train['Stops'][j];
              stop2 = train['Stops'][j + 1];
              if(stop2['Departure time'] > stop1['Departure time'] && stop2['Distance'] > stop1['Distance']){
                trains[i]['vis']['line'].push(train_chart.append('line')
                    .attr('x1', 0)
                    .attr('x2', 0)
                    .attr('y1', y(stop1['Distance']))
                    .attr('y2', y(stop2['Distance']))
                    .attr('class', 'trainpath_' + train['Train No'].replace("'", "").replace("'", ""))
                    .style("stroke", '#bdbdbd')
                    .style("stroke-width", 4)
                    .attr('opacity', 0.7)
                    .on('mouseover', function(){
                      train_no = this.getAttribute('class').split('_')[1];
                      train_chart.selectAll('line').transition().duration(500).attr('opacity', 0.1);
                      train_chart.selectAll('circle').transition().duration(500).attr('opacity', 0.1);
                      train_chart.selectAll('.trainpath_' + train_no).transition().duration(500).attr('opacity', 0.9).style("stroke-width", 6).style('stroke', '#0EBFE9');
                      train_chart.selectAll('.traincircle_' + train_no).transition().duration(500).attr('opacity', 1).attr('r', 7).attr('fill', function(d, i){
                         var i = parseInt($(this).attr('class').split('_')[1].split(' ')[0])/chart_width*24;
                         if(i < 12){
                           return color(i%24);
                         } else{
                           return color((24 - i)%24);
                         }
                      });
                      d3.selectAll('.tooltip_' + train_no).attr('visibility', 'visible');
                      tooltip.style("visibility", "visible").style("text-align", 'center').style('width', '150px');
                      tooltip.html('<b>' + train_name["'" + train_no.toString() + "'"] + '</b>');
                      d3.select('#time-label').attr('opacity', 1);
                      d3.select('#time-line').attr('opacity', 1);
                      d3.select('#distance-line').attr('opacity', 1);
                      d3.select('#distance-label').attr('opacity', 1);
                    })
                    .on('mousemove', function(){
                        var coordinates = d3.mouse(this);
                        tooltip.style("top", (d3.event.pageY - $('#tooltip').height() - 40) + "px").style("left", (d3.event.pageX - $('#tooltip').width()/2) + "px");
                        d3.select('#time-label')
                            .attr('cx', coordinates[0])
                            .attr('cy', 0);
                        d3.select('#time-line')
                            .attr('x1', coordinates[0])
                            .attr('y1', 0)
                            .attr('x2', coordinates[0])
                            .attr('y2', coordinates[1]);
                        d3.select('#distance-line')
                            .attr('x1', 0)
                            .attr('y1', coordinates[1])
                            .attr('x2', coordinates[0])
                            .attr('y2', coordinates[1])
                        d3.select('#distance-label')
                            .attr('y', coordinates[1])
                            .text(function(){
                              return Math.round(coordinates[1]/chart_height*max_distance) + ' km'
                            })

                     })
                    .on('mouseout', function(){
                      train_no = this.getAttribute('class').split('_')[1];
                      train_chart.selectAll('line').transition().duration(500).attr('opacity', 0.7).style("stroke-width", 4).style('stroke', '#bdbdbd');
                      train_chart.selectAll('circle').transition().duration(500).attr('opacity', 0.9).attr('r', 3).attr('fill', '#bdbdbd');
                      d3.selectAll('.tooltip_' + train_no).attr('visibility', 'hidden');
                      tooltip.style("visibility", "hidden");
                      d3.select('#time-label').attr('opacity', 0);
                      d3.select('#time-line').attr('opacity', 0);
                      d3.select('#distance-line').attr('opacity', 0);
                      d3.select('#distance-label').attr('opacity', 0);
                    }));
              }
          }
          // Create lines
          for(var j in train['Stops']){
              stop = train['Stops'][j];
              trains[i]['vis']['circle'].push(
                train_chart.append('circle')
                   .attr('class', 'time_' + Math.round(x(stop['Departure time'])) + ' traincircle_' + train['Train No'].replace("'", "").replace("'", ""))
                   .attr('cx', 0)
                   .attr('cy', function(){
                      return y(stop['Distance']);
                   })
                   .attr('r', 3)
                   .attr('fill', '#bdbdbd')
                   .attr('opacity', 0.9)
                   .on('mouseover', function(){
                     train_no = this.getAttribute('class').split('_')[2];
                     train_chart.selectAll('line').transition().duration(500).attr('opacity', 0.1);
                     train_chart.selectAll('circle').transition().duration(500).attr('opacity', 0.1);
                     train_chart.selectAll('.trainpath_' + train_no).transition().duration(500).attr('opacity', 0.9).style("stroke-width", 6).style('stroke', '#0EBFE9');
                     train_chart.selectAll('.traincircle_' + train_no).transition().duration(500).attr('opacity', 1).attr('r', 7).attr('fill', function(d, i){
                        var i = parseInt($(this).attr('class').split('_')[1].split(' ')[0])/chart_width*24;
                        if(i < 12){
                          return color(i%24);
                        } else{
                          return color((24 - i)%24);
                        }
                     });
                     d3.selectAll('.tooltip_' + train_no).transition().duration(500).attr('visibility', 'visible');
                     tooltip.style("visibility", "visible").style("text-align", 'center').style('width', '150px');
                     tooltip.html('<b>' + train_name["'" + train_no.toString() + "'"] + '</b>');
                     d3.select('#time-label').attr('opacity', 1);
                     d3.select('#time-line').attr('opacity', 1);
                     d3.select('#distance-line').attr('opacity', 1);
                     d3.select('#distance-label').attr('opacity', 1);
                   })
                   .on('mousemove', function(){
                     var coordinates = d3.mouse(this);
                     tooltip.style("top", (d3.event.pageY - $('#tooltip').height() - 40) + "px").style("left", (d3.event.pageX - $('#tooltip').width()/2) + "px");
                     d3.select('#time-label')
                         .attr('cx', coordinates[0])
                         .attr('cy', 0);
                     d3.select('#time-line')
                         .attr('x1', coordinates[0])
                         .attr('y1', 0)
                         .attr('x2', coordinates[0])
                         .attr('y2', coordinates[1]);
                     d3.select('#distance-line')
                         .attr('x1', 0)
                         .attr('y1', coordinates[1])
                         .attr('x2', coordinates[0])
                         .attr('y2', coordinates[1])
                     d3.select('#distance-label')
                         .attr('y', coordinates[1])
                         .text(function(){
                           return Math.round(coordinates[1]/chart_height*max_distance) + ' km'
                         })
                   })
                   .on('mouseout', function(){
                     train_no = this.getAttribute('class').split('_')[2];
                     train_chart.selectAll('line').transition().duration(500).attr('opacity', 0.7).style("stroke-width", 4).style('stroke', '#bdbdbd');
                     train_chart.selectAll('circle').transition().duration(500).attr('opacity', 0.9).attr('r', 3).attr('fill', '#bdbdbd');
                     tooltip.style("visibility", "hidden");
                     d3.selectAll('.tooltip_' + train_no).transition().duration(500).attr('visibility', 'hidden');
                     tooltip.style("visibility", "hidden");
                     d3.select('#time-label').attr('opacity', 0);
                     d3.select('#time-line').attr('opacity', 0);
                     d3.select('#distance-line').attr('opacity', 0);
                     d3.select('#distance-label').attr('opacity', 0);
                   })
              )

          }
      }
    }
    function create_transition(ltr){
      // ltr left to right transition
      for(var i in trains){
          train = trains[i];
          // Create circles
          var d = 0;
          for(var j = 0; j < train['Stops'].length - 1; j++){
              stop1 = train['Stops'][j];
              stop2 = train['Stops'][j + 1];
              if(stop2['Departure time'] > stop1['Departure time'] && stop2['Distance'] > stop1['Distance']){
                train['vis']['line'][d]
                    .transition().duration(500)
                    .attr('x1', (ltr ? x(stop1['Departure time']) : 0))
                    .attr('x2', (ltr ? x(stop2['Departure time']) : 0))
                    .attr('y1', y(stop1['Distance']))
                    .attr('y2', y(stop2['Distance']));
                d = d + 1;
              }
          }
          // Create lines
          for(var j in train['Stops']){
              stop = train['Stops'][j];
              train['vis']['circle'][j]
                   .transition()
                   .duration(500)
                   .attr('class', 'time_' + Math.round(x(stop['Departure time'])) + ' traincircle_' + train['Train No'].replace("'", "").replace("'", ""))
                   .attr('cx', function(){
                      return (ltr ? x(stop['Departure time']) : 0);
                   })
                   .attr('cy', function(){
                      return y(stop['Distance']);
                   });

          }
      }
    }
    function create_time_axis(){
        var time = svg.append('g');
        // Create text
        time.append('line')
            .attr('x1', 0)
            .attr('y1', 0)
            .attr('x2', chart_width)
            .attr('y2', 0)
            .attr('stroke', 'black');
        for(i = 0; i < 24; i++){
            time.append('text')
                .attr('x', chart_width/24*i)
                .attr('y', -margin.top/2 - 4)
                .attr('fill', 'black')
                .attr('text-anchor', 'middle')
                .text(function(){
                  if(i < 12){
                    return String(i%12) + ' AM';
                  } else{
                    return i%12 + ' PM';
                  }
                });
        }

        for(var i = 0; i < 24*2; i++){
          time.append('line')
              .attr('x1', chart_width/24/2*i)
              .attr('y1', -margin.top/3)
              .attr('x2', chart_width/24/2*i)
              .attr('y2', 0)
              .attr('stroke-width', 2)
              .attr('stroke', 'black');
        }
        for(var i = 0; i < 24*4; i++){
          time.append('line')
              .attr('x1', chart_width/24/4*i)
              .attr('y1', -margin.top/4)
              .attr('x2', chart_width/24/4*i)
              .attr('y2', 0)
              .attr('stroke-width', 1)
              .attr('stroke', 'black');
        }
        // Hour
        for(var i = 0; i < 24; i++){
          time.append('line')
              .attr('x1', chart_width/24*i)
              .attr('y1', -margin.top/2)
              .attr('x2', chart_width/24*i)
              .attr('y2', 0)
              .attr('stroke-width', 3)
              .attr('stroke', function(){
                if(i < 12){
                  return color(i%24);
                } else{
                  return color((24 - i)%24);
                }
              });
        }
    }
}
