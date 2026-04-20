import AdminDash from "../components/AdminDash";
import { useNavigate } from "react-router-dom";
import "../styles/AdminDashboard.css"; // Import the CSS file for styling

const dashCards = [
  {
    title: "Administrative Side",
    description:
      "Manage organisations, modules, POCs and experts. Handle all administrative creation and linking tasks.",
    icon: "🏛️",
    route: "/administrative_side",
    color: "#0c83c8",
    tag: "Admin",
    features: ["Organisation", "Module", "POC", "Expert"],
  },
  {
    title: "Test Side",
    description:
      "Create and allocate tests, manage MCQs, coding challenges and test cases for batches.",
    icon: "📝",
    route: "/test_side",
    color: "#7c3aed",
    tag: "Test",
    features: ["MCQ", "Coding", "Test Cases", "Allocation"],
  },
  {
    title: "More Customization",
    description:
      "Access advanced settings, customization options and additional configuration for the platform.",
    icon: "⚙️",
    route: "/more_customization",
    color: "#fc7a46",
    tag: "Settings",
    features: ["Existing Pages", "Configuration", "Preferences"],
  },
];

const DashCard = ({ title, description, icon, route, color, tag, features }) => {
  const navigate = useNavigate();

  return (
    <div className="dash-card">
      {/* Top accent bar */}
      <div
        className="card-accent-bar"
        style={{ background: `linear-gradient(90deg, ${color}, ${color}88)` }}
      />

      {/* Card top with icon */}
      <div
        className="card-top"
        style={{ background: `linear-gradient(135deg, ${color}08 0%, ${color}03 100%)` }}
      >
        <div className="card-top-row">
          <div
            className="card-icon"
            style={{ background: `${color}15` }}
          >
            {icon}
          </div>
          <span
            className="card-tag"
            style={{ background: `${color}15`, color }}
          >
            {tag}
          </span>
        </div>
        <h3 className="card-title">{title}</h3>
        <p className="card-description">{description}</p>
      </div>

      {/* Features list */}
      <div className="card-features">
        <p className="features-label">Includes</p>
        <div className="features-list">
          {features.map((f) => (
            <span key={f} className="feature-pill">
              {f}
            </span>
          ))}
        </div>
      </div>

      {/* Action row */}
      <div className="card-action-row">
        <button
          className="btn-more-info"
          onClick={(e) => e.stopPropagation()}
        >
          More Info
        </button>
        <button
          className="btn-start"
          style={{ background: color }}
          onClick={() => navigate(route)}
        >
          Start <span className="btn-start-arrow">→</span>
        </button>
      </div>
    </div>
  );
};

export default function AdminDashboard() {
  return (
    <div className="admin-dashboard">
      {/* Decorative blobs */}
      <div className="blob-top-right" />
      <div className="blob-bottom-left" />

      <AdminDash />

      <div className="dashboard-content">
        {/* Heading */}
        <div className="dashboard-heading">
          <p className="dashboard-label">Dashboard</p>
          <h1 className="dashboard-title">Welcome to Admin Panel</h1>
          <p className="dashboard-subtitle">Select a section below to get started</p>
        </div>

        {/* Cards */}
        <div className="cards-grid">
          {dashCards.map((card) => (
            <DashCard key={card.title} {...card} />
          ))}
        </div>
      </div>
    </div>
  );
}