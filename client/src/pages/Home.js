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
    longitude: -98.5,
    latitude: 39.8,
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

  return (
    <Container fluid className="p-0" style={{ height: 'calc(100vh - 56px)' }}>
      <Row className="g-0 h-100">
        <Col md={3} lg={2} className="border-end" style={{ maxHeight: '100%', overflowY: 'auto' }}>
          <FilterPanel filters={filters} onFilterChange={setFilters} onReset={() => setFilters({})} />
        </Col>
        <Col md={9} lg={10}>
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
