var voroni = (function(){
  return {
    map: function(data){
      var voroni = d3.geom.voronoi().clipExtent([[37.719120,-122.517967],[37.813296,-122.379608]]);
      return voroni(data);
    },
  };
})();

$(function(){
  $.get('/stations').done(function(data){
    L.mapbox.accessToken = data.key;
    var stations = data.payload
    var map = L.mapbox.map('map', 'mapbox.streets')
      .setView([37.767662,-122.444759],13);
    var vertices = stations.map(function(station){ return station.coords });
    var hexes = voroni.map(vertices);
    debugger
    // stations.map(function(obj){
    //   var markerDiv = L.divIcon({className: 'icon-div'});
    //   var marker = L.marker(new L.LatLng(obj.coords[0],obj.coords[1]), { icon: markerDiv });
    //   marker.addTo(map);
    //   marker.bindPopup(obj.pws_id);
    //   marker.openPopup();
  });
});


// var voronoi = d3.geom.voronoi()
//     .clipExtent([[0, 0], [width, height]]);

// var svg = d3.select("body").append("svg")
//     .attr("width", width)
//     .attr("height", height)
//     .on("mousemove", function() { vertices[0] = d3.mouse(this); redraw(); });

// var path = svg.append("g").selectAll("path")
//             .data(voronoi(vertices), function(d){
//               return "M" + d.join("L") + "Z";
//             });

// function redraw() {

//   path.exit().remove();

//   path.enter().append("path")
//       .attr("class", function(d, i) { return "q" + (i % 9) + "-9"; })
//       .attr("d", polygon);

//   path.order();
// }
