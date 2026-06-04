// HR Translation Dictionary for Egypt (Earnings & Deductions)
export interface TranslationsEntry {
  category: "Earnings" | "Deductions";
  code: string;
  english_term: string;
  arabic_term: string;
  impact: "Addition" | "Deduction";
}

export const hrDictionary: TranslationsEntry[] = [
  {
    category: "Earnings",
    code: "BASIC",
    english_term: "Basic Salary",
    arabic_term: "الراتب الأساسي",
    impact: "Addition"
  },
  {
    category: "Earnings",
    code: "HRA",
    english_term: "Housing Allowance",
    arabic_term: "بدل سكن",
    impact: "Addition"
  },
  {
    category: "Earnings",
    code: "TRA",
    english_term: "Transport Allowance",
    arabic_term: "بدل انتقال / مواصلات",
    impact: "Addition"
  },
  {
    category: "Earnings",
    code: "OT",
    english_term: "Overtime Pay",
    arabic_term: "أجر الوقت الإضافي",
    impact: "Addition"
  },
  {
    category: "Earnings",
    code: "BONUS",
    english_term: "Performance Bonus",
    arabic_term: "مكافأة أداء",
    impact: "Addition"
  },
  {
    category: "Earnings",
    code: "COMM",
    english_term: "Sales Commission",
    arabic_term: "عمولة مبيعات",
    impact: "Addition"
  },
  {
    category: "Earnings",
    code: "TEL",
    english_term: "Mobile & Data Allowance",
    arabic_term: "بدل هاتف وإنترنت",
    impact: "Addition"
  },
  {
    category: "Earnings",
    code: "SHIFT",
    english_term: "Shift Allowance",
    arabic_term: "بدل وردية / طبيعة عمل",
    impact: "Addition"
  },
  {
    category: "Earnings",
    code: "COLA",
    english_term: "Cost of Living Allowance",
    arabic_term: "بدل غلاء معيشة",
    impact: "Addition"
  },
  {
    category: "Earnings",
    code: "MED_A",
    english_term: "Medical Allowance",
    arabic_term: "بدل طبي / علاجي",
    impact: "Addition"
  },
  {
    category: "Earnings",
    code: "AN_BNS",
    english_term: "Annual Bonus",
    arabic_term: "مكافأة سنوية",
    impact: "Addition"
  },
  {
    category: "Earnings",
    code: "RET_B",
    english_term: "Retention Bonus",
    arabic_term: "مكافأة ولاء / استبقاء",
    impact: "Addition"
  },
  {
    category: "Earnings",
    code: "REIM",
    english_term: "Expense Reimbursement",
    arabic_term: "استرداد مصاريف عمل",
    impact: "Addition"
  },
  {
    category: "Earnings",
    code: "EOSG",
    english_term: "End of Service Gratuity",
    arabic_term: "مكافأة نهاية الخدمة",
    impact: "Addition"
  },
  {
    category: "Earnings",
    code: "HOL_P",
    english_term: "Holiday Pay",
    arabic_term: "أجر العمل أيام العطلات",
    impact: "Addition"
  },
  {
    category: "Deductions",
    code: "SOC_INS",
    english_term: "Social Insurance",
    arabic_term: "التأمينات الاجتماعية",
    impact: "Deduction"
  },
  {
    category: "Deductions",
    code: "TAX",
    english_term: "Income Tax",
    arabic_term: "ضريبة الدخل",
    impact: "Deduction"
  },
  {
    category: "Deductions",
    code: "ABS",
    english_term: "Absence Deduction",
    arabic_term: "خصم غياب",
    impact: "Deduction"
  },
  {
    category: "Deductions",
    code: "UPL",
    english_term: "Unpaid Leave",
    arabic_term: "إجازة غير مدفوعة الأجر",
    impact: "Deduction"
  },
  {
    category: "Deductions",
    code: "LATE",
    english_term: "Late Arrival Penalty",
    arabic_term: "جزاء تأخير",
    impact: "Deduction"
  },
  {
    category: "Deductions",
    code: "LOAN",
    english_term: "Salary Advance / Loan",
    arabic_term: "سداد سلفة / قرض",
    impact: "Deduction"
  },
  {
    category: "Deductions",
    code: "MED_I",
    english_term: "Medical Insurance",
    arabic_term: "تأمين طبي (حصة الموظف)",
    impact: "Deduction"
  },
  {
    category: "Deductions",
    code: "PEN",
    english_term: "Provident Fund / Pension",
    arabic_term: "صندوق التقاعد / الادخار",
    impact: "Deduction"
  },
  {
    category: "Deductions",
    code: "FINE",
    english_term: "Disciplinary Fine",
    arabic_term: "جزاءات تأديبية / مخالفات",
    impact: "Deduction"
  },
  {
    category: "Deductions",
    code: "DMG",
    english_term: "Equipment Damage",
    arabic_term: "خصم إتلاف عهدة",
    impact: "Deduction"
  },
  {
    category: "Deductions",
    code: "UNIF",
    english_term: "Uniform Fee",
    arabic_term: "خصم تكلفة الزي الموحد",
    impact: "Deduction"
  },
  {
    category: "Deductions",
    code: "UNN",
    english_term: "Union Dues",
    arabic_term: "اشتراكات نقابية",
    impact: "Deduction"
  }
];

// Normalize strings for matching (lowercase, strip ER_ / DE_ prefixes, underscores to spaces)
function normalizeTerm(term: string): string {
  if (!term) return "";
  let clean = term.trim().toUpperCase();
  
  // Strip common spreadsheet & db prefixes
  if (clean.startsWith("ER_")) clean = clean.substring(3);
  if (clean.startsWith("DE_")) clean = clean.substring(3);
  if (clean.startsWith("ER ")) clean = clean.substring(3);
  if (clean.startsWith("DE ")) clean = clean.substring(3);

  // Substitute underscores with spaces/dashes
  clean = clean.replace(/_/g, " ").trim();
  return clean;
}

/**
 * Translates an HR label automatically to English or Arabic based on the language context,
 * incorporating smart code matches, exact English/Arabic lookups, and normalized comparisons.
 */
export function getTranslatedLabel(label: string, lang: "en" | "ar"): string {
  if (!label) return "";
  
  const targetRating = normalizeTerm(label);

  // 1. Look for matching code, english term or arabic term in our dictionary
  const match = hrDictionary.find((entry) => {
    return (
      entry.code.toUpperCase() === targetRating ||
      normalizeTerm(entry.english_term) === targetRating ||
      normalizeTerm(entry.arabic_term) === targetRating
    );
  });

  if (match) {
    return lang === "ar" ? match.arabic_term : match.english_term;
  }

  // Fallback map for specific alternative name variations
  const alternativeMap: { [key: string]: { en: string; ar: string } } = {
    "HOUSE RENT": { en: "Housing Allowance", ar: "بدل سكن" },
    "HRA": { en: "Housing Allowance", ar: "بدل سكن" },
    "TRANSPORT": { en: "Transport Allowance", ar: "بدل انتقال / مواصلات" },
    "CAR ALLOWANCE": { en: "Transport Allowance", ar: "بدل انتقال / مواصلات" },
    "TRA": { en: "Transport Allowance", ar: "بدل انتقال / مواصلات" },
    "PERFORMANCE BONUS": { en: "Performance Bonus", ar: "مكافأة أداء" },
    "BONUS": { en: "Performance Bonus", ar: "مكافأة أداء" },
    "INCOME TAX": { en: "Income Tax", ar: "ضريبة الدخل" },
    "TAX": { en: "Income Tax", ar: "ضريبة الدخل" },
    "SOCIAL SECURITY": { en: "Social Insurance", ar: "التأمينات الاجتماعية" },
    "SOCIAL INSURANCE": { en: "Social Insurance", ar: "التأمينات الاجتماعية" },
    "SOC SEC": { en: "Social Insurance", ar: "التأمينات الاجتماعية" }
  };

  if (alternativeMap[targetRating]) {
    return lang === "ar" ? alternativeMap[targetRating].ar : alternativeMap[targetRating].en;
  }

  // Return original label if not found in our Egypt HR dictionary
  return label;
}
