window.SourceDetailsComponent = {
    props: ['currentSource'],
    data() {
        return {
            isEditing: false,
            editName: ''
        }
    },
    watch: {
        currentSource: {
            immediate: true,
            handler(val) {
                if (val) this.editName = val.name;
            }
        }
    },
    template: `
    <div class="max-w-6xl mx-auto animate-fade-in" v-if="currentSource">
        <div class="flex items-center justify-between mb-6 border-b border-slate-200 pb-6">
            <div class="flex items-center gap-4">
                <button @click="$emit('navigate', '/sources')" class="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-200 transition shadow-sm"><i class="fa-solid fa-arrow-right"></i></button>
                <div>
                    <div class="flex items-center gap-3">
                        <h2 v-if="!isEditing" class="text-2xl font-bold text-slate-800">{{ currentSource.name }}</h2>
                        <input v-else v-model="editName" class="text-2xl font-bold text-slate-800 bg-white border border-blue-300 rounded px-2 py-1 outline-none focus:ring-2 focus:ring-blue-500">
                        <button v-if="!isEditing" @click="isEditing = true" class="text-slate-400 hover:text-blue-600 text-sm"><i class="fa-solid fa-pen"></i></button>
                        <div v-else class="flex gap-1"><button @click="save" class="bg-green-500 text-white px-2 py-1 rounded text-xs"><i class="fa-solid fa-check"></i></button><button @click="isEditing = false" class="bg-slate-300 text-white px-2 py-1 rounded text-xs"><i class="fa-solid fa-xmark"></i></button></div>
                    </div>
                    <p class="text-sm text-slate-500 mt-1">ID: {{ currentSource.slug }}</p>
                </div>
            </div>
            <button @click="del" class="text-red-500 hover:bg-red-50 px-4 py-2 rounded-lg text-sm transition font-medium border border-transparent hover:border-red-100"><i class="fa-regular fa-trash-can ml-2"></i> מחק מקור</button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm"><div class="text-xs font-bold text-slate-400 uppercase">סה"כ בקשות</div><div class="text-2xl font-bold text-slate-800 mt-1">{{ currentSource._count ? currentSource._count.events : 0 }}</div></div>
            <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm"><div class="text-xs font-bold text-slate-400 uppercase">חיבורים פעילים</div><div class="text-2xl font-bold text-blue-600 mt-1">{{ currentSource.destinations ? currentSource.destinations.length : 0 }}</div></div>
            <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm"><div class="text-xs font-bold text-slate-400 uppercase">סטטוס</div><div class="text-2xl font-bold text-green-600 mt-1">פעיל</div></div>
        </div>

        <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between mb-8 shadow-inner">
            <div class="flex items-center gap-3 overflow-hidden w-full"><span class="bg-white border border-slate-200 text-slate-500 px-2 py-1 rounded text-xs font-bold shadow-sm">POST</span><code class="text-sm text-slate-700 font-mono truncate select-all w-full">{{ getUrl(currentSource.slug) }}</code></div>
            <button class="text-blue-600 hover:text-blue-800 font-medium text-sm px-3 whitespace-nowrap" @click="copy">העתק כתובת</button>
        </div>

        <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div class="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center"><h3 class="font-bold text-slate-700">חיבורים ויעדים</h3><button @click="$emit('navigate', '/destinations')" class="text-xs text-blue-600 font-bold hover:underline">נהל יעדים</button></div>
            <div v-if="!currentSource.destinations || currentSource.destinations.length === 0" class="p-8 text-center text-slate-500 text-sm">אין חיבורים למקור זה עדיין.</div>
            <div v-else class="divide-y divide-slate-100">
                <div v-for="dest in currentSource.destinations" :key="dest.id" class="p-4 flex items-center justify-between hover:bg-slate-50">
                    <div class="flex items-center gap-3"><span class="text-xs font-bold bg-slate-200 px-2 py-1 rounded">{{ dest.method }}</span><span class="text-sm font-mono text-slate-700">{{ dest.url }}</span></div>
                </div>
            </div>
        </div>
    </div>`,
    methods: {
        getUrl(slug) { return window.location.origin + '/webhook/' + slug; },
        copy() { navigator.clipboard.writeText(this.getUrl(this.currentSource.slug)); Swal.fire({ icon: 'success', title: 'הועתק', toast: true, position: 'top-end', showConfirmButton: false, timer: 1000 }); },
        save() { this.$emit('update-source', { id: this.currentSource.id, name: this.editName }); this.isEditing = false; },
        del() { this.$emit('delete-source', this.currentSource.id); }
    }
};
