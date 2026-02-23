// Template defined separately to prevent syntax errors
const destinationsTemplate = `
<div class="max-w-6xl mx-auto animate-fade-in">
    
    <div class="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
            <h2 class="text-2xl font-bold text-slate-800">יעדים (Destinations)</h2>
            <p class="text-slate-500 text-sm mt-1">ניהול הכתובות אליהן נשלח המידע.</p>
        </div>
        <div class="flex gap-3 w-full md:w-auto">
            <div class="relative flex-1 md:w-64">
                <i class="fa-solid fa-search absolute right-3 top-3 text-slate-400 text-sm"></i>
                <input v-model="searchTerm" placeholder="חיפוש יעד..." class="w-full pr-9 pl-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 transition bg-white shadow-sm">
            </div>
            <button @click="openModal" class="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-indigo-100 hover:bg-indigo-700 flex items-center gap-2 whitespace-nowrap transition">
                <i class="fa-solid fa-plus"></i> יעד חדש
            </button>
        </div>
    </div>

    <div v-if="destinations.length === 0" class="text-center py-24 bg-white rounded-2xl border border-slate-200 border-dashed">
        <div class="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400 text-3xl">
            <i class="fa-solid fa-share-nodes"></i>
        </div>
        <h3 class="text-lg font-bold text-slate-700">אין יעדים מוגדרים</h3>
        <p class="text-sm text-slate-500 mt-1 mb-6">הגדר לאן לשלוח את המידע שמגיע מהמקורות שלך.</p>
        <button @click="openModal" class="text-indigo-600 font-bold text-sm hover:underline">צור את היעד הראשון</button>
    </div>

    <div v-else class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
            <table class="w-full text-sm text-right">
                <thead class="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-bold">
                    <tr>
                        <th class="px-6 py-4 w-[40%]">כתובת יעד (Endpoint)</th>
                        <th class="px-6 py-4">מקור משויך</th>
                        <th class="px-6 py-4">הגדרות</th>
                        <th class="px-6 py-4 text-left">פעולות</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                    <tr v-for="dest in filteredDestinations" :key="dest.id" class="hover:bg-slate-50/80 transition group cursor-pointer" @click="$emit('navigate', '/destinations/' + dest.id)">
                        <td class="px-6 py-4">
                            <div class="flex items-center gap-3">
                                <div class="w-14 h-8 rounded-lg flex items-center justify-center text-[10px] font-black uppercase border tracking-wider" :class="getMethodColor(dest.method)">
                                    {{ dest.method }}
                                </div>
                                <span class="font-mono text-slate-700 font-medium truncate max-w-xs dir-ltr" :title="dest.url">{{ dest.url }}</span>
                            </div>
                        </td>
                        <td class="px-6 py-4">
                            <span class="inline-flex items-center gap-2 bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-bold border border-slate-200">
                                <i class="fa-solid fa-satellite-dish text-[10px] text-slate-400"></i> {{ dest.source.name }}
                            </span>
                        </td>
                        <td class="px-6 py-4">
                            <div class="flex gap-2">
                                <span v-if="dest.filters.length > 0 || dest.rules" class="text-xs bg-purple-50 text-purple-700 px-2.5 py-1 rounded-md border border-purple-100 font-bold">
                                    <i class="fa-solid fa-filter mr-1"></i> פילטרים
                                </span>
                                <span v-if="dest.delay > 0" class="text-xs bg-orange-50 text-orange-700 px-2.5 py-1 rounded-md border border-orange-100 font-bold">
                                    <i class="fa-regular fa-clock mr-1"></i> {{ dest.delay }}s
                                </span>
                                <span v-if="!dest.delay && (!dest.filters.length && !dest.rules)" class="text-xs text-slate-300 italic px-2">ללא הגדרות</span>
                            </div>
                        </td>
                        <td class="px-6 py-4 text-left" @click.stop>
                            <button @click="$emit('navigate', '/destinations/' + dest.id)" class="text-slate-400 hover:text-indigo-600 p-2 transition rounded-full hover:bg-indigo-50" title="ערוך">
                                <i class="fa-solid fa-pen"></i>
                            </button>
                            <button @click="del(dest.id)" class="text-slate-400 hover:text-red-600 p-2 transition rounded-full hover:bg-red-50 ml-1" title="מחק">
                                <i class="fa-regular fa-trash-can"></i>
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>

    <div v-if="showModal" class="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
        <div class="bg-white rounded-2xl shadow-2xl p-0 w-full max-w-lg animate-fade-in-up max-h-[90vh] overflow-y-auto">
            <div class="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
                <h3 class="text-lg font-bold text-slate-800">הוספת יעד חדש</h3>
                <button @click="showModal = false" class="text-slate-400 hover:text-slate-600"><i class="fa-solid fa-xmark text-lg"></i></button>
            </div>
            
            <div class="p-6 space-y-5">
                <div>
                    <label class="block text-xs font-bold text-slate-500 uppercase mb-1.5">בחר מקור</label>
                    <div class="relative">
                        <select v-model="newDest.sourceId" class="w-full p-3 border border-slate-200 rounded-xl bg-white text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 appearance-none transition">
                            <option value="" disabled>בחר מקור...</option>
                            <option v-for="s in sources" :value="s.id">{{ s.name }}</option>
                        </select>
                        <div class="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400"><i class="fa-solid fa-chevron-down text-xs"></i></div>
                    </div>
                </div>
                <div class="flex gap-4">
                    <div class="w-1/3">
                        <label class="block text-xs font-bold text-slate-500 uppercase mb-1.5">שיטה</label>
                        <div class="relative">
                            <select v-model="newDest.method" class="w-full p-3 border border-slate-200 rounded-xl bg-white text-sm outline-none focus:border-indigo-500 appearance-none font-bold text-slate-700 transition">
                                <option value="POST">POST</option>
                                <option value="GET">GET</option>
                                <option value="PUT">PUT</option>
                                <option value="PATCH">PATCH</option>
                                <option value="DELETE">DELETE</option>
                            </select>
                            <div class="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400"><i class="fa-solid fa-chevron-down text-xs"></i></div>
                        </div>
                    </div>
                    <div class="w-2/3">
                        <label class="block text-xs font-bold text-slate-500 uppercase mb-1.5">כתובת URL</label>
                        <input v-model="newDest.url" placeholder="https://api.example.com/webhook" class="w-full p-3 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 font-mono transition dir-ltr">
                    </div>
                </div>

                <div class="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                    <div class="flex items-start gap-3">
                        <i class="fa-solid fa-lightbulb text-indigo-500 mt-0.5"></i>
                        <div>
                            <p class="text-sm font-bold text-indigo-800">הגדרה מתקדמת</p>
                            <p class="text-xs text-indigo-600 mt-1">פילטרים ודיליי ניתן להגדיר במסך העריכה המלא לאחר יצירת היעד.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 rounded-b-2xl">
                <button @click="showModal = false" class="px-5 py-2.5 text-slate-600 hover:bg-slate-200 rounded-xl text-sm font-medium transition">ביטול</button>
                <button @click="save" class="px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 text-sm font-bold shadow-md shadow-indigo-100 transition">צור יעד</button>
            </div>
        </div>
    </div>

</div>`;

window.DestinationsComponent = {
    props: ['sources', 'destinations'],
    template: destinationsTemplate,
    data() { 
        return { 
            showModal: false, 
            searchTerm: '',
            newDest: { sourceId: '', url: 'https://', method: 'POST', filters: [], delay: 0 } 
        } 
    },
    computed: {
        filteredDestinations() {
            if (!this.searchTerm) return this.destinations;
            const term = this.searchTerm.toLowerCase();
            return this.destinations.filter(d => 
                d.url.toLowerCase().includes(term) || 
                d.source.name.toLowerCase().includes(term)
            );
        }
    },
    methods: {
        getMethodColor(method) {
            const map = {
                'GET': 'bg-green-100 text-green-700 border-green-200',
                'POST': 'bg-blue-100 text-blue-700 border-blue-200',
                'PUT': 'bg-orange-100 text-orange-700 border-orange-200',
                'PATCH': 'bg-amber-100 text-amber-700 border-amber-200',
                'DELETE': 'bg-red-100 text-red-700 border-red-200'
            };
            return map[method] || 'bg-slate-100 text-slate-600 border-slate-200';
        },
        openModal() { 
            const defSource = this.sources.length ? this.sources[0].id : '';
            this.newDest = { sourceId: defSource, url: 'https://', method: 'POST', filters: [], delay: 0 }; 
            this.showModal = true; 
        },
        save() { 
            if (!this.newDest.url || this.newDest.url.trim() === 'https://' || this.newDest.url.trim() === '') {
                Swal.fire({ icon: 'warning', title: 'חסרים פרטים', text: 'יש להזין כתובת יעד', confirmButtonColor: '#4f46e5' });
                return;
            }
            if (!this.newDest.sourceId) {
                Swal.fire({ icon: 'warning', title: 'חסרים פרטים', text: 'יש לבחור מקור לשיוך', confirmButtonColor: '#4f46e5' });
                return;
            }
            if (this.newDest.url.includes('botomat.co.il')) {
                Swal.fire({ icon: 'error', title: 'כתובת לא תקינה', text: 'לא ניתן להשתמש בכתובת המערכת כיעד', confirmButtonColor: '#d33' });
                return;
            }
            this.$emit('create-dest', this.newDest); 
            this.showModal = false; 
        },
        del(id) { 
            // רק שולחים לאבא, בלי חלונית אישור כפולה!
            this.$emit('delete-dest', id);
        }
    }
};
