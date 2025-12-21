import { Link } from 'react-router-dom'

function Layout({ children }) {
  return (
    <div>
      <header className="header">
        <div className="container">
          <h1>Taller Mecánico</h1>
        </div>
      </header>
      
      <nav className="nav">
        <div className="container">
          <ul>
            <li><Link to="/">Clientes</Link></li>
            <li><Link to="/work-orders/new">Nueva OT</Link></li>
          </ul>
        </div>
      </nav>
      
      <main className="container">
        {children}
      </main>
    </div>
  )
}

export default Layout