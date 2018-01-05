var tooltip = d3.select("body")
    .append("div")
    .attr('class', 'd3-tip')
    .attr('id', 'tooltip')
    .html('');

queue()
    .defer(d3.csv, 'data/data1.csv')
    .await(make_chart);

function make_chart(error, data){
    var time = d3.timeParse("%d-%m-%Y %H:%M");
    var timeScale = d3.scaleTime().range([0, 2*Math.PI]).domain([0, 24]);
    var circle_radius = 150;
    var circle_width = 15;

    data.forEach(function(d) {
      d['Request id'] = Number(d['Request id']);
      d['Request timestamp'] = time(d['Request timestamp']);
      d['Drop timestamp'] = time(d['Drop timestamp']);
    });

    var margin = {top: 0, right: 50, bottom: 0, left: 50}
    var width = $('#chart').width() - (margin.left + margin.right);
    var height = width/2 - (margin.top + margin.bottom);
    var svg = d3.select('#chart').append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
              "translate(" + margin.left + "," + margin.top + ")");

    g = svg.append("g").attr("transform", "translate(" + width / 2 + "," + (circle_radius + 50) + ")");
    var arc = d3.arc()
        .innerRadius(circle_radius - circle_width)
        .outerRadius(circle_radius)
        .startAngle(0)
        .cornerRadius(circle_width);
    var lineGenerator = d3.line()
    	     .curve(d3.curveCatmullRom);
    var day_color = d3.scaleLinear().domain([0, 1])
      .interpolate(d3.interpolateHcl)
      .range(["#fff76b", '#301860']);
    var foreground = g.append("path")
       .datum({endAngle: 2 * Math.PI})
       .style("fill", "#e9e9e9")
       .attr('opacity', 1)
       .attr('stroke', 'none')
       .attr("d", arc);

    var circle_radius_scale = d3.scaleTime().range([circle_radius - circle_width/2, 50]).domain(d3.extent(data, function(d){return d['Drop timestamp'] - d['Request timestamp']}));
    var path_circle = g.append('g')
          .selectAll('path')
          .data(data)
          .enter()
          .append('path')
          .attr('d', function(d){
            var t1 = d['Request timestamp'].getHours() + d['Request timestamp'].getMinutes()/60 - 6;
            var t2 = d['Drop timestamp'].getHours() + d['Drop timestamp'].getMinutes()/60 - 6;
            return lineGenerator([
              [(circle_radius - circle_width/2)*Math.cos(timeScale(t1)), (circle_radius - circle_width/2)*Math.sin(timeScale(t1))],
              [(circle_radius - circle_width/2)*Math.cos(timeScale(t1)), (circle_radius - circle_width/2)*Math.sin(timeScale(t1))],
              [(circle_radius - circle_width/2)*Math.cos(timeScale(t1)), (circle_radius - circle_width/2)*Math.sin(timeScale(t1))]
            ])
          })
          .style('stroke', function(d){
            if(d['Pickup point'] === 'Airport'){
              return '#d53e4f'
            }
            return '#3288bd';
          })
          .attr('stroke-width', '1')
          .attr('opacity', 0.6);
    path_circle.transition()
          .duration(1000)
          .attr('d', function(d){
            var t1 = d['Request timestamp'].getHours() + d['Request timestamp'].getMinutes()/60 - 6;
            var t2 = d['Drop timestamp'].getHours() + d['Drop timestamp'].getMinutes()/60 - 6;
            if(t1 > 12 && t2 < 12){
              t2 = t2 + 24;
            }
            return lineGenerator([
              [(circle_radius - circle_width/2)*Math.cos(timeScale(t1)), (circle_radius - circle_width/2)*Math.sin(timeScale(t1))],
              [circle_radius_scale(d['Drop timestamp'] - d['Request timestamp'])*Math.cos(timeScale(t1/2 + t2/2)), circle_radius_scale(d['Drop timestamp'] - d['Request timestamp'])*Math.sin(timeScale(t1/2 + t2/2))],
              [(circle_radius - circle_width/2)*Math.cos(timeScale(t2)), (circle_radius - circle_width/2)*Math.sin(timeScale(t2))]
            ])
          })
          ;
    var circle_circle = g.append('g')
          .selectAll('circle')
          .data(data)
          .enter()
          .append('circle')
          .attr('cx', function(d){
            var t1 = d['Request timestamp'].getHours() + d['Request timestamp'].getMinutes()/60 - 6;
            return (circle_radius - circle_width/2)*Math.cos(timeScale(t1));
          })
          .attr('cy', function(d){
            var t1 = d['Request timestamp'].getHours() + d['Request timestamp'].getMinutes()/60 - 6;
            return (circle_radius - circle_width/2)*Math.sin(timeScale(t1));
          })
          .attr('r', 0)
          .attr('fill', function(d){
            if(d['Pickup point'] === 'Airport'){
              return '#d53e4f'
            }
            return '#3288bd';
          });
    circle_circle.transition()
        .duration(1000)
        .attr('r', 2)
    for(var i = 0; i < 25; i++){
      var gap = 7;
      if(i%6 === 0){
        gap = 20;
      } else if (i %3 === 0){
        gap = 13;
      }
      g.append('line')
        .attr('x1', (circle_radius + 5)*Math.cos(i/24*Math.PI*2 + Math.PI/2))
        .attr('y1', (circle_radius + 5)*Math.sin(i/24*Math.PI*2 + Math.PI/2))
        .attr('x2', (circle_radius + 5)*Math.cos(i/24*Math.PI*2 + Math.PI/2))
        .attr('y2', (circle_radius + 5)*Math.sin(i/24*Math.PI*2 + Math.PI/2))
        .attr('stroke', day_color(Math.abs(Math.cos(i/24/2*Math.PI*2 + Math.PI/2))))
        .attr('stroke-width', function(){
          if(i%6 === 0){
            return 3;
          } else if (i %3 === 0){
            return 2;
          }
          return 1;
        })
        .attr('stroke-linecap', 'round')
        .transition()
        .duration(1000)
        .attr('x2', (circle_radius + 5 + gap)*Math.cos(i/24*Math.PI*2 + Math.PI/2))
        .attr('y2', (circle_radius + 5 + gap)*Math.sin(i/24*Math.PI*2 + Math.PI/2))
        ;
    }
    var background = g.append("path")
          .datum({endAngle: 2 * Math.PI})
          .style("fill", "#ddd")
          .attr('opacity', 0)
          .attr("d", arc)
          .on('mouseover', function(d){
            d3.select('#circle-background').attr('opacity', 0);
          })
          .on('mousemove', function(d){
              coordinates = d3.mouse(this);
              angle = Math.atan2(-coordinates[0], coordinates[1]) + Math.PI;
              arc.startAngle(angle - 5/180*Math.PI);
              foreground
                  .transition()
                  .duration(1)
                  .style("fill", "#a8a8a8")
                  .attrTween('d', arcTween(angle + 5/180*Math.PI));

              var t1 = (angle - 5/180*Math.PI)*24/(2*Math.PI);
              var t2 = (angle + 5/180*Math.PI)*24/(2*Math.PI);
              path_circle.transition()
                  .duration(50)
                  .attr('opacity', function(d){
                    var t = d['Request timestamp'].getHours() + d['Request timestamp'].getMinutes()/60;
                    return (t > t1 & t < t2 ? 1 : 0.3);
                  })
                  .style('stroke', function(d){
                    var t = d['Request timestamp'].getHours() + d['Request timestamp'].getMinutes()/60;
                    if(t > t1 & t < t2){
                      if(d['Pickup point'] === 'Airport'){
                        return '#d53e4f'
                      }
                      return '#3288bd';
                    }
                    return '#bdbdbd';
                  });

              path_line.transition()
                  .duration(50)
                  .attr('opacity', function(d){
                    var t = d['Request timestamp'].getHours() + d['Request timestamp'].getMinutes()/60;
                    return (t > t1 & t < t2 ? 1 : 0.3);
                  })
                  .style('stroke', function(d){
                    var t = d['Request timestamp'].getHours() + d['Request timestamp'].getMinutes()/60;
                    if(t > t1 & t < t2){
                      if(d['Pickup point'] === 'Airport'){
                        return '#d53e4f'
                      }
                      return '#3288bd';
                    }
                    return '#bdbdbd';
                  })
          })
          .on('mouseout', function(d){
            arc.startAngle(0);
            foreground
                .transition()
                .duration(1)
                .style("fill", "#e9e9e9")
                .attrTween('d', arcTween(2*Math.PI));

            path_circle.transition()
                .duration(500)
                .attr('opacity', function(d){
                  return 1
                })
                .style('stroke', function(d){
                  if(d['Pickup point'] === 'Airport'){
                    return '#d53e4f'
                  }
                  return '#3288bd';
                })
                .attr('opacity', 0.6);

            path_line.transition()
                .duration(500)
                .attr('opacity', function(d){
                  return 1
                })
                .style('stroke', function(d){
                  if(d['Pickup point'] === 'Airport'){
                    return '#d53e4f'
                  }
                  return '#3288bd';
                })
                .attr('opacity', 0.6);
          });

    g.append('text')
        .attr('x', 0)
        .attr('y', -circle_radius - 30)
        .attr('text-anchor', 'middle')
        .attr('fill', '#7e7e7e')
        .text('24')
    g.append('text')
        .attr('x', circle_radius + 33)
        .attr('y', 0)
        .attr('text-anchor', 'middle')
        .attr('alignment-baseline', 'ideographic')
        .attr('fill', '#7e7e7e')
        .text('6')
    g.append('text')
        .attr('x', 0)
        .attr('y', circle_radius + 30)
        .attr('text-anchor', 'middle')
        .attr('alignment-baseline', 'hanging')
        .attr('fill', '#7e7e7e')
        .text('12')
    g.append('text')
        .attr('x', -circle_radius - 30)
        .attr('y', 0)
        .attr('text-anchor', 'end')
        .attr('alignment-baseline', 'ideographic')
        .attr('fill', '#7e7e7e')
        .text('18')

    var line_width = 15;
    g1 = svg.append('g').attr("transform", "translate(" + 0 + "," + (circle_radius*2 + 50) + ")");
    g1.append('line')
        .attr('x1', 0)
        .attr('y1', (height - circle_radius*2)/2)
        .attr('x2', width)
        .attr('y2', (height - circle_radius*2)/2)
        .attr('stroke', '#e9e9e9')
        .attr('id', 'line-background')
        .attr('stroke-width', line_width)
        .attr('stroke-linecap', 'round')
        .attr('opacity', 1);

    var line_scale = d3.scaleTime().range([0, width]).domain([d3.min(data, function(d){return d['Request timestamp']}), d3.max(data, function(d){return d['Drop timestamp']})]);
    var di = new Date(line_scale.domain()[0].getFullYear(), line_scale.domain()[0].getMonth(), line_scale.domain()[0].getDate(), line_scale.domain()[0].getHours() + 1, 0, 0, 0); ;
    var monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    var df = line_scale.domain()[1];
    while(df - di > 1000*60*60){
      g1.append('circle')
          .attr('cx', line_scale(di))
          .attr('cy', (height - circle_radius*2)/2)
          .attr('r', 0)
          .attr('fill', day_color(Math.abs(Math.cos(di.getHours()/24/2*Math.PI*2))))
          .transition()
          .duration(1000)
          .attr('r', function(){
            if(di.getHours() % 6 === 0){
              return 4
            }
            if(di.getHours() % 3 === 0){
              return 3
            }
            return 2
          })
      di = new Date(di.getTime() + 1000*60*60);
      if(di.getHours() === 0){
          g1.append('line')
              .attr('x1', line_scale(di))
              .attr('y1', 50)
              .attr('x2', line_scale(di))
              .attr('y2', (height - circle_radius*2)/2 - line_width/2)
              .attr('stroke', '#dbdbdb')
              .attr('stroke-width', 1);
          g1.append('circle')
              .attr('cx', line_scale(di))
              .attr('cy', 50)
              .attr('fill', '#dbdbdb')
              .attr('r', 2);
          g1.append('text')
              .attr('y', 45)
              .attr('x', line_scale(di))
              .attr('text-anchor', 'middle')
              .attr('fill', '#7e7e7e')
              .text(di.getDate() + ' ' + monthNames[di.getMonth()])
      }
    }
    g1.append('line')
        .attr('x1', line_scale(line_scale.domain()[0]))
        .attr('y1', 50)
        .attr('x2', line_scale(line_scale.domain()[0]))
        .attr('y2', (height - circle_radius*2)/2 - line_width/2)
        .attr('stroke', '#dbdbdb')
        .attr('stroke-width', 1);
    g1.append('circle')
        .attr('cx', line_scale(line_scale.domain()[0]))
        .attr('cy', 50)
        .attr('fill', '#dbdbdb')
        .attr('r', 2);
    g1.append('text')
        .attr('y', 45)
        .attr('x', line_scale(line_scale.domain()[0]))
        .attr('text-anchor', 'middle')
        .attr('fill', '#7e7e7e')
        .text(line_scale.domain()[0].getDate() + ' ' + monthNames[line_scale.domain()[0].getMonth()])

    circle_radius_scale.range([0, (height - circle_radius*2)/2 - 70])
    var path_line = g1.append('g')
        .selectAll('path')
        .data(data)
        .enter()
        .append('path')
        .attr('d', function(d){
          if(d['Pickup point'] === 'Airport'){
            return lineGenerator([
              [line_scale(d['Request timestamp']), (height - circle_radius*2)/2 - line_width/2],
              [(line_scale(d['Request timestamp']) + line_scale(d['Drop timestamp']))/2, (height - circle_radius*2)/2 - line_width/2],
              [line_scale(d['Drop timestamp']), (height - circle_radius*2)/2 - line_width/2]
            ])
          }
          return lineGenerator([
            [line_scale(d['Request timestamp']), (height - circle_radius*2)/2 + line_width/2],
            [(line_scale(d['Request timestamp']) + line_scale(d['Drop timestamp']))/2, (height - circle_radius*2)/2 + line_width/2],
            [line_scale(d['Drop timestamp']), (height - circle_radius*2)/2 + line_width/2]
          ])
        })
        .style('stroke', function(d){
          if(d['Pickup point'] === 'Airport'){
            return '#d53e4f'
          }
          return '#3288bd';
        })
        .attr('stroke-width', '1');
    path_line.transition()
        .duration(1000)
        .attr('d', function(d){
          if(d['Pickup point'] === 'Airport'){
            return lineGenerator([
              [line_scale(d['Request timestamp']), (height - circle_radius*2)/2 - line_width/2],
              [(line_scale(d['Request timestamp']) + line_scale(d['Drop timestamp']))/2, (height - circle_radius*2)/2 - circle_radius_scale(d['Drop timestamp'] - d['Request timestamp']) - line_width/2],
              [line_scale(d['Drop timestamp']), (height - circle_radius*2)/2 - line_width/2]
            ])
          }
          return lineGenerator([
            [line_scale(d['Request timestamp']), (height - circle_radius*2)/2 + line_width/2],
            [(line_scale(d['Request timestamp']) + line_scale(d['Drop timestamp']))/2, (height - circle_radius*2)/2 + circle_radius_scale(d['Drop timestamp'] - d['Request timestamp']) + line_width/2],
            [line_scale(d['Drop timestamp']), (height - circle_radius*2)/2 + line_width/2]
          ])
        })
        .attr('opacity', 0.6);

    var circle_line = g1.append('g')
        .selectAll('circle')
        .data(data)
        .enter()
        .append('circle')
        .attr('cx', function(d){
          return line_scale(d['Request timestamp']);
        })
        .attr('cy', function(d){
          if(d['Pickup point'] === 'Airport'){
            return (height - circle_radius*2)/2 - line_width/2;
          }
          return (height - circle_radius*2)/2 + line_width/2;
        })
        .attr('opacity', 0.7)
        .attr('r', 0)
        .attr('fill', function(d){
          if(d['Pickup point'] === 'Airport'){
            return '#d53e4f'
          }
          return '#3288bd';
        });
    circle_line.transition()
        .duration(1000)
        .attr('r', 2.5)
    g1.append('line')
        .attr('x1', 0)
        .attr('y1', (height - circle_radius*2)/2)
        .attr('x2', width)
        .attr('y2', (height - circle_radius*2)/2)
        .attr('opacity', 1)
        .attr('stroke', 'transparent')
        .attr('stroke-width', line_width)
        .on('mouseover', function(d){
        })
        .on('mousemove', function(d){
          coordinates = d3.mouse(this);
          del = (line_scale.domain()[1].getTime() - line_scale.domain()[0].getTime())/width ;
          t1 = new Date((coordinates[0] - 20)*del + line_scale.domain()[0].getTime());
          t2 = new Date((coordinates[0] + 20)*del + line_scale.domain()[0].getTime());
          d3.select('#line-background').transition().duration(50)
              .attr('x1', Math.max(coordinates[0] - 20, 0))
              .attr('y1', (height - circle_radius*2)/2)
              .attr('x2', Math.min(coordinates[0] + 20, width))
              .attr('y1', (height - circle_radius*2)/2)
              .attr('stroke', '#a8a8a8');

          path_circle.transition()
              .duration(50)
              .attr('opacity', function(d){
                var t = d['Request timestamp'];
                return (t > t1 & t < t2 ? 1 : 0.3);
              })
              .style('stroke', function(d){
                var t = d['Request timestamp'];
                if(t > t1 & t < t2){
                  if(d['Pickup point'] === 'Airport'){
                    return '#d53e4f'
                  }
                  return '#3288bd';
                }
                return '#bdbdbd';
              });

          path_line.transition()
              .duration(50)
              .attr('opacity', function(d){
                var t = d['Request timestamp'];
                return (t > t1 & t < t2 ? 1 : 0.3);
              })
              .style('stroke', function(d){
                var t = d['Request timestamp'];
                if(t > t1 & t < t2){
                  if(d['Pickup point'] === 'Airport'){
                    return '#d53e4f'
                  }
                  return '#3288bd';
                }
                return '#bdbdbd';
              })
        })
        .on('mouseout', function(d){
          d3.select('#line-background').transition().duration(100)
              .attr('x1', 0)
              .attr('y1', (height - circle_radius*2)/2)
              .attr('x2', width)
              .attr('y2', (height - circle_radius*2)/2)
              .attr('stroke', '#e9e9e9');

              path_circle.transition()
                  .duration(500)
                  .attr('opacity', function(d){
                    return 1
                  })
                  .style('stroke', function(d){
                    if(d['Pickup point'] === 'Airport'){
                      return '#d53e4f'
                    }
                    return '#3288bd';
                  })
                  .attr('opacity', 0.6);

              path_line.transition()
                  .duration(500)
                  .attr('opacity', function(d){
                    return 1
                  })
                  .style('stroke', function(d){
                    if(d['Pickup point'] === 'Airport'){
                      return '#d53e4f'
                    }
                    return '#3288bd';
                  })
                  .attr('opacity', 0.6);
        })


    g2 = svg.append('g')
            .attr("transform", "translate(" + (width - 150) + "," + (2*circle_radius - 50) + ")");
    g2.append('text')
          .attr('x', 35)
          .attr('y', 10)
          .text('Airport to City')
    g2.append('text')
          .attr('x', 35)
          .attr('y', 30)
          .text('City to Airport')
    g2.append('line')
        .attr('x1', 0)
        .attr('x2', 30)
        .attr('y1', 5)
        .attr('y2', 5)
        .attr('stroke', '#3288bd')
    g2.append('line')
        .attr('x1', 0)
        .attr('x2', 30)
        .attr('y1', 25)
        .attr('y2', 25)
        .attr('stroke', '#d53e4f')
    function arcTween(newAngle) {
      return function(d) {
        var interpolate = d3.interpolate(d.endAngle, newAngle);
        return function(t) {
          d.endAngle = interpolate(t);
          return arc(d);
        };
      };
    }
    function has(list, a){
      return list.indexOf(a) > -1;
    }
}
