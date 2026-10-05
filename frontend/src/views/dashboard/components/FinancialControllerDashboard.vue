<template>
  <div class="fc-dashboard">
    <!-- ============================================================
         HEADER
         ============================================================ -->
    <header class="fc-header">
      <div class="fc-header__left">
        <h1>💰 Financial Controller Dashboard</h1>
        <p>Live overview of cash flow, payments, banking, and controls.</p>
      </div>
      <div class="fc-header__right">
        <div class="period-picker">
          <button
            v-for="p in periods"
            :key="p.key"
            :class="['period-btn', { active: activePeriod === p.key }]"
            @click="activePeriod = p.key"
          >
            {{ p.label }}
          </button>
        </div>
        <button class="btn-export" @click="exportReport">📥 Export</button>
      </div>
    </header>

    <!-- ============================================================
         KPI CARDS
         ============================================================ -->
    <section class="kpi-grid">
      <div
        v-for="kpi in kpis"
        :key="kpi.key"
        :class="['kpi-card', `kpi-card--${kpi.tone}`]"
      >
        <div class="kpi-card__icon">{{ kpi.icon }}</div>
        <div class="kpi-card__body">
          <div class="kpi-card__label">{{ kpi.label }}</div>
          <div class="kpi-card__value">{{ kpi.value }}</div>
          <div class="kpi-card__delta" :class="`kpi-card__delta--${kpi.deltaTone}`">
            {{ kpi.deltaTone === 'up' ? '▲' : '▼' }} {{ kpi.delta }}
            <span class="kpi-card__delta-label">vs last period</span>
          </div>
        </div>
        <div class="kpi-card__sparkline">
          <svg viewBox="0 0 100 30" preserveAspectRatio="none">
            <polyline
              :points="kpi.sparkline"
              fill="none"
              :stroke="kpi.tone === 'green' ? '#10B981' : kpi.tone === 'red' ? '#EF4444' : '#8B5CF6'"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>
      </div>
    </section>

    <!-- ============================================================
         CONTROL ALERTS (controller-specific)
         ============================================================ -->
    <section class="alerts-row">
      <div
        v-for="alert in controlAlerts"
        :key="alert.id"
        :class="['alert-card', `alert-card--${alert.severity}`]"
      >
        <div class="alert-card__icon">{{ alert.icon }}</div>
        <div class="alert-card__body">
          <div class="alert-card__title">{{ alert.title }}</div>
          <div class="alert-card__desc">{{ alert.desc }}</div>
        </div>
        <button class="alert-card__action">Review →</button>
      </div>
    </section>

    <!-- ============================================================
         CASH FLOW CHART + BANK BALANCES
         ============================================================ -->
    <section class="row row--two-col">
      <div class="card card--chart">
        <div class="card__header">
          <h3>📊 Cash Flow</h3>
          <div class="legend">
            <span><i class="dot dot--in"></i> Inflow</span>
            <span><i class="dot dot--out"></i> Outflow</span>
          </div>
        </div>
        <div class="chart">
          <svg viewBox="0 0 400 180" preserveAspectRatio="none">
            <g stroke="#E2E8F0" stroke-width="1">
              <line x1="30" y1="20" x2="390" y2="20" />
              <line x1="30" y1="60" x2="390" y2="60" />
              <line x1="30" y1="100" x2="390" y2="100" />
              <line x1="30" y1="140" x2="390" y2="140" />
            </g>
            <g fill="#10B981" opacity="0.85">
              <rect v-for="(d, i) in cashFlow" :key="`in-${i}`"
                :x="40 + i * 45" :y="140 - d.inflow" width="16" :height="d.inflow" rx="3" />
            </g>
            <g fill="#EF4444" opacity="0.85">
              <rect v-for="(d, i) in cashFlow" :key="`out-${i}`"
                :x="58 + i * 45" :y="140 - d.outflow" width="16" :height="d.outflow" rx="3" />
            </g>
            <g fill="#94A3B8" font-size="9" text-anchor="middle">
              <text v-for="(d, i) in cashFlow" :key="`lbl-${i}`"
                :x="57 + i * 45" y="160">{{ d.label }}</text>
            </g>
          </svg>
        </div>
        <div class="chart-summary">
          <div><span>Total in</span> <strong class="text-green">+ETB 4.82M</strong></div>
          <div><span>Total out</span> <strong class="text-red">−ETB 3.14M</strong></div>
          <div><span>Net</span> <strong>+ETB 1.68M</strong></div>
        </div>
      </div>

      <div class="card">
        <div class="card__header">
          <h3>🏦 Bank Accounts</h3>
          <button class="link-btn">View all →</button>
        </div>
        <ul class="bank-list">
          <li v-for="b in bankAccounts" :key="b.id" class="bank-row">
            <div class="bank-row__logo" :style="{ background: b.color }">
              {{ b.initials }}
            </div>
            <div class="bank-row__info">
              <div class="bank-row__name">{{ b.name }}</div>
              <div class="bank-row__acct">{{ b.accountMasked }}</div>
            </div>
            <div class="bank-row__balance">
              <div class="bank-row__amount">{{ b.balance }}</div>
              <div class="bank-row__status" :class="`bank-row__status--${b.status}`">
                {{ b.status === 'ok' ? '● Healthy' : b.status === 'low' ? '⚠ Low' : '● Hold' }}
              </div>
            </div>
          </li>
        </ul>
        <div class="bank-total">
          <span>Total across accounts</span>
          <strong>ETB 12,482,900</strong>
        </div>
      </div>
    </section>

    <!-- ============================================================
         PENDING APPROVALS + RECENT TRANSACTIONS
         ============================================================ -->
    <section class="row row--two-col">
      <div class="card">
        <div class="card__header">
          <h3>⏳ Pending Approvals</h3>
          <span class="badge badge--warn">{{ pendingApprovals.length }}</span>
        </div>
        <ul class="approval-list">
          <li v-for="a in pendingApprovals" :key="a.id" class="approval-row">
            <div class="approval-row__icon" :class="`approval-row__icon--${a.type}`">
              {{ a.type === 'payment' ? '💸' : a.type === 'payroll' ? '👥' : '📄' }}
            </div>
            <div class="approval-row__body">
              <div class="approval-row__title">{{ a.title }}</div>
              <div class="approval-row__meta">
                {{ a.requester }} · {{ a.date }}
              </div>
            </div>
            <div class="approval-row__amount">{{ a.amount }}</div>
            <div class="approval-row__actions">
              <button class="btn-icon btn-icon--approve" title="Approve">✓</button>
              <button class="btn-icon btn-icon--reject" title="Reject">✕</button>
            </div>
          </li>
          <li v-if="!pendingApprovals.length" class="approval-empty">
            🎉 Nothing pending — you're all caught up.
          </li>
        </ul>
      </div>

      <div class="card">
        <div class="card__header">
          <h3>📜 Recent Transactions</h3>
          <button class="link-btn">See all →</button>
        </div>
        <table class="tx-table">
          <thead>
            <tr>
              <th>Ref</th>
              <th>Description</th>
              <th>Date</th>
              <th class="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="t in recentTransactions" :key="t.id">
              <td class="tx-ref">{{ t.ref }}</td>
              <td>{{ t.desc }}</td>
              <td class="tx-date">{{ t.date }}</td>
              <td
                class="text-right tx-amount"
                :class="t.type === 'in' ? 'text-green' : 'text-red'"
              >
                {{ t.type === 'in' ? '+' : '−' }}{{ t.amount }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- ============================================================
         RECONCILIATION STATUS (controller-specific)
         ============================================================ -->
    <section class="card card--recon">
      <div class="card__header">
        <h3>🔍 Reconciliation Status</h3>
        <button class="link-btn">Open recon →</button>
      </div>
      <div class="recon-grid">
        <div v-for="r in reconciliation" :key="r.id" class="recon-item">
          <div class="recon-item__head">
            <span class="recon-item__name">{{ r.name }}</span>
            <span class="recon-item__pill" :class="`recon-item__pill--${r.status}`">
              {{ r.status === 'matched' ? '✓ Matched' : r.status === 'review' ? '⚠ Review' : '✕ Mismatch' }}
            </span>
          </div>
          <div class="recon-item__bar">
            <div
              class="recon-item__bar-fill"
              :class="`recon-item__bar-fill--${r.status}`"
              :style="{ width: r.percent + '%' }"
            />
          </div>
          <div class="recon-item__meta">
            {{ r.matched }} / {{ r.total }} entries · {{ r.percent }}%
          </div>
        </div>
      </div>
    </section>

    <!-- ============================================================
         QUICK ACTIONS
         ============================================================ -->
    <section class="card card--actions">
      <div class="card__header">
        <h3>⚡ Quick Actions</h3>
      </div>
      <div class="action-grid">
        <button v-for="a in quickActions" :key="a.key" class="action-tile" @click="a.action">
          <div class="action-tile__icon">{{ a.icon }}</div>
          <div class="action-tile__label">{{ a.label }}</div>
        </button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// ================================================================
// STATE
// ================================================================
const activePeriod = ref('month')
const periods = [
  { key: 'week',    label: 'This Week'    },
  { key: 'month',   label: 'This Month'   },
  { key: 'quarter', label: 'This Quarter' },
  { key: 'year',    label: 'This Year'    },
]

// ================================================================
// KPI CARDS
// ================================================================
const kpis = computed(() => [
  {
    key: 'income',
    label: 'Total Income',
    value: 'ETB 4,821,500',
    delta: '+12.4%',
    deltaTone: 'up',
    tone: 'green',
    icon: '📈',
    sparkline: '0,25 15,22 30,18 45,20 60,12 75,14 90,8 100,6',
  },
  {
    key: 'expenses',
    label: 'Total Expenses',
    value: 'ETB 3,140,200',
    delta: '+4.1%',
    deltaTone: 'down',
    tone: 'red',
    icon: '📉',
    sparkline: '0,10 15,12 30,16 45,14 60,18 75,17 90,22 100,24',
  },
  {
    key: 'balance',
    label: 'Net Cash Position',
    value: 'ETB 12,482,900',
    delta: '+8.7%',
    deltaTone: 'up',
    tone: 'purple',
    icon: '🏦',
    sparkline: '0,22 15,20 30,18 45,15 60,14 75,10 90,8 100,5',
  },
  {
    key: 'pending',
    label: 'Pending Payments',
    value: 'ETB 892,300',
    delta: '−2.3%',
    deltaTone: 'up',
    tone: 'purple',
    icon: '⏳',
    sparkline: '0,10 15,12 30,11 45,13 60,12 75,14 90,13 100,15',
  },
])

// ================================================================
// CONTROL ALERTS
// ================================================================
const controlAlerts = [
  {
    id: 'al-1',
    severity: 'warn',
    icon: '⚠️',
    title: '5 transactions awaiting review',
    desc: 'Flagged by system rules — unusual amounts or vendors.',
  },
  {
    id: 'al-2',
    severity: 'info',
    icon: '🕒',
    title: 'Monthly close in 3 days',
    desc: 'Ensure all Oct entries are reconciled before close.',
  },
  {
    id: 'al-3',
    severity: 'ok',
    icon: '✅',
    title: 'All bank feeds synced',
    desc: 'Last successful sync: 12 minutes ago.',
  },
]

// ================================================================
// CASH FLOW
// ================================================================
const cashFlow = [
  { label: 'W1', inflow: 60, outflow: 40 },
  { label: 'W2', inflow: 75, outflow: 55 },
  { label: 'W3', inflow: 50, outflow: 65 },
  { label: 'W4', inflow: 90, outflow: 45 },
  { label: 'W5', inflow: 80, outflow: 60 },
  { label: 'W6', inflow: 95, outflow: 50 },
]

// ================================================================
// BANK ACCOUNTS
// ================================================================
const bankAccounts = [
  {
    id: 1,
    name: 'Commercial Bank of Ethiopia',
    accountMasked: '•••• 4821',
    balance: 'ETB 8,240,100',
    initials: 'CB',
    color: '#8B5CF6',
    status: 'ok',
  },
  {
    id: 2,
    name: 'Awash Bank',
    accountMasked: '•••• 7392',
    balance: 'ETB 2,108,700',
    initials: 'AW',
    color: '#0EA5E9',
    status: 'ok',
  },
  {
    id: 3,
    name: 'Dashen Bank',
    accountMasked: '•••• 1567',
    balance: 'ETB 142,300',
    initials: 'DA',
    color: '#F59E0B',
    status: 'low',
  },
  {
    id: 4,
    name: 'Telebirr Business',
    accountMasked: '•••• 9043',
    balance: 'ETB 1,991,800',
    initials: 'TB',
    color: '#10B981',
    status: 'ok',
  },
]

// ================================================================
// PENDING APPROVALS
// ================================================================
const pendingApprovals = [
  {
    id: 'ap-1',
    type: 'payment',
    title: 'Vendor payment · Merkato Supplies',
    requester: 'Procurement',
    date: 'Today, 10:24',
    amount: 'ETB 148,500',
  },
  {
    id: 'ap-2',
    type: 'payroll',
    title: 'October payroll · HQ staff',
    requester: 'HR',
    date: 'Yesterday, 16:00',
    amount: 'ETB 412,900',
  },
  {
    id: 'ap-3',
    type: 'document',
    title: 'Refund request · Order #4821',
    requester: 'Customer Care',
    date: 'Yesterday, 09:12',
    amount: 'ETB 3,200',
  },
  {
    id: 'ap-4',
    type: 'payment',
    title: 'Fuel top-up · Fleet dept',
    requester: 'Operations',
    date: '2 days ago',
    amount: 'ETB 62,000',
  },
]

// ================================================================
// RECENT TRANSACTIONS
// ================================================================
const recentTransactions = [
  { id: 1, ref: 'TXN-99812', desc: 'Customer payment batch',    date: '2026-10-04', amount: 'ETB 82,400',  type: 'in'  },
  { id: 2, ref: 'TXN-99811', desc: 'Vendor · Addis Packaging',  date: '2026-10-04', amount: 'ETB 24,150',  type: 'out' },
  { id: 3, ref: 'TXN-99810', desc: 'Payroll disbursement',       date: '2026-10-03', amount: 'ETB 412,900', type: 'out' },
  { id: 4, ref: 'TXN-99809', desc: 'Transfer from Awash Bank',   date: '2026-10-03', amount: 'ETB 500,000', type: 'in'  },
  { id: 5, ref: 'TXN-99808', desc: 'Tax filing · Q3',            date: '2026-10-02', amount: 'ETB 189,300', type: 'out' },
]

// ================================================================
// RECONCILIATION
// ================================================================
const reconciliation = [
  { id: 'r-1', name: 'CBE · Main account',   status: 'matched',  matched: 482, total: 482, percent: 100 },
  { id: 'r-2', name: 'Awash · Operations',   status: 'review',   matched: 187, total: 192, percent: 97  },
  { id: 'r-3', name: 'Dashen · Payroll',     status: 'mismatch', matched: 88,  total: 94,  percent: 93  },
  { id: 'r-4', name: 'Telebirr · Collections', status: 'matched', matched: 651, total: 651, percent: 100 },
]

// ================================================================
// QUICK ACTIONS
// ================================================================
const quickActions = [
  { key: 'new-payment', icon: '💸', label: 'New Payment',      action: () => {} },
  { key: 'reconcile',   icon: '🔍', label: 'Reconcile',        action: () => {} },
  { key: 'payroll',     icon: '👥', label: 'Run Payroll',      action: () => {} },
  { key: 'transfer',    icon: '🔁', label: 'Bank Transfer',    action: () => {} },
  { key: 'report',      icon: '📊', label: 'Generate Report',  action: () => {} },
  { key: 'statements',  icon: '📄', label: 'Bank Statements',  action: () => {} },
]

// ================================================================
// HANDLERS
// ================================================================
const exportReport = () => {
  console.log('Export requested for period:', activePeriod.value)
}

// ================================================================
// LIFECYCLE — wire real data later
// ================================================================
onMounted(async () => {
  // Example: replace demo data with API calls
  //
  // const { data } = await api.get('/dashboard/financial-controller/summary', {
  //   params: { period: activePeriod.value },
  // })
  // kpis.value      = data.kpis
  // cashFlow.value  = data.cashFlow
  // bankAccounts.value = data.banks
  // pendingApprovals.value = data.pending
  // recentTransactions.value = data.transactions
  // reconciliation.value = data.reconciliation
})
</script>

<style scoped>
/* ================================================================
   LAYOUT
   ================================================================ */
.fc-dashboard {
  padding: 24px 28px;
  max-width: 1400px;
  margin: 0 auto;
  color: #0f172a;
}

/* Header */
.fc-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 24px;
}
.fc-header__left h1 {
  margin: 0 0 4px 0;
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.4px;
}
.fc-header__left p {
  margin: 0;
  font-size: 13.5px;
  color: #64748b;
}
.fc-header__right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.period-picker {
  display: inline-flex;
  background: #e2e8f0;
  padding: 3px;
  border-radius: 10px;
}
.period-btn {
  padding: 7px 14px;
  border: none;
  background: transparent;
  color: #475569;
  font-size: 12.5px;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
}
.period-btn:hover { color: #0f172a; }
.period-btn.active {
  background: white;
  color: #8b5cf6;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}

.btn-export {
  padding: 9px 16px;
  background: #8b5cf6;
  color: white;
  border: none;
  border-radius: 9px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-export:hover { background: #7c3aed; }

/* ================================================================
   KPI CARDS
   ================================================================ */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.kpi-card {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 18px 18px 14px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  overflow: hidden;
  transition: box-shadow 0.15s, transform 0.15s;
}
.kpi-card:hover {
  box-shadow: 0 8px 20px rgba(15,23,42,0.06);
  transform: translateY(-1px);
}
.kpi-card--green  { border-left: 4px solid #10b981; }
.kpi-card--red    { border-left: 4px solid #ef4444; }
.kpi-card--purple { border-left: 4px solid #8b5cf6; }

.kpi-card__icon {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}
.kpi-card--green  .kpi-card__icon { background: #ecfdf5; }
.kpi-card--red    .kpi-card__icon { background: #fee2e2; }
.kpi-card--purple .kpi-card__icon { background: #eef2ff; }

.kpi-card__body { flex: 1; min-width: 0; }
.kpi-card__label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: #64748b;
  margin-bottom: 6px;
}
.kpi-card__value {
  font-size: 20px;
  font-weight: 800;
  letter-spacing: -0.5px;
  color: #0f172a;
}
.kpi-card__delta {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 700;
  margin-top: 6px;
}
.kpi-card__delta--up   { color: #059669; }
.kpi-card__delta--down { color: #dc2626; }
.kpi-card__delta-label {
  color: #94a3b8;
  font-weight: 500;
  font-size: 11px;
  margin-left: 2px;
}

.kpi-card__sparkline {
  width: 90px;
  height: 30px;
  align-self: flex-end;
  flex-shrink: 0;
}

/* ================================================================
   CONTROL ALERTS
   ================================================================ */
.alerts-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}
.alert-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 12px;
  border-left: 4px solid;
  background: white;
  border: 1px solid #e2e8f0;
  border-left-width: 4px;
}
.alert-card--warn { border-left-color: #f59e0b; background: #fffbeb; }
.alert-card--info { border-left-color: #0ea5e9; background: #f0f9ff; }
.alert-card--ok   { border-left-color: #10b981; background: #f0fdf4; }

.alert-card__icon { font-size: 20px; flex-shrink: 0; }
.alert-card__body { flex: 1; min-width: 0; }
.alert-card__title { font-size: 13px; font-weight: 800; color: #0f172a; }
.alert-card__desc  { font-size: 11.5px; color: #64748b; margin-top: 2px; }
.alert-card__action {
  background: transparent;
  border: none;
  color: #8b5cf6;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  padding: 4px 6px;
  flex-shrink: 0;
}
.alert-card__action:hover { text-decoration: underline; }

/* ================================================================
   CARDS
   ================================================================ */
.card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 18px 20px;
}
.card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}
.card__header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.2px;
}
.link-btn {
  background: none;
  border: none;
  color: #8b5cf6;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  padding: 0;
}
.link-btn:hover { text-decoration: underline; }

.row {
  display: grid;
  gap: 16px;
  margin-bottom: 20px;
}
.row--two-col {
  grid-template-columns: 1.6fr 1fr;
}
@media (max-width: 1024px) {
  .row--two-col { grid-template-columns: 1fr; }
}

/* ================================================================
   CASH FLOW CHART
   ================================================================ */
.card--chart .chart {
  width: 100%;
  height: 200px;
  margin-bottom: 12px;
}
.chart svg { width: 100%; height: 100%; }

.legend {
  display: flex;
  gap: 14px;
  font-size: 11.5px;
  font-weight: 600;
  color: #64748b;
}
.legend span { display: inline-flex; align-items: center; gap: 5px; }
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}
.dot--in  { background: #10b981; }
.dot--out { background: #ef4444; }

.chart-summary {
  display: flex;
  justify-content: space-around;
  padding-top: 12px;
  border-top: 1px solid #f1f5f9;
  font-size: 12.5px;
  color: #64748b;
  flex-wrap: wrap;
  gap: 10px;
}
.chart-summary strong { font-weight: 800; margin-left: 4px; }
.text-green { color: #059669; }
.text-red   { color: #dc2626; }

/* ================================================================
   BANK ACCOUNTS
   ================================================================ */
.bank-list {
  list-style: none;
  padding: 0;
  margin: 0 0 14px 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.bank-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #f1f5f9;
}
.bank-row:last-child { border-bottom: none; }

.bank-row__logo {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  color: white;
  font-size: 12px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.bank-row__info { flex: 1; min-width: 0; }
.bank-row__name {
  font-size: 13px;
  font-weight: 700;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.bank-row__acct {
  font-size: 11px;
  color: #94a3b8;
  font-family: 'Courier New', monospace;
  margin-top: 2px;
}
.bank-row__balance { text-align: right; flex-shrink: 0; }
.bank-row__amount {
  font-size: 13.5px;
  font-weight: 800;
  color: #0f172a;
}
.bank-row__status {
  font-size: 10.5px;
  font-weight: 700;
  margin-top: 3px;
  letter-spacing: 0.3px;
}
.bank-row__status--ok   { color: #059669; }
.bank-row__status--low  { color: #d97706; }
.bank-row__status--hold { color: #64748b; }

.bank-total {
  display: flex;
  justify-content: space-between;
  padding-top: 12px;
  border-top: 1px solid #e2e8f0;
  font-size: 12.5px;
  color: #64748b;
}
.bank-total strong {
  font-size: 15px;
  color: #0f172a;
  font-weight: 800;
}

/* ================================================================
   PENDING APPROVALS
   ================================================================ */
.badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.3px;
}
.badge--warn { background: #fef3c7; color: #92400e; }

.approval-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.approval-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid #f1f5f9;
  border-radius: 10px;
  transition: background 0.12s;
}
.approval-row:hover { background: #fafbfc; }

.approval-row__icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}
.approval-row__icon--payment  { background: #fee2e2; }
.approval-row__icon--payroll  { background: #eef2ff; }
.approval-row__icon--document { background: #fef3c7; }

.approval-row__body { flex: 1; min-width: 0; }
.approval-row__title {
  font-size: 13px;
  font-weight: 700;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.approval-row__meta {
  font-size: 11.5px;
  color: #64748b;
  margin-top: 3px;
}
.approval-row__amount {
  font-size: 13px;
  font-weight: 800;
  color: #0f172a;
  flex-shrink: 0;
}
.approval-row__actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}
.btn-icon {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.12s;
}
.btn-icon--approve { background: #ecfdf5; color: #059669; }
.btn-icon--approve:hover { background: #10b981; color: white; }
.btn-icon--reject  { background: #fee2e2; color: #dc2626; }
.btn-icon--reject:hover  { background: #ef4444; color: white; }

.approval-empty {
  text-align: center;
  padding: 24px 8px;
  color: #64748b;
  font-size: 13px;
}

/* ================================================================
   TRANSACTIONS TABLE
   ================================================================ */
.tx-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12.5px;
}
.tx-table thead th {
  text-align: left;
  padding: 8px 6px;
  font-size: 10.5px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: #94a3b8;
  border-bottom: 1px solid #e2e8f0;
}
.tx-table tbody td {
  padding: 10px 6px;
  border-bottom: 1px solid #f1f5f9;
  color: #334155;
}
.tx-table tbody tr:last-child td { border-bottom: none; }
.tx-table tbody tr:hover { background: #fafbfc; }

.tx-ref {
  font-family: 'Courier New', monospace;
  font-size: 11px;
  color: #8b5cf6;
  font-weight: 700;
}
.tx-date { color: #94a3b8; font-size: 11.5px; }
.tx-amount { font-weight: 800; }
.text-right { text-align: right; }

/* ================================================================
   RECONCILIATION
   ================================================================ */
.card--recon { margin-bottom: 20px; }
.recon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px;
}
.recon-item {
  padding: 12px;
  border: 1px solid #f1f5f9;
  border-radius: 10px;
  background: #fafbfc;
}
.recon-item__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  gap: 8px;
}
.recon-item__name {
  font-size: 12.5px;
  font-weight: 700;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.recon-item__pill {
  font-size: 10px;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 8px;
  letter-spacing: 0.3px;
  flex-shrink: 0;
}
.recon-item__pill--matched  { background: #ecfdf5; color: #059669; }
.recon-item__pill--review   { background: #fef3c7; color: #92400e; }
.recon-item__pill--mismatch { background: #fee2e2; color: #dc2626; }

.recon-item__bar {
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 6px;
}
.recon-item__bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.4s ease;
}
.recon-item__bar-fill--matched  { background: #10b981; }
.recon-item__bar-fill--review   { background: #f59e0b; }
.recon-item__bar-fill--mismatch { background: #ef4444; }

.recon-item__meta {
  font-size: 11px;
  color: #64748b;
  font-weight: 600;
}

/* ================================================================
   QUICK ACTIONS
   ================================================================ */
.card--actions { margin-bottom: 24px; }
.action-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 10px;
}
.action-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 12px;
  background: #fafbfc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
}
.action-tile:hover {
  background: #eef2ff;
  border-color: #c7d2fe;
  transform: translateY(-2px);
}
.action-tile__icon { font-size: 22px; }
.action-tile__label {
  font-size: 12.5px;
  font-weight: 700;
  color: #334155;
  text-align: center;
}
</style>