import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import "./styles/token.css";

// ── Page imports ────────────────────────────────────────────────────────────
import ZealousSignIn        from "./pages/SiginIn";
import TestModule           from "./pages/TestModules";
import TestResult           from "./pages/TestResult";
import CertificateApp       from "./components/certificate";
import StudentDashboard     from "./pages/StudentDashboard";
import TestIntro            from "./pages/TestIntro";
import TestDetails          from "./pages/TestDetails";
import CodingPage           from "./pages/CodingPage";
import McqPage              from "./pages/McqPage";
import InstructionsPage     from "./pages/Info";
import AdminDashboard       from "./pages/AdminDashboard";
import PocPage              from "./pages/View_Poc";
import UserPage             from "./pages/UserPage";
import ModulePage           from "./pages/View_Module";
import OrganizationPage     from "./pages/View_Organization";
import ExpertPage           from "./pages/ExpertPage";
import McqAdminPage         from "./pages/View_Mcq";
import TestAdminPage        from "./pages/View_Test";
import CodeList             from "./pages/CodeList";
import Add_Mcq              from "./pages/Add_Mcq";
import Add_Module           from "./pages/Add_Module";
import Add_Organisation     from "./pages/Add_Organisation";
import Add_TestCase         from "./pages/Add_Testcase";
import Add_Coding           from "./pages/Add_Coding";
import Add_POC              from "./pages/Add_Poc";
import Codingpage           from "./pages/Coding";
import Testcase_page        from "./pages/View_testcase";
import Update_coding        from "./pages/Update_coding";
import UpdateTestModule     from "./pages/Update_Test";
import Update_Poc           from "./pages/Update_Poc";
import Add_Expert           from "./pages/Add_Expert";
import Add_User             from "./pages/Add_User";
import Update_Expert        from "./pages/Update_Expert";
import Update_Organization  from "./pages/Update_Organization";
import BulkCertificateGenerator from "./pages/BulkCertificateGenerator";
import ClassPerformance     from "./pages/MasterReport";
import AttendanceAnalytics  from "./pages/ViewAttendance";
import TrainingForm         from "./pages/MasterAnalytics";
import IndividualReport     from "./pages/IndividualStudentData";
import Add_Test             from "./pages/Add_Test";
import Allocate_Test        from "./pages/Allocate_Test";
import UpdateModule         from "./pages/Update_Module";
import Administrative_Side  from "./pages/Administrative_Side";
import TestSide             from "./pages/Test_Side";
import Admin_Dash           from "./components/AdminDash";
import Link_Module_To_POC   from "./pages/Link_Module_To_POC";
import Link_Users_To_POC    from "./pages/Link_Users_To_POC";
import MoreCustomization    from "./pages/MoreCustomization_Side";
import Certificate_Generator from "./pages/Certificate_Generator";

// ── Root App component ──────────────────────────────────────────────────────
//
//  KEY FIX: Auth check lives INSIDE a React component, not at module scope.
//  Running it at module scope means it executes once when the JS bundle
//  loads and never re-evaluates, which breaks navigation after login/logout.
//  Wrapping everything in <BrowserRouter> at the top level (here) is also
//  required — splitting the router across conditional branches causes
//  React Router to lose its context between renders.
//
function App() {
  const isLoggedIn  = localStorage.getItem("isLoggedIn") === "true";
  const sessionData = JSON.parse(localStorage.getItem("true") || "null");
  const user        = sessionData?.user;
  const isAdmin     = user?.admin === true;

  if (!isLoggedIn) {
    return (
      <Routes>
        <Route path="/"  element={<ZealousSignIn />} />
        <Route path="*"  element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  if (isAdmin) {
    return (
      <Routes>
        <Route path="/landing"              element={<AdminDashboard />} />
        <Route path="/poc"                  element={<PocPage />} />
        <Route path="/user"                 element={<UserPage />} />
        <Route path="/module"              element={<ModulePage />} />
        <Route path="/organization"        element={<OrganizationPage />} />
        <Route path="/expert"              element={<ExpertPage />} />
        <Route path="/codingpage"          element={<Codingpage />} />
        <Route path="/testcasepage"        element={<Testcase_page />} />
        <Route path="/mcq-admin"           element={<McqAdminPage />} />
        <Route path="/test"                element={<TestAdminPage />} />
        <Route path="/add_mcq"             element={<Add_Mcq />} />
        <Route path="/bulk_certficate"     element={<BulkCertificateGenerator />} />
        <Route path="/bulk_certificate"    element={<BulkCertificateGenerator />} />
        <Route path="/add_module"          element={<Add_Module />} />
        <Route path="/add_organisation"    element={<Add_Organisation />} />
        <Route path="/add_testcase"        element={<Add_TestCase />} />
        <Route path="/add_coding"          element={<Add_Coding />} />
        <Route path="/add_expert"          element={<Add_Expert />} />
        <Route path="/add_poc"             element={<Add_POC />} />
        <Route path="/add_test"            element={<Add_Test />} />
        <Route path="/add_user"            element={<Add_User />} />
        <Route path="/update_coding"       element={<Update_coding />} />
        <Route path="/update_poc"          element={<Update_Poc />} />
        <Route path="/update_expert"       element={<Update_Expert />} />
        <Route path="/update_organization" element={<Update_Organization />} />
        <Route path="/update_module"       element={<UpdateModule />} />
        <Route path="/update_test"         element={<UpdateTestModule />} />
        <Route path="/reportAndPieGen"     element={<ClassPerformance />} />
        <Route path="/student/:report_id"  element={<IndividualReport />} />
        <Route path="/attendance"          element={<AttendanceAnalytics />} />
        <Route path="/reportGen"           element={<TrainingForm />} />
        <Route path="/allocate_test"       element={<Allocate_Test />} />
        <Route path="/administrative_side" element={<Administrative_Side />} />
        <Route path="/link_module_to_poc"  element={<Link_Module_To_POC />} />
        <Route path="/link_users_to_poc"   element={<Link_Users_To_POC />} />
        <Route path="/test_side"           element={<TestSide />} />
        <Route path="/more_customization"  element={<MoreCustomization />} />
        <Route path="/certificate"         element={<Certificate_Generator />} />
        <Route path="*"                    element={<Navigate to="/landing" replace />} />
      </Routes>
    );
  }

  // Student routes
  return (
    <Routes>
      <Route path="/landing"              element={<StudentDashboard />} />
      <Route path="/test-modules"         element={<TestModule />} />
      <Route path="/test-intro/:testId"   element={<TestIntro />} />
      <Route path="/test-details/:testId" element={<TestDetails />} />
      <Route path="/mcq/:testId"          element={<McqPage />} />
      <Route path="/coding/:codeId"       element={<CodingPage />} />
      <Route path="/test-result"          element={<TestResult />} />
      {/* <Route path="/testresults"          element={<TestResult />} /> */}
      <Route path="/info"                 element={<InstructionsPage />} />
      <Route path="/codelist"             element={<CodeList />} />
      <Route path="*"                     element={<Navigate to="/landing" replace />} />
    </Routes>
  );
}

// ── Mount ───────────────────────────────────────────────────────────────────
//
//  <BrowserRouter> wraps the entire app exactly ONCE, here at the root.
//  This is the correct pattern — never nest BrowserRouter inside components
//  or split it across conditional branches.
//
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);