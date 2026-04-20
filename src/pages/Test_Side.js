import { useNavigate } from "react-router-dom";
import AdminDash from "../components/AdminDash";
import "../styles/Test_Side.css"; // Import the CSS file for styling

const creationCards = [
  {
    title: "Test Module",
    description: "Create a new test module with name, language, score and status.",
    icon: "📋",
    route: "/add_test",
    color: "#7c3aed",
  },
  {
    title: "MCQ",
    description: "Add multiple choice questions to the question bank.",
    icon: "🧠",
    route: "/add_mcq",
    color: "#7c3aed",
  },
  {
    title: "Coding Problem",
    description: "Create a coding problem and link test cases to it.",
    icon: "💻",
    route: "/add_coding",
    color: "#7c3aed",
  },
  {
    title: "Test Cases",
    description: "Define input/output pairs to evaluate coding problems.",
    icon: "🧪",
    route: "/add_testcase",
    color: "#7c3aed",
  },
];

const linkingCards = [
  {
    title: "Testcase → Coding",
    description: "Link test case IDs to an existing coding problem.",
    icon: "🔗",
    route: "/update_coding",
    color: "#fc7a46",
  },
  {
    title: "Coding & MCQ → Test Module",
    description: "Assign coding problems and MCQs to a test module.",
    icon: "🔗",
    route: "/update_test",
    color: "#fc7a46",
  },
  {
    title: "Test Module → POC",
    description: "Assign a test module to a Point of Contact batch.",
    icon: "🔗",
    route: "/allocate_test",
    color: "#fc7a46",
  },
];

const ActionCard = ({ title, description, icon, route, color }) => {
  const navigate = useNavigate();

  return (
    <div
      className="action-card"
      style={{ "--card-color": color, "--card-color-bg": `${color}15` }}
      onClick={() => navigate(route)}
    >
      <div className="action-card__icon">{icon}</div>
      <div className="action-card__body">
        <p className="action-card__title">{title}</p>
        <p className="action-card__description">{description}</p>
      </div>
      <div className="action-card__footer">
        Open <span>→</span>
      </div>
    </div>
  );
};

const TestSide = () => {
  const navigate = useNavigate();

  return (
    <div className="test-side">
      <div className="orb orb--top" />
      <div className="orb orb--bottom" />

      <AdminDash />

      <div className="test-side__container">

        <div className="test-side__header">
          <button className="back-btn" onClick={() => navigate("/dashboard")}>
            ← Back
          </button>
          <div>
            <p className="page-label">Test Side</p>
            <h1 className="page-title">Test Management</h1>
            <p className="page-subtitle">
              Create and link test entities to manage assessments.
            </p>
          </div>
        </div>

        <div className="section">
          <div className="section__header">
            <span className="badge badge--purple">Creation</span>
            <div className="section__divider" />
          </div>
          <div className="section__cards">
            {creationCards.map((card) => (
              <ActionCard key={card.title} {...card} />
            ))}
          </div>
        </div>

        <div className="section">
          <div className="section__header">
            <span className="badge badge--orange">Linking</span>
            <div className="section__divider" />
          </div>
          <div className="section__cards">
            {linkingCards.map((card) => (
              <ActionCard key={card.title} {...card} />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default TestSide;