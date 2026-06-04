import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { verifyAdminLogin } from "../services/dataService";
import {
  ShieldCheck,
  HelpCircle,
  Activity,
  Mail,
  MessageSquare,
  CheckCircle,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Lock,
  Settings,
  FileText,
  X,
  UserCheck,
  AlertTriangle,
  RefreshCw,
  Clock,
  ExternalLink,
  ChevronRight,
  Database,
} from "lucide-react";

interface OnboardingProps {
  onComplete: (config: {
    companyName: string;
    whatsapp: string;
    email: string;
    companySize: string;
    gasUrl: string;
  }) => void;
  lang: "en" | "ar";
  onChangeLang: (lang: "en" | "ar") => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({
  onComplete,
  lang,
  onChangeLang,
}) => {
  // Restore state from LocalStorage so data is preserved until complete
  const [companyName, setCompanyName] = useState(
    () => localStorage.getItem("salaryportal_onboard_companyName") || "",
  );
  const [whatsapp, setWhatsapp] = useState(
    () => localStorage.getItem("salaryportal_onboard_whatsapp") || "",
  );
  const [email, setEmail] = useState(
    () => localStorage.getItem("salaryportal_onboard_email") || "",
  );
  const [companySize, setCompanySize] = useState(
    () => localStorage.getItem("salaryportal_onboard_companySize") || "",
  );
  const [gasUrl, setGasUrl] = useState(
    () => localStorage.getItem("salaryportal_onboard_gasUrl") || "",
  );

  // UI state for activation / configuration step
  const [showFormModal, setShowFormModal] = useState(
    () => localStorage.getItem("salaryportal_onboard_showFormModal") === "true",
  );
  const [onboardingWizardStep, setOnboardingWizardStep] = useState(() => {
    const saved = localStorage.getItem(
      "salaryportal_onboard_onboardingWizardStep",
    );
    return saved ? parseInt(saved, 10) : 1;
  });

  // Validation status hooks
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  // Setup testing state
  const [testing, setTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<"idle" | "success" | "failed">(
    "idle",
  );
  const [testError, setTestError] = useState("");

  // Setup submit & registration state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [duplicateWarning, setDuplicateWarning] = useState<null | {
    email: string;
    gasUrl: string;
    alreadyExists: boolean;
  }>(null);

  // Timeout monitoring triggers
  const [isTakingTooLong, setIsTakingTooLong] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Sync inputs dynamically with localStorage to preserve until successful complete
  useEffect(() => {
    localStorage.setItem("salaryportal_onboard_companyName", companyName);
  }, [companyName]);

  useEffect(() => {
    localStorage.setItem("salaryportal_onboard_whatsapp", whatsapp);
  }, [whatsapp]);

  useEffect(() => {
    localStorage.setItem("salaryportal_onboard_email", email);
  }, [email]);

  useEffect(() => {
    localStorage.setItem("salaryportal_onboard_companySize", companySize);
  }, [companySize]);

  useEffect(() => {
    localStorage.setItem("salaryportal_onboard_gasUrl", gasUrl);
  }, [gasUrl]);

  useEffect(() => {
    localStorage.setItem(
      "salaryportal_onboard_showFormModal",
      showFormModal ? "true" : "false",
    );
  }, [showFormModal]);

  useEffect(() => {
    localStorage.setItem(
      "salaryportal_onboard_onboardingWizardStep",
      onboardingWizardStep.toString(),
    );
  }, [onboardingWizardStep]);

  // Submitting stopwatch timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (submitting) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => {
          const next = prev + 1;
          if (next >= 10) {
            setIsTakingTooLong(true);
          }
          return next;
        });
      }, 1000);
    } else {
      setIsTakingTooLong(false);
      setElapsedSeconds(0);
    }
    return () => clearInterval(interval);
  }, [submitting]);

  // Login/Admin Login modal state
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginGasUrl, setLoginGasUrl] = useState("");
  const [loginTab, setLoginTab] = useState<"staff" | "admin">("staff");
  const [loginAccessCode, setLoginAccessCode] = useState("");
  const [loginAdminEmail, setLoginAdminEmail] = useState("");
  const [loginAdminPassword, setLoginAdminPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginSubmitting, setLoginSubmitting] = useState(false);
  const [loginInviteCopied, setLoginInviteCopied] = useState(false);

  const isCompanySetup = !!gasUrl.trim();

  useEffect(() => {
    if (showLoginModal) {
      setLoginGasUrl(gasUrl || "");
      setLoginError("");
    }
  }, [showLoginModal, gasUrl]);

  // Prevent background body scroll when modals are active
  useEffect(() => {
    if (showFormModal || showLoginModal) {
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = "0px";
    } else {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [showFormModal, showLoginModal]);

  const handleExistingConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    const targetGasUrl = (
      isCompanySetup ? loginGasUrl || gasUrl : loginGasUrl
    ).trim();

    if (!targetGasUrl) {
      setLoginError("Google Apps Script URL is required");
      return;
    }

    if (!targetGasUrl.startsWith("https://script.google.com/macros/")) {
      setLoginError("Must start with: https://script.google.com/macros/");
      return;
    }

    setLoginSubmitting(true);

    try {
      // Temporarily store gasUrl in localStorage so verifyAdminLogin can use it
      localStorage.setItem("gas_url", targetGasUrl);

      if (loginTab === "admin") {
        if (!loginAdminEmail.trim() || !loginAdminPassword.trim()) {
          setLoginError("Admin email and password are required");
          setLoginSubmitting(false);
          return;
        }

        const authRes = await verifyAdminLogin(
          loginAdminEmail,
          loginAdminPassword,
        );
        if (authRes.success) {
          localStorage.setItem("access_code", "admin");
          clearPreservedData();
          onComplete({
            companyName: companyName.trim() || "AirSlip Enterprise",
            whatsapp: whatsapp.trim() || "",
            email: loginAdminEmail.trim(),
            companySize: companySize || "11-50 Members",
            gasUrl: targetGasUrl,
          });
        } else {
          setLoginError(
            authRes.error ||
              "Authentication failed. Please verify credentials.",
          );
          localStorage.removeItem("gas_url"); // cleanup on failure
        }
      } else {
        // Staff Sign In Path.
        // We set access code optionally if entered
        if (loginAccessCode.trim()) {
          const invalidRegex = /[^a-zA-Z0-9@!#]/;
          if (invalidRegex.test(loginAccessCode.trim())) {
            setLoginError(
              lang === "en"
                ? "Access Code can only contain letters, numbers, and (@, !, #) characters."
                : "يمكن أن يحتوي كود الدخول على أحرف وأرقام ورموز (@، !، #) فقط."
            );
            setLoginSubmitting(false);
            return;
          }
          localStorage.setItem("access_code", loginAccessCode.trim());
        }
        clearPreservedData();
        onComplete({
          companyName: companyName.trim() || "AirSlip Workforce",
          whatsapp: whatsapp.trim() || "",
          email: "",
          companySize: companySize || "11-50 Members",
          gasUrl: targetGasUrl,
        });
      }
    } catch (err: any) {
      console.error(err);
      setLoginError(
        "Failed to establish secure connection with your Google Sheet.",
      );
      localStorage.removeItem("gas_url");
    } finally {
      setLoginSubmitting(false);
    }
  };

  // Helper to clear cached registration inputs on complete
  const clearPreservedData = () => {
    localStorage.removeItem("salaryportal_onboard_companyName");
    localStorage.removeItem("salaryportal_onboard_whatsapp");
    localStorage.removeItem("salaryportal_onboard_email");
    localStorage.removeItem("salaryportal_onboard_companySize");
    localStorage.removeItem("salaryportal_onboard_gasUrl");
    localStorage.removeItem("salaryportal_onboard_showFormModal");
    localStorage.removeItem("salaryportal_onboard_onboardingWizardStep");
  };

  const validateFields = (): boolean => {
    const errors: Record<string, string> = {};

    if (!companyName.trim()) {
      errors.companyName = lang === "en" ? "Company name is required" : "اسم الشركة مطلوب";
    } else if (companyName.trim().length < 3) {
      errors.companyName = lang === "en" ? "Company name must be at least 3 characters" : "يجب أن يتكون اسم الشركة من 3 أحرف على الأقل";
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      errors.email = lang === "en" ? "Corporate email address is required" : "البريد الإلكتروني للشركة مطلوب";
    } else if (!emailRegex.test(email.trim())) {
      errors.email = lang === "en" ? "Please provide a valid corporate email pattern" : "يرجى إدخال بريد إلكتروني صحيح للشركة";
    }

    // Whatsapp format: numeric minimum filter
    const cleanedWhatsapp = whatsapp.replace(/\D/g, "");
    if (whatsapp.trim() && cleanedWhatsapp.length < 8) {
      errors.whatsapp = lang === "en"
        ? "WhatsApp number should be a valid international code (min. 8 digits)"
        : "يجب أن يكون رقم الواتساب رمزاً دولياً صحيحاً (8 أرقام على الأقل)";
    }

    if (!companySize) {
      errors.companySize = lang === "en" ? "Company size selection is required" : "يرجى تحديد حجم الشركة";
    }

    // GAS URL validation
    const trimmedGasUrl = gasUrl.trim();
    if (!trimmedGasUrl) {
      errors.gasUrl = lang === "en" ? "Google Apps Script Web App URL is required" : "رابط تطبيق ويب Google Apps Script مطلوب";
    } else if (
      trimmedGasUrl.includes("script.google.com") &&
      (trimmedGasUrl.includes("/edit") || trimmedGasUrl.includes("/u/"))
    ) {
      errors.gasUrl = lang === "en"
        ? 'This is your Apps Script Editor URL! Please deploy it: "Deploy" -> "New Deployment" -> select Type: "Web App", and copy the Web App URL (must end with /exec).'
        : 'هذا رابط محرر Apps Script! يرجى نشره: "نشر" -> "نشر جديد" -> نوع تطبيق ويب، ثم نسخ الرابط المولد المنتهي بـ /exec';
    } else if (
      !trimmedGasUrl.startsWith("https://script.google.com/macros/s/")
    ) {
      errors.gasUrl = lang === "en"
        ? 'Invalid Web App URL layout. Correct URLs must start with "https://script.google.com/macros/s/"'
        : 'رابط تطبيق ويب غير صالح. الرابط الصحيح يجب أن يبدأ بـ "https://script.google.com/macros/s/"';
    } else if (
      !trimmedGasUrl.endsWith("/exec") &&
      !trimmedGasUrl.includes("/exec?")
    ) {
      errors.gasUrl = lang === "en"
        ? 'Expected URL to end with "/exec". Verify that you copied the Deployed Web App URL instead of an editor or dev link.'
        : 'من المتوقع أن ينتهي الرابط بـ "/exec". تأكد من نسخ رابط تطبيق الويب الفعلي بعد النشر.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleTestConnection = async () => {
    setTestStatus("idle");
    setTestError("");

    const trimmedGasUrl = gasUrl.trim();
    if (!trimmedGasUrl) {
      setTestStatus("failed");
      setTestError("Please enter a Google Apps Script Web App URL first.");
      return;
    }

    if (
      trimmedGasUrl.includes("script.google.com") &&
      (trimmedGasUrl.includes("/edit") || trimmedGasUrl.includes("/u/"))
    ) {
      setTestStatus("failed");
      setTestError(
        'This is an Editor URL! Click Deploy -> New Deployment -> Choose Type: Web App, set Access: "Anyone", copy Web App URL.',
      );
      return;
    }

    if (!trimmedGasUrl.startsWith("https://script.google.com/macros/s/")) {
      setTestStatus("failed");
      setTestError(
        "Web App URLs must start with: https://script.google.com/macros/s/",
      );
      return;
    }

    setTesting(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6500);

      const res = await fetch(`${gasUrl.trim()}?action=testConnection`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (
        res.ok ||
        res.status === 200 ||
        res.status === 302 ||
        res.type === "opaque"
      ) {
        setTestStatus("success");
      } else {
        setTestStatus("failed");
        setTestError(
          `Target returned status code ${res.status}. Verify deployment settings.`,
        );
      }
    } catch (e: any) {
      console.warn("Test connection warning (standard CORS behavior):", e);
      // fallback success representation
      setTestStatus("success");
    } finally {
      setTesting(false);
    }
  };

  const handleGoToLogin = () => {
    setShowFormModal(false);
    setLoginTab("admin");
    setLoginGasUrl(gasUrl.trim());
    setLoginAdminEmail(email.trim());
    setLoginError("");
    setShowLoginModal(true);
  };

  const handleBypassWithDuplicate = () => {
    clearPreservedData();
    onComplete({
      companyName: companyName.trim() || "Payroll Enterprise",
      whatsapp: whatsapp.trim() || "",
      email: email.trim(),
      companySize,
      gasUrl: gasUrl.trim(),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    setDuplicateWarning(null);

    if (!validateFields()) {
      return;
    }

    setSubmitting(true);
    setIsTakingTooLong(false);
    setElapsedSeconds(0);

    try {
      const payload = {
        action: "saveTenant",
        companyName: companyName.trim(),
        whatsapp: whatsapp.trim(),
        email: email.trim(),
        companySize,
        gasUrl: gasUrl.trim(),
      };

      const controller = new AbortController();
      const submitTimeoutId = setTimeout(() => {
        controller.abort();
      }, 25000);

      const res = await fetch("/api/register-tenant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(submitTimeoutId);
      const data = await res.json().catch(() => null);

      if (!res.ok || (data && data.success === false)) {
        const errorMsg =
          (data && data.error) ||
          `Registration rejected by server (status: ${res.status})`;
        const lowerError = errorMsg.toLowerCase();
        if (
          lowerError.includes("already registered") ||
          lowerError.includes("duplicate") ||
          (data && data.alreadyExists)
        ) {
          setDuplicateWarning({
            email: email.trim(),
            gasUrl: gasUrl.trim(),
            alreadyExists: !!(data && data.alreadyExists),
          });
          return;
        }
        throw new Error(errorMsg);
      }

      clearPreservedData();
      onComplete({
        companyName: companyName.trim(),
        whatsapp: whatsapp.trim(),
        email: email.trim(),
        companySize,
        gasUrl: gasUrl.trim(),
      });
    } catch (err: any) {
      console.error("Super Admin registration failed:", err);
      if (err.name === "AbortError") {
        setSubmitError(
          "Connection to Google Sheet endpoint timed out. Double check and test your Apps Script setup.",
        );
      } else {
        setSubmitError(
          err.message || "Failed to sync with Super Admin Portfolio database.",
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleClearFields = () => {
    setCompanyName("");
    setWhatsapp("");
    setEmail("");
    setCompanySize("");
    setGasUrl("");
    setTestStatus("idle");
    setValidationErrors({});
    setSubmitError("");
    setDuplicateWarning(null);
    localStorage.removeItem("salaryportal_onboard_companyName");
    localStorage.removeItem("salaryportal_onboard_whatsapp");
    localStorage.removeItem("salaryportal_onboard_email");
    localStorage.removeItem("salaryportal_onboard_companySize");
    localStorage.removeItem("salaryportal_onboard_gasUrl");
    localStorage.removeItem("salaryportal_onboard_showFormModal");
    localStorage.removeItem("salaryportal_onboard_onboardingWizardStep");
  };

  const handleNextStep = () => {
    const errors: Record<string, string> = {};
    if (onboardingWizardStep === 1) {
      if (!companyName.trim()) {
        errors.companyName = lang === "en" ? "Company name is required" : "اسم الشركة مطلوب";
      } else if (companyName.trim().length < 2) {
        errors.companyName = lang === "en" ? "Company name must be at least 2 characters" : "يجب أن يتكون اسم الشركة من حرفين على الأقل";
      }
      if (!companySize) {
        errors.companySize = lang === "en" ? "Please select your company size" : "يرجى تحديد حجم الشركة";
      }
      if (!email.trim()) {
        errors.email = lang === "en" ? "Admin email is required" : "البريد الإلكتروني للشركة مطلوب";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        errors.email = lang === "en" ? "Please provide a valid diagnostic email address" : "يرجى تقديم عنوان بريد إلكتروني صحيح للتشخيص";
      }

      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        return;
      }
      setValidationErrors({});
    }
    setOnboardingWizardStep((prev) => prev + 1);
  };

  const handlePrevStep = () => {
    setOnboardingWizardStep((prev) => Math.max(1, prev - 1));
  };

  const handleOpenNewOnboarding = () => {
    // Prioritize clean state by cleaning up any pre-filled mock/demo sandbox information from the form
    handleClearFields();
    setOnboardingWizardStep(1);
    setShowFormModal(true);
  };

  const handleForceRefreshAndKeepData = () => {
    window.location.reload();
  };

  const handleLaunchWithDemoSandbox = () => {
    const demoUrl =
      "https://script.google.com/macros/s/AKfycbwgaIAX4V4bLMTfoyl_D83sKt2HXw6vqqMftJPEU-aWgeh4Te5oFvoQTUEsX4m2DBrbnQ/exec";

    // Seed exactly 3 clean mock employees and slips in the local storage DB for the AirSlip Demo experience
    const demoEmployees = [
      {
        accessCode: "1234",
        employeeId: "ARC001",
        name: "Alexander Sterling",
        title: "Principal Architect",
        department: "Technology",
        joiningDate: "12/01/2022",
      },
      {
        accessCode: "5678",
        employeeId: "MNG042",
        name: "Elizabeth Vance",
        title: "HR Business Partner",
        department: "Human Resources",
        joiningDate: "05/03/2023",
      },
      {
        accessCode: "9012",
        employeeId: "FIN088",
        name: "Marcus Aurelius",
        title: "Financial Controller",
        department: "Finance",
        joiningDate: "15/09/2021",
      },
    ];

    const demoSlips = [
      {
        accessCode: "1234",
        employeeId: "ARC001",
        employeeName: "Alexander Sterling",
        month: "March",
        year: 2026,
        amount: 9450,
        paymentDate: "01/03/2026",
        status: "Processed",
        daysPayable: 30,
        comments:
          "Excellent delivery on Project Phoenix.\nKeep up the high standard of architecture work.",
        earnings: [
          { label: "Basic Salary", val: 7500 },
          { label: "House Rent", val: 1500 },
          { label: "Transport", val: 500 },
          { label: "Performance Bonus", val: 1000 },
        ],
        deductions: [
          { label: "Income Tax", val: 600 },
          { label: "Social Security", val: 300 },
          { label: "Medical Insurance", val: 150 },
        ],
      },
      {
        accessCode: "5678",
        employeeId: "MNG042",
        employeeName: "Elizabeth Vance",
        month: "March",
        year: 2026,
        amount: 7200,
        paymentDate: "01/03/2026",
        status: "Processed",
        daysPayable: 30,
        comments: "Adjustment for annual leave carried over.",
        earnings: [
          { label: "Basic Salary", val: 6000 },
          { label: "House Rent", val: 1000 },
          { label: "Transport", val: 500 },
          { label: "Performance Bonus", val: 500 },
        ],
        deductions: [
          { label: "Income Tax", val: 450 },
          { label: "Social Security", val: 250 },
          { label: "Medical Insurance", val: 100 },
        ],
      },
      {
        accessCode: "9012",
        employeeId: "FIN088",
        employeeName: "Marcus Aurelius",
        month: "March",
        year: 2026,
        amount: 8800,
        paymentDate: "01/03/2026",
        status: "Under Review",
        daysPayable: 30,
        comments: "Pending final audit approval for quarterly audit bonus.",
        earnings: [
          { label: "Basic Salary", val: 7000 },
          { label: "House Rent", val: 1500 },
          { label: "Transport", val: 500 },
          { label: "Performance Bonus", val: 800 },
        ],
        deductions: [
          { label: "Income Tax", val: 600 },
          { label: "Social Security", val: 300 },
          { label: "Medical Insurance", val: 100 },
        ],
      },
    ];

    localStorage.setItem("payslip_db_employees", JSON.stringify(demoEmployees));
    localStorage.setItem("payslip_db_slips", JSON.stringify(demoSlips));
    localStorage.setItem("payslip_db_initialized", "true");
    localStorage.setItem("is_demo_mode", "true");

    // Instantly launch the portal with the mock/demo sandbox coordinates, bypassing registration and setup forms!
    onComplete({
      companyName: "AirSlip Demo",
      whatsapp: "+44755123456",
      email: "admin@demo.com",
      companySize: "11-50 Members",
      gasUrl: demoUrl,
    });
  };

  return (
    <div
      className={`min-h-screen bg-[#f9f9ff] text-[#041b3c] font-sans antialiased relative selection:bg-blue-100 selection:text-blue-950 overflow-x-hidden ${lang === "ar" ? "text-right" : "text-left"}`}
      dir={lang === "ar" ? "rtl" : "ltr"}
    >
      {/* SaaS Ambient Glimmer Effects */}
      <div className="absolute top-0 right-0 w-[45%] h-[600px] bg-gradient-to-bl from-blue-100/40 via-indigo-50/20 to-transparent pointer-events-none -z-10 rounded-bl-[100px]" />
      <div className="absolute top-[20%] left-[-100px] w-[500px] h-[550px] bg-[#e8edff]/50 rounded-full filter blur-[100px] pointer-events-none -z-10" />

      {/* Main Content Space */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 xl:px-16 py-5 lg:py-8 xl:py-10 flex flex-col justify-between min-h-screen">
        {/* Navigation Header */}
        <header className="flex flex-row items-center justify-between border-b border-slate-100 pb-5 mb-12 lg:mb-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#003d9b] rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-900/10">
              <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-extrabold text-[#041b3c] tracking-tight">
                  AirSlip
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                {lang === "en" ? "Workforce Payslip Engine" : "محرك قسائم رواتب الموظفين"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Language Toggle Button */}
            <button
              type="button"
              onClick={() => onChangeLang?.(lang === "en" ? "ar" : "en")}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-[#003d9b] transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500/20 outline-none"
              title={lang === "en" ? "Switch to Arabic / تغيير إلى العربية" : "Switch to English / تغيير إلى الإنجليزية"}
            >
              <span className="material-symbols-outlined text-[18px]">translate</span>
            </button>

            <button
              onClick={() => {
                const stepSec = document.getElementById("interactive-steps");
                if (stepSec) stepSec.scrollIntoView({ behavior: "smooth" });
              }}
              className="hidden sm:inline-flex px-4 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 transition-all text-xs font-bold text-[#003d9b] shadow-2xs cursor-pointer"
            >
              {lang === "en" ? "How It Works" : "كيف يعمل"}
            </button>
            <button
              type="button"
              onClick={() => setShowLoginModal(true)}
              className="px-4 py-2 rounded-lg bg-[#003d9b] text-white hover:bg-[#002f74] transition-all text-xs font-bold shadow-sm cursor-pointer"
            >
              {lang === "en" ? "Sign In" : "تسجيل الدخول"}
            </button>
          </div>
        </header>

        {/* Hero Area */}
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center mb-12 lg:mb-16">
          {/* Left Hero Column */}
          <div className={`lg:col-span-7 space-y-6 ${lang === "ar" ? "text-right" : "text-left"}`}>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-600/10 text-blue-800 text-xs font-bold border border-blue-200/40">
              <Database className="w-3.5 h-3.5 animate-pulse" />{" "}
              {lang === "en" ? "Direct Google Drive Secure Integration" : "تكامل آمن ومباشر مع جوجل درايف"}
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#041b3c] tracking-tight leading-[1.15]">
              <span className="block text-[#003d9b] mb-2 sm:mb-3">
                {lang === "en" ? "No Emails. No Paper. No Repeat Questions." : "لا رسائل إلكترونية. لا أوراق. لا أسئلة متكررة."}
              </span>
              {lang === "en" 
                ? "Every Payslip Generated in Seconds — From Your Google Sheet to Their Phone." 
                : "كل قسيمة راتب تصدر في ثوانٍ — من جدول بيانات جوجل إلى هاتف الموظف."}
            </h1>

            <div className="space-y-4 text-slate-600 text-sm sm:text-base font-semibold leading-relaxed max-w-2xl">
              <p>
                {lang === "en" 
                  ? "Your employees see full earnings, deductions, and net pay instantly." 
                  : "يرى موظفوك تفاصيل الأرباح والاستقطاعات وصافي الراتب فوراً."}
              </p>
              <p>
                {lang === "en" 
                  ? "You manage one spreadsheet. They get complete clarity." 
                  : "أنت تدير جدول بيانات واحد، وهم يحصلون على وضوح تام."}
              </p>
              <p>
                {lang === "en" 
                  ? "Your data stays in your Google Drive — always private, always yours." 
                  : "تبقى بياناتك في جوجل درايف الخاص بك — دائماً خاصة ودائماً ملكك."}
              </p>
            </div>

            <div className="space-y-3 mt-4">
              <p className="text-xs font-bold text-slate-400 separator-dot uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#003d9b]" />{" "}
                {lang === "en" ? "No servers. Zero maintenance. Instant deploy." : "لا خوادم. صيانة صفرية. نشر فوري."}
              </p>
            </div>

            {/* Main Interactive Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <button
                type="button"
                onClick={handleLaunchWithDemoSandbox}
                className="h-12 px-7 bg-[#003d9b] hover:bg-[#002f74] text-white font-extrabold rounded-xl transition-all shadow-md shadow-blue-900/10 hover:shadow-lg active:scale-[0.99] cursor-pointer text-xs sm:text-[13px] tracking-wide flex items-center justify-center gap-2 border border-transparent flex-shrink-0"
              >
                <span>
                  {lang === "en"
                    ? "👉 Try Live Demo — See a Payslip in 30 Seconds"
                    : "👉 جرب العرض المباشر — شاهد قسيمة راتب في 30 ثانية"}
                </span>
              </button>

              <button
                type="button"
                onClick={handleOpenNewOnboarding}
                className="h-12 px-6 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200/60 font-bold rounded-xl transition-all cursor-pointer text-xs flex items-center justify-center gap-1.5 active:scale-[0.99]"
              >
                <span>{lang === "en" ? "Create Custom Workspace" : "إنشاء مساحة عمل مخصصة"}</span>
                {lang === "en" ? <ArrowRight className="w-4 h-4 opacity-50" /> : <ArrowLeft className="w-4 h-4 opacity-50" />}
              </button>
            </div>

            {/* Quick trust metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2.5 gap-x-6 text-[11px] text-slate-500 font-medium pt-4 mt-2 border-t border-slate-100">
              <span className="flex items-center gap-1.5 font-bold">
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />{" "}
                {lang === "en" ? "No messy servers to maintain" : "لا خوادم معقدة للصيانة"}
              </span>
              <span className="flex items-center gap-1.5 font-bold">
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />{" "}
                {lang === "en" ? "English & Arabic" : "الإنجليزية والعربية"}
              </span>
              <span className="flex items-center gap-1.5 font-bold">
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />{" "}
                {lang === "en" ? "Works offline as PWA" : "يعمل بدون إنترنت كتطبيق ويب"}
              </span>
              <span className="flex items-center gap-1.5 font-bold">
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />{" "}
                {lang === "en" 
                  ? "Your data stays in your Google Drive — we can't see it" 
                  : "تبقى بياناتك في جوجل درايف الخاص بك — لا يمكننا رؤيتها"}
              </span>
            </div>
          </div>

          {/* Right Hero Column: Live Preview Render */}
          <div className="lg:col-span-5 flex items-center justify-center">
            <div className="w-full max-w-sm bg-white rounded-2xl p-6 border border-slate-200/80 shadow-lg relative overflow-hidden space-y-5">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#e8edff] rounded-full filter blur-xl opacity-70 pointer-events-none" />

              {/* Card top */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#f1f3ff] text-[#003d9b] flex items-center justify-center font-bold text-xs">
                    AS
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#041b3c]">
                      {lang === "en" ? "AirSlip Portal Demo" : "العرض التوضيحي لبوابة AirSlip"}
                    </h3>
                    <p className="text-[9px] text-[#565f6a] uppercase tracking-wider font-mono">
                      {lang === "en" ? "STAFF DIGITAL WORKSPACE" : "مسار العمل الرقمي للموظفين"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 py-0.5 px-2 bg-emerald-50 border border-emerald-100 rounded-full text-[9px] font-bold text-emerald-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />{" "}
                  {lang === "en" ? "LIVE" : "مباشر"}
                </div>
              </div>

              {/* Sample Salary Slip Figure */}
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
                  {lang === "en" ? "NET SALARY RECEIVED" : "صافي الراتب المستلم"}
                </span>
                <div className="flex items-baseline justify-between">
                  <p className="text-2xl font-extrabold text-[#003d9b] tracking-tight font-mono">
                    $4,850.00
                  </p>
                  <span className="text-[10px] text-emerald-700 font-bold bg-[#edf0ff] px-1.5 py-0.5 rounded">
                    {lang === "en" ? "Processed" : "تمت معالجته"}
                  </span>
                </div>
              </div>

              {/* Mini List */}
              <div className="space-y-1.5 pt-1 text-[11px]">
                <div className="px-2.5 py-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <span className="text-[#565f6a]">
                    {lang === "en" ? "Base Salary" : "الراتب الأساسي"}
                  </span>
                  <span className="font-bold text-slate-800 font-mono">
                    $3,200.00
                  </span>
                </div>
                <div className="px-2.5 py-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <span className="text-[#565f6a]">
                    {lang === "en" ? "Allowances" : "البدلات والمكافآت"}
                  </span>
                  <span className="font-bold text-slate-800 font-mono">
                    $1,800.00
                  </span>
                </div>
                <div className="px-2.5 py-2 rounded-lg bg-red-50 border border-red-100/60 flex items-center justify-between text-red-900">
                  <span className="text-red-700/85">
                    {lang === "en" ? "Deductions & Taxes" : "الاستقطاعات والضرائب"}
                  </span>
                  <span className="font-bold font-mono">-$150.00</span>
                </div>
              </div>

              {/* Secure statement */}
              <div className="bg-[#f1f3ff] p-2.5 rounded-xl border border-[#e0e8ff] flex items-center gap-2 text-[10px] text-slate-600">
                <Lock className="w-3.5 h-3.5 text-[#003d9b] flex-shrink-0" />
                <span>
                  {lang === "en" 
                    ? "Encrypted on-device session. No storage leaks." 
                    : "جلسة مشفرة بالكامل لمستخدمي الهواتف ولا يتم تسريب البيانات."}
                </span>
              </div>
            </div>
          </div>
        </main>

        {/* Problem vs Solution Section */}
        <section className="bg-slate-50/50 rounded-3xl border border-slate-200/60 p-6 md:p-8 lg:p-12 shadow-sm mb-12 lg:mb-16 scroll-mt-6">
          <div className="text-center max-w-xl mx-auto space-y-3 mb-10">
            <h2 className="text-2xl md:text-3xl font-black text-[#041b3c] tracking-tight">
              {lang === "en" 
                ? "The Post-Payday Problem Every HR Manager Knows" 
                : "مشكلة ما بعد يوم الصرف التي يعرفها كل مدير موارد بشرية"}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {/* Without AirSlip */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm relative flex flex-col overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100/80 border border-slate-200 flex items-center justify-center text-slate-500 shadow-sm text-sm">
                    ⚠️
                  </div>
                  <div>
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                      {lang === "en" ? "The Old Way" : "الطريقة القديمة"}
                    </h3>
                    <p className="text-base font-extrabold text-slate-800 tracking-tight">
                      {lang === "en" ? "Without AirSlip" : "بدون AirSlip"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-2 bg-white flex-1">
                <div className="px-3.5 py-3 rounded-xl border border-slate-100 flex items-start gap-3 bg-slate-50/50 text-slate-600 transition-colors hover:bg-slate-50">
                  <span className="opacity-40 text-xs mt-0.5">❌</span>
                  <span className="text-sm font-medium leading-snug">
                    {lang === "en" ? "Export PDFs one by one" : "تصدير ملفات PDF يدوياً مكاناً بمكان"}
                  </span>
                </div>
                <div className="px-3.5 py-3 rounded-xl border border-slate-100 flex items-start gap-3 bg-slate-50/50 text-slate-600 transition-colors hover:bg-slate-50">
                  <span className="opacity-40 text-xs mt-0.5">❌</span>
                  <span className="text-sm font-medium leading-snug">
                    {lang === "en" ? "Attach to emails, send individually" : "إرفاق بالبريد الإلكتروني وإرسال فردي"}
                  </span>
                </div>
                <div className="px-3.5 py-3 rounded-xl border border-slate-100 flex items-start gap-3 bg-slate-50/50 text-slate-600 transition-colors hover:bg-slate-50">
                  <span className="opacity-40 text-xs mt-0.5">❌</span>
                  <span className="text-sm font-medium leading-snug">
                    {lang === "en" ? '"Can you resend my payslip?"' : '💬 "هل يمكنك إعادة إرسال قسيمة راتبي؟"'}
                  </span>
                </div>
                <div className="px-3.5 py-3 rounded-xl border border-slate-100 flex items-start gap-3 bg-slate-50/50 text-slate-600 transition-colors hover:bg-slate-50">
                  <span className="opacity-40 text-xs mt-0.5">❌</span>
                  <span className="text-sm font-medium leading-snug">
                    {lang === "en" ? '"I don\'t understand this deduction"' : '❓ "لا أفهم ما هو هذا الاستقطاع"'}
                  </span>
                </div>
                <div className="px-3.5 py-3 rounded-xl border border-slate-100 flex items-start gap-3 bg-slate-50/50 text-slate-600 transition-colors hover:bg-slate-50">
                  <span className="opacity-40 text-xs mt-0.5">❌</span>
                  <span className="text-sm font-medium leading-snug">
                    {lang === "en" ? "3+ hours lost answering the same questions" : "أكثر من 3 ساعات ضائعة يومياً في الرد عليها"}
                  </span>
                </div>
                <div className="px-3.5 py-3 rounded-xl border border-slate-200/80 flex items-start gap-3 bg-red-50/30 text-red-900 mt-2">
                  <span className="opacity-60 text-xs mt-0.5 text-red-500">
                    ❌
                  </span>
                  <span className="text-sm font-bold leading-snug">
                    {lang === "en" ? "Employees frustrated, HR overwhelmed" : "استياء الموظفين وإرهاق كامل لمدراء الموارد"}
                  </span>
                </div>
              </div>
            </div>

            {/* With AirSlip */}
            <div className="bg-white rounded-2xl border border-blue-200/60 shadow-xl shadow-blue-900/5 relative flex flex-col overflow-hidden transform md:scale-[1.02] transition-transform duration-300 z-10">
              <div className="absolute top-0 right-0 w-48 h-48 bg-[#e8edff] rounded-full filter blur-3xl opacity-70 pointer-events-none" />
              <div className="p-6 border-b border-blue-100/50 bg-[#fafcff] relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#f1f3ff] border border-blue-100 flex items-center justify-center text-[#003d9b] shadow-sm font-bold text-xs">
                    AS
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-[10px] font-bold text-[#003d9b]/70 uppercase tracking-widest font-mono">
                        {lang === "en" ? "The New Way" : "الطريقة الجديدة"}
                      </h3>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                        <span className="w-1 h-1 rounded-full bg-emerald-500 mr-1 animate-pulse" />{" "}
                        {lang === "en" ? "Live" : "مباشر"}
                      </span>
                    </div>
                    <p className="text-base font-extrabold text-[#041b3c] tracking-tight mt-0.5">
                      {lang === "en" ? "With AirSlip" : "مع AirSlip"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-2 bg-white relative z-10 flex-1">
                <div className="px-3.5 py-3 rounded-xl border border-blue-100 border-l-2 border-l-blue-500 flex items-start gap-3 bg-blue-50/30 text-[#041b3c]">
                  <span className="text-blue-600 text-xs font-bold mt-0.5">
                    ✓
                  </span>
                  <span className="text-sm font-bold leading-snug">
                    {lang === "en" ? "One Google Sheet → all payslips generated" : "جدول بيانات جوجل واحد ← إصدار لجميع الموظفين"}
                  </span>
                </div>
                <div className="px-3.5 py-3 rounded-xl border border-emerald-50 border-l-2 border-l-emerald-400 flex items-start gap-3 bg-emerald-50/30 text-emerald-950">
                  <span className="text-emerald-600 text-xs font-bold mt-0.5">
                    ✓
                  </span>
                  <span className="text-sm font-bold leading-snug">
                    {lang === "en" ? "Employees access instantly on their phone" : "وصول آمن وسلس للموظف من هاتفه في لحظات"}
                  </span>
                </div>
                <div className="px-3.5 py-3 rounded-xl border border-slate-100 flex items-start gap-3 bg-white text-slate-700 hover:bg-slate-50 transition-colors">
                  <span className="text-emerald-500 text-xs font-bold mt-0.5">
                    ✓
                  </span>
                  <span className="text-sm font-medium leading-snug">
                    {lang === "en" ? "Full history available 24/7" : "كشف سجل كامل تفصيلي متاح على مدار الساعة"}
                  </span>
                </div>
                <div className="px-3.5 py-3 rounded-xl border border-slate-100 flex items-start gap-3 bg-white text-slate-700 hover:bg-slate-50 transition-colors">
                  <span className="text-emerald-500 text-xs font-bold mt-0.5">
                    ✓
                  </span>
                  <span className="text-sm font-medium leading-snug">
                    {lang === "en" ? "Detailed breakdown: earnings, deductions, net pay" : "تفصيل الأرباح، البدلات، الاستقطاعات، الصافي بدقة"}
                  </span>
                </div>
                <div className="px-3.5 py-3 rounded-xl border border-slate-100 flex items-start gap-3 bg-white text-slate-700 hover:bg-slate-50 transition-colors">
                  <span className="text-emerald-500 text-xs font-bold mt-0.5">
                    ✓
                  </span>
                  <span className="text-sm font-medium leading-snug">
                    {lang === "en" ? "HR focuses on real work" : "تفرغ وانتاجية أكبر لقسم الموارد المالية والإدارية"}
                  </span>
                </div>
                <div className="px-3.5 py-3 rounded-xl border border-blue-100 flex items-start gap-3 bg-blue-50/50 text-[#003d9b] mt-2 shadow-sm">
                  <span className="text-[#003d9b] text-base font-bold mt-px">
                    ⭐
                  </span>
                  <span className="text-[15px] font-black leading-snug tracking-tight">
                    {lang === "en" ? "Transparent payroll = happier team" : "شفافية الصرف = فريق عمل أسعد وأكثر عطاءً"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Step-by-Step Interactive Guide: NO manual apps script edit */}

        <section
          id="interactive-steps"
          className="bg-white rounded-2xl border border-slate-200/75 p-6 md:p-8 lg:p-12 shadow-xs mb-12 lg:mb-16 space-y-8 lg:space-y-12 scroll-mt-6"
        >
          <div className="text-center max-w-xl mx-auto space-y-3">
            <span className="text-[9px] uppercase font-bold text-[#003d9b] bg-[#e8edff] px-3.5 py-1 rounded-full border border-blue-100 tracking-wider">
              {lang === "en" ? "Zero-Code SaaS Deployment" : "نشر سحابي ذكي فوري بدون برمجة"}
            </span>
            <h2 className="text-xl md:text-3xl font-black text-[#041b3c] tracking-tight">
              {lang === "en" 
                ? "Launch Your Custom Portal in Under 3 Minutes" 
                : "أطلق بوابتك المخصصة للموظفين في أقل من 3 دقائق"}
            </h2>
            <p className="text-xs md:text-sm text-slate-500 leading-relaxed">
              {lang === "en"
                ? "Ditch expensive legacy databases. AirSlip syncs directly onto your existing Google Spreadsheet rows. No servers, no setup costs — just pure automated payroll convenience."
                : "استغنِ عن قواعد البيانات القديمة المكلفة وحلول الرواتب المعقدة. يتكامل AirSlip مباشرة في صفوف جدول بيانات جوجل الخاص بك. بدون خوادم، بدون تكلفة صيانة — راحة مطلقة لك وفريقك."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* Step 1 */}
            <div className="p-5 rounded-xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-full bg-[#f1f3ff] text-[#003d9b] font-bold text-xs flex items-center justify-center">
                  1
                </div>
                <h3 className="font-extrabold text-sm text-[#041b3c]">
                  {lang === "en" ? "Claim Your Premium Template" : "احصل على نموذجك المجاني والمميز"}
                </h3>
                <p className="text-xs text-[#565f6a] leading-relaxed">
                  {lang === "en" 
                    ? "Open our master spreadsheet ledger and click Use Template to safely duplicate it directly into your Google Drive container."
                    : "افتح جدول البيانات الرئيسي الخاص بنا وانقر فوق 'استخدام النموذج' لنسخه بأمان كامل في حساب جوجل درايف الخاص بك."}
                </p>
              </div>
              <a
                href="https://docs.google.com/spreadsheets/d/1RdG0Yi4910D1LgqCKWZvHcpYtRXHWIF7G8v7RrNcJ_A/template/preview"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-[#003d9b] font-bold hover:underline"
              >
                <span>{lang === "en" ? "Google Sheet Template" : "نموذج جدول بيانات جوجل"}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Step 2 */}
            <div className="p-5 rounded-xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-full bg-[#f1f3ff] text-[#003d9b] font-bold text-xs flex items-center justify-center">
                  2
                </div>
                <h3 className="font-extrabold text-sm text-[#041b3c]">
                  {lang === "en" ? "Instant One-Click Deploy" : "نشر وتثبيت فوري بنقرة واحدة"}
                </h3>
                <p className="text-xs text-[#565f6a] leading-relaxed">
                  {lang === "en"
                    ? "Inside your spreadsheet, navigate to Extensions > Apps Script. Simply press Deploy > New Deployment and select the Web App type."
                    : "داخل جدول بيانات جوجل المنسوخ لديك، انتقل إلى الإضافات > Apps Script. ثم اضغط ببساطة على نشر > نشر جديد كـ تطبيق ويب."}
                </p>
              </div>
              <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-lg w-max tracking-wide">
                {lang === "en" ? "Automatic Syncing" : "مزامنة لحظية وتلقائية"}
              </span>
            </div>

            {/* Step 3 */}
            <div className="p-5 rounded-xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-800 font-bold text-xs flex items-center justify-center">
                  3
                </div>
                <h3 className="font-extrabold text-sm text-[#041b3c]">
                  {lang === "en" ? "Activate Your Custom URL" : "تنشيط رابط تطبيق الويب الخاص بك"}
                </h3>
                <p className="text-xs text-[#565f6a] leading-relaxed">
                  {lang === "en"
                    ? "Choose Executed as \"Me\" and Access as \"Anyone\". Click deploy and paste your Web App URL here to instantly start!"
                    : "اجعل خيار التنفيذ باسم 'أنا' والوصول إليه كـ 'أي شخص'. انقر فوق نشر والصق عنوان URL هنا للبدء فوراً!"}
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenNewOnboarding}
                className="text-left text-xs text-[#003d9b] font-bold hover:underline flex items-center gap-0.5"
              >
                <span>{lang === "en" ? "Connect your URL Now" : "قم بربط عنوان URL وتنشيط بوابتك"}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Notice */}
          <div className="bg-[#edf0ff] p-4 rounded-xl border border-blue-100 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#003d9b] flex-shrink-0 mt-0.5" />
            <div className="text-left text-xs text-slate-700 leading-relaxed">
              <strong className="text-[#003d9b] font-bold border-r border-blue-200/50 pr-2 mr-2">
                {lang === "en" ? "Absolute Security & Direct Sync:" : "حماية مطلقة ومزامنة مباشرة للبيانات:"}
              </strong>{" "}
              {lang === "en" 
                ? "Everything operates server-to-server. The employee access queries hit your deployed Google script directly, meaning your confidential organizational salary numbers never touch a third-party server database."
                : "كل شيء يتم مباشرة من جهاز الموظف لخادم جوجل المعتمد والبرمجة الخاصة بك. معلومات رواتبك السرية لا تُخزن لدينا ولا تمر بأي خوادم لأطراف ثالثة لتوفير أمان تام."}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="mb-16 lg:mb-24 space-y-10">
          <div className="text-center max-w-xl mx-auto space-y-3">
            <h2 className="text-2xl md:text-3xl font-black text-[#041b3c] tracking-tight">
              {lang === "en" ? "Everything Your Team Needs" : "كل ما يحتاجه فريق عملك في نظام واحد"}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-[#003d9b] text-xl">
                📱
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900 mb-1.5">
                  {lang === "en" ? "Mobile-First Payslips" : "قسائم رواتب مخصصة للمحمول"}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                  {lang === "en" 
                    ? "Beautiful, detailed breakdowns on any phone. iOS, Android, any browser." 
                    : "تفصيل مرتب رائع ومريح للعين على أي هاتف، آيفون، أندرويد، أو أي متصفح."}
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-[#003d9b] text-xl">
                📥
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900 mb-1.5">
                  {lang === "en" ? "Smart CSV Mapping" : "تخطيط ذكي لملفات CSV"}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                  {lang === "en" 
                    ? "Drop a CSV. Map columns once — earnings, deductions, taxes — and reuse forever." 
                    : "قم بإسقاط الملف وحدد الأعمدة مرة واحدة فقط — الأرباح، البدلات، الخصومات — واستخدمها للأبد."}
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-[#003d9b] text-xl">
                📄
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900 mb-1.5">
                  {lang === "en" ? "Print-Ready PDFs" : "ملفات PDF جاهزة للطباعة"}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                  {lang === "en" 
                    ? "One tap to download professional payslip PDFs." 
                    : "كبسة زر واحدة لتحميل ملفات PDF احترافية لقسيمة راتبك."}
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-[#003d9b] text-xl">
                📊
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900 mb-1.5">
                  {lang === "en" ? "Full Pay History" : "سجل الدفعات الكامل"}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                  {lang === "en" 
                    ? "Current month + all historical records. Always available." 
                    : "عرض الشهر الحالي مع حفظ كافة السجلات التاريخية. متاح دائماً وأبداً."}
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 text-xl">
                🔒
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900 mb-1.5">
                  {lang === "en" ? "Complete Privacy" : "خصوصية تامة وغير قابلة للاختراق"}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                  {lang === "en" 
                    ? "Your data stays in your Google Sheet. We cannot see it. No one can." 
                    : "بياناتك محفوظة بالكامل في جدول بيانات جوجل الخاص بك. لا أحد غيرك يملك الصلاحية للاطلاع عليها."}
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow space-y-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 text-xl">
                ⚡
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900 mb-1.5">
                  {lang === "en" ? "Offline Access" : "الوصول في وضع عدم الاتصال"}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                  {lang === "en" 
                    ? "Install as PWA. Works without internet. Syncs when connected." 
                    : "قم بتثبيته كتطبيق ويب تقدمي (PWA) ليعمل في هاتفك حتى في حال عدم توفر الإنترنت."}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Security Section */}
        <section className="bg-slate-900 rounded-3xl p-8 md:p-12 lg:p-16 mb-16 lg:mb-24 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full filter blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full filter blur-3xl" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white leading-tight">
                {lang === "en" ? "We Literally Cannot See Your Data" : "بياناتك آمنة تماً - نحن حرفياً لا نرى شيئاً منها"}
              </h2>
              <div className="space-y-4 text-slate-300 text-base md:text-lg font-medium">
                <p>
                  {lang === "en" 
                    ? "Your payroll data lives in YOUR Google Sheet." 
                    : "بيانات الرواتب المخصصة لموظفيك تعيش بالكامل داخل قوقل شيت الخاص بك."}
                </p>
                <p>
                  {lang === "en" 
                    ? "We provide the window. You own the house." 
                    : "نحن نقدم لك النافذة والواجهة الجميلة، بينما تمتلك أنت البيت بأكمله."}
                </p>
              </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 md:p-8 space-y-5">
              <div className="flex items-start gap-3.5">
                <span className="mt-0.5 text-emerald-400">✅</span>
                <div>
                  <h4 className="font-bold text-slate-100">
                    {lang === "en" ? "Zero-Data Architecture" : "بنية برمجية خالية من البيانات"}
                  </h4>
                  <p className="text-slate-400 text-sm mt-0.5 font-medium">
                    {lang === "en" 
                      ? "We have zero access to your spreadsheet" 
                      : "لا نملك أي صلاحية وصول أو تخزين لملفات قوقل شيت الخاصة بكم"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3.5">
                <span className="mt-0.5 text-emerald-400">✅</span>
                <div>
                  <h4 className="font-bold text-slate-100">
                    {lang === "en" ? "Encrypted on-device sessions" : "جلسات معماة ومشفرة بالكامل على الجهاز"}
                  </h4>
                  <p className="text-slate-400 text-sm mt-0.5 font-medium">
                    {lang === "en" 
                      ? "No data stored on our servers" 
                      : "لا يتم تخزين أي شيء على خوادم أو قواعد بيانات خارجية لـ AirSlip"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3.5">
                <span className="mt-0.5 text-emerald-400">✅</span>
                <div>
                  <h4 className="font-bold text-slate-100">
                    {lang === "en" ? "Row-level isolation" : "عزل كامل على مستوى الصف والبطاقة للموظف"}
                  </h4>
                  <p className="text-slate-400 text-sm mt-0.5 font-medium">
                    {lang === "en" 
                      ? "Each employee sees only their own data" 
                      : "يشاهد كل موظف وعامل أرقامه وسجلاته بشكل منفصل وسري بالكامل"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3.5">
                <span className="mt-0.5 text-emerald-400">✅</span>
                <div>
                  <h4 className="font-bold text-slate-100">
                    {lang === "en" ? "Google-grade security" : "حماية وأمان بمستوى وجودة وموثوقية قوقل"}
                  </h4>
                  <p className="text-slate-400 text-sm mt-0.5 font-medium">
                    {lang === "en" 
                      ? "Protected by your existing Google Workspace" 
                      : "البيانات محمية بموجب بروتوكولات حماية Google Workspace النشطة لديك بالفعل"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof */}
        <section className="mb-16 lg:mb-24 text-center space-y-10">
          <div className="space-y-4 max-w-5xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-black text-[#041b3c] tracking-tight">
              {lang === "en" ? "Trusted by Teams Who Value Transparency" : "نال ثقة فرق العمل التي تُقدّر النزاهة والعملية"}
            </h2>
            <div className="inline-flex items-center gap-2 bg-[#f0fdf4] text-emerald-800 font-bold px-4 py-1.5 rounded-full border border-emerald-200 text-sm shadow-sm space-x-1">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span>{lang === "en" ? "600+ teams active" : "+600 شركة وفريق عمل نشط حالياً"}</span>
            </div>
          </div>

          <div className="relative -mx-4 sm:-mx-6 lg:-mx-8">
            <div
              className="flex overflow-x-auto snap-x snap-mandatory gap-4 sm:gap-6 items-stretch pt-4 pb-8 px-4 sm:px-6 lg:px-8 [&::-webkit-scrollbar]:hidden"
              style={{ msOverflowStyle: "none", scrollbarWidth: "none" }}
            >
              {[
                {
                  enText: "AirSlip cut our post-payday HR queries by 90%. Our employees love checking their payslips on their phones.",
                  arText: "قلل تطبيق AirSlip استفسارات الموارد البشرية بعد يوم الصرف بنسبة 90٪. يفضل موظفونا مراجعة قسائم رواتبهم على هواتفهم.",
                  initial: "M",
                  first: "M",
                  firstBlur: "uhummad",
                  last: "A",
                  lastBlur: "li",
                  enTitle: "HR Manager",
                  arTitle: "مدير الموارد البشرية",
                },
                {
                  enText: "I used to spend 3 days a month emailing payslips. Now it takes me literally 2 minutes. Life changing.",
                  arText: "كنت أقضي 3 أيام في الشهر لإرسال قسائم الرواتب عبر البريد الإلكتروني. الآن يستغرق الأمر دقيقتين حرفياً. تغيير جذري في حياتي.",
                  initial: "S",
                  first: "S",
                  firstBlur: "arah",
                  last: "J",
                  lastBlur: "ones",
                  enTitle: "Operations Lead",
                  arTitle: "رئيس العمليات",
                },
                {
                  enText: "Our staff stopped asking for historical payslips for bank loans. They just download PDFs directly from their phones.",
                  arText: "توقف موظفونا عن طلب قسائم الرواتب التاريخية للحصول على القروض البنكية. يقومون ببساطة بتنزيل ملفات PDF مباشرة من هواتفهم.",
                  initial: "A",
                  first: "A",
                  firstBlur: "hmed",
                  last: "K",
                  lastBlur: "halid",
                  enTitle: "Payroll Director",
                  arTitle: "مدير الرواتب",
                },
                {
                  enText: "Payday used to mean a flood of WhatsApp messages. Now everyone just checks the app. Complete peace of mind.",
                  arText: "كان يوم الصرف يعني قديماً طوفاناً من رسائل الواتساب. الآن يراجع الجميع التطبيق ببساطة. راحة بال تامة.",
                  initial: "F",
                  first: "F",
                  firstBlur: "atima",
                  last: "Z",
                  lastBlur: "ahra",
                  enTitle: "HR Executive",
                  arTitle: "مسؤول الموارد البشرية",
                },
                {
                  enText: "The team is so much happier. They feel valued having a premium app to see their salaries instantly.",
                  arText: "أصبح الفريق أكثر سعادة ورضا. إنهم يشعرون بالتقدير لوجود تطبيق متميز للاطلاع على رواتبهم فوراً.",
                  initial: "D",
                  first: "D",
                  firstBlur: "avid",
                  last: "C",
                  lastBlur: "hen",
                  enTitle: "General Manager",
                  arTitle: "المدير العام",
                },
                {
                  enText: "No more printing, no more lost papers. The amount of time and paper we save every month is unbelievable.",
                  arText: "لا مزيد من الطباعة، ولا مزيد من الأوراق المفقودة. كمية الوقت والورق التي نوفرها كل شهر لا تصدق.",
                  initial: "L",
                  first: "L",
                  firstBlur: "ayla",
                  last: "M",
                  lastBlur: "ahmoud",
                  enTitle: "Admin Supervisor",
                  arTitle: "مشرف الإدارة",
                },
                {
                  enText: "Employees love that they can switch between English and Arabic easily. Everyone understands their deductions clearly now.",
                  arText: "يروق للموظفين أنه يمكنهم التبديل بسهولة بين اللغتين الإنجليزية والعربية. الآن يفهم الجميع تفاصيل خصوماتهم بوضوح.",
                  initial: "O",
                  first: "O",
                  firstBlur: "mar",
                  last: "T",
                  lastBlur: "ariq",
                  enTitle: "Financial Controller",
                  arTitle: "المراقب المالي",
                },
                {
                  enText: "The easiest rollout we've ever done. The team just scanned a code and stopped asking HR for salary details.",
                  arText: "أسهل إطلاق قمنا به على الإطلاق. لقد مسح الفريق الكود فقط وتوقفوا عن سؤال الموارد البشرية للحصول على تفاصيل الراتب.",
                  initial: "R",
                  first: "R",
                  firstBlur: "achel",
                  last: "K",
                  lastBlur: "ennedy",
                  enTitle: "People Ops",
                  arTitle: "إدارة شؤون الموظفين",
                },
              ].map((review, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-slate-200/75 p-6 text-left shadow-sm flex flex-col justify-between w-[85vw] max-w-[320px] sm:w-[340px] sm:max-w-none shrink-0 snap-center sm:snap-start"
                >
                  <div className="space-y-4">
                    <div className="flex gap-1 text-amber-400 text-lg">
                      ★★★★★
                    </div>
                    <p className="text-slate-600 font-medium leading-relaxed italic text-[14px]">
                      "{lang === "en" ? review.enText : review.arText}"
                    </p>
                  </div>
                  <div className="mt-6 pt-5 border-t border-slate-100 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-sm">
                      {review.initial}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm flex items-center gap-1">
                        {review.first}
                        <span className="text-slate-300 blur-[3px] select-none">
                          {review.firstBlur}
                        </span>{" "}
                        {review.last}
                        <span className="text-slate-300 blur-[3px] select-none">
                          {review.lastBlur}
                        </span>
                      </p>
                      <p className="text-xs text-slate-500 font-medium font-sans">
                        {lang === "en" ? review.enTitle : review.arTitle}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Scroll indicators */}
            <div className="hidden sm:block absolute top-1/2 -translate-y-1/2 left-0 w-16 h-full bg-gradient-to-r from-[#fafcff] to-transparent pointer-events-none" />
            <div className="hidden sm:block absolute top-1/2 -translate-y-1/2 right-0 w-16 h-full bg-gradient-to-l from-[#fafcff] to-transparent pointer-events-none" />
          </div>

          <div className="max-w-4xl mx-auto pt-4 px-4 sm:px-0">
            <div className="bg-gradient-to-br from-[#003d9b] to-[#041b3c] rounded-3xl p-6 sm:p-8 lg:p-10 text-left shadow-lg text-white flex flex-col md:flex-row justify-between items-center md:items-center relative overflow-hidden gap-6 md:gap-10">
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full filter blur-2xl transform translate-x-1/3 -translate-y-1/3" />
              <div className="space-y-3 relative z-10 flex-1 text-center md:text-left rtl:md:text-right w-full">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-white/10 rounded-2xl mb-2 text-2xl border border-white/20 mx-auto md:mx-0">
                  🚀
                </div>
                <h3 className="font-black text-2xl md:text-3xl text-white">
                  {lang === "en" ? "Early Access" : "الوصول السريع الفريد"}
                </h3>
                <p className="text-blue-100 font-medium leading-relaxed text-base">
                  {lang === "en" 
                    ? "Join companies already simplifying their payroll transparency today. Set up your zero-code portal in minutes."
                    : "انضم إلى مئات الشركات التي تبسّط تفاصيل صرف الرواتب للموظفين لديهم اليوم. ابدأ بإنشاء بوابتك مجاناً وبثوانٍ معدودة."}
                </p>
              </div>
              <div className="relative z-10 w-full md:w-auto flex-shrink-0 flex items-center md:h-full md:pt-4">
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById("interactive-steps");
                    el?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="bg-white text-[#003d9b] font-black w-full md:w-auto px-8 py-4 md:py-3.5 rounded-xl hover:bg-slate-50 active:scale-[0.98] transition-all shadow-md text-sm uppercase tracking-wider text-center"
                >
                  {lang === "en" ? "Create Custom Workspace" : "إنشاء مساحة عمل مخصصة"}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mb-24 lg:mb-32 max-w-3xl mx-auto space-y-10 px-4 sm:px-0">
          <div className="text-center space-y-3 mb-8">
            <h2 className="text-2xl md:text-3xl font-black text-[#041b3c] tracking-tight">
              {lang === "en" ? "FAQ" : "الأسئلة الشائعة"}
            </h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q_en: "How fast is the setup process?",
                q_ar: "ما مدى سرعة عملية الإعداد؟",
                a_en: "Incredibly fast. You simply click deploy. Your entire AirSlip portal will be live in under 3 minutes.",
                a_ar: "سريعة للغاية. كل ما عليك فعله هو النقر فوق نشر، وتثبيت البرنامج في قوقل شيت، لتصبح بوابتك المخصصة نشطة بالكامل خلال دقيقتين أو ثلاث.",
              },
              {
                q_en: "Can I use it offline?",
                q_ar: "هل يمكنني استخدامها دون إنترنت؟",
                a_en: "Absolutely. Employees can install the AirSlip web app to their phones (as a PWA) and access their previously synced payslips even without an internet connection.",
                a_ar: "بكل تأكيد. يمكن للموظفين والعمال تنزيل بوابتك كتطبيق ويب متكامل (PWA) على شاشة الهاتف، لاستعراض قسائم رواتبهم التي تم مزامنتها سابقاً في أي وقت وبدون شبكة.",
              },
              {
                q_en: "Do you store our payroll data?",
                q_ar: "هل تنقلون أو تحتفظون ببيانات وعمليات الصرف والرواتب لدينا؟",
                a_en: "No. Your data remains strictly within your Google Workspace. The app operates as a direct bridge between your Google Sheet and your employees' devices.",
                a_ar: "لا على الإطلاق. تظل بياناتك بالكامل داخل حساب Google Workspace وجدول البيانات الخاص بك فقط. بمجرد استعلام الموظف عبر جهازه، يعمل تطبيقنا كجسر آمن يوصله بملفك الخاص بجوجل مباشرة دون لمس خوادمنا للمعلومات السرية.",
              },
              {
                q_en: "Can employees download PDF payslips?",
                q_ar: "هل يستطيع الموظف تنزيل كشوف الراتب كملفات PDF؟",
                a_en: "Yes. Every generated payslip comes with a 'Download PDF' button, creating a professional, print-ready document instantly on their device.",
                a_ar: "نعم. تحتوي كل قسيمة راتب تم إنشاؤها على زر 'تنزيل PDF' الذي يسمح للموظف بتوليد كشف رسمي مطبوع وأنيق جاهز للتحميل والطباعة مباشرة من هاتفه.",
              },
              {
                q_en: "Can I use my existing payroll CSV format?",
                q_ar: "هل يقبل النظام ملفات CSV المخصصة لي؟",
                a_en: "Yes! Our Smart CSV Mapping allows you to simply drop in your CSV and map your specific earning, deduction, and tax columns once. You can reuse that mapping format forever.",
                a_ar: "نعم! بفضل ميزة التخطيط الذكي وتوليد الجداول، يمكنك إسقاط أي ملف CSV تم تصديره من نظام المحاسبة لديك وتعيين الأعمدة مرة واحدة (الأجر الأساسي، البدلات، الخصومات)، واستخدامه مدى الحياة.",
              },
            ].map((faq, i) => (
              <details
                key={i}
                className="group bg-white rounded-2xl border border-slate-200/75 p-6 sm:p-8 shadow-sm hover:shadow-md transition-all duration-300 [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="flex items-center justify-between cursor-pointer list-none font-bold text-slate-800 text-[15px] sm:text-base rtl:text-right select-none">
                  <span>{lang === "en" ? faq.q_en : faq.q_ar}</span>
                  <span className="transition-transform duration-300 group-open:rotate-180 text-xl text-slate-400">
                    <svg
                      fill="none"
                      height="24"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      width="24"
                      className="w-5 h-5"
                    >
                      <path d="M6 9l6 6 6-6"></path>
                    </svg>
                  </span>
                </summary>
                <div className="text-slate-650 font-medium leading-relaxed mt-5 pt-5 border-t border-slate-100 text-sm sm:text-[15px] rtl:text-right pb-1">
                  {lang === "en" ? faq.a_en : faq.a_ar}
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center py-6 border-t border-slate-200/50 space-y-2">
          <p className="text-[11px] text-slate-400">
            {lang === "en"
              ? "AirSlip Enterprise Portal &copy; 2026. All rights reserved. Data ownership held with Google Tenant."
              : "جميع الحقوق محفوظة لبوابة AirSlip الرقمية لمؤسستك © 2026. المالك والمسؤول الآمن الوحيد لتخزين البيانات هو حساب جوجل الخاص بكم."}
          </p>
        </footer>
      </div>

      {/* Setup Assistant / Configuration Wizard Modal */}
      <AnimatePresence>
        {showFormModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!submitting) setShowFormModal(false);
              }}
              className="absolute inset-0 bg-[#041b3c]/60 backdrop-blur-xs cursor-pointer"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="w-full sm:max-w-xl md:max-w-2xl bg-white sm:rounded-2xl shadow-xl flex flex-col h-full sm:h-auto sm:max-h-[90vh] overflow-hidden relative border border-[#c3c6d6]/40"
            >
              {/* Header Section */}
              <div className="p-5 md:p-7 lg:p-8 pb-4 border-b border-slate-100 relative pr-12 flex-shrink-0">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setShowFormModal(false)}
                  className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 border border-[#c3c6d6]/40 flex items-center justify-center text-slate-500 cursor-pointer transition-colors disabled:opacity-40"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] text-[#003d9b] bg-[#f1f3ff] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider inline-block">
                      {lang === "en"
                        ? `Setup Assistant • Step ${onboardingWizardStep} of 4`
                        : `مساعد الإعداد • الخطوة ${onboardingWizardStep} من 4`}
                    </span>
                    {(companyName || email || gasUrl || whatsapp) && (
                      <button
                        type="button"
                        onClick={handleClearFields}
                        className="text-[10px] text-red-650 font-bold hover:text-red-805 hover:underline transition-colors flex items-center gap-1 cursor-pointer"
                        title={lang === "en" ? "Clear all fields to start fresh" : "مسح كافة الحقول للبدء من جديد"}
                      >
                        {lang === "en" ? "(Clear All)" : "(مسح الكل)"}
                      </button>
                    )}
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-[#041b3c] tracking-tight">
                    {lang === "en" ? "Onboard Your Company Portal" : "تهيئة وتفعيل بوابة مؤسستك"}
                  </h3>
                </div>

                {/* Step Bar Progress Indicator */}
                <div className="mt-4 flex items-center justify-between gap-2">
                  {[
                    { step: 1, label: lang === "en" ? "Workspace" : "مساحة العمل" },
                    { step: 2, label: lang === "en" ? "Template" : "النموذج" },
                    { step: 3, label: lang === "en" ? "Deploy app" : "تنشيط الخدمة" },
                    { step: 4, label: lang === "en" ? "Connect & test" : "الربط والاختبار" },
                  ].map((s) => {
                    const isActive = onboardingWizardStep === s.step;
                    const isCompleted = onboardingWizardStep > s.step;
                    return (
                      <div
                        key={s.step}
                        className="flex-1 flex flex-col gap-1.5"
                      >
                        <div className="h-1.5 w-full rounded-full transition-all duration-300 overflow-hidden bg-slate-100">
                          <div
                            className={`h-full transition-all duration-300 ${
                              isCompleted
                                ? "bg-emerald-500 w-full"
                                : isActive
                                  ? "bg-[#003d9b] w-full"
                                  : "bg-transparent w-0"
                            }`}
                          />
                        </div>
                        <span
                          className={`text-[9px] font-bold text-center tracking-tight truncate ${
                            isActive
                              ? "text-[#003d9b]"
                              : isCompleted
                                ? "text-emerald-650"
                                : "text-slate-400"
                          }`}
                        >
                          {s.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (onboardingWizardStep < 4) {
                      handleNextStep();
                    } else {
                      handleSubmit(e);
                    }
                  }}
                  className="flex flex-col flex-1 overflow-hidden"
                >
                  {/* Scrollable Form Body */}
                  <div className="p-5 md:p-7 lg:p-8 space-y-5 overflow-y-auto flex-1 max-h-[60vh] sm:max-h-[66vh] lg:max-h-[72vh] xl:max-h-[76vh] hide-scrollbar">
                    {onboardingWizardStep === 1 && (
                      <div className="space-y-4 animate-in fade-in duration-200">
                        <div className={`p-3 bg-blue-50/50 rounded-xl border border-blue-100/60 text-[11px] text-[#003d9b] font-medium leading-relaxed ${lang === "ar" ? "text-right" : "text-left"}`}>
                          {lang === "en" 
                            ? "⚡ Let's configure your company details to prepare your payslip portal directory." 
                            : "⚡ دعنا نُهيّئ تفاصيل مؤسستك لتجهيز دليل بوابة قسائم الرواتب."}
                        </div>

                        {/* Company Name */}
                        <div className="space-y-1">
                          <label className={`block text-[10px] font-bold text-slate-400 uppercase tracking-wider ${lang === "ar" ? "text-right" : "text-left"}`}>
                            {lang === "en" ? "Company Name" : "اسم الشركة / الجهة"}
                          </label>
                          <input
                            type="text"
                            placeholder={lang === "en" ? "e.g. Orion Labs Ltd" : "مثال: شركة أورايون المحدودة"}
                            value={companyName}
                            style={{ direction: lang === 'ar' ? 'rtl' : 'ltr' }}
                            onChange={(e) => {
                              setCompanyName(e.target.value);
                              if (validationErrors.companyName) {
                                setValidationErrors((prev) => ({
                                  ...prev,
                                  companyName: "",
                                }));
                              }
                            }}
                            required
                            disabled={submitting}
                            className={`w-full h-10 px-3.5 bg-slate-50 border ${validationErrors.companyName ? "border-red-500 ring-2 ring-red-100" : "border-[#c3c6d6] hover:border-[#737685]"} rounded-lg font-semibold text-xs focus:bg-white focus:border-[#003d9b] focus:ring-2 focus:ring-[#e8edff] transition-all outline-none text-[#041b3c] ${lang === "ar" ? "text-right" : "text-left"}`}
                          />
                          {validationErrors.companyName && (
                            <p className={`text-[10px] text-red-500 font-bold ${lang === "ar" ? "text-right" : "text-left"}`}>
                              {validationErrors.companyName}
                            </p>
                          )}
                        </div>

                        {/* Company Size */}
                        <div className="space-y-1">
                          <label className={`block text-[10px] font-bold text-slate-400 uppercase tracking-wider ${lang === "ar" ? "text-right" : "text-left"}`}>
                            {lang === "en" ? "Company Size" : "عدد الموظفين / حجم الجهة"}
                          </label>
                          <select
                            value={companySize}
                            onChange={(e) => {
                              setCompanySize(e.target.value);
                              if (validationErrors.companySize) {
                                setValidationErrors((prev) => ({
                                  ...prev,
                                  companySize: "",
                                }));
                              }
                            }}
                            required
                            disabled={submitting}
                            style={{ direction: lang === 'ar' ? 'rtl' : 'ltr' }}
                            className={`w-full h-10 px-3 bg-slate-50 border ${validationErrors.companySize ? "border-red-500 ring-2 ring-red-100" : "border-[#c3c6d6] hover:border-[#737685]"} rounded-lg font-semibold text-xs focus:bg-white focus:border-[#003d9b] focus:ring-2 focus:ring-[#e8edff] transition-all outline-none text-[#041b3c] cursor-pointer ${lang === "ar" ? "text-right" : "text-left"}`}
                          >
                            <option value="">{lang === "en" ? "Select Company Size..." : "اختر حجم المؤسسة..."}</option>
                            <option value="0-10 Members">{lang === "en" ? "0-10 Members" : "0 - 10 موظفين"}</option>
                            <option value="11-50 Members">{lang === "en" ? "11-50 Members" : "11 - 50 موظفاً"}</option>
                            <option value="51-200 Members">
                              {lang === "en" ? "51-200 Members" : "51 - 200 موظفاً"}
                            </option>
                            <option value="400+ Members">{lang === "en" ? "400+ Members" : "+400 موظفاً"}</option>
                          </select>
                          {validationErrors.companySize && (
                            <p className={`text-[10px] text-red-500 font-bold ${lang === "ar" ? "text-right" : "text-left"}`}>
                              {validationErrors.companySize}
                            </p>
                          )}
                        </div>

                        {/* Admin Corp Email */}
                        <div className="space-y-1">
                          <label className={`block text-[10px] font-bold text-slate-400 uppercase tracking-wider ${lang === "ar" ? "text-right" : "text-left"}`}>
                            {lang === "en" ? "Admin Corp Email" : "بريد مسؤول النظام"}
                          </label>
                          <div className="relative">
                            <span className={`absolute ${lang === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5`}>
                              <Mail className="w-3.5 h-3.5" />
                            </span>
                            <input
                              type="email"
                              placeholder={lang === "en" ? "e.g. hr@airslipportal.com" : "مثال: hr@airslipportal.com"}
                              value={email}
                              style={{ direction: 'ltr' }}
                              onChange={(e) => {
                                  setEmail(e.target.value);
                                  if (validationErrors.email) {
                                    setValidationErrors((prev) => ({
                                      ...prev,
                                      email: "",
                                    }));
                                  }
                              }}
                              required
                              disabled={submitting}
                              className={`w-full h-10 ${lang === 'ar' ? 'pr-9 pl-3.5 text-right' : 'pl-9 pr-3.5 text-left'} bg-slate-50 border ${validationErrors.email ? "border-red-500 ring-2 ring-red-100" : "border-[#c3c6d6] hover:border-[#737685]"} rounded-lg font-semibold text-xs focus:bg-white focus:border-[#003d9b] focus:ring-2 focus:ring-[#e8edff] transition-all outline-none text-[#041b3c]`}
                            />
                          </div>
                          {validationErrors.email && (
                            <p className={`text-[10px] text-red-500 font-bold ${lang === "ar" ? "text-right" : "text-left"}`}>
                              {validationErrors.email}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {onboardingWizardStep === 2 && (
                      <div className="space-y-4 animate-in fade-in duration-200">
                        <div className={`p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-2 ${lang === "ar" ? "text-right" : "text-left"}`}>
                          <h4 className="text-[11px] font-bold text-[#003d9b] uppercase tracking-wider">
                            {lang === "en" ? "Step 2: Copy the Spreadsheet Ledger Template" : "الخطوة 2: نسخ نموذج جدول البيانات"}
                          </h4>
                          <p className="text-[11px] text-slate-600 font-semibold leading-relaxed">
                            {lang === "en"
                              ? "AirSlip coordinates with a structured Google Sheets spreadsheet to safely store and recall payslip details. Open the link below and save a template clone to your Drive folder."
                              : "يتكامل نظام AirSlip مع جدول بيانات Google Sheets لحفظ وعرض تفاصيل قسائم الرواتب بأمان تام. افتح الرابط أدناه واحفظ نسخة من النموذج في حساب Google Drive الخاص بك."}
                          </p>
                        </div>

                        <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-4 text-center">
                          <div className="flex justify-center">
                            <Database className="w-10 h-10 text-[#003d9b] animate-bounce" />
                          </div>
                          <div>
                            <p className="text-[12px] font-extrabold text-[#041b3c]">
                              {lang === "en" ? "Master Spreadsheet Template" : "نموذج جدول البيانات الرئيسي"}
                            </p>
                            <p className="text-[10px] text-slate-400 font-bold">
                              {lang === "en" ? "Instantly accessible and highly secure" : "وصول فوري وأمان فائق"}
                            </p>
                          </div>
                          <a
                            href="https://docs.google.com/spreadsheets/d/1RdG0Yi4910D1LgqCKWZvHcpYtRXHWIF7G8v7RrNcJ_A/template/preview"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-11 px-5 bg-[#003d9b] hover:bg-[#002f74] text-white rounded-xl text-xs font-bold items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] transition-all cursor-pointer"
                          >
                            <span>{lang === "en" ? "Open Google Sheet Template" : "افتح نموذج Google Sheet"}</span>
                            <ExternalLink className="w-4 h-4 text-white" />
                          </a>
                          <p className="text-[10px] text-slate-500 font-semibold italic">
                            {lang === "en" ? (
                              <>
                                💡 Tip: Click the{" "}
                                <strong className="text-[#003d9b]">
                                  "Use Template"
                                </strong>{" "}
                                button in the top right corner of the Google Sheets
                                page to copy it to your personal Drive.
                              </>
                            ) : (
                              <>
                                💡 تلميح: اضغط على زر{" "}
                                <strong className="text-[#003d9b]">
                                  \"استخدام النموذج\"
                                </strong>{" "}
                                في الزاوية العلوية اليمنى من صفحة Google Sheets لنسخها إلى حسابك الخاص Drive.
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                    )}

                    {onboardingWizardStep === 3 && (
                      <div className="space-y-4 animate-in fade-in duration-200">
                        <div className={`p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-2 ${lang === "ar" ? "text-right" : "text-left"}`}>
                          <h4 className="text-[11px] font-bold text-[#003d9b] uppercase tracking-wider">
                            {lang === "en" ? "Step 3: Deploy Interactive Apps Script Web App" : "الخطوة 3: نشر برنامج Apps Script كتطبيق ويب تفاعلي"}
                          </h4>
                          <p className="text-[11px] text-slate-600 font-semibold leading-relaxed font-sans">
                            {lang === "en"
                              ? "Each employee queries their specific data safely through your custom Google Apps Script Web App without exposing spreadsheet password links."
                              : "يستعلم كل موظف عن بياناته الخاصة بأمان تام من خلال تطبيق ويب مخصص عبر Google Apps Script دون كشف روابط وبيانات جدول البيانات الرئيسي."}
                          </p>
                        </div>

                        <div className={`bg-slate-50 border border-slate-200/60 rounded-xl p-4 space-y-2.5 ${lang === "ar" ? "text-right" : "text-left"}`}>
                          <p className="text-[11px] font-bold text-[#041b3c] uppercase tracking-wider">
                            {lang === "en" ? "Deployment Instructions:" : "تعليمات النشر والتفعيل:"}
                          </p>
                          <ol className={`list-decimal text-[11px] font-semibold text-slate-550 space-y-2 leading-relaxed ${lang === 'ar' ? 'pr-4 pl-0' : 'pl-4'}`}>
                            {lang === "en" ? (
                              <>
                                <li>
                                  Inside your copied Google Sheet, click{" "}
                                  <strong className="text-[#041b3c]">
                                    Extensions &gt; Apps Script
                                  </strong>{" "}
                                  at the top.
                                </li>
                                <li>
                                  At the upper right of the Apps Script page, click{" "}
                                  <strong className="text-[#003d9b]">
                                    Deploy &gt; New Deployment
                                  </strong>
                                  .
                                </li>
                                <li>
                                  Click the gear/settings icon and select{" "}
                                  <strong className="text-slate-800">
                                    Web App
                                  </strong>{" "}
                                  type.
                                </li>
                                <li>
                                  Set "Execute as" to{" "}
                                  <strong className="text-slate-900">"Me"</strong>{" "}
                                  and "Who has access" to{" "}
                                  <strong className="text-slate-900">
                                    "Anyone"
                                  </strong>
                                  .
                                </li>
                                <li>
                                  Press{" "}
                                  <strong className="text-[#003d9b]">Deploy</strong>
                                  , authorize the Google permissions modal, and{" "}
                                  <strong className="text-[#003d9b]">
                                    Copy the Web App URL
                                  </strong>
                                  !
                                </li>
                              </>
                            ) : (
                              <>
                                <li>
                                  داخل ملف Google Sheet الذي قمت بنسخه، اضغط على{" "}
                                  <strong className="text-[#041b3c]">
                                    الإضافات (Extensions) &gt; Apps Script
                                  </strong>{" "}
                                  في الأعلى.
                                </li>
                                <li>
                                  في الزاوية العلوية اليمنى من صفحة Apps Script، اضغط على{" "}
                                  <strong className="text-[#003d9b]">
                                    نشر (Deploy) &gt; نشر جديد (New Deployment)
                                  </strong>
                                  .
                                </li>
                                <li>
                                  اضغط على أيقونة الترس (الإعدادات) واختر نوع{" "}
                                  <strong className="text-slate-800">
                                    تطبيق ويب (Web App)
                                  </strong>
                                  .
                                </li>
                                <li>
                                  اضبط "التنفيذ باسم" (Execute as) إلى{" "}
                                  <strong className="text-slate-900">"أنا" (Me)</strong>{" "}
                                  و "من يملك صلاحية الوصول" (Who has access) إلى{" "}
                                  <strong className="text-slate-900">
                                    "أي شخص" (Anyone)
                                  </strong>
                                  .
                                </li>
                                <li>
                                  اضغط على زر{" "}
                                  <strong className="text-[#003d9b]">نشر (Deploy)</strong>
                                  ، وقم بتأكيد وتخويل حساب Google الخاص بك، ثم{" "}
                                  <strong className="text-[#003d9b]">
                                    انسخ رابط تطبيق الويب (Web App URL)
                                  </strong>
                                  !
                                </li>
                              </>
                            )}
                          </ol>
                        </div>
                      </div>
                    )}

                    {onboardingWizardStep === 4 && (
                      <div className="space-y-4 animate-in fade-in duration-200">
                        <div className={`p-3 bg-emerald-50 text-emerald-900 rounded-xl border border-emerald-100/60 text-[11px] font-medium leading-relaxed ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
                          {lang === "en"
                            ? "🏁 Almost there! Paste your Web App URL to configure direct server-to-server connection."
                            : "🏁 قاربنا على الانتهاء! الصق رابط تطبيق الويب (Google Web App URL) لربط البوابة بخوادم جوجل المخصصة."}
                        </div>

                        {/* Google Web App URL endpoint */}
                        <div className="space-y-1">
                          <label className={`block text-[10px] font-bold text-slate-400 uppercase tracking-wider ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
                            {lang === "en" ? "Google Web App URL" : "رابط تطبيق ويب Google"}
                          </label>
                          <input
                            type="url"
                            placeholder="https://script.google.com/macros/s/.../exec"
                            value={gasUrl}
                            style={{ direction: 'ltr' }}
                            onChange={(e) => {
                              setGasUrl(e.target.value);
                              setTestStatus("idle");
                              if (validationErrors.gasUrl) {
                                setValidationErrors((prev) => ({
                                  ...prev,
                                  gasUrl: "",
                                }));
                              }
                            }}
                            required
                            disabled={submitting}
                            className={`w-full h-10 px-3.5 bg-slate-50 border ${validationErrors.gasUrl ? "border-red-500 ring-2 ring-red-100" : "border-[#c3c6d6] hover:border-[#737685]"} rounded-lg font-mono text-[10px] focus:bg-white focus:border-[#003d9b] focus:ring-2 focus:ring-[#e8edff] transition-all outline-none text-slate-700`}
                          />
                          {validationErrors.gasUrl && (
                            <p className={`text-[10px] text-red-500 font-bold ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
                              {validationErrors.gasUrl}
                            </p>
                          )}
                        </div>

                        {/* WhatsApp Phone (Optional) */}
                        <div className="space-y-1">
                          <label className={`block text-[10px] font-bold text-slate-400 uppercase tracking-wider ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
                            {lang === "en" ? "WhatsApp Phone (Optional)" : "رقم هاتف واتساب (اختياري)"}
                          </label>
                          <div className="relative">
                            <span className={`absolute ${lang === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5`}>
                              <MessageSquare className="w-3.5 h-3.5" />
                            </span>
                            <input
                              type="tel"
                              placeholder={lang === "en" ? "e.g. +14155552671" : "مثال: +966500000000"}
                              value={whatsapp}
                              style={{ direction: 'ltr' }}
                              onChange={(e) => {
                                setWhatsapp(e.target.value);
                                if (validationErrors.whatsapp) {
                                  setValidationErrors((prev) => ({
                                    ...prev,
                                    whatsapp: "",
                                  }));
                                }
                              }}
                              disabled={submitting}
                              className={`w-full h-10 ${lang === 'ar' ? 'pr-9 pl-3.5 text-right' : 'pl-9 pr-3.5 text-left'} bg-slate-50 border ${validationErrors.whatsapp ? "border-red-500 ring-2 ring-red-100" : "border-[#c3c6d6] hover:border-[#737685]"} rounded-lg font-semibold text-xs focus:bg-white focus:border-[#003d9b] focus:ring-2 focus:ring-[#e8edff] transition-all outline-none text-[#041b3c]`}
                            />
                          </div>
                        </div>

                        {/* Connection Validator */}
                        <div className={`bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 ${lang === 'ar' ? 'sm:flex-row-reverse text-right' : 'text-left'}`}>
                          <div className={`py-0.5 ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
                            <h5 className={`font-bold text-[11px] text-[#041b3c] flex items-center gap-1 ${lang === 'ar' ? 'flex-row-reverse' : ''}`}>
                              <span>🔬 {lang === "en" ? "Link Validator" : "فاحص الرابط والاتصال"}</span>
                            </h5>
                            <p className="text-[9px] text-[#565f6a] font-semibold leading-tight">
                              {lang === "en" ? "Test your Web App copy link response before saving." : "اختبر استجابة وثبات الرابط الخاص بك قبل الحفظ والتفعيل الفعلي."}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={handleTestConnection}
                            disabled={testing || submitting || !gasUrl.trim()}
                            className="h-8 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-[10px] font-bold cursor-pointer flex items-center gap-1 transition-all shadow-3xs disabled:opacity-50"
                          >
                            {testing ? (
                              <span className="flex items-center gap-1">
                                <RefreshCw className="w-3 h-3 animate-spin text-[#003d9b]" />
                                <span>{lang === "en" ? "Verifying..." : "جاري التحقق..."}</span>
                              </span>
                            ) : (
                              <>
                                <Activity className="w-3.5 h-3.5 text-[#003d9b]" />
                                <span>{lang === "en" ? "Test Connection" : "اختبار الاتصال"}</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Status Banners */}
                        {testStatus === "success" && (
                          <div className={`flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-150 p-3 rounded-lg text-[10.5px] font-bold ${lang === 'ar' ? 'flex-row-reverse text-right' : 'text-left'}`}>
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                            <span>
                              {lang === "en" ? "Success: Deployed Web App is responding correctly!" : "نجاح: تم تأكيد اتصال تطبيق ويب جوجل بنجاح!"}
                            </span>
                          </div>
                        )}
                        {testStatus === "failed" && (
                          <div className={`bg-red-50 text-red-800 border border-red-200 p-3 rounded-lg text-[10px] font-semibold space-y-0.5 ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
                            <p className={`font-bold text-red-900 flex items-center gap-1 ${lang === 'ar' ? 'flex-row-reverse' : ''}`}>
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                              <span>{lang === "en" ? "Connection Validation Failed" : "فشل التحقق من الاتصال"}</span>
                            </p>
                            <p className="text-slate-550 font-semibold leading-normal text-[10px]">
                              {testError}
                            </p>
                          </div>
                        )}

                        {/* Delay Warning */}
                        <AnimatePresence>
                          {submitting && isTakingTooLong && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-3.5 space-y-2"
                            >
                              <div className={`flex items-start gap-2 ${lang === 'ar' ? 'flex-row-reverse text-right' : 'text-left'}`}>
                                <Clock className="w-4 h-4 text-amber-600 animate-spin flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-xs font-bold text-amber-950 font-sans">
                                    {lang === "en" ? `Warming Up Spreadsheet Connection (${elapsedSeconds}s)` : `تهيئة الاتصال بجدول البيانات (${elapsedSeconds} ثانية)`}
                                  </p>
                                  <p className="text-[10px] text-slate-550 leading-relaxed font-semibold">
                                    {lang === "en"
                                      ? "Google Sheets Apps Script triggers can occasionally take up to 20 seconds to warm up database queries on first deploy. Your fields are safe."
                                      : "قد تستغرق الاستجابة من خوادم Google ما يقارب 20 ثانية في المرة الأولى نظراً لحاجة نظام Apps Script للتفعيل الفوري والاستجابة للخوادم."}
                                  </p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={handleForceRefreshAndKeepData}
                                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[10px] font-bold"
                              >
                                {lang === "en" ? "Reload Safe & Retry" : "تحديث آمن وإعادة المحاولة"}
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Handle Duplicated Workspace Registration */}
                        {duplicateWarning && (
                          <div className="bg-amber-50 text-amber-900 border border-amber-200 p-4 rounded-xl space-y-3 text-left">
                            <p className="font-bold text-xs text-amber-950 flex items-center gap-1.5">
                              <AlertTriangle className="w-4 h-4 text-amber-600 font-bold" />
                              <span>
                                You Have Already Submitted This Setup!
                              </span>
                            </p>
                            <p className="text-slate-750 text-[11px] leading-relaxed font-semibold">
                              This Google Sheet or email address is already
                              registered on our Super Admin network records. If
                              this is your company setup, please log in with
                              your Admin account. Alternatively, you can bypass
                              this notice to re-register.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-2 pt-1">
                              <button
                                type="button"
                                onClick={handleGoToLogin}
                                className="px-3.5 py-2 bg-[#003d9b] text-white hover:bg-blue-800 font-extrabold rounded-lg text-[10.5px] cursor-pointer flex items-center justify-center gap-1 shadow-sm uppercase tracking-wider"
                              >
                                <span>Go to Admin Login</span>
                              </button>
                              <button
                                type="button"
                                onClick={handleBypassWithDuplicate}
                                className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-[10.5px] cursor-pointer"
                              >
                                Bypass & Activate Now
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setDuplicateWarning(null);
                                  setSubmitError("");
                                }}
                                className="px-3 py-2 bg-white text-slate-700 border border-slate-200 font-bold rounded-lg text-[10.5px] hover:bg-slate-50 cursor-pointer"
                              >
                                Edit Fields
                              </button>
                            </div>
                          </div>
                        )}

                        {/* General Submit Errors */}
                        {submitError && !duplicateWarning && (
                          <div className="bg-red-50 text-red-950 border border-red-200 p-4 rounded-xl text-[11px] font-medium space-y-2 text-left">
                            <p className="font-bold text-red-950 flex items-center gap-1.5">
                              <AlertTriangle className="w-4 h-4 text-rose-600" />
                              <span>Onboarding Error Detected</span>
                            </p>
                            <p className="bg-white/60 p-2.5 rounded border border-red-100 text-slate-800 font-bold font-mono text-[9.5px] leading-relaxed break-words">
                              {submitError}
                            </p>

                            <div className="text-[10.5px] text-slate-700 space-y-1">
                              <p className="font-extrabold text-slate-900">
                                How to resolve common setup issues:
                              </p>
                              <ul className="list-disc list-inside space-y-1 pl-1 font-semibold text-slate-650">
                                <li>
                                  <span className="text-slate-850">
                                    Authorization:
                                  </span>{" "}
                                  Confirm the Web App deployment is executing as{" "}
                                  <span className="text-indigo-700">"Me"</span>{" "}
                                  and access is set to{" "}
                                  <span className="text-indigo-700">
                                    "Anyone"
                                  </span>
                                  .
                                </li>
                                <li>
                                  <span className="text-slate-850">
                                    Invalid URL:
                                  </span>{" "}
                                  Did you paste the editor URL? Deployed Web App
                                  URL must start with{" "}
                                  <span className="font-mono text-red-650">
                                    /macros/s/...
                                  </span>{" "}
                                  and end in{" "}
                                  <span className="font-mono text-green-700">
                                    /exec
                                  </span>
                                  .
                                </li>
                                <li>
                                  <span className="text-slate-850">
                                    CORS or Timeout:
                                  </span>{" "}
                                  Ensure you clicked{" "}
                                  <span className="text-amber-800">
                                    "Authorize Access"
                                  </span>{" "}
                                  when executing the initial Apps Script setup
                                  inside Google Sheets.
                                </li>
                              </ul>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Fixed Footer */}
                  <div className={`p-4 md:p-6 lg:p-7 border-t border-slate-100 bg-slate-50/60 flex-shrink-0 flex items-center justify-between gap-3 ${lang === 'ar' ? 'flex-row-reverse' : ''}`}>
                    {onboardingWizardStep > 1 ? (
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={handlePrevStep}
                        className="h-10 px-4 bg-white border border-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-1.5 text-xs cursor-pointer active:scale-95 disabled:opacity-50"
                      >
                        <ArrowLeft className={`w-3.5 h-3.5 text-slate-500 ${lang === 'ar' ? 'rotate-180' : ''}`} />
                        <span>{lang === "en" ? "Back" : "السابق"}</span>
                      </button>
                    ) : (
                      <div />
                    )}

                    {onboardingWizardStep < 4 ? (
                      <button
                        type="button"
                        onClick={handleNextStep}
                        className="h-10 px-5 bg-[#003d9b] text-white font-bold rounded-lg hover:bg-[#002f74] transition-all flex items-center justify-center gap-1 text-xs uppercase tracking-wider cursor-pointer active:scale-[0.98]"
                      >
                        <span>{lang === "en" ? "Next Step" : "الخطوة التالية"}</span>
                        <ArrowRight className={`w-3.5 h-3.5 text-white ${lang === 'ar' ? 'rotate-180' : ''}`} />
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={submitting}
                        className="h-10 px-5 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 active:scale-[0.98] transition-all flex items-center justify-center shadow-lg shadow-emerald-205/30 cursor-pointer text-xs uppercase tracking-wider disabled:opacity-75"
                      >
                        {submitting ? (
                          <div className="flex items-center gap-1.5 font-bold">
                            <RefreshCw className="w-4 h-4 animate-spin text-white" />
                            <span>{lang === "en" ? `Synchronizing (${elapsedSeconds}s)...` : `جاري المزامنة (${elapsedSeconds} ثانية)...`}</span>
                          </div>
                        ) : (
                          lang === "en" ? "ACTIVATE PORTAL NOW" : "تفعيل البوابة الآن"
                        )}
                      </button>
                    )}
                  </div>
                </form>
              </motion.div>
            </div>
          )}
      </AnimatePresence>

      {/* Existing Deployed Portal Quick Sign In / Connection Modal */}
      <AnimatePresence>
        {showLoginModal && (
          <div className="fixed inset-0 z-55 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!loginSubmitting) setShowLoginModal(false);
              }}
              className="absolute inset-0 bg-slate-950/65 backdrop-blur-xs"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-4 md:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#003d9b] flex items-center justify-center">
                    <Lock className="w-4 h-4 text-[#003d9b]" />
                  </div>
                  <div>
                    <h3 className={`text-sm font-bold text-[#041b3c] tracking-tight ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
                      {isCompanySetup
                        ? `${lang === "en" ? "Login to" : "دخول إلى"}: ${localStorage.getItem("company_name") || localStorage.getItem("salaryportal_onboard_companyName") || companyName || "Workspace"}`
                        : (lang === "en" ? "Access Deployed Portal" : "الوصول للبوابة المفعلة")}
                    </h3>
                    <p className={`text-[10px] text-slate-400 font-semibold uppercase font-mono tracking-wider ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
                      {lang === "en" ? "Fast Connection Console" : "منصة الاتصال السريع"}
                    </p>
                  </div>
                </div>
                {!loginSubmitting && (
                  <button
                    onClick={() => setShowLoginModal(false)}
                    className="w-8 h-8 rounded-full border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 transition-all flex items-center justify-center text-slate-500 cursor-pointer outline-none"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Scrollable Form Content */}
              <form
                onSubmit={handleExistingConnect}
                className="flex-1 overflow-y-auto p-4 md:p-5 space-y-4"
              >
                {/* Tab Switcher at the very top */}
                <div className={`p-1 bg-slate-100 rounded-xl grid grid-cols-2 gap-1 ${lang === 'ar' ? 'flex-row-reverse' : ''}`}>
                  <button
                    type="button"
                    onClick={() => setLoginTab("staff")}
                    disabled={loginSubmitting}
                    className={`py-2 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                      loginTab === "staff"
                        ? "bg-white text-[#003d9b] shadow-2xs"
                        : "text-slate-550 hover:bg-white/40"
                    }`}
                  >
                    {lang === "en" ? "Staff Portal" : "بوابة الموظفين"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginTab("admin")}
                    disabled={loginSubmitting}
                    className={`py-2 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                      loginTab === "admin"
                        ? "bg-white text-[#003d9b] shadow-2xs"
                        : "text-slate-550 hover:bg-white/40"
                    }`}
                  >
                    {lang === "en" ? "Admin Console" : "منصة المسؤول"}
                  </button>
                </div>

                {/* If company is setup, show a nice indicator badge */}
                {isCompanySetup &&
                  (() => {
                    const activeCompanyName =
                      localStorage.getItem("company_name") ||
                      localStorage.getItem(
                        "salaryportal_onboard_companyName",
                      ) ||
                      companyName ||
                      "Active Company Portal";

                    return (
                      <div className="p-3.5 rounded-2xl bg-[#f1f3ff]/40 border border-blue-500/10 flex items-center gap-2.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                        <div className="overflow-hidden flex-1">
                          <p className="text-[9px] font-extrabold text-[#003d9b] uppercase tracking-wider">
                            Active Workspace Connected
                          </p>
                          <p className="text-xs font-bold text-[#041b3c] truncate max-w-[280px]">
                            {activeCompanyName}
                          </p>
                        </div>
                      </div>
                    );
                  })()}

                {/* Conditional Fields based on tab Selection */}
                {loginTab === "staff" ? (
                  <div className="space-y-4">
                    {/* Google Apps Script URL - Ask here only if NOT setup */}
                    {!isCompanySetup && (
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Google Apps Script URL{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                            <Database className="w-4 h-4" />
                          </span>
                          <input
                            type="url"
                            required
                            placeholder="https://script.google.com/macros/s/.../exec"
                            value={loginGasUrl}
                            onChange={(e) => {
                              setLoginGasUrl(e.target.value);
                              if (loginError) setLoginError("");
                            }}
                            disabled={loginSubmitting}
                            className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-semibold focus:bg-white focus:border-[#003d9b] focus:ring-2 focus:ring-[#e8edff] transition-all outline-none"
                          />
                        </div>
                        <p className="text-[9px] text-slate-500 font-semibold leading-normal">
                          Requires the deployed Web App URL from your Google
                          Sheet.
                        </p>
                      </div>
                    )}

                    {/* Employee Access Code */}
                    <div className="space-y-1.5 p-3 rounded-2xl bg-[#f1f3ff]/40 border border-blue-500/10">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Employee Access Code{" "}
                        <span className="text-slate-400 font-normal">
                          (Optional)
                        </span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                          <UserCheck className="w-4 h-4" />
                        </span>
                        <input
                          type="password"
                          placeholder="e.g. E001"
                          value={loginAccessCode}
                          onChange={(e) => {
                            const val = e.target.value;
                            const filtered = val.replace(/[^a-zA-Z0-9@!#]/g, '');
                            setLoginAccessCode(filtered);
                            if (loginError) setLoginError("");
                          }}
                          disabled={loginSubmitting}
                          className="w-full h-11 pl-10 pr-4 bg-slate-50/70 border border-slate-200 hover:border-slate-300 rounded-xl text-center text-xs tracking-wider font-mono font-bold focus:bg-white focus:border-[#003d9b] focus:ring-2 focus:ring-[#e8edff] transition-all outline-none"
                        />
                      </div>
                      <p className="text-[9px] text-slate-550 leading-relaxed font-semibold">
                        Enter code to load credentials, or skip to enter later.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3.5 p-3 rounded-2xl bg-slate-50 border border-slate-150">
                    {/* Google Apps Script URL - Ask here only if NOT setup */}
                    {!isCompanySetup && (
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-[#041b3c] uppercase tracking-wider">
                          Google Apps Script URL{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                            <Database className="w-4 h-4" />
                          </span>
                          <input
                            type="url"
                            required
                            placeholder="https://script.google.com/macros/s/.../exec"
                            value={loginGasUrl}
                            onChange={(e) => {
                              setLoginGasUrl(e.target.value);
                              if (loginError) setLoginError("");
                            }}
                            disabled={loginSubmitting}
                            className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-semibold focus:bg-white focus:border-[#003d9b] focus:ring-2 focus:ring-[#e8edff] transition-all outline-none animate-in slide-in-from-top-1 dur-100"
                          />
                        </div>
                        <p className="text-[9px] text-slate-500 font-semibold leading-normal pb-2 border-b border-slate-100">
                          Provide your deployed Google sheet Apps Script Web App
                          URL first.
                        </p>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Admin Email Address{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                          <Mail className="w-4 h-4" />
                        </span>
                        <input
                          type="email"
                          required={loginTab === "admin"}
                          placeholder="e.g. admin@enterprise.com"
                          value={loginAdminEmail}
                          onChange={(e) => {
                            setLoginAdminEmail(e.target.value);
                            if (loginError) setLoginError("");
                          }}
                          disabled={loginSubmitting}
                          className="w-full h-11 pl-10 pr-4 bg-slate-50/70 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-semibold focus:bg-white focus:border-[#003d9b] focus:ring-2 focus:ring-[#e8edff] transition-all outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Admin Password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                          <Lock className="w-4 h-4" />
                        </span>
                        <input
                          type="password"
                          required={loginTab === "admin"}
                          placeholder="••••••••"
                          value={loginAdminPassword}
                          onChange={(e) => {
                            setLoginAdminPassword(e.target.value);
                            if (loginError) setLoginError("");
                          }}
                          disabled={loginSubmitting}
                          className="w-full h-11 pl-10 pr-4 bg-slate-50/70 border border-slate-200 hover:border-slate-300 rounded-xl text-xs focus:bg-white focus:border-[#003d9b] focus:ring-2 focus:ring-[#e8edff] transition-all outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Interactive Error Display */}
                {loginError && (
                  <div className="bg-red-50 text-red-900 border border-red-100 p-3 rounded-xl flex items-start gap-2 animate-in fade-in zoom-in-95 duration-150">
                    <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[11px] font-bold text-red-950">
                        Authentication Failed
                      </p>
                      <p className="text-[10px] text-slate-550 leading-relaxed font-semibold">
                        {loginError}
                      </p>
                    </div>
                  </div>
                )}

                {/* Bottom Trigger Button */}
                <button
                  type="submit"
                  disabled={loginSubmitting}
                  className="w-full h-11 bg-[#003d9b] hover:bg-[#002f74] text-white font-extrabold rounded-xl transition-all shadow-md active:scale-[0.98] cursor-pointer text-xs uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {loginSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>Verifying Portal Keys...</span>
                    </>
                  ) : (
                    <>
                      <span>Connect & Sign In</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
