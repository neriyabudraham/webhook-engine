// Template defined separately to prevent syntax errors
const destDetailsTemplate = `
<div class="max-w-6xl mx-auto animate-fade-in" v-if="currentDest">
    
    <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-4">
            <button @click="$emit('navigate', '/destinations')" class="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-500 hover:text-blue-600 shadow-sm"><i class="fa-solid fa-arrow-right"></i></button>
            <div>
                <h2 class="text-2xl font-bold text-slate-800">פרטי יעד</h2>
                <p class="text-sm text-slate-500">מזהה: <span class="font-mono">{{ currentDest.id.split('-')[0] }}...</span></p>
            </div>
        </div>
        <div class="flex gap-2">
             <button @click="$emit('delete-dest', currentDest.id)" class="text-red-500 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-bold border border-transparent hover:border-red-100 transition"><i class="fa-regular fa-trash-can"></i> מחק יעד</button>
        </div>
    </div>

    <div class="bg-white border border-slate-200 rounded-2xl p-8 mb-8 shadow-sm flex items-center justify-center gap-4 relative overflow-hidden">
        <div class="absolute inset-0 bg-slate-50/50"></div>
        
        <div class="relative z-10 flex flex-col items-center cursor-pointer group" @click="$emit('navigate', '/sources/' + currentDest.sourceId)">
            <div class="w-16 h-16 bg-white border-2 border-blue-200 rounded-2xl flex items-center justify-center text-2xl text-blue-600 shadow-sm group-hover:border-blue-500 group-hover:scale-105 transition duration-300">
                <i class="fa-solid fa-satellite-dish"></i>
            </div>
            <div class="mt-3 text-sm font-bold text-slate-700 group-hover:text-blue-600 transition">{{ currentDest.source ? currentDest.source.name : 'Loading' }}</div>
        </div>

        <div class="w-40 h-px bg-slate-300 relative flex justify-center items-center">
            <div class="absolute -top-3.5 bg-white px-3 py-0.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider border border-slate-200 rounded-full shadow-sm">
                {{ currentDest.rules ? 'Advanced Logic' : (currentDest.filters?.length || 0) + ' Filters' }}
            </div>
            <i class="fa-solid fa-chevron-left text-slate-400 absolute left-0 text-xs"></i>
            <div class="absolute h-1.5 w-1.5 rounded-full bg-slate-300 right-0"></div>
        </div>

        <div class="relative z-10 flex flex-col items-center">
            <div class="w-16 h-16 bg-white border-2 border-orange-200 rounded-2xl flex items-center justify-center text-2xl text-orange-500 shadow-sm">
                <i class="fa-solid fa-globe"></i>
            </div>
            <div class="mt-3 text-sm font-bold text-slate-700 max-w-[250px] truncate dir-ltr" :title="currentDest.url">{{ currentDest.url }}</div>
        </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
            <div class="flex justify-between items-center mb-6 pb-4 border-b border-slate-50">
                <h3 class="font-bold text-slate-800 flex items-center gap-2"><i class="fa-solid fa-sliders text-slate-400"></i> הגדרות חיבור</h3>
                <button v-if="!isEditing" @click="isEditing = true" class="text-blue-600 text-sm font-bold hover:bg-blue-50 px-3 py-1 rounded transition">ערוך</button>
                <div v-else class="flex gap-2">
                    <button @click="isEditing = false" class="text-slate-500 text-xs px-3 py-1 hover:bg-slate-100 rounded transition">ביטול</button>
                    <button @click="save" class="bg-green-600 text-white text-xs px-4 py-1 rounded shadow-sm hover:bg-green-700 transition font-bold">שמור</button>
                </div>
            </div>
            <div class="space-y-5">
                <div>
                    <label class="block text-xs font-bold text-slate-400 uppercase mb-1.5">כתובת יעד (URL)</label>
                    <input v-if="isEditing" v-model="editForm.url" class="w-full border p-2.5 rounded-lg text-sm outline-none focus:border-blue-500 font-mono dir-ltr">
                    <div v-else class="font-mono text-sm bg-slate-50 p-3 rounded-lg break-all border border-slate-100 text-slate-700 dir-ltr select-all">{{ currentDest.url }}</div>
                </div>
                <div class="flex gap-4">
                    <div class="w-1/2">
                        <label class="block text-xs font-bold text-slate-400 uppercase mb-1.5">שיטת שליחה</label>
                        <select v-if="isEditing" v-model="editForm.method" class="w-full border p-2.5 rounded-lg text-sm bg-white outline-none font-bold">
                            <option>POST</option><option>GET</option><option>PUT</option><option>PATCH</option><option>DELETE</option>
                        </select>
                        <div v-else class="font-bold text-sm bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">{{ currentDest.method }}</div>
                    </div>
                    <div class="w-1/2">
                        <label class="block text-xs font-bold text-slate-400 uppercase mb-1.5">השהייה (שניות)</label>
                        <input v-if="isEditing" type="number" v-model="editForm.delay" class="w-full border p-2.5 rounded-lg text-sm outline-none text-center font-mono">
                        <div v-else class="font-bold text-sm bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">{{ currentDest.delay }}s</div>
                    </div>
                </div>
            </div>
        </div>

        <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
            <div class="flex justify-between items-center mb-6 pb-4 border-b border-slate-50">
                <h3 class="font-bold text-slate-800 flex items-center gap-2"><i class="fa-solid fa-code-branch text-slate-400"></i> לוגיקה וסינון</h3>
                <button @click="$emit('navigate', '/filter-editor/' + currentDest.id)" class="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-sm hover:bg-indigo-700 transition flex items-center gap-2">
                    <i class="fa-solid fa-pen-to-square"></i> עורך מתקדם
                </button>
            </div>
            
            <div class="flex-1 bg-slate-50 rounded-xl border border-slate-100 overflow-hidden relative group">
                <div v-if="(!currentDest.filters || currentDest.filters.length === 0) && (!currentDest.rules || Object.keys(currentDest.rules).length === 0)" class="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                    <i class="fa-solid fa-arrow-right-long text-2xl mb-2 opacity-20"></i>
                    <span class="text-xs font-medium">מעביר הכל (ללא סינון)</span>
                </div>
                
                <div v-else-if="currentDest.rules && Object.keys(currentDest.rules).length > 0" class="h-full flex flex-col">
                    <div class="bg-slate-100 px-3 py-1.5 border-b border-slate-200 flex justify-between items-center">
                        <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">JSON Logic Configured</span>
                        <i class="fa-solid fa-code text-slate-400 text-xs"></i>
                    </div>
                    <pre class="p-4 text-[10px] font-mono text-green-600 overflow-auto custom-scrollbar">{{ JSON.stringify(currentDest.rules, null, 2) }}</pre>
                    <div v-if="currentDest.rulesDescription" class="p-3 border-t border-slate-200 bg-white text-xs text-slate-600 italic">
                        "{{ currentDest.rulesDescription }}"
                    </div>
                </div>

                <div v-else class="p-4 space-y-2">
                    <div v-for="f in currentDest.filters" :key="f.id" class="flex items-center gap-2 text-sm bg-white p-2 rounded border border-slate-200 shadow-sm">
                        <span class="font-mono font-bold text-slate-600 bg-slate-100 px-1.5 rounded text-xs">{{ f.key }}</span>
                        <span class="text-slate-400 text-xs uppercase font-bold">{{ f.operator }}</span>
                        <span class="font-bold text-indigo-600">{{ f.value }}</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
`;

window.DestinationDetailsComponent = {
    props: ['currentDest'],
    template: destDetailsTemplate,
    data() {
        return {
            isEditing: false,
            editForm: { url: '', method: 'POST', delay: 0 }
        }
    },
    watch: {
        currentDest: {
            immediate: true,
            handler(val) {
                if (val) {
                    this.editForm = JSON.parse(JSON.stringify(val));
                    delete this.editForm.filters; 
                    delete this.editForm.rules;
                }
            }
        }
    },
    methods: {
        save() {
            this.$emit('update-dest', { 
                id: this.currentDest.id, 
                url: this.editForm.url, 
                method: this.editForm.method, 
                delay: Number(this.editForm.delay)
            });
            this.isEditing = false;
        }
    }
};
