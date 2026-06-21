import React from 'react'
import AppRoutes from './router/AppRoutes.jsx'
import Header from './components/Header.jsx'

function App() {
  return (
    <div className="app">
      <Header />
      <main className="main-content">
        <AppRoutes />
      </main>
    </div>
  )
}

export default App
