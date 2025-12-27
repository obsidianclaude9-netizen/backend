"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeScheduler = exports.reportWorker = exports.scheduleMonthlyReport = exports.scheduleWeeklySummaryReport = exports.scheduleDailyRevenueReport = exports.scheduledReportsQueue = void 0;
// src/jobs/scheduler.jobs.ts
const bullmq_1 = require("bullmq");
const queue_1 = require("../config/queue");
const analytics_service_1 = require("../modules/analytics/analytics.service");
const email_1 = require("../config/email");
const database_1 = __importDefault(require("../config/database"));
const logger_1 = require("../utils/logger");
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const analyticsService = new analytics_service_1.AnalyticsService();
// Scheduled reports queue
exports.scheduledReportsQueue = new bullmq_1.Queue('scheduled-reports', {
    connection: queue_1.connection,
});
/**
 * Schedule daily revenue report
 */
const scheduleDailyRevenueReport = async () => {
    await exports.scheduledReportsQueue.add('daily-revenue', {}, {
        repeat: {
            pattern: '0 8 * * *', // Every day at 8 AM
        },
    });
    logger_1.logger.info('Daily revenue report scheduled');
};
exports.scheduleDailyRevenueReport = scheduleDailyRevenueReport;
/**
 * Schedule weekly summary report
 */
const scheduleWeeklySummaryReport = async () => {
    await exports.scheduledReportsQueue.add('weekly-summary', {}, {
        repeat: {
            pattern: '0 9 * * 1', // Every Monday at 9 AM
        },
    });
    logger_1.logger.info('Weekly summary report scheduled');
};
exports.scheduleWeeklySummaryReport = scheduleWeeklySummaryReport;
/**
 * Schedule monthly detailed report
 */
const scheduleMonthlyReport = async () => {
    await exports.scheduledReportsQueue.add('monthly-report', {}, {
        repeat: {
            pattern: '0 7 1 * *', // 1st of every month at 7 AM
        },
    });
    logger_1.logger.info('Monthly report scheduled');
};
exports.scheduleMonthlyReport = scheduleMonthlyReport;
/**
 * Report worker
 */
exports.reportWorker = new bullmq_1.Worker('scheduled-reports', async (job) => {
    const { name } = job;
    try {
        switch (name) {
            case 'daily-revenue':
                await generateDailyRevenueReport();
                break;
            case 'weekly-summary':
                await generateWeeklySummaryReport();
                break;
            case 'monthly-report':
                await generateMonthlyReport();
                break;
            default:
                logger_1.logger.warn(`Unknown report type: ${name}`);
        }
        return { success: true, report: name };
    }
    catch (error) {
        logger_1.logger.error(`Report generation failed (${name}):`, error);
        throw error;
    }
}, {
    connection: queue_1.connection,
    concurrency: 1,
});
/**
 * Generate daily revenue report
 */
async function generateDailyRevenueReport() {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const startDate = yesterday.toISOString().split('T')[0];
    const endDate = today.toISOString().split('T')[0];
    // Get metrics
    const revenue = await analyticsService.getRevenueMetrics(startDate, endDate);
    const tickets = await analyticsService.getTicketStats(startDate, endDate);
    const scans = await analyticsService.getScanStats(startDate, endDate);
    // Generate HTML report
    const html = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; }
          .header { background: #4CAF50; color: white; padding: 20px; }
          .metric { padding: 15px; margin: 10px 0; border: 1px solid #ddd; }
          .metric h3 { margin: 0 0 10px 0; color: #333; }
          .metric .value { font-size: 24px; font-weight: bold; color: #4CAF50; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Daily Revenue Report</h1>
          <p>${yesterday.toLocaleDateString()}</p>
        </div>

        <div class="metric">
          <h3>💰 Revenue</h3>
          <div class="value">₦${revenue.totalRevenue.toLocaleString()}</div>
          <p>${revenue.orderCount} orders completed</p>
        </div>

        <div class="metric">
          <h3>🎫 Tickets</h3>
          <div class="value">${tickets.total} tickets</div>
          <p>${tickets.statusBreakdown.active || 0} active, ${tickets.statusBreakdown.scanned || 0} scanned</p>
        </div>

        <div class="metric">
          <h3>📊 Scans</h3>
          <div class="value">${scans.totalScans} scans</div>
          <p>${scans.allowedScans} allowed, ${scans.deniedScans} denied</p>
        </div>

        <p style="color: #666; margin-top: 30px;">
          Generated at ${new Date().toLocaleString()}
        </p>
      </body>
    </html>
  `;
    // Get admin emails
    const admins = await database_1.default.user.findMany({
        where: {
            role: { in: ['SUPER_ADMIN', 'ADMIN'] },
            isActive: true,
        },
        select: { email: true },
    });
    // Send to all admins
    for (const admin of admins) {
        await (0, email_1.sendEmail)({
            to: admin.email,
            subject: `Daily Revenue Report - ${yesterday.toLocaleDateString()}`,
            html,
        });
    }
    logger_1.logger.info(`Daily revenue report sent to ${admins.length} admins`);
}
/**
 * Generate weekly summary report
 */
async function generateWeeklySummaryReport() {
    const today = new Date();
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    const startDate = lastWeek.toISOString().split('T')[0];
    const endDate = today.toISOString().split('T')[0];
    // Get all metrics
    const revenue = await analyticsService.getRevenueMetrics(startDate, endDate);
    const tickets = await analyticsService.getTicketStats(startDate, endDate);
    const customers = await analyticsService.getCustomerStats(startDate, endDate);
    const scans = await analyticsService.getScanStats(startDate, endDate);
    const html = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
          .section { margin: 20px 0; padding: 20px; background: #f8f9fa; border-radius: 8px; }
          .metrics { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
          .metric-box { background: white; padding: 15px; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .metric-box h4 { margin: 0 0 10px 0; color: #666; font-size: 14px; }
          .metric-box .value { font-size: 28px; font-weight: bold; color: #667eea; }
          .top-customers { background: white; padding: 15px; border-radius: 5px; margin-top: 15px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📈 Weekly Summary Report</h1>
          <p>${lastWeek.toLocaleDateString()} - ${today.toLocaleDateString()}</p>
        </div>

        <div class="section">
          <h2>💰 Revenue Overview</h2>
          <div class="metrics">
            <div class="metric-box">
              <h4>Total Revenue</h4>
              <div class="value">₦${revenue.totalRevenue.toLocaleString()}</div>
            </div>
            <div class="metric-box">
              <h4>Orders</h4>
              <div class="value">${revenue.orderCount}</div>
            </div>
            <div class="metric-box">
              <h4>Avg Order Value</h4>
              <div class="value">₦${Math.round(revenue.avgOrderValue).toLocaleString()}</div>
            </div>
            <div class="metric-box">
              <h4>Tickets Sold</h4>
              <div class="value">${tickets.total}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <h2>👥 Customer Insights</h2>
          <div class="metrics">
            <div class="metric-box">
              <h4>New Customers</h4>
              <div class="value">${customers.total}</div>
            </div>
            <div class="metric-box">
              <h4>Conversion Rate</h4>
              <div class="value">${customers.conversionRate}%</div>
            </div>
          </div>
        </div>

        <div class="section">
          <h2>🎫 Ticket & Scan Stats</h2>
          <div class="metrics">
            <div class="metric-box">
              <h4>Total Scans</h4>
              <div class="value">${scans.totalScans}</div>
            </div>
            <div class="metric-box">
              <h4>Success Rate</h4>
              <div class="value">${scans.successRate}%</div>
            </div>
          </div>
        </div>

        <p style="color: #666; text-align: center; margin-top: 30px;">
          Generated at ${new Date().toLocaleString()}<br>
          JGPNR Paintball Admin System
        </p>
      </body>
    </html>
  `;
    const admins = await database_1.default.user.findMany({
        where: { role: { in: ['SUPER_ADMIN', 'ADMIN'] }, isActive: true },
        select: { email: true },
    });
    for (const admin of admins) {
        await (0, email_1.sendEmail)({
            to: admin.email,
            subject: `Weekly Summary Report - Week of ${lastWeek.toLocaleDateString()}`,
            html,
        });
    }
    logger_1.logger.info(`Weekly summary report sent to ${admins.length} admins`);
}
/**
 * Generate monthly detailed report with CSV attachments
 */
async function generateMonthlyReport() {
    const today = new Date();
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
    const startDate = lastMonth.toISOString().split('T')[0];
    const endDate = lastMonthEnd.toISOString().split('T')[0];
    // Generate CSV exports
    const ordersCSV = await analyticsService.exportData('orders', startDate, endDate);
    const ticketsCSV = await analyticsService.exportData('tickets', startDate, endDate);
    // Save to temp files
    const tempDir = path_1.default.join(process.cwd(), 'temp');
    await promises_1.default.mkdir(tempDir, { recursive: true });
    const ordersPath = path_1.default.join(tempDir, `orders_${lastMonth.getMonth() + 1}.csv`);
    const ticketsPath = path_1.default.join(tempDir, `tickets_${lastMonth.getMonth() + 1}.csv`);
    await promises_1.default.writeFile(ordersPath, ordersCSV);
    await promises_1.default.writeFile(ticketsPath, ticketsCSV);
    // Get metrics
    const revenue = await analyticsService.getRevenueMetrics(startDate, endDate);
    const html = `
    <html>
      <body style="font-family: Arial, sans-serif;">
        <h1>Monthly Report - ${lastMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</h1>
        <h2>Summary</h2>
        <ul>
          <li><strong>Total Revenue:</strong> ₦${revenue.totalRevenue.toLocaleString()}</li>
          <li><strong>Total Orders:</strong> ${revenue.orderCount}</li>
          <li><strong>Avg Order Value:</strong> ₦${Math.round(revenue.avgOrderValue).toLocaleString()}</li>
        </ul>
        <p>Detailed data is attached as CSV files.</p>
      </body>
    </html>
  `;
    const admins = await database_1.default.user.findMany({
        where: { role: 'SUPER_ADMIN', isActive: true },
        select: { email: true },
    });
    for (const admin of admins) {
        await (0, email_1.sendEmail)({
            to: admin.email,
            subject: `Monthly Report - ${lastMonth.toLocaleString('default', { month: 'long' })}`,
            html,
            attachments: [
                { filename: 'orders.csv', path: ordersPath },
                { filename: 'tickets.csv', path: ticketsPath },
            ],
        });
    }
    // Cleanup temp files
    await promises_1.default.unlink(ordersPath);
    await promises_1.default.unlink(ticketsPath);
    logger_1.logger.info(`Monthly report sent to ${admins.length} super admins`);
}
// Initialize schedules
const initializeScheduler = async () => {
    await (0, exports.scheduleDailyRevenueReport)();
    await (0, exports.scheduleWeeklySummaryReport)();
    await (0, exports.scheduleMonthlyReport)();
    logger_1.logger.info('All report schedules initialized');
};
exports.initializeScheduler = initializeScheduler;
//# sourceMappingURL=scheduler.jobs.js.map