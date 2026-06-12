import * as XLSX from 'xlsx';

// Safety check for XLSX sub-properties
const getXLSX = () => {
  if (XLSX.utils) return XLSX;
  if ((XLSX as any).default && (XLSX as any).default.utils) return (XLSX as any).default;
  return XLSX;
};

/**
 * Modern Excel Export Utility with robust error handling
 */

export const exportToExcel = (data: any[], fileName: string, sheetName: string = 'Data') => {
  const lib = getXLSX();
  console.log(`[Export] Starting single sheet export: ${fileName}`);
  try {
    if (!data || data.length === 0) {
      console.warn('[Export] No data to export');
      return;
    }
    const worksheet = lib.utils.json_to_sheet(data);
    const workbook = lib.utils.book_new();
    lib.utils.book_append_sheet(workbook, worksheet, sheetName);
    lib.writeFile(workbook, `${fileName}_${new Date().getTime()}.xlsx`);
    console.log('[Export] Download triggered');
  } catch (err) {
    console.error('[Export] Error in exportToExcel:', err);
  }
};

/**
 * Generates the complex Master Report with specific formatting
 */
export const exportCharityMasterReport = (params: {
  beneficiaries: any[],
  teams: any[],
  release: any,
  fileName: string
}) => {
  const lib = getXLSX();
  const { beneficiaries, teams, release, fileName } = params;
  console.log('[Export] Master Report Start', { bens: beneficiaries?.length, teams: teams?.length });
  
  try {
    const workbook = lib.utils.book_new();
    const now = new Date().toLocaleDateString('en-ET');
    const releaseDate = release ? new Date(release.date).toLocaleDateString('en-ET') : 'N/A';
    const coverage = release?.payment_for_indays || 0;

    // 1. Beneficiaries Summary
    console.log('[Export] Sheet 1...');
    const benData = (beneficiaries || []).map(b => ({
      ID: b.beneficiaryId,
      Name: b.fullname,
      Team: b.team?.name || '-',
      'Special Case': b.isSpecialCase || 'None',
      'Monthly Amount': Number(b.monthlyAllocation || 0),
      'Payment Method': b.paymentMethod,
      'Bank': b.bankInfo?.bank || '-',
      'Account': b.bankInfo?.account_no || '-',
      Status: b.isActive ? 'Active' : 'Inactive'
    }));
    lib.utils.book_append_sheet(workbook, lib.utils.json_to_sheet(benData), 'Beneficiaries Summary');

    // 2. Teams Summary
    console.log('[Export] Sheet 2...');
    const teamData = (teams || []).map(t => ({
      ID: t.teamId,
      Name: t.name,
      Head: t.headMember ? `${t.headMember.firstName} ${t.headMember.lastName}` : '-',
      Members: t.members?.length || 0,
      Beneficiaries: t.beneficiaryCount || 0,
      Status: t.isActive ? 'Active' : 'Inactive'
    }));
    lib.utils.book_append_sheet(workbook, lib.utils.json_to_sheet(teamData), 'Teams Summary');

    // 3. BANK SUMMARY (COMPLEX)
    console.log('[Export] Sheet 3...');
    const bankBens = (beneficiaries || []).filter(b => b.paymentMethod === 'bank');
    const specialCasesFound = [...new Set(bankBens.map(b => b.isSpecialCase).filter(Boolean))];
    
    const bankSheetAOA: any[][] = [];
    const headerText = `Charity Organization Report | Export: ${now} | Release: ${releaseDate} (${coverage} days) | Cases: ${specialCasesFound.join('/') || 'Regular'}`;
    
    bankSheetAOA.push([headerText]);
    bankSheetAOA.push([]); 
    bankSheetAOA.push(['No', 'Beneficiary Name', 'Bank', 'Bank Account', 'Amount', 'Team']);
    
    let totalAmount = 0;
    bankBens.forEach((b, idx) => {
      const amt = Number(b.monthlyAllocation || 0);
      bankSheetAOA.push([idx + 1, b.fullname, b.bankInfo?.bank || '-', b.bankInfo?.account_no || '-', amt, b.team?.name || '-']);
      totalAmount += amt;
    });

    bankSheetAOA.push(['', 'TOTAL', '', '', totalAmount, '']);
    bankSheetAOA.push([]); 
    bankSheetAOA.push(['Different Banks Analysis']);
    bankSheetAOA.push(['No', 'Bank', 'Count', 'Total Amount']);
    
    const bankGroups = bankBens.reduce((acc: any, b) => {
      const bankName = b.bankInfo?.bank || 'Unknown';
      if (!acc[bankName]) acc[bankName] = { count: 0, sum: 0 };
      acc[bankName].count++;
      acc[bankName].sum += Number(b.monthlyAllocation || 0);
      return acc;
    }, {});

    Object.keys(bankGroups).forEach((bank, idx) => {
      bankSheetAOA.push([idx + 1, bank, bankGroups[bank].count, bankGroups[bank].sum]);
    });
    bankSheetAOA.push(['', 'TOTAL', bankBens.length, totalAmount]);

    specialCasesFound.forEach(sc => {
      bankSheetAOA.push([]); 
      bankSheetAOA.push([`Analysis for ${sc} Beneficiaries`]);
      bankSheetAOA.push(['No', 'Beneficiary Name', 'Bank', 'Bank Account', 'Amount', 'Team']);
      const scBens = bankBens.filter(b => b.isSpecialCase === sc);
      let scTotal = 0;
      scBens.forEach((b, idx) => {
        const amt = Number(b.monthlyAllocation || 0);
        bankSheetAOA.push([idx + 1, b.fullname, b.bankInfo?.bank || '-', b.bankInfo?.account_no || '-', amt, b.team?.name || '-']);
        scTotal += amt;
      });
      bankSheetAOA.push(['', 'TOTAL', '', '', scTotal, '']);
    });

    const bankWorksheet = lib.utils.aoa_to_sheet(bankSheetAOA);
    lib.utils.book_append_sheet(workbook, bankWorksheet, 'Bank Summary');

    // 4. CASH SUMMARY
    console.log('[Export] Sheet 4...');
    const cashBens = (beneficiaries || []).filter(b => b.paymentMethod === 'cash');
    if (cashBens.length > 0) {
      const cashData = cashBens.map((b, idx) => ({
        No: idx + 1,
        Name: b.fullname,
        Amount: Number(b.monthlyAllocation || 0),
        Team: b.team?.name || '-',
        Phone: b.fullInfo?.contact?.phone || '-'
      }));
      lib.utils.book_append_sheet(workbook, lib.utils.json_to_sheet(cashData), 'Cash Summary');
    }

    console.log('[Export] Writing file...');
    lib.writeFile(workbook, `${fileName}_${new Date().getTime()}.xlsx`);
    console.log('[Export] Success');
  } catch (err) {
    console.error('[Export] Critical Failure:', err);
    throw err;
  }
};
