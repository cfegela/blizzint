import { useState, useEffect } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import Map, { Marker, Popup } from 'react-map-gl';
import { Link } from 'react-router-dom';
import { resortsAPI } from '../services/api';
import FilterPanel from '../components/FilterPanel';
import ResortMarker from '../components/ResortMarker';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;

export default function Home() {
  const [resorts, setResorts] = useState([]);
  const [filters, setFilters] = useState({});
  const [selectedResort, setSelectedResort] = useState(null);
  const [viewState, setViewState] = useState({
    longitude: -95.9345,
    latitude: 41.2565,
    zoom: 3.5,
  });

  useEffect(() => {
    const loadResorts = async () => {
      try {
        const { data } = await resortsAPI.getAll(filters);
        setResorts(data.resorts || data);
      } catch (error) {
        console.error('Failed to load resorts:', error);
      }
    };

    loadResorts();
  }, [filters]);

  // Zoom to fit resorts when country or state/province filter changes
  useEffect(() => {
    if (resorts.length === 0) return;

    // Only zoom if there's a country or state filter active
    if (!filters.country && !filters.state_province) {
      // Reset to default view when filters are cleared
      setViewState({
        longitude: -95.9345,
        latitude: 41.2565,
        zoom: 3.5,
      });
      return;
    }

    // Calculate bounds from filtered resorts
    const lngs = resorts.map(r => parseFloat(r.longitude));
    const lats = resorts.map(r => parseFloat(r.latitude));

    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);

    // Calculate center
    const centerLng = (minLng + maxLng) / 2;
    const centerLat = (minLat + maxLat) / 2;

    // Calculate appropriate zoom level based on bounds
    const lngDiff = maxLng - minLng;
    const latDiff = maxLat - minLat;
    const maxDiff = Math.max(lngDiff, latDiff);

    let zoom;
    if (maxDiff > 50) zoom = 3;
    else if (maxDiff > 20) zoom = 4;
    else if (maxDiff > 10) zoom = 5;
    else if (maxDiff > 5) zoom = 6;
    else if (maxDiff > 2) zoom = 7;
    else zoom = 8;

    setViewState({
      longitude: centerLng,
      latitude: centerLat,
      zoom,
      transitionDuration: 1000,
    });
  }, [resorts, filters.country, filters.state_province]);

  return (
    <Container fluid className="p-0" style={{ height: 'calc(100vh - 56px)' }}>
      <Row className="g-0 h-100">
        <Col md={3} lg={2} className="border-end d-none d-md-block" style={{ maxHeight: '100%', overflowY: 'auto' }}>
          <FilterPanel filters={filters} onFilterChange={setFilters} onReset={() => setFilters({})} />
        </Col>
        <Col xs={12} md={9} lg={10}>
          <Map
            {...viewState}
            onMove={(evt) => setViewState(evt.viewState)}
            mapStyle="mapbox://styles/mapbox/outdoors-v12"
            mapboxAccessToken={MAPBOX_TOKEN}
            style={{ width: '100%', height: '100%' }}
          >
            {resorts.map((resort) => (
              <Marker
                key={resort.id}
                longitude={parseFloat(resort.longitude)}
                latitude={parseFloat(resort.latitude)}
                anchor="bottom"
                onClick={(e) => {
                  e.originalEvent.stopPropagation();
                  setSelectedResort(resort);
                }}
              >
                <ResortMarker size={32} />
              </Marker>
            ))}

            {selectedResort && (
              <Popup
                longitude={parseFloat(selectedResort.longitude)}
                latitude={parseFloat(selectedResort.latitude)}
                anchor="top"
                onClose={() => setSelectedResort(null)}
                closeButton={false}
              >
                <div className="p-2">
                  <h6 className="mb-1">{selectedResort.name}</h6>
                  <p className="text-muted small mb-2">
                    {selectedResort.state_province && `${selectedResort.state_province}, `}
                    {selectedResort.country}
                  </p>
                  <Link to={`/resorts/${selectedResort.slug}`} style={{ fontWeight: 600, fontSize: '.8rem', color: '#000044' }}>
                    Details
                  </Link>
                </div>
              </Popup>
            )}
          </Map>
        </Col>
      </Row>
    </Container>
  );
}
