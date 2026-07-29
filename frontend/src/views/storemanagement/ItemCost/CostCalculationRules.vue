<!-- views/cost/CostCalculationRules.vue -->
<template>
  <div class="rules-page">
    <!-- ==================== HEADER ==================== -->
    <header class="rules-header">
      <div class="header-left">
        <div class="logo-badge">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2v20M17 7l-5-5-5 5M7 17l5 5 5-5" />
            <rect x="2" y="7" width="20" height="10" rx="1" />
          </svg>
        </div>
        <div>
          <h1>📊 How Costs Are Calculated</h1>
          <p>Complete guide to inventory cost calculation rules</p>
        </div>
      </div>
      <div class="header-right">
        <button class="btn-back" @click="goBack">← Back to Dashboard</button>
      </div>
    </header>

    <!-- ==================== CONTENT ==================== -->
    <div class="rules-content">

      <!-- ==================== SECTION 1: OVERVIEW ==================== -->
      <div class="rules-section">
        <h2>📋 Overview</h2>
        <p>
          The Cost Dashboard calculates inventory costs using a multi-step process that ensures 
          <strong>accuracy</strong> and <strong>reliability</strong>. Only items with complete data 
          and no conflicts are included in the total cost.
        </p>
        <div class="formula-box">
          <strong>Core Formula:</strong>
          <div class="formula">Total Cost = Σ (Unit Cost × Agreed Quantity × Conversion Value)</div>
        </div>
        <div class="important-note">
          <span class="note-icon">⚠️</span>
          <span class="note-text">
            <strong>Important:</strong> Items with <code>unitCost = 0</code>, <code>conversionValue = 0</code>, 
            or <code>totalQuantity = 0</code> are <strong>EXCLUDED</strong> from total cost calculations.
          </span>
        </div>
      </div>

      <!-- ==================== SECTION 2: DATA REQUIREMENTS ==================== -->
      <div class="rules-section">
        <h2>✅ Data Requirements</h2>
        <p>For an item to be <strong>included</strong> in total cost calculations, it must have:</p>
        
        <div class="requirements-grid">
          <div class="requirement-card pass">
            <div class="req-icon">✅</div>
            <div class="req-content">
              <h3>Unit Cost</h3>
              <p><code>costPrice &gt; 0</code></p>
              <span class="req-desc">Item must have a valid unit cost assigned (must be greater than 0)</span>
            </div>
          </div>
          <div class="requirement-card pass">
            <div class="req-icon">✅</div>
            <div class="req-content">
              <h3>Conversion UOM</h3>
              <p><code>conversionUomId IS NOT NULL</code></p>
              <span class="req-desc">Item must have a conversion unit of measure</span>
            </div>
          </div>
          <div class="requirement-card pass">
            <div class="req-icon">✅</div>
            <div class="req-content">
              <h3>Conversion Value</h3>
              <p><code>conversionValue &gt; 0</code></p>
              <span class="req-desc">Item must have a valid conversion factor (must be greater than 0)</span>
            </div>
          </div>
          <div class="requirement-card pass">
            <div class="req-icon">✅</div>
            <div class="req-content">
              <h3>Active Status</h3>
              <p><code>status = 'Active'</code></p>
              <span class="req-desc">Item must be active in the system</span>
            </div>
          </div>
          <div class="requirement-card pass">
            <div class="req-icon">✅</div>
            <div class="req-content">
              <h3>Has Valid Balance</h3>
              <p><code>balance &gt; 0</code></p>
              <span class="req-desc">Item must have at least one balance with quantity > 0</span>
            </div>
          </div>
          <div class="requirement-card pass">
            <div class="req-icon">✅</div>
            <div class="req-content">
              <h3>No Conflicts</h3>
              <p><code>All groups in each store agree</code></p>
              <span class="req-desc">No balance disagreements within the same store</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ==================== SECTION 3: CONFLICT RESOLUTION ==================== -->
      <div class="rules-section">
        <h2>⚖️ Conflict Resolution</h2>
        <p>
          A <strong>conflict</strong> occurs when different groups within the <strong>same store</strong> 
          report <strong>different quantities</strong> for the same item. The store is then <strong>excluded</strong> 
          from cost calculations.
        </p>

        <div class="example-box">
          <h3>Example:</h3>
          <div class="example-content">
            <div class="example-good">
              <span class="example-label">✅ NO Conflict</span>
              <div class="example-data">
                <div>Store A - Group 1: 10 units</div>
                <div>Store A - Group 2: 10 units</div>
                <div class="example-result">→ All groups agree → <strong>INCLUDED</strong></div>
              </div>
            </div>
            <div class="example-bad">
              <span class="example-label">❌ CONFLICT</span>
              <div class="example-data">
                <div>Store A - Group 1: 10 units</div>
                <div>Store A - Group 2: 15 units</div>
                <div class="example-result">→ Groups disagree → <strong>EXCLUDED</strong></div>
              </div>
            </div>
          </div>
        </div>

        <div class="conflict-rules">
          <div class="rule-item">
            <span class="rule-icon">🔍</span>
            <div>
              <strong>Detection:</strong>
              <span>System checks all groups in each store for quantity agreement</span>
            </div>
          </div>
          <div class="rule-item">
            <span class="rule-icon">🚫</span>
            <div>
              <strong>Action:</strong>
              <span>If ANY conflict exists in a store, that store is EXCLUDED from total cost</span>
            </div>
          </div>
          <div class="rule-item">
            <span class="rule-icon">📊</span>
            <div>
              <strong>Reporting:</strong>
              <span>Items with conflicts are counted in "Excluded (Items Conflict)" metric</span>
            </div>
          </div>
          <div class="rule-item">
            <span class="rule-icon">💡</span>
            <div>
              <strong>Important:</strong>
              <span>Each store is counted ONCE, not per group. Groups within the same store share inventory.</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ==================== SECTION 4: STATUS RULES ==================== -->
      <div class="rules-section">
        <h2>📊 Status Rules</h2>
        <p>Each item is assigned a status based on the following rules:</p>

        <div class="status-grid">
          <div class="status-card active">
            <div class="status-header">
              <span class="status-icon">✅</span>
              <h3>ACTIVE</h3>
            </div>
            <div class="status-body">
              <ul>
                <li>✅ <code>unitCost &gt; 0</code></li>
                <li>✅ <code>conversionValue &gt; 0</code></li>
                <li>✅ <code>conversionUomId IS NOT NULL</code></li>
                <li>✅ <code>totalQty &gt; 0</code></li>
                <li>✅ <strong>No conflicts</strong> in any store</li>
              </ul>
              <div class="status-result">
                <span class="result-badge included">✅ INCLUDED in Total Cost</span>
              </div>
            </div>
          </div>

          <div class="status-card partial">
            <div class="status-header">
              <span class="status-icon">⚠️</span>
              <h3>PARTIAL</h3>
            </div>
            <div class="status-body">
              <ul>
                <li>✅ <code>unitCost &gt; 0</code></li>
                <li>✅ <code>conversionValue &gt; 0</code></li>
                <li>✅ <code>conversionUomId IS NOT NULL</code></li>
                <li>❌ <strong>Some stores</strong> have conflicts</li>
              </ul>
              <div class="status-result">
                <span class="result-badge excluded">❌ EXCLUDED from Total Cost</span>
                <span class="status-reason">Needs conflict resolution</span>
              </div>
            </div>
          </div>

          <div class="status-card incomplete">
            <div class="status-header">
              <span class="status-icon">🔴</span>
              <h3>INCOMPLETE</h3>
            </div>
            <div class="status-body">
              <ul>
                <li>❌ <code>unitCost = 0</code> OR <code>NULL</code></li>
                <li>❌ OR <code>conversionValue = 0</code> OR <code>NULL</code></li>
                <li>❌ OR <code>conversionUomId IS NULL</code></li>
                <li>❌ OR <code>totalQty = 0</code> (no valid inventory)</li>
              </ul>
              <div class="status-result">
                <span class="result-badge excluded">❌ EXCLUDED from Total Cost</span>
                <span class="status-reason">Needs data setup</span>
              </div>
            </div>
          </div>

          <div class="status-card inactive">
            <div class="status-header">
              <span class="status-icon">⛔</span>
              <h3>INACTIVE</h3>
            </div>
            <div class="status-body">
              <ul>
                <li>❌ Manually excluded from cost calculations</li>
                <li>❌ In <code>exclude_item_from_cost</code> table</li>
                <li>❌ <code>is_active = true</code></li>
              </ul>
              <div class="status-result">
                <span class="result-badge excluded">❌ EXCLUDED from Total Cost</span>
                <span class="status-reason">Manually excluded</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ==================== SECTION 5: METRICS EXPLANATION ==================== -->
      <div class="rules-section">
        <h2>📊 Metrics Explanation</h2>

        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-header">
              <span class="metric-icon">📦</span>
              <h3>Total Items</h3>
            </div>
            <div class="metric-body">
              <div class="metric-formula">
                <code>COUNT(items WHERE status = 'Active')</code>
              </div>
              <p>Simply counts all active items in the system. No filters applied.</p>
              <div class="metric-example">
                <strong>Example:</strong> 2,284 active items → Total Items = 2,284
              </div>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-header">
              <span class="metric-icon">💰</span>
              <h3>Total Inventory Cost</h3>
            </div>
            <div class="metric-body">
              <div class="metric-formula">
                <code>Σ (Unit Cost × Agreed Qty × Conversion Value)</code>
              </div>
              <p>Sum of all item costs. Only includes items that pass <strong>ALL</strong> checks.</p>
              <div class="metric-example">
                <strong>Example:</strong> Item A: 100 × 10 × 5 = 5,000 ETB
              </div>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-header">
              <span class="metric-icon">⚠️</span>
              <h3>Items with Zero Cost</h3>
            </div>
            <div class="metric-body">
              <div class="metric-formula">
                <code>COUNT(items WHERE costPrice = 0 OR NULL)</code>
              </div>
              <p>Active items that have no unit cost assigned (costPrice = 0).</p>
              <div class="metric-example">
                <strong>Example:</strong> Items with costPrice = 0 → Zero Cost Items
              </div>
              <div class="metric-note">
                <span class="note-icon">💡</span>
                <span>These items are <strong>EXCLUDED</strong> from total cost</span>
              </div>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-header">
              <span class="metric-icon">⛔</span>
              <h3>Excluded (Items Conflict)</h3>
            </div>
            <div class="metric-body">
              <div class="metric-formula">
                <code>COUNT(items WITH store conflicts)</code>
              </div>
              <p>Items where groups in the same store have different quantities.</p>
              <div class="metric-example">
                <strong>Example:</strong> Store A: Group 1=10, Group 2=15 → Conflict → Excluded
              </div>
              <div class="metric-note">
                <span class="note-icon">💡</span>
                <span>These items are <strong>EXCLUDED</strong> from total cost</span>
              </div>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-header">
              <span class="metric-icon">🔴</span>
              <h3>Excluded (Incomplete Data)</h3>
            </div>
            <div class="metric-body">
              <div class="metric-formula">
                <code>COUNT(items WHERE conversionUomId = NULL OR conversionValue = 0 OR conversionValue = NULL)</code>
              </div>
              <p>Active items missing required conversion data or with zero conversion value.</p>
              <div class="metric-example">
                <strong>Example:</strong> Item missing conversionUomId → Incomplete → Excluded
              </div>
              <div class="metric-note">
                <span class="note-icon">💡</span>
                <span>These items are <strong>EXCLUDED</strong> from total cost</span>
              </div>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-header">
              <span class="metric-icon">📊</span>
              <h3>Items with No Inventory</h3>
            </div>
            <div class="metric-body">
              <div class="metric-formula">
                <code>COUNT(items WITH totalQty = 0)</code>
              </div>
              <p>Active items that have no inventory (all balances are 0).</p>
              <div class="metric-example">
                <strong>Example:</strong> Items with balance = 0 in all stores → No Inventory
              </div>
              <div class="metric-note">
                <span class="note-icon">💡</span>
                <span>These items are <strong>EXCLUDED</strong> from total cost</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ==================== SECTION 6: INCLUSION/EXCLUSION FLOWCHART ==================== -->
      <div class="rules-section">
        <h2>🔄 Inclusion/Exclusion Flowchart</h2>
        <div class="flowchart">
          <div class="flow-step start">
            <span class="step-icon">🚀</span>
            <span class="step-label">Start: All Active Items</span>
          </div>
          <div class="flow-arrow">↓</div>
          <div class="flow-step check">
            <span class="step-icon">💰</span>
            <span class="step-label">Has Unit Cost? (costPrice > 0)</span>
            <span class="step-result fail">NO → ❌ Zero Cost Items</span>
          </div>
          <div class="flow-arrow">↓ YES</div>
          <div class="flow-step check">
            <span class="step-icon">📐</span>
            <span class="step-label">Has Conversion Data? (UOM & Value > 0)</span>
            <span class="step-result fail">NO → ❌ Incomplete Data</span>
          </div>
          <div class="flow-arrow">↓ YES</div>
          <div class="flow-step check">
            <span class="step-icon">📊</span>
            <span class="step-label">Has Valid Inventory? (quantity > 0)</span>
            <span class="step-result fail">NO → ❌ No Inventory</span>
          </div>
          <div class="flow-arrow">↓ YES</div>
          <div class="flow-step check">
            <span class="step-icon">⚖️</span>
            <span class="step-label">All Groups Agree in Each Store?</span>
            <span class="step-result fail">NO → ❌ Conflict</span>
          </div>
          <div class="flow-arrow">↓ YES</div>
          <div class="flow-step success">
            <span class="step-icon">✅</span>
            <span class="step-label">INCLUDED in Total Cost</span>
          </div>
        </div>
      </div>

      <!-- ==================== SECTION 7: CALCULATION EXAMPLE ==================== -->
      <div class="rules-section">
        <h2>📝 Complete Calculation Example</h2>

        <div class="example-calculation">
          <h3>Item: "Homopolymer Glue" (SDT000004)</h3>
          
          <div class="calc-details">
            <div class="calc-row">
              <span class="calc-label">Unit Cost:</span>
              <span class="calc-value">335.71 ETB per KG</span>
            </div>
            <div class="calc-row">
              <span class="calc-label">Base UOM:</span>
              <span class="calc-value">DRUM</span>
            </div>
            <div class="calc-row">
              <span class="calc-label">Conversion UOM:</span>
              <span class="calc-value">KG</span>
            </div>
            <div class="calc-row">
              <span class="calc-label">Conversion Value:</span>
              <span class="calc-value">250 (1 DRUM = 250 KG)</span>
            </div>
            <div class="calc-row">
              <span class="calc-label">Status:</span>
              <span class="calc-value status-partial-label">PARTIAL</span>
            </div>
            <div class="calc-row">
              <span class="calc-label">Reason:</span>
              <span class="calc-value">1 store excluded due to conflict</span>
            </div>
          </div>

          <div class="calc-stores">
            <div class="calc-store">
              <h4>Store 29 (MainStore_3) ✅ INCLUDED</h4>
              <div class="calc-group">Group 1: 4,991 DRUMS</div>
              <div class="calc-group">Group 2: 4,991 DRUMS</div>
              <div class="calc-group-result">✅ Agreed: 4,991 DRUMS → 1,247,750 KG</div>
            </div>
            <div class="calc-store">
              <h4>Store 28 (MainStore_1_yeshi) ❌ EXCLUDED</h4>
              <div class="calc-group">Group 1: 1,819 DRUMS</div>
              <div class="calc-group">Group 2: 1,820 DRUMS</div>
              <div class="calc-group-result conflict">❌ Conflict! Groups disagree (1,819 vs 1,820)</div>
            </div>
            <div class="calc-store">
              <h4>Store 27 (Mainstore_2) ✅ INCLUDED</h4>
              <div class="calc-group">Group 1: 1,000 DRUMS</div>
              <div class="calc-group">Group 2: 1,000 DRUMS</div>
              <div class="calc-group-result">✅ Agreed: 1,000 DRUMS → 250,000 KG</div>
            </div>
          </div>

          <div class="calc-final">
            <div class="calc-row final">
              <span class="calc-label">Included Stores:</span>
              <span class="calc-value">2 stores (Store 29 + Store 27)</span>
            </div>
            <div class="calc-row final">
              <span class="calc-label">Total DRUMS:</span>
              <span class="calc-value">4,991 + 1,000 = 5,991 DRUMS</span>
            </div>
            <div class="calc-row final">
              <span class="calc-label">Total KG:</span>
              <span class="calc-value">5,991 × 250 = 1,497,750 KG</span>
            </div>
            <div class="calc-row final">
              <span class="calc-label">Total Cost:</span>
              <span class="calc-value highlight">335.71 × 1,497,750 = 502,809,652.50 ETB</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ==================== SECTION 8: QUICK REFERENCE ==================== -->
      <div class="rules-section">
        <h2>📌 Quick Reference</h2>
        
        <div class="reference-table">
          <table>
            <thead>
              <tr>
                <th>Metric</th>
                <th>Formula</th>
                <th>Included in Total Cost?</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Total Items</strong></td>
                <td><code>COUNT(Active Items)</code></td>
                <td class="text-muted">❌ No (just a count)</td>
              </tr>
              <tr>
                <td><strong>Zero Cost Items</strong></td>
                <td><code>COUNT(Active Items WITH costPrice = 0)</code></td>
                <td class="text-danger">❌ No (need cost assignment)</td>
              </tr>
              <tr>
                <td><strong>Excluded (Conflict)</strong></td>
                <td><code>COUNT(Items WITH store conflicts)</code></td>
                <td class="text-danger">❌ No (needs resolution)</td>
              </tr>
              <tr>
                <td><strong>Excluded (Incomplete)</strong></td>
                <td><code>COUNT(Items WITH missing conversion data)</code></td>
                <td class="text-danger">❌ No (needs setup)</td>
              </tr>
              <tr>
                <td><strong>Excluded (No Inventory)</strong></td>
                <td><code>COUNT(Items WITH totalQty = 0)</code></td>
                <td class="text-danger">❌ No (no stock)</td>
              </tr>
              <tr>
                <td><strong>Total Inventory Cost</strong></td>
                <td><code>Σ(Unit Cost × Agreed Qty × Conversion Value)</code></td>
                <td class="text-success">✅ YES (the actual cost)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ==================== FOOTER ==================== -->
      <div class="rules-footer">
        <p>Last updated: {{ currentDate }}</p>
        <p class="note">
          💡 <strong>Note:</strong> All calculations are performed in real-time using the latest inventory data.
          Items with conflicts or incomplete data must be resolved before they can be included in cost calculations.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const currentDate = computed(() => {
  const now = new Date()
  return now.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
})

const goBack = () => {
  router.push('/cost-dashboard')
}
</script>

<style scoped>
/* ================================================================
   RULES PAGE - MAIN CONTAINER
   ================================================================ */
.rules-page {
  min-height: 100vh;
  background: #f5f7fb;
  padding: 24px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* ================================================================
   HEADER
   ================================================================ */
.rules-header {
  background: white;
  padding: 20px 24px;
  border-radius: 16px;
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.logo-badge {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #8b5cf6, #6d28d9);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-badge svg {
  width: 28px;
  height: 28px;
  color: white;
}

.header-left h1 {
  font-size: 24px;
  font-weight: 700;
  margin: 0;
  color: #1e293b;
}

.header-left p {
  font-size: 13px;
  color: #64748b;
  margin: 4px 0 0;
}

.btn-back {
  background: #8b5cf6;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-back:hover {
  background: #7c3aed;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

/* ================================================================
   CONTENT
   ================================================================ */
.rules-content {
  max-width: 1200px;
  margin: 0 auto;
}

/* ================================================================
   RULES SECTION
   ================================================================ */
.rules-section {
  background: white;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.rules-section h2 {
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 8px 0;
  border-left: 4px solid #8b5cf6;
  padding-left: 16px;
}

.rules-section > p {
  color: #64748b;
  font-size: 14px;
  margin: 8px 0 16px 0;
  padding-left: 20px;
}

/* ================================================================
   IMPORTANT NOTE
   ================================================================ */
.important-note {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  background: #fef3c7;
  border: 1px solid #fde68a;
  border-radius: 8px;
  margin-top: 12px;
}

.important-note .note-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.important-note .note-text {
  font-size: 13px;
  color: #92400e;
}

.important-note .note-text code {
  background: #fde68a;
  padding: 1px 6px;
  border-radius: 4px;
  font-weight: 600;
}

/* ================================================================
   FORMULA BOX
   ================================================================ */
.formula-box {
  background: #f8fafc;
  border: 2px dashed #8b5cf6;
  border-radius: 12px;
  padding: 16px 20px;
  margin: 12px 0;
  text-align: center;
}

.formula-box .formula {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin-top: 4px;
  font-family: monospace;
}

/* ================================================================
   REQUIREMENTS GRID
   ================================================================ */
.requirements-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  margin-top: 12px;
}

.requirement-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 12px;
  border-left: 4px solid #10b981;
}

.requirement-card .req-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.requirement-card .req-content h3 {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: #1e293b;
}

.requirement-card .req-content p {
  font-size: 12px;
  margin: 0 0 4px 0;
  color: #64748b;
  font-family: monospace;
}

.requirement-card .req-content .req-desc {
  font-size: 11px;
  color: #94a3b8;
}

/* ================================================================
   EXAMPLE BOX
   ================================================================ */
.example-box {
  background: #f8fafc;
  border-radius: 12px;
  padding: 16px;
  margin-top: 12px;
}

.example-box h3 {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 12px 0;
}

.example-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.example-good,
.example-bad {
  padding: 12px 16px;
  border-radius: 8px;
}

.example-good {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
}

.example-bad {
  background: #fef2f2;
  border: 1px solid #fecaca;
}

.example-label {
  font-weight: 600;
  font-size: 13px;
  display: block;
  margin-bottom: 8px;
}

.example-good .example-label { color: #166534; }
.example-bad .example-label { color: #991b1b; }

.example-data {
  font-size: 13px;
  color: #1e293b;
}

.example-data > div {
  padding: 2px 0;
}

.example-result {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #e2e8f0;
  font-size: 13px;
}

.example-good .example-result { color: #166534; }
.example-bad .example-result { color: #991b1b; }

/* ================================================================
   CONFLICT RULES
   ================================================================ */
.conflict-rules {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
}

.rule-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 16px;
  background: #f8fafc;
  border-radius: 8px;
}

.rule-item .rule-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.rule-item strong {
  display: block;
  font-size: 13px;
  color: #1e293b;
}

.rule-item span:last-child {
  font-size: 13px;
  color: #64748b;
}

/* ================================================================
   STATUS GRID
   ================================================================ */
.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  margin-top: 12px;
}

.status-card {
  border-radius: 12px;
  overflow: hidden;
  border: 2px solid #e2e8f0;
}

.status-card.active {
  border-color: #22c55e;
}

.status-card.partial {
  border-color: #f59e0b;
}

.status-card.incomplete {
  border-color: #ef4444;
}

.status-card.inactive {
  border-color: #94a3b8;
}

.status-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.status-header .status-icon {
  font-size: 20px;
}

.status-header h3 {
  font-size: 14px;
  font-weight: 600;
  margin: 0;
}

.status-card.active .status-header h3 { color: #16a34a; }
.status-card.partial .status-header h3 { color: #d97706; }
.status-card.incomplete .status-header h3 { color: #dc2626; }
.status-card.inactive .status-header h3 { color: #64748b; }

.status-body {
  padding: 12px 16px;
  background: white;
}

.status-body ul {
  list-style: none;
  padding: 0;
  margin: 0 0 12px 0;
}

.status-body ul li {
  font-size: 13px;
  padding: 3px 0;
  color: #1e293b;
}

.status-body ul li code {
  background: #f1f5f9;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-family: monospace;
}

.status-result {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-top: 8px;
  border-top: 1px solid #e2e8f0;
}

.result-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
}

.result-badge.included {
  background: #dcfce7;
  color: #166534;
}

.result-badge.excluded {
  background: #fee2e2;
  color: #991b1b;
}

.status-reason {
  font-size: 11px;
  color: #94a3b8;
}

/* ================================================================
   METRICS GRID
   ================================================================ */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
  margin-top: 12px;
}

.metric-card {
  background: #f8fafc;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
}

.metric-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: #f1f5f9;
  border-bottom: 1px solid #e2e8f0;
}

.metric-header .metric-icon {
  font-size: 20px;
}

.metric-header h3 {
  font-size: 14px;
  font-weight: 600;
  margin: 0;
  color: #1e293b;
}

.metric-body {
  padding: 12px 16px;
}

.metric-body .metric-formula {
  background: #1e293b;
  color: #f8fafc;
  padding: 6px 10px;
  border-radius: 6px;
  font-family: monospace;
  font-size: 12px;
  margin-bottom: 8px;
}

.metric-body p {
  font-size: 13px;
  color: #64748b;
  margin: 0 0 8px 0;
}

.metric-body .metric-example {
  font-size: 12px;
  color: #94a3b8;
  padding: 6px 10px;
  background: white;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.metric-body .metric-note {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  padding: 6px 10px;
  background: #fef3c7;
  border-radius: 6px;
  font-size: 12px;
  color: #92400e;
}

.metric-body .metric-note .note-icon {
  font-size: 14px;
}

/* ================================================================
   FLOWCHART
   ================================================================ */
.flowchart {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  background: #f8fafc;
  border-radius: 12px;
  margin-top: 12px;
}

.flow-step {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 20px;
  border-radius: 10px;
  width: 100%;
  max-width: 500px;
  justify-content: center;
}

.flow-step.start {
  background: #dbeafe;
  border: 2px solid #3b82f6;
}

.flow-step.check {
  background: #fef3c7;
  border: 2px solid #f59e0b;
}

.flow-step.success {
  background: #dcfce7;
  border: 2px solid #22c55e;
}

.flow-step .step-icon {
  font-size: 20px;
}

.flow-step .step-label {
  font-weight: 500;
  color: #1e293b;
  font-size: 14px;
}

.flow-step .step-result {
  font-size: 12px;
  font-weight: 600;
  padding: 2px 10px;
  border-radius: 12px;
  margin-left: 8px;
}

.flow-step .step-result.fail {
  background: #fee2e2;
  color: #991b1b;
}

.flow-step .step-result.pass {
  background: #dcfce7;
  color: #166534;
}

.flow-arrow {
  font-size: 24px;
  color: #94a3b8;
  padding: 4px 0;
}

/* ================================================================
   EXAMPLE CALCULATION
   ================================================================ */
.example-calculation {
  background: #f8fafc;
  border-radius: 12px;
  padding: 20px;
  margin-top: 12px;
}

.example-calculation h3 {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 12px 0;
  text-align: center;
}

.calc-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px 24px;
  margin-bottom: 16px;
}

.calc-row {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  border-bottom: 1px solid #e2e8f0;
}

.calc-row .calc-label {
  color: #64748b;
  font-size: 13px;
}

.calc-row .calc-value {
  color: #1e293b;
  font-weight: 500;
  font-size: 13px;
}

.calc-row .calc-value.status-partial-label {
  color: #d97706;
  font-weight: 600;
}

.calc-row.final .calc-value {
  font-size: 15px;
}

.calc-row .calc-value.highlight {
  color: #8b5cf6;
  font-weight: 700;
  font-size: 18px;
}

.calc-stores {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 16px;
  margin: 12px 0;
}

.calc-store {
  background: white;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.calc-store h4 {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 8px 0;
}

.calc-group {
  font-size: 13px;
  color: #64748b;
  padding: 2px 0;
}

.calc-group-result {
  font-size: 13px;
  font-weight: 600;
  color: #10b981;
  padding-top: 6px;
  margin-top: 6px;
  border-top: 1px solid #e2e8f0;
}

.calc-group-result.conflict {
  color: #dc2626;
}

.calc-final {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 2px solid #e2e8f0;
}

/* ================================================================
   REFERENCE TABLE
   ================================================================ */
.reference-table {
  overflow-x: auto;
  margin-top: 12px;
}

.reference-table table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.reference-table th,
.reference-table td {
  padding: 10px 16px;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
}

.reference-table th {
  background: #f8fafc;
  font-weight: 600;
  color: #475569;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.reference-table td code {
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  font-family: monospace;
}

.reference-table tr:hover {
  background: #f8fafc;
}

.text-success { color: #16a34a; font-weight: 600; }
.text-danger { color: #dc2626; font-weight: 600; }
.text-muted { color: #94a3b8; }

/* ================================================================
   FOOTER
   ================================================================ */
.rules-footer {
  text-align: center;
  padding: 16px;
  color: #94a3b8;
  font-size: 13px;
}

.rules-footer .note {
  margin-top: 8px;
  color: #64748b;
  font-size: 13px;
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;
}

/* ================================================================
   RESPONSIVE
   ================================================================ */
@media (max-width: 992px) {
  .example-content {
    grid-template-columns: 1fr;
  }
  .calc-details {
    grid-template-columns: 1fr;
  }
  .calc-stores {
    grid-template-columns: 1fr;
  }
  .requirements-grid {
    grid-template-columns: 1fr;
  }
  .metrics-grid {
    grid-template-columns: 1fr;
  }
  .status-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 768px) {
  .rules-page {
    padding: 16px;
  }
  .rules-header {
    flex-direction: column;
    align-items: flex-start;
  }
  .header-left {
    flex-wrap: wrap;
  }
  .header-left h1 {
    font-size: 20px;
  }
  .btn-back {
    width: 100%;
    justify-content: center;
  }
  .flow-step {
    flex-wrap: wrap;
    padding: 10px 14px;
  }
  .flow-step .step-result {
    margin-left: 0;
  }
  .reference-table table {
    font-size: 12px;
  }
  .reference-table th,
  .reference-table td {
    padding: 6px 10px;
  }
  .status-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .rules-section {
    padding: 16px;
  }
  .rules-section h2 {
    font-size: 17px;
  }
  .formula-box .formula {
    font-size: 14px;
  }
  .metric-card {
    margin-bottom: 8px;
  }
}
</style>