-- Migration 005: Seed required skills / nice-to-have / responsibilities
-- สำหรับ 8 ตำแหน่ง IT ที่มีใน dropdown
-- อ้างอิงจากตลาด IT ไทย (JobsDB, LinkedIn job postings)

UPDATE public.job_positions SET
  required_skills = '["Java หรือ Python หรือ Node.js หรือ Go หรือ C#","SQL database (MySQL/PostgreSQL/SQL Server)","REST API design","Git/GitHub","Authentication & Authorization (JWT, OAuth)","Error handling & logging","Data structures & algorithms พื้นฐาน"]'::jsonb,
  nice_to_have = '["Docker / Kubernetes","Redis / caching","Message queue (RabbitMQ/Kafka)","Microservices","NoSQL (MongoDB)","CI/CD pipeline","Unit testing"]'::jsonb,
  responsibilities = 'ออกแบบและพัฒนา API/server-side logic, จัดการ database, integrate กับระบบอื่น'
WHERE name = 'Backend Developer';

UPDATE public.job_positions SET
  required_skills = '["SQL (JOIN, GROUP BY, window functions)","Excel / Google Sheets ขั้นสูง","Data visualization (Power BI / Tableau / Looker Studio)","Python หรือ R (Pandas, NumPy)","สถิติพื้นฐาน (mean, median, correlation, hypothesis testing)","Data cleaning & ETL","Dashboard / report building"]'::jsonb,
  nice_to_have = '["BigQuery / Snowflake / Redshift","dbt","A/B testing","Machine learning พื้นฐาน","Business domain knowledge","Storytelling with data"]'::jsonb,
  responsibilities = 'วิเคราะห์ข้อมูลธุรกิจ, สร้าง dashboard, ตอบคำถามจากข้อมูลให้ stakeholder'
WHERE name = 'Data Analyst';

UPDATE public.job_positions SET
  required_skills = '["HTML5 & CSS3","JavaScript (ES6+) หรือ TypeScript","React หรือ Vue หรือ Angular","Responsive design / mobile-first","REST API consumption (fetch/axios)","State management (Redux/Zustand/Pinia)","Git/GitHub","Browser DevTools"]'::jsonb,
  nice_to_have = '["Next.js / Nuxt","Tailwind CSS / styled-components","Testing (Jest, React Testing Library, Cypress)","Web accessibility (a11y)","Performance optimization","UI/UX design sense"]'::jsonb,
  responsibilities = 'พัฒนา UI ของเว็บ, ทำให้ responsive, เชื่อม API จาก backend, ดูแล performance ฝั่ง client'
WHERE name = 'Frontend Developer';

UPDATE public.job_positions SET
  required_skills = '["HTML/CSS/JavaScript","Frontend framework (React/Vue/Angular)","Backend language (Node.js/Python/Java/C#/Go)","SQL database","REST API design + consumption","Git/GitHub","Authentication (JWT/session)","Deploy ขึ้น production (Vercel/Heroku/VPS)"]'::jsonb,
  nice_to_have = '["TypeScript ทั้ง 2 ฝั่ง","Docker","CI/CD","Cloud (AWS/GCP/Azure)","NoSQL","WebSocket / real-time","Testing ทั้ง frontend + backend"]'::jsonb,
  responsibilities = 'พัฒนาทั้ง frontend + backend, ออกแบบ database, deploy, ดูแลทั้ง stack'
WHERE name = 'Full Stack Developer';

UPDATE public.job_positions SET
  required_skills = '["Native: Swift (iOS) หรือ Kotlin/Java (Android) หรือ Cross-platform: Flutter / React Native","Mobile UI/UX patterns (Material/iOS HIG)","REST API consumption","Local storage (SQLite/Realm/SharedPreferences)","Git/GitHub","Debug บนเครื่องจริง","App lifecycle / state management"]'::jsonb,
  nice_to_have = '["Push notifications (FCM/APNs)","In-app purchase","ขึ้น App Store / Play Store เป็น","Firebase (Auth/Firestore/Analytics)","Native module bridging","Performance profiling","Offline-first architecture"]'::jsonb,
  responsibilities = 'พัฒนา mobile app, integrate API, publish app store, แก้บั๊กบนหลาย device'
WHERE name = 'Mobile Application Developer';

UPDATE public.job_positions SET
  required_skills = '["Programming language อย่างน้อย 1 ภาษา (Java/Python/C#/C++/JavaScript)","OOP (class, inheritance, polymorphism)","Data structures (array, list, map, tree)","Algorithm พื้นฐาน (sorting, searching, complexity)","Git/GitHub","SQL พื้นฐาน","Debug + read error message + unit test","อ่าน requirement / spec ได้"]'::jsonb,
  nice_to_have = '["Design patterns","Clean code","Code review","Agile/Scrum","Multiple languages","System design พื้นฐาน"]'::jsonb,
  responsibilities = 'พัฒนา software ตาม spec, แก้บั๊ก, เขียน test, ทำงานร่วมทีม'
WHERE name = 'Software Developer';

UPDATE public.job_positions SET
  required_skills = '["Manual testing (functional, regression, smoke)","Test case design + test plan writing","Bug reporting (steps to reproduce, severity, priority)","JIRA / TestRail / bug tracking tool","Postman / API testing","SDLC + STLC understanding","SQL พื้นฐานสำหรับ data verification"]'::jsonb,
  nice_to_have = '["Test automation (Selenium / Cypress / Playwright)","Performance testing (JMeter)","CI/CD integration","Mobile testing","Security testing พื้นฐาน","ISTQB certificate"]'::jsonb,
  responsibilities = 'เขียน test case, รัน test, log bug, verify fix, regression test ก่อน release'
WHERE name = 'Software Tester';

UPDATE public.job_positions SET
  required_skills = '["Linux administration (Ubuntu/CentOS/RHEL)","Windows Server administration","Networking (TCP/IP, DNS, DHCP, subnet, firewall)","Shell scripting (Bash / PowerShell)","Active Directory / LDAP","Backup & restore","Security patching & hardening","Monitoring (Zabbix/Nagios/Prometheus)"]'::jsonb,
  nice_to_have = '["Cloud (AWS / Azure / GCP)","Virtualization (VMware / Hyper-V)","Docker / Kubernetes","Ansible / Puppet / Chef","SAN/NAS storage","Disaster recovery planning"]'::jsonb,
  responsibilities = 'ดูแล server, network, security, monitor uptime, troubleshoot, backup'
WHERE name = 'System Administrator';
