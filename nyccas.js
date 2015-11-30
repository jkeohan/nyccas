//set up leaflet
var map = L.map('map').setView([40.71, -74.00], 11);
//Initialize the SVG layer
	map._initPathRoot();   
 
//specify tile map service 
L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiemFrc2Nsb3NldCIsImEiOiJjaWdzZGh5ZjMwMmN1dGhrbnN6ZjFtb2NjIn0.x6b7Ra4Jdtbv38M9_uM2vQ', {
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
    maxZoom: 18,
    id: 'zakscloset.o4bigbgi',
    accessToken: 'pk.eyJ1IjoiemFrc2Nsb3NldCIsImEiOiJjaWdzZGh5ZjMwMmN1dGhrbnN6ZjFtb2NjIn0.x6b7Ra4Jdtbv38M9_uM2vQ'
}).addTo(map);
//select svg
var svg = d3.select("#map").select("svg"),
g = svg.append("g");
//tooltip
var tooltip = d3.select("body").append("div")   
    .attr("class", "tooltip")               
    .style("opacity", 0);
// Parse the date / time
var parseDate = d3.time.format("%m/%d/%Y %H:%M").parse;
queue()
    .defer(d3.csv, "NYCCAS_DEC_Weather_Results.csv")
    .await(ready);
function ready(error, data) {
	if (error) throw error;
	//console.log(data);
	
	//Add a LatLng object to each item in the dataset 
	data.forEach(function(d) {
		d.LatLng = new L.LatLng(d.Latitude,
								d.Longitude);
		//format date
		d.date = parseDate(d.StartTime);
		d.value = +d.Value;
	});
	// var transform = d3.geo.transform({ point: projectPoint }),
 //    	path = d3.geo.path().projection(transform);
  	//create an array by starttime and pollutant
  	var nestedByDate = d3.nest()
  			.key(function(d) { return d.StartTime; })
			.key(function(d) { return d.parameter; })
  			//.map(data);
  			.entries(data);
	//console.log(nestedByDate);
	//get the latest data for all pullutants
	var latest = Object(nestedByDate).reverse()[1];
	console.log(latest);
	//create buttons
  	var buttons = d3.select(".button").selectAll(".button")
	    .data(latest.values.map(function(d) { return (d.key); }))
	    .enter()
	    .append("button")
	    .attr("class", "btn btn-default")
	    .text(function(d) { return d; })
	    .on("click", function(d) { drawResults(d); });
	//get the latest data for pm2.5
	var pm25 = latest.values[7];
	console.log(pm25);
	//print latest data collection date/time and weather info
   	d3.select(".current-date").html("Air Monitoring Results for " + "<br />" + latest.key);
	d3.select(".current-cond").html(pm25.values[0]["weather"]);
	d3.select(".current-temp").html(pm25.values[0]["temp_f"] + " &deg;F");
	d3.select(".wind-info").html("Wind from the " + pm25.values[0]["wind_dir"] + " at " + pm25.values[0]["wind_mph"] + " mph, gusting to " + pm25.values[0]["wind_gust_mph"] + " mph. Windchill at " + pm25.values[0]["windchill_f"] + "&deg;F." + "<br />" + "(Observed @ " + pm25.values[0]["station_id"] + ") ");
	d3.select(".pollutant-name").html(pm25.key);
	//determine the extent of the pm2.5 values
	console.log(d3.extent(pm25.values.map(function(d) { return (d.Value);}))); 
	var rExtent = d3.extent(pm25.values.map(function(d) { return (d.value); }));
	console.log(rExtent);
	var radius = d3.scale.linear()
	    .domain(rExtent)
	    .range([5, 25]);
	        
	//append pm2.5 data		
	var weatherCircle = g.selectAll("circle")
		.data(pm25.values)
		.enter()
		.append("circle")
		.attr("class", "weatherCircle")
		.attr("r", function(d) { return radius(d.Value)})
		.on("mouseover", function(d){
	        tooltip.html("<h4>" + d.Site + "</h4>" + "<br />" + d.Address + "<br />" + d.parameter + " = " + d.Value + " " + d.Units 
	        	+ "<br />" + "Measured at " + d.Location + "<br />" + d.StartTime)
	        .style("opacity", 0.8)
	        .style("left", (d3.event.pageX)+6 + "px") 
	        .style("top", (d3.event.pageY)-80 + "px");    
      	})
      	.on("mouseout", function(d) {      
          	tooltip.style("opacity", 0);   
      	});
	//rescale/reposition data on zoom/pan		
	map.on("viewreset", update);
	update();
	//function to update the location of circles
	function update() {
		weatherCircle.attr("transform", function(d) { 
			return "translate("+ 
				map.latLngToLayerPoint(d.LatLng).x +","+ 
				map.latLngToLayerPoint(d.LatLng).y +")";
		})		
	};
	//draw line chart for pm2.5
	function drawLinechart(pm25) {
		
	}
	//update the map on button-click
	//(I'm using the raw data instead of nested data for this function for now. Will update this code later.)
	function drawResults(pollutant) {
		// var co = latest.values[0];
		//var thisPollutant = latest.values; 		
		var thisPollutant = data.filter(function(d) { return d.parameter === pollutant; });
		//console.log(thisPollutant);
		//get the last date
		var lastDate = thisPollutant.map(function(d) { return d.StartTime; });
		var thisLatestPollutant = thisPollutant.filter(function(d) { return d.StartTime === lastDate[lastDate.length-1]; });
    	console.log(thisLatestPollutant);
    	//determine the extent of values for each pollutant
		console.log(d3.extent(thisLatestPollutant.map(function(d) { return (d.Value);}))); 
		var rExtentEach = d3.extent(thisLatestPollutant.map(function(d) { return (d.value); }));
		console.log(rExtentEach);
		var radiusEach = d3.scale.linear()
		    .domain(rExtentEach)
		    .range([5, 25]);
    		
    	//read data join
    	pollutionData = svg.selectAll(".weatherCircle")
        	.data(thisLatestPollutant);
        pollutionData.exit().remove()
	    	.transition()
	    	.style('opacity', 0);
	    // enter NEW elements from data join
	    pollutionDataEnter = pollutionData.enter()   
	        .append("g")
			.append("circle")
	    	.attr("class", "weatherCircle")
	        .attr("r", function(d) { return radiusEach(d.Value); })
	        .on("mouseover", function(d){
	        tooltip.html("<h4>" + d.Site + "</h4>" + "<br />" + d.Address + "<br />" + d.parameter + " = " + d.Value + " " + d.Units 
	        	+ "<br />" + "Measured at " + d.Location + "<br />" + d.StartTime)
	        .style("opacity", 0.8)
	        .style("left", (d3.event.pageX)+6 + "px") 
	        .style("top", (d3.event.pageY)-80 + "px");    
      	})
      	.on("mouseout", function(d) {      
          	tooltip.style("opacity", 0);   
      	});
		//rescale/reposition data on zoom/pan		
		map.on("viewreset", updateEach);
		updateEach();
		//function to update the location of circles
		 function updateEach() {
			pollutionData = svg.selectAll(".weatherCircle")
		        .transition()
		        .duration(1000)
		        .attr("transform", function(d) {
		          return "translate("+ 
					map.latLngToLayerPoint(d.LatLng).x +","+ 
					map.latLngToLayerPoint(d.LatLng).y +")";
				})	
				.select(".weatherCircle")
				.attr("r", function(d) { return radiusEach(d.Value); })
				// .style("opacity", 0.7)
				// .attr("fill", "red");
		};
	    //print pollutant name on title
	    d3.select(".pollutant-name")   
	      .text([pollutant]);   
  	}
};
