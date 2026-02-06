import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Table, Button, Modal, Form, Alert, Spinner } from 'react-bootstrap';
import { resortsAPI } from '../services/api';

const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'FR', name: 'France' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'AT', name: 'Austria' },
  { code: 'IT', name: 'Italy' },
  { code: 'DE', name: 'Germany' },
  { code: 'AD', name: 'Andorra' },
  { code: 'NO', name: 'Norway' },
  { code: 'SE', name: 'Sweden' },
  { code: 'CL', name: 'Chile' },
  { code: 'AR', name: 'Argentina' },
];

const PASS_TYPES = ['Epic', 'Ikon', 'Indy', 'None'];

export default function Admin() {
  const [resorts, setResorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingResort, setEditingResort] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [sortColumn, setSortColumn] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    state_province: '',
    country: 'US',
    region: '',
    latitude: '',
    longitude: '',
    summit_elevation_ft: '',
    base_elevation_ft: '',
    vertical_drop_ft: '',
    trail_count: '',
    lift_count: '',
    skiable_acreage: '',
    annual_snowfall_inches: '',
    beginner_trails_pct: '',
    intermediate_trails_pct: '',
    advanced_trails_pct: '',
    expert_trails_pct: '',
    night_skiing: false,
    terrain_parks: false,
    cross_country: false,
    snowmaking: false,
    website: '',
    phone: '',
    description: '',
    image_url: '',
    pass_type: 'None',
  });

  useEffect(() => {
    loadResorts();
  }, []);

  const loadResorts = async () => {
    try {
      setLoading(true);
      const { data } = await resortsAPI.getAll({});
      setResorts(data.resorts || data);
      setError(null);
    } catch (err) {
      setError('Failed to load resorts');
    } finally {
      setLoading(false);
    }
  };

  const handleShowModal = (resort = null) => {
    if (resort) {
      setEditingResort(resort);
      setFormData({
        name: resort.name || '',
        slug: resort.slug || '',
        state_province: resort.state_province || '',
        country: resort.country || 'US',
        region: resort.region || '',
        latitude: resort.latitude || '',
        longitude: resort.longitude || '',
        summit_elevation_ft: resort.summit_elevation_ft || '',
        base_elevation_ft: resort.base_elevation_ft || '',
        vertical_drop_ft: resort.vertical_drop_ft || '',
        trail_count: resort.trail_count || '',
        lift_count: resort.lift_count || '',
        skiable_acreage: resort.skiable_acreage || '',
        annual_snowfall_inches: resort.annual_snowfall_inches || '',
        beginner_trails_pct: resort.beginner_trails_pct || '',
        intermediate_trails_pct: resort.intermediate_trails_pct || '',
        advanced_trails_pct: resort.advanced_trails_pct || '',
        expert_trails_pct: resort.expert_trails_pct || '',
        night_skiing: resort.night_skiing || false,
        terrain_parks: resort.terrain_parks || false,
        cross_country: resort.cross_country || false,
        snowmaking: resort.snowmaking || false,
        website: resort.website || '',
        phone: resort.phone || '',
        description: resort.description || '',
        image_url: resort.image_url || '',
        pass_type: resort.pass_type || 'None',
      });
    } else {
      setEditingResort(null);
      setFormData({
        name: '',
        slug: '',
        state_province: '',
        country: 'US',
        region: '',
        latitude: '',
        longitude: '',
        summit_elevation_ft: '',
        base_elevation_ft: '',
        vertical_drop_ft: '',
        trail_count: '',
        lift_count: '',
        skiable_acreage: '',
        annual_snowfall_inches: '',
        beginner_trails_pct: '',
        intermediate_trails_pct: '',
        advanced_trails_pct: '',
        expert_trails_pct: '',
        night_skiing: false,
        terrain_parks: false,
        cross_country: false,
        snowmaking: false,
        website: '',
        phone: '',
        description: '',
        image_url: '',
        pass_type: 'None',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingResort(null);
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const payload = { ...formData };

      // Convert empty strings to null for numeric fields
      ['latitude', 'longitude', 'summit_elevation_ft', 'base_elevation_ft',
       'vertical_drop_ft', 'trail_count', 'lift_count', 'skiable_acreage',
       'annual_snowfall_inches', 'beginner_trails_pct', 'intermediate_trails_pct',
       'advanced_trails_pct', 'expert_trails_pct'].forEach(field => {
        if (payload[field] === '') {
          payload[field] = null;
        } else if (payload[field] !== null) {
          payload[field] = parseFloat(payload[field]);
        }
      });

      if (editingResort) {
        await resortsAPI.update(editingResort.id, payload);
        setSuccess('Resort updated successfully');
      } else {
        await resortsAPI.create(payload);
        setSuccess('Resort created successfully');
      }

      handleCloseModal();
      loadResorts();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save resort');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this resort?')) {
      return;
    }

    try {
      await resortsAPI.delete(id);
      setSuccess('Resort deleted successfully');
      loadResorts();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete resort');
    }
  };

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getSortedResorts = () => {
    const sorted = [...resorts].sort((a, b) => {
      let aVal = a[sortColumn];
      let bVal = b[sortColumn];

      // Handle null/undefined values
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      // Handle string comparison
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Resort Management</h2>
        <div className="d-flex gap-2">
          <Button variant="primary" onClick={() => handleShowModal()}>
            Add Resort
          </Button>
          <Button variant="secondary" as={Link} to="/">
            Back
          </Button>
        </div>
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess(null)}>{success}</Alert>}

      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th style={{ cursor: 'pointer' }} onClick={() => handleSort('name')}>
              Name {sortColumn === 'name' && (sortDirection === 'asc' ? '▲' : '▼')}
            </th>
            <th style={{ cursor: 'pointer' }} onClick={() => handleSort('state_province')}>
              Location {sortColumn === 'state_province' && (sortDirection === 'asc' ? '▲' : '▼')}
            </th>
            <th style={{ cursor: 'pointer' }} onClick={() => handleSort('trail_count')}>
              Trails {sortColumn === 'trail_count' && (sortDirection === 'asc' ? '▲' : '▼')}
            </th>
            <th style={{ cursor: 'pointer' }} onClick={() => handleSort('vertical_drop_ft')}>
              Vertical Drop {sortColumn === 'vertical_drop_ft' && (sortDirection === 'asc' ? '▲' : '▼')}
            </th>
            <th style={{ cursor: 'pointer' }} onClick={() => handleSort('pass_type')}>
              Pass Type {sortColumn === 'pass_type' && (sortDirection === 'asc' ? '▲' : '▼')}
            </th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {getSortedResorts().map((resort) => (
            <tr key={resort.id}>
              <td><strong>{resort.name}</strong></td>
              <td>
                {resort.state_province && `${resort.state_province}, `}
                {resort.country}
              </td>
              <td>{resort.trail_count || 'N/A'}</td>
              <td>{resort.vertical_drop_ft?.toLocaleString() || 'N/A'} ft</td>
              <td>{resort.pass_type}</td>
              <td>
                <Button
                  variant="primary"
                  size="sm"
                  className="me-2"
                  style={{ width: '70px' }}
                  onClick={() => handleShowModal(resort)}
                >
                  Edit
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  style={{ width: '70px' }}
                  onClick={() => handleDelete(resort.id)}
                >
                  Delete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editingResort ? 'Edit Resort' : 'Add Resort'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Name *</Form.Label>
              <Form.Control
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Slug *</Form.Label>
              <Form.Control
                type="text"
                value={formData.slug}
                onChange={(e) => handleChange('slug', e.target.value)}
                required
              />
              <Form.Text className="text-muted">URL-friendly identifier (e.g., vail-resort)</Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Country *</Form.Label>
              <Form.Select
                value={formData.country}
                onChange={(e) => handleChange('country', e.target.value)}
                required
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>State/Province</Form.Label>
              <Form.Control
                type="text"
                value={formData.state_province}
                onChange={(e) => handleChange('state_province', e.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Region</Form.Label>
              <Form.Control
                type="text"
                value={formData.region}
                onChange={(e) => handleChange('region', e.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Latitude *</Form.Label>
              <Form.Control
                type="number"
                step="any"
                value={formData.latitude}
                onChange={(e) => handleChange('latitude', e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Longitude *</Form.Label>
              <Form.Control
                type="number"
                step="any"
                value={formData.longitude}
                onChange={(e) => handleChange('longitude', e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Summit Elevation (ft)</Form.Label>
              <Form.Control
                type="number"
                value={formData.summit_elevation_ft}
                onChange={(e) => handleChange('summit_elevation_ft', e.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Base Elevation (ft)</Form.Label>
              <Form.Control
                type="number"
                value={formData.base_elevation_ft}
                onChange={(e) => handleChange('base_elevation_ft', e.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Vertical Drop (ft)</Form.Label>
              <Form.Control
                type="number"
                value={formData.vertical_drop_ft}
                onChange={(e) => handleChange('vertical_drop_ft', e.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Trail Count</Form.Label>
              <Form.Control
                type="number"
                value={formData.trail_count}
                onChange={(e) => handleChange('trail_count', e.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Lift Count</Form.Label>
              <Form.Control
                type="number"
                value={formData.lift_count}
                onChange={(e) => handleChange('lift_count', e.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Pass Type</Form.Label>
              <Form.Select
                value={formData.pass_type}
                onChange={(e) => handleChange('pass_type', e.target.value)}
              >
                {PASS_TYPES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
              />
            </Form.Group>

            <Form.Check
              type="checkbox"
              label="Night Skiing"
              checked={formData.night_skiing}
              onChange={(e) => handleChange('night_skiing', e.target.checked)}
              className="mb-2"
            />

            <Form.Check
              type="checkbox"
              label="Terrain Parks"
              checked={formData.terrain_parks}
              onChange={(e) => handleChange('terrain_parks', e.target.checked)}
              className="mb-2"
            />

            <Form.Check
              type="checkbox"
              label="Cross Country"
              checked={formData.cross_country}
              onChange={(e) => handleChange('cross_country', e.target.checked)}
              className="mb-2"
            />

            <Form.Check
              type="checkbox"
              label="Snowmaking"
              checked={formData.snowmaking}
              onChange={(e) => handleChange('snowmaking', e.target.checked)}
              className="mb-3"
            />
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingResort ? 'Update' : 'Create'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}
