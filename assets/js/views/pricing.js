window.PricingComponent = {
    props: ['user'],
    data() {
        return { 
            links: {},
            showPaymentModal: false,
            iframeSrc: '',
            checkInterval: null,
            attempts: 0,
            backgroundCheckTimer: null // טיימר לבדיקת הרקע
        } 
    },
    async mounted() {
        try {
            const res = await fetch('/billing/links');
            this.links = await res.json();
        } catch(e) { console.error('Failed to load links'); }
    },
    beforeUnmount() {
        // אם המשתמש עוזב את העמוד לגמרי (למשל לדף הבית), עוצרים הכל מיד
        this.stopVerifying();
        if (this.backgroundCheckTimer) clearTimeout(this.backgroundCheckTimer);
    },
    template: `
    <div class="max-w-6xl mx-auto animate-fade-in py-10 relative">
        
        <div v-if="showPaymentModal" class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div class="bg-white w-full max-w-4xl h-[85vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col relative animate-fade-in-up">
                
                <div class="bg-slate-100 p-4 border-b flex justify-between items-center">
                    <div class="flex items-center gap-2">
                        <i class="fa-solid fa-lock text-green-600"></i>
                        <span class="font-bold text-slate-700">תשלום מאובטח</span>
                        <span class="text-xs text-slate-500 mr-2">(ממתין לאישור אוטומטי...)</span>
                    </div>
                    <button @click="closeModal" class="text-slate-400 hover:text-red-500 transition px-2" title="סגור חלונית (הבדיקה תימשך ברקע)">
                        <i class="fa-solid fa-xmark text-xl"></i>
                    </button>
                </div>

                <div class="flex-1 bg-slate-50 relative">
                    <div class="absolute inset-0 flex items-center justify-center text-slate-400 z-0">
                        <i class="fa-solid fa-circle-notch fa-spin text-3xl"></i>
                    </div>
                    <iframe :src="iframeSrc" class="w-full h-full relative z-10" frameborder="0"></iframe>
                </div>

            </div>
        </div>

        <div class="text-center mb-12">
            <h2 class="text-3xl font-extrabold text-slate-800">בחר את החבילה המתאימה לך</h2>
            <p class="text-slate-500 mt-2">שדרג את המערכת כדי לקבל יותר כוח וגמישות.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
            <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex flex-col hover:border-blue-300 transition hover:-translate-y-1 relative overflow-hidden">
                <h3 class="text-xl font-bold text-slate-800">BASIC</h3>
                <div class="my-4"><span class="text-4xl font-extrabold text-slate-800">₪12</span><span class="text-slate-500">/חודש</span></div>
                <p class="text-sm text-slate-500 mb-6">למתחילים שצריכים קצת יותר.</p>
                <ul class="space-y-3 mb-8 flex-1">
                    <li class="flex items-center gap-2 text-sm text-slate-700"><i class="fa-solid fa-check text-green-500"></i> <b>100,000</b> אירועים</li>
                    <li class="flex items-center gap-2 text-sm text-slate-700"><i class="fa-solid fa-check text-green-500"></i> תמיכה בסיסית</li>
                </ul>
                <button @click="startPayment('link_basic')" class="block w-full py-3 rounded-xl text-center font-bold transition" 
                    :class="user.monthlyLimit === 100000 ? 'bg-slate-100 text-slate-400 cursor-default' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'">
                    {{ user.monthlyLimit === 100000 ? 'חבילה נוכחית' : 'שדרג עכשיו' }}
                </button>
            </div>

            <div class="bg-white rounded-2xl shadow-lg border-2 border-indigo-600 p-8 flex flex-col transform scale-105 relative">
                <div class="absolute top-0 right-0 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">הכי משתלם</div>
                <h3 class="text-xl font-bold text-indigo-600">PRO</h3>
                <div class="my-4"><span class="text-4xl font-extrabold text-slate-800">₪59</span><span class="text-slate-500">/חודש</span></div>
                <p class="text-sm text-slate-500 mb-6">לעסקים בצמיחה עם תעבורה גבוהה.</p>
                <ul class="space-y-3 mb-8 flex-1">
                    <li class="flex items-center gap-2 text-sm text-slate-700"><i class="fa-solid fa-check text-green-500"></i> <b>1,000,000</b> אירועים</li>
                    <li class="flex items-center gap-2 text-sm text-slate-700"><i class="fa-solid fa-check text-green-500"></i> סינון מתקדם</li>
                    <li class="flex items-center gap-2 text-sm text-slate-700"><i class="fa-solid fa-check text-green-500"></i> תמיכה מהירה</li>
                </ul>
                <button @click="startPayment('link_pro')" class="block w-full py-3 rounded-xl text-center font-bold transition shadow-md"
                    :class="user.monthlyLimit === 1000000 ? 'bg-slate-100 text-slate-400 cursor-default' : 'bg-indigo-600 text-white hover:bg-indigo-700'">
                    {{ user.monthlyLimit === 1000000 ? 'חבילה נוכחית' : 'שדרג ל-PRO' }}
                </button>
            </div>

            <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex flex-col hover:border-purple-300 transition hover:-translate-y-1">
                <h3 class="text-xl font-bold text-slate-800">ENTERPRISE</h3>
                <div class="my-4"><span class="text-4xl font-extrabold text-slate-800">₪249</span><span class="text-slate-500">/חודש</span></div>
                <p class="text-sm text-slate-500 mb-6">כוח בלתי מוגבל לארגונים גדולים.</p>
                <ul class="space-y-3 mb-8 flex-1">
                    <li class="flex items-center gap-2 text-sm text-slate-700"><i class="fa-solid fa-check text-green-500"></i> <b>10,000,000</b> אירועים</li>
                    <li class="flex items-center gap-2 text-sm text-slate-700"><i class="fa-solid fa-check text-green-500"></i> SLA מובטח</li>
                    <li class="flex items-center gap-2 text-sm text-slate-700"><i class="fa-solid fa-check text-green-500"></i> מנהל תיק אישי</li>
                </ul>
                <button @click="startPayment('link_enterprise')" class="block w-full py-3 rounded-xl text-center font-bold transition"
                    :class="user.monthlyLimit === 10000000 ? 'bg-slate-100 text-slate-400 cursor-default' : 'bg-slate-800 text-white hover:bg-slate-900'">
                    {{ user.monthlyLimit === 10000000 ? 'חבילה נוכחית' : 'שדרג ל-Enterprise' }}
                </button>
            </div>
        </div>
    </div>`,
    methods: {
        startPayment(key) {
            if (!this.links[key]) {
                Swal.fire('שגיאה', 'קישור תשלום לא הוגדר עדיין למסלול זה', 'error');
                return;
            }

            const baseUrl = this.links[key];
            const params = new URLSearchParams();
            if (this.user.name) params.append('name', this.user.name);
            if (this.user.email) params.append('emailaddress', this.user.email);
            if (this.user.phone) params.append('phone', this.user.phone);
            params.append('CustomData', this.user.id); 

            const separator = baseUrl.includes('?') ? '&' : '?';
            this.iframeSrc = `${baseUrl}${separator}${params.toString()}`;
            
            this.showPaymentModal = true;
            this.startPolling();
        },

        startPolling() {
            this.attempts = 0;
            // ניקוי טיימרים ישנים אם יש
            if (this.checkInterval) clearInterval(this.checkInterval);
            if (this.backgroundCheckTimer) clearTimeout(this.backgroundCheckTimer);

            // בדיקה כל 4 שניות (בין 3 ל-5)
            this.checkInterval = setInterval(this.checkPaymentStatus, 4000); 
        },

        async checkPaymentStatus() {
            this.attempts++;
            // מפסיק לגמרי אחרי כ-10 דקות של ניסיונות רצופים (למקרה שהחלון נשאר פתוח)
            if (this.attempts > 150) { 
                this.stopVerifying();
                return;
            }

            try {
                const res = await this.$root.api('/billing/verify', 'POST');
                if (res && res.success) {
                    this.stopVerifying(); // עצור בדיקות
                    this.showPaymentModal = false; // סגור חלונית אם פתוחה
                    
                    await Swal.fire({
                        title: 'תשלום אושר!',
                        text: `החבילה שלך שודרגה בהצלחה ל-${res.plan}`,
                        icon: 'success',
                        confirmButtonText: 'מעולה, רענן עמוד'
                    });

                    window.location.reload(); 
                }
            } catch (e) {
                // שגיאות רשת שקטות, לא מפריע למשתמש
            }
        },

        stopVerifying() {
            if (this.checkInterval) clearInterval(this.checkInterval);
            if (this.backgroundCheckTimer) clearTimeout(this.backgroundCheckTimer);
        },

        closeModal() {
            // 1. סגירת הויזואליה מיד
            this.showPaymentModal = false;
            
            // 2. אבל לא עוצרים את הבדיקה! משאירים אותה לרוץ ברקע.
            // 3. מגדירים טיימר שיעצור את הבדיקה רק בעוד 30 שניות
            console.log('Modal closed. Continuing background checks for 30s...');
            
            if (this.backgroundCheckTimer) clearTimeout(this.backgroundCheckTimer);
            
            this.backgroundCheckTimer = setTimeout(() => {
                this.stopVerifying();
                console.log('Background checks stopped (timeout).');
            }, 30000); // 30 שניות
        }
    }
};
