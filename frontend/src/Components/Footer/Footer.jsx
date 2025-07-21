import './Footer.css';

export default function Footer() {
    return (
        <footer className="footer">
            <a href="#help">Help Center</a>
            <span className="footer-separator">|</span>
            <a href="#docs">Documentation</a>
            <span className="footer-separator">|</span>
            <p className="footer-copy">
                © 2025 <a href="https://emergeflow.com/" className="footer-company">EmergeFlow Technologies</a>
            </p>
        </footer>
    );
}
