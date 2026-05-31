"use strict";
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import Button from 'react-bootstrap/Button';
import { Link, NavLink, useNavigate } from 'react-router-dom';

// Top navigation bar.
// Props:
//   user      — the authenticated user object (or null when logged out)
//   onLogout  — called when the user clicks the logout button
export default function NavBar({ user, onLogout }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const handleLogout = async () => { await logout(); navigate("/"); };
    return (
        <Navbar expand="md" className="atm-nav">
          <Navbar.Brand as={Link} to="/" className="d-flex align-items-center gap-2 p-0">
            <span className="atm-logo" aria-hidden="true">M</span>
            <span className="atm-wordmark">Last Race<small>ATM · Metropolitana di Milano</small></span>
          </Navbar.Brand>
          <Nav className="me-auto ms-3">
            <Nav.Link as={NavLink} to="/" end>Instructions</Nav.Link>
            {user && <Nav.Link as={NavLink} to="/play">Play</Nav.Link>}
            {user && <Nav.Link as={NavLink} to="/ranking">Ranking</Nav.Link>}
          </Nav>
          <Nav className="align-items-center">
            {user
              ? <><Navbar.Text className="me-3">Hi, {user.name}</Navbar.Text><Button size="sm" variant="outline-danger" onClick={handleLogout}>Logout</Button></>
              : <Button size="sm" variant="outline-danger" as={Link} to="/login">Login</Button>}
          </Nav>
        </Navbar>
      );
    }
    