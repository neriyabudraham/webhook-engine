window.DashboardComponent = {
    props: ['user', 'sources', 'usagePercentage'],
    template: `
    <div class="max-w-6xl mx-auto space-y-10 animate-fade-in">
        <div class="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
            <div class="relative z-10">
                <h2 class="text-3xl font-bold mb-2">שלום, {{ safeName }} 👋</h2>
                <p class="text-blue-100 opacity-90">ברוך הבא למערכת הניהול שלך.</p>
            </div>
        </div>

        <section>
            <h3 class="text-lg font-bold text-slate-800 mb-4">סטטוס מערכת</h3>
            <div class="bg-white border border-slate-200 rounded-xl p-1 shadow-sm grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100 md:divide-x-reverse">
                <div class="p-6 flex items-start gap-4 hover:bg-slate-50 transition cursor-pointer" @click="$emit('navigate', '/sources')">
                    <div class="mt-1 step-circle transition-colors duration-300" :class="sources.length > 0 ? 'step-completed' : 'step-active'">
                        <i class="fa-solid" :class="sources.length > 0 ? 'fa-check' : 'fa-1'"></i>
                    </div>
                    <div><h4 class="font-bold text-slate-700 text-sm">מקורות פעילים</h4><p class="text-xs text-slate-500 mt-1">{{ sources.length }} הוגדרו</p></div>
                </div>
                <div class="p-6 flex items-start gap-4">
                    <div class="mt-1 step-circle" :class="user.usageCount > 0 ? 'step-completed' : 'step-pending'">
                        <i class="fa-solid" :class="user.usageCount > 0 ? 'fa-check' : 'fa-bolt'"></i>
                    </div>
                    <div><h4 class="font-bold text-slate-700 text-sm">תעבורה חודשית</h4><p class="text-xs text-slate-500 mt-1">{{ user.usageCount }} אירועים נשלחו</p></div>
                </div>
                <div class="p-6 flex items-start gap-4">
                    <div class="mt-1 step-circle step-active"><i class="fa-solid fa-infinity"></i></div>
                    <div><h4 class="font-bold text-slate-700 text-sm">חבילה נוכחית</h4><p class="text-xs text-slate-500 mt-1">{{ user.plan }} (עד {{ user.monthlyLimit }})</p></div>
                </div>
            </div>
        </section>

        <section>
            <h3 class="text-lg font-bold text-slate-800 mb-4">גישה מהירה</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                
                <div @click="$emit('navigate', '/sources')" class="hd-card p-6 cursor-pointer group">
                    <div class="icon-box bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors"><i class="fa-solid fa-satellite-dish"></i></div>
                    <h4 class="font-bold text-slate-800 mb-1">מקורות (Sources)</h4>
                    <p class="text-xs text-slate-500 mb-4">ניהול נקודות כניסה</p>
                </div>

                <div @click="$emit('navigate', '/destinations')" class="hd-card p-6 cursor-pointer group">
                    <div class="icon-box bg-orange-50 text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors"><i class="fa-solid fa-share-nodes"></i></div>
                    <h4 class="font-bold text-slate-800 mb-1">יעדים (Destinations)</h4>
                    <p class="text-xs text-slate-500 mb-4">ניהול יעדים ופילטרים</p>
                </div>
                
                <div @click="$emit('navigate', '/connections')" class="hd-card p-6 cursor-pointer group">
                    <div class="icon-box bg-teal-50 text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-colors"><i class="fa-solid fa-diagram-project"></i></div>
                    <h4 class="font-bold text-slate-800 mb-1">מפת חיבורים</h4>
                    <p class="text-xs text-slate-500 mb-4">תצוגה ויזואלית</p>
                </div>

                <div @click="$emit('navigate', '/events')" class="hd-card p-6 cursor-pointer group">
                    <div class="icon-box bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors"><i class="fa-solid fa-bolt"></i></div>
                    <h4 class="font-bold text-slate-800 mb-1">אירועים ולוגים</h4>
                    <p class="text-xs text-slate-500 mb-4">היסטוריית קריאות</p>
                </div>

            </div>
        </section>
    </div>`,
    computed: {
        safeName() { return (this.user && this.user.name) ? this.user.name.split(' ')[0] : 'אורח'; }
    }
};
