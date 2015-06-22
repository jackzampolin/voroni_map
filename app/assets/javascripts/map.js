  // All map related functions
var m = (function(){
  // Properly formats the geojson
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
  // Sets map with provided key
  var setMap = function(key){
    L.mapbox.accessToken = key;
    map = L.mapbox.map('map', 'mapbox.streets')
      .setView([37.767662,-122.444759],13);
    L.RotatedMarker = L.Marker.extend({
      options: { angle: 0 },
      _setPos: function(pos) {
        L.Marker.prototype._setPos.call(this, pos);
        if (L.DomUtil.TRANSFORM) {
          // use the CSS transform rule if available
          this._icon.style[L.DomUtil.TRANSFORM] += ' rotate(' + this.options.angle + 'deg)';
        } else if (L.Browser.ie) {
          // fallback for IE6, IE7, IE8
          var rad = this.options.angle * L.LatLng.DEG_TO_RAD,
          costheta = Math.cos(rad),
          sintheta = Math.sin(rad);
          this._icon.style.filter += ' progid:DXImageTransform.Microsoft.Matrix(sizingMethod=\'auto expand\', M11=' +
            costheta + ', M12=' + (-sintheta) + ', M21=' + sintheta + ', M22=' + costheta + ')';
        }
      }
    });
  };
  // draws polygons for the feelslike and temp layers
  var drawPolys = function(data, attribute, count){
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
    var polys = voroni(stations);
    var lastStat = null;
    // Draw Polys and add them to feature layer
    for(var i = 0; i < polys.length; i++){
      var station = stations[i];
      var attr = station[attribute];
      var stat = attr[count];
      if (stat) {
        lastStat = stations[i][attribute][count];
      } else {
        stat = lastStat;
      };
      var poly = L.polygon(polys[i],{
        weight: 2,
        color: colors[stat],
        fillColor: colors[stat],
        fillOpacity: 0.3
      });
      var stationLink = "http://www.wunderground.com/personal-weather-station/dashboard?ID="
      poly.bindPopup('<p><a target="_blank" href="'+stationLink+station.name+'">'+station.name+'</a></p><p class="center-align">'+stat+'°F</p>')
      poly.addTo(layer)
    }
    // Add layer to map.
    layer.addTo(map);
  };
  var windShapes = function(data,count){
    // Remove previously placed station layers
    map.eachLayer(function(layer){
      if (layer._layers){
        if (Object.keys(layer._layers).length > 40){
          return map.removeLayer(layer);
        };
      };
    });

    // Initialize variables
    var layer = L.mapbox.featureLayer();
    var stations = data.payload;
    var colors = data.colors.wspd;
    // Draw legend
    legend.scale(' MPH',colors);
    // Draw circles and add them to feature layer
    for(var i = 0; i < stations.length ; i++){
      var station = stations[i];
      var stat = station.wspd[count];
      if (stat) {
        var circle = L.circleMarker(station.coords, {weight: 2,color: colors[stat], fillColor: colors[stat], fillOpacity: 0.3 });
        circle.setRadius(stat)
        circle.addTo(layer)
        if (station.wdir[count]) {
          var marker = L.marker(station.coords)
          var arrow = L.icon({
            iconUrl: 'http://www.clipartbest.com/cliparts/RcA/7ax/RcA7axMRi.png',
            iconSize: [24,24],
            className: 'arrows',
          });
          marker.setIcon(arrow);
          var stationLink = "http://www.wunderground.com/personal-weather-station/dashboard?ID="
          marker.bindPopup('<p><a target="_blank" href="'+stationLink+station.name+'">'+station.name+'</a></p><p class="center-align">'+stat+' MPH</p>')
          marker.addTo(layer);
        }

      }
    }
    // Add layer to map.
    layer.addTo(map);
    $('.arrows').each(function( i ){
      var station = stations[i];
      var stat = station.wdir[count];
      this.style.transform += 'rotate('+stat+'deg)';
    });
  };
  return {
    setMap: setMap,
    drawPolys: drawPolys,
    windShapes: windShapes,
  }
})();

// Stores the AJAX call in a closure
var store = (function(){
  var data, colors, stations, time;
  var set = function(rawJSON){
    data = rawJSON;
    colors = rawJSON.colors;
    payload = rawJSON.payload;
    time = new Date(rawJSON.payload[0].start_time[0] * 1000);
  };
  var get = function(){
    return { colors: colors, payload: payload }
  };
  var time = function(){
    return time;
  }
  return {
    set: set,
    get: get,
    time: time,
  };
})();

// Helper module: mostly clock and local storage related.
var legend = (function(){
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
  var clock = function(counter){
    var time = store.time().getHours();
    $('#time').html(formatTime(time + counter))
  };
  var scale = function(scale, colors){
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
    cold = $('<a></a>').html(cold+scale).attr('class','btn col s2').css('background-color', colors[cold]);
    middle = $('<a></a>').html(middle+scale).attr('class','waves-effect waves-light btn col s2').css('background-color', colors[middle]);
    hot = $('<a></a>').html(hot+scale).attr('class','waves-effect waves-light btn col s2').css('background-color', colors[hot]);
    // Append divs
    spacer = $('<div class="col s3">FOOOOOOOO</div>').css('color','white')
    $('#scale').prepend(hot, spacer.clone(), middle, spacer.clone(), cold)
  };
  return {
    clock: clock,
    scale: scale,
  };
})();

// More fully integrated map views with their associated helpers.
var views = (function(){
  // counter for the animation
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
      m.drawPolys(data, attribute, count);
      legend.clock(counter.value());
    };
    var wind = function(data, count){
      m.windShapes(data, count);
      legend.clock(counter.value());
    };
    return {
      temp: temp,
      wind: wind,
    }
  })();
  // Sets the controls for the temp and feelslike layer
  var temp = function(attribute){
    var data = store.get();
    counter.reset();
    legend.scale('°F',data.colors[attribute]);
    layers.temp(attribute,data,counter.value());
    $('body').off();
    $('#ff').off();
    $('#rw').off();
    $('#ff').on('click',function(){
      layers.temp(attribute,data,counter.inc())
    });
    $('#rw').on('click',function(){
      layers.temp(attribute,data,counter.dec())
    });
    $('body').keyup(function(e){
      // left
      if (e.keyCode === 37) {
        layers.temp(attribute,data,counter.dec())
      };
      // right
      if (e.keyCode === 39) {
        layers.temp(attribute,data,counter.inc())
      };
    });
  };
  // Sets controls and logic for wind layer
  var wind = function(){
    var data = store.get();
    counter.reset();
    $('#scale').html('');
    $('body').off();
    $('#ff').off();
    $('#rw').off();
    layers.wind(data, counter.value());
    $('#ff').on('click',function(){
      layers.wind(data, counter.inc());
    })
    $('#rw').on('click',function(){
      layers.wind(data, counter.dec());
    });
    $('body').keyup(function(e){
      // left
      if (e.keyCode === 37) {
        layers.wind(data, counter.dec());
      };
      // right
      if (e.keyCode === 39) {
        layers.wind(data, counter.inc());
      };
    });
  }
  return {
    temp: temp,
    wind: wind,
  }
})();

// Groups and calls the proceeding modules
var init = (function(){
  var page = function(){
    $.get('/stations').done(function(data){
      // Sets data from backend in local storage
      store.set(data);
      // Initializes the map
      m.setMap(data.key);
      // Starts with temp layer
      views.temp('temp')
    });
  };
  var eventListeners = function(){
    $('#controls a').on('click',function(e){
      var attribute = $(this).attr('id');
      if (attribute === 'temp' || attribute === 'feelslike') {
        // Use temp layer and control for feelslike and temp
        views.temp(attribute);
      } else if ( attribute === 'wind' ) {
        // Use wind layer and control for wind
        views.wind();
      } else if ( attribute === 'humidity' ) {
        // build out humidity layer
        conosle.log(attribute);
      } else if ( attribute === 'pressure') {
        // build out pressure layer
        conosle.log(attribute);
      };
    });
  };
  return {
    page: page,
    eventListeners: eventListeners,
  };
})();

// Document ready.  Calling all the priorly defined functions
$(function(){
  var map;
  init.page();
  init.eventListeners();
});