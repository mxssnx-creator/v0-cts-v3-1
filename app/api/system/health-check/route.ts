import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { TradeEngineManager } from '@/lib/trade-engine/engine-manager';

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
      const db = await getDb();
      
      // Verify critical tables exist
      const tables = await db.all(
        "SELECT name FROM sqlite_master WHERE type='table' AND name IN (?, ?, ?, ?, ?)",
        ['exchange_connections', 'positions', 'orders', 'trades', 'trade_progression']
      );
      
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
      const db = await getDb();
      const connections = await db.all('SELECT * FROM exchange_connections WHERE is_active = 1');
      const testedConnections = connections.filter(c => c.last_test_result === 'success');
      
      healthCheck.components.connections.count = connections.length;
      
      if (connections.length === 0) {
        healthCheck.components.connections.status = 'healthy';
        healthCheck.components.connections.details = 'No connections configured';
      } else if (testedConnections.length === connections.length) {
        healthCheck.components.connections.status = 'healthy';
        healthCheck.components.connections.details = `All ${connections.length} connections tested successfully`;
      } else {
        healthCheck.components.connections.status = 'error';
        healthCheck.components.connections.details = `${connections.length - testedConnections.length} untested connections`;
        healthCheck.issues.push('Some connections not tested');
        healthCheck.overall = healthCheck.overall === 'critical' ? 'critical' : 'degraded';
      }

      // Verify connection testing workflow
      if (connections.length > 0) {
        const hasTestTimestamps = connections.every(c => c.last_test_at !== null);
        healthCheck.workflows.connectionTesting.status = hasTestTimestamps ? 'working' : 'broken';
        healthCheck.workflows.connectionTesting.details = hasTestTimestamps 
          ? 'Connection testing working properly' 
          : 'Some connections never tested';
      } else {
        healthCheck.workflows.connectionTesting.status = 'working';
        healthCheck.workflows.connectionTesting.details = 'No connections to test';
      }
    } catch (error) {
      healthCheck.components.connections.status = 'error';
      healthCheck.components.connections.details = error instanceof Error ? error.message : String(error);
      healthCheck.issues.push('Connection check failed');
      healthCheck.overall = 'critical';
    }

    // 3. Trade Engine Health Check
    console.log('[v0] Checking trade engine');
    try {
      const manager = TradeEngineManager.getInstance();
      const allStatuses = manager.getAllEngineStatuses?.() || new Map();
      const runningEngines = Array.from(allStatuses.entries()).filter(([_, status]) => status.running);
      
      healthCheck.components.tradeEngine.running = runningEngines.length;
      healthCheck.components.tradeEngine.status = 'healthy';
      healthCheck.components.tradeEngine.details = runningEngines.length > 0 
        ? `${runningEngines.length} engines running` 
        : 'No engines running (normal if not trading)';

      // Verify engine management workflow
      const db = await getDb();
      const dbRunningCount = await db.get(
        'SELECT COUNT(*) as count FROM exchange_connections WHERE engine_running = 1'
      );
      
      if (dbRunningCount.count === runningEngines.length) {
        healthCheck.workflows.engineStartStop.status = 'working';
        healthCheck.workflows.engineStartStop.details = 'Engine status synchronized with database';
      } else {
        healthCheck.workflows.engineStartStop.status = 'broken';
        healthCheck.workflows.engineStartStop.details = `Mismatch: DB shows ${dbRunningCount.count}, Manager shows ${runningEngines.length}`;
        healthCheck.issues.push('Engine status desynchronized');
        healthCheck.overall = healthCheck.overall === 'critical' ? 'critical' : 'degraded';
      }
    } catch (error) {
      healthCheck.components.tradeEngine.status = 'error';
      healthCheck.components.tradeEngine.details = error instanceof Error ? error.message : String(error);
      healthCheck.issues.push('Trade engine check failed');
      healthCheck.overall = 'critical';
    }

    // 4. Position Management Check
    console.log('[v0] Checking positions');
    try {
      const db = await getDb();
      const [positions] = await db.all('SELECT COUNT(*) as count FROM positions');
      const [openPositions] = await db.all('SELECT COUNT(*) as count FROM positions WHERE status = ?', ['open']);
      
      healthCheck.components.positions.count = positions?.count || 0;
      healthCheck.components.positions.status = 'healthy';
      
      healthCheck.workflows.positionManagement.status = 'working';
      healthCheck.workflows.positionManagement.details = `${openPositions?.count || 0} open positions, ${positions?.count || 0} total`;
    } catch (error) {
      healthCheck.components.positions.status = 'error';
      healthCheck.issues.push('Position check failed');
      healthCheck.overall = healthCheck.overall === 'critical' ? 'critical' : 'degraded';
    }

    // 5. Order Management Check
    console.log('[v0] Checking orders');
    try {
      const db = await getDb();
      const [orders] = await db.all('SELECT COUNT(*) as count FROM orders');
      const [pendingOrders] = await db.all('SELECT COUNT(*) as count FROM orders WHERE status = ?', ['pending']);
      
      healthCheck.components.orders.count = orders?.count || 0;
      healthCheck.components.orders.status = 'healthy';
      
      healthCheck.workflows.orderExecution.status = 'working';
      healthCheck.workflows.orderExecution.details = `${pendingOrders?.count || 0} pending orders, ${orders?.count || 0} total`;
    } catch (error) {
      healthCheck.components.orders.status = 'error';
      healthCheck.issues.push('Order check failed');
      healthCheck.overall = healthCheck.overall === 'critical' ? 'critical' : 'degraded';
    }

    // 6. Monitoring System Check
    console.log('[v0] Checking monitoring');
    try {
      const db = await getDb();
      const [recentLogs] = await db.all(
        'SELECT COUNT(*) as count FROM site_logs WHERE timestamp > datetime("now", "-1 hour")'
      );
      
      healthCheck.components.monitoring.status = 'healthy';
      healthCheck.components.monitoring.details = `${recentLogs?.count || 0} logs in last hour`;
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
