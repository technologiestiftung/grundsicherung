let timelapse_map,
dataLayer_tl,
projection_timelapse, 
path_timelapse,
width_tl,
height_tl,
tooltip_tl,
year_label;

var min = 0;
var max = 40;

d3.json("config.json")
.then((_config) => {
    config = _config;
    
    width_tl = config.positions.map.width;
    height_tl = config.positions.map.height;
    
    projection_timelapse = d3.geoMercator()
    .center([13.41, 52.51])
    .scale(config.positions.map.scale)
    .translate([width / 2, height / 2]);
    
    path_timelapse = d3.geoPath()
    .projection(projection_timelapse);
    
    timelapse_map = d3.select("#timelapse-map")
    .append("svg")
    .attr("width", width_tl)
    .attr("height", height_tl);
    
    dataLayer_tl = timelapse_map.append("g")
    .attr("id", "dataLayer_tl");
    
    //Setup year label
    year_label = d3.select("#year-label").append('text')
    .attr('transform','translate('+(0)+','+12+')')
    .text('Jahr');

    // Setup Legend Bar
    var scale = d3.select('#timelapse-map')
    .append('svg')
    .attr('id', 'scale-svg')
    .attr('width', (width / 2) + 100)
    .attr('height', 60);
    
    // Create the svg:defs element and the main gradient definition.
    var svgDefs = scale.append('defs');
    var mainGradient = svgDefs.append('linearGradient')
    .attr('id', 'mainGradient');
    
    // Create the stops of the main gradient. Each stop will be assigned
    // a class to style the stop using CSS.
    mainGradient.append('stop')
    .attr('class', 'stop-left')
    .attr('stop-color', config.colors[0])
    .attr('offset', '0');
    
    mainGradient.append('stop')
    .attr('class', 'stop-right')
    .attr('stop-color', config.colors[1])
    .attr('offset', '1');
    
    // Use the gradient to set the shape fill, via CSS.
    
    scale.append('rect')
    .classed('filled', true)
    .attr('x', 50)
    .attr('width', width / 2)
    .attr('height', 30);
    
    scale.append('text')
    .attr('x', 10)
    .attr('y', 25)
    .attr('fill', 'grey')
    .text(min + " %");
    
    scale.append('text')
    .attr('x', (width / 2) + 60)
    .attr('y', 25)
    .attr('fill', 'grey')
    .text(max + " %");
    
    scale.append('text')
    .attr('x', 80)
    .attr('y', 50)
    .attr('fill', 'grey')
    .text('% Grundsicherungsempfänger*innen');
    
    
    //Setup Tooltip
    var tooltip_tl = d3.select("#timelapse-map-wrapper").append("div")
    .attr('class', 'tooltip')
    .style('display', 'none');
    
    update(2006)
    
    function update(year
        ) {
            d3.csv("data/timelapse.csv")
            .then(function (data) {
                
                min = Infinity;
                max = 0;
                
                d3.json("data/lor_planungsraeume.geojson")
                .then(json => {
                    
                    var min = Infinity;
                    var max = 0;
                    
                    data.forEach(function (d) {
                        
                        var region = d.Kennung;
                        var value = +d['y' + [year
                        ]];
                        
                        if (value < min)
                        min = value
                        
                        if (value > max)
                        max = value
                        
                        json.features.forEach(function (e) {
                            var name = e.properties.spatial_name
                            if (name == region) {
                                e.properties.value = value;
                            }
                        })
                    })
                    
                    var color = d3.scaleLinear()
                    .range([config.colors[0], config.colors[1]])
                    .domain([0, 40]);
                    
                    // update map
                    
                    dataLayer_tl.selectAll("path").remove();
                    
                    
                    dataLayer_tl.selectAll("path")
                    .data(json.features)
                    .enter()
                    .append("path")
                    .attr("fill", function (d) { return color(d.properties.value); })
                    .attr("d", path_timelapse)
                    .on('mouseover', mouseover)
                    .on('mousemove', mousemove)
                    .on('mouseout', mouseout)
                    
                    // tooltips
                    function mouseover() {
                        tooltip_tl.style('display', 'block')
                        .style('position', 'absolute');
                    }
                    function mousemove() {
                        var d = d3.select(this).data()[0]
                        var mouse = d3.mouse(timelapse_map.node()).map(function (d) {
                            return parseInt(d);
                        });
                        tooltip_tl
                        .attr('style', 'left:' + (mouse[0] + 15) + 'px; top:' + (mouse[1] - 35) + 'px')
                        .html('<h3 class="tooltip--title">' + d.properties.spatial_alias + '</h3>' +
                        '<div class="tooltip--datawrapper"> <div class="tooltip--datawrapper--row">' +
                        '<p class="attr">%</p>' +
                        '<p class="value">' + d.properties.value + '</p>' +
                        '</div> </div>')
                        .style('left', (d3.event.pageX + 20) + 'px')
                        .style('top', (d3.event.pageY + 20) + 'px');
                    }
                    
                    function mouseout() {
                        tooltip_tl.style('display', 'none');
                    }
                    
                    year_label
                    .text('Jahr : ' + year);
                })
            })
            .catch(function (error) {
                console.log(error)
            })
        }
        
        d3.select("#slider")
        .on("input", function (d) { update(+this.value) })
    })
    .catch((err) => {
        console.log(err);
    });