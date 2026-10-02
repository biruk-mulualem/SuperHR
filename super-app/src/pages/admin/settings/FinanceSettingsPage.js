// src/pages/admin/settings/FinanceSettingsPage.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Platform,
  ScrollView,
  Switch,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import settingsService from '../../../stores/settingsService';

const ACCENT = '#F59E0B';
const EMOJI  = '💰';

// ================================================================
// SUB-TABS
// ================================================================
const SUB_TABS = [
  { id: 'brackets',    name: 'Brackets',  emoji: '📊' },
  { id: 'pension',     name: 'Pension',   emoji: '🏦' },
  { id: 'exemptions',  name: 'Exemptions',emoji: '✅' },
  { id: 'withholding', name: 'Withholding', emoji: '💰' },
  { id: 'residency',   name: 'Residency', emoji: '🌍' },
  { id: 'legal',       name: 'Legal',     emoji: '⚖️' },
];

// ================================================================
// DEFAULTS — mirrors the Vue file
// ================================================================
const DEFAULT_RULES = {
  version: '1.0',
  effectiveFrom: '2024-01-01',
  lastUpdated: new Date().toISOString(),
  legalReference: {
    incomeTaxProclamation: 'No. 286/2002 as amended',
    pensionProclamation: 'No. 715/2011 as amended by No. 908/2015',
  },
  employmentTax: {
    brackets: [
      { min: 0,     max: 2000, rate: 0,  deduction: 0,    description: 'Exempt' },
      { min: 2001,  max: 4000, rate: 15, deduction: 0,    description: '15% on amount over 2,000' },
      { min: 4001,  max: 7000, rate: 20, deduction: 200,  description: '20% minus 200' },
      { min: 7001,  max: 10000, rate: 25, deduction: 550, description: '25% minus 550' },
      { min: 10001, max: 14000, rate: 30, deduction: 1050, description: '30% minus 1,050' },
      { min: 14001, max: null,  rate: 35, deduction: 1750, description: '35% minus 1,750' },
    ],
    calculationFormula: 'Tax = (Income * Rate / 100) - Deduction',
    roundingMethod: 'floor',
  },
  pension: {
    employeeRate: 7,
    employerRate: 11,
    monthlyCap: 15000,
    maxEmployeeContribution: 1050,
    maxEmployerContribution: 1650,
    calculationBase: 'basic_salary_only',
    notes: 'Any salary above 15,000 ETB is not subject to pension contribution',
  },
  exemptions: {
    transportAllowance: {
      isExempt: true,
      maxExemptAmount: 2200,
      alternativeLimit: '25_percent_of_salary',
      calculationMethod: 'min_of_fixed_or_percentage',
    },
    medicalReimbursement: { isExempt: true },
    hardshipAllowance: { isExempt: true },
    travelReimbursement: { isExempt: true },
  },
  taxResidency: {
    daysThreshold: 183,
    permanentResidenceCriteria: true,
    description: 'Foreigners become tax residents after 183 days or if they have permanent residence',
  },
  withholdingTax: {
    standardRate: 15,
    goodsThreshold: 10000,
    servicesThreshold: 3000,
    noTinRate: 30,
    appliesTo: ['service_fees', 'dividends', 'royalties', 'interest'],
  },
  deadlines: { taxRemittanceDay: 8, pensionRemittanceDay: 10 },
  vat: {
    registrationThreshold: 1000000,
    standardRate: 15,
    notes: 'Businesses exceeding threshold must register for VAT',
  },
  turnoverTax: {
    goodsRate: 2,
    servicesContractorsRate: 2,
    servicesOthersRate: 10,
  },
};

// ================================================================
// HELPERS
// ================================================================
const deepMerge = (base, patch) => {
  const out = { ...base };
  Object.keys(patch || {}).forEach((k) => {
    const bv = base[k];
    const pv = patch[k];
    if (Array.isArray(pv)) out[k] = pv;
    else if (pv && typeof pv === 'object' && bv && typeof bv === 'object' && !Array.isArray(bv))
      out[k] = deepMerge(bv, pv);
    else out[k] = pv;
  });
  return out;
};

const humanDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

// ================================================================
// MAIN
// ================================================================
export default function FinanceSettingsPage({
  darkMode,
  textColor,
  subTextColor,
  cardBg,
  borderColor,
  userRole,
}) {
  const role = (userRole || '').toLowerCase();
  const canView = ['admin', 'superadmin', 'checker'].includes(role);
  const canEdit = ['admin', 'superadmin'].includes(role);

  const [rules, setRules]         = useState(DEFAULT_RULES);
  const [activeTab, setActiveTab] = useState('brackets');
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState(null);

  // ----------------------------------------------------------------
  // LOAD — reads the "tax.rules" key stored inside attendance rules
  // ----------------------------------------------------------------
  const loadRules = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await settingsService.getAttendanceRules();
      // The Vue version reads `response.data['tax.rules']`
      const stored = res?.rules?.['tax.rules'] ?? res?.data?.['tax.rules'] ?? null;
      if (stored) setRules(deepMerge(DEFAULT_RULES, stored));
      else setRules(DEFAULT_RULES);
    } catch (e) {
      setError(e?.message || 'Failed to load tax rules');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!canView) return;
    loadRules(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ----------------------------------------------------------------
  // Auto-calc pension contributions when cap/rates change
  // ----------------------------------------------------------------
  useEffect(() => {
    setRules((prev) => {
      const cap = Number(prev.pension.monthlyCap) || 0;
      const ee  = Number(prev.pension.employeeRate) || 0;
      const er  = Number(prev.pension.employerRate) || 0;
      const maxEE = Math.floor((cap * ee) / 100);
      const maxER = Math.floor((cap * er) / 100);
      if (
        prev.pension.maxEmployeeContribution === maxEE &&
        prev.pension.maxEmployerContribution === maxER
      ) return prev;
      return {
        ...prev,
        pension: {
          ...prev.pension,
          maxEmployeeContribution: maxEE,
          maxEmployerContribution: maxER,
        },
      };
    });
  }, [
    rules.pension.monthlyCap,
    rules.pension.employeeRate,
    rules.pension.employerRate,
  ]);

  // ----------------------------------------------------------------
  // PATH-BASED UPDATER
  // ----------------------------------------------------------------
  const updatePath = (path, value) => {
    setRules((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      const parts = path.split('.');
      let node = next;
      for (let i = 0; i < parts.length - 1; i++) node = node[parts[i]];
      node[parts[parts.length - 1]] = value;
      return next;
    });
  };

  const updateBracket = (index, key, value) => {
    setRules((prev) => {
      const list = [...(prev.employmentTax.brackets || [])];
      list[index] = { ...list[index], [key]: value };
      return { ...prev, employmentTax: { ...prev.employmentTax, brackets: list } };
    });
  };

  const toggleWithholdingAppliesTo = (type) => {
    const list = rules.withholdingTax.appliesTo || [];
    const next = list.includes(type)
      ? list.filter((t) => t !== type)
      : [...list, type];
    updatePath('withholdingTax.appliesTo', next);
  };

  // ----------------------------------------------------------------
  // SAVE
  // ----------------------------------------------------------------
  const saveTaxRules = async () => {
    if (!canEdit) return;
    setSaving(true);
    try {
      // Fetch current attendance-rules blob so we only replace tax.rules
      const current = await settingsService.getAttendanceRules();
      const currentData = current?.rules ?? current?.data ?? {};

      const nextVersion = String((parseInt(rules.version, 10) || 1) + 1);
      const toSave = {
        ...rules,
        version: nextVersion,
        lastUpdated: new Date().toISOString(),
      };

      const updated = {
        ...currentData,
        'tax.rules': toSave,
      };

      const res = await settingsService.updateAttendanceRules(updated);
      if (res?.success) {
        setRules(toSave);
        Alert.alert('Saved', 'Tax rules saved successfully');
      } else {
        Alert.alert('Error', res?.error || 'Failed to save tax rules');
      }
    } catch (e) {
      Alert.alert('Error', e?.message || 'Failed to save tax rules');
    } finally {
      setSaving(false);
    }
  };

  // ----------------------------------------------------------------
  // GUARD
  // ----------------------------------------------------------------
  if (!canView) {
    return (
      <View style={styles.noAccess}>
        <Text style={styles.noAccessEmoji}>🔒</Text>
        <Text style={[styles.emptyTitle, { color: textColor }]}>Access denied</Text>
        <Text style={[styles.emptyBody, { color: subTextColor }]}>
          You don't have permission to view tax rules.
        </Text>
      </View>
    );
  }

  // ================================================================
  // FIELD COMPONENTS
  // ================================================================
  const Field = ({
    label,
    value,
    onChange,
    type = 'text',
    suffix,
    disabled,
    hint,
  }) => {
    const keyboard =
      type === 'number'
        ? 'decimal-pad'
        : type === 'int'
        ? 'number-pad'
        : 'default';

    return (
      <View style={styles.field}>
        <Text style={[styles.fieldLabel, { color: subTextColor }]}>{label}</Text>
        <View
          style={[
            styles.fieldInputWrap,
            {
              backgroundColor: disabled
                ? darkMode
                  ? '#0B1220'
                  : '#F1F5F9'
                : cardBg,
              borderColor,
              opacity: disabled ? 0.85 : 1,
            },
          ]}
        >
          <TextInput
            value={value === null || value === undefined ? '' : String(value)}
            onChangeText={onChange}
            keyboardType={keyboard}
            editable={!disabled && canEdit}
            placeholder={label}
            placeholderTextColor={subTextColor}
            autoCapitalize="none"
            autoCorrect={false}
            style={[styles.fieldInput, { color: textColor }]}
          />
          {suffix ? (
            <Text style={[styles.fieldSuffix, { color: subTextColor }]}>{suffix}</Text>
          ) : null}
        </View>
        {hint ? (
          <Text style={[styles.fieldHint, { color: subTextColor }]}>{hint}</Text>
        ) : null}
      </View>
    );
  };

  const ToggleField = ({ label, value, onChange, disabled }) => (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: subTextColor }]}>{label}</Text>
      <View
        style={[
          styles.toggleFieldRow,
          { backgroundColor: cardBg, borderColor },
        ]}
      >
        <Text style={[styles.toggleFieldValue, { color: textColor }]}>
          {value ? 'Yes' : 'No'}
        </Text>
        <Switch
          value={!!value}
          onValueChange={onChange}
          disabled={disabled || !canEdit}
          trackColor={{ false: '#64748B', true: ACCENT }}
          thumbColor="#FFFFFF"
        />
      </View>
    </View>
  );

  const SectionTitle = ({ children }) => (
    <Text style={[styles.sectionTitle, { color: textColor }]}>{children}</Text>
  );

  const SubTitle = ({ children }) => (
    <View style={styles.subTitleRow}>
      <View style={[styles.subTitleBar, { backgroundColor: ACCENT }]} />
      <Text style={[styles.subTitleText, { color: textColor }]}>{children}</Text>
    </View>
  );

  const InfoCard = ({ children }) => (
    <View
      style={[
        styles.infoCard,
        {
          backgroundColor: darkMode ? '#064E3B' : '#F0FDF4',
          borderColor: darkMode ? '#065F46' : '#BBF7D0',
        },
      ]}
    >
      {children}
    </View>
  );

  const InfoNote = ({ children }) => (
    <View
      style={[
        styles.infoNote,
        {
          backgroundColor: darkMode ? '#78350F' : '#FEF3C7',
          borderColor: darkMode ? '#92400E' : '#FDE68A',
        },
      ]}
    >
      <Text
        style={[
          styles.infoNoteText,
          { color: darkMode ? '#FCD34D' : '#92400E' },
        ]}
      >
        {children}
      </Text>
    </View>
  );

  // ================================================================
  // TAB CONTENT
  // ================================================================
  const renderTabContent = () => {
    const t = rules;
    const et = t.employmentTax;
    const p  = t.pension;
    const ex = t.exemptions;
    const wh = t.withholdingTax;
    const tr = t.taxResidency;
    const dl = t.deadlines;
    const vat = t.vat;
    const tt = t.turnoverTax;
    const lr = t.legalReference;

    switch (activeTab) {
      // ---------------------------------------------------------
      // BRACKETS
      // ---------------------------------------------------------
      case 'brackets':
        return (
          <View>
            <SectionTitle>📊 Employment Income Tax Brackets</SectionTitle>

            <InfoCard>
              <Text style={[styles.infoText, { color: darkMode ? '#6EE7B7' : '#166534' }]}>
                <Text style={{ fontWeight: '800' }}>Formula: </Text>
                {et.calculationFormula}
              </Text>
              <Text style={[styles.infoText, { color: darkMode ? '#6EE7B7' : '#166534' }]}>
                <Text style={{ fontWeight: '800' }}>Rounding: </Text>
                {et.roundingMethod}
              </Text>
              <Text style={[styles.infoText, { color: darkMode ? '#6EE7B7' : '#166534' }]}>
                <Text style={{ fontWeight: '800' }}>Effective From: </Text>
                {t.effectiveFrom}
              </Text>
              <Text style={[styles.infoText, { color: darkMode ? '#6EE7B7' : '#166534' }]}>
                <Text style={{ fontWeight: '800' }}>Version: </Text>
                v{t.version}
              </Text>
            </InfoCard>

            {(et.brackets || []).map((bracket, idx) => (
              <View
                key={idx}
                style={[styles.bracketCard, { backgroundColor: cardBg, borderColor }]}
              >
                <View style={styles.bracketHeader}>
                  <Text style={[styles.bracketTitle, { color: textColor }]}>
                    Bracket {idx + 1}
                  </Text>
                  <View
                    style={[
                      styles.bracketRateBadge,
                      { backgroundColor: ACCENT + '22' },
                    ]}
                  >
                    <Text style={[styles.bracketRateText, { color: ACCENT }]}>
                      {bracket.rate}%
                    </Text>
                  </View>
                </View>

                <View style={styles.bracketFields}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.fieldLabel, { color: subTextColor }]}>
                      MIN (ETB)
                    </Text>
                    <TextInput
                      value={String(bracket.min)}
                      editable={false}
                      style={[
                        styles.bracketInput,
                        {
                          color: subTextColor,
                          backgroundColor: darkMode ? '#0B1220' : '#F1F5F9',
                          borderColor,
                        },
                      ]}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={[styles.fieldLabel, { color: subTextColor }]}>
                      MAX (ETB)
                    </Text>
                    <TextInput
                      value={bracket.max === null ? '∞' : String(bracket.max)}
                      onChangeText={(v) =>
                        updateBracket(
                          idx,
                          'max',
                          v === '∞' || v === '' ? null : Number(v)
                        )
                      }
                      editable={bracket.max !== null && canEdit}
                      keyboardType="decimal-pad"
                      style={[
                        styles.bracketInput,
                        {
                          color: textColor,
                          backgroundColor: bracket.max === null
                            ? darkMode ? '#0B1220' : '#F1F5F9'
                            : darkMode ? '#0F172A' : '#FFFFFF',
                          borderColor,
                        },
                      ]}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={[styles.fieldLabel, { color: subTextColor }]}>
                      RATE (%)
                    </Text>
                    <TextInput
                      value={String(bracket.rate)}
                      onChangeText={(v) => updateBracket(idx, 'rate', Number(v) || 0)}
                      editable={canEdit}
                      keyboardType="decimal-pad"
                      style={[
                        styles.bracketInput,
                        {
                          color: textColor,
                          backgroundColor: darkMode ? '#0F172A' : '#FFFFFF',
                          borderColor,
                        },
                      ]}
                    />
                  </View>
                </View>

                <View style={styles.bracketFields}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.fieldLabel, { color: subTextColor }]}>
                      DEDUCTION (ETB)
                    </Text>
                    <TextInput
                      value={String(bracket.deduction)}
                      onChangeText={(v) =>
                        updateBracket(idx, 'deduction', Number(v) || 0)
                      }
                      editable={canEdit}
                      keyboardType="decimal-pad"
                      style={[
                        styles.bracketInput,
                        {
                          color: textColor,
                          backgroundColor: darkMode ? '#0F172A' : '#FFFFFF',
                          borderColor,
                        },
                      ]}
                    />
                  </View>
                </View>

                <View style={{ marginTop: 8 }}>
                  <Text style={[styles.fieldLabel, { color: subTextColor }]}>
                    DESCRIPTION
                  </Text>
                  <TextInput
                    value={bracket.description || ''}
                    onChangeText={(v) => updateBracket(idx, 'description', v)}
                    editable={canEdit}
                    placeholder="Describe this bracket"
                    placeholderTextColor={subTextColor}
                    style={[
                      styles.bracketInput,
                      {
                        color: textColor,
                        backgroundColor: darkMode ? '#0F172A' : '#FFFFFF',
                        borderColor,
                      },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
        );

      // ---------------------------------------------------------
      // PENSION
      // ---------------------------------------------------------
      case 'pension':
        return (
          <View>
            <SectionTitle>🏦 Pension Contribution Rules</SectionTitle>

            <InfoCard>
              <Text style={[styles.infoText, { color: darkMode ? '#6EE7B7' : '#166534' }]}>
                <Text style={{ fontWeight: '800' }}>Legal Reference: </Text>
                {lr.pensionProclamation}
              </Text>
            </InfoCard>

            <Field
              label="Employee Contribution Rate"
              value={p.employeeRate}
              onChange={(v) => updatePath('pension.employeeRate', Number(v) || 0)}
              type="number"
              suffix="%"
            />
            <Field
              label="Employer Contribution Rate"
              value={p.employerRate}
              onChange={(v) => updatePath('pension.employerRate', Number(v) || 0)}
              type="number"
              suffix="%"
            />
            <Field
              label="Monthly Salary Cap"
              value={p.monthlyCap}
              onChange={(v) => updatePath('pension.monthlyCap', Number(v) || 0)}
              type="int"
              suffix="ETB"
            />
            <Field
              label="Max Employee Contribution"
              value={p.maxEmployeeContribution}
              onChange={() => {}}
              disabled
              suffix="ETB"
              hint={`Auto-calculated: ${p.monthlyCap} × ${p.employeeRate}%`}
            />
            <Field
              label="Max Employer Contribution"
              value={p.maxEmployerContribution}
              onChange={() => {}}
              disabled
              suffix="ETB"
              hint={`Auto-calculated: ${p.monthlyCap} × ${p.employerRate}%`}
            />

            <Text style={[styles.fieldLabel, { color: subTextColor, marginTop: 8 }]}>
              CALCULATION BASE
            </Text>
            <View style={styles.choiceRow}>
              {[
                { id: 'basic_salary_only', label: 'Basic Salary' },
                { id: 'gross_salary',      label: 'Gross Salary' },
              ].map((c) => {
                const on = p.calculationBase === c.id;
                return (
                  <TouchableOpacity
                    key={c.id}
                    onPress={() => updatePath('pension.calculationBase', c.id)}
                    disabled={!canEdit}
                    activeOpacity={0.8}
                    style={[
                      styles.choiceChip,
                      {
                        backgroundColor: on ? ACCENT : cardBg,
                        borderColor: on ? ACCENT : borderColor,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.choiceChipText,
                        { color: on ? '#FFFFFF' : textColor },
                      ]}
                    >
                      {c.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <InfoNote>
              <Text style={[styles.infoNoteText, { color: darkMode ? '#FCD34D' : '#92400E' }]}>
                <Text style={{ fontWeight: '800' }}>Note: </Text>
                {p.notes}
              </Text>
            </InfoNote>
          </View>
        );

      // ---------------------------------------------------------
      // EXEMPTIONS
      // ---------------------------------------------------------
      case 'exemptions':
        return (
          <View>
            <SectionTitle>✅ Tax Exemptions (Schedule E)</SectionTitle>

            {/* Transport Allowance */}
            <SubTitle>🚗 Transport Allowance Exemption</SubTitle>
            <ToggleField
              label="Is Exempt?"
              value={ex.transportAllowance.isExempt}
              onChange={(v) => updatePath('exemptions.transportAllowance.isExempt', v)}
            />
            <Field
              label="Max Exempt Amount"
              value={ex.transportAllowance.maxExemptAmount}
              onChange={(v) =>
                updatePath('exemptions.transportAllowance.maxExemptAmount', Number(v) || 0)
              }
              type="int"
              suffix="ETB"
            />
            <Field
              label="Alternative Limit"
              value={ex.transportAllowance.alternativeLimit}
              onChange={() => {}}
              disabled
            />
            <Field
              label="Calculation Method"
              value={ex.transportAllowance.calculationMethod}
              onChange={() => {}}
              disabled
            />

            {/* Medical */}
            <SubTitle>🏥 Medical Reimbursement</SubTitle>
            <ToggleField
              label="Is Exempt?"
              value={ex.medicalReimbursement.isExempt}
              onChange={(v) => updatePath('exemptions.medicalReimbursement.isExempt', v)}
            />

            {/* Hardship */}
            <SubTitle>⛰️ Hardship Allowance</SubTitle>
            <ToggleField
              label="Is Exempt?"
              value={ex.hardshipAllowance.isExempt}
              onChange={(v) => updatePath('exemptions.hardshipAllowance.isExempt', v)}
            />

            {/* Travel */}
            <SubTitle>✈️ Travel Reimbursement</SubTitle>
            <ToggleField
              label="Is Exempt?"
              value={ex.travelReimbursement.isExempt}
              onChange={(v) => updatePath('exemptions.travelReimbursement.isExempt', v)}
            />
          </View>
        );

      // ---------------------------------------------------------
      // WITHHOLDING & VAT
      // ---------------------------------------------------------
      case 'withholding':
        return (
          <View>
            <SectionTitle>💰 Withholding Tax</SectionTitle>

            <Field
              label="Standard Rate"
              value={wh.standardRate}
              onChange={(v) => updatePath('withholdingTax.standardRate', Number(v) || 0)}
              type="number"
              suffix="%"
            />
            <Field
              label="Goods Threshold"
              value={wh.goodsThreshold}
              onChange={(v) => updatePath('withholdingTax.goodsThreshold', Number(v) || 0)}
              type="int"
              suffix="ETB"
            />
            <Field
              label="Services Threshold"
              value={wh.servicesThreshold}
              onChange={(v) => updatePath('withholdingTax.servicesThreshold', Number(v) || 0)}
              type="int"
              suffix="ETB"
            />
            <Field
              label="No TIN Rate"
              value={wh.noTinRate}
              onChange={(v) => updatePath('withholdingTax.noTinRate', Number(v) || 0)}
              type="number"
              suffix="%"
            />

            <SubTitle>📋 Applies To</SubTitle>
            <View style={styles.choiceRow}>
              {['service_fees', 'dividends', 'royalties', 'interest'].map((t) => {
                const on = (wh.appliesTo || []).includes(t);
                return (
                  <TouchableOpacity
                    key={t}
                    onPress={() => toggleWithholdingAppliesTo(t)}
                    disabled={!canEdit}
                    activeOpacity={0.8}
                    style={[
                      styles.choiceChip,
                      {
                        backgroundColor: on ? ACCENT : cardBg,
                        borderColor: on ? ACCENT : borderColor,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.choiceChipText,
                        { color: on ? '#FFFFFF' : textColor },
                      ]}
                    >
                      {t.replace('_', ' ')}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <SubTitle>💰 VAT & Turnover Tax</SubTitle>
            <Field
              label="VAT Registration Threshold"
              value={vat.registrationThreshold}
              onChange={(v) =>
                updatePath('vat.registrationThreshold', Number(v) || 0)
              }
              type="int"
              suffix="ETB"
            />
            <Field
              label="VAT Standard Rate"
              value={vat.standardRate}
              onChange={(v) => updatePath('vat.standardRate', Number(v) || 0)}
              type="number"
              suffix="%"
            />
            <Field
              label="Turnover Tax — Goods"
              value={tt.goodsRate}
              onChange={(v) => updatePath('turnoverTax.goodsRate', Number(v) || 0)}
              type="number"
              suffix="%"
            />
            <Field
              label="Turnover Tax — Services Others"
              value={tt.servicesOthersRate}
              onChange={(v) =>
                updatePath('turnoverTax.servicesOthersRate', Number(v) || 0)
              }
              type="number"
              suffix="%"
            />
          </View>
        );

      // ---------------------------------------------------------
      // RESIDENCY & DEADLINES
      // ---------------------------------------------------------
      case 'residency':
        return (
          <View>
            <SectionTitle>🌍 Tax Residency Rules (Foreigners)</SectionTitle>

            <Field
              label="Days Threshold for Residency"
              value={tr.daysThreshold}
              onChange={(v) => updatePath('taxResidency.daysThreshold', Number(v) || 0)}
              type="int"
              suffix="days"
            />
            <ToggleField
              label="Permanent Residence Criteria?"
              value={tr.permanentResidenceCriteria}
              onChange={(v) =>
                updatePath('taxResidency.permanentResidenceCriteria', v)
              }
            />

            <InfoNote>
              <Text style={[styles.infoNoteText, { color: darkMode ? '#FCD34D' : '#92400E' }]}>
                <Text style={{ fontWeight: '800' }}>Note: </Text>
                {tr.description}
              </Text>
            </InfoNote>

            <SubTitle>📅 Filing Deadlines</SubTitle>
            <Field
              label="Tax Remittance Day of Month"
              value={dl.taxRemittanceDay}
              onChange={(v) =>
                updatePath('deadlines.taxRemittanceDay', Math.min(28, Math.max(1, Number(v) || 1)))
              }
              type="int"
              suffix="day"
            />
            <Field
              label="Pension Remittance Day of Month"
              value={dl.pensionRemittanceDay}
              onChange={(v) =>
                updatePath('deadlines.pensionRemittanceDay', Math.min(28, Math.max(1, Number(v) || 1)))
              }
              type="int"
              suffix="day"
            />
          </View>
        );

      // ---------------------------------------------------------
      // LEGAL
      // ---------------------------------------------------------
      case 'legal':
        return (
          <View>
            <SectionTitle>⚖️ Legal References</SectionTitle>

            <Field
              label="Income Tax Proclamation"
              value={lr.incomeTaxProclamation}
              onChange={(v) => updatePath('legalReference.incomeTaxProclamation', v)}
            />
            <Field
              label="Pension Proclamation"
              value={lr.pensionProclamation}
              onChange={(v) => updatePath('legalReference.pensionProclamation', v)}
            />

            <SubTitle>📝 Version Information</SubTitle>
            <Field
              label="Version"
              value={`v${t.version}`}
              onChange={() => {}}
              disabled
            />
            <Field
              label="Effective From"
              value={t.effectiveFrom}
              onChange={(v) => updatePath('effectiveFrom', v)}
            />
            <Field
              label="Last Updated"
              value={humanDate(t.lastUpdated)}
              onChange={() => {}}
              disabled
            />
          </View>
        );

      default:
        return null;
    }
  };

  // ================================================================
  // RENDER
  // ================================================================
  return (
    <GestureHandlerRootView style={styles.root}>
      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.headerBar}>
          <View style={[styles.headerIcon, { backgroundColor: ACCENT + '22' }]}>
            <Text style={styles.headerIconText}>{EMOJI}</Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[styles.headerTitle, { color: textColor }]}>
              Tax Rules
            </Text>
            <Text style={[styles.headerSub, { color: subTextColor }]}>
              Employment income tax · Schedule A
            </Text>
          </View>
        </View>

        {/* SUB-TABS */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.subTabsScroll}
          style={styles.subTabsWrap}
        >
          {SUB_TABS.map((t) => {
            const active = activeTab === t.id;
            return (
              <TouchableOpacity
                key={t.id}
                onPress={() => setActiveTab(t.id)}
                activeOpacity={0.8}
                style={[
                  styles.subTab,
                  {
                    backgroundColor: active ? ACCENT : cardBg,
                    borderColor: active ? ACCENT : borderColor,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.subTabText,
                    { color: active ? '#FFFFFF' : textColor },
                  ]}
                >
                  {t.emoji}  {t.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* BODY */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadRules(true)}
              tintColor={subTextColor}
            />
          }
        >
          {error ? (
            <TouchableOpacity
              onPress={() => loadRules(false)}
              activeOpacity={0.85}
              style={[
                styles.errorBox,
                {
                  borderColor: darkMode ? '#7F1D1D' : '#FCA5A5',
                  backgroundColor: darkMode ? '#3B0A0A' : '#FEF2F2',
                },
              ]}
            >
              <Text
                style={[
                  styles.errorText,
                  { color: darkMode ? '#FCA5A5' : '#991B1B' },
                ]}
              >
                ⚠️  {error}   ·   tap to retry
              </Text>
            </TouchableOpacity>
          ) : null}

          {renderTabContent()}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* BOTTOM ACTION BAR */}
        {canEdit ? (
          <View
            style={[
              styles.actionBar,
              { backgroundColor: cardBg, borderTopColor: borderColor },
            ]}
          >
            <TouchableOpacity
              onPress={saveTaxRules}
              disabled={saving}
              activeOpacity={0.85}
              style={[
                styles.saveBtn,
                { backgroundColor: ACCENT, opacity: saving ? 0.6 : 1 },
              ]}
            >
              {saving ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.saveBtnText}>Save Tax Rules</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : null}

        {/* LOADING OVERLAY */}
        {loading ? (
          <View            style={[
              styles.loadingOverlay,
              { backgroundColor: darkMode ? '#0F172A' : '#FFFFFF' },
            ]}
          >
            <ActivityIndicator size="large" color={ACCENT} />
            <Text style={[styles.loadingText, { color: subTextColor }]}>
              Loading tax rules…
            </Text>
          </View>
        ) : null}
      </View>
    </GestureHandlerRootView>
  );
}

// ================================================================
// STYLES
// ================================================================
const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { flex: 1 },

  noAccess: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  noAccessEmoji: { fontSize: 48, marginBottom: 12 },

  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
  },
  headerIcon: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  headerIconText: { fontSize: 20 },
  headerTitle: { fontSize: 19, fontWeight: '900', letterSpacing: -0.4 },
  headerSub: { fontSize: 11.5, fontWeight: '600', marginTop: 2 },

  subTabsWrap: { maxHeight: 46, marginBottom: 4 },
  subTabsScroll: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    gap: 8,
    alignItems: 'center',
  },
  subTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  subTabText: { fontSize: 12.5, fontWeight: '800', letterSpacing: 0.2 },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 },

  errorBox: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  errorText: { fontSize: 12.5, fontWeight: '600' },

  sectionTitle: {
    fontSize: 15.5,
    fontWeight: '900',
    letterSpacing: -0.2,
    marginBottom: 12,
    marginTop: 4,
  },
  subTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 22,
    marginBottom: 12,
    gap: 8,
  },
  subTitleBar: { width: 3, height: 18, borderRadius: 2 },
  subTitleText: { fontSize: 14.5, fontWeight: '900', letterSpacing: -0.1 },

  field: { marginBottom: 12 },
  fieldLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  fieldInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    minHeight: 46,
  },
  fieldInput: { flex: 1, fontSize: 14.5, fontWeight: '600', paddingVertical: 10 },
  fieldSuffix: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 8,
    letterSpacing: 0.2,
  },
  fieldHint: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
    fontStyle: 'italic',
  },

  toggleFieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 46,
  },
  toggleFieldValue: { fontSize: 14, fontWeight: '700' },

  choiceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  choiceChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  choiceChipText: { fontSize: 12.5, fontWeight: '800', letterSpacing: 0.2 },

  infoCard: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
  },
  infoText: { fontSize: 12.5, fontWeight: '600', marginVertical: 3 },

  infoNote: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 14,
  },
  infoNoteText: { fontSize: 12.5, fontWeight: '600', lineHeight: 18 },

  // Bracket card
  bracketCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  bracketHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  bracketTitle: { fontSize: 14, fontWeight: '900', letterSpacing: -0.1 },
  bracketRateBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  bracketRateText: { fontSize: 12, fontWeight: '900', letterSpacing: 0.4 },
  bracketFields: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  bracketInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 9,
    fontSize: 13.5,
    fontWeight: '600',
    minHeight: 42,
  },

  actionBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 14,
    borderTopWidth: 1,
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: { fontSize: 13, fontWeight: '500' },

  emptyTitle: { fontSize: 16, fontWeight: '800' },
  emptyBody: { fontSize: 13, fontWeight: '500', marginTop: 6, textAlign: 'center' },
});