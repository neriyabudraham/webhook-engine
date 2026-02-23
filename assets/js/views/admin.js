window.AdminComponent = {
    data() { return { users: [], loading: false, searchTerm: '', error: null } },
    computed: {
        filteredUsers() {
            if (!this.searchTerm) return this.users;
            const term = this.searchTerm.toLowerCase();
            return this.users.filter(u => u.email.toLowerCase().includes(term) || (u.name && u.name.toLowerCase().includes(term)));
        }
    },
    async mounted() {
        this.loading = true;
        try {
            const res = await this.adminApi('/admin/users');
            if (Array.isArray(res)) {
                this.users = res;
            } else {
                console.error('Invalid response:', res);
                this.error = 'שגיאה בטעינת נתונים';
            }
        } catch (e) {
            this.error = e.message;
        }
        this.loading = false;
    },
    template: `
    <div class="max-w-7xl mx-auto animate-fade-in pb-20">
        <div class="flex justify-between items-center mb-8">
            <div>
                <h2 class="text-2xl font-bold text-slate-800"><i class="fa-solid fa-user-shield text-red-500"></i> ניהול משתמשים</h2>
                <p class="text-slate-500 text-sm mt-1">אזור ניהול למנהלי המערכת בלבד.</p>
            </div>
            <div class="relative w-64">
                <input v-model="searchTerm" placeholder="חפש משתמש..." class="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 transition bg-white shadow-sm">
            </div>
        </div>

        <div v-if="loading" class="text-center py-20"><i class="fa-solid fa-circle-notch fa-spin text-3xl text-indigo-600"></i></div>
        
        <div v-else-if="error" class="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 text-center font-bold">
            {{ error }}
        </div>

        <div v-else class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table class="min-w-full divide-y divide-slate-100 text-sm text-right">
                <thead class="bg-slate-50 text-xs uppercase text-slate-500 font-bold">
                    <tr>
                        <th class="px-6 py-4">משתמש</th>
                        <th class="px-6 py-4">חבילה</th>
                        <th class="px-6 py-4">שימוש</th>
                        <th class="px-6 py-4">מקורות/אירועים</th>
                        <th class="px-6 py-4">נוצר ב-</th>
                        <th class="px-6 py-4">פעולות</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                    <tr v-for="user in filteredUsers" :key="user.id" class="hover:bg-slate-50 transition">
                        <td class="px-6 py-4">
                            <div class="font-bold text-slate-700">{{ user.name || 'ללא שם' }}</div>
                            <div class="text-xs text-slate-400">{{ user.email }}</div>
                            <span v-if="user.role === 'ADMIN'" class="bg-red-100 text-red-700 text-[10px] px-1.5 py-0.5 rounded font-bold">ADMIN</span>
                        </td>
                        <td class="px-6 py-4">
                            <select @change="updatePlan(user, $event.target.value)" class="bg-slate-100 border-none rounded text-xs font-bold text-slate-600 outline-none cursor-pointer">
                                <option value="FREE" :selected="user.plan === 'FREE'">FREE</option>
                                <option value="PRO" :selected="user.plan === 'PRO'">PRO</option>
                                <option value="ENTERPRISE" :selected="user.plan === 'ENTERPRISE'">ENT</option>
                            </select>
                        </td>
                        <td class="px-6 py-4">
                            <div class="flex items-center gap-2">
                                <div class="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div class="h-full bg-indigo-500" :style="{ width: Math.min(100, (user.usageCount / user.monthlyLimit) * 100) + '%' }"></div>
                                </div>
                                <span class="text-[10px] font-mono">{{ user.usageCount }}</span>
                            </div>
                        </td>
                        <td class="px-6 py-4 text-xs text-slate-500">
                            {{ user.sourcesCount }} מקורות / {{ user.eventsCount }} אירועים
                        </td>
                        <td class="px-6 py-4 text-slate-400 text-xs">{{ new Date(user.createdAt).toLocaleDateString('he-IL') }}</td>
                        <td class="px-6 py-4 flex items-center gap-1">
                            <button @click="impersonate(user)" class="text-blue-400 hover:text-blue-600 p-2" title="התחבר כמשתמש">
                                <i class="fa-solid fa-right-to-bracket"></i>
                            </button>
                            <button @click="deleteUser(user.id)" class="text-red-400 hover:text-red-600 p-2" title="מחק">
                                <i class="fa-regular fa-trash-can"></i>
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>`,
    methods: {
        async adminApi(endpoint, method = 'GET', body = null) {
            // Use admin token if impersonating, otherwise use regular token
            const adminToken = localStorage.getItem('admin_token');
            const token = adminToken || this.$root.token;
            
            try {
                const opts = { method, headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' } };
                if (body) opts.body = JSON.stringify(body);
                const res = await fetch(endpoint, opts);
                if (!res.ok) throw new Error(res.statusText);
                return await res.json();
            } catch (e) { 
                console.error(e); 
                return null; 
            }
        },
        async deleteUser(id) {
            if(confirm('למחוק משתמש זה?')) {
                await this.adminApi('/admin/users/' + id, 'DELETE');
                this.users = this.users.filter(u => u.id !== id);
            }
        },
        async updatePlan(user, newPlan) {
            let newLimit = 10000;
            if(newPlan === 'PRO') newLimit = 100000;
            if(newPlan === 'ENTERPRISE') newLimit = 10000000;
            await this.adminApi('/admin/users/' + user.id, 'PATCH', { plan: newPlan, monthlyLimit: newLimit });
            const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 1500 });
            Toast.fire({ icon: 'success', title: 'החבילה עודכנה' });
        },
        async impersonate(user) {
            const result = await Swal.fire({
                title: 'התחבר כמשתמש',
                html: `<p>להתחבר כ-<b>${user.email}</b>?</p><p class="text-sm text-slate-500 mt-2">תוכל לחזור לחשבון המנהל בכל עת.</p>`,
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'התחבר',
                cancelButtonText: 'ביטול'
            });
            if (!result.isConfirmed) return;
            
            try {
                const res = await this.adminApi('/admin/impersonate/' + user.id, 'POST');
                if (res && res.token) {
                    // Save admin token for return (use current admin token or root token)
                    const currentAdminToken = localStorage.getItem('admin_token') || this.$root.token;
                    localStorage.setItem('admin_token', currentAdminToken);
                    localStorage.setItem('impersonating', JSON.stringify({ email: user.email, name: user.name }));
                    
                    // Set impersonated user token
                    localStorage.setItem('webhook_token', res.token);
                    
                    // Full page reload to update all state
                    window.location.href = '/dashboard';
                }
            } catch (e) {
                Swal.fire({ icon: 'error', title: 'שגיאה', text: 'לא ניתן להתחבר כמשתמש' });
            }
        }
    }
};
