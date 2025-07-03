export default function Footer() {
    return (
        <footer style={footerStyle}>
            <a href="#help" style={linkStyle}>Help Center</a>
            <span style={separatorStyle}>|</span>
            <a href="#docs" style={linkStyle}>Documentation</a>
            <span style={separatorStyle}>|</span>
            <p style={copyrightStyle}>© 2025 <span style={companyStyle}>Your Company</span></p>
        </footer>
    );
}

const footerStyle = {
    background: 'linear-gradient(135deg, #1e3a8a 0%, #3730a3 50%, #1e1b4b 100%)',
    color: 'white',
    padding: '1.5rem',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.1)',
    marginTop: 'auto'
};

const linkStyle = {
    color: '#e2e8f0',
    textDecoration: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    transition: 'all 0.3s ease'
};

const separatorStyle = {
    color: '#cbd5e0',
    margin: '0 0.75rem',
    fontWeight: '300'
};

const copyrightStyle = {
    color: '#cbd5e0',
    margin: '0 0.75rem',
    fontSize: '0.9rem'
};

const companyStyle = {
    color: '#fbbf24',
    fontWeight: '600'
};