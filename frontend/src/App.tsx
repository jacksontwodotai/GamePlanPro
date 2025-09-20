import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Login from './components/Login'
import RegistrationMainDashboard from './components/RegistrationMainDashboard'
import TeamManagementDashboard from './components/TeamManagementDashboard'
import TeamListView from './components/TeamListView'
import PlayerManagementInterface from './components/PlayerManagementInterface'
import PlayerProfileDashboard from './components/PlayerProfileDashboard'
import PlayerManagementDashboard from './components/PlayerManagementDashboard'
import EventSchedulerDashboard from './components/EventSchedulerDashboard'
import TeamStructureDashboard from './components/TeamStructureDashboard'
import DivisionManagement from './components/DivisionManagement'
import AgeGroupManagement from './components/AgeGroupManagement'
import SkillLevelManagement from './components/SkillLevelManagement'
import TeamRosterManagement from './components/TeamRosterManagement'
import AttendanceTracker from './components/AttendanceTracker'
import AttendanceReportingDashboard from './components/AttendanceReportingDashboard'
import RosterManagementDashboard from './components/RosterManagementDashboard'
import ReportGenerationForm from './components/ReportGenerationForm'
import ReportsDashboard from './components/ReportsDashboard'
import ProgramManagement from './components/ProgramManagement'
import RegistrationFlow from './components/RegistrationFlow'
import PublicRegistration from './components/PublicRegistration'
import RegistrationManagementDashboard from './components/RegistrationManagementDashboard'
import PaymentHistoryDashboard from './components/PaymentHistoryDashboard'
import FormManagement from './components/FormManagement'
import FormBuilderDashboard from './components/FormBuilderDashboard'
import FormEditor from './components/FormEditor'
import { AuthProvider } from './contexts/AuthContext'

function App() {
  return (
    <AuthProvider>
      <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Layout />}>
          <Route index element={<RegistrationMainDashboard />} />
          <Route path="teams" element={<TeamListView />} />
          <Route path="players" element={<PlayerProfileDashboard />} />
          <Route path="roster" element={<TeamRosterManagement />} />
          <Route path="teams/create" element={<TeamListView />} />
          <Route path="players/list" element={<PlayerManagementInterface />} />
          <Route path="players/create" element={<PlayerManagementInterface />} />
          <Route path="attendance" element={<AttendanceTracker />} />
          <Route path="reports/attendance" element={<AttendanceReportingDashboard />} />
          <Route path="reports/generate" element={<ReportGenerationForm />} />
          <Route path="roster/dashboard" element={<RosterManagementDashboard />} />
          <Route path="programs" element={<ProgramManagement />} />
          <Route path="registrations" element={<RegistrationManagementDashboard />} />
          <Route path="payments" element={<PaymentHistoryDashboard />} />
          <Route path="forms" element={<FormBuilderDashboard />} />
          <Route path="forms/new" element={<FormEditor />} />
          <Route path="forms/:formId" element={<FormEditor />} />
        </Route>
        <Route path="/teams" element={<Layout />}>
          <Route index element={<TeamListView />} />
          <Route path="create" element={<TeamListView />} />
          <Route path="roster" element={<TeamRosterManagement />} />
          <Route path="roster/dashboard" element={<RosterManagementDashboard />} />
          <Route path="attendance" element={<AttendanceTracker />} />
          <Route path="reports/attendance" element={<AttendanceReportingDashboard />} />
          <Route path="reports/generate" element={<ReportGenerationForm />} />
          <Route path=":id" element={<TeamListView />} />
        </Route>
        <Route path="/players" element={<Layout />}>
          <Route index element={<PlayerProfileDashboard />} />
          <Route path="list" element={<PlayerManagementInterface />} />
          <Route path="enhanced" element={<PlayerManagementDashboard />} />
          <Route path="create" element={<PlayerManagementInterface />} />
          <Route path=":id" element={<PlayerManagementInterface />} />
        </Route>
        <Route path="/events/*" element={<Layout />}>
          <Route path="*" element={<EventSchedulerDashboard />} />
        </Route>
        <Route path="/structure" element={<Layout />}>
          <Route index element={<TeamStructureDashboard />} />
          <Route path="divisions" element={<DivisionManagement />} />
          <Route path="age-groups" element={<AgeGroupManagement />} />
          <Route path="skill-levels" element={<SkillLevelManagement />} />
        </Route>
        <Route path="/reports" element={<Layout />}>
          <Route index element={<ReportsDashboard />} />
          <Route path="generate" element={<ReportGenerationForm />} />
          <Route path="roster" element={<ReportGenerationForm />} />
          <Route path="contacts" element={<ReportGenerationForm />} />
          <Route path="teams" element={<ReportGenerationForm />} />
        </Route>
        <Route path="/programs" element={<Layout />}>
          <Route index element={<ProgramManagement />} />
        </Route>
        <Route path="/register" element={<RegistrationFlow />} />
        <Route path="/signup" element={<PublicRegistration />} />
      </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
