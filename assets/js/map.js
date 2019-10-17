document.addEventListener('DOMContentLoaded',function() {
	
	
	const style = window.getComputedStyle(document.getElementById("intro"), null);
	const padding_total = parseFloat(style['paddingLeft'].replace('px', '')) * 2;
	const width_temp = parseFloat(style['width']);
	const width = width_temp - padding_total;
	const height = width * 0.7;
	
	
	let config,
	map,
	projection,
	path,
	dataLayer = false,
	navContent,
	navMap,
	state = {
		content:0,
		map:0
	},
	lang = 0,
	tooltip_map;
	
	d3.json("config.json")
	.then((_config) => {
		config = _config;
		
		
		
		d3.json("data/xii.geojson")
		.then(data => {
			
			// Setup Map
			projection = d3.geoMercator()
			.fitSize([width, height], data);
			
			path = d3.geoPath()
			.projection(projection);
			
			map = d3.select("#map")
			.append("svg")
			.attr("id", "map-svg")
			.attr("width", width)
			.attr("height", height);
			
			dataLayer = map.append("g")
			.attr("id", "dataLayer");
			
			
			
			//Setup Tooltip
			navContent = d3.select("#main-navigation")
			.selectAll("li")
			.data(config.content)
			.enter()
			.append("li")
			.text((d) => d.nav[lang])
			.on("click", (d, i) => {
				updateNav(i, 0);
				// updateOverlay(1);
				// console.log('click')
			});
			
			tooltip_map = d3.select("#map-wrapper").append('div')
			.attr('class', 'tooltip')
			.style('display', 'none');
			
			
			// Setup Navigation
			updateNav(0,0);
			
			// Setup Legend Bar
			var scale = d3.select('#map')
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
			.attr('width', width * 0.4)
			.attr('height', 30);
			
			scale.append('text')
			.attr('class', 'axis-label')
			.attr('x', 10)
			.attr('y', 25)
			.text('0 %')
			
			scale.append('text')
			.attr('class', 'axis-label')
			.attr('x', width * 0.4 + 60)
			.attr('y', 25)
			.text('40 %');
			
			scale.append('text')
			.attr('class', 'axis-label')
			.attr('x', 50)
			.attr('y', 50)
			.text('% Grundsicherungsempfänger*innen');
			
		})
	})
	.catch((err) => {
		console.log(err);
	});
	
	const updateNav = (contentState, mapState) => {
		state.content = contentState;
		state.map = mapState;
		
		navContent
		.classed("active", (d,i) => (i===state.content) ? true : false);
		
		d3.selectAll("#sub-navigation *").remove();
		
		navMap = d3.select("#sub-navigation")
		.selectAll("li")
		.data(config.content[state.content].maps)
		.enter()
		.append("li")
		.text((d) => d.nav[lang])
		.classed("active", (d,i) => (i===state.map) ? true : false)
		.on("click", (d, i) => {
			updateNav(state.content, i);
		});
		
		makeMap(state.content, state.map);
	}
	
	
	
	const makeMap = (contentId, mapId) => {
		const mapConfig = config.content[contentId].maps[mapId];
		
		// Set Texts
		d3.select("#content-topic").html(config.content[contentId].title[lang]);
		d3.select("#content-title").html(mapConfig.title[lang]);
		d3.select("#content-description").html(mapConfig.description[lang]);
		
		dataLayer.selectAll("*").remove();
		
		// Make Map
		
		d3.json("data/" + mapConfig.data)
		.then(data => {
			
			// make sure the attribute column is a number
			data.features.forEach((d) => {
				d.properties[mapConfig.attribute] = parseFloat(d.properties[mapConfig.attribute]);
			});
			
			const scale = d3.scaleLinear()
			.domain(("extent" in mapConfig) ? mapConfig.extent : [0, 40]) //d3.extent(data.features, (d) => d.properties[mapConfig.attribute]
			.range(("colors" in mapConfig) ? mapConfig.colors : ["#98FB98", "#FF0000"]);
			
			// tooltips
			function mouseover(){
				tooltip_map.style('display', 'block')
				.style('position', 'absolute');
			}
			function mousemove(){
				var d = d3.select(this).data()[0]
				var selected_map = config.content[0].maps[state.map].attribute
				tooltip_map
				.html('<h3 class="tooltip--title">' + d.properties.Name + '</h3>' + 
				'<div class="tooltip--datawrapper"> <div class="tooltip--datawrapper--row">' +
				'<p class="attr">%</p>' +
				'<p class="value">' + d.properties[mapConfig.attribute] + '</p>' +
				'</div> </div>')
				.style('left', (d3.event.pageX + 20) + 'px')
				.style('top', (d3.event.pageY + 20) + 'px');
			}
			
			function mouseout(){
				tooltip_map.style('display', 'none');
			}
			
			dataLayer.selectAll("path")
			.data(data.features)
			.enter()
			.append("path")
			.attr("d", path)
			.on('mouseover', mouseover)
			.on('mousemove', mousemove)
			.on('mouseout', mouseout)
			.attr("fill", (d) => {return isNaN(d.properties[mapConfig.attribute]) ? '#383838' :
			scale(d.properties[mapConfig.attribute]);
		});
	})
	.catch((err) => {
		console.log(err);
	})
}
})