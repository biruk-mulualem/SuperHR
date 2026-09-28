<template>
  <div class="fpp">
    <!-- ============ HEADER ============ -->
    <header class="hero">
      <div class="hero-left">
        <div class="hero-icon">🌍</div>
        <div>
          <h1>Foreign Purchase</h1>
          <p>Import tracking · {{ shipments.length }} BLs · {{ totalContainers }} containers</p>
        </div>
      </div>
      <button class="btn-primary" @click="showAddModal = true">
        <span>＋</span> New BL
      </button>
    </header>

    <!-- ============ STATS ============ -->
    <section class="stats">
      <div class="stat" data-tone="neutral">
        <div class="stat-icon">📦</div>
        <div>
          <div class="stat-value">{{ shipments.length }}</div>
          <div class="stat-label">Total BLs</div>
        </div>
      </div>
      <div class="stat" data-tone="amber">
        <div class="stat-icon">⏳</div>
        <div>
          <div class="stat-value">{{ notLoadedCount }}</div>
          <div class="stat-label">Not Loaded</div>
        </div>
      </div>
      <div class="stat" data-tone="blue">
        <div class="stat-icon">🚢</div>
        <div>
          <div class="stat-value">{{ onProcessCount }}</div>
          <div class="stat-label">On Process</div>
        </div>
      </div>
      <div class="stat" data-tone="green">
        <div class="stat-icon">✅</div>
        <div>
          <div class="stat-value">{{ receivedCount }}</div>
          <div class="stat-label">Received</div>
        </div>
      </div>
      <div class="stat" data-tone="violet">
        <div class="stat-icon">🧊</div>
        <div>
          <div class="stat-value">{{ totalContainers }}</div>
          <div class="stat-label">Containers</div>
        </div>
      </div>
      <div class="stat" data-tone="cyan">
        <div class="stat-icon">📍</div>
        <div>
          <div class="stat-value">{{ containersMoving }}</div>
          <div class="stat-label">In Motion</div>
        </div>
      </div>
    </section>

    <!-- ============ COUNTRY TABS ============ -->
    <nav class="tabs">
      <button
        v-for="tab in countryTabs"
        :key="tab.name"
        :class="['tab', { active: activeCountry === tab.name }]"
        @click="activeCountry = tab.name"
      >
        <span class="tab-flag">{{ tab.flag }}</span>
        <span class="tab-name">{{ tab.name }}</span>
        <span class="tab-count">{{ tab.count }}</span>
      </button>

      <!-- Add country inline -->
      <div v-if="addingCountry" class="tab tab-input">
        <select v-model="newCountryName" @keydown.enter="confirmAddCountry">
          <option value="" disabled>Select country…</option>
          <option v-for="c in countryOptions" :key="c.name" :value="c.name">
            {{ c.flag }} {{ c.name }}
          </option>
        </select>
        <button class="tab-ok" @click="confirmAddCountry">✓</button>
        <button class="tab-cancel" @click="addingCountry = false">✕</button>
      </div>
      <button v-else class="tab tab-add" @click="addingCountry = true">
        ＋ Country
      </button>
    </nav>

    <!-- ============ TOOLBAR ============ -->
    <section class="toolbar">
      <div class="search">
        <span class="search-icon">🔍</span>
        <input v-model="search" placeholder="Search BL, container, item, reference, owner…" />
        <button v-if="search" class="clear" @click="search = ''">✕</button>
      </div>
      <select v-model="filterBank" class="select">
        <option value="all">All Banks</option>
        <option v-for="b in banks" :key="b" :value="b">{{ b }}</option>
      </select>
      <select v-model="viewMode" class="select">
        <option value="timeline">🕐 Timeline</option>
        <option value="table">📋 Table</option>
      </select>
      <button class="btn-ghost" @click="toggleExpandAll">
        {{ allExpanded ? '⏫ Collapse All' : '⏬ Expand All' }}
      </button>
    </section>

    <!-- ============ ACTIVE COUNTRY PANEL ============ -->
    <div v-if="activeCountryData" class="country-panel">
      <!-- Country header -->
      <header class="country-head">
        <div class="country-left">
          <span class="country-flag">{{ activeCountryData.flag }}</span>
          <div>
            <h2>{{ activeCountryData.name }}</h2>
            <span class="country-meta">
              {{ activeCountryData.totalBLs }} BLs · {{ activeCountryData.totalContainers }} containers
            </span>
          </div>
        </div>
        <div class="country-badges">
          <span class="pill amber" v-if="activeCountryData.notLoaded.length">
            {{ activeCountryData.notLoaded.length }} not loaded
          </span>
          <span class="pill blue" v-if="activeCountryData.onProcess.length">
            {{ activeCountryData.onProcess.length }} on process
          </span>
          <span class="pill green" v-if="activeCountryData.received.length">
            {{ activeCountryData.received.length }} received
          </span>
        </div>
      </header>

      <!-- ============ SECTIONS ============ -->
      <div class="sections">
        <section
          v-for="sec in sectionDefs"
          :key="sec.key"
          :class="['section', `section-${sec.key}`]"
        >
          <!-- Section header -->
          <header class="section-head">
            <span class="section-emoji">{{ sec.emoji }}</span>
            <h3>{{ sec.label }}</h3>
            <span class="section-count">{{ activeCountryData[sec.key].length }}</span>
          </header>

          <!-- Empty -->
          <div v-if="activeCountryData[sec.key].length === 0" class="section-empty">
            <span class="empty-dot"></span>
            No shipments in this stage
          </div>

          <!-- ============ TIMELINE VIEW ============ -->
          <div v-else-if="viewMode === 'timeline'" class="timeline-view">
            <article
              v-for="s in activeCountryData[sec.key]"
              :key="s.id"
              :class="['bl-card', { open: expandedBLs.has(s.id) }]"
            >
              <!-- BL header row -->
              <header class="bl-head" @click="toggleBL(s.id)">
                <span class="chev" :class="{ open: expandedBLs.has(s.id) }">▶</span>

                <div class="bl-identity">
                  <div class="bl-no">{{ s.blNo }}</div>
                  <div class="bl-meta">{{ s.referenceNo }} · {{ s.docOwner }}</div>
                </div>

                <div class="bl-badges">
                  <span v-if="blTotals(s).c20" class="badge b-20">20′ × {{ blTotals(s).c20 }}</span>
                  <span v-if="blTotals(s).c40" class="badge b-40">40′ × {{ blTotals(s).c40 }}</span>
                  <span class="badge badge-bank">{{ s.bank }}</span>
                </div>

                <span :class="['stage-pill', blStage(s)]">{{ blStageLabel(s) }}</span>

                <!-- Compact timeline preview -->
                <div class="mini-timeline">
                  <div
                    v-for="(m, i) in blMilestones(s)"
                    :key="i"
                    :class="['mt-node', { done: m.done, current: m.current }]"
                    :title="`${m.label}: ${fmt(m.date)}`"
                  >
                    <span class="mt-dot"></span>
                  </div>
                </div>
              </header>

              <!-- Expanded body -->
              <div v-if="expandedBLs.has(s.id)" class="bl-body">
                <!-- BL shared card -->
                <div class="card">
                  <div class="card-title">
                    <span>📋</span> BL Details
                  </div>
                  <div class="kv-grid">
                    <div class="kv"><span class="k">BL No</span><span class="v mono">{{ s.blNo }}</span></div>
                    <div class="kv"><span class="k">Bank</span><span class="v">{{ s.bank }}</span></div>
                    <div class="kv"><span class="k">Doc Owner</span><span class="v">{{ s.docOwner }}</span></div>
                    <div class="kv"><span class="k">Reference</span><span class="v ref">{{ s.referenceNo }}</span></div>
                    <div class="kv"><span class="k">Doc → Dj</span><span :class="['v', s.docSentToDj ? 'ok' : '']">{{ tick(s.docSentToDj) }}</span></div>
                    <div class="kv"><span class="k">coll.Doc</span><span :class="['v', s.collDoc ? 'ok' : '']">{{ tick(s.collDoc) }}</span></div>
                    <div class="kv"><span class="k">bill Collect</span><span :class="['v', s.billCollect ? 'ok' : '']">{{ tick(s.billCollect) }}</span></div>
                    <div class="kv"><span class="k">Tax Paid</span><span :class="['v', s.taxPaid ? 'ok' : '']">{{ tick(s.taxPaid) }}</span></div>
                    <div class="kv"><span class="k">Out from Dji</span><span class="v">{{ fmt(s.outFromDji) }}</span></div>
                    <div class="kv"><span class="k">ETA Arr Dj</span><span class="v">{{ fmt(s.etaArrDj) }}</span></div>
                  </div>
                  <div v-if="s.remark" class="note">
                    <strong>Note: </strong>{{ s.remark }}
                  </div>
                </div>

                <!-- Containers with full timeline -->
                <div class="card">
                  <div class="card-title">
                    <span>📦</span> Containers ({{ s.containers.length }})
                  </div>

                  <div v-if="s.containers.length === 0" class="muted pad">
                    No containers assigned yet
                  </div>

                  <div v-else class="container-list">
                    <article
                      v-for="c in s.containers"
                      :key="c.id"
                      :class="['container-card', `st-${containerStage(c)}`, { open: expandedContainers.has(c.id) }]"
                    >
                      <!-- Container header -->
                      <header class="cont-head" @click="toggleContainer(c.id)">
                        <span class="chev" :class="{ open: expandedContainers.has(c.id) }">▶</span>
                        <span :class="['size', `s-${c.size}`]">{{ c.size }}′</span>
                        <span class="cont-no">{{ c.containerNo }}</span>
                        <span v-if="c.sealNo" class="seal">Seal {{ c.sealNo }}</span>
                        <span class="items-count">{{ c.items.length }} item{{ c.items.length !== 1 ? 's' : '' }}</span>
                        <span class="spacer"></span>
                        <span :class="['stage-pill', 'sm', containerStage(c)]">{{ containerStageLabel(c) }}</span>
                      </header>

                      <!-- Container timeline (always visible) -->
                      <div class="cont-timeline">
                        <div
                          v-for="(m, i) in containerMilestones(c)"
                          :key="i"
                          :class="['tl-node', { done: m.done, current: m.current, last: i === containerMilestones(c).length - 1 }]"
                        >
                          <div class="tl-marker">
                            <span class="tl-dot">{{ m.done ? '✓' : '' }}</span>
                            <span v-if="i < containerMilestones(c).length - 1" class="tl-line"></span>
                          </div>
                          <div class="tl-info">
                            <div class="tl-label">{{ m.label }}</div>
                            <div class="tl-date">{{ fmt(m.date) }}</div>
                          </div>
                        </div>
                      </div>

                      <!-- Expanded container body -->
                      <div v-if="expandedContainers.has(c.id)" class="cont-body">
                        <div class="sub">
                          <h5>Items</h5>
                          <div v-if="c.items.length === 0" class="muted pad-sm">No items listed</div>
                          <table v-else class="items">
                            <thead>
                              <tr>
                                <th>Description</th>
                                <th class="num">Qty</th>
                                <th>Unit</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr v-for="(it, k) in c.items" :key="k">
                                <td>{{ it.description }}</td>
                                <td class="num">{{ it.qty }}</td>
                                <td>{{ it.unit }}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </article>
                  </div>
                </div>
              </div>
            </article>
          </div>

          <!-- ============ TABLE VIEW ============ -->
          <div v-else class="table-wrap">
            <table class="table">
              <thead>
                <tr>
                  <th class="col-expand"></th>
                  <th>BL / Reference</th>
                  <th>Containers</th>
                  <th class="num">Items</th>
                  <th>Bank</th>
                  <th>{{ sec.key === 'received' ? 'Arr SDT' : 'ETA / Arr Dj' }}</th>
                  <th v-if="sec.key === 'received'">Last Return</th>
                  <th>Stage</th>
                </tr>
              </thead>
              <tbody>
                <template v-for="s in activeCountryData[sec.key]" :key="s.id">
                  <tr :class="['row', { open: expandedBLs.has(s.id) }]" @click="toggleBL(s.id)">
                    <td class="col-expand">
                      <span class="chev" :class="{ open: expandedBLs.has(s.id) }">▶</span>
                    </td>
                    <td class="cell-bl">
                      <div class="bl-no">{{ s.blNo }}</div>
                      <div class="bl-meta">{{ s.referenceNo }} · {{ s.docOwner }}</div>
                    </td>
                    <td>
                      <div class="cont-badges">
                        <span v-if="blTotals(s).c20" class="badge b-20">20′ × {{ blTotals(s).c20 }}</span>
                        <span v-if="blTotals(s).c40" class="badge b-40">40′ × {{ blTotals(s).c40 }}</span>
                        <span v-if="!blTotals(s).c20 && !blTotals(s).c40" class="muted">—</span>
                      </div>
                    </td>
                    <td class="num">{{ blTotals(s).items }}</td>
                    <td>{{ s.bank }}</td>
                    <td class="mono-sm">{{ fmt(earliestDate(s, 'arrivedDj')) }}</td>
                    <td v-if="sec.key === 'received'" class="mono-sm">{{ fmt(latestDate(s, 'returned')) }}</td>
                    <td><span :class="['stage-pill', blStage(s)]">{{ blStageLabel(s) }}</span></td>
                  </tr>
                  <tr v-if="expandedBLs.has(s.id)" class="detail-row">
                    <td :colspan="sec.key === 'received' ? 8 : 7">
                      <div class="detail">
                        <div class="card">
                          <div class="card-title"><span>📋</span> BL Details</div>
                          <div class="kv-grid">
                            <div class="kv"><span class="k">BL No</span><span class="v mono">{{ s.blNo }}</span></div>
                            <div class="kv"><span class="k">Bank</span><span class="v">{{ s.bank }}</span></div>
                            <div class="kv"><span class="k">Doc Owner</span><span class="v">{{ s.docOwner }}</span></div>
                            <div class="kv"><span class="k">Reference</span><span class="v ref">{{ s.referenceNo }}</span></div>
                            <div class="kv"><span class="k">Doc → Dj</span><span :class="['v', s.docSentToDj ? 'ok' : '']">{{ tick(s.docSentToDj) }}</span></div>
                            <div class="kv"><span class="k">coll.Doc</span><span :class="['v', s.collDoc ? 'ok' : '']">{{ tick(s.collDoc) }}</span></div>
                            <div class="kv"><span class="k">bill Collect</span><span :class="['v', s.billCollect ? 'ok' : '']">{{ tick(s.billCollect) }}</span></div>
                            <div class="kv"><span class="k">Tax Paid</span><span :class="['v', s.taxPaid ? 'ok' : '']">{{ tick(s.taxPaid) }}</span></div>
                          </div>
                          <div v-if="s.remark" class="note"><strong>Note: </strong>{{ s.remark }}</div>
                        </div>
                        <div class="card">
                          <div class="card-title"><span>📦</span> Containers ({{ s.containers.length }})</div>
                          <div v-if="s.containers.length === 0" class="muted pad">No containers assigned yet</div>
                          <div v-else class="container-list">
                            <article
                              v-for="c in s.containers"
                              :key="c.id"
                              :class="['container-card', `st-${containerStage(c)}`, { open: expandedContainers.has(c.id) }]"
                            >
                              <header class="cont-head" @click.stop="toggleContainer(c.id)">
                                <span class="chev" :class="{ open: expandedContainers.has(c.id) }">▶</span>
                                <span :class="['size', `s-${c.size}`]">{{ c.size }}′</span>
                                <span class="cont-no">{{ c.containerNo }}</span>
                                <span v-if="c.sealNo" class="seal">Seal {{ c.sealNo }}</span>
                                <span class="items-count">{{ c.items.length }} item{{ c.items.length !== 1 ? 's' : '' }}</span>
                                <span class="spacer"></span>
                                <span :class="['stage-pill', 'sm', containerStage(c)]">{{ containerStageLabel(c) }}</span>
                              </header>
                              <div class="cont-timeline">
                                <div
                                  v-for="(m, i) in containerMilestones(c)"
                                  :key="i"
                                  :class="['tl-node', { done: m.done, current: m.current, last: i === containerMilestones(c).length - 1 }]"
                                >
                                  <div class="tl-marker">
                                    <span class="tl-dot">{{ m.done ? '✓' : '' }}</span>
                                    <span v-if="i < containerMilestones(c).length - 1" class="tl-line"></span>
                                  </div>
                                  <div class="tl-info">
                                    <div class="tl-label">{{ m.label }}</div>
                                    <div class="tl-date">{{ fmt(m.date) }}</div>
                                  </div>
                                </div>
                              </div>
                              <div v-if="expandedContainers.has(c.id)" class="cont-body">
                                <div class="sub">
                                  <h5>Items</h5>
                                  <table v-if="c.items.length" class="items">
                                    <thead><tr><th>Description</th><th class="num">Qty</th><th>Unit</th></tr></thead>
                                    <tbody>
                                      <tr v-for="(it, k) in c.items" :key="k">
                                        <td>{{ it.description }}</td>
                                        <td class="num">{{ it.qty }}</td>
                                        <td>{{ it.unit }}</td>
                                      </tr>
                                    </tbody>
                                  </table>
                                  <div v-else class="muted pad-sm">No items listed</div>
                                </div>
                              </div>
                            </article>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>

    <!-- No country selected -->
    <div v-else class="empty">
      <div class="empty-emoji">🌍</div>
      <h3>No country selected</h3>
      <p>Add a country tab to begin tracking shipments</p>
      <button class="btn-primary" @click="addingCountry = true">＋ Add Country</button>
    </div>

    <!-- ============ ADD MODAL ============ -->
    <transition name="modal">
      <div v-if="showAddModal" class="overlay" @click.self="showAddModal = false">
        <div class="modal">
          <header class="modal-head">
            <div class="modal-head-icon">📄</div>
            <div>
              <h3>New Bill of Lading</h3>
              <p>Create a new import shipment</p>
            </div>
            <button class="close" @click="showAddModal = false">✕</button>
          </header>
          <div class="modal-body">
            <div class="field">
              <label>BL No</label>
              <input v-model="newBL.blNo" placeholder="e.g. MSCU-2026-2011" />
            </div>
            <div class="grid-2">
              <div class="field">
                <label>Bank</label>
                <select v-model="newBL.bank">
                  <option v-for="b in banks" :key="b" :value="b">{{ b }}</option>
                </select>
              </div>
              <div class="field">
                <label>Origin</label>
                <select v-model="newBL.origin">
                  <option v-for="c in knownCountries" :key="c.name" :value="c.name">
                    {{ c.flag }} {{ c.name }}
                  </option>
                </select>
              </div>
            </div>
            <div class="grid-2">
              <div class="field">
                <label>Doc Owner</label>
                <input v-model="newBL.docOwner" placeholder="Name" />
              </div>
              <div class="field">
                <label>Reference No</label>
                <input v-model="newBL.referenceNo" placeholder="REF-…" />
              </div>
            </div>
            <div class="field">
              <label>Remark</label>
              <textarea v-model="newBL.remark" rows="2" placeholder="Optional note…"></textarea>
            </div>
          </div>
          <footer class="modal-foot">
            <button class="btn-ghost" @click="showAddModal = false">Cancel</button>
            <button class="btn-primary" @click="addBL">Create BL</button>
          </footer>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

/* ================================================================
   TYPES
   ================================================================ */
type ContainerStage = 'pending' | 'loaded' | 'in_transit' | 'arrived_dj' | 'arrived_aak' | 'arrived_sdt' | 'returned'

interface ContainerItem { description: string; qty: number; unit: string }

interface Container {
  id: number
  containerNo: string
  sealNo: string
  size: '20' | '40'
  items: ContainerItem[]
  loadedDate: string | null
  arrivedDj: string | null
  arrivedAAK: string | null
  arrivedSDT: string | null
  returned: string | null
}

interface Shipment {
  id: number
  blNo: string
  bank: string
  docOwner: string
  origin: string
  referenceNo: string
  docSentToDj: boolean
  collDoc: boolean
  billCollect: boolean
  taxPaid: boolean
  outFromDji: string | null
  etaArrDj: string | null
  containers: Container[]
  remark: string
}

/* ================================================================
   CONSTANTS
   ================================================================ */
const banks = ['CBE', 'Awash', 'Dashen', 'Abyssinia', 'Zemen']

const knownCountries = [
  { name: 'China', flag: '🇨🇳' },
  { name: 'India', flag: '🇮🇳' },
  { name: 'UAE', flag: '🇦🇪' },
  { name: 'Singapore', flag: '🇸🇬' },
  { name: 'Germany', flag: '🇩🇪' },
  { name: 'Turkey', flag: '🇹🇷' },
  { name: 'Italy', flag: '🇮🇹' },
  { name: 'Japan', flag: '🇯🇵' },
  { name: 'South Korea', flag: '🇰🇷' },
  { name: 'USA', flag: '🇺🇸' },
  { name: 'Brazil', flag: '🇧🇷' },
  { name: 'Vietnam', flag: '🇻🇳' }
]

/* ================================================================
   DEMO DATA
   ================================================================ */
const shipments = ref<Shipment[]>([
  {
    id: 1, blNo: 'MSCU-2026-1001', bank: 'CBE', docOwner: 'Abebe K.',
    origin: 'China', referenceNo: 'REF-1001',
    docSentToDj: true, collDoc: true, billCollect: false, taxPaid: false,
    outFromDji: null, etaArrDj: '2026-09-10',
    remark: 'Awaiting bill collection for 1 remaining container',
    containers: [
      { id: 101, containerNo: 'MSCU-7781234', sealNo: 'SL-001', size: '40',
        items: [
          { description: 'Steel coils — grade A', qty: 60, unit: 'coils' },
          { description: 'Steel pipes', qty: 20, unit: 'pcs' }
        ],
        loadedDate: '2026-07-15', arrivedDj: '2026-08-08', arrivedAAK: '2026-08-12',
        arrivedSDT: '2026-08-14', returned: '2026-08-22' },
      { id: 102, containerNo: 'MSCU-7781235', sealNo: 'SL-002', size: '40',
        items: [{ description: 'Steel coils — grade B', qty: 40, unit: 'coils' }],
        loadedDate: '2026-07-15', arrivedDj: '2026-08-08', arrivedAAK: '2026-08-12',
        arrivedSDT: '2026-08-14', returned: '2026-08-22' },
      { id: 103, containerNo: 'MSCU-7781236', sealNo: 'SL-003', size: '20',
        items: [{ description: 'Steel plates', qty: 100, unit: 'pcs' }],
        loadedDate: '2026-07-15', arrivedDj: '2026-08-10', arrivedAAK: null,
        arrivedSDT: null, returned: null }
    ]
  },
  {
    id: 2, blNo: 'MAEU-2026-1002', bank: 'Awash', docOwner: 'Sara T.',
    origin: 'India', referenceNo: 'REF-1002',
    docSentToDj: true, collDoc: true, billCollect: true, taxPaid: true,
    outFromDji: '2026-08-05', etaArrDj: '2026-07-28',
    remark: 'All containers returned',
    containers: [
      { id: 201, containerNo: 'MAEU-5512340', sealNo: 'SL-101', size: '40',
        items: [
          { description: 'Cotton fabric rolls', qty: 240, unit: 'rolls' },
          { description: 'Cotton yarn', qty: 80, unit: 'bags' }
        ],
        loadedDate: '2026-07-02', arrivedDj: '2026-07-28', arrivedAAK: '2026-08-02',
        arrivedSDT: '2026-08-05', returned: '2026-08-14' },
      { id: 202, containerNo: 'MAEU-5512341', sealNo: 'SL-102', size: '40',
        items: [{ description: 'Cotton fabric rolls', qty: 240, unit: 'rolls' }],
        loadedDate: '2026-07-02', arrivedDj: '2026-07-28', arrivedAAK: '2026-08-02',
        arrivedSDT: '2026-08-05', returned: '2026-08-15' }
    ]
  },
  {
    id: 3, blNo: 'CMAU-2026-1003', bank: 'Dashen', docOwner: 'Abebe K.',
    origin: 'UAE', referenceNo: 'REF-1003',
    docSentToDj: false, collDoc: false, billCollect: false, taxPaid: false,
    outFromDji: null, etaArrDj: '2026-09-15',
    remark: 'Loaded, awaiting Djibouti arrival',
    containers: [
      { id: 301, containerNo: 'CMAU-3301122', sealNo: 'SL-201', size: '20',
        items: [{ description: 'Industrial chemicals (hazmat)', qty: 30, unit: 'drums' }],
        loadedDate: '2026-08-20', arrivedDj: null, arrivedAAK: null,
        arrivedSDT: null, returned: null },
      { id: 302, containerNo: 'CMAU-3301123', sealNo: 'SL-202', size: '20',
        items: [{ description: 'Industrial chemicals (hazmat)', qty: 30, unit: 'drums' }],
        loadedDate: '2026-08-20', arrivedDj: null, arrivedAAK: null,
        arrivedSDT: null, returned: null }
    ]
  },
  {
    id: 4, blNo: 'EGLV-2026-1004', bank: 'Abyssinia', docOwner: 'Mulu G.',
    origin: 'Singapore', referenceNo: 'REF-1004',
    docSentToDj: true, collDoc: true, billCollect: true, taxPaid: true,
    outFromDji: '2026-07-12', etaArrDj: '2026-07-05',
    remark: 'All containers returned & closed',
    containers: [
      { id: 401, containerNo: 'EGLV-9012001', sealNo: 'SL-301', size: '40',
        items: [
          { description: 'Electronic components', qty: 500, unit: 'boxes' },
          { description: 'Circuit boards', qty: 200, unit: 'pcs' }
        ],
        loadedDate: '2026-06-10', arrivedDj: '2026-07-05', arrivedAAK: '2026-07-10',
        arrivedSDT: '2026-07-12', returned: '2026-07-20' },
      { id: 402, containerNo: 'EGLV-9012002', sealNo: 'SL-302', size: '20',
        items: [{ description: 'Electronic components', qty: 250, unit: 'boxes' }],
        loadedDate: '2026-06-10', arrivedDj: '2026-07-05', arrivedAAK: '2026-07-10',
        arrivedSDT: '2026-07-12', returned: '2026-07-25' }
    ]
  },
  {
    id: 5, blNo: 'HLCU-2026-1005', bank: 'Zemen', docOwner: 'Sara T.',
    origin: 'Germany', referenceNo: 'REF-1005',
    docSentToDj: true, collDoc: false, billCollect: false, taxPaid: false,
    outFromDji: null, etaArrDj: '2026-09-20',
    remark: 'Docs sent, awaiting collection',
    containers: [
      { id: 501, containerNo: 'HLCU-4410099', sealNo: 'SL-401', size: '40',
        items: [{ description: 'Machinery spare parts', qty: 14, unit: 'crates' }],
        loadedDate: '2026-08-01', arrivedDj: null, arrivedAAK: null,
        arrivedSDT: null, returned: null }
    ]
  },
  {
    id: 6, blNo: 'TCLU-2026-1006', bank: 'CBE', docOwner: 'Mulu G.',
    origin: 'Turkey', referenceNo: 'REF-1006',
    docSentToDj: false, collDoc: false, billCollect: false, taxPaid: false,
    outFromDji: null, etaArrDj: null,
    remark: 'Just created — awaiting container assignment',
    containers: []
  },
  {
    id: 7, blNo: 'ONEU-2026-1007', bank: 'Awash', docOwner: 'Abebe K.',
    origin: 'China', referenceNo: 'REF-1007',
    docSentToDj: true, collDoc: true, billCollect: true, taxPaid: true,
    outFromDji: '2026-08-22', etaArrDj: '2026-08-15',
    remark: 'One container at AAK, one still at Djibouti',
    containers: [
      { id: 701, containerNo: 'ONEU-8800011', sealNo: 'SL-501', size: '20',
        items: [{ description: 'Plastic raw material', qty: 150, unit: 'bags' }],
        loadedDate: '2026-07-20', arrivedDj: '2026-08-15', arrivedAAK: '2026-08-25',
        arrivedSDT: null, returned: null },
      { id: 702, containerNo: 'ONEU-8800012', sealNo: 'SL-502', size: '20',
        items: [{ description: 'Plastic raw material', qty: 150, unit: 'bags' }],
        loadedDate: '2026-07-20', arrivedDj: '2026-08-18', arrivedAAK: null,
        arrivedSDT: null, returned: null }
    ]
  }
])

/* ================================================================
   STATE
   ================================================================ */
const search = ref('')
const filterBank = ref('all')
const viewMode = ref<'timeline' | 'table'>('timeline')
const showAddModal = ref(false)
const expandedBLs = ref<Set<number>>(new Set())
const expandedContainers = ref<Set<number>>(new Set())
const activeCountry = ref<string>('China')
const addingCountry = ref(false)
const newCountryName = ref('')

const newBL = ref({
  blNo: '', bank: 'CBE', origin: 'China',
  docOwner: '', referenceNo: '', remark: ''
})

const sectionDefs = [
  { key: 'notLoaded' as const, label: 'Not Loaded', emoji: '⏳' },
  { key: 'onProcess' as const, label: 'On Process', emoji: '🚢' },
  { key: 'received' as const, label: 'Received', emoji: '✅' }
]

/* ================================================================
   HELPERS
   ================================================================ */
const fmt = (d: string | null) => d
  ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })
  : '—'

const tick = (v: boolean) => (v ? '✓' : '—')

const originFlag = (o: string) =>
  knownCountries.find(c => c.name === o)?.flag || '🌐'

const containerStage = (c: Container): ContainerStage => {
  if (c.returned) return 'returned'
  if (c.arrivedSDT) return 'arrived_sdt'
  if (c.arrivedAAK) return 'arrived_aak'
  if (c.arrivedDj) return 'arrived_dj'
  if (c.loadedDate) return 'loaded'
  return 'pending'
}

const containerStageLabel = (c: Container) => ({
  pending: 'Pending', loaded: 'Loaded', in_transit: 'In Transit',
  arrived_dj: 'At Djibouti', arrived_aak: 'At AAK',
  arrived_sdt: 'At SDT', returned: 'Returned'
}[containerStage(c)])

const blStage = (s: Shipment): 'not_loaded' | 'on_process' | 'received' => {
  if (s.containers.length === 0) return 'not_loaded'
  const sts = s.containers.map(containerStage)
  if (sts.every(st => st === 'pending')) return 'not_loaded'
  if (sts.every(st => st === 'returned' || st === 'arrived_sdt')) return 'received'
  return 'on_process'
}

const blStageLabel = (s: Shipment) => ({
  not_loaded: 'Not Loaded',
  on_process: 'On Process',
  received: 'Received'
}[blStage(s)])

const blTotals = (s: Shipment) => {
  const c20 = s.containers.filter(c => c.size === '20').length
  const c40 = s.containers.filter(c => c.size === '40').length
  const items = s.containers.reduce((n, c) => n + c.items.length, 0)
  return { c20, c40, items }
}

const earliestDate = (s: Shipment, key: keyof Container) => {
  const ds = s.containers.map(c => c[key]).filter(Boolean) as string[]
  return ds.length ? ds.sort()[0]! : null
}

const latestDate = (s: Shipment, key: keyof Container) => {
  const ds = s.containers.map(c => c[key]).filter(Boolean) as string[]
  return ds.length ? ds.sort().reverse()[0]! : null
}

/* ================================================================
   MILESTONES
   ================================================================ */
interface Milestone { label: string; date: string | null; done: boolean; current: boolean }

const containerMilestones = (c: Container): Milestone[] => {
  const raw: { label: string; date: string | null }[] = [
    { label: 'Loaded', date: c.loadedDate },
    { label: 'Arr Djibouti', date: c.arrivedDj },
    { label: 'Arr AAK', date: c.arrivedAAK },
    { label: 'Arr SDT', date: c.arrivedSDT },
    { label: 'Returned', date: c.returned }
  ]
  let foundCurrent = false
  return raw.map(m => {
    const done = !!m.date
    const current = !done && !foundCurrent
    if (current) foundCurrent = true
    return { ...m, done, current }
  })
}

const blMilestones = (s: Shipment): Milestone[] => {
  const all: { label: string; date: string | null }[] = [
    { label: 'Loaded', date: earliestDate(s, 'loadedDate') },
    { label: 'Arr Djibouti', date: earliestDate(s, 'arrivedDj') },
    { label: 'Arr AAK', date: earliestDate(s, 'arrivedAAK') },
    { label: 'Arr SDT', date: earliestDate(s, 'arrivedSDT') },
    { label: 'Returned', date: latestDate(s, 'returned') }
  ]
  let foundCurrent = false
  return all.map(m => {
    const done = !!m.date
    const current = !done && !foundCurrent
    if (current) foundCurrent = true
    return { ...m, done, current }
  })
}

/* ================================================================
   COUNTRY TABS
   ================================================================ */
interface CountryTab { name: string; flag: string; count: number }

const countryTabs = computed<CountryTab[]>(() => {
  const map = new Map<string, number>()
  for (const s of filteredShipments.value) {
    map.set(s.origin, (map.get(s.origin) || 0) + 1)
  }
  return [...map.entries()]
    .map(([name, count]) => ({ name, flag: originFlag(name), count }))
    .sort((a, b) => a.name.localeCompare(b.name))
})

const countryOptions = computed(() =>
  knownCountries.filter(c => !countryTabs.value.some(t => t.name === c.name))
)

const activeCountryData = computed(() => {
  if (!activeCountry.value) return null
  const bls = filteredShipments.value.filter(s => s.origin === activeCountry.value)
  const notLoaded: Shipment[] = []
  const onProcess: Shipment[] = []
  const received: Shipment[] = []
  let totalContainers = 0

  for (const s of bls) {
    totalContainers += s.containers.length
    const st = blStage(s)
    if (st === 'not_loaded') notLoaded.push(s)
    else if (st === 'received') received.push(s)
    else onProcess.push(s)
  }

  return {
    name: activeCountry.value,
    flag: originFlag(activeCountry.value),
    totalBLs: bls.length,
    totalContainers,
    notLoaded, onProcess, received
  }
})

/* ================================================================
   FILTERS
   ================================================================ */
const filteredShipments = computed(() => shipments.value.filter(s => {
  const q = search.value.toLowerCase()
  const matchSearch = !q ||
    s.blNo.toLowerCase().includes(q) ||
    s.referenceNo.toLowerCase().includes(q) ||
    s.docOwner.toLowerCase().includes(q) ||
    s.containers.some(c =>
      c.containerNo.toLowerCase().includes(q) ||
      c.items.some(i => i.description.toLowerCase().includes(q)))
  const matchBank = filterBank.value === 'all' || s.bank === filterBank.value
  return matchSearch && matchBank
}))

const notLoadedCount = computed(() => shipments.value.filter(s => blStage(s) === 'not_loaded').length)
const onProcessCount = computed(() => shipments.value.filter(s => blStage(s) === 'on_process').length)
const receivedCount = computed(() => shipments.value.filter(s => blStage(s) === 'received').length)
const totalContainers = computed(() => shipments.value.reduce((n, s) => n + s.containers.length, 0))
const containersMoving = computed(() =>
  shipments.value
    .filter(s => blStage(s) === 'on_process')
    .reduce((n, s) => n + s.containers.filter(c =>
      ['loaded', 'in_transit', 'arrived_dj', 'arrived_aak'].includes(containerStage(c))).length, 0))

const allExpanded = computed(() =>
  filteredShipments.value.length > 0 &&
  filteredShipments.value.every(s => expandedBLs.value.has(s.id)))

/* ================================================================
   INTERACTIONS
   ================================================================ */
const toggleBL = (id: number) => {
  const next = new Set(expandedBLs.value)
  next.has(id) ? next.delete(id) : next.add(id)
  expandedBLs.value = next
}
const toggleContainer = (id: number) => {
  const next = new Set(expandedContainers.value)
  next.has(id) ? next.delete(id) : next.add(id)
  expandedContainers.value = next
}
const toggleExpandAll = () => {
  expandedBLs.value = allExpanded.value
    ? new Set()
    : new Set(filteredShipments.value.map(s => s.id))
}

const confirmAddCountry = () => {
  if (!newCountryName.value) return
  activeCountry.value = newCountryName.value
  addingCountry.value = false
  newCountryName.value = ''
}

/* ================================================================
   ADD BL
   ================================================================ */
const addBL = () => {
  const id = shipments.value.length + 1
  const origin = newBL.value.origin
  shipments.value.push({
    id,
    blNo: newBL.value.blNo || `NEW-2026-${String(1000 + id)}`,
    bank: newBL.value.bank,
    docOwner: newBL.value.docOwner || 'Unassigned',
    origin,
    referenceNo: newBL.value.referenceNo || `REF-${1000 + id}`,
    docSentToDj: false, collDoc: false, billCollect: false, taxPaid: false,
    outFromDji: null, etaArrDj: null,
    remark: newBL.value.remark || 'New BL — awaiting containers',
    containers: []
  })
  activeCountry.value = origin
  showAddModal.value = false
  newBL.value = { blNo: '', bank: 'CBE', origin: 'China', docOwner: '', referenceNo: '', remark: '' }
}
</script>

<style>
/* ================================================================
   BASE
   ================================================================ */
.fpp {
  --bg: #f6f8fb;
  --surface: #ffffff;
  --border: #e6ebf2;
  --border-soft: #eef2f7;
  --text: #0f172a;
  --text-2: #475569;
  --text-3: #8896aa;
  --primary: #3b82f6;
  --amber: #f59e0b;
  --amber-bg: #fef7e6;
  --blue: #3b82f6;
  --blue-bg: #eff5ff;
  --green: #10b981;
  --green-bg: #ecfdf5;
  --violet: #8b5cf6;
  --violet-bg: #f5f1ff;
  --cyan: #06b6d4;
  --cyan-bg: #ecfeff;

  max-width: 1520px;
  margin: 0 auto;
  padding: 28px 24px 60px;
  background: var(--bg);
  min-height: 100vh;
  color: var(--text);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
}

/* ================================================================
   HERO
   ================================================================ */
.hero {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 24px; gap: 16px; flex-wrap: wrap;
}
.hero-left { display: flex; align-items: center; gap: 14px; }
.hero-icon {
  width: 52px; height: 52px;
  display: grid; place-items: center;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  border-radius: 14px; font-size: 26px;
  box-shadow: 0 6px 20px rgba(59,130,246,0.25);
}
.hero h1 { font-size: 22px; font-weight: 700; margin: 0 0 2px 0; letter-spacing: -0.3px; }
.hero p { font-size: 13px; color: var(--text-3); margin: 0; }

.btn-primary {
  display: inline-flex; align-items: center; gap: 6px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white; border: none; padding: 10px 18px;
  border-radius: 10px; font-size: 13px; font-weight: 600;
  cursor: pointer; box-shadow: 0 4px 12px rgba(59,130,246,0.3);
  transition: transform .15s, box-shadow .15s;
}
.btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(59,130,246,0.4); }
.btn-primary span { font-size: 16px; font-weight: 400; }

.btn-ghost {
  background: var(--surface); border: 1px solid var(--border);
  color: var(--text-2); padding: 9px 14px; border-radius: 9px;
  font-size: 13px; font-weight: 500; cursor: pointer;
  transition: background .15s, border-color .15s;
}
.btn-ghost:hover { background: #f8fafc; border-color: #cbd5e1; }

/* ================================================================
   STATS
   ================================================================ */
.stats { display: grid; grid-template-columns: repeat(6, 1fr); gap: 12px; margin-bottom: 22px; }

.stat {
  display: flex; align-items: center; gap: 12px;
  background: var(--surface); padding: 16px 18px;
  border-radius: 14px; border: 1px solid var(--border);
  transition: transform .18s, box-shadow .18s, border-color .18s;
}
.stat:hover {
  transform: translateY(-2px); border-color: #d7deea;
  box-shadow: 0 8px 24px rgba(15,23,42,0.06);
}
.stat-icon {
  width: 40px; height: 40px;
  display: grid; place-items: center;
  border-radius: 10px; font-size: 18px;
  background: #f1f5f9; flex-shrink: 0;
}
.stat[data-tone="amber"]  .stat-icon { background: var(--amber-bg); }
.stat[data-tone="blue"]   .stat-icon { background: var(--blue-bg); }
.stat[data-tone="green"]  .stat-icon { background: var(--green-bg); }
.stat[data-tone="violet"] .stat-icon { background: var(--violet-bg); }
.stat[data-tone="cyan"]   .stat-icon { background: var(--cyan-bg); }

.stat-value { font-size: 22px; font-weight: 700; line-height: 1.1; letter-spacing: -0.4px; }
.stat-label {
  font-size: 11.5px; color: var(--text-3); font-weight: 500;
  text-transform: uppercase; letter-spacing: 0.4px; margin-top: 2px;
}

/* ================================================================
   COUNTRY TABS
   ================================================================ */
.tabs {
  display: flex; gap: 4px; margin-bottom: 18px;
  overflow-x: auto; padding-bottom: 4px;
  border-bottom: 2px solid var(--border-soft);
}

.tab {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 11px 16px; border-radius: 10px 10px 0 0;
  background: transparent; border: none; cursor: pointer;
  font-size: 13.5px; font-weight: 600; color: var(--text-2);
  white-space: nowrap;
  border-bottom: 2px solid transparent; margin-bottom: -2px;
  transition: background .15s, color .15s, border-color .15s;
  font-family: inherit;
}
.tab:hover { background: #f1f5f9; color: var(--text); }

.tab.active {
  color: var(--primary);
  border-bottom-color: var(--primary);
  background: linear-gradient(to top, rgba(59,130,246,0.06), transparent);
}

.tab-flag { font-size: 18px; line-height: 1; }
.tab-name { letter-spacing: -0.2px; }

.tab-count {
  font-size: 11px; font-weight: 700;
  background: #f1f5f9; color: var(--text-3);
  padding: 2px 8px; border-radius: 10px;
}
.tab.active .tab-count { background: var(--blue-bg); color: #1d4ed8; }

.tab-add {
  color: var(--text-3); border: 1px dashed var(--border);
  border-radius: 10px; padding: 8px 14px; margin-left: 4px;
}
.tab-add:hover { color: var(--primary); border-color: var(--primary); background: var(--blue-bg); }

.tab-input {
  display: inline-flex; align-items: center; gap: 6px;
  background: white; border: 1px solid var(--primary);
  border-radius: 10px; padding: 4px 6px 4px 10px;
  margin-left: 4px;
}
.tab-input select {
  border: none; outline: none; background: transparent;
  font-size: 13px; font-family: inherit; padding: 6px 4px;
  cursor: pointer; min-width: 140px;
}
.tab-ok, .tab-cancel {
  border: none; cursor: pointer; padding: 6px 8px;
  border-radius: 6px; font-size: 12px; font-weight: 700;
}
.tab-ok { background: var(--primary); color: white; }
.tab-ok:hover { background: #2563eb; }
.tab-cancel { background: #f1f5f9; color: var(--text-2); }
.tab-cancel:hover { background: #e2e8f0; }

/* ================================================================
   TOOLBAR
   ================================================================ */
.toolbar { display: flex; gap: 10px; margin-bottom: 18px; flex-wrap: wrap; }

.search {
  position: relative; flex: 1; min-width: 260px;
  display: flex; align-items: center;
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 10px; padding: 0 14px;
  transition: border-color .15s, box-shadow .15s;
}
.search:focus-within { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(59,130,246,0.12); }
.search-icon { font-size: 13px; opacity: 0.5; }
.search input {
  flex: 1; border: none; outline: none; background: transparent;
  padding: 11px 10px; font-size: 13.5px; color: var(--text);
  font-family: inherit;
}
.search input::placeholder { color: var(--text-3); }
.search .clear {
  background: none; border: none; cursor: pointer;
  color: var(--text-3); padding: 4px 6px; font-size: 12px; border-radius: 6px;
}
.search .clear:hover { background: #f1f5f9; color: var(--text); }

.select {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 10px; padding: 11px 14px; font-size: 13.5px;
  color: var(--text); cursor: pointer; font-family: inherit;
  min-width: 140px; transition: border-color .15s;
}
.select:focus { outline: none; border-color: var(--primary); }

/* ================================================================
   COUNTRY PANEL
   ================================================================ */
.country-panel {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  overflow: hidden;
  animation: fadeIn .25s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}

.country-head {
  display: flex; align-items: center; justify-content: space-between;
  gap: 14px; padding: 20px 24px; flex-wrap: wrap;
  background: linear-gradient(to right, #fafbfd, #ffffff);
  border-bottom: 1px solid var(--border-soft);
}
.country-left { display: flex; align-items: center; gap: 14px; }
.country-flag { font-size: 34px; line-height: 1; }
.country-head h2 { font-size: 19px; font-weight: 700; margin: 0 0 2px 0; letter-spacing: -0.3px; }
.country-meta { font-size: 12px; color: var(--text-3); }

.country-badges { display: flex; gap: 6px; flex-wrap: wrap; }

.pill {
  font-size: 11.5px; font-weight: 600;
  padding: 4px 11px; border-radius: 20px; letter-spacing: 0.2px;
}
.pill.amber { background: var(--amber-bg); color: #92580a; }
.pill.blue  { background: var(--blue-bg);  color: #1d4ed8; }
.pill.green { background: var(--green-bg); color: #047857; }

.sections {
  padding: 20px 24px 24px;
  display: flex; flex-direction: column; gap: 20px;
}

/* ================================================================
   SECTION
   ================================================================ */
.section { border-radius: 12px; overflow: hidden; }

.section-head {
  display: flex; align-items: center; gap: 10px;
  padding: 12px 16px; border-radius: 12px 12px 0 0;
  border: 1px solid; border-bottom: none;
}
.section-notLoaded .section-head { background: var(--amber-bg); border-color: #fde3ab; }
.section-onProcess .section-head { background: var(--blue-bg); border-color: #c7ddff; }
.section-received  .section-head { background: var(--green-bg); border-color: #b7ecd2; }

.section-emoji { font-size: 15px; }

.section-head h3 {
  margin: 0; font-size: 12px; font-weight: 700;
  letter-spacing: 0.6px; text-transform: uppercase; flex: 1;
}
.section-notLoaded h3 { color: #92580a; }
.section-onProcess h3 { color: #1d4ed8; }
.section-received h3  { color: #047857; }

.section-count {
  background: white; color: var(--text-2);
  font-size: 11.5px; font-weight: 700;
  padding: 3px 10px; border-radius: 20px;
  border: 1px solid var(--border);
}

.section-empty {
  display: flex; align-items: center; gap: 10px;
  padding: 18px 20px; font-size: 12.5px;
  color: var(--text-3); font-style: italic;
  background: white; border: 1px solid var(--border);
  border-top: none; border-radius: 0 0 12px 12px;
}
.empty-dot { width: 6px; height: 6px; border-radius: 50%; background: #cbd5e1; }

/* ================================================================
   TIMELINE VIEW
   ================================================================ */
.timeline-view {
  display: flex; flex-direction: column; gap: 10px;
  padding: 14px;
  background: #fafbfd;
  border: 1px solid var(--border);
  border-top: none;
  border-radius: 0 0 12px 12px;
}

.bl-card {
  background: white; border: 1px solid var(--border);
  border-radius: 12px; overflow: hidden;
  transition: border-color .15s, box-shadow .15s;
}
.bl-card:hover { border-color: #d7deea; box-shadow: 0 2px 12px rgba(15,23,42,0.04); }
.bl-card.open { border-color: #bfdbfe; box-shadow: 0 4px 20px rgba(59,130,246,0.1); }

.bl-head {
  display: flex; align-items: center; gap: 14px;
  padding: 14px 18px; cursor: pointer; user-select: none;
  transition: background .15s;
}
.bl-head:hover { background: #fafbfd; }

.chev {
  display: inline-block; font-size: 10px; color: var(--text-3);
  transition: transform .22s cubic-bezier(.4,0,.2,1), color .15s;
  flex-shrink: 0;
}
.chev.open { transform: rotate(90deg); color: var(--primary); }

.bl-identity { min-width: 200px; }
.bl-no {
  font-family: 'SF Mono', ui-monospace, Menlo, Consolas, monospace;
  font-weight: 700; font-size: 13px; color: var(--text);
  letter-spacing: -0.2px;
}
.bl-meta { font-size: 11.5px; color: var(--text-3); margin-top: 3px; }

.bl-badges { display: flex; gap: 5px; flex-wrap: wrap; }

.badge {
  font-size: 10.5px; font-weight: 700;
  padding: 3px 8px; border-radius: 6px; letter-spacing: 0.2px;
}
.b-20 { background: var(--violet-bg); color: #5b21b6; }
.b-40 { background: #fdf2f8; color: #9d174d; }
.badge-bank { background: #f1f5f9; color: var(--text-2); }

.stage-pill {
  display: inline-block; font-size: 10.5px; font-weight: 700;
  letter-spacing: 0.4px; text-transform: uppercase;
  padding: 4px 11px; border-radius: 20px; white-space: nowrap;
}
.stage-pill.sm { font-size: 9.5px; padding: 3px 9px; }
.stage-pill.not_loaded,
.stage-pill.not-loaded { background: var(--amber-bg); color: #92580a; }
.stage-pill.on_process,
.stage-pill.on-process { background: var(--blue-bg); color: #1d4ed8; }
.stage-pill.received { background: var(--green-bg); color: #047857; }
.stage-pill.pending   { background: #f1f5f9; color: #64748b; }
.stage-pill.loaded    { background: var(--violet-bg); color: #5b21b6; }
.stage-pill.in_transit{ background: var(--blue-bg); color: #1d4ed8; }
.stage-pill.arrived_dj{ background: var(--cyan-bg); color: #0e7490; }
.stage-pill.arrived_aak{ background: #fdf2f8; color: #9d174d; }
.stage-pill.arrived_sdt{ background: #f5f1ff; color: #6d28d9; }
.stage-pill.returned  { background: var(--green-bg); color: #047857; }

/* Mini timeline preview on BL row */
.mini-timeline {
  display: flex; align-items: center; gap: 6px;
  margin-left: auto; flex-shrink: 0;
}
.mt-node {
  width: 22px; height: 22px;
  display: grid; place-items: center;
  position: relative;
}
.mt-node::before {
  content: ''; position: absolute;
  left: -6px; top: 50%; width: 6px; height: 2px;
  background: #e2e8f0;
}
.mt-node:first-child::before { display: none; }
.mt-node .mt-dot {
  width: 10px; height: 10px; border-radius: 50%;
  background: #e2e8f0; transition: all .2s;
  position: relative; z-index: 1;
}
.mt-node.done .mt-dot { background: var(--green); }
.mt-node.current .mt-dot {
  background: var(--amber);
  box-shadow: 0 0 0 4px rgba(245,158,11,0.18);
  animation: pulse 2s infinite;
}
@keyframes pulse {
  0%,100% { box-shadow: 0 0 0 4px rgba(245,158,11,0.18); }
  50%     { box-shadow: 0 0 0 6px rgba(245,158,11,0.08); }
}

/* ================================================================
   BL BODY (expanded)
   ================================================================ */
.bl-body {
  padding: 18px 22px 22px;
  border-top: 1px solid var(--border-soft);
  background: #fafbfd;
  display: flex; flex-direction: column; gap: 16px;
  animation: slideDown .22s cubic-bezier(.4,0,.2,1);
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-6px); }
  to   { opacity: 1; transform: translateY(0); }
}

.card {
  background: white; border: 1px solid var(--border);
  border-radius: 12px; padding: 16px 20px;
}
.card-title {
  display: flex; align-items: center; gap: 8px;
  font-size: 11.5px; font-weight: 700; letter-spacing: 0.5px;
  text-transform: uppercase; color: var(--text-2); margin-bottom: 14px;
}

.kv-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px 24px; }
.kv { display: flex; flex-direction: column; gap: 3px; font-size: 12.5px; }
.kv .k {
  font-size: 10.5px; color: var(--text-3); font-weight: 500;
  letter-spacing: 0.3px; text-transform: uppercase;
}
.kv .v { color: var(--text); font-weight: 600; }
.kv .v.mono { font-family: 'SF Mono', ui-monospace, Menlo, Consolas, monospace; }
.kv .v.ref { font-family: 'SF Mono', ui-monospace, Menlo, Consolas, monospace; color: var(--primary); }
.kv .v.ok { color: var(--green); font-weight: 700; }

.note {
  margin-top: 14px; padding: 10px 14px;
  background: var(--amber-bg);
  border-left: 3px solid var(--amber);
  border-radius: 6px; font-size: 12.5px; color: #78350f;
}

/* ================================================================
   CONTAINER CARDS + TIMELINE
   ================================================================ */
.container-list { display: flex; flex-direction: column; gap: 12px; }

.container-card {
  background: white; border: 1px solid var(--border);
  border-radius: 10px; overflow: hidden;
  transition: border-color .15s, box-shadow .15s;
}
.container-card:hover { border-color: #d7deea; box-shadow: 0 2px 12px rgba(15,23,42,0.04); }

.cont-head {
  display: flex; align-items: center; gap: 12px;
  padding: 11px 16px; cursor: pointer; user-select: none;
  font-size: 12.5px; transition: background .15s;
}
.cont-head:hover { background: #fafbfd; }

.size {
  font-size: 10.5px; font-weight: 800;
  padding: 3px 8px; border-radius: 6px; letter-spacing: 0.3px;
}
.size.s-20 { background: var(--violet-bg); color: #5b21b6; }
.size.s-40 { background: #fdf2f8; color: #9d174d; }

.cont-no {
  font-family: 'SF Mono', ui-monospace, Menlo, Consolas, monospace;
  font-weight: 700; color: var(--text); font-size: 12px;
}
.seal {
  font-family: 'SF Mono', ui-monospace, Menlo, Consolas, monospace;
  font-size: 11px; color: var(--text-3);
  background: #f8fafc; padding: 2px 8px; border-radius: 4px;
}
.items-count { font-size: 11.5px; color: var(--text-2); font-weight: 500; }
.spacer { flex: 1; }

/* Container horizontal timeline */
.cont-timeline {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0;
  padding: 14px 20px 16px;
  background: #fafbfd;
  border-top: 1px solid var(--border-soft);
}

.tl-node {
  display: flex; flex-direction: column; gap: 8px;
  position: relative; min-width: 0;
}

.tl-marker {
  display: flex; align-items: center;
  height: 20px; position: relative;
}

.tl-dot {
  width: 20px; height: 20px; border-radius: 50%;
  background: white; border: 2px solid #e2e8f0;
  display: grid; place-items: center;
  font-size: 10px; font-weight: 700;
  color: white; flex-shrink: 0;
  transition: all .2s; z-index: 1;
}
.tl-node.done .tl-dot {
  background: var(--green); border-color: var(--green);
}
.tl-node.current .tl-dot {
  border-color: var(--amber); background: var(--amber);
  box-shadow: 0 0 0 4px rgba(245,158,11,0.15);
  animation: pulse 2s infinite;
}

.tl-line {
  position: absolute; left: 20px; right: 0;
  top: 50%; height: 2px;
  background: #e2e8f0; transform: translateY(-50%);
}
.tl-node.done .tl-line { background: var(--green); }

.tl-info {
  display: flex; flex-direction: column; gap: 2px;
  padding-left: 4px; min-width: 0;
}
.tl-label {
  font-size: 10.5px; font-weight: 600; color: var(--text-2);
  text-transform: uppercase; letter-spacing: 0.3px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.tl-date {
  font-family: 'SF Mono', ui-monospace, Menlo, Consolas, monospace;
  font-size: 11px; color: var(--text-3); font-weight: 500;
  white-space: nowrap;
}
.tl-node.done .tl-date { color: var(--text); font-weight: 600; }

/* Container expanded */
.cont-body {
  padding: 16px 20px 18px;
  background: white;
  border-top: 1px solid var(--border-soft);
  animation: slideDown .18s ease;
}
.sub h5 {
  margin: 0 0 10px 0; font-size: 10.5px; font-weight: 700;
  color: var(--text-3); text-transform: uppercase; letter-spacing: 0.6px;
}
.items {
  width: 100%; border-collapse: collapse; font-size: 12px;
  background: white; border: 1px solid var(--border);
  border-radius: 8px; overflow: hidden;
}
.items th {
  background: #fafbfd; padding: 8px 12px; text-align: left;
  font-size: 10px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.4px; color: var(--text-3);
  border-bottom: 1px solid var(--border);
}
.items td {
  padding: 9px 12px; border-bottom: 1px solid var(--border-soft);
  color: var(--text);
}
.items tr:last-child td { border-bottom: none; }

/* ================================================================
   TABLE VIEW
   ================================================================ */
.table-wrap {
  border: 1px solid var(--border);
  border-top: none;
  border-radius: 0 0 12px 12px;
  overflow-x: auto;
  background: white;
}
.table { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 920px; }
.table thead th {
  background: #fafbfd; padding: 11px 16px; text-align: left;
  font-weight: 600; color: var(--text-3); font-size: 10.5px;
  text-transform: uppercase; letter-spacing: 0.6px;
  border-bottom: 1px solid var(--border); white-space: nowrap;
}
.table td {
  padding: 12px 16px; border-bottom: 1px solid var(--border-soft);
  vertical-align: middle; white-space: nowrap;
}
.table tbody tr:last-child td { border-bottom: none; }

.row { cursor: pointer; transition: background .14s; }
.row:hover { background: #fafbfd; }
.row.open { background: #f0f7ff; }
.row.open:hover { background: #e8f2ff; }

.col-expand { width: 36px; padding: 0 6px 0 14px !important; text-align: center; }
.num { text-align: right; font-variant-numeric: tabular-nums; font-weight: 500; }
.muted { color: var(--text-3); }
.mono-sm { font-family: 'SF Mono', ui-monospace, Menlo, Consolas, monospace; font-size: 12px; }

.cell-bl { min-width: 230px; white-space: normal; }

.cont-badges { display: flex; gap: 5px; flex-wrap: wrap; }

.detail-row td {
  padding: 0 !important; background: #fafbfd;
  border-bottom: 1px solid var(--border-soft) !important;
  white-space: normal;
}
.detail {
  padding: 20px 24px 22px 52px;
  display: flex; flex-direction: column; gap: 16px;
  animation: slideDown .22s cubic-bezier(.4,0,.2,1);
}

.pad { padding: 16px 0; font-size: 12.5px; text-align: center; }
.pad-sm { padding: 8px 0; font-size: 12px; text-align: center; }

/* ================================================================
   EMPTY
   ================================================================ */
.empty {
  text-align: center; padding: 70px 20px;
  background: var(--surface); border-radius: 14px;
  border: 1px dashed var(--border);
}
.empty-emoji { font-size: 40px; opacity: 0.4; margin-bottom: 12px; }
.empty h3 { font-size: 16px; margin: 0 0 4px 0; color: var(--text); }
.empty p { font-size: 13px; color: var(--text-3); margin: 0 0 16px 0; }

/* ================================================================
   MODAL
   ================================================================ */
.overlay {
  position: fixed; inset: 0;
  background: rgba(15,23,42,0.45);
  backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000; padding: 20px;
}

.modal {
  background: white; border-radius: 16px;
  width: 100%; max-width: 540px; max-height: 92vh;
  display: flex; flex-direction: column; overflow: hidden;
  box-shadow: 0 24px 60px rgba(15,23,42,0.25);
}

.modal-head {
  display: flex; align-items: center; gap: 14px;
  padding: 20px 24px; border-bottom: 1px solid var(--border-soft);
}
.modal-head-icon {
  width: 44px; height: 44px;
  display: grid; place-items: center;
  background: linear-gradient(135deg, #dbeafe, #ede9fe);
  border-radius: 12px; font-size: 22px;
}
.modal-head h3 { margin: 0 0 2px 0; font-size: 16px; font-weight: 700; }
.modal-head p { margin: 0; font-size: 12.5px; color: var(--text-3); }
.modal-head .close {
  margin-left: auto; background: none; border: none;
  font-size: 18px; color: var(--text-3); cursor: pointer;
  padding: 6px; border-radius: 6px;
}
.modal-head .close:hover { background: #f1f5f9; color: var(--text); }

.modal-body {
  padding: 20px 24px; overflow-y: auto;
  display: flex; flex-direction: column; gap: 14px;
}

.field { display: flex; flex-direction: column; gap: 6px; }
.field label {
  font-size: 11.5px; font-weight: 600; color: var(--text-2);
  letter-spacing: 0.2px; text-transform: uppercase;
}
.field input, .field select, .field textarea {
  width: 100%; padding: 10px 14px;
  border: 1px solid var(--border); border-radius: 9px;
  font-size: 13px; color: var(--text);
  font-family: inherit; background: white;
  transition: border-color .15s, box-shadow .15s;
}
.field input:focus, .field select:focus, .field textarea:focus {
  outline: none; border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(59,130,246,0.12);
}
.field textarea { resize: vertical; }

.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

.modal-foot {
  display: flex; justify-content: flex-end; gap: 10px;
  padding: 16px 24px; border-top: 1px solid var(--border-soft);
  background: #fafbfd;
}

.modal-enter-active, .modal-leave-active { transition: opacity .2s ease; }
.modal-enter-active .modal, .modal-leave-active .modal {
  transition: transform .25s cubic-bezier(.4,0,.2,1), opacity .2s ease;
}
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .modal, .modal-leave-to .modal {
  transform: translateY(20px) scale(.97); opacity: 0;
}

/* ================================================================
   RESPONSIVE
   ================================================================ */
@media (max-width: 1200px) {
  .stats { grid-template-columns: repeat(3, 1fr); }
  .kv-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 720px) {
  .fpp { padding: 16px 14px 40px; }
  .stats { grid-template-columns: repeat(2, 1fr); gap: 10px; }
  .stat { padding: 12px 14px; }
  .stat-value { font-size: 18px; }
  .toolbar { flex-direction: column; }
  .select { width: 100%; }
  .hero h1 { font-size: 18px; }
  .sections { padding: 14px; }
  .detail { padding: 16px 14px; }
  .kv-grid { grid-template-columns: 1fr; }
  .cont-timeline { grid-template-columns: 1fr; gap: 8px; }
  .tl-marker { height: auto; }
  .tl-line { display: none; }
  .country-head { flex-direction: column; align-items: flex-start; }
  .grid-2 { grid-template-columns: 1fr; }
  .bl-head { flex-wrap: wrap; }
  .mini-timeline { width: 100%; margin-left: 0; justify-content: space-between; }
}
</style>