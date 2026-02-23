const sourcesTemplate = `
<div class="max-w-6xl mx-auto animate-fade-in">
    <div class="flex justify-between items-center mb-8">
        <div>
            <h2 class="text-2xl font-bold text-slate-800">
                {{ showArchived ? 'ארכיון מקורות' : 'מקורות (Sources)' }}
            </h2>
            <p class="text-slate-500 text-sm mt-1">
                {{ showArchived ? 'מקורות שנמחקו אך עדיין קיימים במערכת.' : 'נהל את נקודות הקצה שמקבלות מידע.' }}
            </p>
        </div>
        <div class="flex gap-2">
            <button @click="toggleArchive" class="px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm transition flex items-center gap-2" 
                :class="showArchived ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'">
                <i class="fa-solid" :class="showArchived ? 'fa-arrow-right' : 'fa-box-archive'"></i>
                {{ showArchived ? 'חזרה למקורות' : 'ארכיון' }}
            </button>
            
            <button v-if="!showArchived" @click="showModal = true" class="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-indigo-700 transition flex items-center gap-2">
                <i class="fa-solid fa-plus"></i> הוסף מקור
            </button>
        </div>
    </div>

    <div v-if="sources.length === 0" class="text-center py-20 bg-white rounded-2xl border border-slate-200 border-dashed">
        <div class="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400 text-3xl">
            <i class="fa-solid" :class="showArchived ? 'fa-box-open' : 'fa-satellite-dish'"></i>
        </div>
        <h3 class="text-lg font-bold text-slate-700">
            {{ showArchived ? 'הארכיון ריק' : 'אין מקורות פעילים' }}
        </h3>
        <button v-if="!showArchived" @click="showModal = true" class="mt-4 text-indigo-600 font-bold text-sm hover:underline">צור את המקור הראשון</button>
    </div>

    <div v-else class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table class="min-w-full divide-y divide-slate-100">
            <thead class="bg-slate-50">
                <tr>
                    <th class="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">שם</th>
                    <th class="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">סוג</th>
                    <th class="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">כתובת (URL / Email)</th>
                    <th class="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">סטטוס</th>
                    <th class="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">פעולות</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
                <tr v-for="source in sources" :key="source.id" class="hover:bg-slate-50 transition cursor-pointer" @click="navigateSource(source)">
                    <td class="px-6 py-4">
                        <div class="font-bold text-slate-800 text-sm" :class="{'line-through text-slate-400': showArchived}">{{ source.name }}</div>
                        <div class="text-xs text-slate-400 mt-0.5">
                            {{ source._count ? source._count.events : 0 }} אירועים 
                            <span v-if="showArchived" class="text-[10px]"> (ב-24 שעות האחרונות)</span>
                        </div>
                    </td>
                    <td class="px-6 py-4">
                        <span v-if="source.type === 'EMAIL'" class="bg-purple-100 text-purple-700 text-[10px] px-2 py-0.5 rounded-full font-bold"><i class="fa-solid fa-envelope mr-1"></i> EMAIL</span>
                        <span v-else class="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full font-bold"><i class="fa-solid fa-globe mr-1"></i> WEBHOOK</span>
                    </td>
                    <td class="px-6 py-4">
                        <div class="flex items-center gap-2" @click.stop>
                            <code class="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs border truncate max-w-[250px]">{{ getAddress(source) }}</code>
                            <button @click="copy(getAddress(source))" class="text-slate-400 hover:text-blue-600"><i class="fa-regular fa-copy"></i></button>
                        </div>
                    </td>
                    <td class="px-6 py-4">
                        <span v-if="!showArchived" class="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-bold">ACTIVE</span>
                        
                        <div v-else>
                            <span v-if="source._count && source._count.events > 0" class="bg-red-100 text-red-700 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center w-fit gap-1 animate-pulse">
                                <i class="fa-solid fa-triangle-exclamation"></i> דולף ({{ source._count.events }})
                            </span>
                            <span v-else class="bg-gray-100 text-gray-500 text-[10px] px-2 py-0.5 rounded-full font-bold border border-gray-200">
                                שקט
                            </span>
                        </div>
                    </td>
                    <td class="px-6 py-4" @click.stop>
                        <button v-if="!showArchived" @click="del(source.id)" class="text-slate-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50" title="העבר לארכיון">
                            <i class="fa-regular fa-trash-can"></i>
                        </button>
                        <span v-else class="text-xs text-slate-400 italic">לא ניתן לשחזר</span>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>

    <div v-if="showModal" class="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
        <div class="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-fade-in-up">
            <h3 class="text-lg font-bold mb-4 text-slate-800">מקור חדש</h3>
            
            <div class="mb-4">
                <label class="block text-xs font-bold text-slate-500 mb-1">שם המקור</label>
                <input v-model="newName" class="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm">
            </div>

            <div class="mb-6">
                <label class="block text-xs font-bold text-slate-500 mb-1">סוג מקור</label>
                <div class="flex gap-2">
                    <button @click="newType = 'WEBHOOK'" :class="newType === 'WEBHOOK' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-300'" class="flex-1 py-2 rounded-lg border text-xs font-bold transition">Webhook (HTTP)</button>
                    <button @click="newType = 'EMAIL'" :class="newType === 'EMAIL' ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-slate-600 border-slate-300'" class="flex-1 py-2 rounded-lg border text-xs font-bold transition">Email (SMTP)</button>
                </div>
            </div>

            <div class="flex justify-end gap-2">
                <button @click="showModal = false" class="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium">ביטול</button>
                <button @click="create" class="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-bold">צור</button>
            </div>
        </div>
    </div>
</div>
`;

window.SourcesComponent = {
    props: ['sources'],
    template: sourcesTemplate,
    data() { 
        return { 
            showModal: false, 
            newName: '', 
            newType: 'WEBHOOK',
            showArchived: false
        } 
    },
    methods: {
        async toggleArchive() {
            this.showArchived = !this.showArchived;
            // שליחת בקשה לשרת לטעון את הרשימה המתאימה
            // אנחנו משתמשים ב-root.api ישירות כדי לעקוף את המנגנון הרגיל של האפליקציה
            try {
                const endpoint = this.showArchived ? '/my/sources?view=archived' : '/my/sources';
                const res = await this.$root.api(endpoint);
                // עדכון ה-prop המקומי (זה האק של Vue כדי לא להעביר אירועים למעלה ולמטה)
                // בדרך כלל לא מומלץ לשנות props, אבל במקרה הזה המערכת בנויה פשוט
                // אז נשתמש באירוע עדכון למעלה
                this.$emit('update-sources', res);
            } catch (e) {
                console.error(e);
            }
        },
        getAddress(source) { 
            if (source.type === 'EMAIL') return source.slug + '@webhook.botomat.co.il';
            return window.location.origin + '/webhook/' + source.slug; 
        },
        copy(text) { 
            navigator.clipboard.writeText(text); 
            Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 1500 }).fire({ icon: 'success', title: 'הועתק' }); 
        },
        create() { 
            if(!this.newName) return; 
            this.$root.api('/my/sources', 'POST', { name: this.newName, type: this.newType }).then(() => {
                this.$root.fetchData(); // טעינה מחדש של הנתונים הראשיים
                this.showModal = false; 
                this.newName = '';
            });
        },
        del(id) { 
            Swal.fire({
                title: 'להעביר לארכיון?',
                text: "המקור יימחק מהרשימה הראשית, אך ימשיך לצבור נתונים למכסה אם לא ינותק במקור.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                confirmButtonText: 'כן, מחק',
                cancelButtonText: 'ביטול'
            }).then((result) => {
                if (result.isConfirmed) {
                    this.$root.api('/my/sources/' + id, 'DELETE').then(() => {
                        this.$root.fetchData(); // רענון הרשימה הראשית
                        Swal.fire('בוצע', 'המקור הועבר לארכיון', 'success');
                    });
                }
            })
        },
        navigateSource(source) {
            if (this.showArchived) return; // לא ניתן להיכנס למקור מחוק
            this.$emit('navigate', '/sources/' + source.id);
        }
    }
};
