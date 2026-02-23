window.ConnectionsComponent = {
    props: ['sources'],
    template: `
    <div class="max-w-6xl mx-auto animate-fade-in">
        <h2 class="text-2xl font-bold text-slate-800 mb-8">מפת חיבורים</h2>
        
        <div v-if="!sources.length" class="text-center py-20 text-slate-400">אין נתונים.</div>

        <div v-else class="space-y-8">
            <div v-for="source in sources" :key="source.id" class="bg-white border rounded-2xl p-6 shadow-sm">
                <div class="flex items-center gap-4 mb-6">
                    <div class="w-10 h-10 bg-blue-600 text-white rounded-lg flex items-center justify-center"><i class="fa-solid fa-satellite-dish"></i></div>
                    <h3 class="font-bold text-lg">{{ source.name }}</h3>
                </div>

                <div class="space-y-4 pl-8 border-l-2 border-slate-100 ml-5">
                    <div v-if="!source.destinations || source.destinations.length === 0" class="text-sm text-slate-400">אין יעדים מחוברים</div>
                    
                    <div v-else v-for="dest in source.destinations" :key="dest.id" class="flex items-center gap-4">
                        <div class="w-8 h-px bg-slate-300"></div>
                        
                        <div class="cursor-pointer" @click="$emit('navigate', '/filter-editor/' + dest.id)" title="ערוך פילטר">
                            <div v-if="dest.rules || dest.filters.length" class="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center border border-purple-200"><i class="fa-solid fa-filter text-xs"></i></div>
                            <div v-else class="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center border border-green-200"><i class="fa-solid fa-check text-xs"></i></div>
                        </div>

                        <div class="w-8 h-px bg-slate-300"></div>

                        <div class="flex-1 bg-slate-50 border rounded-lg p-3 flex items-center gap-3 cursor-pointer hover:border-blue-300 transition" @click="$emit('navigate', '/destinations/' + dest.id)">
                            <div class="w-8 h-8 bg-white text-orange-500 rounded flex items-center justify-center shadow-sm"><i class="fa-solid fa-share-nodes"></i></div>
                            <div class="text-sm font-bold text-slate-700 truncate">{{ dest.url }}</div>
                            <span class="text-xs bg-white border px-1.5 rounded">{{ dest.method }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>`
};
