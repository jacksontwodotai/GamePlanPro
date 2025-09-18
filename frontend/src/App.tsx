import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Login from './components/Login'
import TeamManagementDashboard from './components/TeamManagementDashboard'
import TeamListView from './components/TeamListView'
import PlayerManagementInterface from './components/PlayerManagementInterface'
import EventSchedulerDashboard from './components/EventSchedulerDashboard'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Layout />}>
          <Route index element={<TeamManagementDashboard />} />
          <Route path="teams" element={<TeamListView />} />
          <Route path="players" element={<PlayerManagementInterface />} />
          <Route path="teams/create" element={<TeamListView />} />
          <Route path="players/create" element={<PlayerManagementInterface />} />
        </Route>
        <Route path="/teams" element={<Layout />}>
          <Route index element={<TeamListView />} />
          <Route path="create" element={<TeamListView />} />
          <Route path=":id" element={<TeamListView />} />
        </Route>
        <Route path="/players" element={<Layout />}>
          <Route index element={<PlayerManagementInterface />} />
          <Route path="create" element={<PlayerManagementInterface />} />
          <Route path=":id" element={<PlayerManagementInterface />} />
        </Route>
        <Route path="/events/*" element={<Layout />}>
          <Route path="*" element={<EventSchedulerDashboard />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
