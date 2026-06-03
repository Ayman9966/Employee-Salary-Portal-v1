// src/components/AdminPanel.tsx
import React, { useState, useEffect } from 'react';
import {
  fetchAdminEmployees,
  saveAdminEmployee,
  deleteAdminEmployee,
  fetchAdminSlips,
  saveAdminSlip,
  deleteAdminSlip,
  importAdminData,
  getLocalEmployees,
  getLocalSlips,
  MasterEmployee,
  MasterSlip,
  formatDate
} from '../services/dataService';
import { 
  Users, 
  FileText, 
  Upload, 
  Plus, 
  Edit, 
  Trash2, 
  Globe, 
  AlertTriangle, 
  CheckCircle, 
  ChevronRight, 
  X,
  FileSpreadsheet,
  Download,
  ExternalLink,
  Eye,
  EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatAmount } from '../lib/format';

interface AdminPanelProps {
  onSyncTrigger?: () => void;
  onLogout?: () => void;
}

// Language Translations (English & Arabic)
const t = {
  en: {
    adminTitle: "Enterprise Payroll Control Hub",
    manageEmployees: "Manger Employees",
    manageSlips: "Manage Salary Slips",
    bulkImport: "Bulk CSV Importer",
    searchPlaceholder: "Search by ID, Name or code...",
    addEmployee: "Add Employee",
    editEmployee: "Edit Employee",
    addSlip: "Create Payslip",
    editSlip: "Edit Salary Slip",
    save: "Save Changes",
    cancel: "Cancel",
    delete: "Delete",
    importCsvExcel: "Bilingual Bulk Importer",
    fileUploadDesc: "Upload CSV or drag file here. Arabic & English encodings supported.",
    selectFile: "Choose CSV File",
    chooseLanguage: "Interface Language",
    autoMappedSuccess: "Perfect! All core headers auto-mapped automatically.",
    customMappingRequired: "Some headers need matching. Select from your file's columns below:",
    columnMapping: "Column Mapping Matrix",
    field: "System Field",
    matchedColumn: "Uploaded File Header",
    earningsColumns: "Select Earnings Columns (ER_)",
    deductionsColumns: "Select Deductions Columns (DE_)",
    previewData: "Interactive File Preview (First 5 Rows)",
    importBtn: "Confirm & Commit To Ledger",
    accessCode: "Access Code",
    employeeId: "Employee ID",
    employeeName: "Employee Name",
    month: "Month",
    year: "Year",
    amount: "Net Pay Amount",
    paymentDate: "Payment Date",
    status: "Status",
    daysPayable: "Days Payable",
    comments: "Comments / Notes",
    jobTitle: "Job Title",
    department: "Department",
    joiningDate: "Joining Date",
    actions: "Actions",
    noData: "No data available in this view.",
    totalEmployees: "Total Workforce",
    totalSlips: "Total Slips",
    unmapped: "-- Unmapped --",
    processed: "Processed",
    underReview: "Under Review",
    successImport: "Successfully imported {count} records!",
    invalidFile: "Failed to read file. Please verify it is a valid CSV format.",
    earningAmtDesc: "Any selected column value will be counted as earning",
    deductionAmtDesc: "Any selected column value will be subtracted as deduction",
    bulkMethod: "Select Import Schema",
    methodEmployee: "Import Employee Database (MasterData)",
    methodSlips: "Import Payroll Slips (Pay slip)",
    exportAsCsv: "Download Active Template (CSV)"
  },
  ar: {
    adminTitle: "لوحة تحكم إدارة رواتب الموظفين",
    manageEmployees: "شؤون الموظفين",
    manageSlips: "إدارة قسائم الرواتب",
    bulkImport: "مستورد البيانات الجماعي",
    searchPlaceholder: "بحث برمز الدخول، الاسم أو الرقم الوظيفي...",
    addEmployee: "إضافة موظف جديد",
    editEmployee: "تعديل بيانات موظف",
    addSlip: "إنشاء قسيمة راتب",
    editSlip: "تعديل قسيمة راتب",
    save: "حفظ التغييرات",
    cancel: "إلغاء",
    delete: "حذف",
    importCsvExcel: "المستورد الذكي ثنائي اللغة",
    fileUploadDesc: "قم برفع ملف CSV أو سحبه هنا. يدعم جميع ترميزات النصوص العربية والإنجليزية.",
    selectFile: "اختيار ملف CSV",
    chooseLanguage: "لغة لوحة التحكم",
    autoMappedSuccess: "رائع! تم التعرف والمطابقة على الأعمدة الأساسية تلقائياً.",
    customMappingRequired: "بعض الحقول بحاجة للمطابقة. يرجى تحديد الأعمدة المقابلة لها أدناه:",
    columnMapping: "شجرة مطابقة أعمدة البيانات",
    field: "الحقل المطلوب بالبرنامج",
    matchedColumn: "اسم عمود الملف المرفق",
    earningsColumns: "حدد أعمدة مستحقات الموظف (ER)",
    deductionsColumns: "حدد أعمدة استقطاعات وخصومات الموظف (DE)",
    previewData: "معاينة البيانات في الملف (أول 5 صفوف)",
    importBtn: "تأكيد ودمج بقاعدة البيانات",
    accessCode: "كود الدخول للبرنامج",
    employeeId: "الرقم الوظيفي",
    employeeName: "اسم الموظف بالكامل",
    month: "الشهر",
    year: "السنة المالية",
    amount: "صافي الراتب المستحق",
    paymentDate: "تاريخ دفع الراتب",
    status: "حالة القسيمة",
    daysPayable: "أيام العمل المدفوعة",
    comments: "أية ملاحظات أو توجيهات",
    jobTitle: "المسمى الوظيفي",
    department: "القسم أو الإدارة",
    joiningDate: "تاريخ التعيين والمباشرة",
    actions: "الإجراءات المتاحة",
    noData: "لا توجد بيانات مسجلة في هذا القسم حالياً.",
    totalEmployees: "إجمالي القوة العاملة",
    totalSlips: "إجمالي القسائم الصادرة",
    unmapped: "-- غير محدد --",
    processed: "معتمد (PROCESSED)",
    underReview: "تحت المراجعة (UNDER REVIEW)",
    successImport: "تم بنجاح استيراد عدد {count} سجل لقاعدة البيانات!",
    invalidFile: "فشل في قراءة الملف المرفق. يرجى التأكد من اختيار ملف بصيغة CSV صحيحة.",
    earningAmtDesc: "أي قيمة للعمود المحدد سيتم إضافتها كمستحق للموظف",
    deductionAmtDesc: "أي قيمة للعمود المحدد سيتم طرحها كاستقطاع أو خصم",
    bulkMethod: "حدد الغرض من المستورد المجمع",
    methodEmployee: "استيراد قاعدة الموظفين (MasterData)",
    methodSlips: "استيراد قسائم الرواتب (Pay slip)",
    exportAsCsv: "تحميل القالب النموذجي (CSV)"
  }
};

const MONTHS_LIST = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export const AdminPanel: React.FC<AdminPanelProps> = ({ onSyncTrigger, onLogout }) => {
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const [activeSubTab, setActiveSubTab] = useState<'employees' | 'slips' | 'import' | 'invite'>('employees');
  const [inviteCopied, setInviteCopied] = useState(false);
  
  // Database state
  const [employees, setEmployees] = useState<MasterEmployee[]>([]);
  const [slips, setSlips] = useState<MasterSlip[]>([]);
  const [isDatabaseLoading, setIsDatabaseLoading] = useState(false);
  
  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState("");
  
  // Feedback modals & alerts
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Forms states
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<MasterEmployee | null>(null);
  const [employeeFormData, setEmployeeFormData] = useState({
    accessCode: '',
    employeeId: '',
    name: '',
    title: '',
    department: '',
    joiningDate: ''
  });

  const [showSlipForm, setShowSlipForm] = useState(false);
  const [editingSlip, setEditingSlip] = useState<{slip: MasterSlip, index: number} | null>(null);
  const [slipFormData, setSlipFormData] = useState({
    accessCode: '',
    employeeId: '',
    employeeName: '',
    month: 'March',
    year: 2026,
    amount: 0,
    paymentDate: '',
    status: 'Processed',
    daysPayable: 30,
    comments: '',
    earnings: [] as { label: string; val: number }[],
    deductions: [] as { label: string; val: number }[]
  });

  // Bulk Import state
  const [importSchema, setImportSchema] = useState<'employees' | 'slips'>('slips');
  const [importFileHeaders, setImportFileHeaders] = useState<string[]>([]);
  const [importFileRows, setImportFileRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [selectedEarningsCols, setSelectedEarningsCols] = useState<string[]>([]);
  const [selectedDeductionsCols, setSelectedDeductionsCols] = useState<string[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  // New Earnings/Deduction entry for slips form
  const [newEarningLabel, setNewEarningLabel] = useState("");
  const [newEarningVal, setNewEarningVal] = useState("");
  const [newDeductionLabel, setNewDeductionLabel] = useState("");
  const [newDeductionVal, setNewDeductionVal] = useState("");

  // Custom app alert/confirm state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
  } | null>(null);

  const [revealedAccessCodes, setRevealedAccessCodes] = useState<Record<string, boolean>>({});
  const [previewSlipItem, setPreviewSlipItem] = useState<MasterSlip | null>(null);
  const [showAuditModal, setShowAuditModal] = useState(false);

  const checkSlipMath = (slip: MasterSlip) => {
    const totalEr = (slip.earnings || []).reduce((sum, item) => sum + Number(item.val || 0), 0);
    const totalDe = (slip.deductions || []).reduce((sum, item) => sum + Number(item.val || 0), 0);
    return Math.abs(totalEr - totalDe - slip.amount) < 0.1;
  };

  const getSlipMathAuditDetails = (slip: MasterSlip) => {
    const totalEr = (slip.earnings || []).reduce((sum, item) => sum + Number(item.val || 0), 0);
    const totalDe = (slip.deductions || []).reduce((sum, item) => sum + Number(item.val || 0), 0);
    const calculatedNet = totalEr - totalDe;
    const diff = calculatedNet - slip.amount;
    const isValid = Math.abs(diff) < 0.1;
    return {
      totalEr,
      totalDe,
      calculatedNet,
      diff,
      isValid
    };
  };

  const totalMismatchedSlips = slips.filter(s => !checkSlipMath(s));

  const handleShowSingleMismatchAlert = (slip: MasterSlip) => {
    const totalEr = (slip.earnings || []).reduce((sum, item) => sum + Number(item.val || 0), 0);
    const totalDe = (slip.deductions || []).reduce((sum, item) => sum + Number(item.val || 0), 0);
    const calculatedNet = totalEr - totalDe;
    const diff = calculatedNet - slip.amount;

    const msg = lang === 'en'
      ? `Salary slip for ${slip.employeeName} in ${slip.month} ${slip.year} contains a math discrepancy!
      
• Stated Net Pay: ${formatAmount(slip.amount)}
• Gross Earnings: ${formatAmount(totalEr)}
• Total Deductions: ${formatAmount(totalDe)}
• True Calculated Net Pay (Earnings - Deductions): ${formatAmount(calculatedNet)}

Discrepancy: ${formatAmount(Math.abs(diff))} (${diff > 0 ? "Stated amount is too low" : "Stated amount is too high"}).

Would you like to recalculate and update this slip's Net Pay automatically?`
      : `قسيمة راتب ${slip.employeeName} لشهر ${slip.month} ${slip.year} تحتوي على خطأ حسابي!

• صافي الراتب المسجل: ${formatAmount(slip.amount)}
• إجمالي المستحقات: ${formatAmount(totalEr)}
• إجمالي الخصومات: ${formatAmount(totalDe)}
• صافي الراتب الحقيقي (المستحقات - الخصومات): ${formatAmount(calculatedNet)}

الفارق الحسابي: ${formatAmount(Math.abs(diff))} (${diff > 0 ? "صافي الراتب المسجل منخفض جداً" : "صافي الراتب المسجل مرتفع جداً"}).

هل ترغب في إعادة حساب وتحديث صافي الراتب لهذه القسيمة تلقائياً؟`;

    triggerConfirm(
      lang === 'en' ? "Calculation Audit Fix" : "تعديل تدقيق الحسابات",
      msg,
      async () => {
        setIsDatabaseLoading(true);
        try {
          const updatedSlip: MasterSlip = {
            ...slip,
            amount: calculatedNet
          };
          const success = await saveAdminSlip(updatedSlip, slip.accessCode, slip.month, slip.year);
          if (success) {
            triggerFeedback(lang === 'en' ? "Slip math fixed successfully!" : "تم مطابقة وتعديل الحساب بنجاح!", "success");
            await loadDatabase();
            if (onSyncTrigger) onSyncTrigger();
          } else {
            triggerFeedback("Failed to update Google Sheet", "error");
          }
        } catch (err) {
          triggerFeedback("Error updating slip math", "error");
        } finally {
          setIsDatabaseLoading(false);
        }
      },
      'warning'
    );
  };

  const handleAutoFixAllMismatches = async () => {
    setIsDatabaseLoading(true);
    let fixedCount = 0;
    try {
      const updatedSlips = slips.map(slip => {
        const totalEr = (slip.earnings || []).reduce((sum, item) => sum + Number(item.val || 0), 0);
        const totalDe = (slip.deductions || []).reduce((sum, item) => sum + Number(item.val || 0), 0);
        const calculatedNet = totalEr - totalDe;
        if (Math.abs(calculatedNet - slip.amount) >= 0.1) {
          fixedCount++;
          return {
            ...slip,
            amount: calculatedNet
          };
        }
        return slip;
      });

      if (fixedCount === 0) {
        triggerFeedback(lang === 'en' ? "No calculation mismatches found!" : "لا يوجد أي أخطاء حسابية حالياً!", "success");
        setIsDatabaseLoading(false);
        return;
      }

      const success = await importAdminData(employees, updatedSlips);
      if (success) {
        triggerFeedback(
          lang === 'en' 
            ? `Successfully audited & auto-corrected ${fixedCount} compensation slips!` 
            : `تم تدقيق وتصحيح عدد ${fixedCount} قسيمة رواتب بنجاح!`, 
          "success"
        );
        setShowAuditModal(false);
        await loadDatabase();
        if (onSyncTrigger) onSyncTrigger();
      } else {
        triggerFeedback("Database commit failed", "error");
      }
    } catch (err) {
      triggerFeedback("Error correcting calculations", "error");
    } finally {
      setIsDatabaseLoading(false);
    }
  };

  const triggerConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    type: 'danger' | 'warning' | 'info' = 'warning'
  ) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      onConfirm,
      type
    });
  };

  const isRtl = lang === 'ar';

  // Load database
  const loadDatabase = async () => {
    setIsDatabaseLoading(true);
    try {
      const emps = await fetchAdminEmployees();
      const slps = await fetchAdminSlips();
      setEmployees(emps);
      setSlips(slps);
    } catch (e) {
      console.error(e);
    } finally {
      setIsDatabaseLoading(false);
    }
  };

  useEffect(() => {
    loadDatabase();
  }, []);

  // Filter lists based on search
  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.accessCode.includes(searchQuery) ||
    emp.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSlips = slips.filter(slip => 
    slip.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    slip.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    slip.month.toLowerCase().includes(searchQuery.toLowerCase()) ||
    slip.year.toString().includes(searchQuery)
  );

  const triggerFeedback = (message: string, type: 'success' | 'error') => {
    setFeedback({ message, type });
    setTimeout(() => {
      setFeedback(null);
    }, 4000);
  };

  // CRUD FOR EMPLOYEES
  const openAddEmployee = () => {
    setEditingEmployee(null);
    setEmployeeFormData({
      accessCode: '',
      employeeId: '',
      name: '',
      title: '',
      department: '',
      joiningDate: formatDate(new Date())
    });
    setShowEmployeeForm(true);
  };

  const openEditEmployee = (emp: MasterEmployee) => {
    setEditingEmployee(emp);
    setEmployeeFormData({
      accessCode: emp.accessCode,
      employeeId: emp.employeeId,
      name: emp.name,
      title: emp.title,
      department: emp.department,
      joiningDate: emp.joiningDate
    });
    setShowEmployeeForm(true);
  };

  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeFormData.accessCode || !employeeFormData.employeeId || !employeeFormData.name) {
      triggerFeedback("Please fill required fields", "error");
      return;
    }

    setIsDatabaseLoading(true);
    try {
      if (editingEmployee) {
        // Edit
        if (editingEmployee.accessCode !== employeeFormData.accessCode) {
          await deleteAdminEmployee(editingEmployee.accessCode);
        }
        const success = await saveAdminEmployee(employeeFormData);
        if (success) {
          triggerFeedback(lang === 'en' ? "Employee updated successfully!" : "تم تحديث بيانات الموظف بنجاح!", "success");
        } else {
          triggerFeedback("Google Sheet update failed", "error");
        }
      } else {
        // Create - check duplicate code/id
        if (employees.some(emp => emp.accessCode === employeeFormData.accessCode)) {
          triggerFeedback(lang === 'en' ? "Access Code already exists!" : "كود الدخول هذا مسجل بالفعل!", "error");
          setIsDatabaseLoading(false);
          return;
        }
        const success = await saveAdminEmployee(employeeFormData);
        if (success) {
          triggerFeedback(lang === 'en' ? "New Employee registered!" : "تم تسجيل موظف جديد بنجاح!", "success");
        } else {
          triggerFeedback("Google Sheet register failed", "error");
        }
      }
    } catch (err) {
      triggerFeedback("Operation failed.", "error");
    } finally {
      await loadDatabase();
      setShowEmployeeForm(false);
      setIsDatabaseLoading(false);
      if (onSyncTrigger) onSyncTrigger();
    }
  };

  const handleDeleteEmployee = async (accessCode: string) => {
    triggerConfirm(
      lang === 'en' ? "Delete Employee" : "حذف موظف",
      lang === 'en' 
        ? "Are you sure you want to delete this employee? This will not delete their historical slips automatically." 
        : "هل أنت متأكد من رغبتك في حذف هذا الموظف؟ لن يتم مسح قسائمه التاريخية.",
      async () => {
        setIsDatabaseLoading(true);
        try {
          await deleteAdminEmployee(accessCode);
          triggerFeedback(lang === 'en' ? "Employee profile removed" : "تم حذف ملف الموظف", "success");
          await loadDatabase();
          if (onSyncTrigger) onSyncTrigger();
        } catch (err) {
          triggerFeedback("Failed to delete employee", "error");
        } finally {
          setIsDatabaseLoading(false);
        }
      },
      'danger'
    );
  };

  // CRUD FOR SLIPS
  const openAddSlip = () => {
    setEditingSlip(null);
    setSlipFormData({
      accessCode: '',
      employeeId: '',
      employeeName: '',
      month: 'March',
      year: new Date().getFullYear(),
      amount: 0,
      paymentDate: formatDate(new Date()),
      status: 'Processed',
      daysPayable: 30,
      comments: '',
      earnings: [
        { label: 'Basic Salary', val: 0 },
        { label: 'House Rent', val: 0 },
        { label: 'Transport', val: 0 }
      ],
      deductions: [
        { label: 'Income Tax', val: 0 },
        { label: 'Social Security', val: 0 }
      ]
    });
    setNewEarningLabel("");
    setNewEarningVal("");
    setNewDeductionLabel("");
    setNewDeductionVal("");
    setShowSlipForm(true);
  };

  const openEditSlip = (slip: MasterSlip, index: number) => {
    setEditingSlip({ slip, index });
    setSlipFormData({
      accessCode: slip.accessCode,
      employeeId: slip.employeeId,
      employeeName: slip.employeeName,
      month: slip.month,
      year: slip.year,
      amount: slip.amount,
      paymentDate: slip.paymentDate,
      status: slip.status,
      daysPayable: slip.daysPayable,
      comments: slip.comments,
      earnings: [...slip.earnings],
      deductions: [...slip.deductions]
    });
    setNewEarningLabel("");
    setNewEarningVal("");
    setNewDeductionLabel("");
    setNewDeductionVal("");
    setShowSlipForm(true);
  };

  // Sync slip employee details when selection or accessCode updates
  const handleSlipEmployeeSelect = (code: string) => {
    const matched = employees.find(e => e.accessCode === code);
    if (matched) {
      setSlipFormData(prev => ({
        ...prev,
        accessCode: code,
        employeeId: matched.employeeId,
        employeeName: matched.name
      }));
    }
  };

  const addDynamicEarning = () => {
    if (newEarningLabel && newEarningVal) {
      setSlipFormData(prev => ({
        ...prev,
        earnings: [...prev.earnings, { label: newEarningLabel, val: parseFloat(newEarningVal) || 0 }]
      }));
      setNewEarningLabel("");
      setNewEarningVal("");
    }
  };

  const addDynamicDeduction = () => {
    if (newDeductionLabel && newDeductionVal) {
      setSlipFormData(prev => ({
        ...prev,
        deductions: [...prev.deductions, { label: newDeductionLabel, val: parseFloat(newDeductionVal) || 0 }]
      }));
      setNewDeductionLabel("");
      setNewDeductionVal("");
    }
  };

  const deleteEarning = (lbl: string) => {
    setSlipFormData(prev => ({
      ...prev,
      earnings: prev.earnings.filter(e => e.label !== lbl)
    }));
  };

  const deleteDeduction = (lbl: string) => {
    setSlipFormData(prev => ({
      ...prev,
      deductions: prev.deductions.filter(d => d.label !== d.label) // filter by index or label
    }));
  };

  const handleSaveSlip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slipFormData.accessCode || !slipFormData.employeeId || !slipFormData.employeeName) {
      triggerFeedback("Please select an employee profile first.", "error");
      return;
    }

    // Calculated Net amount
    const totalEr = slipFormData.earnings.reduce((s, x) => s + (x.val || 0), 0);
    const totalDe = slipFormData.deductions.reduce((s, x) => s + (x.val || 0), 0);
    const finalAmount = totalEr - totalDe;

    const finalSlip: MasterSlip = {
      ...slipFormData,
      amount: finalAmount
    };

    setIsDatabaseLoading(true);
    try {
      let success = false;
      if (editingSlip) {
        // Edit at specified index
        success = await saveAdminSlip(
          finalSlip,
          editingSlip.slip.accessCode,
          editingSlip.slip.month,
          editingSlip.slip.year
        );
        if (success) {
          triggerFeedback(lang === 'en' ? "Payslip updated successfully!" : "تم تحديث قسيمة الراتب بنجاح!", "success");
        } else {
          triggerFeedback("Google Sheet slip update failed", "error");
        }
      } else {
        // Create new
        success = await saveAdminSlip(finalSlip);
        if (success) {
          triggerFeedback(lang === 'en' ? "New Payslip issued!" : "تم إصدار قسيمة راتب جديدة!", "success");
        } else {
          triggerFeedback("Google Sheet slip creation failed", "error");
        }
      }
    } catch (err) {
      triggerFeedback("Operation failed.", "error");
    } finally {
      await loadDatabase();
      setShowSlipForm(false);
      setIsDatabaseLoading(false);
      if (onSyncTrigger) onSyncTrigger();
    }
  };

  const handleDeleteSlip = async (index: number) => {
    // index matches the filteredSlips array
    const slipToDelete = filteredSlips[index];
    if (!slipToDelete) return;

    triggerConfirm(
      lang === 'en' ? "Void Payslip" : "إلغاء قسيمة راتب",
      lang === 'en' ? "Are you sure you want to void/delete this payslip?" : "هل أنت متأكد من رغبتك في حذف أو إلغاء قسيمة الراتب هذه؟",
      async () => {
        setIsDatabaseLoading(true);
        try {
          await deleteAdminSlip(slipToDelete.accessCode, slipToDelete.month, slipToDelete.year);
          triggerFeedback(lang === 'en' ? "Payslip removed from ledger" : "تم إلغاء وحذف قسيمة الراتب", "success");
          await loadDatabase();
          if (onSyncTrigger) onSyncTrigger();
        } catch (err) {
          triggerFeedback("Failed to void payslip", "error");
        } finally {
          setIsDatabaseLoading(false);
        }
      },
      'danger'
    );
  };

  // ----------------------------------------------------
  // INTELLIGENT BILINGUAL CSV parser & Mapper Engine
  // ----------------------------------------------------

  const parseCsvAndPopulate = (text: string) => {
    if (!text.trim()) return;

    // Split rows, filtering empty lines
    const rawRows = text.split(/\r?\n/).map(row => row.trim()).filter(row => row.length > 0);
    if (rawRows.length < 2) {
      triggerFeedback(t[lang].invalidFile, "error");
      return;
    }

    // Auto detect separation char: English commas vs Arab/French semicolons
    const firstRow = rawRows[0];
    const commasCount = (firstRow.match(/,/g) || []).length;
    const semicolonsCount = (firstRow.match(/;/g) || []).length;
    const separator = commasCount >= semicolonsCount ? ',' : ';';

    // Parse CSV helper function handling quotes
    const parseCSVRow = (rowStr: string): string[] => {
      const result: string[] = [];
      let index = 0;
      let inQuotes = false;
      let currentVal = '';

      while (index < rowStr.length) {
        const char = rowStr[index];

        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === separator && !inQuotes) {
          result.push(currentVal.trim());
          currentVal = '';
        } else {
          currentVal += char;
        }
        index++;
      }
      result.push(currentVal.trim());
      return result;
    };

    const headers = parseCSVRow(rawRows[0]).map(h => h.replace(/^"|"$/g, '').trim());
    const dataRows = rawRows.slice(1).map(row => parseCSVRow(row).map(v => v.replace(/^"|"$/g, '').trim()));

    setImportFileHeaders(headers);
    setImportFileRows(dataRows);

    // Dynamic Header Dictionary (English/Arabic)
    const matchingRules: Record<string, string[]> = {
      employeeId: ['employee id', 'employeeid', 'id', 'emp_id', 'الرقم الوظيفي', 'رقم الموظف', 'كود الموظف', 'معرف الموظف', 'الرقم'],
      employeeName: ['employee name', 'employeename', 'name', 'emp_name', 'الاسم', 'اسم الموظف', 'الاسم بالكامل', 'اسم'],
      accessCode: ['access code', 'accesscode', 'code', 'كود الدخول', 'رمز الدخول', 'رمز السري', 'الرمز', 'كلمة المرور', 'الباسورد'],
      month: ['month', 'الشهر', 'شهر'],
      year: ['year', 'السنة', 'السنوات', 'عام', 'سنة'],
      amount: ['amount', 'netpay', 'net_pay', 'net', 'الصافي', 'صافي الراتب', 'القيمة', 'المبلغ', 'الراتب المستحق'],
      paymentDate: ['payment date', 'payment_date', 'date', 'تاريخ الدفع', 'تاريخ الصرف', 'التاريخ', 'تاريخ المباشرة', 'تاريخ التعيين'],
      status: ['status', 'الحالة', 'حالة قسيمة'],
      daysPayable: ['days payable', 'days_payable', 'days', 'أيام العمل', 'الأيام المستحقة', 'أيام', 'الايام الفعلية'],
      comments: ['comments', 'comment', 'notes', 'ملاحظات', 'ملاحظة', 'التعليق', 'توجيهات'],
      jobTitle: ['job title', 'jobtitle', 'title', 'المسمى الوظيفي', 'الوظيفة', 'المنصب'],
      department: ['department', 'dept', 'القسم', 'الإدارة', 'الادارة']
    };

    // Auto matching calculation
    const autoMaps: Record<string, string> = {};
    headers.forEach(h => {
      const lowerH = h.toLowerCase().trim();
      // Try mapping to core headers
      for (const [key, aliases] of Object.entries(matchingRules)) {
        if (aliases.some(alias => lowerH.includes(alias.toLowerCase())) && !autoMaps[key]) {
          autoMaps[key] = h;
          break;
        }
      }
    });

    setMapping(autoMaps);

    // Auto-detect dynamic Earnings and Deductions columns based on prefixes or keywords
    const detectEr: string[] = [];
    const detectDe: string[] = [];
    headers.forEach(h => {
      const lowerH = h.toLowerCase();
      // Check for prefixes or translation keywords
      if (lowerH.startsWith('er_') || lowerH.includes('earning') || lowerH.includes('بدل') || lowerH.includes('حوافز') || lowerH.includes('عمولة') || lowerH.includes('اضافي')) {
        detectEr.push(h);
      } else if (lowerH.startsWith('de_') || lowerH.includes('deduction') || lowerH.includes('خصم') || lowerH.includes('استقطاع') || lowerH.includes('تأمين') || lowerH.includes('ضرائب')) {
        detectDe.push(h);
      }
    });
    setSelectedEarningsCols(detectEr);
    setSelectedDeductionsCols(detectDe);

    triggerFeedback(lang === 'en' ? "File analyzed successfully!" : "تم قراءة المكونات والبيانات من الملف بنجاح!", "success");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      parseCsvAndPopulate(text);
    };
    reader.readAsText(file, "UTF-8");
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        parseCsvAndPopulate(text);
      };
      reader.readAsText(file, "UTF-8");
    }
  };

  const handleCommitImport = async () => {
    if (importFileRows.length === 0) return;

    setIsDatabaseLoading(true);
    let importCount = 0;

    try {
      if (importSchema === 'employees') {
        const currentList = [...employees];
        
        importFileRows.forEach(row => {
          const rowAccessCode = row[importFileHeaders.indexOf(mapping['accessCode'])] || '';
          const rowEmpId = row[importFileHeaders.indexOf(mapping['employeeId'])] || '';
          const rowName = row[importFileHeaders.indexOf(mapping['employeeName'])] || '';

          if (rowAccessCode && rowEmpId && rowName) {
            const newEmp: MasterEmployee = {
              accessCode: rowAccessCode,
              employeeId: rowEmpId,
              name: rowName,
              title: row[importFileHeaders.indexOf(mapping['jobTitle'])] || 'Staff Member',
              department: row[importFileHeaders.indexOf(mapping['department'])] || 'Operations',
              joiningDate: row[importFileHeaders.indexOf(mapping['paymentDate'])] || formatDate(new Date())
            };

            // Overwrite existing employee or insert new one
            const matchIdx = currentList.findIndex(e => e.accessCode === rowAccessCode);
            if (matchIdx >= 0) {
              currentList[matchIdx] = newEmp;
            } else {
              currentList.push(newEmp);
            }
            importCount++;
          }
        });

        const success = await importAdminData(currentList, slips);
        if (!success) {
          triggerFeedback("Google Sheet import failed", "error");
        }

      } else {
        // Import Payslips
        const currentSlips = [...slips];

        importFileRows.forEach(row => {
          const rowAccessCode = row[importFileHeaders.indexOf(mapping['accessCode'])] || '';
          const rowEmpId = row[importFileHeaders.indexOf(mapping['employeeId'])] || '';
          const rowName = row[importFileHeaders.indexOf(mapping['employeeName'])] || '';
          const rowMonth = row[importFileHeaders.indexOf(mapping['month'])] || 'March';
          const rowYear = parseInt(row[importFileHeaders.indexOf(mapping['year'])] || '2026') || 2026;

          if (rowAccessCode && rowEmpId) {
            // Dyn Earnings & Deductions
            const earningsList: { label: string; val: number }[] = [];
            const deductionsList: { label: string; val: number }[] = [];

            selectedEarningsCols.forEach(col => {
              const val = parseFloat(row[importFileHeaders.indexOf(col)] || '0') || 0;
              if (val !== 0) {
                earningsList.push({
                  label: col.replace('ER_', '').replace(/_/g, ' '),
                  val
                });
              }
            });

            selectedDeductionsCols.forEach(col => {
              const val = parseFloat(row[importFileHeaders.indexOf(col)] || '0') || 0;
              if (val !== 0) {
                deductionsList.push({
                  label: col.replace('DE_', '').replace(/_/g, ' '),
                  val
                });
              }
            });

            const totalEr = earningsList.reduce((s, x) => s + x.val, 0);
            const totalDe = deductionsList.reduce((s, x) => s + x.val, 0);
            
            let rowAmount = parseFloat(row[importFileHeaders.indexOf(mapping['amount'])] || '0') || 0;
            if (rowAmount === 0) {
              rowAmount = totalEr - totalDe;
            }

            const newSlip: MasterSlip = {
              accessCode: rowAccessCode,
              employeeId: rowEmpId,
              employeeName: rowName || 'Employee Name',
              month: rowMonth,
              year: rowYear,
              amount: rowAmount,
              paymentDate: row[importFileHeaders.indexOf(mapping['paymentDate'])] || formatDate(new Date()),
              status: row[importFileHeaders.indexOf(mapping['status'])] || 'Processed',
              daysPayable: parseInt(row[importFileHeaders.indexOf(mapping['daysPayable'])] || '30') || 30,
              comments: row[importFileHeaders.indexOf(mapping['comments'])] || 'System bulk loader record update.',
              earnings: earningsList,
              deductions: deductionsList
            };

            // Override if already exists matching month/year/accessCode, otherwise unshift
            const dupIdx = currentSlips.findIndex(s => s.accessCode === rowAccessCode && s.month === rowMonth && s.year === rowYear);
            if (dupIdx >= 0) {
              currentSlips[dupIdx] = newSlip;
            } else {
              currentSlips.unshift(newSlip);
            }
            importCount++;
          }
        });

        const success = await importAdminData(employees, currentSlips);
        if (!success) {
          triggerFeedback("Google Sheet import failed", "error");
        }
      }

      triggerFeedback(t[lang].successImport.replace('{count}', String(importCount)), "success");
    } catch (err) {
      triggerFeedback("Import failed", "error");
    } finally {
      await loadDatabase();
      // Reset importer states
      setImportFileHeaders([]);
      setImportFileRows([]);
      setMapping({});
      setSelectedEarningsCols([]);
      setSelectedDeductionsCols([]);
      setIsDatabaseLoading(false);
      if (onSyncTrigger) onSyncTrigger();
    }
  };

  const downloadSampleTemplate = () => {
    let headers: string[] = [];
    let mockupRow: string[] = [];

    if (importSchema === 'employees') {
      headers = ['Access Code', 'Employee ID', 'Employee Name', 'Job Title', 'Department', 'joining Date'];
      mockupRow = ['1234', 'ARC001', 'Alexander Sterling', 'Principal Architect', 'Technology', '12/01/2022'];
    } else {
      headers = [
        'Access Code', 'Employee ID', 'Employee Name', 'Month', 'Year', 'Amount', 'Payment Date', 
        'Status', 'Days Payable', 'Comments', 'ER_Basic_Salary', 'ER_House_Rent', 'ER_Performance_Bonus', 'DE_Income_Tax', 'DE_Social_Security'
      ];
      mockupRow = [
        '1234', 'ARC001', 'Alexander Sterling', 'March', '2026', '9450', '01/03/2026', 
        'Processed', '30', 'Excellent work', '7500', '1500', '1000', '600', '300'
      ];
    }

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + headers.join(',') + "\n"
      + mockupRow.join(',');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${importSchema}_template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`p-1 ${isRtl ? 'rtl text-right' : 'ltr text-left'}`} style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
      
      {/* Header Panel with Stats & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-primary flex flex-wrap items-center gap-2">
            <Users className="w-6 h-6 text-primary-container" />
            {t[lang].adminTitle}
            {isDatabaseLoading && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs bg-primary/10 text-primary border border-primary/20 rounded-full font-mono animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                {lang === 'en' ? 'Syncing Google Sheets...' : 'جاري المزامنة مع Google Sheets...'}
              </span>
            )}
          </h1>
          <p className="text-caption text-secondary mt-1">
            {lang === 'en' 
              ? "Modify parameters, issue compensation details, and batch-map corporate documents perfectly." 
              : "تعديل البيانات وإصدار قسائم الرواتب الفردية واستيراد ومطابقة الملفات الذكية بسهولة ميسرة."}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 items-center w-full md:w-auto">
          {/* Lanuage Switcher */}
          <button 
            type="button"
            onClick={() => setLang(prev => prev === 'en' ? 'ar' : 'en')}
            className="flex items-center justify-center w-9 h-9 bg-white border border-[#D1E1F5] rounded-xl text-primary hover:bg-slate-50 transition-colors cursor-pointer"
            title={lang === 'en' ? 'Switch to Arabic' : 'تغيير اللغة إلى الإنجليزية'}
          >
            <Globe className="w-4 h-4" />
          </button>

          {/* Logout Button */}
          <button 
            type="button"
            onClick={() => {
              if (onLogout) {
                onLogout();
              } else {
                localStorage.removeItem('access_code');
                window.location.reload();
              }
            }}
            className="flex items-center gap-1.5 px-3 h-9 bg-white border border-red-200 rounded-xl text-red-600 hover:bg-red-50 transition-colors cursor-pointer text-caption font-bold"
            title={lang === 'en' ? 'Logout' : 'تسجيل الخروج'}
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            <span>{lang === 'en' ? 'Logout' : 'خروج'}</span>
          </button>
        </div>
      </div>

      {/* Admin stats dashboard banner */}
      <div className="grid grid-cols-2 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white border border-blue-50 p-4 rounded-xl shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-primary">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-caption font-bold text-secondary uppercase tracking-wider">{t[lang].totalEmployees}</p>
            <p className="text-xl font-bold text-primary">{employees.length}</p>
          </div>
        </div>

        <div className="bg-white border border-blue-50 p-4 rounded-xl shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-700">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-caption font-bold text-secondary uppercase tracking-wider">{t[lang].totalSlips}</p>
            <p className="text-xl font-bold text-green-700">{slips.length}</p>
          </div>
        </div>
      </div>

      {/* Primary feedback strip */}
      {feedback && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`px-4 py-3 rounded-xl mb-6 text-sm flex items-center gap-2.5 shadow-sm border ${
            feedback.type === 'success' 
              ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
              : 'bg-red-50 border-red-100 text-red-800'
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" /> : <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />}
          <p className="font-semibold">{feedback.message}</p>
        </motion.div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 mb-6 font-medium text-xs md:text-sm">
        <button 
          onClick={() => { setActiveSubTab('employees'); setSearchQuery(''); }}
          className={`flex items-center gap-2 pb-3 px-4 border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'employees' 
              ? 'border-primary text-primary font-bold' 
              : 'border-transparent text-secondary hover:text-primary'
          }`}
        >
          <Users className="w-4 h-4" />
          {t[lang].manageEmployees}
        </button>

        <button 
          onClick={() => { setActiveSubTab('slips'); setSearchQuery(''); }}
          className={`flex items-center gap-2 pb-3 px-4 border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'slips' 
              ? 'border-primary text-primary font-bold' 
              : 'border-transparent text-secondary hover:text-primary'
          }`}
        >
          <FileText className="w-4 h-4" />
          {t[lang].manageSlips}
        </button>

        <button 
          onClick={() => { setActiveSubTab('import'); setSearchQuery(''); }}
          className={`flex items-center gap-2 pb-3 px-4 border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'import' 
              ? 'border-primary text-primary font-bold' 
              : 'border-transparent text-secondary hover:text-primary'
          }`}
        >
          <Upload className="w-4 h-4" />
          {t[lang].bulkImport}
        </button>

        <button 
          onClick={() => { setActiveSubTab('invite'); setSearchQuery(''); }}
          className={`flex items-center gap-2 pb-3 px-4 border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'invite' 
              ? 'border-primary text-primary font-bold' 
              : 'border-transparent text-secondary hover:text-primary'
          }`}
        >
          <ExternalLink className="w-4 h-4" />
          {lang === 'en' ? 'Invite Team' : 'دعوة فريق'}
        </button>
      </div>

      {/* Search Filter Strip (shown for lists) */}
      {(activeSubTab !== 'import' && activeSubTab !== 'invite') && (
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-center mb-6">
          <input 
            type="text"
            placeholder={t[lang].searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:max-w-xs h-11 px-4 border border-slate-200 rounded-xl bg-white text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm"
          />

          {activeSubTab === 'employees' ? (
            <button 
              onClick={openAddEmployee}
              className="w-full sm:w-auto h-11 bg-primary text-white font-bold rounded-xl px-5 flex items-center justify-center gap-2 shadow-md shadow-primary/10 hover:bg-primary-container active:scale-95 transition-all text-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              {t[lang].addEmployee}
            </button>
          ) : (
            <button 
              onClick={openAddSlip}
              className="w-full sm:w-auto h-11 bg-primary text-white font-bold rounded-xl px-5 flex items-center justify-center gap-2 shadow-md shadow-primary/10 hover:bg-primary-container active:scale-95 transition-all text-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              {t[lang].addSlip}
            </button>
          )}
        </div>
      )}

      {/* VIEW PANEL 1: MANAGE EMPLOYEES */}
      {activeSubTab === 'employees' && (
        <div className="bg-white rounded-xl border border-[#D1E1F5] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs md:text-sm">
              <thead className="bg-[#E9F2FF] text-primary border-b border-blue-100 font-bold">
                <tr>
                  <th className="px-4 py-3 text-right" style={{ direction: isRtl ? 'rtl' : 'ltr' }}>{t[lang].accessCode}</th>
                  <th className="px-4 py-3">{t[lang].employeeId}</th>
                  <th className="px-4 py-3">{t[lang].employeeName}</th>
                  <th className="px-4 py-3">{t[lang].jobTitle}</th>
                  <th className="px-4 py-3">{t[lang].department}</th>
                  <th className="px-4 py-3">{t[lang].joiningDate}</th>
                  <th className="px-4 py-3 text-center">{t[lang].actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-secondary font-medium">{t[lang].noData}</td>
                  </tr>
                ) : (
                  filteredEmployees.map((emp) => {
                    const isRevealed = !!revealedAccessCodes[emp.accessCode];
                    return (
                      <tr 
                        key={emp.accessCode} 
                        onClick={() => setRevealedAccessCodes(prev => ({ ...prev, [emp.accessCode]: !prev[emp.accessCode] }))}
                        className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                        title={lang === 'en' ? "Click row to show/hide access code" : "انقر على الصف لإظهار/إخفاء كود الدخول"}
                      >
                        <td className="px-4 py-3 font-mono font-bold text-primary" style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
                          <div className={`flex items-center gap-1.5 ${isRtl ? 'justify-end' : 'justify-start'}`}>
                            {isRevealed ? (
                              <>
                                <Eye className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                                <span className="text-secondary select-all text-xs font-bold">{emp.accessCode}</span>
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                <span className="text-slate-300 blur-xs select-none selection:bg-transparent text-xs">{emp.accessCode}</span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-700">{emp.employeeId}</td>
                        <td className="px-4 py-3 font-semibold text-on-surface">{emp.name}</td>
                        <td className="px-4 py-3 text-slate-600">{emp.title}</td>
                        <td className="px-4 py-3">
                          <span className="px-2.5 py-1 text-caption bg-blue-50 text-blue-700 rounded-full font-semibold">
                            {emp.department}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 font-medium">{emp.joiningDate}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-center items-center gap-1.5">
                            <a 
                              href={`${window.location.origin}${window.location.pathname}?ref=${emp.accessCode}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="p-1.5 hover:bg-blue-50 text-slate-500 rounded-lg hover:text-primary transition-colors cursor-pointer flex items-center justify-center animate-pulse hover:animate-none"
                              title={lang === 'en' ? "Open Portal (Autologin)" : "فتح البوابة (دخول تلقائي)"}
                              id={`autologin-link-${emp.accessCode}`}
                            >
                              <ExternalLink className="w-4 h-4 text-blue-600" />
                            </a>
                            <button 
                              onClick={(e) => { e.stopPropagation(); openEditEmployee(emp); }}
                              className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-lg hover:text-primary transition-colors cursor-pointer"
                              title={t[lang].editEmployee}
                              id={`edit-emp-${emp.accessCode}`}
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDeleteEmployee(emp.accessCode); }}
                              className="p-1.5 hover:bg-red-50 text-slate-400 rounded-lg hover:text-error transition-colors cursor-pointer"
                              title={t[lang].delete}
                              id={`delete-emp-${emp.accessCode}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW PANEL 2: MANAGE PAYSLIPS */}
      {activeSubTab === 'slips' && (
        <div className="space-y-4">
          {totalMismatchedSlips.length > 0 && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xs">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sm">
                    {lang === 'en' 
                      ? `Math Audit Warning: ${totalMismatchedSlips.length} Payslip(s) have calculation discrepancies!` 
                      : `تحذير تدقيق الحسابات: ${totalMismatchedSlips.length} من مسيرات الرواتب بها أخطاء حسابية!`}
                  </p>
                  <p className="text-xs text-rose-700 mt-1">
                    {lang === 'en'
                      ? "The saved Net Pay value does not match (Gross Earnings - Total Deductions) for some records. This can be caused by manual edits or incorrect import values."
                      : "صافي الراتب المسجل غير متوافق مع معادلة (إجمالي المستحقات - إجمالي الخصومات) لبعض السجلات. قد يعود هذا لتعديلات يدوية أو قيم مستوردة خاطئة."}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAuditModal(true)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-lg text-xs transition-colors shadow-sm cursor-pointer whitespace-nowrap self-end sm:self-auto"
              >
                {lang === 'en' ? "Open Audits Panel" : "لوحة التدقيق والتصحيح"}
              </button>
            </div>
          )}

          <div className="bg-white rounded-xl border border-[#D1E1F5] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs md:text-sm">
                <thead className="bg-[#E9F2FF] text-primary border-b border-blue-100 font-bold">
                  <tr>
                    <th className="px-4 py-3">{t[lang].employeeName}</th>
                    <th className="px-4 py-3">{t[lang].employeeId}</th>
                    <th className="px-4 py-3">{t[lang].month}</th>
                    <th className="px-4 py-3">{t[lang].year}</th>
                    <th className="px-4 py-3">{t[lang].amount}</th>
                    <th className="px-4 py-3">{t[lang].paymentDate}</th>
                    <th className="px-4 py-3">{t[lang].status}</th>
                    <th className="px-4 py-3 text-center">{t[lang].actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSlips.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-secondary font-medium">{t[lang].noData}</td>
                    </tr>
                  ) : (
                    filteredSlips.map((slip, i) => {
                      const hasMathErr = !checkSlipMath(slip);
                      return (
                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3 font-semibold text-on-surface">{slip.employeeName}</td>
                          <td className="px-4 py-3 font-bold text-slate-600">#{slip.employeeId}</td>
                          <td className="px-4 py-3 text-slate-700 font-mono">{slip.month}</td>
                          <td className="px-4 py-3 font-medium text-slate-500">{slip.year}</td>
                          <td className="px-4 py-3 font-bold text-primary">
                            <div className="flex items-center gap-1.5">
                              <span>{formatAmount(slip.amount)}</span>
                              {hasMathErr && (
                                <span 
                                  className="inline-flex items-center gap-0.5 text-[9px] text-rose-750 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded-md cursor-pointer animate-pulse"
                                  title={lang === 'en' ? "Audit discrepancy found. Click to fix math." : "فارق حسابي مكتشف. انقر للتصحيح."}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleShowSingleMismatchAlert(slip);
                                  }}
                                >
                                  <AlertTriangle className="w-3 h-3 text-rose-500" />
                                  <span>{lang === 'en' ? "Mismatch" : "خطأ حسابي"}</span>
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-500 font-medium">{slip.paymentDate}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2.5 py-1 rounded-full text-caption font-bold ${
                              slip.status.toLowerCase() === 'processed' 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              {slip.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-center items-center gap-1.5">
                              <button 
                                onClick={() => setPreviewSlipItem(slip)}
                                className="p-1.5 hover:bg-emerald-50 text-emerald-600 rounded-lg hover:text-emerald-700 transition-colors cursor-pointer"
                                title={lang === 'en' ? "Preview Payslip" : "معاينة قسيمة الراتب"}
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => openEditSlip(slip, i)}
                                className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-lg hover:text-primary transition-colors cursor-pointer"
                                title={t[lang].editSlip}
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteSlip(i)}
                                className="p-1.5 hover:bg-red-50 text-slate-400 rounded-lg hover:text-error transition-colors cursor-pointer"
                                title={t[lang].delete}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW PANEL 3: INTELLIGENT BILINGUAL MAPPED BULK IMPORTER */}
      {activeSubTab === 'import' && (
        <div className="space-y-6">
          <div className="bg-white border border-[#D1E1F5] p-5 rounded-xl shadow-xs">
            <h3 className="font-bold text-[#041b3c] text-sm md:text-base border-b pb-3 mb-4">{t[lang].bulkMethod}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label 
                className={`p-4 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                  importSchema === 'employees' 
                    ? 'border-primary bg-blue-50/50' 
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input 
                  type="radio" 
                  name="importSchema" 
                  checked={importSchema === 'employees'}
                  onChange={() => { setImportSchema('employees'); setImportFileHeaders([]); setImportFileRows([]); }}
                  className="accent-primary" 
                />
                <div>
                  <p className="font-bold text-sm text-[#041b3c]">{t[lang].methodEmployee}</p>
                  <p className="text-caption text-secondary mt-0.5">Maps and registers access code, ID, department & join dates.</p>
                </div>
              </label>

              <label 
                className={`p-4 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                  importSchema === 'slips' 
                    ? 'border-primary bg-blue-50/50' 
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input 
                  type="radio" 
                  name="importSchema" 
                  checked={importSchema === 'slips'}
                  onChange={() => { setImportSchema('slips'); setImportFileHeaders([]); setImportFileRows([]); }}
                  className="accent-primary" 
                />
                <div>
                  <p className="font-bold text-sm text-[#041b3c]">{t[lang].methodSlips}</p>
                  <p className="text-caption text-secondary mt-0.5 font-sans">Batch imports and matches payments with customizable complex column structures.</p>
                </div>
              </label>
            </div>
          </div>

          <div className="w-full">
            
            {/* Standard file drag handler */}
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                isDragOver ? 'border-primary bg-blue-50/30' : 'border-slate-300 bg-white shadow-xs'
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4 text-primary">
                <Upload className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-sm text-on-surface">{t[lang].importCsvExcel}</h4>
              <p className="text-secondary text-xs mt-1 max-w-xs mx-auto">{t[lang].fileUploadDesc}</p>
              
              <div className="mt-4">
                <input 
                  type="file" 
                  accept=".csv" 
                  id="csv-file-picker"
                  onChange={handleFileUpload} 
                  className="hidden" 
                />
                <button
                  onClick={() => document.getElementById('csv-file-picker')?.click()}
                  className="bg-primary hover:bg-primary-container text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer"
                >
                  {t[lang].selectFile}
                </button>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex justify-center gap-2">
                <button 
                  onClick={downloadSampleTemplate}
                  className="flex items-center gap-1 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs px-3 py-1.5 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  {t[lang].exportAsCsv}
                </button>
              </div>
            </div>
          </div>

          {/* MAPPING COMPONENT STEP (Visible once file/text analyzed) */}
          {importFileHeaders.length > 0 && (
            <div className="bg-white border border-[#D1E1F5] rounded-xl overflow-hidden shadow-xs">
              <div className="bg-[#E9F2FF] p-4 border-b border-blue-100">
                <h3 className="font-bold text-primary text-sm flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5" />
                  {t[lang].columnMapping}
                </h3>
                <p className="text-xs text-secondary mt-1">
                  We scanned {importFileHeaders.length} headers. Map system parameters to corresponding headers from your uploaded file carefully.
                </p>
              </div>

              <div className="p-5 space-y-6">
                
                {/* Visual feedback warning */}
                <div className="p-3.5 rounded-lg text-xs bg-amber-50 border border-amber-100 text-amber-800 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">{t[lang].customMappingRequired}</span>
                  </div>
                </div>

                {/* Relational Table Mapping System */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl">
                  {Object.keys(importSchema === 'employees' ? {
                    accessCode: '', employeeId: '', employeeName: '', jobTitle: '', department: '', paymentDate: ''
                  } : {
                    accessCode: '', employeeId: '', employeeName: '', month: '', year: '', amount: '', paymentDate: '', status: '', daysPayable: '', comments: ''
                  }).map(fieldKey => {
                    // Title conversion
                    let fieldLabel = t[lang][fieldKey as keyof typeof t['en']];
                    return (
                      <div key={fieldKey} className="flex justify-between items-center gap-4 bg-white p-2.5 rounded-lg border border-slate-100">
                        <span className="text-xs font-bold text-slate-700">{fieldLabel}</span>
                        <select 
                          value={mapping[fieldKey] || ''}
                          onChange={(e) => setMapping(prev => ({ ...prev, [fieldKey]: e.target.value }))}
                          className="text-xs border rounded px-2 py-1 max-w-[180px] bg-white text-slate-700 focus:ring-1 focus:ring-primary outline-none"
                        >
                          <option value="">{t[lang].unmapped}</option>
                          {importFileHeaders.map(col => <option key={col} value={col}>{col}</option>)}
                        </select>
                      </div>
                    );
                  })}
                </div>

                {/* EARNINGS AND DEDUCTIONS COLUMN MULTI-SELECT MATRIX */}
                {importSchema === 'slips' && (
                  <div className="space-y-6">
                    <div className="border border-slate-100 bg-emerald-50/20 p-4 rounded-xl">
                      <h4 className="text-emerald-800 font-bold text-xs flex items-center gap-1 mb-1">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        {t[lang].earningsColumns}
                      </h4>
                      <p className="text-caption text-emerald-700 mb-3">{t[lang].earningAmtDesc}</p>
                      
                      <div className="flex flex-wrap gap-2">
                        {importFileHeaders.map(col => {
                          const isSelected = selectedEarningsCols.includes(col);
                          return (
                            <button
                              key={col}
                              onClick={() => {
                                setSelectedEarningsCols(prev => isSelected ? prev.filter(x => x !== col) : [...prev, col]);
                              }}
                              className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-all cursor-pointer ${
                                isSelected 
                                  ? 'bg-emerald-600 text-white border-emerald-600' 
                                  : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300'
                              }`}
                            >
                              {col}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="border border-slate-100 bg-red-50/20 p-4 rounded-xl">
                      <h4 className="text-red-800 font-bold text-xs flex items-center gap-1 mb-1">
                        <X className="w-4 h-4 text-rose-600" />
                        {t[lang].deductionsColumns}
                      </h4>
                      <p className="text-caption text-red-600 mb-3">{t[lang].deductionAmtDesc}</p>
                      
                      <div className="flex flex-wrap gap-2">
                        {importFileHeaders.map(col => {
                          const isSelected = selectedDeductionsCols.includes(col);
                          return (
                            <button
                              key={col}
                              onClick={() => {
                                setSelectedDeductionsCols(prev => isSelected ? prev.filter(x => x !== col) : [...prev, col]);
                              }}
                              className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-all cursor-pointer ${
                                isSelected 
                                  ? 'bg-red-600 text-white border-red-600' 
                                  : 'bg-white text-slate-600 border-slate-200 hover:border-red-300'
                              }`}
                            >
                              {col}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* PREVIEW COMPONENT TABLE */}
                <div className="border border-slate-100 rounded-xl overflow-hidden bg-white">
                  <div className="bg-slate-50 text-slate-700 font-bold text-xs px-4 py-2.5 border-b">{t[lang].previewData}</div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-[#f8fafc] text-secondary font-bold">
                        <tr>
                          {importFileHeaders.slice(0, 6).map((h, idx) => <th key={idx} className="px-3 py-2 border-b border-r text-xs">{h}</th>)}
                          {importFileHeaders.length > 6 && <th className="px-3 py-2 border-b border-r text-xs">...</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {importFileRows.slice(0, 4).map((row, rIdx) => (
                          <tr key={rIdx}>
                            {row.slice(0, 6).map((val, cIdx) => <td key={cIdx} className="px-3 py-2 border-r text-xs font-sans text-slate-600">{val || '‎-'}</td>)}
                            {row.length > 6 && <td className="px-3 py-2 border-r text-xs text-slate-400">...</td>}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Confirm import layout button */}
                <button 
                  onClick={handleCommitImport}
                  className="w-full h-12 bg-primary text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-primary-container font-sans active:scale-[0.98] transition-all shadow-md text-sm cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4" />
                  {t[lang].importBtn}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW PANEL 4: TEAM PROVISIONING & WORKSPACE INVITE */}
      {activeSubTab === 'invite' && (
        <div className="space-y-6">
          <div className="bg-white border border-[#D1E1F5] p-6 rounded-xl shadow-xs">
            <h3 className="font-bold text-[#041b3c] text-sm md:text-base border-b pb-3 mb-4 flex items-center gap-2">
              <ExternalLink className="w-5 h-5 text-primary" />
              <span>{lang === 'en' ? 'Team Provisioning & Invitation' : 'تهيئة وإرسال دعوات الفريق'}</span>
            </h3>
            
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              {lang === 'en' 
                ? 'Generate a unique onboarding link for this workspace. When team members or other workforce administrators open this link, their system connects immediately with your specific Google Apps Script configuration, ensuring perfect multi-tenant data isolation.'
                : 'أنشئ رابط انضمام فريدًا لبيئة العمل هذه. عند قيام الموظفين أو مسؤولي النظام بفتح هذا الرابط، سيتصل نظامهم مباشرة بعنوان Google Apps Script الخاص بك، مما يضمن عزل البيانات بشكل كامل.'}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Company Info Block */}
              <div className="bg-slate-50 border border-slate-100 p-5 rounded-xl space-y-4">
                <h4 className="font-bold text-[#041b3c] text-xs uppercase tracking-wider">
                  {lang === 'en' ? 'Active Company Instance' : 'بيانات الشركة الحالية'}
                </h4>
                
                <div className="space-y-3 font-medium text-xs">
                  <div className="flex justify-between py-1.5 border-b border-slate-200/50">
                    <span className="text-slate-400">{lang === 'en' ? 'Company Name' : 'اسم الشركة'}</span>
                    <span className="text-slate-800 font-bold">{localStorage.getItem('company_name') || 'Default Enterprise'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-200/50">
                    <span className="text-slate-400">{lang === 'en' ? 'Company Size' : 'حجم الشركة'}</span>
                    <span className="text-slate-800 font-semibold">{localStorage.getItem('company_size') || '0-10 Members'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-200/50">
                    <span className="text-slate-400">{lang === 'en' ? 'Admin Email' : 'بريد المدير'}</span>
                    <span className="text-slate-800">{localStorage.getItem('company_email') || '-'}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-400">{lang === 'en' ? 'WhatsApp' : 'واتساب'}</span>
                    <span className="text-slate-800">{localStorage.getItem('company_whatsapp') || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Invitation Generator Block */}
              <div className="border border-slate-200 p-5 rounded-xl flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-[#041b3c] text-xs uppercase tracking-wider mb-2">
                    {lang === 'en' ? 'Workspace Link' : 'رابط بيئة العمل'}
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
                    {lang === 'en' 
                      ? 'Send this URL to employees to immediately initialize their device with your GAS endpoint.' 
                      : 'أرسل هذا الرابط للموظفين لربط أجهزتهم تلقائيًا وبشكل مباشر بنظام إدخال البيانات.'}
                  </p>
                </div>

                {(() => {
                  const companyName = localStorage.getItem('company_name') || 'Workspace';
                  const gasUrl = localStorage.getItem('gas_url') || '';
                  const email = localStorage.getItem('company_email') || '';
                  const whatsapp = localStorage.getItem('company_whatsapp') || '';
                  const companySize = localStorage.getItem('company_size') || '';
                  
                  const obj = { companyName, gasUrl, email, whatsapp, companySize };
                  const b64 = btoa(encodeURIComponent(JSON.stringify(obj)));
                  const inviteLink = `${window.location.origin}${window.location.pathname}?invite=${b64}`;
                  
                  const handleCopy = () => {
                    navigator.clipboard.writeText(inviteLink);
                    setInviteCopied(true);
                    setTimeout(() => setInviteCopied(false), 2000);
                  };

                  return (
                    <div className="space-y-3">
                      <div className="bg-slate-50 font-mono text-[10px] p-3 rounded-lg border border-slate-100 text-slate-500 select-all overflow-hidden text-ellipsis whitespace-nowrap">
                        {inviteLink}
                      </div>

                      <button 
                        onClick={handleCopy}
                        className="w-full h-10 bg-primary hover:bg-[#062450] text-white font-bold rounded-lg flex items-center justify-center gap-1.5 font-sans active:scale-[0.98] transition-all text-xs cursor-pointer"
                      >
                        <CheckCircle className={`w-4 h-4 ${inviteCopied ? 'text-emerald-300' : 'text-slate-200'}`} />
                        {inviteCopied 
                          ? (lang === 'en' ? 'Copied Link!' : 'تم نسخ الرابط!') 
                          : (lang === 'en' ? 'Copy Workspace Link' : 'نسخ رابط بيئة العمل')}
                      </button>
                    </div>
                  );
                })()}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          MODAL 1: EMPLOYEE CREATE & UPDATE FORM
          ---------------------------------------------------- */}
      {showEmployeeForm && (
        <div className="fixed inset-0 bg-[#041b3c]/60 backdrop-blur-xs z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg bg-white rounded-2xl overflow-hidden shadow-2xl border"
          >
            <div className="bg-[#E9F2FF] px-6 py-4 border-b border-blue-100 flex justify-between items-center">
              <h2 className="text-base md:text-lg font-bold text-primary">
                {editingEmployee ? t[lang].editEmployee : t[lang].addEmployee}
              </h2>
              <button 
                onClick={() => setShowEmployeeForm(false)}
                className="text-slate-500 hover:text-black hover:bg-slate-100 p-1.5 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEmployee} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-caption font-bold text-secondary uppercase mb-1">{t[lang].accessCode} *</label>
                  <input 
                    type="text"
                    required
                    disabled={!!editingEmployee}
                    value={employeeFormData.accessCode}
                    onChange={(e) => setEmployeeFormData(prev => ({ ...prev, accessCode: e.target.value }))}
                    className="w-full h-11 px-3 border border-slate-200 rounded-xl outline-none focus:border-primary disabled:bg-slate-50 text-slate-800 text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block text-caption font-bold text-secondary uppercase mb-1">{t[lang].employeeId} *</label>
                  <input 
                    type="text"
                    required
                    value={employeeFormData.employeeId}
                    onChange={(e) => setEmployeeFormData(prev => ({ ...prev, employeeId: e.target.value.toUpperCase() }))}
                    className="w-full h-11 px-3 border border-slate-200 rounded-xl outline-none focus:border-primary text-slate-800 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-caption font-bold text-secondary uppercase mb-1">{t[lang].employeeName} *</label>
                <input 
                  type="text"
                  required
                  value={employeeFormData.name}
                  onChange={(e) => setEmployeeFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full h-11 px-3 border border-slate-200 rounded-xl outline-none focus:border-primary text-slate-800 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-caption font-bold text-secondary uppercase mb-1">{t[lang].jobTitle}</label>
                  <input 
                    type="text"
                    value={employeeFormData.title}
                    onChange={(e) => setEmployeeFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full h-11 px-3 border border-slate-200 rounded-xl outline-none focus:border-primary text-slate-800 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-caption font-bold text-secondary uppercase mb-1">{t[lang].department}</label>
                  <input 
                    type="text"
                    value={employeeFormData.department}
                    onChange={(e) => setEmployeeFormData(prev => ({ ...prev, department: e.target.value }))}
                    className="w-full h-11 px-3 border border-slate-200 rounded-xl outline-none focus:border-primary text-slate-800 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-caption font-bold text-secondary uppercase mb-1">{t[lang].joiningDate} (DD/MM/YYYY)</label>
                <input 
                  type="text"
                  value={employeeFormData.joiningDate}
                  onChange={(e) => setEmployeeFormData(prev => ({ ...prev, joiningDate: e.target.value }))}
                  className="w-full h-11 px-3 border border-slate-200 rounded-xl outline-none focus:border-primary text-slate-800 text-sm font-mono"
                  placeholder="e.g. 15/09/2021"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t">
                <button 
                  type="button" 
                  onClick={() => setShowEmployeeForm(false)}
                  className="h-11 px-4 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 font-medium text-xs cursor-pointer"
                >
                  {t[lang].cancel}
                </button>
                <button 
                  type="submit"
                  className="h-11 px-6 bg-primary font-bold text-white rounded-xl hover:bg-primary-container text-xs cursor-pointer"
                >
                  {t[lang].save}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* ----------------------------------------------------
          MODAL 2: PAYSLIP CREATE & UPDATE FORM (DYNAMIC COMPONENT)
          ---------------------------------------------------- */}
      {showSlipForm && (
        <div className="fixed inset-0 bg-[#041b3c]/60 backdrop-blur-xs z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl bg-white rounded-2xl overflow-hidden shadow-2xl border my-8"
          >
            <div className="bg-[#E9F2FF] px-6 py-4 border-b border-blue-100 flex justify-between items-center">
              <h2 className="text-base md:text-lg font-bold text-primary">
                {editingSlip ? t[lang].editSlip : t[lang].addSlip}
              </h2>
              <button 
                onClick={() => setShowSlipForm(false)}
                className="text-slate-500 hover:text-black hover:bg-slate-100 p-1.5 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSlip} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              
              {/* Employee Bind Select */}
              <div>
                <label className="block text-caption font-bold text-secondary uppercase mb-1">Link Employee Profile</label>
                <select 
                  value={slipFormData.accessCode}
                  onChange={(e) => handleSlipEmployeeSelect(e.target.value)}
                  required
                  className="w-full h-11 px-3 border border-slate-200 rounded-xl bg-white outline-none text-slate-800 text-sm focus:border-primary"
                >
                  <option value="">-- Choose Employee (MasterData) --</option>
                  {employees.map(e => <option key={e.accessCode} value={e.accessCode}>{e.name} ({e.employeeId})</option>)}
                </select>
              </div>

              {/* Month & Year parameters */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-caption font-bold text-secondary uppercase mb-1">{t[lang].month}</label>
                  <select
                    value={slipFormData.month}
                    onChange={(e) => setSlipFormData(prev => ({ ...prev, month: e.target.value }))}
                    className="w-full h-11 px-3 border border-slate-200 bg-white rounded-xl text-slate-800 text-sm"
                  >
                    {MONTHS_LIST.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-caption font-bold text-secondary uppercase mb-1">{t[lang].year}</label>
                  <input
                    type="number"
                    required
                    value={slipFormData.year}
                    onChange={(e) => setSlipFormData(prev => ({ ...prev, year: parseInt(e.target.value) || new Date().getFullYear() }))}
                    className="w-full h-11 px-3 border border-slate-200 rounded-xl text-slate-800 text-sm font-mono"
                  />
                </div>
              </div>

              {/* Status and Workdays */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-caption font-bold text-secondary uppercase mb-1">{t[lang].status}</label>
                  <select
                    value={slipFormData.status}
                    onChange={(e) => setSlipFormData(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full h-11 px-3 border border-slate-200 bg-white rounded-xl text-slate-800 text-sm"
                  >
                    <option value="Processed">{t[lang].processed}</option>
                    <option value="Under Review">{t[lang].underReview}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-caption font-bold text-secondary uppercase mb-1">{t[lang].daysPayable}</label>
                  <input
                    type="number"
                    value={slipFormData.daysPayable}
                    onChange={(e) => setSlipFormData(prev => ({ ...prev, daysPayable: parseInt(e.target.value) || 30 }))}
                    className="w-full h-11 px-3 border border-slate-200 rounded-xl text-slate-800 text-sm font-mono"
                  />
                </div>
              </div>

              {/* Payment Date & Comments */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-caption font-bold text-secondary uppercase mb-1">{t[lang].paymentDate} (DD/MM/YYYY)</label>
                  <input
                    type="text"
                    required
                    placeholder="01/03/2026"
                    value={slipFormData.paymentDate}
                    onChange={(e) => setSlipFormData(prev => ({ ...prev, paymentDate: e.target.value }))}
                    className="w-full h-11 px-3 border border-slate-200 rounded-xl text-slate-800 text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block text-caption font-bold text-secondary uppercase mb-1">Comments (Alt+Enter for newline)</label>
                  <input
                    type="text"
                    value={slipFormData.comments}
                    onChange={(e) => setSlipFormData(prev => ({ ...prev, comments: e.target.value }))}
                    className="w-full h-11 px-3 border border-slate-200 rounded-xl text-slate-800 text-sm"
                    placeholder="Optional message..."
                  />
                </div>
              </div>

              {/* DYNAMIC EARNINGS (ER_) SECTION */}
              <div className="border border-slate-100 bg-emerald-50/10 p-4 rounded-xl space-y-3">
                <h4 className="font-bold text-xs text-emerald-800 uppercase tracking-wi">Earnings (ER)</h4>
                
                {/* Visual rendering of earnings items */}
                <div className="space-y-2">
                  {slipFormData.earnings.map((earn, earnIdx) => (
                    <div key={earnIdx} className="flex justify-between items-center bg-white border px-3 py-2 rounded-lg text-xs font-mono text-slate-700">
                      <span className="font-sans font-bold">{earn.label}</span>
                      <div className="flex items-center gap-3">
                        <input 
                          type="number"
                          value={earn.val || ''}
                          placeholder="$"
                          onChange={(e) => {
                            const updated = [...slipFormData.earnings];
                            updated[earnIdx].val = parseFloat(e.target.value) || 0;
                            setSlipFormData(prev => ({ ...prev, earnings: updated }));
                          }}
                          className="w-20 text-right font-bold border-b border-slate-200 outline-none text-slate-800 focus:border-primary"
                        />
                        <button 
                          type="button" 
                          onClick={() => deleteEarning(earn.label)}
                          className="text-slate-400 hover:text-red-500 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add earning inline form row */}
                <div className="flex gap-2 text-xs">
                  <input
                    type="text"
                    placeholder="ERLabel (e.g. Basic Salary, Travel)"
                    value={newEarningLabel}
                    onChange={(e) => setNewEarningLabel(e.target.value)}
                    className="flex-1 h-9 px-2 bg-white border border-slate-200 rounded-lg outline-none text-slate-800"
                  />
                  <input
                    type="number"
                    placeholder="Amount"
                    value={newEarningVal}
                    onChange={(e) => setNewEarningVal(e.target.value)}
                    className="w-16 sm:w-24 h-9 px-2 bg-white border border-slate-200 rounded-lg outline-none font-mono text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={addDynamicEarning}
                    className="h-9 px-3 bg-emerald-600 font-bold hover:bg-emerald-700 text-white rounded-lg cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* DYNAMIC DEDUCTIONS (DE_) SECTION */}
              <div className="border border-slate-100 bg-red-50/10 p-4 rounded-xl space-y-3">
                <h4 className="font-bold text-xs text-red-800 uppercase tracking-wi">Deductions (DE)</h4>
                
                {/* Visual rendering of deductions items */}
                <div className="space-y-2">
                  {slipFormData.deductions.map((ded, dedIdx) => (
                    <div key={dedIdx} className="flex justify-between items-center bg-white border px-3 py-2 rounded-lg text-xs font-mono text-slate-700">
                      <span className="font-sans font-bold text-red-850">{ded.label}</span>
                      <div className="flex items-center gap-3">
                        <input 
                          type="number"
                          value={ded.val || ''}
                          placeholder="$"
                          onChange={(e) => {
                            const updated = [...slipFormData.deductions];
                            updated[dedIdx].val = parseFloat(e.target.value) || 0;
                            setSlipFormData(prev => ({ ...prev, deductions: updated }));
                          }}
                          className="w-20 text-right font-bold border-b border-slate-200 outline-none text-slate-800 focus:border-red-500"
                        />
                        <button 
                          type="button" 
                          onClick={() => deleteDeduction(ded.label)}
                          className="text-slate-400 hover:text-red-500 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add deduction inline form row */}
                <div className="flex gap-2 text-xs">
                  <input
                    type="text"
                    placeholder="DELabel (e.g. Income Tax, Fund)"
                    value={newDeductionLabel}
                    onChange={(e) => setNewDeductionLabel(e.target.value)}
                    className="flex-1 h-9 px-2 bg-white border border-slate-200 rounded-lg outline-none text-slate-800"
                  />
                  <input
                    type="number"
                    placeholder="Amount"
                    value={newDeductionVal}
                    onChange={(e) => setNewDeductionVal(e.target.value)}
                    className="w-16 sm:w-24 h-9 px-2 bg-white border border-slate-200 rounded-lg outline-none font-mono text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={addDynamicDeduction}
                    className="h-9 px-3 bg-red-600 font-bold hover:bg-red-700 text-white rounded-lg cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Master confirmation total layout */}
              <div className="bg-slate-50 p-4 rounded-xl flex justify-between items-center font-bold">
                <span className="text-secondary text-xs uppercase">Est Net Pay total</span>
                <span className="text-xl text-primary">
                  {formatAmount(
                    slipFormData.earnings.reduce((s, x) => s + (x.val || 0), 0) -
                    slipFormData.deductions.reduce((s, x) => s + (x.val || 0), 0)
                  )}
                </span>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t">
                <button 
                  type="button" 
                  onClick={() => setShowSlipForm(false)}
                  className="h-11 px-4 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 font-medium text-xs cursor-pointer"
                >
                  {t[lang].cancel}
                </button>
                <button 
                  type="submit"
                  className="h-11 px-6 bg-primary font-bold text-white rounded-xl hover:bg-primary-container text-xs cursor-pointer"
                >
                  {t[lang].save}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* ----------------------------------------------------
          MODAL 3: CUSTOM CONFIRMATION DIALOG (APP ALERTS)
          ---------------------------------------------------- */}
      {confirmDialog && confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-[#041b3c]/60 backdrop-blur-xs z-[110] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-2xl border border-slate-100"
          >
            <div className={`px-6 py-4 flex justify-between items-center border-b ${
              confirmDialog.type === 'danger' ? 'bg-red-50 border-red-100 text-red-800' : 'bg-blue-50 border-blue-100 text-blue-800'
            }`}>
              <div className="flex items-center gap-2">
                <AlertTriangle className={`w-5 h-5 ${
                  confirmDialog.type === 'danger' ? 'text-red-600' : 'text-primary'
                }`} />
                <h3 className="font-bold text-sm md:text-base">
                  {confirmDialog.title}
                </h3>
              </div>
              <button 
                onClick={() => setConfirmDialog(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6">
              <p className="text-slate-600 text-xs md:text-sm leading-relaxed mb-6 whitespace-pre-line">
                {confirmDialog.message}
              </p>

              <div className="flex gap-3 justify-end">
                <button 
                  type="button" 
                  onClick={() => setConfirmDialog(null)}
                  className="h-9 px-4 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500 font-medium text-xs cursor-pointer"
                >
                  {lang === 'en' ? 'Cancel' : 'إلغاء'}
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    confirmDialog.onConfirm();
                    setConfirmDialog(null);
                  }}
                  className={`h-9 px-5 font-bold text-white rounded-lg text-xs cursor-pointer ${
                    confirmDialog.type === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-primary hover:bg-[#062450]'
                  }`}
                >
                  {lang === 'en' ? 'Confirm' : 'تأكيد'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
      {previewSlipItem && (
        <div className="fixed inset-0 bg-[#041b3c]/60 backdrop-blur-xs z-[105] overflow-y-auto flex justify-center items-start p-4 sm:p-6">
          <motion.div 
            initial={{ opacity: 0, y: 15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="w-full max-w-2xl bg-white rounded-2xl overflow-hidden shadow-2xl border border-slate-100 my-auto sm:my-8"
          >
            {/* Header */}
            <div className={`px-6 py-4 flex justify-between items-center border-b border-light bg-slate-50 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <FileText className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-on-background text-subhead">
                  {lang === 'en' ? 'Salary Payslip Interactive Preview' : 'معاينة تفاعلية لقسيمة الراتب'}
                </h3>
              </div>
              <button 
                onClick={() => setPreviewSlipItem(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Receipt body container */}
            <div className="p-6 md:p-8 space-y-6" style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
              
              {/* Slip Style Header */}
              <div className={`border-b border-dashed border-slate-200 pb-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${isRtl ? 'text-right' : 'text-left'}`}>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className={`px-2 py-0.5 rounded-full text-caption font-bold ${previewSlipItem.status?.toUpperCase() === 'PROCESSED' ? 'bg-emerald-50 text-emerald-700' : 'bg-orange-100 text-orange-600'}`}>
                      {previewSlipItem.status.toUpperCase()}
                    </span>
                  </div>
                  <h2 className="text-display font-medium text-on-background">
                    {previewSlipItem.employeeName}
                  </h2>
                  <p className="text-caption text-secondary mt-1 font-medium font-mono">
                    {lang === 'en' ? 'Employee ID' : 'الرقم الوظيفي'}: #{previewSlipItem.employeeId}
                  </p>
                </div>

                <div className={`bg-blue-50/70 border border-blue-100 p-3 rounded-xl min-w-[150px] ${isRtl ? 'text-right' : 'text-left'}`}>
                  <p className="text-caption font-bold text-primary uppercase tracking-wider mb-0.5">
                    {lang === 'en' ? 'Pay Period' : 'فترة الاستحقاق'}
                  </p>
                  <p className="text-body font-extrabold text-[#041b3c] font-mono">
                    {previewSlipItem.month} {previewSlipItem.year}
                  </p>
                  <p className="text-caption text-secondary mt-1">
                    {lang === 'en' ? 'Days Payable' : 'أيام العمل'}: <span className="font-bold text-on-surface">{previewSlipItem.daysPayable}</span>
                  </p>
                </div>
              </div>

              {/* Earnings & Deductions Tables */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Earnings Table */}
                <div className="bg-white border border-[#E9F2FF] rounded-xl overflow-hidden shadow-sm">
                  <div className="bg-[#E9F2FF] px-4 py-2 flex items-center gap-1.5 border-b border-[#E9F2FF]">
                    <span className="material-symbols-outlined text-primary text-subhead">payments</span>
                    <h4 className="text-caption font-bold text-primary uppercase tracking-wide">
                      {lang === 'en' ? 'Earnings' : 'المستحقات والمزايا'}
                    </h4>
                  </div>
                  <div className="p-4 space-y-2">
                    {previewSlipItem.earnings && previewSlipItem.earnings.length > 0 ? (
                      previewSlipItem.earnings.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-body">
                          <span className="text-on-surface-variant font-medium">{item.label}</span>
                          <span className="font-semibold text-on-background font-mono">{formatAmount(item.val)}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-caption text-slate-400 text-center py-2 italic">
                        {lang === 'en' ? 'No earnings components' : 'لا توجد مستحقات'}
                      </p>
                    )}
                    <hr className="border-t border-slate-100 my-2" />
                    <div className="flex justify-between items-center text-primary text-body font-bold pt-1">
                      <span>{lang === 'en' ? 'Gross Earnings' : 'إجمالي المستحقات'}</span>
                      <span className="font-mono">
                        {formatAmount(
                          (previewSlipItem.earnings || []).reduce((sum, item) => sum + Number(item.val || 0), 0)
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Deductions Table */}
                <div className="bg-white border border-[#f1f3ff] rounded-xl overflow-hidden shadow-sm">
                  <div className="bg-surface-container-low px-4 py-2 flex items-center gap-1.5 border-b border-[#f1f3ff]">
                    <span className="material-symbols-outlined text-error text-subhead">account_balance_wallet</span>
                    <h4 className="text-caption font-bold text-error uppercase tracking-wide">
                      {lang === 'en' ? 'Deductions' : 'الاستقطاعات والخصومات'}
                    </h4>
                  </div>
                  <div className="p-4 space-y-2">
                    {previewSlipItem.deductions && previewSlipItem.deductions.length > 0 ? (
                      previewSlipItem.deductions.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-body">
                          <span className="text-on-surface-variant font-medium">{item.label}</span>
                          <span className="font-semibold text-error font-mono">-{formatAmount(item.val)}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-caption text-slate-400 text-center py-2 italic">
                        {lang === 'en' ? 'No deductions components' : 'لا توجد استقطاعات'}
                      </p>
                    )}
                    <hr className="border-t border-slate-100 my-2" />
                    <div className="flex justify-between items-center text-error text-body font-bold pt-1">
                      <span>{lang === 'en' ? 'Total Deductions' : 'إجمالي الاستقطاعات'}</span>
                      <span className="font-mono">
                        -{formatAmount(
                          (previewSlipItem.deductions || []).reduce((sum, item) => sum + Number(item.val || 0), 0)
                        )}
                      </span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Summary Net Pay Banner */}
              <div className="bg-gradient-to-br from-[#003d9b] to-[#041b3c] text-white p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-3">
                <div className={isRtl ? 'text-right' : 'text-left'}>
                  <p className="text-caption text-blue-200 uppercase tracking-wider font-bold">
                    {lang === 'en' ? 'Net Take-Home Pay (Amount)' : 'صافي الراتب المستحق للصرف'}
                  </p>
                  <p className="text-display font-black mt-1 font-mono text-emerald-300">
                    {formatAmount(previewSlipItem.amount)}
                  </p>
                </div>
                <div className={`text-right text-caption text-blue-100 ${isRtl ? 'text-left sm:text-right' : 'text-right'}`}>
                  <p className="font-semibold">
                    {lang === 'en' ? 'Payment Date' : 'تاريخ الصرف'}: {previewSlipItem.paymentDate}
                  </p>
                </div>
              </div>

              {/* Note Comments Section */}
              {previewSlipItem.comments && (
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
                  <p className="text-caption text-secondary font-bold uppercase mb-1.5">
                    {lang === 'en' ? 'Internal Notes / Slip Comments' : 'تعليقات وملاحظات القسيمة'}
                  </p>
                  <p className="text-body text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {previewSlipItem.comments}
                  </p>
                </div>
              )}

              {/* Action and print info block */}
              <div className={`flex justify-end gap-3 pt-2 border-t border-slate-100 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <button 
                  type="button" 
                  onClick={() => setPreviewSlipItem(null)}
                  className="h-10 px-6 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 font-bold text-caption cursor-pointer transition-colors"
                >
                  {lang === 'en' ? 'Close' : 'إغلاق'}
                </button>
                <button 
                  type="button" 
                  onClick={() => window.print()}
                  className="h-10 px-6 bg-primary hover:bg-[#062450] text-white font-bold rounded-xl text-caption cursor-pointer transition-colors flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  {lang === 'en' ? 'Print Slip' : 'طباعة القسيمة'}
                </button>
              </div>

            </div>
          </motion.div>
        </div>
      )}

      {showAuditModal && (
        <div className="fixed inset-0 bg-[#041b3c]/60 backdrop-blur-xs z-[105] overflow-y-auto flex justify-center items-start p-4 sm:p-6">
          <motion.div 
            initial={{ opacity: 0, y: 15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="w-full max-w-2xl bg-white rounded-2xl overflow-hidden shadow-2xl border border-slate-100 my-auto sm:my-8"
          >
            {/* Header */}
            <div className={`px-6 py-4 flex justify-between items-center border-b border-light bg-slate-50 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <AlertTriangle className="w-5 h-5 text-rose-600 animate-pulse" />
                <h3 className="font-bold text-on-background text-sm sm:text-base">
                  {lang === 'en' ? 'Quality Assurance Calculation Audit' : 'تدقيق ومطابقة العمليات الحسابية لمسيرات الرواتب'}
                </h3>
              </div>
              <button 
                onClick={() => setShowAuditModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto" style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
              <p className="text-slate-500 text-xs leading-relaxed">
                {lang === 'en' 
                  ? 'The automated mathematical audit system detected the following discrepancies between registered Net Pay amounts and calculated totals (Gross Earnings - Total Deductions).'
                  : 'قام نظام التدقيق المالي برصد الفروقات الحسابية التالية بين صافي الرواتب المسلّمة ومجموع المستحقات بعد خصم الاستقطاعات:'}
              </p>

              <div className="space-y-3">
                {totalMismatchedSlips.map((mSlip, mIdx) => {
                  const details = getSlipMathAuditDetails(mSlip);
                  return (
                    <div key={mIdx} className="border border-rose-100 bg-rose-50/20 p-4 rounded-xl space-y-3 shadow-2xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rose-100/40 pb-2">
                        <div>
                          <h4 className="font-extrabold text-[#041b3c] text-xs sm:text-sm">{mSlip.employeeName}</h4>
                          <span className="text-[10px] text-slate-500 font-mono">#{mSlip.employeeId} • {mSlip.month} {mSlip.year}</span>
                        </div>
                        <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 self-start sm:self-auto uppercase">
                          {lang === 'en' ? `Diff: ${formatAmount(Math.abs(details.diff))}` : `الفارق: ${formatAmount(Math.abs(details.diff))}`}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                        <div className="bg-white p-2 rounded-lg border border-slate-100">
                          <p className="text-[9px] text-slate-400 font-bold uppercase">{lang === 'en' ? 'Stated Net Pay' : 'الصافي المسجل'}</p>
                          <p className="text-xs font-black text-slate-800 font-mono mt-0.5">{formatAmount(mSlip.amount)}</p>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-slate-100">
                          <p className="text-[9px] text-emerald-600 font-bold uppercase">{lang === 'en' ? 'Gross Earnings' : 'المستحقات'}</p>
                          <p className="text-xs font-black text-emerald-700 font-mono mt-0.5">+{formatAmount(details.totalEr)}</p>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-slate-100">
                          <p className="text-[9px] text-red-600 font-bold uppercase">{lang === 'en' ? 'Deductions' : 'الخصومات'}</p>
                          <p className="text-xs font-black text-red-700 font-mono mt-0.5">-{formatAmount(details.totalDe)}</p>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-slate-100">
                          <p className="text-[9px] text-primary font-bold uppercase">{lang === 'en' ? 'True Net Pay' : 'الصافي الحسابي'}</p>
                          <p className="text-xs font-black text-primary font-mono mt-0.5">{formatAmount(details.calculatedNet)}</p>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleShowSingleMismatchAlert(mSlip)}
                          className="h-8 px-3 bg-[#E9F2FF] hover:bg-blue-100 text-primary font-bold rounded-lg text-[11px] transition-colors cursor-pointer"
                        >
                          {lang === 'en' ? "Fix Stated Net Pay" : "تصحيح صافي الراتب"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className={`px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3 ${isRtl ? 'sm:flex-row-reverse' : ''}`}>
              <button
                type="button"
                onClick={() => setShowAuditModal(false)}
                className="w-full sm:w-auto h-10 px-6 border border-slate-200 hover:bg-slate-100 font-bold text-slate-600 rounded-xl text-xs transition-colors cursor-pointer"
              >
                {lang === 'en' ? "Close" : "إغلاق"}
              </button>
              
              <button
                type="button"
                onClick={handleAutoFixAllMismatches}
                className="w-full sm:w-auto h-10 px-6 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs transition-all shadow-md shadow-rose-200 cursor-pointer"
              >
                {lang === 'en' ? "Auto-Correct All Math Discrepancies" : "تصحيح كافة الأخطاء الحسابية تلقائياً"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
