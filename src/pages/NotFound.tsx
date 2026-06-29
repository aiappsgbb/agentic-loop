import { Link } from 'react-router-dom';
import { Home, Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="notfound">
      <div className="notfound-mark"><Compass size={40} strokeWidth={1.6} /></div>
      <h1>Page not found</h1>
      <p className="lede">
        The page you're looking for doesn't exist or may have moved.
      </p>
      <Link to="/" className="btn-pill"><Home size={16} /> Back to home</Link>
    </div>
  );
}
