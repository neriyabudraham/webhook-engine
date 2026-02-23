window.DestinationDetailsComponent = {
    props: ['currentDest'],
    template: `
    <div class="max-w-4xl mx-auto animate-fade-in pb-20">
        <div class="flex items-center gap-4 mb-6">
            <button @click="$emit('navigate', '/destinations')" class="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-500 hover:text-blue-600 transition shadow-sm"><i class="fa-solid fa-arrow-right"></i></button>
            <div>
                <h2 class="text-2xl font-bold text-slate-800">פרטי יעד</h2>
                <p class="text-slate-500 text-sm mt-1" v-if="currentDest">{{ currentDest.url }}</p>
            </div>
        </div>

        <div v-if="!currentDest" class="text-center py-20"><i class="fa-solid fa-circle-notch fa-spin text-3xl text-indigo-600"></i></div>

        <div v-else class="space-y-6">
            <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 class="text-lg font-bold text-slate-800 mb-4">הגדרות כלליות</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <span class="block text-xs font-bold text-slate-400 uppercase mb-1">Source</span>
                        <div class="font-bold text-slate-700">{{ currentDest.source ? currentDest.source.name : 'Unknown' }}</div>
                    </div>
                    <div>
                        <span class="block text-xs font-bold text-slate-400 uppercase mb-1">Method</span>
                        <div class="font-mono font-bold text-indigo-600">{{ currentDest.method }}</div>
                    </div>
                    <div class="md:col-span-2">
                        <span class="block text-xs font-bold text-slate-400 uppercase mb-1">URL</span>
                        <div class="font-mono text-sm bg-slate-50 p-2 rounded border break-all dir-ltr text-left">{{ currentDest.url }}</div>
                    </div>
                </div>
            </div>

            <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 class="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <i class="fa-solid fa-filter text-purple-500"></i> פילטרים
                </h3>
                <div v-if="!currentDest.filters || currentDest.filters.length === 0" class="text-slate-400 text-sm">
                    אין פילטרים מוגדרים. היעד יקבל את כל האירועים.
                </div>
                <div v-else class="space-y-2">
                    <div v-for="f in currentDest.filters" :key="f.id" class="flex items-center gap-2 bg-slate-50 p-2 rounded border font-mono text-sm">
                        <span class="text-slate-600">{{ f.key }}</span>
                        <span class="text-purple-600 font-bold">{{ f.operator }}</span>
                        <span class="text-slate-800">{{ f.value }}</span>
                    </div>
                </div>
            </div>
        </div>
    </div>`
};
