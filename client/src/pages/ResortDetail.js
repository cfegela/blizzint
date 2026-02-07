import { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { Container, Row, Col, Card, Badge, Spinner, Alert } from 'react-bootstrap';
import Map from 'react-map-gl';
import { resortsAPI } from '../services/api';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;

export default function ResortDetail() {
  const { slug } = useParams();
  const location = useLocation();
  const [resort, setResort] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadResort = async () => {
      try {
        setLoading(true);
        const { data } = await resortsAPI.getById(slug);
        setResort(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load resort');
      } finally {
        setLoading(false);
      }
    };

    loadResort();
  }, [slug]);

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">{error}</Alert>
        <Link to="/" state={{ mapViewState: location.state?.mapViewState }} className="btn btn-primary">
          Back to Map
        </Link>
      </Container>
    );
  }

  if (!resort) return null;

  return (
    <Container fluid className="p-0">
      <div style={{ height: '300px', width: '100%' }}>
        <Map
          initialViewState={{
            longitude: parseFloat(resort.longitude),
            latitude: parseFloat(resort.latitude),
            zoom: 12,
          }}
          mapStyle="mapbox://styles/mapbox/outdoors-v12"
          mapboxAccessToken={MAPBOX_TOKEN}
          style={{ width: '100%', height: '100%' }}
        >
        </Map>
      </div>

      <Container className="py-4">
        <Row>
          <Col md={8}>
            <div className="mb-3">
              <Link to="/" state={{ mapViewState: location.state?.mapViewState }} className="btn btn-outline-primary btn-sm">
                ← Back to Map
              </Link>
            </div>

            <h1 className="mb-2">{resort.name}</h1>
            <p className="text-muted mb-3">
              {resort.state_province && `${resort.state_province}, `}
              {resort.country}
              {resort.region && ` • ${resort.region}`}
            </p>

            {resort.description && (
              <Card className="mb-4">
                <Card.Body>
                  <Card.Title>About</Card.Title>
                  <Card.Text>{resort.description}</Card.Text>
                </Card.Body>
              </Card>
            )}

            <Card className="mb-4">
              <Card.Body>
                <Card.Title>Trail Information</Card.Title>
                <Row>
                  <Col sm={6} className="mb-2">
                    <strong>Total Trails:</strong> {resort.trail_count || 'N/A'}
                  </Col>
                  <Col sm={6} className="mb-2">
                    <strong>Lifts:</strong> {resort.lift_count || 'N/A'}
                  </Col>
                  {resort.beginner_trails_pct !== null && (
                    <Col sm={6} className="mb-2">
                      <strong>Beginner:</strong> {resort.beginner_trails_pct}%
                    </Col>
                  )}
                  {resort.intermediate_trails_pct !== null && (
                    <Col sm={6} className="mb-2">
                      <strong>Intermediate:</strong> {resort.intermediate_trails_pct}%
                    </Col>
                  )}
                  {resort.advanced_trails_pct !== null && (
                    <Col sm={6} className="mb-2">
                      <strong>Advanced:</strong> {resort.advanced_trails_pct}%
                    </Col>
                  )}
                  {resort.expert_trails_pct !== null && (
                    <Col sm={6} className="mb-2">
                      <strong>Expert:</strong> {resort.expert_trails_pct}%
                    </Col>
                  )}
                </Row>
              </Card.Body>
            </Card>

            <Card className="mb-4">
              <Card.Body>
                <Card.Title>Features</Card.Title>
                <div className="mb-2">
                  {resort.night_skiing && <Badge bg="info" className="me-2">Night Skiing</Badge>}
                  {resort.terrain_parks && <Badge bg="warning" className="me-2">Terrain Parks</Badge>}
                  {resort.cross_country && <Badge bg="success" className="me-2">Cross Country</Badge>}
                  {resort.snowmaking && <Badge bg="primary" className="me-2">Snowmaking</Badge>}
                  {resort.pass_type && resort.pass_type !== 'None' && (
                    <Badge bg="secondary">{resort.pass_type} Pass</Badge>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col md={4}>
            <Card className="mb-4">
              <Card.Body>
                <Card.Title>Statistics</Card.Title>
                <div className="mb-2">
                  <strong>Summit Elevation:</strong><br />
                  {resort.summit_elevation_ft?.toLocaleString() || 'N/A'} ft
                </div>
                <div className="mb-2">
                  <strong>Base Elevation:</strong><br />
                  {resort.base_elevation_ft?.toLocaleString() || 'N/A'} ft
                </div>
                <div className="mb-2">
                  <strong>Vertical Drop:</strong><br />
                  {resort.vertical_drop_ft?.toLocaleString() || 'N/A'} ft
                </div>
                <div className="mb-2">
                  <strong>Skiable Acreage:</strong><br />
                  {resort.skiable_acreage?.toLocaleString() || 'N/A'} acres
                </div>
                <div className="mb-2">
                  <strong>Annual Snowfall:</strong><br />
                  {resort.annual_snowfall_inches?.toLocaleString() || 'N/A'} inches
                </div>
              </Card.Body>
            </Card>

            {(resort.website || resort.phone) && (
              <Card>
                <Card.Body>
                  <Card.Title>Contact</Card.Title>
                  {resort.website && (
                    <div className="mb-2">
                      <strong>Website:</strong><br />
                      <a href={resort.website} target="_blank" rel="noopener noreferrer">
                        Visit Website
                      </a>
                    </div>
                  )}
                  {resort.phone && (
                    <div>
                      <strong>Phone:</strong><br />
                      {resort.phone}
                    </div>
                  )}
                </Card.Body>
              </Card>
            )}
          </Col>
        </Row>
      </Container>
    </Container>
  );
}
