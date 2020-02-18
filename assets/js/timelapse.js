document.addEventListener('DOMContentLoaded',function() {
    
    const style = window.getComputedStyle(document.getElementById("intro"), null);
    const padding_total = parseFloat(style['paddingLeft'].replace('px', '')) * 2;
    const width_temp = parseFloat(style['width']);
    const width = width_temp * 1;
    const height = width * 0.85;
    
    var timelapse_map = null;
    var dataLayer_tl = null;
    var projection_timelapse = null;
    var path_timelapse = null;
    var tooltip_tl = null;
    var year_label = null;
    
    var min = 0;
    var max = 30;
    
    d3.json("config.json")
    .then(function(_config) {
        config = _config;
        
        d3.json("data/xii.geojson")
        .then(function(data) {
            
            projection_timelapse = d3.geoMercator()
            .fitSize([width, height], data);
            
            path_timelapse = d3.geoPath()
            .projection(projection_timelapse);
            
            
            
        })
        
        timelapse_map = d3.select("#timelapse-map")
        .append("svg")
        .attr("width", width)
        .attr("height", height);
        
        dataLayer_tl = timelapse_map.append("g")
        .attr("id", "dataLayer_tl")
        .attr("width", width)
        .attr("height", height);
        
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
        .attr('class', 'stop-center')
        .attr('stop-color', config.colors[1])
        .attr('offset', '0.5');

        mainGradient.append('stop')
        .attr('class', 'stop-right')
        .attr('stop-color', config.colors[2])
        .attr('offset', '1');
        
        // Use the gradient to set the shape fill, via CSS.
        
        scale.append('rect')
        .classed('filled', true)
        .attr('x', 40)
        .attr('width', width * 0.2)
        .attr('height', 10);
        
        scale.append('text')
        .attr('class', 'axis-label')
        .attr('x', 0)
        .attr('y', 10)
        .text(min + " %");
        
        scale.append('text')
        .attr('class', 'axis-label')
        .attr('x', width * 0.2 + 60)
        .attr('y', 10)
        .text(max + " %");
        
        scale.append('text')
        .attr('class', 'axis-label')
        .attr('x',0)
        .attr('y', 30)
        .text('% Grundsicherungsempfänger*innen');
        
        //Setup Tooltip
        tooltip_tl = d3.select("#timelapse-map-wrapper").append("div")
        .attr('class', 'tooltip')
        .style('display', 'none');
        
        // define starting year
        update(2006)
        
        function update(year
            ) {
                d3.csv("data/timelapse.csv")
                .then(function (data) {
                    
                
                    d3.json("data/lor_planungsraeume.geojson")
                    .then(function(json) {
                        
                        data.forEach(function (d) {
                            
                            var region = d.Kennung;
                            var value = +d['y' + [year
                            ]];
                            
                            json.features.forEach(function (e) {
                                var name = e.properties.spatial_name
                                if (name == region) {
                                    e.properties.value = value;
                                }
                            })
                        })
                        
                        var color = d3.scaleLinear()
                        .range(config.colors)
                        .domain([0, max/2, max]);
                        
                        // update map
                        
                        dataLayer_tl.selectAll("path").remove();
                        
                        
                        dataLayer_tl.selectAll("path")
                        .data(json.features)
                        .enter()
                        .append("path")
                        .attr("fill", function(d) {return isNaN(d.properties.value) ? '#c2c2c2' : color(d.properties.value);})
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
                        
                        // name below slider
                        year_label
                        .text('Jahr: ' + year);
                    })
                })
                .catch(function (error) {
                    console.log(error)
                })
            }
            
            d3.select("#slider")
            .on("input", function () { update(+this.value) })
            
            
        })
        .catch(function(err) {
            console.log(err);
        });
        
    })