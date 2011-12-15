if (typeof sheltr === 'undefined' || !sheltr) {
  var sheltr = {};
}

sheltr.map = (function ($) {
  var map,
      infoWindow = new google.maps.InfoWindow(),
      geocoder = new google.maps.Geocoder(),
      youMarkerCollection = [],
      locationsMarkerCollection = [],
      _self;

  var markerShadow = new google.maps.MarkerImage('/img/marker_shadow.png',
    new google.maps.Size(51, 37),
    new google.maps.Point(0, 0),
    new google.maps.Point(16, 37));

  _self = {
    create: function (options) {
      var settings = {
            mapId: 'map',
            zoom: 14,
            center: sheltr.state.localSettings.mapCenter,
            mapTypeId: google.maps.MapTypeId.ROADMAP
          };

      if (options) {
        $.extend(settings, options);
      }
      map = new google.maps.Map(document.getElementById(settings.mapId), settings);

      map.minZoom = sheltr.state.localSettings.minZoom;

      google.maps.event.addListener(map, "drag", function() {
        _self.boundingBoxCheck(sheltr.state.localSettings.boundingBox);
      });

    },

    addLocationsToMap: function (locations) {
      var i,
          locationsLength = locations.result.length;

      _self.removeMarkers(locationsMarkerCollection);

      if (sheltr.state.showFood == true && sheltr.state.showShelter == true) { //NOTE: not the most elegant solution. setting this up for demo purposes

        for (i = 0; i < locationsLength; i++) {
          _self.setupMarker(locations.result[i]);
        }

      } else if (sheltr.state.showFood == false && sheltr.state.showShelter == true) {
        
        for (i = 0; i < locationsLength; i++) {
          if (locations.result[i].IsShelter == 'Y') {
            _self.setupMarker(locations.result[i]);
          }
        }  

      } else if (sheltr.state.showShelter == false && sheltr.state.showFood == true) {
        
        for (i = 0; i < locationsLength; i++) {
          if (locations.result[i].IsFood == 'Y') {
            _self.setupMarker(locations.result[i]);
          }
        }  

      } 
        
    },

    setupMarker: function(location) {
      var lat,
          lng,
          latlng,
          options,
          icon,
          description;
      
      lat = location.Latitude;
      lng = location.Longitude;
      latlng = new google.maps.LatLng(lat, lng);

      description = location.Name + "<br>" + location.Address1 + "<br><a href='http://www.google.com/maps?q=to:" + location.Address1 + ",+Philadelphia,+PA'>Get Directions</a>"

      icon = sheltr.locations.selectMarkerIcon(location);
      options = {icon: icon, shadow: markerShadow};

      _self.createMarker(latlng, description, options, location.id);
    },

    createMarker: function (latlng, description, options, id) {
      var settings = {
            position: latlng,
            map: map,
        };

      if (options) {
        $.extend(settings, options);
      }

      var marker = new google.maps.Marker(settings);

      google.maps.event.addListener(marker, 'click', function() {
        infoWindow.close();
        infoWindow.setContent(description);
        infoWindow.open(map,marker);
      });
      
      if (description === 'Your Location') { //TODO: this is fragile.
        google.maps.event.addListener(marker, 'dragend', function () {
          sheltr.state.userLocation = marker.getPosition();
          sheltr.getLocations(marker.getPosition(),false);
          _self.updateMapCenter(marker.getPosition());
        });
        
        _self.removeMarkers(youMarkerCollection)
        youMarkerCollection.push({"id": 'you', "marker": marker}); 
      } else {
        locationsMarkerCollection.push({"id": id, "marker": marker});
      }
    },

    updateMapCenter: function (latLongObj) {
      map.setCenter(latLongObj);
    },

    geocode: function (addr, description) {
      var lat,
          lng,
          latlng;

      addr = addr + ", " + sheltr.state.localSettings.city + ", " + sheltr.state.localSettings.state; 

      geocoder.geocode({
        'address': addr, 'bounds': sheltr.state.localSettings.boundingBox
      }, function (results, status) {

        if (status === google.maps.GeocoderStatus.OK) {

          $('#userMsg').empty().hide();
          
          if (sheltr.state.localSettings.boundingBox.contains(results[0].geometry.location)) {
            _self.createMarker(results[0].geometry.location, 'Your Location',  {
              animation: google.maps.Animation.DROP,
              draggable: true,
              icon: '/img/you.png',
              shadow: markerShadow
            });
            sheltr.state.userLocation = results[0].geometry.location;
            _self.updateMapCenter(results[0].geometry.location);
            sheltr.getLocations(results[0].geometry.location,true);
          } else {
             $('#userMsg').show().empty().prepend("Please restrict your search to the " + sheltr.state.localSettings.city + " area.");
          }
        } else {
          $('#userMsg').show().empty().prepend("Search was not successful for the following reason: " + status);
        }
      });
    },

    removeMarkers: function(markerArray) {
      var i;

      if (markerArray) {
        for (i in markerArray) {
          markerArray[i].marker.setMap(null);
        }
        markerArray.length = 0;
      }
    },

    boundingBoxCheck: function(boundingBox) {
      if (boundingBox.contains(map.getCenter())) {
        return;
      } else {
        var c = map.getCenter();
        var x = c.lng();
        var y = c.lat();
        
        var boundMaxX = boundingBox.getNorthEast().lng()
        var boundMaxY = boundingBox.getNorthEast().lat()
        var boundMinX = boundingBox.getSouthWest().lng()
        var boundMinY = boundingBox.getSouthWest().lat()
        
        if (x < boundMinX) {x = boundMinX;}
        if (x > boundMaxX) {x = boundMaxX;}
        if (y < boundMinY) {y = boundMinY;}
        if (y > boundMaxY) {y = boundMaxY;}

        map.setCenter(new google.maps.LatLng(y,x));
      }
    },

    zoomToMarker: function (locationID) {
      var i,
      locationsLength = locationsMarkerCollection.length;

      for (i = 0; i < locationsLength; i++) {
        if(locationID == locationsMarkerCollection[i].id) {
          map.setCenter(locationsMarkerCollection[i].marker.getPosition());
          map.setZoom(18)
          break;
        }
      }    
    }

  };

  return _self;
})(jQuery);
