import './Footer.css';

export default function Footer() {
    return (
        <footer className="footer">
            <a href="#help">Help Center</a>
            <span className="footer-separator">|</span>
            <a href="#docs">Documentation</a>
            <span className="footer-separator">|</span>
            <p className="footer-copy">
                © 2021 <span className="footer-company">EmergeFlow Technologies</span>
            </p>
        </footer>
    );
}
