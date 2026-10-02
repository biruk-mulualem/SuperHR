// src/pages/admin/settings/AttendanceSettingsPage.js
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
  Modal,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import settingsService from '../../../stores/settingsService';

const ACCENT = '#10B981';
const EMOJI  = '⏰';

// ================================================================
// SUB-TABS
// ================================================================
const SUB_TABS = [
  { id: 'workSchedule',  name: 'Schedule',      emoji: '📋' },
  { id: 'breakRules',    name: 'Breaks',        emoji: '🍽️' },
  { id: 'overtimeRules', name: 'Overtime',      emoji: '💰' },
  { id: 'leaveTypes',    name: 'Leave',         emoji: '🌴' },
  { id: 'validation',    name: 'Validation',    emoji: '✅' },
  { id: 'extensions',    name: 'Extensions',    emoji: '➕' },
  { id: 'workflow',      name: 'Workflow',      emoji: '⚙️' },
  { id: 'notifications', name: 'Notifications', emoji: '🔔' },
  { id: 'holidays',      name: 'Holidays',      emoji: '🎉' },
];

const WEEK_DAYS = [
  { value: 'monday',    label: 'Monday'    },
  { value: 'tuesday',   label: 'Tuesday'   },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday',  label: 'Thursday'  },
  { value: 'friday',    label: 'Friday'    },
  { value: 'saturday',  label: 'Saturday'  },
  { value: 'sunday',    label: 'Sunday'    },
];

// ================================================================
// DEFAULTS — mirrors the Vue file
// ================================================================
const DEFAULT_RULES = {
  workSchedule: {
    expectedCheckIn: '06:20',
    expectedCheckOut: '18:00',
    lateThreshold: 5,
    gracePeriod: 15,
    earlyDepartureThreshold: 30,
    minWorkHours: 4,
    workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
  },
  breakRules: {
    lunchStart: '12:00',
    lunchEnd: '13:00',
    lunchDuration: 60,
    isLunchPaid: false,
    morningBreak: 15,
    afternoonBreak: 15,
  },
  overtimeRules: {
    threshold: 8,
    normalOTRate: 1.5,
    weekendOTRate: 2.0,
    holidayOTRate: 2.5,
    maxPerDay: 4,
    maxPerWeek: 20,
  },
  leaveRules: {
    annualLeave: { baseDays: 16, incrementInterval: 2, carryOverLimit: 30, carryOverExpiryYears: 3 },
    sickLeave: { requiresDoctorNoteAfter: 3, alertThreshold: 15 },
    maternityLeave: { defaultDays: 90, isPaid: true, minNoticeDays: 30 },
    paternityLeave: { defaultDays: 3, minNoticeDays: 14 },
    bereavementLeave: {
      defaultDays: 3,
      immediateFamilyDays: 5,
      eligibleRelationships: ['spouse', 'parent', 'child', 'sibling'],
    },
    unpaidLeave: {
      isPaid: false,
      requiresApproval: true,
      requiresDirectorApproval: true,
      minNoticeDays: 14,
      maxConsecutiveDays: 30,
      maxPerYear: 60,
      requiresReason: true,
    },
    validation: {
      minDaysPerRequest: 1,
      maxDaysPerRequest: 30,
      maxConcurrentEmployees: 5000,
      overlapAllowed: false,
      futureDateOnly: true,
    },
  },
  returnTracking: { enabled: true, gracePeriodHours: 24, overdueAlertDays: [1, 3, 5, 7] },
  extensions: { maxExtensionsPerLeave: 2, maxTotalExtensionDays: 30 },
  approvalWorkflow: {
    requiresManagerApproval: true,
    requiresHrApproval: true,
    autoApproveThresholdDays: 3,
    approvalChain: ['manager', 'hr', 'director'],
  },
  yearEndProcessing: { processingDate: '2026-12-31', autoCarryOver: true },
  notifications: {
    reminderDaysBefore: [30, 14, 7, 3, 1],
    expiryAlertDays: [60, 30, 14, 7],
    channels: ['email', 'in_app'],
  },
  holidayRules: {
    holidays: [
      { date: '2026-01-01', name: 'New Year',            type: 'public'    },
      { date: '2026-01-07', name: 'Ethiopian Christmas', type: 'religious' },
      { date: '2026-01-19', name: 'Timkat',              type: 'religious' },
      { date: '2026-03-02', name: 'Adwa Victory Day',    type: 'public'    },
      { date: '2026-03-20', name: 'Eid al-Fitr',         type: 'religious' },
      { date: '2026-04-10', name: 'Good Friday',         type: 'religious' },
      { date: '2026-04-12', name: 'Fasika (Easter)',     type: 'religious' },
      { date: '2026-05-01', name: 'Labour Day',          type: 'public'    },
      { date: '2026-05-05', name: 'Patriots Day',        type: 'public'    },
      { date: '2026-05-27', name: 'Eid al-Adha',         type: 'religious' },
      { date: '2026-05-28', name: 'Derg Downfall Day',   type: 'public'    },
      { date: '2026-08-26', name: 'Mawlid',              type: 'religious' },
      { date: '2026-09-11', name: 'Ethiopian New Year',  type: 'public'    },
      { date: '2026-09-27', name: 'Meskel',              type: 'religious' },
    ],
  },
  fieldWorkRules: { consideredPresent: true, defaultHours: 8 },
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

const parseListOfNumbers = (str) =>
  String(str)
    .split(',')
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !Number.isNaN(n));

const parseListOfStrings = (str) =>
  String(str)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

// ================================================================
// MAIN
// ================================================================
export default function AttendanceSettingsPage({
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

  const [rules, setRules]           = useState(DEFAULT_RULES);
  const [activeTab, setActiveTab]   = useState('workSchedule');
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving]         = useState(false);

  // ----------------------------------------------------------------
  // LOAD
  // ----------------------------------------------------------------
  const loadRules = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await settingsService.getAttendanceRules();
      if (res.success && res.rules) {
        setRules(deepMerge(DEFAULT_RULES, res.rules));
      }
    } catch (e) {
      console.error('loadRules failed:', e);
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
  // MUTATORS — path-based update, keeps everything immutable
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

  const toggleWorkDay = (day) => {
    const current = rules.workSchedule.workingDays || [];
    const next = current.includes(day)
      ? current.filter((d) => d !== day)
      : [...current, day];
    updatePath('workSchedule.workingDays', next);
  };

  // ----------------------------------------------------------------
  // SAVE
  // ----------------------------------------------------------------
  const saveRules = async () => {
    if (!canEdit) return;
    setSaving(true);
    try {
      const res = await settingsService.updateAttendanceRules(rules);
      if (res.success) {
        Alert.alert('Saved', 'Attendance rules saved successfully');
      } else {
        Alert.alert('Error', res.error || 'Failed to save rules');
      }
    } catch (e) {
      Alert.alert('Error', e?.message || 'Failed to save rules');
    } finally {
      setSaving(false);
    }
  };

  // ----------------------------------------------------------------
  // HOLIDAYS
  // ----------------------------------------------------------------
  const addHoliday = () => {
    updatePath('holidayRules.holidays', [
      ...(rules.holidayRules.holidays || []),
      { date: '', name: '', type: 'public' },
    ]);
  };

  const removeHoliday = (index) => {
    const list = [...(rules.holidayRules.holidays || [])];
    list.splice(index, 1);
    updatePath('holidayRules.holidays', list);
  };

  const updateHoliday = (index, key, value) => {
    const list = [...(rules.holidayRules.holidays || [])];
    list[index] = { ...list[index], [key]: value };
    updatePath('holidayRules.holidays', list);
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
          You don't have permission to view attendance rules.
        </Text>
      </View>
    );
  }

  // ================================================================
  // FIELD COMPONENTS
  // ================================================================
  const Field = ({ label, value, onChange, type = 'text', suffix, disabled }) => {
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
            { backgroundColor: cardBg, borderColor },
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

  // ================================================================
  // TAB CONTENT
  // ================================================================
  const renderTabContent = () => {
    const w = rules.workSchedule;
    const b = rules.breakRules;
    const o = rules.overtimeRules;
    const l = rules.leaveRules;
    const rt = rules.returnTracking;
    const ex = rules.extensions;
    const aw = rules.approvalWorkflow;
    const yep = rules.yearEndProcessing;
    const n = rules.notifications;
    const hr = rules.holidayRules;
    const fw = rules.fieldWorkRules;

    switch (activeTab) {
      case 'workSchedule':
        return (
          <View>
            <SectionTitle>⏰ Work Schedule</SectionTitle>
            <Field label="Expected Check-In"  value={w.expectedCheckIn}  onChange={(v) => updatePath('workSchedule.expectedCheckIn', v)} />
            <Field label="Expected Check-Out" value={w.expectedCheckOut} onChange={(v) => updatePath('workSchedule.expectedCheckOut', v)} />
            <Field label="Late Threshold"     value={w.lateThreshold}    onChange={(v) => updatePath('workSchedule.lateThreshold', v)}  type="int" suffix="min" />
            <Field label="Grace Period"       value={w.gracePeriod}      onChange={(v) => updatePath('workSchedule.gracePeriod', v)}    type="int" suffix="min" />
            <Field label="Early Departure Threshold" value={w.earlyDepartureThreshold} onChange={(v) => updatePath('workSchedule.earlyDepartureThreshold', v)} type="int" suffix="min" />
            <Field label="Minimum Work Hours" value={w.minWorkHours}     onChange={(v) => updatePath('workSchedule.minWorkHours', v)}   type="number" suffix="hrs" />

            <SubTitle>📅 Working Days</SubTitle>
            <View style={styles.dayGrid}>
              {WEEK_DAYS.map((day) => {
                const on = w.workingDays?.includes(day.value);
                return (
                  <TouchableOpacity
                    key={day.value}
                    onPress={() => toggleWorkDay(day.value)}
                    disabled={!canEdit}
                    activeOpacity={0.8}
                    style={[
                      styles.dayChip,
                      {
                        backgroundColor: on ? ACCENT : cardBg,
                        borderColor: on ? ACCENT : borderColor,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayChipText,
                        { color: on ? '#FFFFFF' : textColor },
                      ]}
                    >
                      {day.label.slice(0, 3)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );

      case 'breakRules':
        return (
          <View>
            <SectionTitle>🍽️ Break & Lunch Rules</SectionTitle>
            <Field label="Lunch Start"     value={b.lunchStart}     onChange={(v) => updatePath('breakRules.lunchStart', v)} />
            <Field label="Lunch End"       value={b.lunchEnd}       onChange={(v) => updatePath('breakRules.lunchEnd', v)} />
            <Field label="Lunch Duration"  value={b.lunchDuration}  onChange={(v) => updatePath('breakRules.lunchDuration', v)} type="int" suffix="min" />
            <ToggleField label="Is Lunch Paid?" value={b.isLunchPaid} onChange={(v) => updatePath('breakRules.isLunchPaid', v)} />
            <Field label="Morning Break"   value={b.morningBreak}   onChange={(v) => updatePath('breakRules.morningBreak', v)}   type="int" suffix="min" />
            <Field label="Afternoon Break" value={b.afternoonBreak} onChange={(v) => updatePath('breakRules.afternoonBreak', v)} type="int" suffix="min" />
          </View>
        );

      case 'overtimeRules':
        return (
          <View>
            <SectionTitle>💰 Overtime Rules</SectionTitle>
            <Field label="Overtime Threshold"  value={o.threshold}      onChange={(v) => updatePath('overtimeRules.threshold', v)}      type="number" suffix="hrs/day" />
            <Field label="Normal OT Rate"      value={o.normalOTRate}   onChange={(v) => updatePath('overtimeRules.normalOTRate', v)}   type="number" suffix="×" />
            <Field label="Weekend Rate"        value={o.weekendOTRate}  onChange={(v) => updatePath('overtimeRules.weekendOTRate', v)}  type="number" suffix="×" />
            <Field label="Holiday Rate"        value={o.holidayOTRate}  onChange={(v) => updatePath('overtimeRules.holidayOTRate', v)}  type="number" suffix="×" />
            <Field label="Max Overtime / Day"  value={o.maxPerDay}      onChange={(v) => updatePath('overtimeRules.maxPerDay', v)}      type="int"    suffix="hrs" />
            <Field label="Max Overtime / Week" value={o.maxPerWeek}     onChange={(v) => updatePath('overtimeRules.maxPerWeek', v)}     type="int"    suffix="hrs" />
          </View>
        );

      case 'leaveTypes':
        return (
          <View>
            <SubTitle>🌴 Annual Leave</SubTitle>
            <Field label="Base Days"                value={l.annualLeave.baseDays}             onChange={(v) => updatePath('leaveRules.annualLeave.baseDays', v)}             type="int" suffix="days" />
            <Field label="Increment Interval"       value={l.annualLeave.incrementInterval}    onChange={(v) => updatePath('leaveRules.annualLeave.incrementInterval', v)}    type="int" suffix="yrs" />
            <Field label="Carry Over Limit"         value={l.annualLeave.carryOverLimit}       onChange={(v) => updatePath('leaveRules.annualLeave.carryOverLimit', v)}       type="int" suffix="days" />
            <Field label="Carry Over Expiry"        value={l.annualLeave.carryOverExpiryYears} onChange={(v) => updatePath('leaveRules.annualLeave.carryOverExpiryYears', v)} type="int" suffix="yrs" />

            <SubTitle>🤒 Sick Leave</SubTitle>
            <Field label="Doctor Note Required After" value={l.sickLeave.requiresDoctorNoteAfter} onChange={(v) => updatePath('leaveRules.sickLeave.requiresDoctorNoteAfter', v)} type="int" suffix="days" />
            <Field label="Alert Threshold"            value={l.sickLeave.alertThreshold}          onChange={(v) => updatePath('leaveRules.sickLeave.alertThreshold', v)}          type="int" suffix="days" />

            <SubTitle>👶 Maternity Leave</SubTitle>
            <Field label="Default Days"     value={l.maternityLeave.defaultDays}    onChange={(v) => updatePath('leaveRules.maternityLeave.defaultDays', v)}    type="int" suffix="days" />
            <ToggleField label="Is Paid?"   value={l.maternityLeave.isPaid}         onChange={(v) => updatePath('leaveRules.maternityLeave.isPaid', v)} />
            <Field label="Min Notice Days"  value={l.maternityLeave.minNoticeDays}  onChange={(v) => updatePath('leaveRules.maternityLeave.minNoticeDays', v)}  type="int" suffix="days" />

            <SubTitle>👨 Paternity Leave</SubTitle>
            <Field label="Default Days"     value={l.paternityLeave.defaultDays}    onChange={(v) => updatePath('leaveRules.paternityLeave.defaultDays', v)}    type="int" suffix="days" />
            <Field label="Min Notice Days"  value={l.paternityLeave.minNoticeDays}  onChange={(v) => updatePath('leaveRules.paternityLeave.minNoticeDays', v)}  type="int" suffix="days" />

            <SubTitle>💔 Bereavement Leave</SubTitle>
            <Field label="Default Days"          value={l.bereavementLeave.defaultDays}         onChange={(v) => updatePath('leaveRules.bereavementLeave.defaultDays', v)}         type="int" suffix="days" />
            <Field label="Immediate Family Days" value={l.bereavementLeave.immediateFamilyDays} onChange={(v) => updatePath('leaveRules.bereavementLeave.immediateFamilyDays', v)} type="int" suffix="days" />
            <Field label="Eligible Relationships" value={(l.bereavementLeave.eligibleRelationships || []).join(', ')} onChange={(v) => updatePath('leaveRules.bereavementLeave.eligibleRelationships', parseListOfStrings(v))} />

            <SubTitle>💰 Unpaid Leave</SubTitle>
            <ToggleField label="Is Paid?"                     value={l.unpaidLeave.isPaid}                    onChange={(v) => updatePath('leaveRules.unpaidLeave.isPaid', v)} />
            <ToggleField label="Requires Approval?"           value={l.unpaidLeave.requiresApproval}          onChange={(v) => updatePath('leaveRules.unpaidLeave.requiresApproval', v)} />
            <ToggleField label="Requires Director Approval?"  value={l.unpaidLeave.requiresDirectorApproval}  onChange={(v) => updatePath('leaveRules.unpaidLeave.requiresDirectorApproval', v)} />
            <Field label="Min Notice Days"     value={l.unpaidLeave.minNoticeDays}     onChange={(v) => updatePath('leaveRules.unpaidLeave.minNoticeDays', v)}     type="int" suffix="days" />
            <Field label="Max Consecutive Days" value={l.unpaidLeave.maxConsecutiveDays} onChange={(v) => updatePath('leaveRules.unpaidLeave.maxConsecutiveDays', v)} type="int" suffix="days" />
            <Field label="Max Per Year"        value={l.unpaidLeave.maxPerYear}        onChange={(v) => updatePath('leaveRules.unpaidLeave.maxPerYear', v)}        type="int" suffix="days" />
            <ToggleField label="Requires Reason?" value={l.unpaidLeave.requiresReason} onChange={(v) => updatePath('leaveRules.unpaidLeave.requiresReason', v)} />
          </View>
        );

      case 'validation':
        return (
          <View>
            <SectionTitle>✅ Validation Rules</SectionTitle>
            <Field label="Min Days Per Request"       value={l.validation.minDaysPerRequest}       onChange={(v) => updatePath('leaveRules.validation.minDaysPerRequest', v)}       type="int" suffix="days" />
            <Field label="Max Days Per Request"       value={l.validation.maxDaysPerRequest}       onChange={(v) => updatePath('leaveRules.validation.maxDaysPerRequest', v)}       type="int" suffix="days" />
            <Field label="Max Concurrent Employees"   value={l.validation.maxConcurrentEmployees}   onChange={(v) => updatePath('leaveRules.validation.maxConcurrentEmployees', v)}   type="int" />
            <ToggleField label="Overlap Allowed?"     value={l.validation.overlapAllowed}          onChange={(v) => updatePath('leaveRules.validation.overlapAllowed', v)} />
            <ToggleField label="Future Date Only?"    value={l.validation.futureDateOnly}          onChange={(v) => updatePath('leaveRules.validation.futureDateOnly', v)} />
          </View>
        );

      case 'extensions':
        return (
          <View>
            <SectionTitle>➕ Extensions</SectionTitle>
            <Field label="Max Extensions Per Leave"   value={ex.maxExtensionsPerLeave}   onChange={(v) => updatePath('extensions.maxExtensionsPerLeave', v)}   type="int" />
            <Field label="Max Total Extension Days"   value={ex.maxTotalExtensionDays}   onChange={(v) => updatePath('extensions.maxTotalExtensionDays', v)}   type="int" suffix="days" />

            <SubTitle>🔄 Return Tracking</SubTitle>
            <ToggleField label="Enabled?" value={rt.enabled} onChange={(v) => updatePath('returnTracking.enabled', v)} />
            <Field label="Grace Period"       value={rt.gracePeriodHours}                            onChange={(v) => updatePath('returnTracking.gracePeriodHours', v)}                            type="int" suffix="hrs" />
            <Field label="Overdue Alert Days" value={(rt.overdueAlertDays || []).join(', ')}         onChange={(v) => updatePath('returnTracking.overdueAlertDays', parseListOfNumbers(v))} />
          </View>
        );

      case 'workflow':
        return (
          <View>
            <SectionTitle>✅ Approval Workflow</SectionTitle>
            <ToggleField label="Requires Manager Approval?" value={aw.requiresManagerApproval} onChange={(v) => updatePath('approvalWorkflow.requiresManagerApproval', v)} />
            <ToggleField label="Requires HR Approval?"      value={aw.requiresHrApproval}      onChange={(v) => updatePath('approvalWorkflow.requiresHrApproval', v)} />
            <Field label="Auto Approve Threshold" value={aw.autoApproveThresholdDays} onChange={(v) => updatePath('approvalWorkflow.autoApproveThresholdDays', v)} type="int" suffix="days" />
            <Field label="Approval Chain" value={(aw.approvalChain || []).join(', ')} onChange={(v) => updatePath('approvalWorkflow.approvalChain', parseListOfStrings(v))} />

            <SubTitle>📅 Year End Processing</SubTitle>
            <Field label="Processing Date" value={yep.processingDate} onChange={(v) => updatePath('yearEndProcessing.processingDate', v)} />
            <ToggleField label="Auto Carry Over?" value={yep.autoCarryOver} onChange={(v) => updatePath('yearEndProcessing.autoCarryOver', v)} />
          </View>
        );

      case 'notifications':
        return (
          <View>
            <SectionTitle>🔔 Notifications</SectionTitle>
            <Field label="Reminder Days Before" value={(n.reminderDaysBefore || []).join(', ')} onChange={(v) => updatePath('notifications.reminderDaysBefore', parseListOfNumbers(v))} />
            <Field label="Overdue Alert Days"   value={(rt.overdueAlertDays || []).join(', ')}  onChange={(v) => updatePath('returnTracking.overdueAlertDays', parseListOfNumbers(v))} />
            <Field label="Expiry Alert Days"    value={(n.expiryAlertDays || []).join(', ')}    onChange={(v) => updatePath('notifications.expiryAlertDays', parseListOfNumbers(v))} />

            <Text style={[styles.fieldLabel, { color: subTextColor, marginTop: 12 }]}>
              Channels
            </Text>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              {['email', 'in_app', 'sms'].map((ch) => {
                const on = (n.channels || []).includes(ch);
                return (
                  <TouchableOpacity
                    key={ch}
                    activeOpacity={0.8}
                    disabled={!canEdit}
                    onPress={() => {
                      const list = n.channels || [];
                      const next = on ? list.filter((c) => c !== ch) : [...list, ch];
                      updatePath('notifications.channels', next);
                    }}
                    style={[
                      styles.dayChip,
                      {
                        backgroundColor: on ? ACCENT : cardBg,
                        borderColor: on ? ACCENT : borderColor,
                      },
                    ]}
                  >
                    <Text style={[styles.dayChipText, { color: on ? '#FFFFFF' : textColor }]}>
                      {ch === 'in_app' ? 'In-App' : ch === 'sms' ? 'SMS' : 'Email'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );

      case 'holidays':
        return (
          <View>
            <SectionTitle>🎉 Holidays</SectionTitle>

            {(hr.holidays || []).map((h, idx) => (
              <View
                key={idx}
                style={[styles.holidayCard, { backgroundColor: cardBg, borderColor }]}
              >
                <View style={styles.holidayRow}>
                  <TextInput
                    value={h.date}
                    onChangeText={(v) => updateHoliday(idx, 'date', v)}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={subTextColor}
                    editable={canEdit}
                    style={[
                      styles.holidayInputSmall,
                      {
                        color: textColor,
                        backgroundColor: darkMode ? '#0F172A' : '#FFFFFF',
                        borderColor,
                      },
                    ]}
                  />
                  <TouchableOpacity
                    onPress={() => removeHoliday(idx)}
                    disabled={!canEdit}
                    hitSlop={8}
                    style={[
                      styles.holidayRemove,
                      { backgroundColor: darkMode ? '#3B0A0A' : '#FEE2E2' },
                    ]}
                  >
                    <Text style={{ color: '#EF4444', fontSize: 18, fontWeight: '900' }}>
                      ×
                    </Text>
                  </TouchableOpacity>
                </View>

                <TextInput
                  value={h.name}
                  onChangeText={(v) => updateHoliday(idx, 'name', v)}
                  placeholder="Holiday name"
                  placeholderTextColor={subTextColor}
                  editable={canEdit}
                  style={[
                    styles.holidayInput,
                    {
                      color: textColor,
                      backgroundColor: darkMode ? '#0F172A' : '#FFFFFF',
                      borderColor,
                    },
                  ]}
                />

                <View style={styles.holidayTypesRow}>
                  {['public', 'religious', 'company'].map((t) => {
                    const on = h.type === t;
                    return (
                      <TouchableOpacity
                        key={t}
                        onPress={() => updateHoliday(idx, 'type', t)}
                        disabled={!canEdit}
                        activeOpacity={0.8}
                        style={[
                          styles.holidayTypeChip,
                          {
                            backgroundColor: on ? ACCENT : darkMode ? '#1E293B' : '#F1F5F9',
                            borderColor: on ? ACCENT : borderColor,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.holidayTypeChipText,
                            { color: on ? '#FFFFFF' : textColor },
                          ]}
                        >
                          {t.charAt(0).toUpperCase() + t.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}

            <TouchableOpacity
              onPress={addHoliday}
              disabled={!canEdit}
              activeOpacity={0.85}
              style={[
                styles.addHolidayBtn,
                { borderColor: ACCENT, backgroundColor: ACCENT + '11' },
              ]}
            >
              <Text style={[styles.addHolidayBtnText, { color: ACCENT }]}>
                + Add Holiday
              </Text>
            </TouchableOpacity>

            <SubTitle>🏔️ Field Work Rules</SubTitle>
            <ToggleField label="Considered Present?" value={fw.consideredPresent} onChange={(v) => updatePath('fieldWorkRules.consideredPresent', v)} />
            <Field label="Default Hours" value={fw.defaultHours} onChange={(v) => updatePath('fieldWorkRules.defaultHours', v)} type="number" suffix="hrs" />
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
              Attendance Rules
            </Text>
            <Text style={[styles.headerSub, { color: subTextColor }]}>
              Schedule, breaks, leave, holidays
            </Text>
          </View>
        </View>

        {/* HORIZONTAL SUB-TABS */}
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
              onPress={saveRules}
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
                <Text style={styles.saveBtnText}>Save Rules</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : null}

        {/* INITIAL LOAD OVERLAY */}
        {loading ? (
          <View
            style={[
              styles.loadingOverlay,
              { backgroundColor: darkMode ? '#0F172A' : '#FFFFFF' },
            ]}
          >
            <ActivityIndicator size="large" color={ACCENT} />
            <Text style={[styles.loadingText, { color: subTextColor }]}>
              Loading attendance rules…
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

  dayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayChipText: { fontSize: 12.5, fontWeight: '800', letterSpacing: 0.3 },

  holidayCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  holidayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  holidayInputSmall: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 9,
    fontSize: 13.5,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  holidayRemove: {
    width: 40, height: 40, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  holidayInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 9,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  holidayTypesRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  holidayTypeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  holidayTypeChipText: { fontSize: 11.5, fontWeight: '800', letterSpacing: 0.2 },

  addHolidayBtn: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  addHolidayBtnText: { fontSize: 14, fontWeight: '800', letterSpacing: 0.3 },

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
});