/**
 * location browser with clustered markers
 * 
 * Created:  2016-07-24 13:05 by Christian Berndt
 * Modified:	2016-07-24 13:05 by Christian Berndt
 * Version:  1.0.0
 */

/**
 * jQuery plugins
 */
$(document).ready(function () {

  var wh = $(window).height();
  var ww = $(window).width();

  var locations = [];

  var bodyOffset = 40;
  var filterHeight = 90;
  var headHeight = 73;

  var resolverURL = "//nominatim.openstreetmap.org/search?format=json&q=";

  // setup the datatable 
  var table = $("#locations")
    .on('xhr.dt', function ( e, settings, json, xhr ) {
      console.log("locations.txt loaded");
    })
    .DataTable({
      dom: 'ipt', // hide default filter and length config
      scrollY: wh - (bodyOffset + filterHeight + headHeight),
      ajax: "data/locations.txt"
  });

  var considerBounds = false;

  var minLat = parseFloat(-90);
  var maxLat = parseFloat(90);
  var minLong = parseFloat(-180);
  var maxLong = parseFloat(180);

  // Disable the filter form's default 
  // submit behaviour.
  $("#filter").submit(function (e) {
    return false;
  });

  // Search the datalist bey keyword
  $("#filter .keyword").bind("keyup", function () {

    // Ignore and reset the map bounds 
    // when the keyword field is used.
    considerBounds = false;

    minLat = parseFloat(-90);
    maxLat = parseFloat(90);
    minLong = parseFloat(-180);
    maxLong = parseFloat(180);

    table.search(this.value).draw();

  });

  // Redraw the map whenever the table is searched.
  table.on("search", function () {
    
    console.log("search");

    locations = table.rows({
      search: "applied"
    }).data();

    updateMarkers(locations);

    if (!considerBounds) {

      // when the search is initiated from the 
      // filter form, fit the map to found locations.
      map.fitBounds(markers.getBounds());

    }

  });

  table.on("draw.dt", function () {
    $("td").css("padding-left", margin);
  });

  // Custom filter method which filters the 
  // locations by the map's boundaries.
  $.fn.dataTable.ext.search.push(

    function (settings, data, dataIndex) {

      // only consider the bounds, if the search was triggered by the map
      if (considerBounds) {

        minLat = parseFloat(map.getBounds().getSouth());
        maxLat = parseFloat(map.getBounds().getNorth());
        minLong = parseFloat(map.getBounds().getWest());
        maxLong = parseFloat(map.getBounds().getEast());

      }

      var latitude = parseFloat(data[1]) || 0; // use data for the lat column
      var longitude = parseFloat(data[2]) || 0; // use data for the long column

      if ((minLat <= latitude && latitude <= maxLat) && // north-south
        (minLong <= longitude && longitude <= maxLong)) { // east-west
        return true;
      }
      return false;
    }
  );

  // Map setup
  var locations = [];
  var locationLayer = L.featureGroup([]);
  var map = L.map("map", {
    center: [50, 13]
    , zoom: 8
  });

  // fit the map into the right half of the window
  $("#map").css("height", wh - bodyOffset);

  var margin = 0;
  if (ww >= 1200) {
    margin = (ww - 1170) / 2;
  }

  $("#filter, #locations_info, tbody h3").css("padding-left", margin);

  map.invalidateSize(true);

  L.tileLayer("http://{s}.tile.osm.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  map.on("drag", function () {
     filterByMap();
  });

  map.on("zoomend", function () {
     filterByMap();
  });

  /** redraw the table and filter by map bounds */
  function filterByMap() {
    considerBounds = true;
    table.draw();
  }

  /** update the location markers */
  var markers = L.markerClusterGroup();

  function updateMarkers(locations) {
    
    markers.clearLayers(); 
    		
		for (var i = 0; i < locations.length; i++) {
      var lat = parseFloat(locations[i][1]);
      var lon = parseFloat(locations[i][2]);
      var title = lon;
			var marker = L.marker(new L.LatLng(lat, lon), { title: title });
			// marker.bindPopup(title);
			markers.addLayer(marker);
		}

		map.addLayer(markers);
    // map.fitBounds(markers.getBounds());    
    
  }

});