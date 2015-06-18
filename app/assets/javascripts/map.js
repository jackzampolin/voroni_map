// d3.js custom API
var voroni = (function(){
  return {
    // Creates the polygons from the points given for the stations
    map: function(stations){
      var vertices = stations.map(function(station){ return station.coords });
      var bounds = map.getBounds();
      var voroni = d3.geom.voronoi().clipExtent([
        [bounds._southWest.lat,bounds._southWest.lng],
        [bounds._northEast.lat,bounds._northEast.lng]
      ]);
      return voroni(vertices);
    },
  };
})();

// All helper functions for event cascade
var helpers = (function(){
  return {
    // Sets the map with the key sent in from the controller
    setMap: function(key){
      L.mapbox.accessToken = key;
      map = L.mapbox.map('map', 'mapbox.streets')
        .setView([37.767662,-122.444759],13);
    },
    // Draws the feature layer
    drawPolys: function(data,attribute){
      // Increment counter
      var count = helpers.counter.inc();
      // Remove previously placed station layers
      map.eachLayer(function(layer){
        if (layer._layers){
          if (Object.keys(layer._layers).length > 40){
            return map.removeLayer(layer);
          };
        };
      });
      // Set up variables for polygons
      var layer = L.mapbox.featureLayer();
      var stations = data.payload;
      var colors = data.colors[attribute];
      var polys = voroni.map(stations);
      // Draw Polys and add them to feature layer
      for(var i = 0; i < polys.length; i++){
        var stat = stations[i][attribute][count];
        var poly = L.polygon(polys[i],{
          weight: 2,
          color: colors[stat],
          fillColor: colors[stat],
          fillOpacity: 0.3
        });
        poly.addTo(layer)
      }
      // Add layer to map.
      layer.addTo(map);
    },
    // Counter to iterate thru the temp arrays
    counter: (function() {
      var privateCounter = 0;
      return {
        inc: function() {
          privateCounter++;
          if (privateCounter > 35) {
            privateCounter = 0;
          };
          return privateCounter;
        },
        value: function(){ return privateCounter },
        reset: function(){ privateCounter = 0; return 0 },
      };
    })(),
    setLS: function(data){
      localStorage.data = JSON.stringify(data);
    },
    data: function(){
      return JSON.parse(localStorage.data);
    },
    setScale: function(colors){
      // Clear out target div
      if ($('#scale').children().length > 0){
        $('#scale').html('');
      };
      // Get the different pieces for the new divs
      var keys = Object.keys(colors);
      var cold = keys.shift();
      var hot = keys.pop();
      var middle = keys[Math.round(keys.length/2)];
      // Create divs
      cold = $('<a></a>').html(cold).attr('class','waves-effect waves-light btn col s4').css('background-color', colors[cold]);
      middle = $('<a></a>').html(middle).attr('class','waves-effect waves-light btn col s4').css('background-color', colors[middle]);
      hot = $('<a></a>').html(hot).attr('class','waves-effect waves-light btn col s4').css('background-color', colors[hot]);
      // Append divs
      $('#scale').prepend(hot, middle, cold)
    },
    windShapes: function(data){
      // Increment counter
      var count = helpers.counter.inc();
      // Remove previously placed station layers
      map.eachLayer(function(layer){
        if (layer._layers){
          if (Object.keys(layer._layers).length > 40){
            return map.removeLayer(layer);
          };
        };
      });
      //
      var layer = L.mapbox.featureLayer();
      var stations = data.payload;
      var colors = data.colors.wspd;
      // Draw circles and add them to feature layer
      for(var i = 0; i < stations.length ; i++){
        var station = stations[i]
        var stat = station.wspd[count];
        console.log(i)
        console.log(station.coords)
        var circle = L.circleMarker(
          {
            radius: station.wspd[count],
            weight: 2,
            color: colors[stat],
            fillColor: colors[stat],
            fillOpacity: 0.3
          });
        circle.setLatLng(station.coords)
        circle.setRadius(station.wspd[count])
        console.log(circle)
        circle.addTo(layer)
      }
      // Add layer to map.
      layer.addTo(map);
    },
  };
})();

// Initializes the needed functions on the page
var init = (function(){
  // Makes AJAX call and sets map with initial layer on it
  return {
    map: function(){
      $.get('/stations').done(function(data){
        helpers.setLS(data);
        helpers.setMap(data.key);
        helpers.setScale(data.colors.temp)
        intervalID = setInterval(function(){
          helpers.drawPolys(data, 'temp');
        }, 200);
      });
    },
    eventListeners: function(){
      $('#controls a').on('click',function(e){
        clearInterval(intervalID);
        var attribute = $(this).attr('id');
        var data = helpers.data();
        if (attribute === 'temp' || attribute === 'feelslike') {
          helpers.counter.reset();
          helpers.setScale(data.colors[attribute]);
          intervalID = setInterval(function(){
            helpers.drawPolys(data, attribute);
          }, 200);
        } else if ( attribute === 'wind' ) {
          helpers.counter.reset();
          $('#scale').html('');
          helpers.windShapes(data)
          // intervalID = setInterval(function(){
          //   helpers.windShapes(data)
          // });
        }
      });
    },
  };
})();

// Document ready.  Calling all the priorly defined functions
$(function(){
  var map, intervalID;
  init.map();
  init.eventListeners();
});
