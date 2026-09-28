<template>
  <div class="letter-page">
    <!-- Floating Buttons - Vertically Stacked on Right -->
    <div class="right-float-buttons">
      <button @click="goBack" class="float-btn back-float" title="Back">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        @click="openSettings"
        class="float-btn settings-float"
        title="Settings"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </button>
      <button
        @click="printDocument"
        class="float-btn print-float"
        title="Print"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path
            d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4H7v4a2 2 0 002 2z"
          />
        </svg>
      </button>
    </div>

    <!-- Rich Text Toolbar -->
    <div
      v-if="showToolbar"
      class="rich-text-toolbar"
      :style="{
        top: toolbarPosition.top + 'px',
        left: toolbarPosition.left + 'px',
      }"
    >
      <button @click="execCommand('bold')" class="toolbar-btn">
        <strong>B</strong>
      </button>
      <button @click="execCommand('italic')" class="toolbar-btn">
        <em>I</em>
      </button>
      <button @click="execCommand('underline')" class="toolbar-btn">
        <u>U</u>
      </button>
      <div class="toolbar-divider"></div>
      <select
        @change="changeFontName($event.target.value)"
        class="toolbar-select"
      >
        <option value="'Nyala', 'Abyssinica SIL', serif">Nyala</option>
        <option value="'Times New Roman', serif">Times New Roman</option>
        <option value="'Arial', sans-serif">Arial</option>
      </select>
      <select
        @change="changeFontSize($event.target.value)"
        class="toolbar-select"
      >
        <option value="11">11px</option>
        <option value="12">12px</option>
        <option value="13">13px</option>
        <option value="14">14px</option>
        <option value="15">15px</option>
        <option value="16">16px</option>
        <option value="17">17px</option>
        <option value="18" selected>18px</option>
        <option value="19">19px</option>
        <option value="20">20px</option>
        <option value="21">21px</option>
        <option value="22">22px</option>
      </select>
      <div class="toolbar-divider"></div>
      <button @click="execCommand('justifyLeft')" class="toolbar-btn">
        ⬅️
      </button>
      <button @click="execCommand('justifyCenter')" class="toolbar-btn">
        ⬌
      </button>
      <button @click="execCommand('justifyRight')" class="toolbar-btn">
        ➡️
      </button>
      <div class="toolbar-divider"></div>
      <button @click="execCommand('undo')" class="toolbar-btn">↩️</button>
      <button @click="execCommand('redo')" class="toolbar-btn">↪️</button>
    </div>

    <!-- Document Viewer -->
    <div class="document-container">
      <div class="document-wrapper">
        <div
          ref="documentContent"
          class="document-content"
          contenteditable="true"
          v-html="documentHtml"
          @mouseup="showToolbarAtSelection"
          @keyup="showToolbarAtSelection"
          @blur="saveContent"
        ></div>
      </div>
    </div>

    <!-- Settings Modal -->
    <div
      v-if="showSettings"
      class="modal-overlay"
      @click.self="showSettings = false"
    >
      <div class="modal-container">
        <div class="modal-header">
          <h2>Settings - Employment Letter</h2>
          <button @click="showSettings = false" class="close-btn">
            &times;
          </button>
        </div>
        <div class="modal-body">
          <div class="field-group">
            <label>Select Employee</label>
            <div class="searchable-select">
              <input
                type="text"
                v-model="employeeSearchTerm"
                @input="filterEmployees"
                @focus="showDropdown = true"
                @blur="handleBlur"
                placeholder="Search employee..."
                class="search-input"
              />
              <div
                v-if="showDropdown && filteredEmployees.length > 0"
                class="dropdown-list"
              >
                <div
                  v-for="emp in filteredEmployees"
                  :key="emp.id"
                  class="dropdown-item"
                  @mousedown.prevent="selectEmployee(emp)"
                >
                  <span class="emp-name">{{ emp.fullName }}</span>
                  <span class="emp-id">{{ emp.employeeId }}</span>
                </div>
              </div>
            </div>
            <div v-if="selectedEmployee" class="selected-display">
              <span>{{ selectedEmployee.fullName }}</span>
              <button @click="clearSelection" class="clear-btn">✕</button>
            </div>
          </div>

          <div class="field-divider">Letter Details</div>

          <div class="field-group">
            <label>ቁጥር (Ref Number)</label>
            <input v-model="refNumber" placeholder="ሰደቲ/ሰሀ/0032/18" />
          </div>
          <div class="field-group">
            <label>ቀን (Date)</label>
            <input v-model="letterDate" placeholder="22/07/2016" />
          </div>
          <div class="field-group">
            <label>ለ (Recipient)</label>
            <input v-model="recipientOrg" placeholder="Organization name" />
          </div>

          <div class="field-divider">Employee Data (Auto-filled)</div>

          <div class="field-group" v-if="selectedEmployee">
            <label>የስራ መደብ (Position)</label>
            <input v-model="employeePosition" class="field-auto" readonly />
          </div>
          <div class="field-group" v-if="selectedEmployee">
            <label>መሰረታዊ ደሞዝ (Basic Salary)</label>
            <input v-model="employeeBasicSalary" class="field-auto" readonly />
          </div>
          <div class="field-group" v-if="selectedEmployee">
            <label>የትራንስፖርት አበል (Transport Allowance)</label>
            <input
              v-model="employeeTransportAllowance"
              class="field-auto"
              readonly
            />
          </div>
          <div class="field-group" v-if="selectedEmployee">
            <label>የቤት አበል (Housing Allowance)</label>
            <input
              v-model="employeeHousingAllowance"
              class="field-auto"
              readonly
            />
          </div>
          <div class="field-group" v-if="selectedEmployee">
            <label>የሞባይል አበል (Mobile Allowance)</label>
            <input
              v-model="employeeMobileAllowance"
              class="field-auto"
              readonly
            />
          </div>
          <div class="field-group" v-if="selectedEmployee">
            <label>ጠቅላላ ክፍያ (Total Pay)</label>
            <input v-model="employeeTotalPay" class="field-auto" readonly />
          </div>
          <div class="field-group" v-if="selectedEmployee">
            <label>የተቀጠሩበት ቀን (Hire Date)</label>
            <input v-model="employeeHireDate" class="field-auto" readonly />
          </div>
          <div class="field-group" v-if="selectedEmployee">
            <label>የስራ ክፍል (Department)</label>
            <input v-model="employeeDepartment" class="field-auto" readonly />
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showSettings = false" class="cancel-btn">
            Cancel
          </button>
          <button @click="applyData" class="save-btn">Apply</button>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <div class="toast-container">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :class="['toast', toast.type]"
      >
        {{ toast.message }}
      </div>
    </div>
  </div>
</template>

<script setup>
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
  filteredEmployees.value = employees.value.filter(
    (emp) =>
      emp.fullName.toLowerCase().includes(term) ||
      emp.employeeId.toLowerCase().includes(term),
  );
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

  const total =
    (parseFloat(emp.basicSalary) || 0) +
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
  if (!selection.rangeCount || selection.isCollapsed) return;
  const range = selection.getRangeAt(0);
  const span = document.createElement("span");
  span.style.fontSize = `${size}px`;
  try {
    range.surroundContents(span);
  } catch (e) {
    const text = range.extractContents();
    span.appendChild(text);
    range.insertNode(span);
  }
  saveContent();
};

const changeFontName = (font) => {
  const selection = window.getSelection();
  if (!selection.rangeCount || selection.isCollapsed) return;
  const range = selection.getRangeAt(0);
  const span = document.createElement("span");
  span.style.fontFamily = font;
  try {
    range.surroundContents(span);
  } catch (e) {
    const text = range.extractContents();
    span.appendChild(text);
    range.insertNode(span);
  }
  saveContent();
};

// Document HTML - Employment Letter (Fully Corrected)
const documentHtml = computed(() => {
  if (savedHtml.value) return savedHtml.value;

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
  if (num === 0) return "ዜሮ";
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
      if (thousands === 1) result = "ሺ";
      else result = units[thousands] + " ሺ";
    }
    if (remainder > 0) {
      if (result) result += " ";
      const h = Math.floor(remainder / 100);
      const t = Math.floor((remainder % 100) / 10);
      const u = remainder % 10;
      if (h > 0) result += hundreds[h];
      if (t > 0) {
        if (result) result += " ";
        if (t === 1 && u === 0) result += "አስር";
        else if (t === 1) result += units[u] + "አስር";
        else {
          result += tens[t];
          if (u > 0) result += " " + units[u];
        }
      } else if (u > 0) {
        if (result) result += " ";
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
  if (
    !selection ||
    selection.isCollapsed ||
    selection.toString().length === 0
  ) {
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
    if (!selection || selection.isCollapsed) showToolbar.value = false;
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
  setTimeout(
    () => (toasts.value = toasts.value.filter((t) => t.id !== id)),
    3000,
  );
};

const handleClickOutside = (event) => {
  if (
    showToolbar.value &&
    documentContent.value &&
    !documentContent.value.contains(event.target)
  ) {
    hideToolbar();
  }
};

onMounted(() => {
  setTimeout(() => document.addEventListener("click", handleClickOutside), 100);
});
</script>

<style scoped>
.letter-page {
  min-height: 100vh;
  background: #e5e5e5;
  padding: 20px;
}

/* ========== FLOATING BUTTONS - VERTICALLY STACKED ========== */
.right-float-buttons {
  position: fixed;
  right: 24px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 12px;
  z-index: 200;
}

.float-btn {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
  border: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.float-btn svg {
  width: 24px;
  height: 24px;
}

.back-float {
  background: white;
  color: #333;
}

.back-float:hover {
  background: #f0f0f0;
  transform: scale(1.05);
}

.settings-float {
  background: #f59e0b;
  color: white;
}

.settings-float:hover {
  background: #d97706;
  transform: scale(1.05);
}

.print-float {
  background: linear-gradient(135deg, #6a11cb, #7c3aed);
  color: white;
}

.print-float:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(106, 17, 203, 0.3);
}

/* ========== TOOLBAR ========== */
.rich-text-toolbar {
  position: fixed;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  padding: 8px 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  z-index: 1000;
  border: 1px solid #ddd;
  transform: translateX(-50%);
  max-width: 320px;
}

.toolbar-btn {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 1px solid #ddd;
  background: white;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toolbar-btn:hover {
  background: #f0f0f0;
}

.toolbar-select {
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid #ddd;
  background: white;
  font-size: 12px;
  cursor: pointer;
}

.toolbar-divider {
  width: 1px;
  height: 24px;
  background: #ddd;
  margin: 0 4px;
}

/* ========== DOCUMENT CONTAINER ========== */
.document-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 40px);
}

.document-wrapper {
  width: 210mm;
  min-height: 297mm;
  background-image: url("@/assets/documentBackground.png");
  background-size: contain;
  background-position: top center;
  background-repeat: no-repeat;
  background-color: white;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  position: relative;
}

.document-content {
  padding-top: 68mm;
  padding-left: 15mm;
  padding-right: 15mm;
  padding-bottom: 20mm;
  font-family: "Nyala", "Abyssinica SIL", serif;
  font-size: 18px;
  line-height: 2;
  color: #000;
  outline: none;
  background: transparent;
  position: relative;
  z-index: 2;
}

.document-content:focus {
  outline: 2px solid #6a11cb;
}

.document-content .header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-bottom: 30px;
}

.document-content .ref-number {
  font-weight: bold;
  text-align: left;
}

.document-content .date-text {
  font-weight: bold;
  text-align: right;
}

.document-content .recipient-line {
  margin-bottom: 5px;
}

.document-content .address-line {
  margin-bottom: 30px;
}

.document-content .subject-line {
  text-align: center;
  font-weight: bold;
  margin: 30px 0 30px 0;
}

.document-content .body-text {
  text-align: justify;
  margin-bottom: 20px;
}

.document-content .signature-section {
  text-align: right;
  margin-top: 60px;
  width: 100%;
}

.document-content .salutation {
  margin-bottom: 25px;
}

/* ========== MODAL ========== */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-container {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h2 {
  font-size: 18px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.modal-footer {
  padding: 16px 20px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.field-group {
  margin-bottom: 16px;
}

.field-group label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 6px;
  color: #666;
}

.field-group input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
}

.field-group input.field-auto {
  background: #f0f4f8;
  color: #1e293b;
  font-weight: 500;
  border-color: #cbd5e1;
}

.field-group input:focus {
  outline: none;
  border-color: #6a11cb;
  box-shadow: 0 0 0 2px rgba(106, 17, 203, 0.1);
}

.field-divider {
  font-size: 12px;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 20px 0 12px 0;
  padding-top: 12px;
  border-top: 1px solid #eee;
}

.searchable-select {
  position: relative;
  width: 100%;
}

.search-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  background: white;
}

.search-input:focus {
  outline: none;
  border-color: #6a11cb;
  box-shadow: 0 0 0 2px rgba(106, 17, 203, 0.1);
}

.dropdown-list {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 10;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.dropdown-item {
  padding: 10px 12px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f5f5f5;
}

.dropdown-item:hover {
  background: #f0f4f8;
}

.emp-name {
  font-weight: 500;
  color: #1e293b;
}

.emp-id {
  font-size: 12px;
  color: #94a3b8;
}

.selected-display {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  margin-top: 8px;
  background: #f0fdf4;
  border: 1px solid #86efac;
  border-radius: 8px;
}

.clear-btn {
  margin-left: auto;
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  font-size: 16px;
}

.clear-btn:hover {
  color: #ef4444;
}

.cancel-btn {
  padding: 8px 20px;
  background: #e0e0e0;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.save-btn {
  padding: 8px 20px;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.save-btn:hover {
  background: #059669;
}

/* ========== TOAST ========== */
.toast-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1100;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.toast {
  padding: 10px 16px;
  border-radius: 8px;
  color: white;
  font-size: 13px;
  animation: slideIn 0.3s ease;
}

.toast.success {
  background: #10b981;
}

.toast.error {
  background: #ef4444;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* ========== RESPONSIVE ========== */
@media (max-width: 768px) {
  .letter-page {
    padding: 12px;
  }
  .document-wrapper {
    width: 100%;
  }
  .document-content {
    padding-top: 35mm;
    padding-left: 10mm;
    padding-right: 10mm;
    font-size: 15px;
  }
  .right-float-buttons {
    right: 16px;
  }
  .float-btn {
    width: 44px;
    height: 44px;
  }
  .float-btn svg {
    width: 20px;
    height: 20px;
  }
}

/* ========== PRINT ========== */
@media print {
  .right-float-buttons,
  .rich-text-toolbar,
  .modal-overlay,
  .toast-container {
    display: none !important;
  }
  .document-container {
    padding: 0 !important;
    margin: 0 !important;
  }
  .document-content {
    outline: none !important;
  }
}
</style>
