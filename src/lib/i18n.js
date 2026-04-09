const translations = {
  th: {
    // Navbar
    'app.name': 'AI Resume Analyzer',
    'nav.logout': 'ออกจากระบบ',
    'nav.language': 'EN',

    // Sidebar - Member
    'sidebar.home': 'หน้าหลัก',
    'sidebar.analyze': 'วิเคราะห์เรซูเม่',
    'sidebar.history': 'ประวัติการวิเคราะห์',

    // Sidebar - Admin
    'sidebar.users': 'จัดการผู้ใช้งาน',
    'sidebar.positions': 'จัดการตำแหน่งงาน',
    'sidebar.criteria': 'จัดการเกณฑ์ประเมิน',

    // Auth
    'auth.login': 'เข้าสู่ระบบ',
    'auth.register': 'สมัครสมาชิก',
    'auth.email': 'อีเมล (Email)',
    'auth.password': 'รหัสผ่าน (Password)',
    'auth.confirmPassword': 'ยืนยันรหัสผ่าน',
    'auth.username': 'ชื่อผู้ใช้ (Username)',
    'auth.forgotPassword': 'ลืมรหัสผ่าน?',
    'auth.noAccount': 'ยังไม่มีบัญชี?',
    'auth.hasAccount': 'มีบัญชีอยู่แล้ว?',
    'auth.logging': 'กำลังเข้าสู่ระบบ...',
    'auth.registering': 'กำลังสมัคร...',
    'auth.registerSuccess': 'สมัครสมาชิกสำเร็จ!',
    'auth.emailPlaceholder': 'กรอกอีเมล',
    'auth.passwordPlaceholder': 'กรอกรหัสผ่าน',
    'auth.usernamePlaceholder': 'กรอกชื่อผู้ใช้',
    'auth.passwordMin': 'อย่างน้อย 6 ตัวอักษร',
    'auth.confirmPlaceholder': 'กรอกรหัสผ่านอีกครั้ง',
    'auth.passwordMismatch': 'รหัสผ่านไม่ตรงกัน',
    'auth.passwordTooShort': 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร',
    'auth.sendReset': 'ส่งลิงก์รีเซ็ตรหัสผ่าน',
    'auth.sending': 'กำลังส่ง...',
    'auth.resetSent': 'ส่งลิงก์รีเซ็ตรหัสผ่านไปที่อีเมลแล้ว',
    'auth.checkEmail': 'กรุณาตรวจสอบอีเมล',
    'auth.backToLogin': 'กลับไปหน้าเข้าสู่ระบบ',
    'auth.emailRegistered': 'กรอกอีเมลที่ลงทะเบียน',

    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.analyzeCount': 'จำนวนครั้งที่วิเคราะห์',
    'dashboard.averageScore': 'คะแนนเฉลี่ย',
    'dashboard.latestScore': 'คะแนนล่าสุด',
    'dashboard.analyzeResume': 'วิเคราะห์เรซูเม่',
    'dashboard.analyzeDesc': 'อัปโหลดเรซูเม่และเลือกตำแหน่งงานเพื่อรับคำแนะนำจาก AI',
    'dashboard.historyTitle': 'ประวัติการวิเคราะห์',
    'dashboard.historyDesc': 'ดูผลวิเคราะห์ที่ผ่านมาทั้งหมด',
    'dashboard.latestResult': 'ผลวิเคราะห์ล่าสุด',
    'dashboard.viewDetail': 'ดูรายละเอียด',

    // Analyze
    'analyze.title': 'วิเคราะห์เรซูเม่',
    'analyze.selectPosition': 'ตำแหน่งงานที่ต้องการสมัคร',
    'analyze.fromList': 'เลือกจากรายการ',
    'analyze.custom': 'กรอกเอง',
    'analyze.selectPlaceholder': '-- เลือกตำแหน่งงาน --',
    'analyze.customPlaceholder': 'กรอกตำแหน่งงานในสายงาน IT',
    'analyze.upload': 'อัปโหลดเรซูเม่',
    'analyze.clickToSelect': 'คลิกเพื่อเลือกไฟล์',
    'analyze.fileTypes': 'รองรับ PDF และ DOCX (สูงสุด 5MB)',
    'analyze.changeFile': 'คลิกเพื่อเปลี่ยนไฟล์',
    'analyze.submit': 'วิเคราะห์เรซูเม่',
    'analyze.uploading': 'กำลังอัปโหลด...',
    'analyze.analyzing': 'กำลังวิเคราะห์เรซูเม่ด้วย AI...',
    'analyze.analyzingWait': 'อาจใช้เวลา 10-30 วินาที',
    'analyze.selectPositionError': 'กรุณาเลือกหรือกรอกตำแหน่งงาน',
    'analyze.selectFileError': 'กรุณาเลือกไฟล์เรซูเม่',
    'analyze.fileTypeError': 'รองรับเฉพาะไฟล์ PDF (.pdf) และ Word (.docx) เท่านั้น',
    'analyze.fileSizeError': 'ขนาดไฟล์ต้องไม่เกิน 5MB',
    'analyze.uploadSuccess': 'อัปโหลดสำเร็จ! กำลังไปยังหน้าวิเคราะห์...',

    // Results
    'result.title': 'ผลการวิเคราะห์',
    'result.allHistory': 'ประวัติทั้งหมด',
    'result.newAnalysis': 'วิเคราะห์ใหม่',
    'result.totalScore': 'คะแนนรวม',
    'result.categoryScores': 'คะแนนแต่ละหมวด',
    'result.summary': 'สรุปภาพรวม',
    'result.suggestions': 'คำแนะนำการปรับปรุง',
    'result.file': 'ไฟล์',
    'result.position': 'ตำแหน่งงาน',

    // Score levels
    'score.excellent': 'ดีมาก',
    'score.good': 'ดี',
    'score.fair': 'พอใช้',
    'score.needImprovement': 'ควรปรับปรุง',

    // History
    'history.title': 'ประวัติการวิเคราะห์',
    'history.newAnalysis': 'วิเคราะห์ใหม่',
    'history.empty': 'ยังไม่มีประวัติการวิเคราะห์',
    'history.startNow': 'เริ่มวิเคราะห์เรซูเม่ตอนนี้',
    'history.date': 'วันที่',
    'history.file': 'ไฟล์',
    'history.position': 'ตำแหน่งงาน',
    'history.score': 'คะแนน',
    'history.status': 'สถานะ',
    'history.completed': 'เสร็จสิ้น',
    'history.pending': 'รอวิเคราะห์',
    'history.failed': 'ล้มเหลว',
    'history.viewDetail': 'ดูรายละเอียด',

    // Common
    'common.loading': 'กำลังโหลด...',
    'common.back': '← กลับ',
    'common.save': 'บันทึก',
    'common.cancel': 'ยกเลิก',
    'common.edit': 'แก้ไข',
    'common.delete': 'ลบ',
    'common.total': 'ทั้งหมด',
    'common.person': 'คน',
  },

  en: {
    // Navbar
    'app.name': 'AI Resume Analyzer',
    'nav.logout': 'Logout',
    'nav.language': 'TH',

    // Sidebar - Member
    'sidebar.home': 'Home',
    'sidebar.analyze': 'Analyze Resume',
    'sidebar.history': 'Analysis History',

    // Sidebar - Admin
    'sidebar.users': 'Manage Users',
    'sidebar.positions': 'Manage Positions',
    'sidebar.criteria': 'Scoring Criteria',

    // Auth
    'auth.login': 'Login',
    'auth.register': 'Register',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.confirmPassword': 'Confirm Password',
    'auth.username': 'Username',
    'auth.forgotPassword': 'Forgot Password?',
    'auth.noAccount': "Don't have an account?",
    'auth.hasAccount': 'Already have an account?',
    'auth.logging': 'Logging in...',
    'auth.registering': 'Registering...',
    'auth.registerSuccess': 'Registration successful!',
    'auth.emailPlaceholder': 'Enter email',
    'auth.passwordPlaceholder': 'Enter password',
    'auth.usernamePlaceholder': 'Enter username',
    'auth.passwordMin': 'At least 6 characters',
    'auth.confirmPlaceholder': 'Enter password again',
    'auth.passwordMismatch': 'Passwords do not match',
    'auth.passwordTooShort': 'Password must be at least 6 characters',
    'auth.sendReset': 'Send Reset Link',
    'auth.sending': 'Sending...',
    'auth.resetSent': 'Password reset link sent to your email',
    'auth.checkEmail': 'Please check your email',
    'auth.backToLogin': 'Back to Login',
    'auth.emailRegistered': 'Enter registered email',

    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.analyzeCount': 'Total Analyses',
    'dashboard.averageScore': 'Average Score',
    'dashboard.latestScore': 'Latest Score',
    'dashboard.analyzeResume': 'Analyze Resume',
    'dashboard.analyzeDesc': 'Upload your resume and select a position for AI recommendations',
    'dashboard.historyTitle': 'Analysis History',
    'dashboard.historyDesc': 'View all past analysis results',
    'dashboard.latestResult': 'Latest Result',
    'dashboard.viewDetail': 'View Detail',

    // Analyze
    'analyze.title': 'Analyze Resume',
    'analyze.selectPosition': 'Target Job Position',
    'analyze.fromList': 'Select from list',
    'analyze.custom': 'Custom input',
    'analyze.selectPlaceholder': '-- Select position --',
    'analyze.customPlaceholder': 'Enter IT job position',
    'analyze.upload': 'Upload Resume',
    'analyze.clickToSelect': 'Click to select file',
    'analyze.fileTypes': 'Supports PDF and DOCX (max 5MB)',
    'analyze.changeFile': 'Click to change file',
    'analyze.submit': 'Analyze Resume',
    'analyze.uploading': 'Uploading...',
    'analyze.analyzing': 'Analyzing resume with AI...',
    'analyze.analyzingWait': 'This may take 10-30 seconds',
    'analyze.selectPositionError': 'Please select or enter a job position',
    'analyze.selectFileError': 'Please select a resume file',
    'analyze.fileTypeError': 'Only PDF (.pdf) and Word (.docx) files are supported',
    'analyze.fileSizeError': 'File size must not exceed 5MB',
    'analyze.uploadSuccess': 'Upload successful! Redirecting to analysis...',

    // Results
    'result.title': 'Analysis Results',
    'result.allHistory': 'All History',
    'result.newAnalysis': 'New Analysis',
    'result.totalScore': 'Total Score',
    'result.categoryScores': 'Category Scores',
    'result.summary': 'Summary',
    'result.suggestions': 'Improvement Suggestions',
    'result.file': 'File',
    'result.position': 'Position',

    // Score levels
    'score.excellent': 'Excellent',
    'score.good': 'Good',
    'score.fair': 'Fair',
    'score.needImprovement': 'Needs Improvement',

    // History
    'history.title': 'Analysis History',
    'history.newAnalysis': 'New Analysis',
    'history.empty': 'No analysis history yet',
    'history.startNow': 'Start analyzing your resume now',
    'history.date': 'Date',
    'history.file': 'File',
    'history.position': 'Position',
    'history.score': 'Score',
    'history.status': 'Status',
    'history.completed': 'Completed',
    'history.pending': 'Pending',
    'history.failed': 'Failed',
    'history.viewDetail': 'View Detail',

    // Common
    'common.loading': 'Loading...',
    'common.back': '← Back',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.total': 'Total',
    'common.person': 'users',
  }
}

export function getTranslation(locale, key) {
  return translations[locale]?.[key] || key
}

export function t(locale) {
  return (key) => getTranslation(locale, key)
}
