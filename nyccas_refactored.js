
d3.csv("NYCCAS_DEC_Weather_Results.csv", convert, function(data) { 
		//create an array by starttime and pollutant
  	nestedByDate = d3.nest()
  		.key(function(d) { return d.parameter; })
			.key(function(d) { return d.StartTime; }).sortKeys(d3.descending)
  		// 	.key(function(d) { return d.StartTime; }).sortKeys(d3.descending)
			// .key(function(d) { return d.parameter; })
  		.entries(data);

  	initMap()
  	init(nestedByDate)
})

function init(data,pollutant) { 
		initGas = "CO ";
		//select svg
		svg = d3.select("#map").select("svg"),
		g = svg.append("g");
		//tooltip
		tooltip = d3.select("body").append("div").attr("class", "tooltip").style("opacity", 0);
		gases = d3.set(data.map(function(d) { return d["key"]})).values()
		//Filter pm2.5 data 
		var initGasData = data.filter(function(d) { return d["key"] == initGas})
		//Load pm2.5
		drawResults(initGasData,initGas)
		//Load buttons
		initButtons(gases)
	
}

function initButtons(keys) {
	//create buttons
  	var buttons = d3.select(".button").selectAll(".button")
	    .data(keys)
	    .enter()
	    .append("button")
	    .attr("class", "btn btn-default")
	    .text(function(d) { return d; })
	    .on("click", function(d) { 
	    	makeActive(d3.select(this));
	    	drawResults(nestedByDate,d); 
	    });
	   
	 	makeActive(buttons.filter(function(d) {return d == initGas})	 )
}

function initMap() {
		map = L.map('map').setView([40.71, -74.00], 10);
	//Initialize the SVG layer
		map._initPathRoot();   	 
	//specify tile map service 
		L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiemFrc2Nsb3NldCIsImEiOiJjaWdzZGh5ZjMwMmN1dGhrbnN6ZjFtb2NjIn0.x6b7Ra4Jdtbv38M9_uM2vQ', {
	    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
	    maxZoom: 18,
	    id: 'zakscloset.o4bigbgi',
	    accessToken: 'pk.eyJ1IjoiemFrc2Nsb3NldCIsImEiOiJjaWdzZGh5ZjMwMmN1dGhrbnN6ZjFtb2NjIn0.x6b7Ra4Jdtbv38M9_uM2vQ'
		}).addTo(map);
	//rescale/reposition data on zoom/pan		
		map.on("viewreset", update);
}

//Convert data points
function convert(d) {
		// Parse the date / time
		var parseDate = d3.time.format("%m/%d/%Y %H:%M").parse;
		//Add a LatLng object to each item in the dataset 
		d.LatLng = new L.LatLng(d.Latitude, d.Longitude);
		d.date = parseDate(d.StartTime);
		d.Value = +d.Value;

	return d;
} 

function drawResults(data,pollutant) {
		var thisPollutant = data.filter(function(d) {; return d["key"] == pollutant })

		//get the last date
		var lastDate = thisPollutant[0].values[0]
		lastDate.values.sort(function(d) { return d.Value } )
    //determine the extent of values for each pollutant
		var rExtentEach = d3.extent(lastDate.values.map(function(d) { return (+d.Value); })).sort(d3.ascending);
		var radius = d3.scale.ordinal().domain(rExtentEach).range([5, 10])
		colorScale = d3.scale.category10().domain(gases)
  	//DATA JOIN
  	pollutionData = svg.selectAll(".weatherCircle").data(function(d) { return lastDate.values });
    pollutionData.exit().remove().transition().style('opacity', 0);
    //NOTE: "r" needs to be defined on update\enter and not enter as d3
    //is comparing the number of entering items to those already existing and
    //therefore enter will not update previous items
    //ENTER
    pollutionData.enter()   
			.append("circle")
	    .attr("class", "weatherCircle")   
	    //.attr("r",function(d) { console.log(d); return radius(d.Value); })
	    .on("mouseover", function(d) { tooltips(d); mouseover(d3.select(this))})
	    .on("mouseout", function(d) { tooltip.style("opacity", 0); mouseout(d3.select(this));})
	    //ENTER + UPDATE
    	pollutionData.style("fill",function(d) { return colorScale(d.parameter) })
    		.attr("r",function(d) {return radius(d.Value); })

	    update(); 
	    weatherInfo(data,pollutant);
}

function mouseover(d) {
	var circle = d3.select(d)[0][0]
		radius = circle.attr("r")
		newRadius = +radius + 10
    circle.transition().duration(500).ease("sin")
        .attr("r",newRadius )
        .attr("stroke","rgba(230,230,230, .8)")
        .attr("stroke-width", 10 )
}

function mouseout(d) {
	var circle = d3.select(d)[0][0]
  	 circle.transition().duration(500).ease("sin")
	    .attr("r",radius)
	    .attr("stroke-width", 0)
}

function makeActive(selection) {
		d3.selectAll(".active").classed("active",false).attr('style','border: solid 0px black !important;')
		selection.classed("active",true).attr('style', 
			function(d){ return 'border: solid 2px ' + colorScale(d) + ' !important;' })
}

function tooltips(d) {
	 tooltip.html("<h4>" + d.Site + "</h4>" + "<br />" + d.Address + "<br />" 
	 		+ d.parameter + " = " + d.Value + " " + d.Units 
    	+ "<br />" + "Measured at " + d.Location + "<br />" + d.StartTime)
    .style("opacity", 0.8)
    .style("left", (d3.event.pageX)+40 + "px") 
    .style("top", (d3.event.pageY)-80 + "px");  
    tooltip.style("border","solid 2px " + colorScale(d.parameter))
}

//Update the location of circles
function update() {
		d3.selectAll(".weatherCircle").transition().duration(1000)
		.attr("transform", function(d) { return "translate("+ 
				map.latLngToLayerPoint(d.LatLng).x +","+ 
				map.latLngToLayerPoint(d.LatLng).y +")";
		})	
};

function weatherInfo(data,pollutant) {
		var current = data[0].values[0].values[0]
		var lastDate = current["StartTime"]
		console.log(lastDate)
		//print latest data collection date/time and weather info
		d3.select(".current-date").html("Air Monitoring Results for: <span class='pollutant-name'></span>");
		d3.select(".last-date").html(current["StartTime"]);
		d3.select(".current-cond").html(current["weather"]);
		d3.select(".current-temp").html(current["temp_f"] + " &deg;F");

		d3.select(".wind-info").html("Wind from the " + current["wind_dir"] + " at " + current["wind_mph"] + " mph, gusting to " + current["wind_gust_mph"] + " mph. Windchill at " + current["windchill_f"] + "&deg;F." + "<br />" + "(Observed @ " + current["station_id"] + ") ");
		//d3.select(".pollutant-name").html(data[0]["key"]);
		d3.select(".pollutant-name").append("text").text(pollutant).style("color",function(d) { return colorScale(pollutant) } )
}



 
