import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import fullBackgroundImage from "@/assets/documentBackground.png";
const router = useRouter();
// UI state
const showSettings = ref(false);
const showToolbar = ref(false);
const toolbarPosition = ref({ top: 0, left: 0 });
const documentContent = ref(null);
const toasts = ref([]);
const savedHtml = ref("");
// Employees data with more fields
const employees = ref([
    {
        id: 1,
        fullName: "ተመስገን እሸቱ",
        employeeId: "SDT-0012",
        position: "Senior Developer",
        basicSalary: 6500,
        transportAllowance: 500,
        housingAllowance: 800,
        mobileAllowance: 200,
        hireDateEC: "17/02/2018",
        departmentName: "ICT",
    },
    {
        id: 2,
        fullName: "ሰላም ገብረየስ",
        employeeId: "SDT-0045",
        position: "Accountant",
        basicSalary: 5500,
        transportAllowance: 400,
        housingAllowance: 600,
        mobileAllowance: 150,
        hireDateEC: "10/05/2019",
        departmentName: "Finance",
    },
    {
        id: 3,
        fullName: "ዳዊት ተስፋዬ",
        employeeId: "SDT-0078",
        position: "Sales Officer",
        basicSalary: 4800,
        transportAllowance: 450,
        housingAllowance: 500,
        mobileAllowance: 180,
        hireDateEC: "22/11/2020",
        departmentName: "Sales",
    },
    {
        id: 4,
        fullName: "ብርሃኔ ካሳ",
        employeeId: "SDT-0091",
        position: "Technician",
        basicSalary: 4200,
        transportAllowance: 300,
        housingAllowance: 400,
        mobileAllowance: 100,
        hireDateEC: "05/03/2021",
        departmentName: "Technical",
    },
]);
const selectedEmployee = ref(null);
const employeeSearchTerm = ref("");
const filteredEmployees = ref([]);
const showDropdown = ref(false);
// Form fields
const refNumber = ref("ሰደቲ/ሰሀ/0032/18");
const letterDate = ref("22/07/2016");
const recipientOrg = ref("");
const employeePosition = ref("");
const employeeBasicSalary = ref("");
const employeeTransportAllowance = ref("");
const employeeHousingAllowance = ref("");
const employeeMobileAllowance = ref("");
const employeeTotalPay = ref("");
const employeeHireDate = ref("");
const employeeDepartment = ref("");
const employeeName = ref("");
// Filter employees
const filterEmployees = () => {
    const term = employeeSearchTerm.value.toLowerCase().trim();
    if (!term) {
        filteredEmployees.value = [];
        return;
    }
    filteredEmployees.value = employees.value.filter((emp) => emp.fullName.toLowerCase().includes(term) ||
        emp.employeeId.toLowerCase().includes(term));
};
// Select employee
const selectEmployee = (emp) => {
    selectedEmployee.value = emp;
    employeeSearchTerm.value = emp.fullName;
    employeeName.value = emp.fullName;
    // Auto-fill employee data
    employeePosition.value = emp.position || "";
    employeeBasicSalary.value = emp.basicSalary ? `${emp.basicSalary}` : "";
    employeeTransportAllowance.value = emp.transportAllowance
        ? `${emp.transportAllowance}`
        : "";
    employeeHousingAllowance.value = emp.housingAllowance
        ? `${emp.housingAllowance}`
        : "";
    employeeMobileAllowance.value = emp.mobileAllowance
        ? `${emp.mobileAllowance}`
        : "";
    const total = (parseFloat(emp.basicSalary) || 0) +
        (parseFloat(emp.transportAllowance) || 0) +
        (parseFloat(emp.housingAllowance) || 0) +
        (parseFloat(emp.mobileAllowance) || 0);
    employeeTotalPay.value = total ? `${total}` : "";
    employeeHireDate.value = emp.hireDateEC || "";
    employeeDepartment.value = emp.departmentName || "";
    showDropdown.value = false;
    addToast(`Employee selected: ${emp.fullName}`, "success");
};
const clearSelection = () => {
    selectedEmployee.value = null;
    employeeSearchTerm.value = "";
    employeeName.value = "";
    employeePosition.value = "";
    employeeBasicSalary.value = "";
    employeeTransportAllowance.value = "";
    employeeHousingAllowance.value = "";
    employeeMobileAllowance.value = "";
    employeeTotalPay.value = "";
    employeeHireDate.value = "";
    employeeDepartment.value = "";
};
const handleBlur = () => {
    setTimeout(() => {
        showDropdown.value = false;
    }, 200);
};
// Navigation
const goBack = () => router.push("/documents-letters");
const openSettings = () => (showSettings.value = true);
// Apply data
const applyData = () => {
    showSettings.value = false;
    savedHtml.value = "";
    addToast("Document updated successfully!", "success");
};
// Rich text functions
const changeFontSize = (size) => {
    const selection = window.getSelection();
    if (!selection.rangeCount || selection.isCollapsed)
        return;
    const range = selection.getRangeAt(0);
    const span = document.createElement("span");
    span.style.fontSize = `${size}px`;
    try {
        range.surroundContents(span);
    }
    catch (e) {
        const text = range.extractContents();
        span.appendChild(text);
        range.insertNode(span);
    }
    saveContent();
};
const changeFontName = (font) => {
    const selection = window.getSelection();
    if (!selection.rangeCount || selection.isCollapsed)
        return;
    const range = selection.getRangeAt(0);
    const span = document.createElement("span");
    span.style.fontFamily = font;
    try {
        range.surroundContents(span);
    }
    catch (e) {
        const text = range.extractContents();
        span.appendChild(text);
        range.insertNode(span);
    }
    saveContent();
};
// Document HTML - Employment Letter (Fully Corrected)
const documentHtml = computed(() => {
    if (savedHtml.value)
        return savedHtml.value;
    const basicSalary = employeeBasicSalary.value
        ? `ብር ${employeeBasicSalary.value}`
        : "__________";
    const transport = employeeTransportAllowance.value
        ? `ብር ${employeeTransportAllowance.value}`
        : "__________";
    const housing = employeeHousingAllowance.value
        ? `ብር ${employeeHousingAllowance.value}`
        : "__________";
    const mobile = employeeMobileAllowance.value
        ? `ብር ${employeeMobileAllowance.value}`
        : "__________";
    const totalPay = employeeTotalPay.value
        ? `ብር ${employeeTotalPay.value}`
        : "__________";
    const totalPayWords = employeeTotalPay.value
        ? numberToWords(parseInt(employeeTotalPay.value))
        : "__________";
    return `
<div class="letter">
  <div class="header-row">
    <div class="ref-number">ቁጥር ${refNumber.value}</div>
    <div class="date-text">ቀን ${letterDate.value}</div>
  </div>
  <div class="recipient-line">ለ ${recipientOrg.value}</div>
  <div class="address-line">አዲስ አበባ</div>
  <div class="subject-line">ጉዳዩ፡ የስራ ቅጥርን ይመለከታል</div>
  <div class="body-text">
    በድርጅታችን ሱፐር ደብል ቲ ጀነራል ትሬዲንግ ኃ/የተ/የግ/ማህበር በ${employeePosition.value || "__________"} የስራ ክፍል ውስጥ በ${employeePosition.value || "__________"} የስራ መደብ ላይ በወር ያልተጣራ ደመወዝ ${basicSalary}፣ የትራንስፖርት አበል ${transport}፣ የቤት አበል ${housing}፣ የሞባይል አበል ${mobile} በጠቅላላው ${totalPay} /${totalPayWords}/ እየተከፈልዎት ከ ${employeeHireDate.value || "__________"} ዓ/ም ጀምሮ የተቀጠሩ መሆኑን እንገልጻለን። ስለሆነም የተሰጠዎትን የስራ ኃላፊነት በቅንነት እና በታማኝነት እንዲወጡ እያሳሰብን መልካም የስራ ጊዜ እንዲሆንልዎት እንመኛለን።
  </div>

  <div class="signature-section">
    <div class="salutation">ከሰላምታ ጋር</div>
  </div>
</div>
`;
});
// Number to words helper
const numberToWords = (num) => {
    if (num === 0)
        return "ዜሮ";
    const units = [
        "",
        "አንድ",
        "ሁለት",
        "ሶስት",
        "አራት",
        "አምስት",
        "ስድስት",
        "ሰባት",
        "ስምንት",
        "ዘጠኝ",
    ];
    const tens = [
        "",
        "አስር",
        "ሃያ",
        "ሰላሳ",
        "አርባ",
        "ሃምሳ",
        "ስድሳ",
        "ሰባ",
        "ሰማንያ",
        "ዘጠና",
    ];
    const hundreds = [
        "",
        "መቶ",
        "ሁለት መቶ",
        "ሶስት መቶ",
        "አራት መቶ",
        "አምስት መቶ",
        "ስድስት መቶ",
        "ሰባት መቶ",
        "ስምንት መቶ",
        "ዘጠኝ መቶ",
    ];
    if (num < 10000) {
        let result = "";
        const thousands = Math.floor(num / 1000);
        const remainder = num % 1000;
        if (thousands > 0) {
            if (thousands === 1)
                result = "ሺ";
            else
                result = units[thousands] + " ሺ";
        }
        if (remainder > 0) {
            if (result)
                result += " ";
            const h = Math.floor(remainder / 100);
            const t = Math.floor((remainder % 100) / 10);
            const u = remainder % 10;
            if (h > 0)
                result += hundreds[h];
            if (t > 0) {
                if (result)
                    result += " ";
                if (t === 1 && u === 0)
                    result += "አስር";
                else if (t === 1)
                    result += units[u] + "አስር";
                else {
                    result += tens[t];
                    if (u > 0)
                        result += " " + units[u];
                }
            }
            else if (u > 0) {
                if (result)
                    result += " ";
                result += units[u];
            }
        }
        return result;
    }
    return num.toString();
};
// Save content
const saveContent = () => {
    if (documentContent.value) {
        savedHtml.value = documentContent.value.innerHTML;
    }
};
// Exec command
const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    documentContent.value?.focus();
    saveContent();
};
// Show toolbar
const showToolbarAtSelection = () => {
    const selection = window.getSelection();
    if (!selection ||
        selection.isCollapsed ||
        selection.toString().length === 0) {
        hideToolbar();
        return;
    }
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    if (rect && rect.width > 0) {
        toolbarPosition.value = {
            top: rect.top + window.scrollY - 50,
            left: rect.left + window.scrollX + rect.width / 2 - 150,
        };
        showToolbar.value = true;
    }
};
const hideToolbar = () => {
    setTimeout(() => {
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed)
            showToolbar.value = false;
    }, 200);
};
// Print document
const printDocument = () => {
    saveContent();
    const printWindow = window.open("", "_blank");
    const currentContent = documentContent.value?.innerHTML || documentHtml.value;
    printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Employment Letter</title>
        <style>
          @page { size: A4; margin: 0; }
          html, body { width: 210mm; height: 297mm; margin: 0; padding: 0; background: white; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .right-float-buttons, .rich-text-toolbar, .modal-overlay, .toast-container {
            display: none !important;
          }
          body * { visibility: hidden; }
          .document-container, .document-container * { visibility: visible; }
          .document-container { position: absolute; top: 0; left: 0; width: 100%; margin: 0; padding: 0; }
          .document-wrapper {
            width: 210mm; height: 297mm; margin: 0; padding: 0; box-shadow: none;
            background-image: url('${fullBackgroundImage}');
            background-size: 100% 100%; background-position: center; background-repeat: no-repeat;
            background-color: white;
          }
          .document-content {
            padding-top: 68mm; padding-left: 15mm; padding-right: 15mm; padding-bottom: 20mm;
            font-family: "Nyala", "Abyssinica SIL", serif; font-size: 18px; line-height: 2; color: #000;
            background: transparent;
          }
          .header-row { display: flex; justify-content: space-between; margin-bottom: 30px; }
          .ref-number, .date-text { font-weight: bold; }
          .recipient-line { margin-bottom: 5px; }
          .address-line { margin-bottom: 30px; }
          .subject-line { text-align: center; font-weight: bold; margin: 30px 0 30px 0; }
          .body-text { text-align: justify; margin-bottom: 20px; }
          .signature-section { text-align: right; margin-top: 60px; }
          .salutation { margin-bottom: 25px; }
        </style>
      </head>
      <body>
        <div class="document-container">
          <div class="document-wrapper">
            <div class="document-content">${currentContent}</div>
          </div>
        </div>
        <script>
          window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 200); };
        <\/script>
      </body>
    </html>
  `);
    printWindow.document.close();
    addToast("Sent to printer!", "success");
};
// Toast
const addToast = (message, type) => {
    const id = Date.now();
    toasts.value.push({ id, message, type });
    setTimeout(() => (toasts.value = toasts.value.filter((t) => t.id !== id)), 3000);
};
const handleClickOutside = (event) => {
    if (showToolbar.value &&
        documentContent.value &&
        !documentContent.value.contains(event.target)) {
        hideToolbar();
    }
};
onMounted(() => {
    setTimeout(() => document.addEventListener("click", handleClickOutside), 100);
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
/** @type {__VLS_StyleScopedClasses['toolbar-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['document-content']} */ ;
/** @type {__VLS_StyleScopedClasses['document-content']} */ ;
/** @type {__VLS_StyleScopedClasses['document-content']} */ ;
/** @type {__VLS_StyleScopedClasses['document-content']} */ ;
/** @type {__VLS_StyleScopedClasses['document-content']} */ ;
/** @type {__VLS_StyleScopedClasses['document-content']} */ ;
/** @type {__VLS_StyleScopedClasses['document-content']} */ ;
/** @type {__VLS_StyleScopedClasses['document-content']} */ ;
/** @type {__VLS_StyleScopedClasses['document-content']} */ ;
/** @type {__VLS_StyleScopedClasses['document-content']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
/** @type {__VLS_StyleScopedClasses['field-group']} */ ;
/** @type {__VLS_StyleScopedClasses['field-group']} */ ;
/** @type {__VLS_StyleScopedClasses['field-group']} */ ;
/** @type {__VLS_StyleScopedClasses['field-group']} */ ;
/** @type {__VLS_StyleScopedClasses['search-input']} */ ;
/** @type {__VLS_StyleScopedClasses['dropdown-item']} */ ;
/** @type {__VLS_StyleScopedClasses['clear-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['save-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['toast']} */ ;
/** @type {__VLS_StyleScopedClasses['toast']} */ ;
/** @type {__VLS_StyleScopedClasses['letter-page']} */ ;
/** @type {__VLS_StyleScopedClasses['document-wrapper']} */ ;
/** @type {__VLS_StyleScopedClasses['document-content']} */ ;
/** @type {__VLS_StyleScopedClasses['right-float-buttons']} */ ;
/** @type {__VLS_StyleScopedClasses['float-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['float-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['right-float-buttons']} */ ;
/** @type {__VLS_StyleScopedClasses['rich-text-toolbar']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
/** @type {__VLS_StyleScopedClasses['toast-container']} */ ;
/** @type {__VLS_StyleScopedClasses['document-container']} */ ;
/** @type {__VLS_StyleScopedClasses['document-content']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "letter-page" },
});
/** @type {__VLS_StyleScopedClasses['letter-page']} */ ;
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
    title: "Settings",
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
if (__VLS_ctx.showToolbar) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "rich-text-toolbar" },
        ...{ style: ({
                top: __VLS_ctx.toolbarPosition.top + 'px',
                left: __VLS_ctx.toolbarPosition.left + 'px',
            }) },
    });
    /** @type {__VLS_StyleScopedClasses['rich-text-toolbar']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showToolbar))
                    return;
                __VLS_ctx.execCommand('bold');
                // @ts-ignore
                [goBack, openSettings, printDocument, showToolbar, toolbarPosition, toolbarPosition, execCommand,];
            } },
        ...{ class: "toolbar-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['toolbar-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showToolbar))
                    return;
                __VLS_ctx.execCommand('italic');
                // @ts-ignore
                [execCommand,];
            } },
        ...{ class: "toolbar-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['toolbar-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.em, __VLS_intrinsics.em)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showToolbar))
                    return;
                __VLS_ctx.execCommand('underline');
                // @ts-ignore
                [execCommand,];
            } },
        ...{ class: "toolbar-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['toolbar-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.u, __VLS_intrinsics.u)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "toolbar-divider" },
    });
    /** @type {__VLS_StyleScopedClasses['toolbar-divider']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        ...{ onChange: (...[$event]) => {
                if (!(__VLS_ctx.showToolbar))
                    return;
                __VLS_ctx.changeFontName($event.target.value);
                // @ts-ignore
                [changeFontName,];
            } },
        ...{ class: "toolbar-select" },
    });
    /** @type {__VLS_StyleScopedClasses['toolbar-select']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "'Nyala', 'Abyssinica SIL', serif",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "'Times New Roman', serif",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "'Arial', sans-serif",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        ...{ onChange: (...[$event]) => {
                if (!(__VLS_ctx.showToolbar))
                    return;
                __VLS_ctx.changeFontSize($event.target.value);
                // @ts-ignore
                [changeFontSize,];
            } },
        ...{ class: "toolbar-select" },
    });
    /** @type {__VLS_StyleScopedClasses['toolbar-select']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "11",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "12",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "13",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "14",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "15",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "16",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "17",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "18",
        selected: true,
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "19",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "20",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "21",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({
        value: "22",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "toolbar-divider" },
    });
    /** @type {__VLS_StyleScopedClasses['toolbar-divider']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showToolbar))
                    return;
                __VLS_ctx.execCommand('justifyLeft');
                // @ts-ignore
                [execCommand,];
            } },
        ...{ class: "toolbar-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['toolbar-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showToolbar))
                    return;
                __VLS_ctx.execCommand('justifyCenter');
                // @ts-ignore
                [execCommand,];
            } },
        ...{ class: "toolbar-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['toolbar-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showToolbar))
                    return;
                __VLS_ctx.execCommand('justifyRight');
                // @ts-ignore
                [execCommand,];
            } },
        ...{ class: "toolbar-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['toolbar-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "toolbar-divider" },
    });
    /** @type {__VLS_StyleScopedClasses['toolbar-divider']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showToolbar))
                    return;
                __VLS_ctx.execCommand('undo');
                // @ts-ignore
                [execCommand,];
            } },
        ...{ class: "toolbar-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['toolbar-btn']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showToolbar))
                    return;
                __VLS_ctx.execCommand('redo');
                // @ts-ignore
                [execCommand,];
            } },
        ...{ class: "toolbar-btn" },
    });
    /** @type {__VLS_StyleScopedClasses['toolbar-btn']} */ ;
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "document-container" },
});
/** @type {__VLS_StyleScopedClasses['document-container']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "document-wrapper" },
});
/** @type {__VLS_StyleScopedClasses['document-wrapper']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ onMouseup: (__VLS_ctx.showToolbarAtSelection) },
    ...{ onKeyup: (__VLS_ctx.showToolbarAtSelection) },
    ...{ onBlur: (__VLS_ctx.saveContent) },
    ref: "documentContent",
    ...{ class: "document-content" },
    contenteditable: "true",
});
__VLS_asFunctionalDirective(__VLS_directives.vHtml, {})(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.documentHtml) }, null, null);
/** @type {__VLS_StyleScopedClasses['document-content']} */ ;
if (__VLS_ctx.showSettings) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showSettings))
                    return;
                __VLS_ctx.showSettings = false;
                // @ts-ignore
                [showToolbarAtSelection, showToolbarAtSelection, saveContent, documentHtml, showSettings, showSettings,];
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
        placeholder: "Search employee...",
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
        ...{ class: "field-group" },
    });
    /** @type {__VLS_StyleScopedClasses['field-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        placeholder: "ሰደቲ/ሰሀ/0032/18",
    });
    (__VLS_ctx.refNumber);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "field-group" },
    });
    /** @type {__VLS_StyleScopedClasses['field-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        placeholder: "22/07/2016",
    });
    (__VLS_ctx.letterDate);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "field-group" },
    });
    /** @type {__VLS_StyleScopedClasses['field-group']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        placeholder: "Organization name",
    });
    (__VLS_ctx.recipientOrg);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "field-divider" },
    });
    /** @type {__VLS_StyleScopedClasses['field-divider']} */ ;
    if (__VLS_ctx.selectedEmployee) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "field-group" },
        });
        /** @type {__VLS_StyleScopedClasses['field-group']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            ...{ class: "field-auto" },
            readonly: true,
        });
        (__VLS_ctx.employeePosition);
        /** @type {__VLS_StyleScopedClasses['field-auto']} */ ;
    }
    if (__VLS_ctx.selectedEmployee) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "field-group" },
        });
        /** @type {__VLS_StyleScopedClasses['field-group']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            ...{ class: "field-auto" },
            readonly: true,
        });
        (__VLS_ctx.employeeBasicSalary);
        /** @type {__VLS_StyleScopedClasses['field-auto']} */ ;
    }
    if (__VLS_ctx.selectedEmployee) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "field-group" },
        });
        /** @type {__VLS_StyleScopedClasses['field-group']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            ...{ class: "field-auto" },
            readonly: true,
        });
        (__VLS_ctx.employeeTransportAllowance);
        /** @type {__VLS_StyleScopedClasses['field-auto']} */ ;
    }
    if (__VLS_ctx.selectedEmployee) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "field-group" },
        });
        /** @type {__VLS_StyleScopedClasses['field-group']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            ...{ class: "field-auto" },
            readonly: true,
        });
        (__VLS_ctx.employeeHousingAllowance);
        /** @type {__VLS_StyleScopedClasses['field-auto']} */ ;
    }
    if (__VLS_ctx.selectedEmployee) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "field-group" },
        });
        /** @type {__VLS_StyleScopedClasses['field-group']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            ...{ class: "field-auto" },
            readonly: true,
        });
        (__VLS_ctx.employeeMobileAllowance);
        /** @type {__VLS_StyleScopedClasses['field-auto']} */ ;
    }
    if (__VLS_ctx.selectedEmployee) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "field-group" },
        });
        /** @type {__VLS_StyleScopedClasses['field-group']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            ...{ class: "field-auto" },
            readonly: true,
        });
        (__VLS_ctx.employeeTotalPay);
        /** @type {__VLS_StyleScopedClasses['field-auto']} */ ;
    }
    if (__VLS_ctx.selectedEmployee) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "field-group" },
        });
        /** @type {__VLS_StyleScopedClasses['field-group']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            ...{ class: "field-auto" },
            readonly: true,
        });
        (__VLS_ctx.employeeHireDate);
        /** @type {__VLS_StyleScopedClasses['field-auto']} */ ;
    }
    if (__VLS_ctx.selectedEmployee) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "field-group" },
        });
        /** @type {__VLS_StyleScopedClasses['field-group']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
            ...{ class: "field-auto" },
            readonly: true,
        });
        (__VLS_ctx.employeeDepartment);
        /** @type {__VLS_StyleScopedClasses['field-auto']} */ ;
    }
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
                [showSettings, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, selectedEmployee, clearSelection, refNumber, letterDate, recipientOrg, employeePosition, employeeBasicSalary, employeeTransportAllowance, employeeHousingAllowance, employeeMobileAllowance, employeeTotalPay, employeeHireDate, employeeDepartment,];
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
