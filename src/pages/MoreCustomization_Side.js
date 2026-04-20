import { useNavigate } from "react-router-dom";
import { useState } from "react";
import AdminDash from "../components/AdminDash";

const sections = [
  {
    label: "POC",
    color: "#0c83c8",
    cards: [{ title: "View POC", description: "Manage all Points of Contact", icon: "👁️", route: "/poc", count: 120 }],
  },
  {
    label: "Organisation",
    color: "#fc7a46",
    cards: [{ title: "View Organisation", description: "Browse organisations", icon: "🏢", route: "/organization", count: 80 }],
  },
  {
    label: "Module",
    color: "#0c83c8",
    cards: [{ title: "View Module", description: "Training modules", icon: "📘", route: "/module", count: 45 }],
  },
  {
    label: "Test",
    color: "#fc7a46",
    cards: [{ title: "View Test", description: "System tests", icon: "📝", route: "/test", count: 60 }],
  },
  {
    label: "User",
    color: "#0c83c8",
    cards: [{ title: "View User", description: "All users", icon: "👤", route: "/user", count: 300 }],
  },
  {
    label: "Expert",
    color: "#fc7a46",
    cards: [{ title: "View Expert", description: "Experts & trainers", icon: "🎓", route: "/expert", count: 25 }],
  },
  {
    label: "MCQ",
    color: "#0c83c8",
    cards: [{ title: "View MCQ", description: "Question bank", icon: "❓", route: "/mcq-admin", count: 500 }],
  },
  {
    label: "Coding",
    color: "#fc7a46",
    cards: [{ title: "View Coding", description: "Coding problems", icon: "💻", route: "/codingpage", count: 150 }],
  },
  {
    label: "Test Case",
    color: "#0c83c8",
    cards: [{ title: "View Test Case", description: "All test cases", icon: "🧪", route: "/testcasepage", count: 220 }],
  },
  {
    label: "Report",
    color: "#fc7a46",
    cards: [
      { title: "Report Generation", description: "Charts & reports", icon: "📊", route: "/reportAndPieGen", count: 20 },
      { title: "Master Report", description: "Full reports", icon: "📄", route: "/reportGen", count: 10 },
    ],
  },
  {
    label: "Certificate",
    color: "#0c83c8",
    cards: [{ title: "Generate Certificate", description: "Bulk certificates", icon: "🏅", route: "/certificate", count: 90 }],
  },
];

const ActionCard = ({ title, description, icon, route, color, count }) => {
  const navigate = useNavigate();

  return (
    <div
      className="card"
      onClick={() => navigate(route)}
      style={{ borderTop: `4px solid ${color}` }}
    >
      {/* LEFT */}
      <div className="card-left">
        <div className="icon" style={{ background: `${color}20`, color }}>
          {icon}
        </div>

        <h3>{title}</h3>
        <p>{description}</p>

        <div className="actions">
          <span>👁 View</span>
          <span>✏ Update</span>
          <span>🗑 Delete</span>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="card-right">
        
        <div className="arrow" style={{ color }}>
          →
        </div>
      </div>
    </div>
  );
};

export default function MoreCustomization() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  return (
    <div className="page">
      <AdminDash />

      <div className="container">
        {/* HEADER */}
        <div className="header">
          <button onClick={() => navigate("/dashboard")} className="backBtn">
            ← Back
          </button>

          <div>
            <h1>Admin Dashboard</h1>
            <p>Control & manage all modules efficiently</p>
          </div>
        </div>

        {/* SEARCH */}
        <div className="searchBox">
          <input
            type="text"
            placeholder="🔍 Search modules..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* SECTIONS */}
        {sections.map((section) => {
          const filtered = section.cards.filter((c) =>
            c.title.toLowerCase().includes(search.toLowerCase())
          );

          if (!filtered.length) return null;

          return (
            <div key={section.label} className="section">
              <div className="sectionTitle">
                <span style={{ background: `${section.color}20`, color: section.color }}>
                  {section.label}
                </span>
              </div>

              <div className="grid">
                {filtered.map((card) => (
                  <ActionCard key={card.title} {...card} color={section.color} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* STYLES */}
      <style>{`
        .page {
          min-height: 100vh;
          background: linear-gradient(135deg, #f1f5f9, #e6ecf5);
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        .container {
          max-width: 1200px;
          margin: auto;
          padding: 40px 20px;
        }

        .header {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 30px;
        }

        .header h1 {
          margin: 0;
          font-size: 28px;
        }

        .header p {
          margin: 0;
          color: #666;
        }

        .backBtn {
          background: white;
          border: 1px solid #ddd;
          padding: 8px 14px;
          border-radius: 8px;
          cursor: pointer;
        }

        .searchBox input {
          width: 100%;
          padding: 14px;
          border-radius: 10px;
          border: 1px solid #ddd;
          margin-bottom: 30px;
        }

        .section {
          margin-bottom: 40px;
        }

        .sectionTitle span {
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 20px;
          margin-top: 16px;
        }

        .card {
          background: rgba(255,255,255,0.75);
          backdrop-filter: blur(12px);
          border-radius: 18px;
          padding: 20px;
          cursor: pointer;
          transition: 0.3s;
          display: flex;
          justify-content: space-between;
          gap: 10px;
          border: 1px solid #eee;
          min-height: 170px;
        }

        .card:hover {
          transform: translateY(-6px) scale(1.02);
          box-shadow: 0 12px 30px rgba(0,0,0,0.08);
        }

        .card-left {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .card-right {
          width: 80px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          align-items: center;
          border-left: 1px dashed #e5e7eb;
          padding-left: 10px;
        }

        .icon {
          width: 45px;
          height: 45px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        }

        .card h3 {
          margin: 0;
          font-size: 16px;
        }

        .card p {
          margin: 0;
          font-size: 13px;
          color: #666;
        }

        .actions {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .actions span {
          font-size: 11px;
          background: #f1f5f9;
          padding: 4px 8px;
          border-radius: 6px;
        }

        .mini-stats p {
          font-size: 10px;
          color: #999;
          margin: 0;
        }

        .mini-stats h4 {
          margin: 0;
          font-size: 16px;
        }

        .arrow {
          font-size: 22px;
          font-weight: bold;
          transition: 0.2s;
        }

        .card:hover .arrow {
          transform: translateX(4px);
        }
      `}</style>
    </div>
  );
}