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
    .style("width", 'auto')
    .attr('id', 'tooltip')
    .html('');
var cols;
var dragSrcEl = null;

function Node(value) {
    this.value = value;
    this.children = [];
    this.parent = null;
    this.width = 0;
    this.height = 0;
    this.x = 0;
    this.y = 0;
    this.id = '';
    this.class = '';
    this.color = 'grey';
    this.svg;
    this.level = 0;
    this.data;
    this.dimension = '';

    this.setParentNode = function(node) {
        this.parent = node;
    }
    this.getParentNode = function() {
        return this.parent;
    }
    this.addChild = function(node) {
        node.setParentNode(this);
        node.level = this.level + 1;
        this.children[this.children.length] = node;
    }
    this.getChildren = function() {
        return this.children;
    }
    this.removeChildren = function() {
        for(var i in this.children){
            console.log(this.children[i].svg._groups[0][0])
            d3.select(this.children[i].svg._groups[0][0])
                .attr('width', 0)
                .attr('height', 0);
            this.children[i].svg._groups[0][0].remove();
            //console.log('2');
        }
        this.children = [];
    }
}
function preorder(node){
    console.log(node.value, node.level);
    for(var i = 0; i < node.children.length; i++){
        preorder(node.children[i])
    }
}
queue()
    .defer(d3.csv, 'data/data.csv')
    .await(make_chart);

function make_chart(error, data){
    var dimensions = ['benefits', 'care_options', 'seek_help', 'leave', 'mental_health_consequence', 'supervisor'];
    var field_values = {};
    var field_data = {};
    var root;
    var colors = ['#a50026', '#313695', '#d73027', '#4575b4', '#f46d43', '#74add1', '#fdae61', '#abd9e9', '#fee090', '#e0f3f8'];
    var v_gap = 10;
    var all_data = new Set();
    //for(var i = 5; i <  10 /* Object.keys(data[0]).length */; i++){
    //  dimensions.push(Object.keys(data[0])[i]);
    //}
    for(var i in dimensions){
        field_values[dimensions[i]] = new Set();
    }
    data.forEach(function(d) {
        if(d['Country'] === 'United States'){
          d["Age"] = +d["Age"];
          if(d['Gender'][0] === "M" || d['Gender'][0] === "m"){
            d['Gender'] = 'M';
          } else{
            d['Gender'] = 'F';
          }
          for(var i in dimensions){
            field_values[dimensions[i]].add(d[dimensions[i]])
          }
          all_data.add(d);
        }
    });
    for(var i in field_values){
        field_values[i] = Array.from(field_values[i]);
    }
    for(var i in field_values){
        field_data[i] = {}
        for(var j in field_values[i]){
            field_data[i][field_values[i][j]] = {
                                                  'Data': new Set(),
                                                  'Color': colors[Math.floor(Math.random()*10)],
                                                  };
        }
        for(var j in data){
            for(var k in field_values[i]){
                if(data[j][i] === field_values[i][k]){
                    field_data[i][field_values[i][k]]['Data'].add(data[j]);
                    break;
                }
            }
        }
    }
    var margin = {top: 0, right: 10, bottom: 0, left: 10}
    var width = $('#chart').width() - (margin.left + margin.right);
    var height = width/2 - (margin.top + margin.bottom);
    create_legend();
    var svg = d3.select('#chart').append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
              "translate(" + margin.left + "," + margin.top + ")");
    var x = d3.scaleLinear().range([0, width]);
    construct_tree();
    function update_tree(){
        dimensions = [];
        for(var i = 0; i < $('*[id^="selection-"]').length; i++){
            dimensions.push($($('*[id^="selection-"]')[i]).attr('id').split('-')[1]);
        }
        svg.selectAll('rect')
            .transition()
            .duration(500)
            .attr('width', 0)
            .attr('height', 0);
        setTimeout(construct_tree, 500);
    }
    function _construct_tree(node){ // helper function to make the tree
        var d1, d2, d;
        d1 = new Node('');
        d1.x = node.x; d1.y = node.y; d1.width = 0; d1.height = 0;
        node.removeChildren();
        for(var i in field_data[dimensions[node.level]]){
            d = new Node(dimensions[node.level]);
            d.x = d1.x + d1.width;
            d.y = node.y + node.height + v_gap/2;
            d.height = height/(dimensions.length + 1) - v_gap/2;
            d.data = set_intersection(node.data, field_data[dimensions[node.level]][i]['Data']);
            d.width = Math.max(0, width*(d.data.size)/all_data.size);
            d.color = field_data[dimensions[node.level]][i]['Color'];
            d.id = Math.round((d.data.size)/all_data.size*1000)/10 + '%';
            d.class = node.class + ' ' + dimensions[node.level] + i.replace(' ', '-').replace(' ', '-').replace("'", '');
            d.dimension = dimensions[node.level];
            if(node.value === ''){
                d.value = dimensions[node.level];
            } else{
                d.value = node.value + ' -> '+ dimensions[node.level];
            }
            d2 = svg.append('rect')
                .attr('id', d.id)
                .attr('x', d.x)
                .attr('y', d.y)
                .attr('width', 0)
                .attr('height', 0)
                .attr('fill', d.color)
                .attr('opacity', 0.8)
                .attr('class', d.class)
                .attr('id', 'value-' + d.id + '-' + d.class)
                .attr('value', d.value)
                .on('mouseover', function(){
                    if(this.id.split('-')[1] !== ''){
                      tooltip.style("visibility", "visible");
                      //tooltip.html('<p>' + $(this).attr('value') + ' <b>' + this.id.split('-')[1] + '</b><p>');
                      tooltip.html('<p>' + ' <b>' + this.id.split('-')[1] + '</b><p>');
                    }
                    d3.select('body').selectAll('rect').attr('opacity', 0.2);
                    var c = $(this).attr('class').split(' ');
                    d3.selectAll('.' + c[c.length - 1]).attr('opacity', 1);
                })
                .on('mousemove', function(){
                    tooltip.style("top", (d3.event.pageY - $('#tooltip').height() - 20) + "px").style("left", (d3.event.pageX - $('#tooltip').width()/2) + "px");
                })
                .on('mouseout', function(){
                    d3.select('body').selectAll('rect').attr('opacity', 0.8);
                    tooltip.style("visibility", "hidden");
                })
                .transition()
                .duration(500)
                .attr('width', d.width)
                .attr('height', d.height);
            d.svg = d2;
            node.addChild(d);
            _construct_tree(d);
            d1 = d;
        }
    }
    function construct_tree(){
        root = new Node('');
        root.width = width;
        root.height = 10;
        root.x = 0;
        root.y = 0;
        root.id = '100%'
        root.data = all_data;
        _construct_tree(root);
        return root;
    }
    function create_legend(){
        var legend_width = 250;
        var text_height = 14;
        var d1 = 0;
        for(var i in dimensions){
            $('#sortable').append('<li class="column" draggable="true"><div id="selection-' + dimensions[i]  + '"> ' + ' </div></li>');
            var d = d3.select('#selection-' + dimensions[i])
                .append('svg')
                .attr('width', legend_width)
                .attr('height', height/(dimensions.length + 1) - v_gap/2)
                .attr("transform",
                      "translate(" + 0 + "," + v_gap/2 + ")")
                .append('g')
            d.append('text')
                .attr('x', 2)
                .attr('y', 0)
                .attr('alignment-baseline', 'hanging')
                .attr('dominant-baseline', 'hanging')
                .attr('font-size', text_height)
                .attr('fill', 'black')
                .text(dimensions[i])
            for(var j in field_data[dimensions[i]]){
                d2 = Object.keys(field_data[dimensions[i]]);

                d.append('rect')
                  .attr('x', legend_width/d2.length*d2.indexOf(j))
                  .attr('y', text_height)
                  .attr('width', 0)
                  .attr('height', 0)
                  .attr('class', dimensions[i] + j.replace(' ', '-').replace(' ', '-').replace("'", ''))
                  .attr('fill', colors[d1%10])
                  .attr('opacity', 0.8)
                  .on('mouseover', function(){
                    var c = $(this).attr('class');
                    d3.select('body').selectAll('rect').attr('opacity', 0.2);
                    d3.selectAll('.' + c).attr('opacity', 1);
                  })
                  .on('mouseout', function(){
                    d3.select('body').selectAll('rect').attr('opacity', 0.8)
                  })
                  .transition()
                  .duration(500)
                  .attr('height', height/(dimensions.length + 1) - text_height)
                  .attr('width', legend_width/(d2.length));

                d.append('text')
                  .attr('x', legend_width/d2.length*d2.indexOf(j) + 2)
                  .attr('y', text_height + 2)
                  .attr('font-size', function(){
                    if(legend_width/(d2.length) > j.length*text_height){
                      return text_height;
                    }
                    else{
                      return Math.min(text_height, legend_width/(d2.length)/(j.length)*2)
                    }
                  })
                  .attr('alignment-baseline', 'hanging')
                  .attr('dominant-baseline', 'hanging')
                  .text(j);

                field_data[dimensions[i]][j]['Color'] = colors[d1%10];
                d1 = d1 + 1;
            }
        }
        cols = document.querySelectorAll('#columns .column');
    }
    function has(list, a){
      return list.indexOf(a) > -1;
    }
    function set_intersection(setA, setB){
        var intersection = new Set();
        for (var elem of setB) {
            if (setA.has(elem)) {
                intersection.add(elem);
            }
        }
        return intersection;
    }
    $('#sortable').sortable().bind('sortupdate', update_tree);
    $( "#sortable" ).disableSelection();
}
