export default function HomePage() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui', minHeight: '100vh', backgroundColor: '#fafafa' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
        Automated Trading System
      </h1>
      <p style={{ color: '#666', marginBottom: '2rem' }}>
        Professional crypto trading dashboard
      </p>
      
      <div style={{ 
        padding: '1.5rem', 
        backgroundColor: 'white',
        border: '1px solid #e5e5e5', 
        borderRadius: '8px',
        marginBottom: '2rem'
      }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
          System Status
        </h2>
        <p style={{ color: '#10b981', fontWeight: '500' }}>Operational</p>
      </div>

      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
        Exchange Connections
      </h2>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1rem' 
      }}>
        <div style={{ padding: '1rem', backgroundColor: 'white', border: '1px solid #e5e5e5', borderRadius: '8px' }}>
          <h3 style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Binance Spot</h3>
          <p style={{ fontSize: '0.875rem', color: '#666' }}>Active</p>
        </div>
        <div style={{ padding: '1rem', backgroundColor: 'white', border: '1px solid #e5e5e5', borderRadius: '8px' }}>
          <h3 style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Bybit Spot</h3>
          <p style={{ fontSize: '0.875rem', color: '#666' }}>Active</p>
        </div>
        <div style={{ padding: '1rem', backgroundColor: 'white', border: '1px solid #e5e5e5', borderRadius: '8px' }}>
          <h3 style={{ fontWeight: '600', marginBottom: '0.25rem' }}>OKX Spot</h3>
          <p style={{ fontSize: '0.875rem', color: '#666' }}>Active</p>
        </div>
      </div>
    </div>
  )
}
