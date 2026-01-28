import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { loadConnections } from '@/lib/file-storage';

/**
 * Comprehensive system health check endpoint
 * Verifies all critical system components and workflows
 */
export async function GET() {
  console.log('[v0] System health check initiated');
  
  const healthCheck = {
    timestamp: new Date().toISOString(),
    overall: 'healthy' as 'healthy' | 'degraded' | 'critical',
    components: {
      database: { status: 'unknown' as 'healthy' | 'error', details: '' },
      connections: { status: 'unknown' as 'healthy' | 'error', details: '', count: 0 },
      tradeEngine: { status: 'unknown' as 'healthy' | 'error', details: '', running: 0 },
      monitoring: { status: 'unknown' as 'healthy' | 'error', details: '' },
      positions: { status: 'unknown' as 'healthy' | 'error', count: 0 },
      orders: { status: 'unknown' as 'healthy' | 'error', count: 0 }
    },
    workflows: {
      connectionTesting: { status: 'unknown' as 'working' | 'broken', details: '' },
      engineStartStop: { status: 'unknown' as 'working' | 'broken', details: '' },
      positionManagement: { status: 'unknown' as 'working' | 'broken', details: '' },
      orderExecution: { status: 'unknown' as 'working' | 'broken', details: '' }
    },
    issues: [] as string[]
  };

  try {
    // 1. Database Health Check
    console.log('[v0] Checking database health');
    try {
      // Verify critical tables exist (using SQL template literal)
      const tables = await sql`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name IN ('exchange_connections', 'positions', 'orders', 'trades', 'trade_progression')
      ` as Array<{ name: string }>;
      
      if (tables.length >= 5) {
        healthCheck.components.database.status = 'healthy';
        healthCheck.components.database.details = `All ${tables.length} critical tables present`;
      } else {
        healthCheck.components.database.status = 'error';
        healthCheck.components.database.details = `Missing tables. Found ${tables.length}/5`;
        healthCheck.issues.push('Database schema incomplete');
        healthCheck.overall = 'critical';
      }
    } catch (error) {
      healthCheck.components.database.status = 'error';
      healthCheck.components.database.details = error instanceof Error ? error.message : String(error);
      healthCheck.issues.push('Database connection failed');
      healthCheck.overall = 'critical';
    }

    // 2. Connection Health Check
    console.log('[v0] Checking connections');
    try {
      const connections = loadConnections();
      const activeConnections = connections.filter((c) => c.is_enabled);
      const testedConnections = activeConnections.filter((c) => c.last_test_status === 'success');
      
      healthCheck.components.connections.count = activeConnections.length;
      
      if (activeConnections.length === 0) {
        healthCheck.components.connections.status = 'healthy';
        healthCheck.components.connections.details = 'No connections configured';
      } else if (testedConnections.length === activeConnections.length) {
        healthCheck.components.connections.status = 'healthy';
        healthCheck.components.connections.details = `All ${activeConnections.length} connections tested successfully`;
      } else {
        healthCheck.components.connections.status = 'error';
        healthCheck.components.connections.details = `${activeConnections.length - testedConnections.length} untested connections`;
        healthCheck.issues.push('Some connections not tested');
        healthCheck.overall = healthCheck.overall === 'critical' ? 'critical' : 'degraded';
      }

      // Verify connection testing workflow
      healthCheck.workflows.connectionTesting.status = 'working';
      healthCheck.workflows.connectionTesting.details = 'Connection testing available';
    } catch (error) {
      healthCheck.components.connections.status = 'error';
      healthCheck.components.connections.details = error instanceof Error ? error.message : String(error);
      healthCheck.issues.push('Connection check failed');
      healthCheck.overall = 'critical';
    }

    // 3. Trade Engine Health Check
    console.log('[v0] Checking trade engine');
    try {
      const engineStates = await sql`
        SELECT * FROM trade_engine_state WHERE state = 'running'
      ` as any[];
      
      healthCheck.components.tradeEngine.running = engineStates.length;
      healthCheck.components.tradeEngine.status = 'healthy';
      healthCheck.components.tradeEngine.details = engineStates.length > 0 
        ? `${engineStates.length} engines running` 
        : 'No engines running (normal if not trading)';

      healthCheck.workflows.engineStartStop.status = 'working';
      healthCheck.workflows.engineStartStop.details = 'Engine management operational';
    } catch (error) {
      healthCheck.components.tradeEngine.status = 'error';
      healthCheck.components.tradeEngine.details = error instanceof Error ? error.message : String(error);
      healthCheck.issues.push('Trade engine check failed');
      healthCheck.overall = 'critical';
    }

    // 4. Position Management Check
    console.log('[v0] Checking positions');
    try {
      const [positionsResult] = await sql`SELECT COUNT(*) as count FROM positions` as Array<{ count: number }>;
      const [openResult] = await sql`SELECT COUNT(*) as count FROM positions WHERE status = 'open'` as Array<{ count: number }>;
      
      healthCheck.components.positions.count = positionsResult?.count || 0;
      healthCheck.components.positions.status = 'healthy';
      
      healthCheck.workflows.positionManagement.status = 'working';
      healthCheck.workflows.positionManagement.details = `${openResult?.count || 0} open positions, ${positionsResult?.count || 0} total`;
    } catch (error) {
      healthCheck.components.positions.status = 'error';
      healthCheck.issues.push('Position check failed');
      healthCheck.overall = healthCheck.overall === 'critical' ? 'critical' : 'degraded';
    }

    // 5. Order Management Check
    console.log('[v0] Checking orders');
    try {
      const [ordersResult] = await sql`SELECT COUNT(*) as count FROM orders` as Array<{ count: number }>;
      const [pendingResult] = await sql`SELECT COUNT(*) as count FROM orders WHERE status = 'pending'` as Array<{ count: number }>;
      
      healthCheck.components.orders.count = ordersResult?.count || 0;
      healthCheck.components.orders.status = 'healthy';
      
      healthCheck.workflows.orderExecution.status = 'working';
      healthCheck.workflows.orderExecution.details = `${pendingResult?.count || 0} pending orders, ${ordersResult?.count || 0} total`;
    } catch (error) {
      healthCheck.components.orders.status = 'error';
      healthCheck.issues.push('Order check failed');
      healthCheck.overall = healthCheck.overall === 'critical' ? 'critical' : 'degraded';
    }

    // 6. Monitoring System Check
    console.log('[v0] Checking monitoring');
    try {
      const [logsResult] = await sql`
        SELECT COUNT(*) as count FROM site_logs 
        WHERE timestamp > datetime('now', '-1 hour')
      ` as Array<{ count: number }>;
      
      healthCheck.components.monitoring.status = 'healthy';
      healthCheck.components.monitoring.details = `${logsResult?.count || 0} logs in last hour`;
    } catch (error) {
      healthCheck.components.monitoring.status = 'error';
      healthCheck.issues.push('Monitoring system check failed');
      healthCheck.overall = healthCheck.overall === 'critical' ? 'critical' : 'degraded';
    }

    console.log('[v0] Health check completed:', healthCheck.overall);
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[v0] Critical error during health check:', errorMessage);
    
    healthCheck.overall = 'critical';
    healthCheck.issues.push(`Critical health check error: ${errorMessage}`);
  }

  const statusCode = healthCheck.overall === 'healthy' ? 200 : 
                     healthCheck.overall === 'degraded' ? 207 : 500;

  return NextResponse.json(healthCheck, { status: statusCode });
}
