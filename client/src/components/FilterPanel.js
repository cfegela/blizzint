import { Form, Button } from 'react-bootstrap';

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

const US_STATES = [
  'Alaska', 'Arizona', 'California', 'Colorado', 'Idaho', 'Maine', 'Montana',
  'New Hampshire', 'New Mexico', 'Oregon', 'Utah', 'Vermont',
  'Washington', 'Wyoming',
];

const CANADIAN_PROVINCES = ['Alberta', 'British Columbia', 'Quebec', 'Ontario'];
const PASS_TYPES = ['Epic', 'Ikon', 'Indy', 'None'];

export default function FilterPanel({ filters, onFilterChange, onReset }) {
  const handleChange = (field, value) => {
    const newFilters = { ...filters, [field]: value || undefined };

    // Clear state/province when country is selected
    if (field === 'country' && value) {
      delete newFilters.state_province;
    }

    // Clear country when state/province is selected
    if (field === 'state_province' && value) {
      delete newFilters.country;
    }

    onFilterChange(newFilters);
  };

  const stateProvinces = filters.country === 'US'
    ? US_STATES
    : filters.country === 'CA'
    ? CANADIAN_PROVINCES
    : [...US_STATES, ...CANADIAN_PROVINCES];

  return (
    <div className="p-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">Filters</h5>
        <Button variant="link" size="sm" onClick={onReset}>Reset</Button>
      </div>

      <Form>
        <Form.Group className="mb-3">
          <Form.Label className="small" style={{ fontWeight: 600 }}>Country</Form.Label>
          <Form.Select
            size="sm"
            value={filters.country || ''}
            onChange={(e) => handleChange('country', e.target.value)}
          >
            <option value="">All Countries</option>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label className="small" style={{ fontWeight: 600 }}>State/Province</Form.Label>
          <Form.Select
            size="sm"
            value={filters.state_province || ''}
            onChange={(e) => handleChange('state_province', e.target.value)}
          >
            <option value="">All States/Provinces</option>
            {stateProvinces.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label className="small" style={{ fontWeight: 600 }}>Pass Type</Form.Label>
          <Form.Select
            size="sm"
            value={filters.pass_type || ''}
            onChange={(e) => handleChange('pass_type', e.target.value)}
          >
            <option value="">All Pass Types</option>
            {PASS_TYPES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label className="small" style={{ fontWeight: 600 }}>Min Vertical Drop (ft)</Form.Label>
          <Form.Control
            type="number"
            size="sm"
            placeholder="e.g., 3000"
            value={filters.min_vertical_drop || ''}
            onChange={(e) => handleChange('min_vertical_drop', e.target.value)}
          />
        </Form.Group>
      </Form>
    </div>
  );
}
