// Template defined separately
const eventsTemplate = `
<div class="max-w-7xl mx-auto animate-fade-in pb-20">
    <div v-if="!currentEvent">
        <div class="flex flex-col gap-4 mb-6">
            <div class="flex justify-between items-center">
                <div>
                    <h2 class="text-2xl font-bold text-slate-800">אירועים (Log)</h2>
                    <p class="text-xs text-slate-500">
                        מציג <span class="font-bold text-indigo-600">{{ totalItems }}</span> אירועים
                    </p>
                </div>
                <button @click="fetchEvents" class="w-8 h-8 flex items-center justify-center rounded-full bg-white border hover:bg-slate-50 text-slate-500 transition shadow-sm" title="רענן">
                    <i class="fa-solid fa-rotate-right" :class="{'fa-spin': loading}"></i>
                </button>
            </div>
            
            <div class="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-3">
                <div class="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                    <span class="text-xs text-slate-400 font-bold"><i class="fa-regular fa-calendar-days"></i> מ:</span>
                    <input type="datetime-local" v-model="startDate" class="text-xs border-none outline-none bg-transparent text-slate-700 font-mono cursor-pointer">
                </div>
                <div class="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                    <span class="text-xs text-slate-400 font-bold"><i class="fa-regular fa-calendar-days"></i> עד:</span>
                    <input type="datetime-local" v-model="endDate" class="text-xs border-none outline-none bg-transparent text-slate-700 font-mono cursor-pointer">
                </div>
                <div class="h-6 w-px bg-slate-200 mx-1"></div>
                <div class="relative flex-1 min-w-[200px]">
                    <i class="fa-solid fa-search absolute right-3 top-2.5 text-slate-400 text-xs"></i>
                    <input v-model="searchTerm" placeholder="חיפוש חופשי (ID, שם, תוכן...)" class="w-full pr-9 pl-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500 transition focus:bg-white">
                </div>
                <div class="flex items-center gap-2">
                    <span class="text-xs text-slate-400 font-bold">שורות:</span>
                    <select v-model="limit" class="text-xs border border-slate-200 rounded-lg py-1.5 px-2 bg-slate-50 outline-none focus:border-blue-500 cursor-pointer">
                        <option value="20">20</option><option value="50">50</option><option value="100">100</option><option value="500">500</option>
                    </select>
                </div>
                <button @click="resetFilters" class="text-slate-400 hover:text-red-500 px-2 transition" title="נקה סינון">
                    <i class="fa-solid fa-filter-circle-xmark"></i>
                </button>
            </div>
        </div>

        <div v-if="loading && events.length === 0" class="text-center py-20 text-indigo-500">
             <i class="fa-solid fa-circle-notch fa-spin text-3xl"></i>
             <p class="text-xs text-slate-400 mt-2">טוען נתונים...</p>
        </div>

        <div v-else class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col">
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-slate-100 text-sm text-right">
                    <thead class="bg-slate-50 text-xs uppercase text-slate-500 font-bold sticky top-0">
                        <tr>
                            <th class="px-6 py-4 w-40">סטטוס</th>
                            <th class="px-6 py-4">זמן</th>
                            <th class="px-6 py-4">מקור</th>
                            <th class="px-6 py-4">תוכן (Payload)</th>
                            <th class="px-6 py-4 text-left">פעולות</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        <tr v-for="ev in events" :key="ev.id" class="hover:bg-slate-50 transition cursor-pointer group" @click="$emit('navigate', '/events/' + ev.id)">
                            
                            <td class="px-6 py-4">
                                <div class="flex flex-col gap-1.5 items-start">
                                    <span v-if="ev.payload._meta && ev.payload._meta.method" 
                                          class="text-[10px] font-black uppercase tracking-wider text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                        {{ ev.payload._meta.method }}
                                    </span>

                                    <span v-if="ev.payload._system_note" class="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold border border-red-200 flex items-center gap-1">
                                        <i class="fa-solid fa-ban"></i> חסום
                                    </span>
                                    
                                    <span v-else-if="!ev.deliveries || ev.deliveries.length === 0" class="bg-slate-100 text-slate-500 px-2 py-1 rounded text-xs font-bold border border-slate-200">
                                        נעצר
                                    </span>
                                    
                                    <span v-else-if="ev.deliveries.some(d => d.status >= 300 && d.status < 400)" class="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold border border-blue-200 flex items-center gap-1">
                                        <i class="fa-solid fa-share"></i> הפניה
                                    </span>
                                    
                                    <span v-else-if="ev.deliveries.some(d => d.status >= 200 && d.status < 300)" class="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold border border-green-200">
                                        הצלחה
                                    </span>
                                    
                                    <span v-else class="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold border border-red-200">
                                        נכשל
                                    </span>
                                </div>
                            </td>
                            
                            <td class="px-6 py-4 text-slate-500 whitespace-nowrap text-xs">
                                <div class="font-bold text-slate-700">{{ new Date(ev.createdAt).toLocaleDateString('he-IL') }}</div>
                                <div>{{ new Date(ev.createdAt).toLocaleTimeString('he-IL') }}</div>
                            </td>
                            
                            <td class="px-6 py-4 font-bold text-slate-700 whitespace-nowrap">
                                {{ ev.source ? ev.source.name : 'מקור לא ידוע' }}
                            </td>
                            
                            <td class="px-6 py-4 font-mono text-xs text-slate-500 max-w-xs truncate dir-ltr text-left" :title="JSON.stringify(ev.payload, null, 2)">
                                {{ JSON.stringify(ev.payload).substring(0, 60) }}...
                            </td>
                            <td class="px-6 py-4 text-left">
                                <button v-if="ev.headers?.source === 'email' || ev.payload?.meta?.isEmail || (ev.payload?.sender && ev.payload?.subject !== undefined)" 
                                        @click.stop="previewEmailFromList(ev)" 
                                        class="text-purple-600 hover:underline text-xs font-bold ml-3" title="תצוגת מייל">
                                    <i class="fa-solid fa-envelope"></i>
                                </button>
                                <button @click.stop="replay(ev.id)" class="text-green-600 hover:underline text-xs font-bold ml-3" title="שלח מחדש">
                                    <i class="fa-solid fa-rotate-right"></i> Replay
                                </button>
                                <button @click.stop="copy(ev.payload)" class="text-blue-600 hover:underline text-xs font-bold">העתק JSON</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <div v-if="totalPages > 1" class="border-t border-slate-100 p-4 bg-slate-50 flex justify-between items-center dir-ltr">
                <div class="text-xs text-slate-400">Page <span class="font-bold text-slate-700">{{ page }}</span> of <span class="font-bold text-slate-700">{{ totalPages }}</span></div>
                <div class="flex items-center gap-1">
                    <button @click="changePage(1)" :disabled="page === 1" class="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition disabled:opacity-50"><i class="fa-solid fa-angles-left"></i></button>
                    <button @click="changePage(page - 1)" :disabled="page === 1" class="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition disabled:opacity-50"><i class="fa-solid fa-angle-left"></i></button>
                    <div class="mx-2 flex gap-1"><span class="w-8 h-8 flex items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-xs shadow-sm">{{ page }}</span></div>
                    <button @click="changePage(page + 1)" :disabled="page === totalPages" class="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition disabled:opacity-50"><i class="fa-solid fa-angle-right"></i></button>
                    <button @click="changePage(totalPages)" :disabled="page === totalPages" class="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition disabled:opacity-50"><i class="fa-solid fa-angles-right"></i></button>
                </div>
            </div>
        </div>
    </div>

    <div v-else>
        <div class="flex justify-between items-center mb-6 border-b border-slate-200 pb-6">
            <div class="flex items-center gap-4">
                <button @click="$emit('navigate', '/events')" class="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-500 hover:text-blue-600 transition shadow-sm"><i class="fa-solid fa-arrow-right"></i></button>
                <div>
                    <h2 class="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        פרטי אירוע
                        <span class="text-sm font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-500 select-all">{{ currentEvent.id }}</span>
                    </h2>
                    <p class="text-sm text-slate-500 mt-1">התקבל ב: {{ new Date(currentEvent.createdAt).toLocaleString('he-IL') }} ממקור: <b>{{ currentEvent.source ? currentEvent.source.name : 'לא ידוע' }}</b></p>
                </div>
            </div>
            <div class="flex items-center gap-2">
                <button v-if="isEmailEvent" @click="showEmailPreview = true" class="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-purple-700 shadow-sm flex items-center gap-2 transition">
                    <i class="fa-solid fa-envelope-open-text"></i> תצוגת מייל
                </button>
                <button @click="openEditReplay(currentEvent)" class="bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-amber-600 shadow-sm flex items-center gap-2 transition">
                    <i class="fa-solid fa-pen-to-square"></i> ערוך ושלח
                </button>
                <button @click="replay(currentEvent.id)" class="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-700 shadow-sm flex items-center gap-2 transition">
                    <i class="fa-solid fa-rotate-right"></i> שלח מחדש
                </button>
                <button @click="showFilterModal = true" class="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 shadow-sm flex items-center gap-2 transition">
                    <i class="fa-solid fa-wand-magic-sparkles"></i> השתמש כפילטר
                </button>
            </div>
        </div>

        <div v-if="currentEvent.payload._meta" class="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500"><i class="fa-solid fa-globe"></i></div>
                <div class="min-w-0"><p class="text-xs text-slate-400 font-bold uppercase">IP Address</p><p class="text-sm font-mono font-bold text-slate-700 truncate" :title="currentEvent.payload._meta.ip">{{ currentEvent.payload._meta.ip }}</p></div>
            </div>
            <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-500"><i class="fa-solid fa-code"></i></div>
                <div><p class="text-xs text-slate-400 font-bold uppercase">Method</p><p class="text-sm font-mono font-bold text-slate-700">{{ currentEvent.payload._meta.method || 'POST' }}</p></div>
            </div>
            <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3 md:col-span-2">
                <div class="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-500"><i class="fa-solid fa-desktop"></i></div>
                <div class="min-w-0"><p class="text-xs text-slate-400 font-bold uppercase">User Agent</p><p class="text-sm font-mono text-slate-700 truncate" :title="currentEvent.payload._meta.userAgent">{{ currentEvent.payload._meta.userAgent }}</p></div>
            </div>
        </div>

        <div v-if="currentEvent.payload._system_note" class="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <i class="fa-solid fa-triangle-exclamation text-red-600 text-xl mt-0.5"></i>
            <div><h3 class="text-red-800 font-bold text-sm">התראת מערכת</h3><p class="text-red-600 text-sm mt-1">{{ currentEvent.payload._system_note }}</p></div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-350px)]">
            <div class="lg:col-span-2 bg-[#1e293b] rounded-xl shadow-sm overflow-hidden flex flex-col border border-slate-700">
                <div class="bg-[#0f172a] px-4 py-3 flex justify-between items-center border-b border-slate-700">
                    <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">JSON Payload</span>
                    <button @click="copy(currentEvent.payload)" class="text-slate-400 hover:text-white text-xs font-bold flex items-center gap-1 transition"><i class="fa-regular fa-copy"></i> העתק הכל</button>
                </div>
                <div class="flex-1 overflow-auto p-4 custom-scrollbar">
                    <pre class="text-xs font-mono text-green-400 whitespace-pre-wrap select-text" style="line-height: 1.5;">{{ JSON.stringify(currentEvent.payload, null, 2) }}</pre>
                </div>
            </div>

            <div class="space-y-6 overflow-y-auto pr-1">
                <div class="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                    <h3 class="font-bold text-slate-700 text-sm mb-3 uppercase tracking-wider">היסטוריית שליחות</h3>
                    <div v-if="!currentEvent.deliveries || currentEvent.deliveries.length === 0" class="text-slate-400 text-xs italic bg-slate-50 p-3 rounded border border-slate-100">לא נשלח לשום יעד.</div>
                    <div v-else class="space-y-3">
                        <div v-for="del in currentEvent.deliveries" :key="del.id" class="p-3 bg-slate-50 rounded border border-slate-100 hover:border-blue-200 transition">
                            <div class="flex justify-between items-center mb-1">
                                <span class="font-bold text-slate-700 text-xs truncate max-w-[150px]" :title="del.destination.url">{{ del.destination.url }}</span>
                                <span v-if="del.status >= 300 && del.status < 400" class="text-blue-700 bg-blue-50 border-blue-200 text-[10px] font-bold px-2 py-0.5 rounded border">REDIRECT {{ del.status }}</span>
                                <span v-else :class="del.status >= 200 && del.status < 300 ? 'text-green-600 bg-green-50 border-green-100' : 'text-red-600 bg-red-50 border-red-100'" class="text-[10px] font-bold px-2 py-0.5 rounded border">{{ del.status }}</span>
                            </div>
                            <div class="text-[10px] text-slate-400 flex justify-between">
                                <span>{{ new Date(del.createdAt).toLocaleTimeString() }}</span>
                                <span>{{ del.duration }}ms</span>
                            </div>
                            <div v-if="del.responseBody" class="mt-2 text-[10px] font-mono p-1 rounded break-all" :class="del.status >= 300 && del.status < 400 ? 'text-blue-600 bg-blue-50' : (del.status >= 400 ? 'text-red-500 bg-red-50' : 'text-slate-500 bg-slate-50')">
                                {{ del.responseBody }}
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                    <div class="flex justify-between items-center mb-3">
                        <h3 class="font-bold text-slate-700 text-sm uppercase tracking-wider">Headers</h3>
                        <button @click="copy(currentEvent.headers)" class="text-[10px] text-blue-600 hover:underline">העתק</button>
                    </div>
                    <div class="bg-slate-50 rounded p-3 text-[10px] font-mono text-slate-600 overflow-x-auto border border-slate-100">
                        <div v-for="(val, key) in currentEvent.headers" :key="key" class="mb-1 last:mb-0"><span class="text-indigo-600 font-bold">{{ key }}:</span> <span class="select-all">{{ val }}</span></div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div v-if="showFilterModal" class="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
        <div class="bg-white rounded-2xl shadow-2xl p-0 w-full max-w-md animate-fade-in-up">
            <div class="p-6 border-b border-slate-100 bg-slate-50 rounded-t-2xl">
                <h3 class="text-lg font-bold text-slate-800 mb-1">בחר יעד לפילטור</h3>
            </div>
            <div class="p-6">
                <label class="block text-xs font-bold text-slate-500 uppercase mb-2">יעד (Destination)</label>
                <select v-model="targetDestId" class="w-full p-3 border border-slate-200 rounded-xl bg-white text-sm outline-none focus:border-blue-500">
                    <option value="" disabled>בחר יעד...</option>
                    <option v-for="d in destinations" :value="d.id">{{ d.source.name }} - {{ d.url }}</option>
                </select>
            </div>
            <div class="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-2 rounded-b-2xl">
                <button @click="showFilterModal = false" class="px-5 py-2.5 text-slate-600 hover:bg-slate-200 rounded-xl text-sm font-medium transition">ביטול</button>
                <button @click="goToEditor" :disabled="!targetDestId" class="px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 text-sm font-bold shadow-sm transition disabled:opacity-50">המשך לעורך</button>
            </div>
        </div>
    </div>

    <!-- Edit & Replay Modal -->
    <div v-if="showEditModal" class="fixed inset-0 bg-slate-900/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-3xl h-[80vh] flex flex-col overflow-hidden animate-fade-in-up">
            <div class="p-4 border-b border-slate-200 bg-gradient-to-r from-amber-50 to-white flex justify-between items-center shrink-0">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </div>
                    <div>
                        <h3 class="text-lg font-bold text-slate-800">עריכה ושליחה מחדש</h3>
                        <p class="text-xs text-slate-500">ערוך את ה-JSON ושלח כאירוע חדש</p>
                    </div>
                </div>
                <button @click="showEditModal = false" class="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center transition text-slate-500">
                    <i class="fa-solid fa-xmark text-xl"></i>
                </button>
            </div>
            
            <div class="flex-1 overflow-hidden p-4 bg-slate-50">
                <textarea v-model="editPayloadStr" 
                          class="w-full h-full bg-[#1e293b] text-green-400 font-mono text-xs p-4 rounded-xl border border-slate-600 outline-none resize-none"
                          dir="ltr" spellcheck="false"></textarea>
            </div>
            
            <div v-if="editError" class="px-4 py-2 bg-red-50 border-t border-red-200 text-red-600 text-xs font-bold">
                <i class="fa-solid fa-circle-exclamation"></i> {{ editError }}
            </div>
            
            <div class="p-4 border-t border-slate-200 bg-white flex justify-between items-center shrink-0">
                <button @click="formatEditJson" class="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-200 transition flex items-center gap-2">
                    <i class="fa-solid fa-align-left"></i> פרמט JSON
                </button>
                <div class="flex gap-2">
                    <button @click="showEditModal = false" class="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition">ביטול</button>
                    <button @click="sendEditedEvent" class="px-6 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 transition flex items-center gap-2">
                        <i class="fa-solid fa-paper-plane"></i> שלח
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Email Preview Modal -->
    <div v-if="showEmailPreview && emailPreviewData" class="fixed inset-0 bg-slate-900/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden animate-fade-in-up">
            <div class="p-4 border-b border-slate-200 bg-gradient-to-r from-purple-50 to-white flex justify-between items-center shrink-0">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                        <i class="fa-solid fa-envelope"></i>
                    </div>
                    <div>
                        <h3 class="text-lg font-bold text-slate-800">{{ emailPreviewData.payload.subject || 'ללא נושא' }}</h3>
                        <p class="text-xs text-slate-500">
                            מאת: <span class="font-bold">{{ emailPreviewData.payload.sender?.name || emailPreviewData.payload.sender?.email || 'לא ידוע' }}</span>
                            <span v-if="emailPreviewData.payload.sender?.email" class="text-slate-400">&lt;{{ emailPreviewData.payload.sender.email }}&gt;</span>
                        </p>
                    </div>
                </div>
                <button @click="closeEmailPreview" class="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center transition text-slate-500">
                    <i class="fa-solid fa-xmark text-xl"></i>
                </button>
            </div>
            
            <div v-if="emailPreviewData.payload.attachments && emailPreviewData.payload.attachments.length > 0" class="px-4 py-2 bg-amber-50 border-b border-amber-100 flex items-center gap-2 shrink-0">
                <i class="fa-solid fa-paperclip text-amber-600"></i>
                <span class="text-xs font-bold text-amber-700">קבצים מצורפים:</span>
                <div class="flex gap-2 flex-wrap">
                    <a v-for="att in emailPreviewData.payload.attachments" :key="att.url" :href="att.url" target="_blank" 
                       class="text-xs bg-white px-2 py-1 rounded border border-amber-200 text-amber-700 hover:bg-amber-100 transition flex items-center gap-1">
                        <i class="fa-solid fa-download"></i> {{ att.originalName }}
                    </a>
                </div>
            </div>
            
            <div class="flex-1 overflow-hidden bg-slate-100 p-4">
                <iframe v-if="emailPreviewData.payload.html" :srcdoc="getEnhancedEmailHtml(emailPreviewData.payload.html)" 
                        class="w-full h-full bg-white rounded-lg border border-slate-200 shadow-inner"
                        sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"></iframe>
                <div v-else class="w-full h-full bg-white rounded-lg border border-slate-200 p-6 overflow-auto">
                    <div class="text-sm text-slate-700 whitespace-pre-wrap font-sans leading-relaxed" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">{{ emailPreviewData.payload.text || 'אין תוכן טקסט' }}</div>
                </div>
            </div>
            
            <div class="p-3 border-t border-slate-200 bg-slate-50 flex justify-between items-center shrink-0">
                <div class="text-xs text-slate-500">
                    <span v-if="emailPreviewData.payload.meta?.date">{{ new Date(emailPreviewData.payload.meta.date).toLocaleString('he-IL') }}</span>
                </div>
                <div class="flex gap-2">
                    <button @click="openEmailInNewTab" class="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-300 transition flex items-center gap-2">
                        <i class="fa-solid fa-up-right-from-square"></i> פתח בחלון חדש
                    </button>
                    <button @click="closeEmailPreview" class="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-bold hover:bg-purple-700 transition">
                        סגור
                    </button>
                </div>
            </div>
        </div>
    </div>
</div>`;

window.EventsComponent = {
    props: ['currentEvent', 'destinations'],
    template: eventsTemplate,
    data() { return { events: [], loading: false, page: 1, totalPages: 1, totalItems: 0, limit: 20, searchTerm: '', startDate: '', endDate: '', searchTimeout: null, showFilterModal: false, targetDestId: '', showEmailPreview: false, previewEvent: null, showEditModal: false, editPayloadStr: '', editSourceId: '', editError: '' } },
    mounted() { this.fetchEvents(); },
    computed: {
        isEmailEvent() {
            if (!this.currentEvent) return false;
            const headers = this.currentEvent.headers || {};
            const payload = this.currentEvent.payload || {};
            return headers.source === 'email' || payload.meta?.isEmail || (payload.sender && payload.subject !== undefined);
        },
        emailPreviewData() {
            return this.previewEvent || this.currentEvent;
        }
    },
    watch: {
        limit() { this.page = 1; this.fetchEvents(); },
        startDate() { this.page = 1; this.fetchEvents(); },
        endDate() { this.page = 1; this.fetchEvents(); },
        searchTerm(val) { clearTimeout(this.searchTimeout); this.searchTimeout = setTimeout(() => { this.page = 1; this.fetchEvents(); }, 500); }
    },
    methods: {
        async fetchEvents() {
            this.loading = true;
            try {
                const params = new URLSearchParams({ page: this.page, limit: this.limit });
                if (this.searchTerm) params.append('search', this.searchTerm);
                if (this.startDate) params.append('startDate', new Date(this.startDate).toISOString());
                if (this.endDate) params.append('endDate', new Date(this.endDate).toISOString());
                
                const res = await this.$root.api('/my/events?' + params.toString());
                
                // --- התיקון: תמיכה בפורמט החדש ---
                if (res && res.data) {
                    this.events = res.data;
                    this.totalPages = res.meta ? res.meta.lastPage : 1; 
                    this.totalItems = res.meta ? res.meta.total : res.data.length;
                } else if (Array.isArray(res)) { 
                    this.events = res; 
                    this.totalItems = res.length; 
                    this.totalPages = 1; 
                } else { 
                    this.events = []; 
                }
            } catch (e) { console.error(e); }
            this.loading = false;
        },
        changePage(newPage) { if (newPage < 1 || newPage > this.totalPages) return; this.page = newPage; this.fetchEvents(); },
        resetFilters() { this.searchTerm = ''; this.startDate = ''; this.endDate = ''; this.limit = 20; this.page = 1; this.fetchEvents(); },
        copy(data) { navigator.clipboard.writeText(JSON.stringify(data, null, 2)); Swal.fire({ icon: 'success', title: 'הועתק!', toast: true, position: 'top-end', showConfirmButton: false, timer: 1000 }); },
        async replay(eventId) {
            const result = await Swal.fire({
                title: 'שליחה מחדש?',
                text: 'האירוע יישלח מחדש לכל היעדים המוגדרים. פעולה זו תיספר למכסה.',
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#10b981',
                cancelButtonColor: '#6b7280',
                confirmButtonText: 'כן, שלח מחדש',
                cancelButtonText: 'ביטול'
            });
            if (!result.isConfirmed) return;
            
            try {
                await this.$root.api('/my/events/' + eventId + '/replay', 'POST');
                Swal.fire({ icon: 'success', title: 'נשלח!', text: 'האירוע נוסף לתור העיבוד', toast: true, position: 'top-end', showConfirmButton: false, timer: 2000 });
                setTimeout(() => this.fetchEvents(), 2000);
            } catch (e) {
                Swal.fire({ icon: 'error', title: 'שגיאה', text: 'לא ניתן לשלוח מחדש' });
            }
        },
        goToEditor() {
            if (!this.targetDestId) return;
            localStorage.setItem('temp_filter_payload', JSON.stringify(this.currentEvent.payload));
            this.$emit('navigate', '/filter-editor/' + this.targetDestId);
            this.showFilterModal = false;
        },
        openEmailInNewTab() {
            const event = this.emailPreviewData;
            if (!event) return;
            const html = event.payload.html || `<pre style="font-family: sans-serif; padding: 20px;">${event.payload.text || 'אין תוכן'}</pre>`;
            const fullHtml = `<!DOCTYPE html>
<html dir="auto">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${event.payload.subject || 'Email Preview'}</title>
    <style>body { margin: 0; padding: 0; }</style>
</head>
<body>${html}</body>
</html>`;
            const newWindow = window.open('', '_blank');
            if (newWindow) {
                newWindow.document.write(fullHtml);
                newWindow.document.close();
            }
        },
        previewEmailFromList(ev) {
            this.previewEvent = ev;
            this.showEmailPreview = true;
        },
        closeEmailPreview() {
            this.showEmailPreview = false;
            this.previewEvent = null;
        },
        openEditReplay(event) {
            this.editSourceId = event.sourceId || event.source?.id;
            this.editPayloadStr = JSON.stringify(event.payload, null, 2);
            this.editError = '';
            this.showEditModal = true;
        },
        formatEditJson() {
            try {
                const parsed = JSON.parse(this.editPayloadStr);
                this.editPayloadStr = JSON.stringify(parsed, null, 2);
                this.editError = '';
            } catch (e) {
                this.editError = 'JSON לא תקין: ' + e.message;
            }
        },
        getEnhancedEmailHtml(html) {
            return `<!DOCTYPE html>
<html dir="auto">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { 
            margin: 0; 
            padding: 16px; 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #1e293b;
            background: #fff;
        }
        img { max-width: 100%; height: auto; }
        a { color: #2563eb; }
        table { max-width: 100% !important; }
        * { box-sizing: border-box; }
    </style>
</head>
<body>${html}</body>
</html>`;
        },
        async sendEditedEvent() {
            this.editError = '';
            let payload;
            try {
                payload = JSON.parse(this.editPayloadStr);
            } catch (e) {
                this.editError = 'JSON לא תקין: ' + e.message;
                return;
            }
            
            try {
                const res = await this.$root.api('/my/events/send-custom', 'POST', {
                    sourceId: this.editSourceId,
                    payload: payload
                });
                this.showEditModal = false;
                Swal.fire({ icon: 'success', title: 'נשלח!', text: 'האירוע המותאם נוסף לתור', toast: true, position: 'top-end', showConfirmButton: false, timer: 2000 });
                setTimeout(() => this.fetchEvents(), 2000);
            } catch (e) {
                this.editError = 'שגיאה בשליחה';
            }
        }
    }
};