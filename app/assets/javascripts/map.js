// Global variables
var map, interval, speed = 500;

// Code to draw the various overlays
var m = (function(){
  // Holds all the different map popups for the various overlays.
  var popups = (function(){
    // makes the popup legend for the temp and feels like layers
    var temp = function(poly,station,stat){
      var stationLink = "http://www.wunderground.com/personal-weather-station/dashboard?ID="+station.name
      poly.bindPopup('<p><a target="_blank" href="'+stationLink+'">'+station.name+'</a></p><p class="center-align">'+stat+'°F</p>')
    };
    // makes the popup legend for the wind layer
    var wind = function(marker,station,stat){
      var stationLink = "http://www.wunderground.com/personal-weather-station/dashboard?ID="+station.name
      marker.bindPopup('<p><a target="_blank" href="'+stationLink+'">'+station.name+'</a></p><p class="center-align">'+stat+' MPH</p>')
    };
    // makes the popup legend for the cloud layer
    var clouds = function(poly,station,stat){
      var stationLink = "http://www.wunderground.com/personal-weather-station/dashboard?ID="+station.name;
      poly.bindPopup('<p><a target="_blank" href="'+stationLink+'">'+station.name+'</a></p><p class="center-align">'+stat+'</p>')
    };
    return {
      temp: temp,
      wind: wind,
      clouds: clouds,
    };
  })();
  // Clears map of layers with over 40 sub-layers.
  var clearMap = function(){
    map.eachLayer(function(layer){
      if (layer._layers){
        if (Object.keys(layer._layers).length > 40){
          return map.removeLayer(layer);
        };
      };
    });
  };
  // Makes the station coords into GeoJSON polys.
  var voroni = function(stations){
    var vertices = stations.map(function(station){
      return station.coords
    });
    var bounds = map.getBounds();
    var voroni = d3.geom.voronoi().clipExtent([
      [bounds._southWest.lat,bounds._southWest.lng],
      [bounds._northEast.lat,bounds._northEast.lng]
    ]);
    return voroni(vertices);
  };
  // Sets map with provided key.
  var set = function(key){
    L.mapbox.accessToken = key;
    map = L.mapbox.map('map', 'mapbox.streets')
      .setView([37.767662,-122.444759],13);
  };
  // Draws polygons for the feelslike and temp layers.
  var temp = function(data, attribute, count){
    // Remove previously placed station layers
    clearMap();
    // Set up variables for polygons
    var layer = L.mapbox.featureLayer();
    var stations = data.payload;
    var colors = data.colors[attribute];
    var polys = voroni(stations);
    var lastStat = null;
    // Draw Polys and add them to feature layer
    for(var i = 0; i < polys.length; i++){
      var station = stations[i];
      var attr = station[attribute];
      var stat = attr[count];
      if (stat) {
        lastStat = stat;
      } else {
        stat = lastStat;
      };
      var poly = L.polygon(polys[i],{
        weight: 2,
        color: colors[stat],
        fillColor: colors[stat],
        fillOpacity: 0.3
      });
      popups.temp(poly,station,stat);
      poly.addTo(layer)
    }
    // Add layer to map.
    layer.addTo(map);
  };
  // Draws circles and arrows for the wind layer.
  var wind = function(data,count){
    // Remove previously placed station layers
    clearMap();
    // Initialize variables
    var layer = L.mapbox.featureLayer();
    var stations = data.payload;
    var colors = data.colors.wspd;
    // Draw circles and add them to feature layer
    for(var i = 0; i < stations.length ; i++){
      var station = stations[i];
      var wspd = station.wspd[count];
      var wdir = station.wdir[count];
      var arrowUrl = 'http://www.clipartbest.com/cliparts/RcA/7ax/RcA7axMRi.png'
      if (wspd) {
        var circle = L.circleMarker(station.coords, {
          weight: 2,
          color: colors[wspd],
          fillColor: colors[wspd],
          fillOpacity: 0.3
        });
        circle.setRadius(wspd)
        circle.addTo(layer)
        if (wdir) {
          var marker = L.marker(station.coords)
          var arrow = L.icon({
            iconUrl: arrowUrl,
            iconSize: [24,24],
            className: 'arrows',
          });
          marker.setIcon(arrow);
          popups.wind(marker,station,wspd);
          marker.addTo(layer);
        }

      }
    }
    // Add layer to map.
    layer.addTo(map);
    // Rotate the arrows to face where wind is blowing
    $('.arrows').each(function(i){
      var station = stations[i];
      this.style.transform += 'rotate('+station.wdir[count]+'deg)';
    });
  };
  // Draws polygons for the cloud layer.
  var clouds = function(data, count) {
    // Remove previously placed station layers
    clearMap();
    // Set up variables for polygons
    var layer = L.mapbox.featureLayer();
    var stations = data.payload;
    // Opacities map to conditions codes.  Cloud cover
    var opacities = {
      1: [0,'Clear'],
      2: [.25,'Partly Cloudy'],
      3: [.5,'Mostly Cloudy '],
      4: [.75,'Cloudy'],
      5: [.25,'Hazy'],
      6: [.5,'Foggy'],
      10: [.5,'Chance of Showers'],
      11: [.75,'Showers'],
      12: [.5,'Chance of Rain'],
      13: [.75,'Rain'],
      14: [.25,'Chance of a Thunderstorm'],
      15: [.75,'Thunderstorm']
    }
    var polys = voroni(stations);
    var lastStat = null;
    // Draw Polys and add them to feature layer
    for(var i = 0; i < polys.length; i++){
      var station = stations[i];
      var stat = station.fctcode[count];
      if (stat) {
        lastStat = stat;
      } else {
        stat = lastStat;
      };
      var opacity = opacities[stat];
      var poly = L.polygon(polys[i],{
        weight: 2,
        color: "#5E5E5E",
        fillColor: "#5E5E5E",
        fillOpacity: opacity[0],
      });
      popups.clouds(poly,station,opacity[1]);
      poly.addTo(layer)
    }
    // Add layer to map.
    layer.addTo(map);
  };
  return {
    set: set,
    temp: temp,
    wind: wind,
    clouds: clouds,
  }
})();

// Storage for data from backend.
var store = (function(){
  // Persistance variables
  var data, colors, stations, time;
  // Set the previously initialized variables
  var set = function(rawJSON){
    data = rawJSON;
    colors = rawJSON.colors;
    payload = rawJSON.payload;
    time = new Date(rawJSON.payload[0].start_time[0] * 1000);
  };
  // Public facing get data call.
  var get = function(){
    return { colors: colors, payload: payload }
  };
  // Returns a JS Time object.
  var time = function(){
    return time;
  };
  return {
    set: set,
    get: get,
    time: time,
  };
})();

// The scale and time related functions live here
var legend = (function(){
  // Takes the raw hour number and converts to string reping time
  var formatTime = function(num){
    if (num < 1){
      return "12:00 AM Today";
    } else if (num < 13){
      return num + ":00 AM Today";
    } else if (num < 25){
      return (num - 12) + ":00 PM Today";
    } else if (num < 37){
      return (num - 24) + ":00 AM Tomorrow";
    } else {
      return (num - 36) + ":00 PM Tomorrow";
    };
  };
  // A piece of reused code from the scale functions
  var spacer = $('<div class="col s3">F</div>').css('color','white');
  // Clears the '#scale' div
  var clearScale = function(){
    if ($('#scale').children().length > 0){
      $('#scale').html('');
    };
  };
  // Resets the '#clock' to the proper time based on counter
  var clock = function(counter){
    var time = store.time().getHours();
    $('#time').html(formatTime(time + counter))
  };
  // Scale for the temp layer
  var temp = function(colors){
    clearScale();
    // Get the different pieces for the new divs
    var keys = Object.keys(colors);
    var things = [keys.shift(),keys[Math.round(keys.length/2)],keys.pop()];
    // Function to generate scale divs
    var values = function(index){
      var value = things[index];
      return $('<a></a>').html(value+'°F')
                .attr('class','btn col s2')
                .css('background-color', colors[value]);
    };
    // Append divs
    $('#scale').prepend(
      values(0),
      spacer.clone(),
      values(1),
      spacer.clone(),
      values(2)
    );
  };
  // Scale for the wind layer
  var wind = function(colors){
    clearScale();
    // Get the different pieces for the new divs
    var keys = Object.keys(colors);
    var things = [keys.shift(),keys[Math.round(keys.length/2)],keys.pop()];
    // Function to generate scale divs
    var values = function(index){
      var value = things[index];
      return $('<a></a>').html(value+' MPH')
                .attr('class','btn col s2')
                .css('background-color', colors[value]);
    };
    // Append divs
    $('#scale').prepend(
      values(0),
      spacer.clone(),
      values(1),
      spacer.clone(),
      values(2)
    );
  };
  // Scale for the clouds layer
  var clouds = function(){
    clearScale();
    // Create divs
    var values = function(index){
      var grey = "#5E5E5E"
      var key = [
        {text: 'Scattered', opacity: '0.25'},
        {text: 'Mostly', opacity: '0.5'},
        {text: 'Overcast', opacity: '0.75'},
      ]
      var value = key[index]
      return $('<a></a>')
                .html(value.text)
                .attr('class','btn col s2')
                .css('background-color', grey)
                .css('opacity',value.opacity);
    }
    // Append divs
    $('#scale').prepend(
      values(0),
      spacer.clone(),
      values(1),
      spacer.clone(),
      values(2)
    );
  };
  return {
    clock: clock,
    temp: temp,
    wind: wind,
    clouds: clouds,
  };
})();

// Allow for animation of the previously defined map layers.
var views = (function(){
  // Counter in closure for the animation.
  var counter = (function() {
    var privateCounter = 0;
    return {
      inc: function() {
        privateCounter++;
        if (privateCounter > 35) {
          privateCounter = 0;
        };
        return privateCounter;
      },
      dec: function(){
        privateCounter--;
        if (privateCounter < 0) {
          privateCounter = 35;
        };
        return privateCounter;
      },
      value: function(){ return privateCounter },
      reset: function(){ privateCounter = 0; return 0 },
    };
  })();
  // Repeated logic in the views is here
  var layers = (function(){
    var temp = function(attribute,data,count){
      m.temp(data, attribute, count);
      legend.clock(counter.value());
    };
    var wind = function(data, count){
      m.wind(data, count);
      legend.clock(counter.value());
    };
    var clouds = function(data, count){
      m.clouds(data,count);
      legend.clock(counter.value());
    };
    var clear = function(){
      $('body').off();
      $('#ff').off();
      $('#rw').off();
    };
    return {
      temp: temp,
      wind: wind,
      clouds: clouds,
      clear: clear,
    }
  })();
  // Sets up controls and views for the temp layer
  var temp = function(attribute){
    // Set up data in local environment
    var data = store.get();
    // Reset counter to beginning of dataset
    counter.reset();
    // Set up legend
    legend.temp(data.colors[attribute]);
    // Put down the first layer
    layers.temp(attribute,data,counter.value());
    // Clear old event listeners
    layers.clear();
    // Start animation and set interval
    interval = setInterval(function(){
        layers.temp(attribute,data,counter.inc());
      },speed);
    // Arrows and key movements to interact with map
    $('#ff').on('click',function(){
      if(interval) { clearInterval(interval) };
      layers.temp(attribute,data,counter.inc());
    });
    $('#rw').on('click',function(){
      if(interval) { clearInterval(interval) };
      layers.temp(attribute,data,counter.dec());
    });
    $('body').keyup(function(e){
      // left arrow key
      if (e.keyCode === 37) {
        if(interval) { clearInterval(interval) };
        layers.temp(attribute,data,counter.dec());
      };
      // right arrow key
      if (e.keyCode === 39) {
        if(interval) { clearInterval(interval) };
        layers.temp(attribute,data,counter.inc());
      };
    });
  };
  // Sets up controls and views for the wind layer
  var wind = function(){
    // Set up data in local environment
    var data = store.get();
    // Reset counter to beginning of dataset
    counter.reset();
    // Set up legend
    legend.wind(data.colors.wspd);
    // Clear old event listeners
    layers.clear();
    // Start animation and set interval
    interval = setInterval(function(){
        layers.wind(data,counter.inc());
      },speed);
    // Arrows and key movements to interact with map
    layers.wind(data, counter.value());
    $('#ff').on('click',function(){
      if(interval) { clearInterval(interval) };
      layers.wind(data, counter.inc());
    })
    $('#rw').on('click',function(){
      if(interval) { clearInterval(interval) };
      layers.wind(data, counter.dec());
    });
    $('body').keyup(function(e){
      // left arrow key
      if (e.keyCode === 37) {
        if(interval) { clearInterval(interval) };
        layers.wind(data, counter.dec());
      };
      // right arrow key
      if (e.keyCode === 39) {
        if(interval) { clearInterval(interval) };
        layers.wind(data, counter.inc());
      };
    });
  };
  // Sets up controls and views for the clouds layer
  var clouds = function(){
    // Set up data in local environment
    var data = store.get();
    // Reset counter to beginning of dataset
    counter.reset();
    // Set up legend
    legend.clouds();
    // Clear old event listeners
    layers.clear();
    // Put down the first layer
    layers.clouds(data, counter.value());
    // Start animation and set interval
    interval = setInterval(function(){
        layers.clouds(data,counter.inc());
      },speed);
    // Arrows and key movements to interact with map
    $('#ff').on('click',function(){
      if(interval) { clearInterval(interval) };
      layers.clouds(data, counter.inc());
    })
    $('#rw').on('click',function(){
      if(interval) { clearInterval(interval) };
      layers.clouds(data, counter.dec());
    });
    $('body').keyup(function(e){
      // left
      if (e.keyCode === 37) {
        if(interval) { clearInterval(interval) };
        layers.clouds(data, counter.dec());
      };
      // right
      if (e.keyCode === 39) {
        if(interval) { clearInterval(interval) };
        layers.clouds(data, counter.inc());
      };
    });
  };
  return {
    temp: temp,
    wind: wind,
    clouds: clouds,
  }
})();

// Groups and calls the proceeding modules
var init = (function(){
  var page = function(){
    $.get('/stations').done(function(data){
      // Sets data from backend in local storage
      store.set(data);
      // Initializes the map
      m.set(data.key);
      // Starts with temp layer
      views.temp('temp')
    });
  };
  var controls = function(){
    $('#controls a').on('click',function(e){
      var attribute = $(this).attr('id');
      if (attribute === 'temp' || attribute === 'feelslike') {
        // Use temp layer and control for feelslike and temp
        if(interval){ clearInterval(interval) };
        views.temp(attribute);
      } else if ( attribute === 'wind' ) {
        // Use wind layer and control for wind
        if(interval){ clearInterval(interval) };
        views.wind();
      } else if ( attribute === 'clouds' ) {
        // Use cloud layer and control for cloud
        if(interval){ clearInterval(interval) };
        views.clouds();
      };
    });
  };
  return {
    page: page,
    controls: controls,
  };
})();

// Document ready.  Calling all the priorly defined functions
$(function(){
  init.page();
  init.controls();
});