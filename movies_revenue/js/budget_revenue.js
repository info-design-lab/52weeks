var genre_colors = {
  'Action': '#d53e4f',
  'Drama': '#99d594',
  'Comedy': '#fc8d59',
  'Horror': '#3288bd',
  'Animation':'#762a83',
  'Documentary': '#66c2a5',
  'Others': '#878787'
};

queue()
    .defer(d3.csv, 'data/data.csv')
    .await(make_budget_map);

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
    .attr('id', 'tooltip')
    .html('');

function make_budget_map(error, data){
    x_axis = 'budget';
    y_axis = 'revenue';
    data.forEach(function(d) {
        d['release_date'] = parseFloat(d['release_date']);
        d['revenue'] = +d['revenue'];
        d['budget'] = +d['budget'];
        d['vote_average'] = +d['vote_average'];
        d['popularity'] = +d['popularity'];
        d['runtime'] = +d['runtime'];
    });
    var margin = {top: 20, right: 40, bottom: 50, left: 120}
    var width = $('#budget_scatter').width();
    var scatter_width = width*0.9 - (margin.left + margin.right);
    width = width - (margin.left + margin.right);
    var scatter_height = scatter_width/2 - ( margin.top + margin.bottom);
    var svg = d3.select('#budget_scatter').append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', scatter_height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
              "translate(" + margin.left + "," + margin.top + ")");
    var x = d3.scaleLinear().range([0, scatter_width]);
    var y = d3.scaleLinear().range([scatter_height, 0]);
    x.domain(d3.extent(data, function(d) { return d[x_axis]; }));
    y.domain(d3.extent(data, function(d) { return d[y_axis]; }));
    // Add the scatterplot
    svg.append('text')
        .attr('x', - margin.left/2)
        .attr("text-anchor", "middle")
        .attr('y', 0)
        .attr('fill', '#1a1a1a')
        .text(capitalizeFirstLetter(y_axis));
    svg.append('text')
        .attr('x', scatter_width)
        .attr('y', scatter_height + 30)
        .attr("text-anchor", "middle")
        .attr('fill', '#1a1a1a')
        .attr('id', 'x-axis-label')
        .text(capitalizeFirstLetter(x_axis));
    var bottom_axis = svg.append("g")
        .attr("transform", "translate(0," + scatter_height + ")")
        .style("font-size","10px")
        .attr('fill', 'red')
        .attr("class","axis")
        .call(d3.axisBottom(x).ticks(15).tickFormat(d3.formatPrefix(".1", 1e6)));
    svg.append("g")
        .attr("transform", "translate(0," + 0 + ")")
        .style("font-size","10px")
        .attr('fill', 'red')
        .attr("class","axis")
        .call(d3.axisLeft(y).ticks(14).tickFormat(d3.formatPrefix(".1", 1e6)));
    scatter = svg.selectAll("circle")
        .data(data)
        .enter().append("circle")
        .attr('fill', 'red')
        .attr("r", 4)
        .attr('fill', function(d){
            return get_color(d['genres']);
        })
        .attr('opacity', 0.5)
        .attr("cx", function(d) { return x(d[x_axis]); })
        .attr("cy", function(d) { return y(d[y_axis]); })
        .on('mouseover', function(d) {
            tooltip.style("visibility", "visible");
            tooltip.html('<b>' + d['original_title'] + '</b>' + ' (' + parseInt(d['release_date']) + ')<br>' +
                          'Rating: ' + d['vote_average'] + '<br>' +
                          'Revenue: ' + round_number(d['revenue']) + '<br>' +
                          'Budget: ' + round_number(d['budget']) + '<br>'
                        );
            if(selected_years.length > 0){
              d3.select(this).transition().duration(200).attr('r', 10)
            } else{
              d3.select(this).transition().duration(200).attr('r', 7);
            }
        })
        .on("mousemove", function(d) {
            tooltip.style("top", (d3.event.pageY - $('#tooltip').height() - 40) + "px").style("left", (d3.event.pageX - $('#tooltip').width()/2) + "px");
        })
        .on("mouseout", function(d) {
            tooltip.style("visibility", "hidden");
            if(selected_years.length > 0){
              d3.select(this).transition().duration(200).attr('r', 10)
            } else{
              d3.select(this).transition().duration(200).attr('r', 4);
            }
        });
    ti = 1900;
    tf = 2017;
    scroll_width = width*0.1 - 20;
    scroll_height = 200;
    scroll_rect_height = scroll_height/10;
    var selected_years = [];
    var svg_scroll = svg.append("g")
        .attr("transform",
          "translate(" + (width*0.9) + "," + margin.top + ")");
    create_scroll(svg_scroll);
    create_legend();
    function create_scroll(svg_scroll){
        var scroll = svg_scroll.append('g');
        scroll.append('text')
            .attr('x', scroll_width/2)
            .attr('y', -2)
            .attr('fill', 'black')
            .attr("text-anchor", "middle")
            .text('2017');
        scroll.append('text')
            .attr('x', scroll_width/2)
            .attr('y', scroll_rect_height*10 + +2)
            .attr('fill', 'black')
            .attr("text-anchor", "middle")
            .attr('alignment-baseline', 'hanging')
            .attr('dominant-baseline', 'hanging')
            .text('1900');

        for(var i = 0; i < 10; i++){
            scroll.append('rect')
                  .attr('x', 0)
                  .attr('y', i*scroll_rect_height)
                  .attr('height', scroll_rect_height)
                  .attr('width', scroll_width)
                  .attr('id', 'year-' + i)
                  .attr('fill', '#bdbdbd')
                  .on('mouseover', function(){
                      var no = parseInt(this.id.split('-')[1]);
                      d3.select(this).attr('fill', '#636363');
                  })
                  .on('click', function(){
                    var no = parseInt(this.id.split('-')[1]);
                    if(selected_years.indexOf(no) === -1){
                        selected_years.push(no);
                    } else{
                        selected_years.splice(selected_years.indexOf(no), 1);
                    }
                    svg.selectAll('circle').transition().attr('r', function(d){
                      if(selected_years.length > 0){
                        for(var i in selected_years){
                            yi = tf - (selected_years[i] + 1)*(tf - ti)/10;
                            yf = tf - (selected_years[i])*(tf - ti)/10;
                            console.log(yi, yf);
                            if((d['release_date'] > yi && d['release_date'] < yf)){
                              return 10
                            }
                        }
                        return 0
                      }
                      return 4;
                    })
                  })
                  .on('mouseout', function(){
                      var no = parseInt(this.id.split('-')[1]);
                      if(selected_years.indexOf(no) === -1){
                          d3.select(this).attr('fill', '#bdbdbd');
                      }
                  })
        }
    }
    function get_color(genre){
      if (has(genre, 'Animation')){
        return genre_colors['Animation'];
      }
      else if (has(genre, 'Horror')){
        return genre_colors['Horror'];
      }
      else if (has(genre, 'Action')){
        return genre_colors['Action'];
      }
      else if (has(genre, 'Drama')){
        return genre_colors['Drama'];
      }
      else if (has(genre, 'Comedy')){
        return genre_colors['Comedy'];
      }
      else if (has(genre, 'Documentary')){
        return genre_colors['Documentary'];
      }
      else{
        return '#878787';
      }
    }
    function create_legend(){
        var legend = svg.append('g')
            .attr("transform",
              "translate(" + (width*0.9) + "," + (margin.top + scroll_height + 20) + ")");
        for(var i = 0; i < Object.keys(genre_colors).length; i++){
          legend.append('rect')
            .attr('x', 0)
            .attr('y', 18*i)
            .attr('width', 15)
            .attr('height', 15)
            .attr('opacity', 0.5)
            .attr('fill', genre_colors[Object.keys(genre_colors)[i]]);
          legend.append('text')
            .attr('x', 18)
            .attr('y', 18*i + 15)
            .text(Object.keys(genre_colors)[i]);
        }
    }
    function has(list, a){
      return list.indexOf(a) > -1;
    }
    function round_number(n){
      if(n > 1000000000){
        return String(Math.round(n/100000000)/10) + 'B';
      } else if(n > 1000000){
        return String(Math.round(n/100000)/10) + 'M';
      } else if(n > 1000){
        return String(Math.round(n/100)/10) + 'k';
      } else{
        return String(n);
      }
    }
    function capitalizeFirstLetter(string) {
        if(string === 'vote_average'){
          return 'Rating'
        }
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
    $('.button').click(function() {
        $('#button-'+x_axis).removeClass('selected');
        x_axis = this.id.split('-')[1];
        $('#button-'+x_axis).addClass('selected');
        d3.select('#x-axis-label').text(capitalizeFirstLetter(x_axis));
        x.domain(d3.extent(data, function(d) { return d[x_axis]; }));
        svg.selectAll('circle').transition().duration(500).attr("cx", function(d) { return x(d[x_axis]); });
        console.log(x_axis);
        if(x_axis === 'budget'){
          bottom_axis.transition().duration(500).call(d3.axisBottom(x).ticks(15).tickFormat(d3.formatPrefix(".1", 1e6)));
        } else{
          bottom_axis.transition().duration(500).call(d3.axisBottom(x).ticks(15));
        }
    });
}
