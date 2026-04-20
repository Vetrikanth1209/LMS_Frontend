import { useNavigate } from "react-router-dom";
import Admin_Dash from "../components/AdminDash";
import "../styles/Administrative_Side.css"; // Import the CSS file for styling

const creationCards = [
  {
    title: "Organisation",
    description: "Create and register a new organisation into the system.",
    icon: "🏢",
    route: "/add_organisation",
    color: "#0c83c8",
  },
  {
    title: "Module",
    description: "Add a new training or assessment module.",
    icon: "📦",
    route: "/add_module",
    color: "#0c83c8",
  },
  {
    title: "Point of Contact",
    description: "Register a POC linked to a module batch.",
    icon: "👤",
    route: "/add_poc",
    color: "#0c83c8",
  },
  {
    title: "Expert",
    description: "Add an external expert or trainer to the platform.",
    icon: "🎓",
    route: "/add_expert",
    color: "#0c83c8",
  },
];

const linkingCards = [
  {
    title: "Module → Organisation",
    description: "Link a module ID to an existing organisation.",
    icon: "🔗",
    route: "/update_organization",
    color: "#fc7a46",
  },
  {
    title: "POC → Module",
    description: "Assign a Point of Contact to a module.",
    icon: "🔗",
    route: "/link_module_to_poc",
    color: "#fc7a46",
  },
  {
    title: "User → POC",
    description: "Map users to a Point of Contact batch.",
    icon: "🔗",
    route: "/link_users_to_poc",
    color: "#fc7a46",
  },
  {
    title: "Expert → POC & MODULE",
    description: "Map experts to a Point of Contact batch and modules.",
    icon: "🔗",
    route: "/update_expert",
    color: "#fc7a46",
  },
];

const ActionCard = ({ title, description, icon, route, color }) => {
  const navigate = useNavigate();

  return (
    <div
      className="action-card"
      onClick={() => navigate(route)}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = `0 12px 32px ${color}22`;
        e.currentTarget.style.borderColor = color;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.borderColor = "#e0e0e0";
      }}
    >
      <div
        className="action-card-icon"
        style={{ background: `${color}15` }}
      >
        {icon}
      </div>

      <div className="action-card-body">
        <p className="action-card-title">{title}</p>
        <p className="action-card-description">{description}</p>
      </div>

      <div
        className="action-card-footer"
        style={{ color }}
      >
        Open <span className="action-card-footer-arrow">→</span>
      </div>
    </div>
  );
};

const Administrative_Side = () => {
  return (
    <div className="admin-side">
      <Admin_Dash />

      <div className="admin-side-content">
        {/* Page Heading */}
        <div className="admin-side-heading">
          <p className="admin-side-label">Administration</p>
          <h1 className="admin-side-title">Admin Control Panel</h1>
          <p className="admin-side-subtitle">
            Create and link administrative entities to manage your platform.
          </p>
        </div>

        {/* Creation Section */}
        <div className="admin-section">
          <div className="section-header">
            <span className="section-badge section-badge--creation">Creation</span>
            <div className="section-divider" />
          </div>
          <div className="action-cards-row">
            {creationCards.map((card) => (
              <ActionCard key={card.title} {...card} />
            ))}
          </div>
        </div>

        {/* Linking Section */}
        <div className="admin-section">
          <div className="section-header">
            <span className="section-badge section-badge--linking">Linking</span>
            <div className="section-divider" />
          </div>
          <div className="action-cards-row">
            {linkingCards.map((card) => (
              <ActionCard key={card.title} {...card} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Administrative_Side;