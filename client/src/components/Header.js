import { Navbar, Container, Nav } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ResortMarker from './ResortMarker';

export default function Header() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = (e) => {
    e.preventDefault();
    logout();
    navigate('/login');
  };

  return (
    <Navbar variant="dark" expand="lg" style={{ backgroundColor: '#000044' }}>
      <Container fluid>
        <Navbar.Brand as={Link} to="/" className="d-flex align-items-center" style={{ fontWeight: 600 }}>
          <ResortMarker size={28} /> <span className="ms-2">Blizzint</span>
        </Navbar.Brand>
        {user && (
          <>
            <Navbar.Toggle aria-controls="navbar-nav" />
            <Navbar.Collapse id="navbar-nav">
              <Nav className="ms-auto">
                {isAdmin && (
                  <>
                    <Nav.Link as={Link} to="/admin" className="text-white" style={{ fontWeight: 500 }}>
                      Resorts
                    </Nav.Link>
                    <Nav.Link as={Link} to="/users" className="text-white" style={{ fontWeight: 500 }}>
                      Users
                    </Nav.Link>
                  </>
                )}
                <Nav.Link href="#" onClick={handleLogout} className="text-white" style={{ fontWeight: 500 }}>
                  Logout
                </Nav.Link>
              </Nav>
            </Navbar.Collapse>
          </>
        )}
      </Container>
    </Navbar>
  );
}
