import { useNavigate } from "react-router-dom";
import "./styles/NotFound.css"; // You can create this CSS file for styling

function NotFoundRedirect() {
  const navigate = useNavigate();

  return (
    <div className="notfound-container">
      <h1>404</h1>
      <h2>Page Not Found</h2>
      <p>The page you're looking for doesn't exist.</p>
      <button className="home-btn" onClick={() => navigate("/")}>
        Go to Home
      </button>
    </div>
  );
}

export default NotFoundRedirect;
