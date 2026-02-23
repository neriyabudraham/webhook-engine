window.FilterEditorComponent = {
    props: ['currentDest', 'events'],
    data() {
        return {
            rulesString: '{}',
            rulesDescription: '',
            selectedEventId: '',
            testResult: null,
            aiPrompt: '',
            aiLoading: false,
            chatMinimized: false,
            
            // Data
            recentEvents: [],
            
            // Listening Mode
            isListening: false,
            pollTimer: null,
            
            // Modal Logic
            showEventModal: false,
            modalEvents: [],
            modalLoading: false,
            modalSearch: '',
            modalSearchTimeout: null,
            previewEvent: null
        }
    },
    computed: {
        dropdownOptions() {
            const opts = this.recentEvents.map(e => ({
                id: e.id,
                label: `${new Date(e.createdAt).toLocaleTimeString()} - ${e.id.substring(0,4)}...`
            }));
            if (this.recentEvents.length > 0) {
                opts.push({ id: 'OPEN_MODAL', label: '🔍 חפש אירוע אחר...' });
            }
            return opts;
        },
        selectedEventBody() {
            const ev = this.recentEvents.find(e => e.id === this.selectedEventId);
            return ev ? JSON.stringify(ev.payload, null, 2) : '{}';
        },
        webhookUrl() {
            if (!this.currentDest || !this.currentDest.source) return '';
            return window.location.origin + '/webhook/' + this.currentDest.source.slug;
        }
    },
    watch: {
        currentDest: {
            immediate: true,
            handler(val) {
                if (val) {
                    if (val.rules && typeof val.rules === 'string') {
                        this.rulesString = val.rules; 
                    } else {
                        this.rulesString = JSON.stringify(val.rules || {}, null, 2);
                    }
                    
                    this.rulesDescription = val.rulesDescription || '';
                    if (val.sourceId) {
                        this.loadRecentEvents(val.sourceId);
                    }
                }
            }
        },
        selectedEventId(val) {
            if (val === 'OPEN_MODAL') {
                this.openEventModal();
                this.selectedEventId = this.recentEvents.length > 0 ? this.recentEvents[0].id : '';
            }
        },
        modalSearch(val) {
            clearTimeout(this.modalSearchTimeout);
            this.modalSearchTimeout = setTimeout(() => { this.fetchModalEvents(); }, 500);
        }
    },
    async mounted() {
        const tempPayload = localStorage.getItem('temp_filter_payload');
        if (tempPayload) {
            try {
                const payload = JSON.parse(tempPayload);
                const tempEvent = { id: 'preview-' + Date.now(), createdAt: new Date(), payload: payload };
                this.recentEvents.unshift(tempEvent);
                this.selectedEventId = tempEvent.id;
                localStorage.removeItem('temp_filter_payload');
            } catch (e) {}
        }
        
        setTimeout(() => {
            if (this.currentDest && this.currentDest.sourceId) {
                if (this.recentEvents.length === 0) {
                     this.openEventModal();
                }
            }
        }, 800);
    },
    unmounted() {
        this.stopListening();
    },
    methods: {
        async loadRecentEvents(sourceId) {
            try {
                const res = await fetch(`/my/events?limit=10&sourceId=${sourceId}`, {
                    headers: { 'Authorization': 'Bearer ' + localStorage.getItem('webhook_token') }
                });
                const data = await res.json();
                
                if (Array.isArray(data)) { 
                     this.recentEvents = data;
                } else if (data && data.data) { 
                     this.recentEvents = data.data;
                }
                
                if (this.recentEvents.length > 0) {
                    if (!this.selectedEventId) this.selectedEventId = this.recentEvents[0].id;
                    this.stopListening();
                } else {
                    this.startListening();
                }
            } catch (e) { console.error(e); }
        },
        
        startListening() {
            if (this.pollTimer) return;
            this.isListening = true;
            this.pollTimer = setInterval(() => {
                if(this.currentDest && this.currentDest.sourceId) {
                    this.loadRecentEvents(this.currentDest.sourceId);
                }
            }, 3000);
        },
        stopListening() {
            if (this.pollTimer) {
                clearInterval(this.pollTimer);
                this.pollTimer = null;
            }
            this.isListening = false;
        },

        openEventModal() { this.showEventModal = true; this.modalSearch = ''; this.fetchModalEvents(); },
        
        async fetchModalEvents() {
            this.modalLoading = true;
            try {
                let url = `/my/events?limit=50&sourceId=${this.currentDest.sourceId}`;
                if (this.modalSearch) url += `&search=${encodeURIComponent(this.modalSearch)}`;
                
                const res = await fetch(url, { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('webhook_token') } });
                const data = await res.json();
                
                this.modalEvents = data.data || (Array.isArray(data) ? data : []);
                
                if (this.modalEvents.length > 0 && !this.previewEvent) this.previewEvent = this.modalEvents[0];
            } catch (e) { console.error(e); }
            this.modalLoading = false;
        },
        
        selectEventFromModal() {
            if (!this.previewEvent) return;
            const exists = this.recentEvents.find(e => e.id === this.previewEvent.id);
            if (!exists) this.recentEvents.unshift(this.previewEvent);
            this.selectedEventId = this.previewEvent.id;
            this.showEventModal = false;
        },

        insertSnippet(type) {
            const snippets = { 'OR': '"$or": [ \n    { "field": "val1" }, \n    { "field": "val2" } \n  ]', 'AND': '"$and": [ \n    { "field": "val1" }, \n    { "other": "val2" } \n  ]', 'REGEX': '"field": { "$regex": "^start" }' };
            this.rulesString = this.rulesString.replace(/}\s*$/, `,\n  ${snippets[type]}\n}`);
        },
        
        runTest() {
            try {
                let rules;
                let isCode = false;
                try {
                     rules = JSON.parse(this.rulesString);
                } catch(e) {
                     isCode = true;
                }
                
                // --- התיקון: קילוף המעטפה (Unwrap) ---
                let rawPayload = JSON.parse(this.selectedEventBody);
                if (rawPayload && typeof rawPayload === 'object' && 'payload' in rawPayload && 'event' in rawPayload) {
                    rawPayload = rawPayload.payload;
                }

                const context = { 
                    event: { payload: rawPayload, headers: {}, query: {} },
                    body: rawPayload, 
                    headers: {} 
                }; 
                
                if (isCode) {
                    try {
                        const checkFunc = new Function('event', 'body', 'headers', `return (${this.rulesString});`);
                        this.testResult = !!checkFunc(context.event, context.body, context.headers);
                    } catch(err) {
                        console.error(err);
                        Swal.fire('שגיאה', 'שגיאה בקוד הפילטר: ' + err.message, 'error');
                        this.testResult = false;
                    }
                } else {
                    const getValue = (obj, path) => path.split('.').reduce((acc, part) => acc && acc[part], obj);
                    const evaluate = (r, ctx) => {
                         if (!r || Object.keys(r).length === 0) return true;
                         for (const key in r) {
                             if (key === '$or') return r[key].some(x => evaluate(x, ctx));
                             if (key === '$and') return r[key].every(x => evaluate(x, ctx));
                             const val = getValue(ctx.body, key);
                             const cond = r[key];
                             if (typeof cond === 'object' && cond['$regex']) { if (!new RegExp(cond['$regex'], 'i').test(String(val))) return false; } else if (val != cond) return false;
                         }
                         return true;
                    };
                    this.testResult = evaluate(rules, context);
                }
            } catch (e) { Swal.fire('שגיאה', 'שגיאה כללית בבדיקה', 'error'); }
        },
        
        async save() {
            try {
                let rulesToSend = null;
                
                try {
                    rulesToSend = JSON.parse(this.rulesString);
                } catch(e) {
                    if (this.rulesString && this.rulesString.trim().length > 0) {
                        rulesToSend = this.rulesString;
                    } else {
                        return Swal.fire('שגיאה', 'הפילטר ריק', 'warning');
                    }
                }

                const token = localStorage.getItem('webhook_token');
                
                const res = await fetch('/my/destinations/' + this.currentDest.id, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    },
                    body: JSON.stringify({
                        rules: rulesToSend, 
                        rulesDescription: this.rulesDescription
                    })
                });

                if (res.ok) {
                    Swal.fire({ icon: 'success', title: 'נשמר בהצלחה!', toast: true, position: 'top-end', showConfirmButton: false, timer: 1500 });
                    this.$emit('update-dest', { id: this.currentDest.id, rules: rulesToSend, rulesDescription: this.rulesDescription });
                } else {
                    const err = await res.json();
                    console.error('Save error:', err);
                    Swal.fire('שגיאה', 'השמירה נכשלה', 'error');
                }
            } catch(e) {
                console.error(e);
                Swal.fire('שגיאה', 'שגיאת תקשורת', 'error');
            }
        },

        copy(text) { navigator.clipboard.writeText(text); Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 1000 }).fire({ icon: 'success', title: 'הועתק' }); },
        
        async askAi() {
            this.aiLoading = true;
            try {
                const sample = JSON.parse(this.selectedEventBody);
                const token = localStorage.getItem('webhook_token');
                const res = await fetch('/ai/generate', { method: 'POST', headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: this.aiPrompt, sample: sample }) });
                const data = await res.json();
                
                if (data && data.code) { 
                    this.rulesString = data.code; 
                    if (data.description) this.rulesDescription = data.description; 
                } else if (data && data.filter) {
                    this.rulesString = JSON.stringify(data.filter, null, 2);
                }
            } catch (e) { Swal.fire('שגיאה', 'AI Failed', 'error'); } finally { this.aiLoading = false; }
        }
    },
    template: `
    <div class="h-full flex flex-col bg-white overflow-hidden animate-fade-in absolute inset-0 z-50">
        <div class="h-14 border-b border-slate-200 flex items-center justify-between px-4 bg-white shrink-0 z-20 shadow-sm">
            <div class="flex items-center gap-4">
                <button @click="$emit('navigate', '/destinations/' + (currentDest ? currentDest.id : ''))" class="text-slate-500 hover:text-blue-600 font-bold text-sm flex items-center gap-2">
                    <i class="fa-solid fa-arrow-right"></i> חזרה
                </button>
                <div class="h-6 w-px bg-slate-200"></div>
                <h2 class="font-bold text-slate-800 text-sm">עורך פילטרים מתקדם</h2>
            </div>
            <div class="flex items-center gap-3">
                <div v-if="testResult !== null" :class="testResult ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'" class="px-3 py-1 rounded-md text-xs font-bold flex items-center gap-2 transition-all">
                    <i :class="testResult ? 'fa-solid fa-check' : 'fa-solid fa-ban'"></i>
                    {{ testResult ? 'עובר (MATCH)' : 'נחסם (BLOCK)' }}
                </div>
                <button @click="runTest" class="bg-slate-100 text-slate-700 px-3 py-1.5 rounded text-xs font-bold hover:bg-slate-200 border border-slate-300" :disabled="recentEvents.length === 0"><i class="fa-solid fa-play mr-1"></i> בדיקה</button>
                <button @click="save" class="bg-blue-600 text-white px-4 py-1.5 rounded text-xs font-bold hover:bg-blue-700 shadow-sm">שמור</button>
            </div>
        </div>

        <div class="flex-1 flex overflow-hidden relative">
            <div class="w-1/3 border-l border-slate-200 flex flex-col bg-slate-50 transition-all duration-300">
                <div v-if="recentEvents.length > 0" class="flex flex-col h-full">
                    <div class="p-3 border-b border-slate-200 bg-white">
                        <label class="text-[10px] font-bold text-slate-500 uppercase block mb-1">בחר אירוע לבדיקה</label>
                        <select v-model="selectedEventId" class="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white text-slate-700 outline-none focus:border-blue-500 transition shadow-sm font-bold cursor-pointer">
                            <option v-for="opt in dropdownOptions" :value="opt.id" :class="opt.id === 'OPEN_MODAL' ? 'font-black text-blue-600 bg-blue-50' : ''">
                                {{ opt.label }}
                            </option>
                        </select>
                    </div>
                    <div class="flex-1 overflow-auto p-4 bg-[#1e293b] relative group custom-scrollbar">
                         <pre class="text-[10px] font-mono text-green-400 whitespace-pre-wrap break-all">{{ selectedEventBody }}</pre>
                         <button @click="copy(selectedEventBody)" class="absolute top-2 left-2 bg-white/10 text-white p-1 rounded hover:bg-white/20 opacity-0 group-hover:opacity-100 transition"><i class="fa-regular fa-copy"></i></button>
                    </div>
                </div>

                <div v-else class="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6">
                    <div class="relative">
                        <span class="absolute -top-1 -right-1 flex h-3 w-3">
                          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                          <span class="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                        </span>
                        <div class="w-16 h-16 bg-white rounded-full flex items-center justify-center text-3xl text-indigo-300 shadow-sm border border-slate-100">
                            <i class="fa-solid fa-satellite-dish"></i>
                        </div>
                    </div>

                    <div>
                        <h3 class="font-bold text-slate-700 text-sm">ממתין לאירוע ראשון...</h3>
                        <p class="text-xs text-slate-500 mt-1 leading-relaxed px-4">
                            המקור טרם קיבל נתונים. שלח בקשת ניסיון לכתובת למטה כדי להתחיל לבנות את הפילטר.
                        </p>
                    </div>

                    <div class="w-full bg-white border border-slate-200 rounded-lg p-3 text-left relative group shadow-sm">
                        <div class="text-[9px] text-slate-400 font-bold uppercase mb-1">Webhook URL</div>
                        <code class="text-[10px] text-indigo-600 font-mono break-all block pr-6 select-all">{{ webhookUrl }}</code>
                        <button @click="copy(webhookUrl)" class="absolute top-2 right-2 text-slate-400 hover:text-indigo-600 transition"><i class="fa-regular fa-copy"></i></button>
                    </div>
                    
                    <div class="text-[10px] text-slate-400 animate-pulse">מאזין בזמן אמת...</div>
                </div>
            </div>

            <div class="w-2/3 flex flex-col bg-white relative">
                <div class="p-3 border-b border-slate-100 bg-slate-50 flex flex-col gap-1">
                    <label class="text-[10px] font-bold text-slate-400 uppercase">תיאור הפילטר</label>
                    <input v-model="rulesDescription" placeholder="תיאור..." class="w-full bg-transparent border-none p-0 text-sm font-medium text-slate-700 placeholder-slate-300 focus:ring-0">
                </div>
                
                <div class="h-8 border-b border-slate-100 flex items-center px-2 gap-2 bg-white justify-between">
                    <div class="flex gap-2">
                        <button @click="insertSnippet('OR')" class="text-[10px] bg-slate-50 border hover:border-blue-400 px-2 rounded text-slate-600 font-mono">$or</button>
                        <button @click="insertSnippet('AND')" class="text-[10px] bg-slate-50 border hover:border-blue-400 px-2 rounded text-slate-600 font-mono">$and</button>
                        <button @click="insertSnippet('REGEX')" class="text-[10px] bg-slate-50 border hover:border-blue-400 px-2 rounded text-slate-600 font-mono">$regex</button>
                    </div>
                </div>
                
                <div class="flex-1 relative">
                    <textarea v-model="rulesString" class="w-full h-full bg-[#282c34] text-[#abb2bf] font-mono text-sm p-4 outline-none resize-none leading-relaxed" spellcheck="false"></textarea>
                </div>

                <div class="absolute bottom-0 left-0 w-full border-t border-slate-200 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] transition-all duration-300" :class="chatMinimized ? 'h-10' : 'h-auto'">
                    <div class="flex justify-between items-center px-4 py-2 bg-gradient-to-r from-indigo-50 to-white cursor-pointer hover:bg-indigo-50/50 transition" @click="chatMinimized = !chatMinimized">
                        <div class="flex items-center gap-2 text-indigo-700 font-bold text-sm"><i class="fa-solid fa-robot"></i> AI Assistant</div>
                        <button class="text-slate-400 hover:text-indigo-600"><i :class="chatMinimized ? 'fa-solid fa-chevron-up' : 'fa-solid fa-chevron-down'"></i></button>
                    </div>
                    <div v-if="!chatMinimized" class="p-4 pt-2">
                        <div class="flex gap-2">
                            <input v-model="aiPrompt" @keyup.enter="askAi" class="flex-1 border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500" placeholder="בקש מה-AI...">
                            <button @click="askAi" :disabled="aiLoading || !aiPrompt || recentEvents.length === 0" class="bg-indigo-600 text-white px-4 rounded-lg text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
                                <i v-if="aiLoading" class="fa-solid fa-circle-notch fa-spin"></i><span v-else>צור</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="showEventModal" class="fixed inset-0 bg-slate-900/70 z-[60] flex items-center justify-center p-6 backdrop-blur-sm animate-fade-in">
            <div class="bg-white w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                <div class="h-16 border-b border-slate-200 flex items-center justify-between px-6 bg-slate-50 shrink-0">
                    <h3 class="text-lg font-bold text-slate-800 flex items-center gap-2"><i class="fa-solid fa-magnifying-glass text-indigo-500"></i> בחירת אירוע לבדיקה</h3>
                    <div class="relative w-64">
                        <input v-model="modalSearch" placeholder="חפש ID או תוכן..." class="w-full pl-4 pr-10 py-2 rounded-xl border border-slate-300 text-sm focus:border-indigo-500 outline-none transition">
                        <i class="fa-solid fa-search absolute right-3 top-3 text-slate-400 text-sm"></i>
                    </div>
                    <button @click="showEventModal = false" class="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center transition text-slate-500"><i class="fa-solid fa-xmark text-lg"></i></button>
                </div>
                <div class="flex-1 flex overflow-hidden">
                    <div class="w-1/3 border-l border-slate-200 bg-white overflow-y-auto custom-scrollbar">
                        <div v-if="modalEvents.length === 0" class="p-10 text-center text-slate-400 text-sm">לא נמצאו אירועים</div>
                        <div v-else class="divide-y divide-slate-50">
                            <div v-for="ev in modalEvents" :key="ev.id" @click="previewEvent = ev" class="p-4 cursor-pointer transition border-r-4 hover:bg-slate-50" :class="previewEvent && previewEvent.id === ev.id ? 'bg-indigo-50 border-indigo-500' : 'border-transparent'">
                                <div class="flex justify-between items-start mb-1">
                                    <span class="text-xs font-bold text-slate-700">{{ new Date(ev.createdAt).toLocaleTimeString('he-IL') }}</span>
                                    <span class="text-[10px] text-slate-400">{{ new Date(ev.createdAt).toLocaleDateString('he-IL') }}</span>
                                </div>
                                <div class="text-[10px] font-mono text-slate-500 truncate mb-1">ID: {{ ev.id.split('-')[0] }}...</div>
                            </div>
                        </div>
                    </div>
                    <div class="w-2/3 bg-[#1e293b] flex flex-col relative">
                        <div v-if="previewEvent" class="flex-1 overflow-auto p-6 custom-scrollbar"><pre class="text-xs font-mono text-green-400 whitespace-pre-wrap leading-relaxed">{{ JSON.stringify(previewEvent.payload, null, 2) }}</pre></div>
                        <div v-else class="flex-1 flex items-center justify-center text-slate-500 text-sm">בחר אירוע מהרשימה לצפייה</div>
                        <div class="h-16 bg-white border-t border-slate-200 flex items-center justify-between px-6 shrink-0">
                            <div class="text-xs text-slate-500" v-if="previewEvent">נבחר: <span class="font-mono font-bold">{{ previewEvent.id }}</span></div>
                            <button @click="selectEventFromModal" :disabled="!previewEvent" class="bg-indigo-600 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition disabled:opacity-50 disabled:shadow-none flex items-center gap-2"><i class="fa-solid fa-check"></i> בחר אירוע זה לבדיקה</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>`
};