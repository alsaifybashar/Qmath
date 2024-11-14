import { useState } from 'react';
import { Navbar, NavbarBrand, NavItem, NavLink } from 'reactstrap';
import { Image, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const NavMenu = () => {
    const [collapsed, setCollapsed] = useState<boolean>(true);
    const temp_course_code = "tdde41";
    const Logo = require('assets/images/QmathLogo.png');

    return (
        <>
        <header className="header">
            <div className='navbar-content'>
            <NavLink tag={Link} to="/" className="logo-link">
                <Image src={Logo} style={{width:"50%"}}/>
            </NavLink>

            <nav className="nav-links">
                <div className="nav-item-container">
                    <Card>
                        <NavLink tag={Link} className="text-dark" to="/questions">Kurser</NavLink>
                    </Card>
                    <Card>
                        <NavLink tag={Link} className="text-dark" to="/editor">Föreläsningar</NavLink>
                    </Card>
                    <Card>
                        <NavLink tag={Link} className="text-dark" to="/questions">Statistik</NavLink>
                    </Card>
                </div>
                <input className="search" type="text" placeholder="Sök" />
                <NavLink to="/login" className="login">Logga in</NavLink>
            </nav>
            </div>
        </header>
        <style>
            {
                `
                   .navbar-content {
                        display: flex;
                        justify-content: space-between; /* Ensures the logo, cards, and login are spread out */
                        align-items: center;
                        width: 100%;
                    }

                    .nav-item-container {
                        display: flex;
                        justify-content: center;
                        gap: 15px; /* Adds horizontal spacing between cards */
                    }

                    .card {
                        padding: 10px; /* Adds some padding inside each card */
                    }

                    .navbar-nav {
                        flex-grow: 1;
                        display: flex;
                        justify-content: center;
                    }

                    .logo {
                        font-size: 24px;
                        font-weight: bold;
                        color: #555;
                        }

                    .nav-links {
                        display: flex;
                        gap: 20px;
                    }

                    .nav-links a {
                        text-decoration: none;
                        color: #555;
                        font-size: 16px;
                    }

                    .search {
                        padding: 5px;
                        border: 1px solid #ccc;
                        border-radius: 5px;
                        }

                    .login {
                        background-color: #f1f1f1;
                        padding: 8px 15px;
                        border-radius: 20px;
                        text-decoration: none;
                        color: #555;
                    }

                `
            }
        </style>
        </>
    );
}

export { NavMenu };
