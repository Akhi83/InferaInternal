export default function Footer() {
    return (
        <footer style={footerStyle}>
            <a href="#help" style={linkStyle}>Help Center</a>
            <span style={separatorStyle}>|</span>
            <a href="#docs" style={linkStyle}>Documentation</a>
            <span style={separatorStyle}>|</span>
            <p style={copyrightStyle}>© 2021 <span style={companyStyle}>EmergeFlow Technologies</span></p>
        </footer>
    );
}

const footerStyle = {
  backgroundColor: '#ffffffff',
  color: 'black',
  padding: '1.25rem',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  marginTop: 'auto',
  boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.05)', // stronger, deeper shadow
};



const linkStyle = {
    color: '#000000ff',
    textDecoration: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    transition: 'all 0.3s ease'
};

const separatorStyle = {
    color: '#000203ff',
    margin: '0 0.75rem',
    fontWeight: '300'
};

const copyrightStyle = {
    color: '#000000ff',
    margin: '0 0.75rem',
    fontSize: '0.9rem'
};

const companyStyle = {
    color: '#000000ff',
    fontWeight: '600'
};