import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import TeamManagementDashboard from './components/TeamManagementDashboard'
import TeamListView from './components/TeamListView'
import PlayerManagementInterface from './components/PlayerManagementInterface'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/dashboard" element={<Layout />}>
          <Route index element={<TeamManagementDashboard />} />
          <Route path="teams" element={<TeamListView />} />
          <Route path="players" element={<PlayerManagementInterface />} />
          <Route path="teams/create" element={<TeamListView />} />
          <Route path="players/create" element={<PlayerManagementInterface />} />
        </Route>
        <Route path="/" element={<Layout />}>
          <Route index element={<TeamManagementDashboard />} />
          <Route path="teams" element={<TeamListView />} />
          <Route path="players" element={<PlayerManagementInterface />} />
          <Route path="teams/create" element={<TeamListView />} />
          <Route path="players/create" element={<PlayerManagementInterface />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
