// src/services/dataService.ts

export const getGasUrl = (): string => {
  if (typeof window === 'undefined') return '';
  if (localStorage.getItem('is_demo_mode') === 'true') return '';
  return (localStorage.getItem('gas_url') || '').trim();
};

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

export interface AdminLoginResult {
  success: boolean;
  error?: string;
}

export const verifyAdminLogin = async (email: string, password: string): Promise<AdminLoginResult> => {
  const GAS_URL = getGasUrl();
  const normEmail = email.trim().toLowerCase();
  const normPass = password.trim();

  if (GAS_URL) {
    try {
      // Create non-blocking controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8-second safety timeout
      
      const res = await fetch(
        `${GAS_URL}?action=adminLogin&email=${encodeURIComponent(normEmail)}&password=${encodeURIComponent(normPass)}&accessCode=admin`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);
      
      const text = await res.text();
      try {
        const data = JSON.parse(text);
        if (data.success) {
          return { success: true };
        } else {
          return { success: false, error: data.error || 'Invalid admin credentials' };
        }
      } catch {
        // Response wasn't valid JSON, fallback to status
        if (res.status === 200 && text.includes('"success":true')) {
          return { success: true };
        }
        return { success: false, error: 'Database authentication returned unexpected response. Checking local fallback...' };
      }
    } catch (e: any) {
      console.warn('Google Sheets admin login check failed, attempting offline database query:', e);
    }
  }

  // Pre-configured Admin Fallback users
  const localAdmins = [
    { email: 'admin@enterprise.com', password: 'admin123' },
    { email: 'hr@enterprise.com', password: 'hrpass456' }
  ];

  const matched = localAdmins.find(adm => adm.email === normEmail && adm.password === normPass);
  if (matched) {
    return { success: true };
  }

  return { success: false, error: 'Invalid admin email or password' };
};

export interface UserProfile {
  name: string;
  employeeId: string;
  department: string;
  joiningDate: string;
  title?: string;
}

export interface SalarySlip {
  id: string;
  month: string;
  year: number;
  status: string;
  amount: number;
  employeeName: string;
}

export interface PayrollDetails {
  month: string;
  year: number;
  netPay: number;
  paymentDate: string;
  status: string;
  comments: string;
  earnings: { label: string; val: number }[];
  deductions: { label: string; val: number }[];
  grossEarnings: number;
  totalDeductions: number;
  employeeId: string;
  employeeName: string;
  daysPayable: number;
}

export interface DashboardSummary {
  annualNet: number;
  availableYears: number[];
}

export interface MasterEmployee {
  accessCode: string;
  employeeId: string;
  name: string;
  title: string;
  department: string;
  joiningDate: string; // DD/MM/YYYY
}

export interface MasterSlip {
  accessCode: string;
  employeeId: string;
  employeeName: string;
  month: string;
  year: number;
  amount: number;
  paymentDate: string; // DD/MM/YYYY
  status: string; // "processed" | "under review"
  daysPayable: number;
  comments: string;
  earnings: { label: string; val: number }[];
  deductions: { label: string; val: number }[];
}

// ----------------------------------------------------
// LOCAL STORAGE RELATIONAL DATABASE ENGINE
// ----------------------------------------------------

const getAccessCode = () => localStorage.getItem('access_code');

const getCacheKey = (key: string) => {
  const code = getAccessCode();
  return `payslip_cache_${code}_${key}`;
};

export const getFromCache = <T>(key: string): T | null => {
  const fullKey = getCacheKey(key);
  const cached = localStorage.getItem(fullKey);
  if (!cached) return null;
  try {
    return JSON.parse(cached).data as T;
  } catch {
    return null;
  }
};

const saveToCache = (key: string, data: any) => {
  if (!data) return;
  const fullKey = getCacheKey(key);
  localStorage.setItem(fullKey, JSON.stringify({
    data,
    timestamp: Date.now()
  }));
};

export const formatDate = (date: any): string => {
  if (!date) return '';
  if (typeof date === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(date)) return date;
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return date;
  
  const hDay = String(d.getDate()).padStart(2, '0');
  const hMonth = String(d.getMonth() + 1).padStart(2, '0');
  const hYear = d.getFullYear();
  return `${hDay}/${hMonth}/${hYear}`;
};

// Initial Default Dataset
const initialEmployees: MasterEmployee[] = [
  { accessCode: '1234', employeeId: 'ARC001', name: 'Alexander Sterling', title: 'Principal Architect', department: 'Technology', joiningDate: '12/01/2022' },
  { accessCode: '5678', employeeId: 'MNG042', name: 'Elizabeth Vance', title: 'Hr Business Partner', department: 'Human Resources', joiningDate: '05/03/2023' },
  { accessCode: '9012', employeeId: 'FIN088', name: 'Marcus Aurelius', title: 'Financial Controller', department: 'Finance', joiningDate: '15/09/2021' },
  { accessCode: '3456', employeeId: 'OPS202', name: 'Sarah Silverstone', title: 'Operations Director', department: 'Operations', joiningDate: '20/06/2024' },
  { accessCode: '1122', employeeId: 'ENG303', name: 'Julian Casablancas', title: 'Lead Engineer', department: 'Engineering', joiningDate: '10/10/2023' },
  { accessCode: '3344', employeeId: 'DES404', name: 'Fiona Apple', title: 'Senior Product Designer', department: 'Design', joiningDate: '14/02/2023' }
];

const initialSlips: MasterSlip[] = [
  {
    accessCode: '1234',
    employeeId: 'ARC001',
    employeeName: 'Alexander Sterling',
    month: 'March',
    year: 2026,
    amount: 9450,
    paymentDate: '01/03/2026',
    status: 'Processed',
    daysPayable: 30,
    comments: 'Excellent delivery on Project Phoenix.\nKeep up the high standard of architecture work.',
    earnings: [
      { label: 'Basic Salary', val: 7500 },
      { label: 'House Rent', val: 1500 },
      { label: 'Transport', val: 500 },
      { label: 'Performance Bonus', val: 1000 }
    ],
    deductions: [
      { label: 'Income Tax', val: 600 },
      { label: 'Social Security', val: 300 },
      { label: 'Medical Insurance', val: 150 }
    ]
  },
  {
    accessCode: '1234',
    employeeId: 'ARC001',
    employeeName: 'Alexander Sterling',
    month: 'February',
    year: 2026,
    amount: 8400,
    paymentDate: '01/02/2026',
    status: 'Processed',
    daysPayable: 28,
    comments: 'Monthly routine statement.',
    earnings: [
      { label: 'Basic Salary', val: 7500 },
      { label: 'House Rent', val: 1500 },
      { label: 'Transport', val: 500 }
    ],
    deductions: [
      { label: 'Income Tax', val: 550 },
      { label: 'Social Security', val: 400 },
      { label: 'Medical Insurance', val: 150 }
    ]
  },
  {
    accessCode: '5678',
    employeeId: 'MNG042',
    employeeName: 'Elizabeth Vance',
    month: 'March',
    year: 2026,
    amount: 7200,
    paymentDate: '01/03/2026',
    status: 'Processed',
    daysPayable: 30,
    comments: 'Adjustment for annual leave carried over.',
    earnings: [
      { label: 'Basic Salary', val: 6000 },
      { label: 'House Rent', val: 1000 },
      { label: 'Transport', val: 500 },
      { label: 'Performance Bonus', val: 500 }
    ],
    deductions: [
      { label: 'Income Tax', val: 450 },
      { label: 'Social Security', val: 250 },
      { label: 'Medical Insurance', val: 100 }
    ]
  },
  {
    accessCode: '9012',
    employeeId: 'FIN088',
    employeeName: 'Marcus Aurelius',
    month: 'March',
    year: 2026,
    amount: 8800,
    paymentDate: '01/03/2026',
    status: 'Under Review',
    daysPayable: 30,
    comments: 'Pending final audit approval for quarterly audit bonus.',
    earnings: [
      { label: 'Basic Salary', val: 7000 },
      { label: 'House Rent', val: 1500 },
      { label: 'Transport', val: 500 },
      { label: 'Performance Bonus', val: 800 }
    ],
    deductions: [
      { label: 'Income Tax', val: 600 },
      { label: 'Social Security', val: 300 },
      { label: 'Medical Insurance', val: 100 }
    ]
  },
  {
    accessCode: '1122',
    employeeId: 'ENG303',
    employeeName: 'Julian Casablancas',
    month: 'March',
    year: 2026,
    amount: 6500,
    paymentDate: '01/03/2026',
    status: 'Processed',
    daysPayable: 30,
    comments: 'Welcome to the team! Pro-rated bonus applied.',
    earnings: [
      { label: 'Basic Salary', val: 5500 },
      { label: 'House Rent', val: 500 },
      { label: 'Transport', val: 500 },
      { label: 'Performance Bonus', val: 500 }
    ],
    deductions: [
      { label: 'Income Tax', val: 300 },
      { label: 'Social Security', val: 150 },
      { label: 'Medical Insurance', val: 50 }
    ]
  },
  {
    accessCode: '3344',
    employeeId: 'DES404',
    employeeName: 'Fiona Apple',
    month: 'March',
    year: 2026,
    amount: 8200,
    paymentDate: '01/03/2026',
    status: 'Processed',
    daysPayable: 30,
    comments: 'Design system MVP successfully launched.',
    earnings: [
      { label: 'Basic Salary', val: 6500 },
      { label: 'House Rent', val: 1200 },
      { label: 'Transport', val: 500 },
      { label: 'Performance Bonus', val: 500 }
    ],
    deductions: [
      { label: 'Income Tax', val: 500 },
      { label: 'Social Security', val: 200 },
      { label: 'Medical Insurance', val: 100 }
    ]
  }
];

// Helper to get raw DB structures
export const getLocalEmployees = (): MasterEmployee[] => {
  const stored = localStorage.getItem('payslip_db_employees');
  if (!stored) {
    localStorage.setItem('payslip_db_employees', JSON.stringify(initialEmployees));
    return initialEmployees;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return initialEmployees;
  }
};

export const saveLocalEmployees = (employees: MasterEmployee[]) => {
  localStorage.setItem('payslip_db_employees', JSON.stringify(employees));
};

export const getLocalSlips = (): MasterSlip[] => {
  const stored = localStorage.getItem('payslip_db_slips');
  if (!stored) {
    localStorage.setItem('payslip_db_slips', JSON.stringify(initialSlips));
    return initialSlips;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return initialSlips;
  }
};

export const saveLocalSlips = (slips: MasterSlip[]) => {
  localStorage.setItem('payslip_db_slips', JSON.stringify(slips));
};

// Initialize DB on file load
if (!localStorage.getItem('payslip_db_initialized')) {
  localStorage.setItem('payslip_db_employees', JSON.stringify(initialEmployees));
  localStorage.setItem('payslip_db_slips', JSON.stringify(initialSlips));
  localStorage.setItem('payslip_db_initialized', 'true');
}

// ----------------------------------------------------
// REAL GOOGLE SHEETS ADMIN READ & WRITE HANDLERS
// ----------------------------------------------------

export const fetchAdminEmployees = async (): Promise<MasterEmployee[]> => {
  const GAS_URL = getGasUrl();
  if (GAS_URL) {
    try {
      const res = await fetch(`${GAS_URL}?action=getAllEmployees&accessCode=admin`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          saveLocalEmployees(data);
          return data;
        }
      }
    } catch (e) {
      console.error('GAS fetchAdminEmployees failed, fallback to local storage:', e);
    }
  }
  return getLocalEmployees();
};

export const saveAdminEmployee = async (employee: MasterEmployee): Promise<boolean> => {
  const GAS_URL = getGasUrl();
  const current = getLocalEmployees();
  const index = current.findIndex(e => e.accessCode === employee.accessCode);
  if (index !== -1) {
    current[index] = employee;
  } else {
    current.push(employee);
  }
  saveLocalEmployees(current);

  if (GAS_URL) {
    try {
      const res = await fetch(GAS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=UTF-8'
        },
        body: JSON.stringify({
          action: 'saveEmployee',
          employee
        })
      });
      if (res.ok) {
        const r = await res.json();
        return r.success;
      }
    } catch (e) {
      console.error('GAS saveAdminEmployee failed:', e);
    }
  }
  return true;
};

export const deleteAdminEmployee = async (accessCode: string): Promise<boolean> => {
  const GAS_URL = getGasUrl();
  const current = getLocalEmployees().filter(e => e.accessCode !== accessCode);
  saveLocalEmployees(current);

  if (GAS_URL) {
    try {
      const res = await fetch(GAS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=UTF-8'
        },
        body: JSON.stringify({
          action: 'deleteEmployee',
          accessCode
        })
      });
      if (res.ok) {
        const r = await res.json();
        return r.success;
      }
    } catch (e) {
      console.error('GAS deleteAdminEmployee failed:', e);
    }
  }
  return true;
};

export const fetchAdminSlips = async (): Promise<MasterSlip[]> => {
  const GAS_URL = getGasUrl();
  if (GAS_URL) {
    try {
      const res = await fetch(`${GAS_URL}?action=getAllSlips&accessCode=admin`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          saveLocalSlips(data);
          return data;
        }
      }
    } catch (e) {
      console.error('GAS fetchAdminSlips failed, fallback to local storage:', e);
    }
  }
  return getLocalSlips();
};

export const saveAdminSlip = async (
  slip: MasterSlip,
  origAccessCode?: string,
  origMonth?: string,
  origYear?: number
): Promise<boolean> => {
  const GAS_URL = getGasUrl();
  const current = getLocalSlips();
  const matchCode = origAccessCode || slip.accessCode;
  const matchMonth = origMonth || slip.month;
  const matchYear = origYear || slip.year;

  const index = current.findIndex(
    s =>
      s.accessCode === matchCode &&
      s.month.toLowerCase() === matchMonth.toLowerCase() &&
      s.year === matchYear
  );

  if (index !== -1) {
    current[index] = slip;
  } else {
    current.unshift(slip);
  }
  saveLocalSlips(current);

  if (GAS_URL) {
    try {
      const res = await fetch(GAS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=UTF-8'
        },
        body: JSON.stringify({
          action: 'saveSlip',
          slip,
          origAccessCode,
          origMonth,
          origYear
        })
      });
      if (res.ok) {
        const r = await res.json();
        return r.success;
      }
    } catch (e) {
      console.error('GAS saveAdminSlip failed:', e);
    }
  }
  return true;
};

export const deleteAdminSlip = async (accessCode: string, month: string, year: number): Promise<boolean> => {
  const GAS_URL = getGasUrl();
  const current = getLocalSlips().filter(
    s =>
      !(
        s.accessCode === accessCode &&
        s.month.toLowerCase() === month.toLowerCase() &&
        s.year === year
      )
  );
  saveLocalSlips(current);

  if (GAS_URL) {
    try {
      const res = await fetch(GAS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=UTF-8'
        },
        body: JSON.stringify({
          action: 'deleteSlip',
          accessCode,
          month,
          year
        })
      });
      if (res.ok) {
        const r = await res.json();
        return r.success;
      }
    } catch (e) {
      console.error('GAS deleteAdminSlip failed:', e);
    }
  }
  return true;
};

export const importAdminData = async (employees: MasterEmployee[], slips: MasterSlip[]): Promise<boolean> => {
  const GAS_URL = getGasUrl();
  saveLocalEmployees(employees);
  saveLocalSlips(slips);

  if (GAS_URL) {
    try {
      const res = await fetch(GAS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=UTF-8'
        },
        body: JSON.stringify({
          action: 'importData',
          employees,
          slips
        })
      });
      if (res.ok) {
        const r = await res.json();
        return r.success;
      }
    } catch (e) {
      console.error('GAS importAdminData failed:', e);
    }
  }
  return true;
};

// ----------------------------------------------------
// DYNAMIC FETCH INTERCEPTORS (LOCAL-FIRST)
// ----------------------------------------------------

export const fetchProfile = async (): Promise<UserProfile | null> => {
  const GAS_URL = getGasUrl();
  const code = getAccessCode();
  if (!code) return null;

  // Let special master admin override
  if (code.toLowerCase() === 'admin') {
    return {
      name: 'System Administrator',
      employeeId: 'ADMIN001',
      department: 'Corporate Management',
      joiningDate: '01/01/2026',
      title: 'Global HR Administrator'
    };
  }

  // Check local database
  const employees = getLocalEmployees();
  const emp = employees.find(e => e.accessCode === code);
  if (emp) {
    const profileData = {
      name: emp.name,
      employeeId: emp.employeeId,
      department: emp.department,
      joiningDate: formatDate(emp.joiningDate),
      title: emp.title
    };
    saveToCache('profile', profileData);
    return profileData;
  }

  // Fallback to GAS if available
  if (GAS_URL) {
    try {
      const res = await fetch(`${GAS_URL}?action=getProfile&accessCode=${code}`);
      if (!res.ok) throw new NetworkError('Failed to fetch profile');
      const data = await res.json();
      if (data.error) return null;
      if (data.joiningDate) data.joiningDate = formatDate(data.joiningDate);
      saveToCache('profile', data);
      return data;
    } catch (e) {
      console.error('GAS Profile Fetch Failed, using fallback:', e);
    }
  }

  return null;
};

export const fetchSalarySlips = async (): Promise<SalarySlip[]> => {
  const GAS_URL = getGasUrl();
  const code = getAccessCode();
  if (!code) return [];

  if (code.toLowerCase() === 'admin') {
    // Admin sees ALL slips in the database
    const allSlips = getLocalSlips();
    const mapped = allSlips.map((s, idx) => ({
      id: String(idx + 1),
      month: s.month,
      year: s.year,
      status: s.status,
      amount: s.amount,
      employeeName: s.employeeName
    }));
    saveToCache('slips', mapped);
    return mapped;
  }

  const slips = getLocalSlips();
  const filtered = slips.filter(s => s.accessCode === code);
  if (filtered.length > 0) {
    const mapped = filtered.map((s, idx) => ({
      id: String(idx + 1),
      month: s.month,
      year: s.year,
      status: s.status,
      amount: s.amount,
      employeeName: s.employeeName
    })).sort((a, b) => b.year - a.year);
    saveToCache('slips', mapped);
    return mapped;
  }

  if (GAS_URL) {
    try {
      const res = await fetch(`${GAS_URL}?action=getSlips&accessCode=${code}`);
      if (!res.ok) throw new NetworkError('Failed to fetch slips');
      const data = await res.json();
      if (Array.isArray(data)) {
        saveToCache('slips', data);
        return data;
      }
    } catch (e) {
      console.error('GAS Slips Fetch Failed:', e);
    }
  }

  return [];
};

export const fetchPayrollDetails = async (month: string, year: number): Promise<PayrollDetails | null> => {
  const GAS_URL = getGasUrl();
  const code = getAccessCode();
  if (!code) return null;

  const slips = getLocalSlips();
  
  // If admin, find the slip across all employees matching the month & year
  // Otherwise, match accessCode as well
  const slip = slips.find(s => {
    const timeMatch = s.month.toLowerCase() === month.toLowerCase() && s.year === year;
    if (code.toLowerCase() === 'admin') return timeMatch;
    return timeMatch && s.accessCode === code;
  });

  if (slip) {
    const grossEarnings = slip.earnings.reduce((sum, item) => sum + item.val, 0);
    const totalDeductions = slip.deductions.reduce((sum, item) => sum + item.val, 0);
    const detailsData: PayrollDetails = {
      month: slip.month,
      year: slip.year,
      netPay: slip.amount,
      paymentDate: formatDate(slip.paymentDate),
      status: slip.status,
      comments: slip.comments || '',
      earnings: slip.earnings,
      deductions: slip.deductions,
      grossEarnings,
      totalDeductions,
      employeeId: slip.employeeId,
      employeeName: slip.employeeName,
      daysPayable: slip.daysPayable
    };
    saveToCache(`payroll_${month}_${year}`, detailsData);
    return detailsData;
  }

  if (GAS_URL) {
    try {
      const res = await fetch(`${GAS_URL}?action=getPayrollDetails&accessCode=${code}&month=${month}&year=${year}`);
      if (!res.ok) throw new NetworkError('Failed to fetch details');
      const data = await res.json();
      if (data.error) return null;
      if (data.paymentDate) data.paymentDate = formatDate(data.paymentDate);
      saveToCache(`payroll_${month}_${year}`, data);
      return data;
    } catch (e) {
      console.error('GAS Details Fetch Failed:', e);
    }
  }

  return null;
};

export const fetchDashboardSummary = async (year: number): Promise<DashboardSummary> => {
  const GAS_URL = getGasUrl();
  const code = getAccessCode();
  if (!code) return { annualNet: 0, availableYears: [] };

  const slips = getLocalSlips();
  // Filter for admin or current employee
  const userSlips = slips.filter(s => {
    if (code.toLowerCase() === 'admin') return true;
    return s.accessCode === code;
  });

  if (userSlips.length > 0) {
    const yearsSet = new Set<number>();
    let annualNet = 0;
    userSlips.forEach(s => {
      yearsSet.add(s.year);
      if (s.year === year) {
        annualNet += s.amount;
      }
    });

    const summaryData = {
      annualNet,
      availableYears: Array.from(yearsSet).sort((a, b) => b - a)
    };
    saveToCache(`dashboard_${year}`, summaryData);
    return summaryData;
  }

  if (GAS_URL) {
    try {
      const res = await fetch(`${GAS_URL}?action=getDashboard&accessCode=${code}&year=${year}`);
      if (!res.ok) throw new NetworkError('Failed to fetch summary');
      const data = await res.json();
      saveToCache(`dashboard_${year}`, data);
      return data;
    } catch (e) {
      console.error('GAS Dashboard Fetch Failed:', e);
    }
  }

  return { annualNet: 0, availableYears: [new Date().getFullYear()] };
};

export const checkTenantBlockedStatus = async (): Promise<boolean> => {
  const gasUrl = getGasUrl();
  if (!gasUrl) return false;
  
  try {
    const res = await fetch(`/api/check-tenant-status?gasUrl=${encodeURIComponent(gasUrl)}`);
    if (res.ok) {
      const data = await res.json();
      return !!(data && data.blocked);
    }
  } catch (err) {
    console.warn('Super admin access check failed, allowing by default:', err);
  }
  return false;
};

