import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
const router = useRouter();
// UI state
const showSettings = ref(false);
const toasts = ref([]);
const loading = ref(false);
const biographyDate = ref('');
const printFiles = ref({
    includeDeclaration: true, includeTables: true, includeSupporting: true,
    includeAllowances: true, includeBasicInfo: true
});
const employees = ref([
    {
        id: 1, fullName: 'አሸናፊ ንጉሱ ብዙአለም', employeeId: 'SDT-0012',
        position: 'ኬሚስት', departmentName: 'ላቦራቶሪ',
        basicSalary: 12000, housingAllowance: 800, positionAllowance: 500,
        transportAllowance: 400, mobileAllowance: 200,
        hireDateEC: '25/04/2018', dateOfBirthEC: '12/10/1978',
        gender: 'ወንድ', maritalStatus: 'ያገባ', nationality: 'ኢትዮጵያዊ',
        nationalId: '0003600429',
        workEmail: 'ashenafi@superdoublet.com', personalEmail: 'ashenafi.k@gmail.com',
        phone: '0911689799', status: 'active', employmentType: 'full-time',
        workLocation: 'ዋና መሥሪያ ቤት, አዲስ አበባ', shiftType: 'day',
        profilePictureUrl: 'https://ui-avatars.com/api/?background=6366f1&color=fff&bold=true&size=120&name=አሸናፊ+ንጉሱ',
        birthPlace: { region: 'አዲስ አበባ', city: 'አዲስ አበባ', subcity: 'ቦሌ', district: 'ወረዳ 08' },
        currentAddress: { region: 'አዲስ አበባ', subcity: 'ንፋስ ስልክ ላፍቶ', kebele: '12', district: 'ወረዳ 12', poBox: '1234', houseNumber: '1052' },
        permanentAddress: { region: 'አዲስ አበባ', subcity: 'ንፋስ ስልክ ላፍቶ', kebele: '12', district: 'ወረዳ 12', poBox: '1234', houseNumber: '1052' },
        emergencyContact: { name: 'ሰላም አሸናፊ', relationship: 'ሚስት', phone: '0912345678', alternatePhone: '0923456789' },
        spouseInfo: { fullName: 'ሰላም አሸናፊ', profilePictureUrl: 'https://ui-avatars.com/api/?background=FF5733&color=fff&bold=true&size=80&name=ሰላም+አሸናፊ', tinNumber: '123456789', dateOfBirth: '15/05/1980', jobStatus: 'government', companyName: 'ጤና ሚኒስቴር', companyAddress: 'አዲስ አበባ, ካሳንቺስ' },
        children: [
            { name: 'ሳምራ አሸናፊ', profilePictureUrl: 'https://ui-avatars.com/api/?background=FFC300&color=fff&bold=true&size=60&name=ሳምራ', dateOfBirth: '10/03/2010', hasMedicalCondition: false, isAdopted: false },
            { name: 'ሳሙኤል አሸናፊ', profilePictureUrl: 'https://ui-avatars.com/api/?background=33FF57&color=fff&bold=true&size=60&name=ሳሙኤል', dateOfBirth: '22/07/2013', hasMedicalCondition: false, isAdopted: false }
        ],
        parentsInfo: { father: { fullName: 'ንጉሱ ብዙአለም', job: 'ጡረተኛ', monthlyIncome: 5000 }, mother: { fullName: 'አለም ዘሪሁን', job: 'የቤት እመቤት', monthlyIncome: 0 } },
        education: [
            { level: 'ዲግሪ', institutionName: 'ጂማ ዩንቨርስቲ', startDate: '2016', endDate: '2019', isCurrent: false, field: 'ኬሚስትሪ' },
            { level: 'ዲፕሎማ', institutionName: 'አዲስ አበባ ቴክኒክ ኮሌጅ', startDate: '2012', endDate: '2014', isCurrent: false, field: 'ላቦራቶሪ ቴክኖሎጂ' }
        ],
        workExperience: [
            { position: 'ከፍተኛ ኬሚስት', companyName: 'ኢትዮጵያ ፋርማሲ', startDate: '2015', endDate: '2018', monthlySalary: 8000, providentFundSubmitted: 'yes' }
        ],
        languageSkills: [
            { language: 'አማርኛ', proficiency: 'native' }, { language: 'እንግሊዝኛ', proficiency: 'fluent' }, { language: 'ኦሮምኛ', proficiency: 'intermediate' }
        ],
        otherSkills: 'ፕሮጀክት አስተዳደር፣ የላቦራቶሪ አስተዳደር፣ የጥራት ቁጥጥር',
        bankAccount: { bankName: 'አዋሽ ባንክ', accountNumber: '1234567890', accountHolderName: 'አሸናፊ ንጉሱ', branch: 'ቦሌ' }
    }
]);
const selectedEmployee = ref(null);
const employeeSearchTerm = ref('');
const filteredEmployees = ref([]);
const showDropdown = ref(false);
const totalAllowances = computed(() => {
    if (!selectedEmployee.value)
        return 0;
    const housing = parseFloat(selectedEmployee.value?.housingAllowance) || 0;
    const position = parseFloat(selectedEmployee.value?.positionAllowance) || 0;
    const transport = parseFloat(selectedEmployee.value?.transportAllowance) || 0;
    const mobile = parseFloat(selectedEmployee.value?.mobileAllowance) || 0;
    return housing + position + transport + mobile;
});
const grossPay = computed(() => {
    if (!selectedEmployee.value)
        return 0;
    const basic = parseFloat(selectedEmployee.value?.basicSalary) || 0;
    return basic + totalAllowances.value;
});
const formatCurrency = (value) => {
    if (value === null || value === undefined || value === "")
        return "—";
    const num = Number(value);
    if (isNaN(num))
        return "—";
    return `ብር ${num.toLocaleString()}`;
};
const formatDate = (date) => {
    if (!date)
        return "—";
    if (typeof date === 'string' && date.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        return date;
    }
    return date;
};
const getEmploymentTypeLabel = (type) => {
    const labels = { 'full-time': 'ሙሉ ጊዜ', 'part-time': 'የትርፍ ጊዜ', contract: 'ውል', intern: 'ተለማማጅ' };
    return labels[type] || type || '—';
};
const getProficiencyLabel = (proficiency) => {
    const labels = { native: 'የአፍ ቋንቋ', fluent: 'አቀላጥፎ', advanced: 'የላቀ', intermediate: 'መካከለኛ', basic: 'መሰረታዊ' };
    return labels[proficiency] || proficiency || '—';
};
const getProficiencyClass = (proficiency) => {
    const classes = { native: 'native', fluent: 'fluent', advanced: 'advanced', intermediate: 'intermediate', basic: 'basic' };
    return classes[proficiency] || '';
};
const getAvatarUrl = (name) => {
    if (!name)
        return "https://ui-avatars.com/api/?background=6366f1&color=fff&bold=true&size=120&name=User";
    return `https://ui-avatars.com/api/?background=6366f1&color=fff&bold=true&size=120&name=${encodeURIComponent(name)}`;
};
const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth)
        return "?";
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()))
        age--;
    return age;
};
const handleImageError = (e) => { e.target.src = getAvatarUrl(selectedEmployee.value?.fullName || "Employee"); };
const handleSpouseImageError = (e) => { e.target.src = getAvatarUrl(selectedEmployee.value?.spouseInfo?.fullName || "Spouse"); };
const handleChildImageError = (e) => { e.target.src = "https://ui-avatars.com/api/?background=FFC300&color=fff&bold=true&size=60&name=C"; };
const filterEmployees = () => {
    const term = employeeSearchTerm.value.toLowerCase().trim();
    if (!term) {
        filteredEmployees.value = [];
        return;
    }
    filteredEmployees.value = employees.value.filter(emp => emp.fullName.toLowerCase().includes(term) || emp.employeeId.toLowerCase().includes(term));
};
const selectEmployee = (emp) => {
    selectedEmployee.value = emp;
    employeeSearchTerm.value = emp.fullName;
    showDropdown.value = false;
    addToast(`ሰራተኛ ተመርጧል: ${emp.fullName}`, 'success');
};
const clearSelection = () => { selectedEmployee.value = null; employeeSearchTerm.value = ''; };
const handleBlur = () => { setTimeout(() => { showDropdown.value = false; }, 200); };
const goBack = () => router.push('/documents-letters');
const openSettings = () => (showSettings.value = true);
const applyData = () => {
    showSettings.value = false;
    addToast('የህይወት ታሪክ በተሳካ ሁኔታ ተዘምኗል!', 'success');
    printDocument();
};
// Print document
const printDocument = () => {
    const printWindow = window.open('', '');
    const contentHtml = document.querySelector('.employee-biography .detail-wrapper')?.innerHTML || '';
    printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title></title> <!-- Empty title removes 'about:blank' -->
        <style>
          /* Removes browser header/footer "7/31/26..." etc */
          @page { size: A4; margin: 0; }
          
          html, body { 
            width: 100%; 
            min-height: 100vh; 
            margin: 0; 
            padding: 0; 
            background: white; 
            font-family: "Nyala", "Abyssinica SIL", serif; 
            box-sizing: border-box;
          }
          * { 
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important; 
            box-sizing: border-box;
          }
          .right-float-buttons, .modal-overlay, .toast-container { display: none !important; }
          body * { visibility: hidden; }
          .employee-biography, .employee-biography * { visibility: visible; }
          .employee-biography { 
            position: absolute; 
            top: 0; 
            left: 0; 
            width: 100%; 
            padding: 0; 
            background: white; 
          }
          .detail-wrapper { 
            max-width: 100%; 
            margin: 0 auto; 
            padding: 15mm 15mm; /* Uses padding to push content away from edges */
          }
          .hero-section { background: white; padding: 24px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
          .hero-left { display: flex; align-items: center; gap: 32px; }
          .employee-avatar-large { width: 120px; height: 150px; flex-shrink: 0; border: 1px solid #ccc; border-radius: 4px; overflow: hidden; }
          .employee-avatar-large img { width: 100%; height: 100%; object-fit: cover; }
          .employee-basic h1 { font-size: 28px; font-weight: 700; color: #0f172a; margin: 0 0 10px 0; }
          .employee-tags { display: flex; gap: 12px; flex-wrap: wrap; }
          .tag { padding: 5px 14px; background: #f1f5f9; border-radius: 20px; font-size: 13px; font-weight: 500; color: #475569; }
          .stats-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
          .stat-card { background: white; padding: 14px 16px; display: flex; align-items: center; gap: 14px; border: 1px solid #e2e8f0; border-radius: 8px; }
          .stat-card-icon { width: 40px; height: 40px; background: #f1f5f9; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
          .stat-card-info { display: flex; flex-direction: column; gap: 2px; }
          .stat-label { font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
          .stat-number { font-size: 14px; font-weight: 600; color: #1e293b; }
          .content-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
          .left-column, .right-column { display: flex; flex-direction: column; gap: 20px; }
          .info-card { background: white; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; margin-bottom: 20px; }
          .card-header { display: flex; align-items: center; gap: 12px; padding: 14px 20px; background: #fafcfc; border-bottom: 1px solid #e9edf2; }
          .card-header-icon { width: 28px; height: 28px; background: #f1f5f9; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
          .card-header h3 { font-size: 16px; font-weight: 600; color: #0f172a; margin: 0; }
          .grid-list { padding: 16px 20px; display: grid; grid-template-columns: 1fr 1fr; column-gap: 20px; row-gap: 14px; }
          .grid-list.cols-auto { grid-template-columns: 1fr 1fr; }
          .grid-item { display: flex; flex-direction: column; gap: 4px; }
          .grid-item.full-width { grid-column: 1 / -1; }
          .g-label { font-size: 12px; color: #64748b; font-weight: 500; }
          .g-value { font-size: 14px; font-weight: 500; color: #1e293b; padding-bottom: 4px; border-bottom: 1px dashed #e2e8f0; }
          .g-sub-meta { font-size: 12px; color: #64748b; margin-top: 4px; }
          .g-label-bold { font-size: 13px; color: #1e293b; font-weight: 700; }
          .g-value-bold { font-size: 15px; font-weight: 700; padding-bottom: 4px; }
          .highlight-orange { color: #f59e0b; }
          .highlight-green { color: #10b981; }
          .highlight-total { margin-top: 6px; padding-top: 6px; border-top: 1px solid #e2e8f0; }
          .highlight-gross { margin-top: 4px; padding-top: 10px; border-top: 2px solid #e2e8f0; }
          
          .spouse-name-display { display: flex; align-items: center; gap: 12px; }
          .spouse-avatar-small { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 1px solid #e2e8f0; }
          .g-value.big-name { font-size: 16px; font-weight: 600; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; flex: 1; }
          
          .children-grid-list { padding: 16px 20px; display: grid; grid-template-columns: 1fr; gap: 14px; }
          .child-grid-item { display: flex; gap: 14px; background: #f8fafc; border-radius: 8px; padding: 12px; border: 1px solid #eef2ff; }
          .child-grid-avatar { width: 50px; height: 50px; flex-shrink: 0; border-radius: 50%; overflow: hidden; background: #f1f5f9; }
          .child-grid-avatar img { width: 100%; height: 100%; object-fit: cover; }
          .child-grid-info { flex: 1; display: flex; flex-direction: column; gap: 4px; }
          .child-grid-name { font-size: 15px; font-weight: 600; color: #1e293b; }
          .child-grid-age { font-size: 12px; color: #10b981; background: #d1fae5; padding: 2px 10px; border-radius: 20px; margin-left: 8px; }
          .child-grid-detail { font-size: 13px; color: #475569; display: flex; align-items: baseline; gap: 6px; flex-wrap: wrap; }
          .child-grid-detail span { font-weight: 500; color: #64748b; }
          
          .parent-grid-item .g-value { border-bottom: none; padding-bottom: 0; }

          /* NEW PAPER TABLE STYLES */
          .paper-grid-table { width: 100%; border-collapse: collapse; font-size: 13px; text-align: center; }
          .paper-grid-table th, .paper-grid-table td { border: 1px solid #000; padding: 8px 6px; }
          .paper-grid-table th { background: #f8fafc; font-weight: bold; }
          .paper-grid-table.complex-header th { vertical-align: middle; }
          .paper-grid-table .lang-main-header { width: 15%; }
          .center-text { text-align: center; }
          
          .other-skills-section { padding: 12px 20px; border-top: 1px solid #eef2ff; font-size: 13px; color: #475569; }

          /* Company Header Print CSS */
          .company-header { text-align: center; margin-bottom: 20px; border-bottom: 2px ; padding-bottom: 15px; }
          .company-logo-text { font-size: 20px; font-weight: bold; color: #000; }
          .company-divider { border-top: 1px solid #ccc; margin: 10px 0; }
          .company-sub-text { font-size: 16px; text-decoration: underline; }

          /* FINAL SECTION - PAPER FORM STYLES - PRINT OPTIMIZED */
          .final-section { max-width: 100%; margin: 20px auto 0; display: flex; flex-direction: column; gap: 30px; font-family: 'Nyala', 'Abyssinica SIL', serif; page-break-before: always; }
          .declaration-section { padding: 0 10px; }
          .section-title { text-decoration: underline; text-underline-offset: 4px; font-weight: bold; font-size: 18px; margin-bottom: 25px; }
          .check-row-block { display: flex; flex-direction: column; gap: 18px; }
          .check-row { display: flex; flex-wrap: wrap; align-items: center; gap: 10px 30px; font-size: 16px; }
          .check-opt { display: flex; align-items: center; gap: 8px; }
          .q-label { font-size: 16px; }
          .square-box { display: inline-flex; align-items: center; justify-content: center; width: 35px; height: 30px; border: 1.5px solid #000; font-weight: bold; font-size: 18px; }
          .square-box.checked { color: #000; }
          .input-line-large { display: inline-block; border-bottom: 1px solid #000; flex: 1; min-width: 150px; height: 1px; margin-top: 5px; }
          
          .declaration-block-border { border: 2px solid #000; padding: 20px 25px; background: white; border-radius: 4px; }
          .declaration-text { font-size: 15px; line-height: 1.8; margin-bottom: 30px; text-align: justify; }
          .sig-line-large { display: flex; align-items: baseline; gap: 15px; margin-bottom: 20px; font-size: 16px; }
          .split-sig { justify-content: space-between; padding: 0 50px; }
          .sig-label { font-weight: bold; }
          .sig-underline-large { display: inline-block; border-bottom: 1px solid #000; min-width: 200px; flex: 1; height: 20px; }
          
          .admin-block-border { border: 2px solid #000; background: white; border-radius: 4px; overflow: hidden; }
          .admin-header-bar { background: #9e9256; color: #000; font-weight: bold; font-size: 18px; padding: 8px 15px; border-bottom: 2px solid #000; }
          .admin-body { padding: 25px 30px; }
          .admin-date-row { display: flex; align-items: center; gap: 12px; margin-bottom: 25px; font-size: 16px; flex-wrap: wrap; }
          .admin-date-parts { display: flex; align-items: center; gap: 6px; }
          .admin-date-underlined { display: inline-block; border-bottom: 1px solid #000; padding: 0 4px; min-width: 25px; text-align: center; }
          .admin-label-wide { font-weight: bold; }
          .admin-fields-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 30px; margin-bottom: 35px; }
          .admin-field-row { display: flex; flex-direction: column; gap: 5px; }
          .admin-label { font-weight: bold; font-size: 15px; }
          .admin-field-under { display: inline-block; border-bottom: 1px solid #000; padding: 0 5px; width: 100%; font-weight: 600; font-size: 15px; }
          .admin-sig-block { display: flex; flex-direction: column; gap: 20px; padding-left: 200px; }
          .admin-sig-row { display: flex; align-items: baseline; gap: 15px; font-size: 15px; }
          .admin-field-long { display: inline-block; border-bottom: 1px solid #000; min-width: 200px; width: 200px; height: 20px; }

          @media print {
            .right-float-buttons, .modal-overlay, .toast-container { display: none !important; }
          }
        </style>
      </head>
      <body>
        <div class="employee-biography">
          <div class="detail-wrapper">
            ${contentHtml}
          </div>
        </div>
        <script>
          window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 500); };
        <\/script>
      </body>
    </html>
  `);
    printWindow.document.close();
    addToast('ወደ አታሚ ተልኳል!', 'success');
};
const addToast = (message, type) => {
    const id = Date.now();
    toasts.value.push({ id, message, type });
    setTimeout(() => (toasts.value = toasts.value.filter((t) => t.id !== id)), 3000);
};
onMounted(() => {
    if (employees.value.length > 0) {
        selectedEmployee.value = employees.value[0];
    }
});
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['float-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['back-float']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-float']} */ ;
/** @type {__VLS_StyleScopedClasses['print-float']} */ ;
/** @type {__VLS_StyleScopedClasses['employee-avatar-large']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-card-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['content-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['left-column']} */ ;
/** @type {__VLS_StyleScopedClasses['content-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['equal-height']} */ ;
/** @type {__VLS_StyleScopedClasses['right-column']} */ ;
/** @type {__VLS_StyleScopedClasses['card-header-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['card-header']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-list']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-item']} */ ;
/** @type {__VLS_StyleScopedClasses['g-value']} */ ;
/** @type {__VLS_StyleScopedClasses['child-grid-avatar']} */ ;
/** @type {__VLS_StyleScopedClasses['child-grid-detail']} */ ;
/** @type {__VLS_StyleScopedClasses['g-value']} */ ;
/** @type {__VLS_StyleScopedClasses['paper-grid-table']} */ ;
/** @type {__VLS_StyleScopedClasses['paper-grid-table']} */ ;
/** @type {__VLS_StyleScopedClasses['paper-grid-table']} */ ;
/** @type {__VLS_StyleScopedClasses['paper-grid-table']} */ ;
/** @type {__VLS_StyleScopedClasses['paper-grid-table']} */ ;
/** @type {__VLS_StyleScopedClasses['square-box']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
/** @type {__VLS_StyleScopedClasses['field-group']} */ ;
/** @type {__VLS_StyleScopedClasses['field-group']} */ ;
/** @type {__VLS_StyleScopedClasses['dropdown-item']} */ ;
/** @type {__VLS_StyleScopedClasses['file-check-item']} */ ;
/** @type {__VLS_StyleScopedClasses['file-check-item']} */ ;
/** @type {__VLS_StyleScopedClasses['toast']} */ ;
/** @type {__VLS_StyleScopedClasses['stats-cards']} */ ;
/** @type {__VLS_StyleScopedClasses['content-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-list']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-list']} */ ;
/** @type {__VLS_StyleScopedClasses['cols-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-fields-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-sig-block']} */ ;
/** @type {__VLS_StyleScopedClasses['employee-biography']} */ ;
/** @type {__VLS_StyleScopedClasses['right-float-buttons']} */ ;
/** @type {__VLS_StyleScopedClasses['float-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['float-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['hero-section']} */ ;
/** @type {__VLS_StyleScopedClasses['hero-left']} */ ;
/** @type {__VLS_StyleScopedClasses['employee-tags']} */ ;
/** @type {__VLS_StyleScopedClasses['employee-avatar-large']} */ ;
/** @type {__VLS_StyleScopedClasses['stats-cards']} */ ;
/** @type {__VLS_StyleScopedClasses['right-float-buttons']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
/** @type {__VLS_StyleScopedClasses['toast-container']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "employee-biography" },
});
/** @type {__VLS_StyleScopedClasses['employee-biography']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "right-float-buttons" },
});
/** @type {__VLS_StyleScopedClasses['right-float-buttons']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.goBack) },
    ...{ class: "float-btn back-float" },
    title: "Back",
});
/** @type {__VLS_StyleScopedClasses['float-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['back-float']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    'stroke-width': "2",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.path)({
    d: "M19 12H5M12 19l-7-7 7-7",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.openSettings) },
    ...{ class: "float-btn settings-float" },
    title: "Settings & Print Selection",
});
/** @type {__VLS_StyleScopedClasses['float-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-float']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.path)({
    d: "M12 6v6m0 0v6m0-6h6m-6 0H6",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.printDocument) },
    ...{ class: "float-btn print-float" },
    title: "Print",
});
/** @type {__VLS_StyleScopedClasses['float-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['print-float']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.path)({
    d: "M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4H7v4a2 2 0 002 2z",
});
if (__VLS_ctx.loading) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "loading-state" },
    });
    /** @type {__VLS_StyleScopedClasses['loading-state']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "loading-spinner" },
    });
    /** @type {__VLS_StyleScopedClasses['loading-spinner']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
}
else if (__VLS_ctx.selectedEmployee) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "detail-wrapper" },
    });
    /** @type {__VLS_StyleScopedClasses['detail-wrapper']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "company-header" },
    });
    /** @type {__VLS_StyleScopedClasses['company-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "company-logo-text" },
    });
    /** @type {__VLS_StyleScopedClasses['company-logo-text']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "company-divider" },
    });
    /** @type {__VLS_StyleScopedClasses['company-divider']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "company-sub-text" },
    });
    /** @type {__VLS_StyleScopedClasses['company-sub-text']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "hero-section" },
    });
    /** @type {__VLS_StyleScopedClasses['hero-section']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "hero-left" },
    });
    /** @type {__VLS_StyleScopedClasses['hero-left']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "employee-basic" },
    });
    /** @type {__VLS_StyleScopedClasses['employee-basic']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({});
    (__VLS_ctx.selectedEmployee.fullName);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "employee-tags" },
    });
    /** @type {__VLS_StyleScopedClasses['employee-tags']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "tag" },
    });
    /** @type {__VLS_StyleScopedClasses['tag']} */ ;
    (__VLS_ctx.selectedEmployee.position || 'የለም');
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "tag" },
    });
    /** @type {__VLS_StyleScopedClasses['tag']} */ ;
    (__VLS_ctx.selectedEmployee.departmentName || 'የለም');
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "employee-avatar-large" },
    });
    /** @type {__VLS_StyleScopedClasses['employee-avatar-large']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
        ...{ onError: (__VLS_ctx.handleImageError) },
        src: (__VLS_ctx.selectedEmployee.profilePictureUrl),
        alt: (__VLS_ctx.selectedEmployee.fullName),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stats-cards" },
    });
    /** @type {__VLS_StyleScopedClasses['stats-cards']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-card" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-card-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-card-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.rect)({
        x: "2",
        y: "7",
        width: "20",
        height: "14",
        rx: "2",
        ry: "2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-card-info" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-card-info']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "stat-label" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "stat-number" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-number']} */ ;
    (__VLS_ctx.selectedEmployee.departmentName || 'የለም');
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-card" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-card-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-card-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.circle)({
        cx: "12",
        cy: "12",
        r: "10",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.polyline)({
        points: "12 6 12 12 16 14",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-card-info" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-card-info']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "stat-label" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "stat-number" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-number']} */ ;
    (__VLS_ctx.formatDate(__VLS_ctx.selectedEmployee.hireDateEC));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-card" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-card-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-card-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-card-info" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-card-info']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "stat-label" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "stat-number" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-number']} */ ;
    (__VLS_ctx.getEmploymentTypeLabel(__VLS_ctx.selectedEmployee.employmentType));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-card" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-card-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-card-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M12 8c-3.31 0-6 2.69-6 6 0 3.31 2.69 6 6 6 3.31 0 6-2.69 6-6 0-3.31-2.69-6-6-6z",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M12 2v2M22 12h-2M4 12H2M12 22v2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "stat-card-info" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-card-info']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "stat-label" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "stat-number" },
    });
    /** @type {__VLS_StyleScopedClasses['stat-number']} */ ;
    (__VLS_ctx.formatCurrency(__VLS_ctx.selectedEmployee.basicSalary));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "content-grid equal-height" },
    });
    /** @type {__VLS_StyleScopedClasses['content-grid']} */ ;
    /** @type {__VLS_StyleScopedClasses['equal-height']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "left-column" },
    });
    /** @type {__VLS_StyleScopedClasses['left-column']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-card" },
    });
    /** @type {__VLS_StyleScopedClasses['info-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card-header" },
    });
    /** @type {__VLS_StyleScopedClasses['card-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card-header-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['card-header-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.circle)({
        cx: "12",
        cy: "7",
        r: "4",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "grid-list" },
    });
    /** @type {__VLS_StyleScopedClasses['grid-list']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "grid-item" },
    });
    /** @type {__VLS_StyleScopedClasses['grid-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "g-label" },
    });
    /** @type {__VLS_StyleScopedClasses['g-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "g-value" },
    });
    /** @type {__VLS_StyleScopedClasses['g-value']} */ ;
    (__VLS_ctx.selectedEmployee.fullName);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "grid-item" },
    });
    /** @type {__VLS_StyleScopedClasses['grid-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "g-label" },
    });
    /** @type {__VLS_StyleScopedClasses['g-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "g-value" },
    });
    /** @type {__VLS_StyleScopedClasses['g-value']} */ ;
    (__VLS_ctx.selectedEmployee.nationalId || '—');
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "grid-item" },
    });
    /** @type {__VLS_StyleScopedClasses['grid-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "g-label" },
    });
    /** @type {__VLS_StyleScopedClasses['g-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "g-value" },
    });
    /** @type {__VLS_StyleScopedClasses['g-value']} */ ;
    (__VLS_ctx.selectedEmployee.workEmail || __VLS_ctx.selectedEmployee.email || '—');
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "grid-item" },
    });
    /** @type {__VLS_StyleScopedClasses['grid-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "g-label" },
    });
    /** @type {__VLS_StyleScopedClasses['g-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "g-value" },
    });
    /** @type {__VLS_StyleScopedClasses['g-value']} */ ;
    (__VLS_ctx.selectedEmployee.personalEmail || '—');
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "grid-item" },
    });
    /** @type {__VLS_StyleScopedClasses['grid-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "g-label" },
    });
    /** @type {__VLS_StyleScopedClasses['g-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "g-value" },
    });
    /** @type {__VLS_StyleScopedClasses['g-value']} */ ;
    (__VLS_ctx.selectedEmployee.phone || __VLS_ctx.selectedEmployee.phoneNumber || '—');
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "grid-item" },
    });
    /** @type {__VLS_StyleScopedClasses['grid-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "g-label" },
    });
    /** @type {__VLS_StyleScopedClasses['g-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "g-value" },
    });
    /** @type {__VLS_StyleScopedClasses['g-value']} */ ;
    (__VLS_ctx.formatDate(__VLS_ctx.selectedEmployee.dateOfBirthEC) || '—');
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "grid-item" },
    });
    /** @type {__VLS_StyleScopedClasses['grid-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "g-label" },
    });
    /** @type {__VLS_StyleScopedClasses['g-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "g-value" },
    });
    /** @type {__VLS_StyleScopedClasses['g-value']} */ ;
    (__VLS_ctx.selectedEmployee.gender || '—');
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "grid-item" },
    });
    /** @type {__VLS_StyleScopedClasses['grid-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "g-label" },
    });
    /** @type {__VLS_StyleScopedClasses['g-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "g-value" },
    });
    /** @type {__VLS_StyleScopedClasses['g-value']} */ ;
    (__VLS_ctx.selectedEmployee.maritalStatus || '—');
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "grid-item full-width" },
    });
    /** @type {__VLS_StyleScopedClasses['grid-item']} */ ;
    /** @type {__VLS_StyleScopedClasses['full-width']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "g-label" },
    });
    /** @type {__VLS_StyleScopedClasses['g-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "g-value" },
    });
    /** @type {__VLS_StyleScopedClasses['g-value']} */ ;
    (__VLS_ctx.selectedEmployee.nationality || '—');
    if (__VLS_ctx.selectedEmployee.birthPlace && Object.keys(__VLS_ctx.selectedEmployee.birthPlace).length) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "info-card" },
        });
        /** @type {__VLS_StyleScopedClasses['info-card']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "card-header" },
        });
        /** @type {__VLS_StyleScopedClasses['card-header']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "card-header-icon" },
        });
        /** @type {__VLS_StyleScopedClasses['card-header-icon']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            'stroke-width': "2",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
            d: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.circle)({
            cx: "12",
            cy: "10",
            r: "3",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "grid-list" },
        });
        /** @type {__VLS_StyleScopedClasses['grid-list']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "grid-item" },
        });
        /** @type {__VLS_StyleScopedClasses['grid-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "g-label" },
        });
        /** @type {__VLS_StyleScopedClasses['g-label']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "g-value" },
        });
        /** @type {__VLS_StyleScopedClasses['g-value']} */ ;
        (__VLS_ctx.selectedEmployee.birthPlace.region || '—');
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "grid-item" },
        });
        /** @type {__VLS_StyleScopedClasses['grid-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "g-label" },
        });
        /** @type {__VLS_StyleScopedClasses['g-label']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "g-value" },
        });
        /** @type {__VLS_StyleScopedClasses['g-value']} */ ;
        (__VLS_ctx.selectedEmployee.birthPlace.city || '—');
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "grid-item" },
        });
        /** @type {__VLS_StyleScopedClasses['grid-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "g-label" },
        });
        /** @type {__VLS_StyleScopedClasses['g-label']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "g-value" },
        });
        /** @type {__VLS_StyleScopedClasses['g-value']} */ ;
        (__VLS_ctx.selectedEmployee.birthPlace.subcity || '—');
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "grid-item" },
        });
        /** @type {__VLS_StyleScopedClasses['grid-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "g-label" },
        });
        /** @type {__VLS_StyleScopedClasses['g-label']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "g-value" },
        });
        /** @type {__VLS_StyleScopedClasses['g-value']} */ ;
        (__VLS_ctx.selectedEmployee.birthPlace.district || '—');
    }
    if (__VLS_ctx.selectedEmployee.currentAddress && Object.keys(__VLS_ctx.selectedEmployee.currentAddress).length) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "info-card" },
        });
        /** @type {__VLS_StyleScopedClasses['info-card']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "card-header" },
        });
        /** @type {__VLS_StyleScopedClasses['card-header']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "card-header-icon" },
        });
        /** @type {__VLS_StyleScopedClasses['card-header-icon']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            'stroke-width': "2",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
            d: "M12 2c-4.42 0-8 3.58-8 8 0 5.5 8 12 8 12s8-6.5 8-12c0-4.42-3.58-8-8-8z",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.circle)({
            cx: "12",
            cy: "10",
            r: "3",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "grid-list" },
        });
        /** @type {__VLS_StyleScopedClasses['grid-list']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "grid-item" },
        });
        /** @type {__VLS_StyleScopedClasses['grid-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "g-label" },
        });
        /** @type {__VLS_StyleScopedClasses['g-label']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "g-value" },
        });
        /** @type {__VLS_StyleScopedClasses['g-value']} */ ;
        (__VLS_ctx.selectedEmployee.currentAddress.region || '—');
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "grid-item" },
        });
        /** @type {__VLS_StyleScopedClasses['grid-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "g-label" },
        });
        /** @type {__VLS_StyleScopedClasses['g-label']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "g-value" },
        });
        /** @type {__VLS_StyleScopedClasses['g-value']} */ ;
        (__VLS_ctx.selectedEmployee.currentAddress.subcity || '—');
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "grid-item" },
        });
        /** @type {__VLS_StyleScopedClasses['grid-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "g-label" },
        });
        /** @type {__VLS_StyleScopedClasses['g-label']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "g-value" },
        });
        /** @type {__VLS_StyleScopedClasses['g-value']} */ ;
        (__VLS_ctx.selectedEmployee.currentAddress.kebele || '—');
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "grid-item" },
        });
        /** @type {__VLS_StyleScopedClasses['grid-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "g-label" },
        });
        /** @type {__VLS_StyleScopedClasses['g-label']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "g-value" },
        });
        /** @type {__VLS_StyleScopedClasses['g-value']} */ ;
        (__VLS_ctx.selectedEmployee.currentAddress.district || '—');
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "grid-item" },
        });
        /** @type {__VLS_StyleScopedClasses['grid-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "g-label" },
        });
        /** @type {__VLS_StyleScopedClasses['g-label']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "g-value" },
        });
        /** @type {__VLS_StyleScopedClasses['g-value']} */ ;
        (__VLS_ctx.selectedEmployee.currentAddress.poBox || '—');
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "grid-item" },
        });
        /** @type {__VLS_StyleScopedClasses['grid-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "g-label" },
        });
        /** @type {__VLS_StyleScopedClasses['g-label']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "g-value" },
        });
        /** @type {__VLS_StyleScopedClasses['g-value']} */ ;
        (__VLS_ctx.selectedEmployee.currentAddress.houseNumber || '—');
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "right-column" },
    });
    /** @type {__VLS_StyleScopedClasses['right-column']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-card" },
    });
    /** @type {__VLS_StyleScopedClasses['info-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card-header" },
    });
    /** @type {__VLS_StyleScopedClasses['card-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card-header-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['card-header-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.rect)({
        x: "2",
        y: "7",
        width: "20",
        height: "14",
        rx: "2",
        ry: "2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "grid-list" },
    });
    /** @type {__VLS_StyleScopedClasses['grid-list']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "grid-item" },
    });
    /** @type {__VLS_StyleScopedClasses['grid-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "g-label" },
    });
    /** @type {__VLS_StyleScopedClasses['g-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "g-value" },
    });
    /** @type {__VLS_StyleScopedClasses['g-value']} */ ;
    (__VLS_ctx.selectedEmployee.departmentName || 'የለም');
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "grid-item" },
    });
    /** @type {__VLS_StyleScopedClasses['grid-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "g-label" },
    });
    /** @type {__VLS_StyleScopedClasses['g-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "g-value" },
    });
    /** @type {__VLS_StyleScopedClasses['g-value']} */ ;
    (__VLS_ctx.selectedEmployee.position || 'የለም');
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "grid-item" },
    });
    /** @type {__VLS_StyleScopedClasses['grid-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "g-label" },
    });
    /** @type {__VLS_StyleScopedClasses['g-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "g-value" },
    });
    /** @type {__VLS_StyleScopedClasses['g-value']} */ ;
    (__VLS_ctx.getEmploymentTypeLabel(__VLS_ctx.selectedEmployee.employmentType));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "grid-item" },
    });
    /** @type {__VLS_StyleScopedClasses['grid-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "g-label" },
    });
    /** @type {__VLS_StyleScopedClasses['g-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "g-value" },
    });
    /** @type {__VLS_StyleScopedClasses['g-value']} */ ;
    (__VLS_ctx.formatDate(__VLS_ctx.selectedEmployee.hireDateEC));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "grid-item" },
    });
    /** @type {__VLS_StyleScopedClasses['grid-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "g-label" },
    });
    /** @type {__VLS_StyleScopedClasses['g-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "g-value" },
    });
    /** @type {__VLS_StyleScopedClasses['g-value']} */ ;
    (__VLS_ctx.selectedEmployee.managerName || '—');
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "grid-item" },
    });
    /** @type {__VLS_StyleScopedClasses['grid-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "g-label" },
    });
    /** @type {__VLS_StyleScopedClasses['g-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "g-value" },
    });
    /** @type {__VLS_StyleScopedClasses['g-value']} */ ;
    (__VLS_ctx.selectedEmployee.workLocation || '—');
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "grid-item full-width" },
    });
    /** @type {__VLS_StyleScopedClasses['grid-item']} */ ;
    /** @type {__VLS_StyleScopedClasses['full-width']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "g-label" },
    });
    /** @type {__VLS_StyleScopedClasses['g-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "g-value" },
    });
    /** @type {__VLS_StyleScopedClasses['g-value']} */ ;
    (__VLS_ctx.selectedEmployee.shiftType || '—');
    if (__VLS_ctx.selectedEmployee.permanentAddress && Object.keys(__VLS_ctx.selectedEmployee.permanentAddress).length) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "info-card" },
        });
        /** @type {__VLS_StyleScopedClasses['info-card']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "card-header" },
        });
        /** @type {__VLS_StyleScopedClasses['card-header']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "card-header-icon" },
        });
        /** @type {__VLS_StyleScopedClasses['card-header-icon']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            'stroke-width': "2",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
            d: "M12 2c-4.42 0-8 3.58-8 8 0 5.5 8 12 8 12s8-6.5 8-12c0-4.42-3.58-8-8-8z",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.circle)({
            cx: "12",
            cy: "10",
            r: "3",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "grid-list" },
        });
        /** @type {__VLS_StyleScopedClasses['grid-list']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "grid-item" },
        });
        /** @type {__VLS_StyleScopedClasses['grid-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "g-label" },
        });
        /** @type {__VLS_StyleScopedClasses['g-label']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "g-value" },
        });
        /** @type {__VLS_StyleScopedClasses['g-value']} */ ;
        (__VLS_ctx.selectedEmployee.permanentAddress.region || '—');
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "grid-item" },
        });
        /** @type {__VLS_StyleScopedClasses['grid-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "g-label" },
        });
        /** @type {__VLS_StyleScopedClasses['g-label']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "g-value" },
        });
        /** @type {__VLS_StyleScopedClasses['g-value']} */ ;
        (__VLS_ctx.selectedEmployee.permanentAddress.subcity || '—');
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "grid-item" },
        });
        /** @type {__VLS_StyleScopedClasses['grid-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "g-label" },
        });
        /** @type {__VLS_StyleScopedClasses['g-label']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "g-value" },
        });
        /** @type {__VLS_StyleScopedClasses['g-value']} */ ;
        (__VLS_ctx.selectedEmployee.permanentAddress.kebele || '—');
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "grid-item" },
        });
        /** @type {__VLS_StyleScopedClasses['grid-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "g-label" },
        });
        /** @type {__VLS_StyleScopedClasses['g-label']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "g-value" },
        });
        /** @type {__VLS_StyleScopedClasses['g-value']} */ ;
        (__VLS_ctx.selectedEmployee.permanentAddress.district || '—');
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "grid-item" },
        });
        /** @type {__VLS_StyleScopedClasses['grid-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "g-label" },
        });
        /** @type {__VLS_StyleScopedClasses['g-label']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "g-value" },
        });
        /** @type {__VLS_StyleScopedClasses['g-value']} */ ;
        (__VLS_ctx.selectedEmployee.permanentAddress.poBox || '—');
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "grid-item" },
        });
        /** @type {__VLS_StyleScopedClasses['grid-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "g-label" },
        });
        /** @type {__VLS_StyleScopedClasses['g-label']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "g-value" },
        });
        /** @type {__VLS_StyleScopedClasses['g-value']} */ ;
        (__VLS_ctx.selectedEmployee.permanentAddress.houseNumber || '—');
    }
    if (__VLS_ctx.selectedEmployee.emergencyContact && Object.keys(__VLS_ctx.selectedEmployee.emergencyContact).length) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "info-card emergency-card" },
        });
        /** @type {__VLS_StyleScopedClasses['info-card']} */ ;
        /** @type {__VLS_StyleScopedClasses['emergency-card']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "card-header" },
        });
        /** @type {__VLS_StyleScopedClasses['card-header']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "card-header-icon" },
        });
        /** @type {__VLS_StyleScopedClasses['card-header-icon']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            'stroke-width': "2",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
            d: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
            d: "M13.73 21a2 2 0 0 1-3.46 0",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "grid-list" },
        });
        /** @type {__VLS_StyleScopedClasses['grid-list']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "grid-item" },
        });
        /** @type {__VLS_StyleScopedClasses['grid-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "g-label" },
        });
        /** @type {__VLS_StyleScopedClasses['g-label']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "g-value" },
        });
        /** @type {__VLS_StyleScopedClasses['g-value']} */ ;
        (__VLS_ctx.selectedEmployee.emergencyContact.name || '—');
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "grid-item" },
        });
        /** @type {__VLS_StyleScopedClasses['grid-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "g-label" },
        });
        /** @type {__VLS_StyleScopedClasses['g-label']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "g-value" },
        });
        /** @type {__VLS_StyleScopedClasses['g-value']} */ ;
        (__VLS_ctx.selectedEmployee.emergencyContact.relationship || '—');
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "grid-item" },
        });
        /** @type {__VLS_StyleScopedClasses['grid-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "g-label" },
        });
        /** @type {__VLS_StyleScopedClasses['g-label']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "g-value" },
        });
        /** @type {__VLS_StyleScopedClasses['g-value']} */ ;
        (__VLS_ctx.selectedEmployee.emergencyContact.phone || '—');
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "grid-item" },
        });
        /** @type {__VLS_StyleScopedClasses['grid-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "g-label" },
        });
        /** @type {__VLS_StyleScopedClasses['g-label']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "g-value" },
        });
        /** @type {__VLS_StyleScopedClasses['g-value']} */ ;
        (__VLS_ctx.selectedEmployee.emergencyContact.alternatePhone || '—');
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "content-grid equal-height" },
    });
    /** @type {__VLS_StyleScopedClasses['content-grid']} */ ;
    /** @type {__VLS_StyleScopedClasses['equal-height']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "left-column" },
    });
    /** @type {__VLS_StyleScopedClasses['left-column']} */ ;
    if (__VLS_ctx.selectedEmployee.spouseInfo && Object.keys(__VLS_ctx.selectedEmployee.spouseInfo).length) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "info-card" },
        });
        /** @type {__VLS_StyleScopedClasses['info-card']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "card-header" },
        });
        /** @type {__VLS_StyleScopedClasses['card-header']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "card-header-icon" },
        });
        /** @type {__VLS_StyleScopedClasses['card-header-icon']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            'stroke-width': "2",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
            d: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.circle)({
            cx: "12",
            cy: "7",
            r: "4",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "grid-list cols-auto" },
        });
        /** @type {__VLS_StyleScopedClasses['grid-list']} */ ;
        /** @type {__VLS_StyleScopedClasses['cols-auto']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "grid-item full-width spouse-name-item" },
        });
        /** @type {__VLS_StyleScopedClasses['grid-item']} */ ;
        /** @type {__VLS_StyleScopedClasses['full-width']} */ ;
        /** @type {__VLS_StyleScopedClasses['spouse-name-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "g-label" },
        });
        /** @type {__VLS_StyleScopedClasses['g-label']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "spouse-name-display" },
        });
        /** @type {__VLS_StyleScopedClasses['spouse-name-display']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
            ...{ onError: (__VLS_ctx.handleSpouseImageError) },
            src: (__VLS_ctx.selectedEmployee.spouseInfo.profilePictureUrl),
            alt: "Spouse",
            ...{ class: "spouse-avatar-small" },
        });
        /** @type {__VLS_StyleScopedClasses['spouse-avatar-small']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "g-value big-name" },
        });
        /** @type {__VLS_StyleScopedClasses['g-value']} */ ;
        /** @type {__VLS_StyleScopedClasses['big-name']} */ ;
        (__VLS_ctx.selectedEmployee.spouseInfo.fullName || '—');
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "grid-item" },
        });
        /** @type {__VLS_StyleScopedClasses['grid-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "g-label" },
        });
        /** @type {__VLS_StyleScopedClasses['g-label']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "g-value" },
        });
        /** @type {__VLS_StyleScopedClasses['g-value']} */ ;
        (__VLS_ctx.selectedEmployee.spouseInfo.tinNumber || '—');
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "grid-item" },
        });
        /** @type {__VLS_StyleScopedClasses['grid-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "g-label" },
        });
        /** @type {__VLS_StyleScopedClasses['g-label']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "g-value" },
        });
        /** @type {__VLS_StyleScopedClasses['g-value']} */ ;
        (__VLS_ctx.formatDate(__VLS_ctx.selectedEmployee.spouseInfo.dateOfBirth) || '—');
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "grid-item" },
        });
        /** @type {__VLS_StyleScopedClasses['grid-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "g-label" },
        });
        /** @type {__VLS_StyleScopedClasses['g-label']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "g-value" },
        });
        /** @type {__VLS_StyleScopedClasses['g-value']} */ ;
        (__VLS_ctx.selectedEmployee.spouseInfo.jobStatus || '—');
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "grid-item" },
        });
        /** @type {__VLS_StyleScopedClasses['grid-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "g-label" },
        });
        /** @type {__VLS_StyleScopedClasses['g-label']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "g-value" },
        });
        /** @type {__VLS_StyleScopedClasses['g-value']} */ ;
        (__VLS_ctx.selectedEmployee.spouseInfo.companyName || '—');
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "grid-item full-width" },
        });
        /** @type {__VLS_StyleScopedClasses['grid-item']} */ ;
        /** @type {__VLS_StyleScopedClasses['full-width']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "g-label" },
        });
        /** @type {__VLS_StyleScopedClasses['g-label']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "g-value" },
        });
        /** @type {__VLS_StyleScopedClasses['g-value']} */ ;
        (__VLS_ctx.selectedEmployee.spouseInfo.companyAddress || '—');
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "right-column" },
    });
    /** @type {__VLS_StyleScopedClasses['right-column']} */ ;
    if (__VLS_ctx.selectedEmployee.children && __VLS_ctx.selectedEmployee.children.length) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "info-card" },
        });
        /** @type {__VLS_StyleScopedClasses['info-card']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "card-header" },
        });
        /** @type {__VLS_StyleScopedClasses['card-header']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "card-header-icon" },
        });
        /** @type {__VLS_StyleScopedClasses['card-header-icon']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            'stroke-width': "2",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
            d: "M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
        (__VLS_ctx.selectedEmployee.children.length);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "children-grid-list" },
        });
        /** @type {__VLS_StyleScopedClasses['children-grid-list']} */ ;
        for (const [child, idx] of __VLS_vFor((__VLS_ctx.selectedEmployee.children))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                key: (idx),
                ...{ class: "child-grid-item" },
            });
            /** @type {__VLS_StyleScopedClasses['child-grid-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "child-grid-avatar" },
            });
            /** @type {__VLS_StyleScopedClasses['child-grid-avatar']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
                ...{ onError: (__VLS_ctx.handleChildImageError) },
                src: (child.profilePictureUrl),
                alt: "Child",
                ...{ class: "child-avatar-image" },
            });
            /** @type {__VLS_StyleScopedClasses['child-avatar-image']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "child-grid-info" },
            });
            /** @type {__VLS_StyleScopedClasses['child-grid-info']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "child-grid-name" },
            });
            /** @type {__VLS_StyleScopedClasses['child-grid-name']} */ ;
            (child.name);
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "child-grid-age" },
            });
            /** @type {__VLS_StyleScopedClasses['child-grid-age']} */ ;
            (__VLS_ctx.calculateAge(child.dateOfBirth));
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "child-grid-detail" },
            });
            /** @type {__VLS_StyleScopedClasses['child-grid-detail']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            (__VLS_ctx.formatDate(child.dateOfBirth) || '—');
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "child-grid-detail" },
            });
            /** @type {__VLS_StyleScopedClasses['child-grid-detail']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            (child.hasMedicalCondition ? 'አለ' : 'የለም');
            if (child.medicalConditionNotes) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "child-grid-detail" },
                });
                /** @type {__VLS_StyleScopedClasses['child-grid-detail']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
                (child.medicalConditionNotes);
            }
            // @ts-ignore
            [goBack, openSettings, printDocument, loading, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, handleImageError, formatDate, formatDate, formatDate, formatDate, formatDate, getEmploymentTypeLabel, getEmploymentTypeLabel, formatCurrency, handleSpouseImageError, handleChildImageError, calculateAge,];
        }
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "content-grid equal-height" },
    });
    /** @type {__VLS_StyleScopedClasses['content-grid']} */ ;
    /** @type {__VLS_StyleScopedClasses['equal-height']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "left-column" },
    });
    /** @type {__VLS_StyleScopedClasses['left-column']} */ ;
    if (__VLS_ctx.selectedEmployee.parentsInfo && (__VLS_ctx.selectedEmployee.parentsInfo.father || __VLS_ctx.selectedEmployee.parentsInfo.mother)) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "info-card" },
        });
        /** @type {__VLS_StyleScopedClasses['info-card']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "card-header" },
        });
        /** @type {__VLS_StyleScopedClasses['card-header']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "card-header-icon" },
        });
        /** @type {__VLS_StyleScopedClasses['card-header-icon']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            'stroke-width': "2",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
            d: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.circle)({
            cx: "12",
            cy: "7",
            r: "4",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "grid-list cols-auto" },
        });
        /** @type {__VLS_StyleScopedClasses['grid-list']} */ ;
        /** @type {__VLS_StyleScopedClasses['cols-auto']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "grid-item parent-grid-item" },
        });
        /** @type {__VLS_StyleScopedClasses['grid-item']} */ ;
        /** @type {__VLS_StyleScopedClasses['parent-grid-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "g-label" },
        });
        /** @type {__VLS_StyleScopedClasses['g-label']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "g-value" },
        });
        /** @type {__VLS_StyleScopedClasses['g-value']} */ ;
        (__VLS_ctx.selectedEmployee.parentsInfo.father?.fullName || '—');
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "g-sub-meta" },
        });
        /** @type {__VLS_StyleScopedClasses['g-sub-meta']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_ctx.selectedEmployee.parentsInfo.father?.job || '—');
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ style: {} },
        });
        (__VLS_ctx.formatCurrency(__VLS_ctx.selectedEmployee.parentsInfo.father?.monthlyIncome));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "grid-item parent-grid-item" },
        });
        /** @type {__VLS_StyleScopedClasses['grid-item']} */ ;
        /** @type {__VLS_StyleScopedClasses['parent-grid-item']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "g-label" },
        });
        /** @type {__VLS_StyleScopedClasses['g-label']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "g-value" },
        });
        /** @type {__VLS_StyleScopedClasses['g-value']} */ ;
        (__VLS_ctx.selectedEmployee.parentsInfo.mother?.fullName || '—');
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "g-sub-meta" },
        });
        /** @type {__VLS_StyleScopedClasses['g-sub-meta']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_ctx.selectedEmployee.parentsInfo.mother?.job || '—');
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ style: {} },
        });
        (__VLS_ctx.formatCurrency(__VLS_ctx.selectedEmployee.parentsInfo.mother?.monthlyIncome));
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "right-column" },
    });
    /** @type {__VLS_StyleScopedClasses['right-column']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-card allowances-card" },
    });
    /** @type {__VLS_StyleScopedClasses['info-card']} */ ;
    /** @type {__VLS_StyleScopedClasses['allowances-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card-header" },
    });
    /** @type {__VLS_StyleScopedClasses['card-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card-header-icon" },
    });
    /** @type {__VLS_StyleScopedClasses['card-header-icon']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.circle)({
        cx: "12",
        cy: "12",
        r: "10",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
        d: "M12 6v6l4 2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "grid-list cols-auto" },
    });
    /** @type {__VLS_StyleScopedClasses['grid-list']} */ ;
    /** @type {__VLS_StyleScopedClasses['cols-auto']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "grid-item" },
    });
    /** @type {__VLS_StyleScopedClasses['grid-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "g-label" },
    });
    /** @type {__VLS_StyleScopedClasses['g-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "g-value" },
    });
    /** @type {__VLS_StyleScopedClasses['g-value']} */ ;
    (__VLS_ctx.formatCurrency(__VLS_ctx.selectedEmployee.basicSalary));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "grid-item" },
    });
    /** @type {__VLS_StyleScopedClasses['grid-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "g-label" },
    });
    /** @type {__VLS_StyleScopedClasses['g-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "g-value" },
    });
    /** @type {__VLS_StyleScopedClasses['g-value']} */ ;
    (__VLS_ctx.formatCurrency(__VLS_ctx.selectedEmployee.housingAllowance));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "grid-item" },
    });
    /** @type {__VLS_StyleScopedClasses['grid-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "g-label" },
    });
    /** @type {__VLS_StyleScopedClasses['g-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "g-value" },
    });
    /** @type {__VLS_StyleScopedClasses['g-value']} */ ;
    (__VLS_ctx.formatCurrency(__VLS_ctx.selectedEmployee.positionAllowance));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "grid-item" },
    });
    /** @type {__VLS_StyleScopedClasses['grid-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "g-label" },
    });
    /** @type {__VLS_StyleScopedClasses['g-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "g-value" },
    });
    /** @type {__VLS_StyleScopedClasses['g-value']} */ ;
    (__VLS_ctx.formatCurrency(__VLS_ctx.selectedEmployee.transportAllowance));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "grid-item" },
    });
    /** @type {__VLS_StyleScopedClasses['grid-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "g-label" },
    });
    /** @type {__VLS_StyleScopedClasses['g-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "g-value" },
    });
    /** @type {__VLS_StyleScopedClasses['g-value']} */ ;
    (__VLS_ctx.formatCurrency(__VLS_ctx.selectedEmployee.mobileAllowance));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "grid-item highlight-total" },
    });
    /** @type {__VLS_StyleScopedClasses['grid-item']} */ ;
    /** @type {__VLS_StyleScopedClasses['highlight-total']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "g-label-bold" },
    });
    /** @type {__VLS_StyleScopedClasses['g-label-bold']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "g-value-bold highlight-orange" },
    });
    /** @type {__VLS_StyleScopedClasses['g-value-bold']} */ ;
    /** @type {__VLS_StyleScopedClasses['highlight-orange']} */ ;
    (__VLS_ctx.formatCurrency(__VLS_ctx.totalAllowances));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "grid-item full-width highlight-gross" },
    });
    /** @type {__VLS_StyleScopedClasses['grid-item']} */ ;
    /** @type {__VLS_StyleScopedClasses['full-width']} */ ;
    /** @type {__VLS_StyleScopedClasses['highlight-gross']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "g-label-bold" },
    });
    /** @type {__VLS_StyleScopedClasses['g-label-bold']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "g-value-bold highlight-green" },
    });
    /** @type {__VLS_StyleScopedClasses['g-value-bold']} */ ;
    /** @type {__VLS_StyleScopedClasses['highlight-green']} */ ;
    (__VLS_ctx.formatCurrency(__VLS_ctx.grossPay));
    if (__VLS_ctx.selectedEmployee.languageSkills && __VLS_ctx.selectedEmployee.languageSkills.length) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "info-card table-card" },
        });
        /** @type {__VLS_StyleScopedClasses['info-card']} */ ;
        /** @type {__VLS_StyleScopedClasses['table-card']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "card-header" },
        });
        /** @type {__VLS_StyleScopedClasses['card-header']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "card-header-icon" },
        });
        /** @type {__VLS_StyleScopedClasses['card-header-icon']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            'stroke-width': "2",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
            d: "M5 8h10M9 4v4M11 12h8M15 8v4",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
            d: "M2 2h20v20H2z",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "table-wrapper" },
        });
        /** @type {__VLS_StyleScopedClasses['table-wrapper']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
            ...{ class: "paper-grid-table complex-header" },
        });
        /** @type {__VLS_StyleScopedClasses['paper-grid-table']} */ ;
        /** @type {__VLS_StyleScopedClasses['complex-header']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
            rowspan: "2",
            ...{ class: "lang-main-header" },
        });
        /** @type {__VLS_StyleScopedClasses['lang-main-header']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
            colspan: "3",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
            colspan: "3",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
            colspan: "3",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({
            colspan: "3",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
        for (const [lang, idx] of __VLS_vFor((__VLS_ctx.selectedEmployee.languageSkills))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
                key: (idx),
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            (lang.language || '—');
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "center-text" },
            });
            /** @type {__VLS_StyleScopedClasses['center-text']} */ ;
            ((lang.proficiency === 'native' || lang.proficiency === 'fluent') ? '✓' : '');
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "center-text" },
            });
            /** @type {__VLS_StyleScopedClasses['center-text']} */ ;
            ((lang.proficiency === 'intermediate') ? '✓' : '');
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "center-text" },
            });
            /** @type {__VLS_StyleScopedClasses['center-text']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "center-text" },
            });
            /** @type {__VLS_StyleScopedClasses['center-text']} */ ;
            ((lang.proficiency === 'native' || lang.proficiency === 'fluent') ? '✓' : '');
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "center-text" },
            });
            /** @type {__VLS_StyleScopedClasses['center-text']} */ ;
            ((lang.proficiency === 'intermediate') ? '✓' : '');
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "center-text" },
            });
            /** @type {__VLS_StyleScopedClasses['center-text']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "center-text" },
            });
            /** @type {__VLS_StyleScopedClasses['center-text']} */ ;
            ((lang.proficiency === 'native' || lang.proficiency === 'fluent') ? '✓' : '');
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "center-text" },
            });
            /** @type {__VLS_StyleScopedClasses['center-text']} */ ;
            ((lang.proficiency === 'intermediate') ? '✓' : '');
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "center-text" },
            });
            /** @type {__VLS_StyleScopedClasses['center-text']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "center-text" },
            });
            /** @type {__VLS_StyleScopedClasses['center-text']} */ ;
            ((lang.proficiency === 'native' || lang.proficiency === 'fluent') ? '✓' : '');
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "center-text" },
            });
            /** @type {__VLS_StyleScopedClasses['center-text']} */ ;
            ((lang.proficiency === 'intermediate') ? '✓' : '');
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({
                ...{ class: "center-text" },
            });
            /** @type {__VLS_StyleScopedClasses['center-text']} */ ;
            // @ts-ignore
            [selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, formatCurrency, formatCurrency, formatCurrency, formatCurrency, formatCurrency, formatCurrency, formatCurrency, formatCurrency, formatCurrency, totalAllowances, grossPay,];
        }
        if (__VLS_ctx.selectedEmployee.otherSkills) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "other-skills-section" },
            });
            /** @type {__VLS_StyleScopedClasses['other-skills-section']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            (__VLS_ctx.selectedEmployee.otherSkills);
        }
    }
    if (__VLS_ctx.selectedEmployee.workExperience && __VLS_ctx.selectedEmployee.workExperience.length) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "info-card table-card" },
        });
        /** @type {__VLS_StyleScopedClasses['info-card']} */ ;
        /** @type {__VLS_StyleScopedClasses['table-card']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "card-header" },
        });
        /** @type {__VLS_StyleScopedClasses['card-header']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "card-header-icon" },
        });
        /** @type {__VLS_StyleScopedClasses['card-header-icon']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            'stroke-width': "2",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.rect)({
            x: "2",
            y: "7",
            width: "20",
            height: "14",
            rx: "2",
            ry: "2",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
            d: "M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "table-wrapper" },
        });
        /** @type {__VLS_StyleScopedClasses['table-wrapper']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
            ...{ class: "paper-grid-table" },
        });
        /** @type {__VLS_StyleScopedClasses['paper-grid-table']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
        for (const [work, idx] of __VLS_vFor((__VLS_ctx.selectedEmployee.workExperience))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
                key: (idx),
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            (work.position || '—');
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            (work.companyName || '—');
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            (work.startDate || '—');
            (work.endDate || 'እስካሁን');
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            (work.companyAddress || '—');
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            (work.providentFundSubmitted === 'yes' ? 'ቀርቧል' : '—');
            // @ts-ignore
            [selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee,];
        }
    }
    if (__VLS_ctx.selectedEmployee.workExperience && __VLS_ctx.selectedEmployee.workExperience.length) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "info-card table-card" },
        });
        /** @type {__VLS_StyleScopedClasses['info-card']} */ ;
        /** @type {__VLS_StyleScopedClasses['table-card']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "card-header" },
        });
        /** @type {__VLS_StyleScopedClasses['card-header']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "card-header-icon" },
        });
        /** @type {__VLS_StyleScopedClasses['card-header-icon']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            'stroke-width': "2",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.path)({
            d: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.circle)({
            cx: "12",
            cy: "7",
            r: "4",
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "table-wrapper" },
        });
        /** @type {__VLS_StyleScopedClasses['table-wrapper']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
            ...{ class: "paper-grid-table" },
        });
        /** @type {__VLS_StyleScopedClasses['paper-grid-table']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
        for (const [edu, idx] of __VLS_vFor((__VLS_ctx.selectedEmployee.education))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
                key: (idx),
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            (edu.field || '—');
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            (edu.institutionName || '—');
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            (edu.startDate || '—');
            (edu.endDate || '—');
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            (edu.institutionAddress || '—');
            __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
            (edu.isCurrent ? 'በመማር ላይ' : 'ተጠናቋል');
            // @ts-ignore
            [selectedEmployee, selectedEmployee, selectedEmployee,];
        }
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "page-break final-section" },
    });
    /** @type {__VLS_StyleScopedClasses['page-break']} */ ;
    /** @type {__VLS_StyleScopedClasses['final-section']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "declaration-section" },
    });
    /** @type {__VLS_StyleScopedClasses['declaration-section']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({
        ...{ class: "section-title" },
    });
    /** @type {__VLS_StyleScopedClasses['section-title']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "check-row-block" },
    });
    /** @type {__VLS_StyleScopedClasses['check-row-block']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "check-row" },
    });
    /** @type {__VLS_StyleScopedClasses['check-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "q-text" },
    });
    /** @type {__VLS_StyleScopedClasses['q-text']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "check-opt" },
    });
    /** @type {__VLS_StyleScopedClasses['check-opt']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "q-label" },
    });
    /** @type {__VLS_StyleScopedClasses['q-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "square-box" },
    });
    /** @type {__VLS_StyleScopedClasses['square-box']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "q-label" },
    });
    /** @type {__VLS_StyleScopedClasses['q-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "square-box checked" },
    });
    /** @type {__VLS_StyleScopedClasses['square-box']} */ ;
    /** @type {__VLS_StyleScopedClasses['checked']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "check-row" },
    });
    /** @type {__VLS_StyleScopedClasses['check-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "q-text" },
    });
    /** @type {__VLS_StyleScopedClasses['q-text']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "input-line-large" },
    });
    /** @type {__VLS_StyleScopedClasses['input-line-large']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "check-row" },
    });
    /** @type {__VLS_StyleScopedClasses['check-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "q-text" },
    });
    /** @type {__VLS_StyleScopedClasses['q-text']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "check-opt" },
    });
    /** @type {__VLS_StyleScopedClasses['check-opt']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "q-label" },
    });
    /** @type {__VLS_StyleScopedClasses['q-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "square-box" },
    });
    /** @type {__VLS_StyleScopedClasses['square-box']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "q-label" },
    });
    /** @type {__VLS_StyleScopedClasses['q-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "square-box checked" },
    });
    /** @type {__VLS_StyleScopedClasses['square-box']} */ ;
    /** @type {__VLS_StyleScopedClasses['checked']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "declaration-block-border" },
    });
    /** @type {__VLS_StyleScopedClasses['declaration-block-border']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "declaration-text" },
    });
    /** @type {__VLS_StyleScopedClasses['declaration-text']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "sig-line-large" },
    });
    /** @type {__VLS_StyleScopedClasses['sig-line-large']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "sig-label" },
    });
    /** @type {__VLS_StyleScopedClasses['sig-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "sig-underline-large" },
    });
    /** @type {__VLS_StyleScopedClasses['sig-underline-large']} */ ;
    (__VLS_ctx.selectedEmployee.fullName);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "sig-line-large split-sig" },
    });
    /** @type {__VLS_StyleScopedClasses['sig-line-large']} */ ;
    /** @type {__VLS_StyleScopedClasses['split-sig']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "sig-label" },
    });
    /** @type {__VLS_StyleScopedClasses['sig-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "sig-underline-large" },
    });
    /** @type {__VLS_StyleScopedClasses['sig-underline-large']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "sig-label" },
    });
    /** @type {__VLS_StyleScopedClasses['sig-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "sig-underline-large" },
    });
    /** @type {__VLS_StyleScopedClasses['sig-underline-large']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "admin-block-border" },
    });
    /** @type {__VLS_StyleScopedClasses['admin-block-border']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "admin-header-bar" },
    });
    /** @type {__VLS_StyleScopedClasses['admin-header-bar']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "admin-body" },
    });
    /** @type {__VLS_StyleScopedClasses['admin-body']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "admin-date-row" },
    });
    /** @type {__VLS_StyleScopedClasses['admin-date-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "admin-label-wide" },
    });
    /** @type {__VLS_StyleScopedClasses['admin-label-wide']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "admin-date-parts" },
    });
    /** @type {__VLS_StyleScopedClasses['admin-date-parts']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "admin-date-underlined" },
    });
    /** @type {__VLS_StyleScopedClasses['admin-date-underlined']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "admin-date-underlined" },
    });
    /** @type {__VLS_StyleScopedClasses['admin-date-underlined']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "admin-date-underlined" },
    });
    /** @type {__VLS_StyleScopedClasses['admin-date-underlined']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "admin-fields-grid" },
    });
    /** @type {__VLS_StyleScopedClasses['admin-fields-grid']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "admin-field-row" },
    });
    /** @type {__VLS_StyleScopedClasses['admin-field-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "admin-label" },
    });
    /** @type {__VLS_StyleScopedClasses['admin-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "admin-field-under" },
    });
    /** @type {__VLS_StyleScopedClasses['admin-field-under']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "admin-field-row" },
    });
    /** @type {__VLS_StyleScopedClasses['admin-field-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "admin-label" },
    });
    /** @type {__VLS_StyleScopedClasses['admin-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "admin-field-under" },
    });
    /** @type {__VLS_StyleScopedClasses['admin-field-under']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "admin-field-row" },
    });
    /** @type {__VLS_StyleScopedClasses['admin-field-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "admin-label" },
    });
    /** @type {__VLS_StyleScopedClasses['admin-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "admin-field-under" },
    });
    /** @type {__VLS_StyleScopedClasses['admin-field-under']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "admin-sig-block" },
    });
    /** @type {__VLS_StyleScopedClasses['admin-sig-block']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "admin-sig-row" },
    });
    /** @type {__VLS_StyleScopedClasses['admin-sig-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "admin-label" },
    });
    /** @type {__VLS_StyleScopedClasses['admin-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "admin-field-long" },
    });
    /** @type {__VLS_StyleScopedClasses['admin-field-long']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "admin-sig-row" },
    });
    /** @type {__VLS_StyleScopedClasses['admin-sig-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "admin-label" },
    });
    /** @type {__VLS_StyleScopedClasses['admin-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "admin-field-long" },
    });
    /** @type {__VLS_StyleScopedClasses['admin-field-long']} */ ;
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "empty-state" },
    });
    /** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.svg, __VLS_intrinsics.svg)({
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "2",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.circle)({
        cx: "12",
        cy: "12",
        r: "10",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.line)({
        x1: "12",
        y1: "8",
        x2: "12",
        y2: "12",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.circle)({
        cx: "12",
        cy: "16",
        r: "0.5",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.openSettings) },
        ...{ class: "action-btn primary" },
    });
    /** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
    /** @type {__VLS_StyleScopedClasses['primary']} */ ;
}
if (__VLS_ctx.showSettings) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showSettings))
                    return;
                __VLS_ctx.showSettings = false;
                // @ts-ignore
                [openSettings, selectedEmployee, showSettings, showSettings,];
            } },
        ...{ class: "modal-overlay" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-container" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-container']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-header" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showSettings))
                    return;
                __VLS_ctx.showSettings = false;
                // @ts-ignore
                [showSettings,];
            } },
        ...{ class: "close-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['close-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-body" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-body']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "field-group" },
    });
    /** @type {__VLS_StyleScopedClasses['field-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "searchable-select" },
    });
    /** @type {__VLS_StyleScopedClasses['searchable-select']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        ...{ onInput: (__VLS_ctx.filterEmployees) },
        ...{ onFocus: (...[$event]) => {
                if (!(__VLS_ctx.showSettings))
                    return;
                __VLS_ctx.showDropdown = true;
                // @ts-ignore
                [filterEmployees, showDropdown,];
            } },
        ...{ onBlur: (__VLS_ctx.handleBlur) },
        type: "text",
        value: (__VLS_ctx.employeeSearchTerm),
        placeholder: "ሰራተኛ ፈልግ...",
        ...{ class: "search-input" },
    });
    /** @type {__VLS_StyleScopedClasses['search-input']} */ ;
    if (__VLS_ctx.showDropdown && __VLS_ctx.filteredEmployees.length > 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "dropdown-list" },
        });
        /** @type {__VLS_StyleScopedClasses['dropdown-list']} */ ;
        for (const [emp] of __VLS_vFor((__VLS_ctx.filteredEmployees))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ onMousedown: (...[$event]) => {
                        if (!(__VLS_ctx.showSettings))
                            return;
                        if (!(__VLS_ctx.showDropdown && __VLS_ctx.filteredEmployees.length > 0))
                            return;
                        __VLS_ctx.selectEmployee(emp);
                        // @ts-ignore
                        [showDropdown, handleBlur, employeeSearchTerm, filteredEmployees, filteredEmployees, selectEmployee,];
                    } },
                key: (emp.id),
                ...{ class: "dropdown-item" },
            });
            /** @type {__VLS_StyleScopedClasses['dropdown-item']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "emp-name" },
            });
            /** @type {__VLS_StyleScopedClasses['emp-name']} */ ;
            (emp.fullName);
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "emp-id" },
            });
            /** @type {__VLS_StyleScopedClasses['emp-id']} */ ;
            (emp.employeeId);
            // @ts-ignore
            [];
        }
    }
    if (__VLS_ctx.selectedEmployee) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "selected-display" },
        });
        /** @type {__VLS_StyleScopedClasses['selected-display']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_ctx.selectedEmployee.fullName);
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (__VLS_ctx.clearSelection) },
            ...{ class: "clear-btn" },
        });
        /** @type {__VLS_StyleScopedClasses['clear-btn']} */ ;
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "field-divider" },
    });
    /** @type {__VLS_StyleScopedClasses['field-divider']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "file-select-list" },
    });
    /** @type {__VLS_StyleScopedClasses['file-select-list']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "file-check-item" },
    });
    /** @type {__VLS_StyleScopedClasses['file-check-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "checkbox",
    });
    (__VLS_ctx.printFiles.includeDeclaration);
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "file-check-item" },
    });
    /** @type {__VLS_StyleScopedClasses['file-check-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "checkbox",
    });
    (__VLS_ctx.printFiles.includeTables);
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "file-check-item" },
    });
    /** @type {__VLS_StyleScopedClasses['file-check-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "checkbox",
    });
    (__VLS_ctx.printFiles.includeSupporting);
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "file-check-item" },
    });
    /** @type {__VLS_StyleScopedClasses['file-check-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "checkbox",
    });
    (__VLS_ctx.printFiles.includeAllowances);
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "file-check-item" },
    });
    /** @type {__VLS_StyleScopedClasses['file-check-item']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        type: "checkbox",
    });
    (__VLS_ctx.printFiles.includeBasicInfo);
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "field-divider" },
    });
    /** @type {__VLS_StyleScopedClasses['field-divider']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "field-group" },
    });
    /** @type {__VLS_StyleScopedClasses['field-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        placeholder: "__________",
    });
    (__VLS_ctx.biographyDate);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "modal-footer" },
    });
    /** @type {__VLS_StyleScopedClasses['modal-footer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showSettings))
                    return;
                __VLS_ctx.showSettings = false;
                // @ts-ignore
                [selectedEmployee, selectedEmployee, showSettings, clearSelection, printFiles, printFiles, printFiles, printFiles, printFiles, biographyDate,];
            } },
        ...{ class: "cancel-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['cancel-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.applyData) },
        ...{ class: "save-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['save-btn']} */ ;
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "toast-container" },
});
/** @type {__VLS_StyleScopedClasses['toast-container']} */ ;
for (const [toast] of __VLS_vFor((__VLS_ctx.toasts))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        key: (toast.id),
        ...{ class: (['toast', toast.type]) },
    });
    /** @type {__VLS_StyleScopedClasses['toast']} */ ;
    (toast.message);
    // @ts-ignore
    [applyData, toasts,];
}
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
