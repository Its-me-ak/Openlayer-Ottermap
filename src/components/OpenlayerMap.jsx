import React, { useState, useEffect, useRef } from 'react';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import { OSM, Vector as VectorSource } from 'ol/source';
import { Draw } from 'ol/interaction';
import { fromLonLat, toLonLat } from 'ol/proj';
import Feature from 'ol/Feature';
import Polygon from 'ol/geom/Polygon';
import LineString from 'ol/geom/LineString';
import { Style, Fill, Stroke } from 'ol/style';

const OpenlayerMap = () => {
    const [map, setMap] = useState(null);
    const [pinpoint, setPinpoint] = useState(null);
    const [measurements, setMeasurements] = useState(null);
    const mapRef = useRef();
    const drawSourceRef = useRef(new VectorSource());
    // Reference for the vector layer used for drawing features
    const drawLayerRef = useRef(new VectorLayer({
        source: drawSourceRef.current,
        style: new Style({
            fill: new Fill({
                color: 'rgba(255, 255, 255, 0.2)',
            }),
            stroke: new Stroke({
                color: '#ffcc33',
                width: 2,
            }),
        }),
    }));

    useEffect(() => {
        if (!map) return;
        map.addLayer(drawLayerRef.current);
        // Event handler for map click to locate a pinpoint
        const handleMapClick = (event) => {
            const coords = toLonLat(event.coordinate);
            // Set the pinpoint location
            setPinpoint(coords);
            const feature = new Feature({
                geometry: new Polygon([[event.coordinate]]),
            });
            drawSourceRef.current.clear();
            drawSourceRef.current.addFeature(feature);
        };

        // Add click event listener to the map
        map.on('click', handleMapClick);
        // Remove click event listener on component unmount
        return () => map.un('click', handleMapClick);
    }, [map]);

    useEffect(() => {
        if (!map) return;
        // Event handler for drawing interactions
        const handleDrawEnd = (event) => {
            const feature = event.feature;
            const geometry = feature.getGeometry();
            let measurement;

            // Check if the drawn geometry is a polygon
            if (geometry instanceof Polygon) {
                measurement = geometry.getArea();
            } else if (geometry instanceof LineString) {
                measurement = geometry.getLength();
            }
            // Set the measurement value
            setMeasurements(measurement);
        };

        const draw = new Draw({
            source: drawSourceRef.current,
            type: 'Polygon',
        });

        draw.on('drawend', (event) => {
            const feature = event.feature;
            const geometry = feature.getGeometry();
            let measurement;

            if (geometry instanceof Polygon) {
                measurement = geometry.getArea();
            } else if (geometry instanceof LineString) {
                measurement = geometry.getLength();
            }

            setMeasurements(measurement);
        });
        // Add event listener for draw end event
        draw.on('drawend', handleDrawEnd);

        map.addInteraction(draw);

        return () => map.removeInteraction(draw);
    }, [map]);

    useEffect(() => {
        // Create and initialize the map on component mount
        const mapObject = new Map({
            target: mapRef.current,
            layers: [
                new TileLayer({
                    // OpenStreetMap as base layer
                    source: new OSM(),
                }),
            ],
            view: new View({
                center: fromLonLat([0, 0]),
                zoom: 2,
            }),
        });

        setMap(mapObject);
        // Cleanup function on component unmount
        return () => mapObject.dispose();
    }, []);

    return (
        <div>
            <div ref={mapRef} className="map" />
            {pinpoint &&
                <div className='popup-content'>
                    <p>Pinpoint Location: {pinpoint[1].toFixed(3)}, {pinpoint[0].toFixed(3)}</p>
                    {measurements && <p>Measurements: {measurements.toFixed(2)}</p>}
                </div>
            }
        </div>
    );
};

export default OpenlayerMap;
