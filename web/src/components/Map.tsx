"use client";

import mapboxgl from "mapbox-gl";
import React, { useEffect, useRef, useState } from "react";

mapboxgl.accessToken = "";
const KAFKA_URL = ""
const KAFKA_TOKEN = ""

export function MapBoxComponent( {data}:any) {
  const mapContainer = useRef<any>(null);
  const map = useRef<any>(null);
  const [lng, setLng] = useState<any>(11.66324);
  const [lat, setLat] = useState<any>(48.3103154);
  const [zoom, setZoom] = useState(20);
  const [location, setLocation] = useState<any>({});
  const [marker, setMarker] = useState<any>(null);

  useEffect(() => {
    if (map.current) return;
      map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [lng, lat],
      zoom: zoom
    });
  });
   
    useEffect(() => {
    if (!map.current) return; 
      map.current.on('move', () => {
      setLng(map.current.getCenter().lng.toFixed(6));
      setLat(map.current.getCenter().lat.toFixed(6));
      setZoom(map.current.getZoom().toFixed(2));
    });
  });
  
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetch(KAFKA_URL
, {
          headers: {
            Authorization: KAFKA_TOKEN,
        }
        })
        .then(response => response.json())
        .then(data => {
          if (data.length !== 0){
          const current = JSON.parse(data[0].value)
          const latitude = current.latitude;
          const longitude = current.longitude;
          setLocation({longitude, latitude});
        }
        });
    }, 500);
  
    return () => clearInterval(intervalId);
    
  }, []);

    useEffect(() => {
    if (!map.current || !location.longitude) return;
    //if (marker) marker.remove(); 

    const el = document.createElement('div');
    el.style.width = '45px';
    el.style.height = '45px';
    el.style.backgroundImage = "url('amongus.png')";
    el.style.backgroundSize = 'cover';

    const newMarker = new mapboxgl.Marker(el)
      .setLngLat([location.longitude, location.latitude])
      .addTo(map.current);
   
   setMarker(newMarker); 
  }, [location, map]);



  useEffect(() => {
    if (!map.current || !location.longitude) return;
    map.current.setCenter([location.longitude, location.latitude]);
  }, [location]);
  
  return (
      <div className="main">
        <div className="sidebar">
          lat: {lat} <br /> lng: {lng} <br /> zoom: {zoom}
        </div>
        <div ref={mapContainer} className="map-container"></div>
      </div>
  );
}

export default MapBoxComponent;
