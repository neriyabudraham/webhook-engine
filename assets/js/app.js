const { createApp } = Vue;

createApp({
    data() {
        return {
            token: localStorage.getItem('webhook_token') || '',
            currentPath: window.location.pathname,
            loading: false,
            mobileMenuOpen: false,
            showUserMenu: false,
            
            // Auth
            error: '', success: '', showPassword: false, form: { name: '', email: '', password: '' },
            
            // App Data
            user: { name: 'טוען...', email: '', plan: 'Free', usageCount: 0, monthlyLimit: 10000, role: 'USER' },
            sources: [], destinations: [], events: [],
            
            // Selected Items
            currentSource: null, currentDest: null, currentEvent: null,
            
            // Impersonation
            impersonating: JSON.parse(localStorage.getItem('impersonating') || 'null')
        }
    },
    computed: {
        currentView() {
            // דפים ראשיים
            if (this.isRoute('admin')) return window.AdminComponent;
            if (this.isRoute('pricing')) return window.PricingComponent;
            if (this.isRoute('dashboard')) return window.DashboardComponent;
            if (this.isRoute('sources')) return window.SourcesComponent;
            if (this.isRoute('destinations')) return window.DestinationsComponent;
            if (this.isRoute('connections')) return window.ConnectionsComponent;
            if (this.isRoute('settings')) return window.SettingsComponent;
            
            // דפי פירוט (Deep Links)
            if (this.currentPath.startsWith('/sources/') && window.SourceDetailsComponent) return window.SourceDetailsComponent;
            if (this.currentPath.startsWith('/destinations/') && window.DestinationDetailsComponent) return window.DestinationDetailsComponent;
            if (this.currentPath.startsWith('/filter-editor/') && window.FilterEditorComponent) return window.FilterEditorComponent;
            if (this.isRoute('events') || this.currentPath.startsWith('/events/')) return window.EventsComponent;
            
            return null;
        },
        pageTitle() { return 'WebhookEngine'; },
        userInitials() { if (!this.user || !this.user.name) return 'U'; try { return this.user.name.substring(0, 2).toUpperCase(); } catch (e) { return 'U'; } },
        usagePercentage() { if (!this.user.monthlyLimit) return 0; return Math.min(100, Math.round((this.user.usageCount / this.user.monthlyLimit) * 100)); }
    },
    mounted() {
        window.onpopstate = () => { this.currentPath = window.location.pathname; this.handleRedirects(); };
        this.handleRedirects();
        if (this.token) this.fetchData();
    },
    methods: {
        isRoute(name) {
            if (name === 'dashboard') return this.currentPath === '/' || this.currentPath === '/dashboard';
            return this.currentPath === '/' + name;
        },
        navigate(path) {
            if (path === '/events') this.currentEvent = null;
            if (path === '/sources') this.currentSource = null;
            window.history.pushState({}, "", path);
            this.currentPath = path;
            this.mobileMenuOpen = false;
            this.handleRedirects();
        },
        handleRedirects() {
            if (!this.token && !['/login','/register','/forgot-password'].includes(this.currentPath)) { window.location.href = '/login'; return; }
            if (this.token) {
                if (['/login','/register','/forgot-password'].includes(this.currentPath) || this.currentPath === '/') this.navigate('/dashboard');
                
                if (this.currentPath.startsWith('/sources/') && this.currentPath.split('/').length === 3) this.fetchSourceDetails(this.currentPath.split('/')[2]);
                if ((this.currentPath.startsWith('/destinations/') || this.currentPath.startsWith('/filter-editor/')) && this.currentPath.split('/').length === 3) this.fetchDestDetails(this.currentPath.split('/')[2]);
                if (this.currentPath.startsWith('/events/') && this.currentPath.split('/').length === 3) this.fetchEventDetails(this.currentPath.split('/')[2]);
                
                if (this.isRoute('events')) {
                    this.currentEvent = null;
                    this.api('/my/events').then(data => { if(data) this.events = data; });
                }
            }
        },
        async api(endpoint, method='GET', body=null) {
            try {
                const opts = { method, headers: { 'Authorization': 'Bearer ' + this.token, 'Content-Type': 'application/json' } };
                if (body) opts.body = JSON.stringify(body);
                const res = await fetch(endpoint, opts);
                if (res.status === 401) { this.performLogout(); return null; }
                if (res.status === 403) { console.error('Forbidden'); return null; }
                
                // בדיקת תקינות JSON כדי למנוע שגיאות HTML
                const contentType = res.headers.get("content-type");
                if (contentType && contentType.indexOf("application/json") === -1) {
                    return null; 
                }

                if (!res.ok) throw new Error(res.statusText);
                return await res.json();
            } catch (e) { console.error(e); return null; }
        },
        async fetchData() {
            const [u, s, d] = await Promise.all([this.api('/users/me'), this.api('/my/sources'), this.api('/my/destinations')]);
            if (u) this.user = u; if (s) this.sources = s || []; if (d) this.destinations = d || [];
        },
        
        async fetchSourceDetails(id) { const d = await this.api('/my/sources/' + id); if(d) this.currentSource = d; else this.navigate('/sources'); },
        async fetchDestDetails(id) { const d = await this.api('/my/destinations/' + id); if(d) this.currentDest = d; else this.navigate('/destinations'); },
        async fetchEventDetails(id) { 
            this.loading = true; 
            const d = await this.api('/my/events/' + id); 
            if(d) this.currentEvent = d; 
            else this.navigate('/events'); 
            this.loading = false; 
        },
        
        // --- פונקציות הטיפול שהיו חסרות (החזרתי אותן!) ---
        
        async handleCreateSource(data) { 
            // תמיכה בשליחת שם בלבד או אובייקט
            const payload = (typeof data === 'string') ? { name: data } : data;
            await this.api('/my/sources', 'POST', payload); 
            this.fetchData(); 
        },
        
        async handleUpdateSource(data) { 
            await this.api('/my/sources/' + data.id, 'PATCH', data); 
            this.fetchData(); 
        },
        
        async handleCreateDest(data) { 
            // ניקוי פילטרים ריקים לפני שליחה
            const clean = { ...data };
            if(clean.filters) clean.filters = clean.filters.filter(f => f.key);
            
            await this.api('/my/destinations', 'POST', clean); 
            this.fetchData(); 
            // רענון מקור נוכחי אם אנחנו בתוכו
            if(this.currentSource) this.fetchSourceDetails(this.currentSource.id); 
        },
        
        async handleUpdateDest(data) { 
            await this.api('/my/destinations/' + data.id, 'PATCH', data); 
            this.fetchDestDetails(data.id); 
            this.fetchData(); 
            Swal.fire({icon:'success', title:'עודכן', toast:true, position:'top-end', showConfirmButton:false, timer:1500}); 
        },
        
        handleDeleteDest(id) { 
            Swal.fire({title:'למחוק יעד?', icon:'warning', showCancelButton:true, confirmButtonColor:'#ef4444'}).then(async(r)=>{ 
                if(r.isConfirmed) { 
                    await this.api('/my/destinations/'+id, 'DELETE'); 
                    this.fetchData(); 
                    if(this.currentSource) this.fetchSourceDetails(this.currentSource.id); 
                    if(this.currentDest?.id===id) this.navigate('/destinations'); 
                } 
            }); 
        },
        
        handleDeleteSource(id) {
            Swal.fire({
                title: 'למחוק את המקור?',
                text: 'זה ימחק גם את כל האירועים והיעדים הקשורים!',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#ef4444',
                confirmButtonText: 'כן, מחק'
            }).then(async (r) => {
                if (r.isConfirmed) {
                    const original = [...this.sources];
                    this.sources = this.sources.filter(s => s.id !== id);
                    if (this.currentSource?.id === id) this.navigate('/sources');
                    try {
                        await this.api('/my/sources/'+id, 'DELETE');
                        this.fetchData();
                        Swal.fire({icon:'success', title:'נמחק', toast:true, position:'top-end', showConfirmButton:false, timer:1500});
                    } catch (e) {
                        this.sources = original;
                        console.error(e);
                    }
                }
            });
        },
        
        confirmLogout() { Swal.fire({ title: 'להתנתק?', icon: 'question', showCancelButton: true, confirmButtonText: 'כן' }).then((res) => { if (res.isConfirmed) this.performLogout(); }) },
        performLogout() { 
            localStorage.removeItem('webhook_token'); 
            localStorage.removeItem('admin_token');
            localStorage.removeItem('impersonating');
            this.token = ''; 
            this.impersonating = null;
            window.location.href = '/login'; 
        },
        async exitImpersonation() {
            const adminToken = localStorage.getItem('admin_token');
            if (!adminToken) {
                this.performLogout();
                return;
            }
            
            // Restore admin token
            localStorage.setItem('webhook_token', adminToken);
            localStorage.removeItem('admin_token');
            localStorage.removeItem('impersonating');
            
            this.token = adminToken;
            this.impersonating = null;
            
            // Refresh data with admin token
            await this.fetchData();
            this.navigate('/admin');
            
            Swal.fire({ icon: 'success', title: 'חזרת לחשבון המנהל', toast: true, position: 'top-end', showConfirmButton: false, timer: 2000 });
        },
        getWebhookUrl(slug) { return window.location.origin + '/webhook/' + slug; },
        copyToClipboard(text) { navigator.clipboard.writeText(text); Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 1500 }).fire({ icon: 'success', title: 'הועתק' }); },
    }
}).mount('#app');
