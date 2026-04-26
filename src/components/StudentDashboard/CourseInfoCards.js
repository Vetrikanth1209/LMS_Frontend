import React from "react";
import { Building, GraduationCap, User, Users } from "lucide-react";
import "D:/cresent-monolithic-frontend/src/styles/CourseInfoCards.css";

export default function CourseInfoCards({
  orgName,
  moduleName,
  expertName,
  coordinatorName,
}) {
  return (
    <div className="cic-grid">

      {/* Organisation */}
      <div className="cic-card cic-card--org">
        <div className="cic-icon cic-icon--org">
          <Building size={20} />
        </div>
        <div>
          <div className="cic-label">ORGANIZATION</div>
          <div className="cic-value">{orgName}</div>
        </div>
      </div>

      {/* Module */}
      <div className="cic-card cic-card--module">
        <div className="cic-icon cic-icon--module">
          <GraduationCap size={20} />
        </div>
        <div>
          <div className="cic-label">MODULE</div>
          <div className="cic-value">{moduleName}</div>
        </div>
      </div>

      {/* Expert */}
      <div className="cic-card cic-card--expert">
        <div className="cic-icon cic-icon--expert">
          <User size={20} />
        </div>
        <div>
          <div className="cic-label">EXPERT</div>
          <div className="cic-value">{expertName}</div>
        </div>
      </div>

      {/* Coordinator */}
      <div className="cic-card cic-card--coordinator">
        <div className="cic-icon cic-icon--coordinator">
          <Users size={20} />
        </div>
        <div>
          <div className="cic-label">COORDINATOR</div>
          <div className="cic-value">{coordinatorName}</div>
        </div>
      </div>

    </div>
  );
}