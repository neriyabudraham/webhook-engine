
window.SettingsComponent = {

    props: ['user'],

    data() {

        return {

            apiKeys: [],

            newKeyName: '',

            loading: false,

            createdKey: null,

            emailForm: { to: '', subject: '', html: '' },

            sendingEmail: false,

            showEmailHistory: false,

            emailHistory: []

        }

    },

    mounted() {

        this.fetchKeys();

    },

    template: `

    <div class="max-w-4xl mx-auto animate-fade-in pb-20">

        

        <div class="mb-8 flex justify-between items-end">

            <div>

                <h2 class="text-2xl font-bold text-slate-800">הגדרות ו-API</h2>

                <p class="text-slate-500 text-sm mt-1">נהל גישה ואוטומציות.</p>

            </div>

            <a href="/api" target="_blank" class="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-700 transition flex items-center gap-2 shadow-sm">

                <i class="fa-solid fa-book"></i> תיעוד API מלא

            </a>

        </div>



        <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-8">

            <div class="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-50 gap-4">

                <div>

                    <h3 class="font-bold text-slate-800 flex items-center gap-2"><i class="fa-solid fa-key text-indigo-500"></i> מפתחות API</h3>

                    <p class="text-xs text-slate-500 mt-1">מפתחות אלו מאפשרים גישה לחשבונך דרך מערכות חיצוניות.</p>

                </div>

                <div class="flex gap-2 w-full md:w-auto">

                    <input v-model="newKeyName" placeholder="שם למפתח (למשל: n8n)" class="border border-slate-300 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-indigo-500 flex-1 min-w-[200px]">

                    <button @click="createKey" :disabled="!newKeyName" class="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 transition whitespace-nowrap shadow-sm">

                        <i class="fa-solid fa-plus ml-1"></i> צור מפתח

                    </button>

                </div>

            </div>



            <div v-if="createdKey" class="p-6 bg-green-50 border-b border-green-100 flex flex-col gap-3 animate-fade-in">

                <div class="text-green-800 font-bold text-sm flex items-center gap-2">

                    <i class="fa-solid fa-circle-check"></i> המפתח נוצר בהצלחה!

                </div>

                <div class="flex gap-2 items-center">

                    <div class="flex-1 bg-white border border-green-200 text-green-700 font-mono text-sm rounded-lg px-4 py-3 shadow-inner select-all relative group">

                        {{ createdKey }}

                    </div>

                    <button @click="copy(createdKey)" class="bg-green-600 text-white px-5 py-3 rounded-lg font-bold text-sm hover:bg-green-700 shadow-sm transition">העתק</button>

                </div>

                <p class="text-xs text-green-600 font-medium">⚠️ העתק את המפתח כעת. מטעמי אבטחה, לא תוכל לראות אותו שוב.</p>

            </div>



            <div class="divide-y divide-slate-100">

                <div v-if="apiKeys.length === 0" class="p-10 text-center text-slate-400 text-sm italic bg-slate-50/50">

                    <i class="fa-solid fa-key text-3xl mb-2 opacity-20 block"></i>

                    עדיין אין מפתחות API פעילים.

                </div>

                <div v-else v-for="key in apiKeys" :key="key.id" class="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center hover:bg-slate-50 transition gap-4">

                    <div>

                        <div class="font-bold text-slate-700 text-sm flex items-center gap-2">

                            {{ key.name }}

                            <span v-if="isNew(key.createdAt)" class="text-[10px] bg-blue-100 text-blue-700 px-1.5 rounded font-bold">חדש</span>

                        </div>

                        <div class="text-xs text-slate-400 font-mono mt-1 flex flex-wrap items-center gap-3">

                            <span class="bg-slate-100 px-2 py-0.5 rounded border border-slate-200 tracking-wider">{{ key.key.substring(0, 8) }}...</span>

                            <span><i class="fa-regular fa-calendar ml-1"></i> נוצר: {{ formatDate(key.createdAt) }}</span>

                        </div>

                    </div>

                    <div class="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">

                        <div class="text-[10px] text-slate-400 text-right">

                            <div v-if="key.lastUsed" class="text-indigo-600 font-medium">שימוש אחרון:<br>{{ formatDate(key.lastUsed, true) }}</div>

                            <div v-else class="italic">טרם היה בשימוש</div>

                        </div>

                        

                        <button @click="deleteKey(key.id)" class="text-slate-400 hover:text-red-600 bg-slate-100 hover:bg-red-50 p-2 rounded-lg transition" title="מחק מפתח">

                            <i class="fa-regular fa-trash-can"></i>

                        </button>

                    </div>

                </div>

            </div>

        </div>



        <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

            <div class="p-6 border-b border-slate-100 flex items-center gap-4 bg-gradient-to-r from-slate-50 to-white">

                <div class="w-10 h-10 rounded-xl bg-[#ff6d5a] flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">

                    n8n

                </div>

                <div>

                    <h3 class="font-bold text-slate-800 text-lg">אינטגרציה ל-n8n</h3>

                    <p class="text-xs text-slate-500">התקנת המודול הרשמי</p>

                </div>

            </div>

            <div class="p-6">

                <p class="text-sm text-slate-600 mb-6 leading-relaxed">

                    כדי להשתמש בטריגרים החכמים שלנו, התקינו את מודול הקהילה ב-n8n.<br>

                    המודול מאפשר יצירה וניהול של תיבות מייל ישירות מתוך ה-Workflow.

                </p>

                

                <div class="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-6">

                    <h4 class="font-bold text-slate-800 text-sm mb-3">הוראות התקנה:</h4>

                    <ol class="list-decimal list-inside text-sm text-slate-600 space-y-2">

                        <li>היכנסו ב-n8n לתפריט <b>Settings</b> > <b>Community Nodes</b>.</li>

                        <li>לחצו על <b>Install</b>.</li>

                        <li>הדביקו את שם החבילה הבא:</li>

                    </ol>

                    

                    <div class="mt-3 flex items-center gap-2 dir-ltr">

                        <div class="flex-1 bg-white border border-slate-300 text-indigo-600 font-mono text-sm rounded-lg px-4 py-2 shadow-inner relative group flex justify-between items-center">

                            <span class="truncate">n8n-nodes-mailhook</span>

                            <button @click="copy('n8n-nodes-mailhook')" class="text-slate-400 hover:text-indigo-600 transition p-1" title="העתק">

                                <i class="fa-regular fa-copy"></i>

                            </button>

                        </div>

                    </div>

                </div>



                <div class="flex gap-3 text-xs text-slate-500 bg-blue-50/50 p-3 rounded-lg border border-blue-100/50 items-center">

                    <div class="text-blue-500 text-base"><i class="fa-solid fa-circle-info"></i></div>

                    <div>

                        <strong>שימו לב:</strong> לאחר ההתקנה, הנודים יופיעו בממשק של n8n תחת השם <b>MailHook</b>.

                    </div>

                </div>

            </div>

        </div>

        <!-- Outbound Email Section -->
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mt-8">
            <div class="p-6 border-b border-slate-100 bg-gradient-to-r from-purple-50 to-white">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center text-white shadow-sm">
                        <i class="fa-solid fa-paper-plane"></i>
                    </div>
                    <div>
                        <h3 class="font-bold text-slate-800 text-lg">שליחת מיילים (SMTP)</h3>
                        <p class="text-xs text-slate-500">שלח מיילים דרך המערכת - כל מייל נספר למכסה</p>
                    </div>
                </div>
            </div>
            
            <div class="p-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label class="block text-xs font-bold text-slate-500 mb-1">נמען (To)</label>
                        <input v-model="emailForm.to" type="email" placeholder="example@domain.com" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-500">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-500 mb-1">נושא (Subject)</label>
                        <input v-model="emailForm.subject" placeholder="נושא המייל" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-500">
                    </div>
                </div>
                
                <div class="mb-4">
                    <label class="block text-xs font-bold text-slate-500 mb-1">תוכן (HTML או טקסט)</label>
                    <textarea v-model="emailForm.html" rows="6" placeholder="<p>תוכן המייל...</p>" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-500 font-mono" dir="ltr"></textarea>
                </div>
                
                <div class="flex justify-between items-center">
                    <button @click="toggleEmailHistory" class="text-purple-600 hover:underline text-sm font-medium">
                        <i class="fa-solid fa-clock-rotate-left ml-1"></i> היסטוריית שליחות
                    </button>
                    <button @click="sendEmail" :disabled="!emailForm.to || !emailForm.subject || sendingEmail" class="bg-purple-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-purple-700 disabled:opacity-50 transition shadow-sm flex items-center gap-2">
                        <i class="fa-solid fa-paper-plane" :class="{'fa-spin': sendingEmail}"></i> שלח מייל
                    </button>
                </div>
            </div>
            
            <div v-if="showEmailHistory" class="border-t border-slate-200 p-6 bg-slate-50">
                <h4 class="font-bold text-slate-700 text-sm mb-4">היסטוריית שליחות אחרונות</h4>
                <div v-if="emailHistory.length === 0" class="text-slate-400 text-sm italic text-center py-6">אין היסטוריה</div>
                <div v-else class="space-y-2 max-h-64 overflow-y-auto">
                    <div v-for="email in emailHistory" :key="email.id" class="bg-white p-3 rounded-lg border border-slate-200 flex justify-between items-center text-sm">
                        <div>
                            <div class="font-bold text-slate-700">{{ email.subject }}</div>
                            <div class="text-xs text-slate-400">{{ email.to.join(', ') }}</div>
                        </div>
                        <div class="flex items-center gap-3">
                            <span :class="email.status === 'SENT' ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'" class="px-2 py-1 rounded text-xs font-bold">{{ email.status }}</span>
                            <span class="text-xs text-slate-400">{{ formatDate(email.createdAt, true) }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    </div>

    `,

    methods: {

        async fetchKeys() {

            this.loading = true;

            try {

                const res = await this.$root.api('/my/api-keys');

                this.apiKeys = res || [];

            } catch(e) {}

            this.loading = false;

        },

        async createKey() {

            if (!this.newKeyName) return;

            try {

                const res = await this.$root.api('/my/api-keys', 'POST', { name: this.newKeyName });

                this.createdKey = res.key;

                this.newKeyName = '';

                this.fetchKeys();

            } catch(e) { Swal.fire('שגיאה', 'לא ניתן ליצור מפתח', 'error'); }

        },

        async deleteKey(id) {

            Swal.fire({

                title: 'למחוק מפתח?',

                text: "מחיקת המפתח תנתק את האוטומציות המחוברות אליו.",

                icon: 'warning',

                showCancelButton: true,

                confirmButtonColor: '#d33',

                confirmButtonText: 'מחק',

                cancelButtonText: 'ביטול'

            }).then(async (result) => {

                if (result.isConfirmed) {

                    await this.$root.api('/my/api-keys/' + id, 'DELETE');

                    this.fetchKeys();

                }

            })

        },

        copy(text) {

            navigator.clipboard.writeText(text);

            Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 1500 }).fire({ icon: 'success', title: 'הועתק' });

        },

        formatDate(dateStr, includeTime = false) {

            const d = new Date(dateStr);

            const date = d.toLocaleDateString('he-IL');

            if (!includeTime) return date;

            return date + ' ' + d.toLocaleTimeString('he-IL', {hour: '2-digit', minute:'2-digit'});

        },

        isNew(dateStr) {

            const d = new Date(dateStr);

            const now = new Date();

            return (now - d) < 1000 * 60 * 5; 

        },

        async sendEmail() {

            if (!this.emailForm.to || !this.emailForm.subject) return;

            this.sendingEmail = true;

            try {

                const res = await this.$root.api('/my/outbound/send', 'POST', this.emailForm);

                if (res.success) {

                    Swal.fire({ icon: 'success', title: 'נשלח!', text: 'המייל נשלח בהצלחה', toast: true, position: 'top-end', showConfirmButton: false, timer: 2000 });

                    this.emailForm = { to: '', subject: '', html: '' };

                    this.$root.fetchData();

                    if (this.showEmailHistory) this.fetchEmailHistory();

                } else {

                    Swal.fire({ icon: 'error', title: 'שגיאה', text: res.error || 'לא ניתן לשלוח' });

                }

            } catch(e) {

                Swal.fire({ icon: 'error', title: 'שגיאה', text: 'לא ניתן לשלוח מייל' });

            }

            this.sendingEmail = false;

        },

        async toggleEmailHistory() {

            this.showEmailHistory = !this.showEmailHistory;

            if (this.showEmailHistory) this.fetchEmailHistory();

        },

        async fetchEmailHistory() {

            try {

                const res = await this.$root.api('/my/outbound/history?limit=20');

                this.emailHistory = res || [];

            } catch(e) {}

        }

    }

};

