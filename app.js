/* app.js */

// Import Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDarXUqrsWec0ENj6KsXPu4-frpnSrJJB0",
  authDomain: "rafting-277b7.firebaseapp.com",
  projectId: "rafting-277b7",
  storageBucket: "rafting-277b7.firebasestorage.app",
  messagingSenderId: "81570278149",
  appId: "1:81570278149:web:a61618d2487155af9ea56c"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

const STORAGE_KEY = 'rafting_bookings';

const app = {
    bookings: [],
    users: [],
    chartInstance: null,
    currentDate: new Date(),
    
    init() {
        if (localStorage.getItem('rafting_auth_token') !== 'true') {
            window.location.href = 'login.html';
            return;
        }

        // Tampilkan menu Admin
        const role = localStorage.getItem('rafting_user_role');
        if (role === 'Admin' || role === 'Super User') {
            const menuUsers = document.getElementById('menu-users');
            if (menuUsers) menuUsers.style.display = 'flex';
        }

        this.loadData();
        this.setupNavigation();
        this.renderDashboard();
        this.initChart();
        this.initStatusBar();
        
        // Setup Search
        const searchInput = document.querySelector('.search-bar input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
        }
    },

    loadData() {
        const indoNames = ["Budi Santoso", "Siti Aminah", "Agus Setiawan", "Ayu Lestari", "Hendra Wijaya", "Indah Permatasari", "Eko Prasetyo", "Dewi Sartika", "Rizky Pratama", "Fitriani", "Reza Kurniawan", "Nurul Hidayah", "Dedi Saputra", "Rina Marlina", "Andi Syahputra", "Putri Rahayu", "Gilang Ramadhan", "Nisa Kamilia", "Fajar Siddiq", "Ririn Ekawati", "Tono Suharto", "Wulan Rahmawati", "Iwan Kusuma", "Maya Septha", "Dian Sastro"];
        
        const data = localStorage.getItem(STORAGE_KEY);
        if (data && JSON.parse(data).length >= 10) {
            this.bookings = JSON.parse(data);
            
            // Migrate old "Tamu X" names to Indonesian names
            let migrated = false;
            this.bookings.forEach(b => {
                if (b.name && b.name.startsWith("Tamu ")) {
                    b.name = indoNames[Math.floor(Math.random() * indoNames.length)];
                    migrated = true;
                }
            });
            if (migrated) this.saveToStorage();
        } else {
            // Mock data for initial empty state
            const today = new Date();
            this.bookings = [];
            for (let i = 0; i < 60; i++) {
                const d = new Date();
                d.setDate(today.getDate() - i);
                const dateStr = d.toISOString().split('T')[0];
                const boatsCount = Math.floor(Math.random() * 5) + 1;
                this.bookings.push({
                    id: Date.now() - i,
                    name: indoNames[Math.floor(Math.random() * indoNames.length)],
                    phone: "08123456" + i,
                    date: dateStr,
                    session: i % 2 === 0 ? "Pagi (08:30)" : "Siang (13:00)",
                    boats: boatsCount,
                    price: 750000,
                    total: boatsCount * 750000,
                    status: i % 3 === 0 ? "DP" : "Lunas"
                });
            }
            this.saveToStorage();
        }
    },

    saveToStorage() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.bookings));
    },

    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-menu .nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const view = item.getAttribute('data-view');
                if(view) {
                    this.navigate(view);
                }
            });
        });
    },

    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        if(sidebar && overlay) {
            sidebar.classList.toggle('show');
            overlay.classList.toggle('active');
        }
    },

    navigate(viewId) {
        // Update Nav Active State
        document.querySelectorAll('.nav-menu .nav-item').forEach(item => {
            item.classList.remove('active');
            if(item.getAttribute('data-view') === viewId) {
                item.classList.add('active');
            }
        });

        // Hide all views
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });

        // Show selected view
        document.getElementById(`view-${viewId}`).classList.add('active');

        // Close mobile sidebar if open
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        if(sidebar && sidebar.classList.contains('show')) {
            sidebar.classList.remove('show');
            if(overlay) overlay.classList.remove('active');
        }

        // Trigger updates depending on view
        if (viewId === 'dashboard') {
            this.renderDashboard();
        } else if (viewId === 'users') {
            this.renderUsers();
        } else if (viewId === 'calendar') {
            this.renderCalendar();
        } else if (viewId === 'finance') {
            this.renderFinance();
        } else if (viewId === 'reports') {
            this.renderReports();
        } else if (viewId === 'bookings') {
            this.renderBookingsList();
        } else if (viewId === 'new-booking') {
            this.resetForm();
        }
    },

    formatPriceInput(input) {
        let value = input.value.replace(/\D/g, '');
        if (value) {
            value = parseInt(value, 10).toLocaleString('id-ID');
        }
        input.value = value;
    },

    calculateTotal() {
        const boats = parseInt(document.getElementById('b-boats').value) || 0;
        let priceStr = document.getElementById('b-price').value;
        const price = parseInt(priceStr.replace(/\D/g, '')) || 0;
        const total = boats * price;
        
        // Format as Rupiah directly in input
        document.getElementById('b-total').value = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(total);
    },

    formatIDR(number) {
        return new Intl.NumberFormat('id-ID', { 
            style: 'currency', 
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(number);
    },

    getStatusBadge(status) {
        let className = 'badge';
        if(status === 'Lunas') className += ' lunas';
        if(status === 'DP') className += ' dp';
        if(status === 'Belum Bayar') className += ' belum-bayar';
        return `<span class="${className}">${status}</span>`;
    },

    saveBooking(e) {
        e.preventDefault();
        
        const idInput = document.getElementById('booking-id').value;
        const boats = parseInt(document.getElementById('b-boats').value);
        let priceStr = document.getElementById('b-price').value;
        const price = parseInt(priceStr.replace(/\D/g, '')) || 0;

        const newBooking = {
            id: idInput ? parseInt(idInput) : Date.now(),
            name: document.getElementById('b-name').value,
            phone: document.getElementById('b-phone').value,
            date: document.getElementById('b-date').value,
            session: document.getElementById('b-session').value,
            boats: boats,
            price: price,
            total: boats * price,
            status: document.getElementById('b-status').value
        };

        if(idInput) {
            // Edit
            const index = this.bookings.findIndex(b => b.id == idInput);
            if(index !== -1) this.bookings[index] = newBooking;
        } else {
            // Create
            this.bookings.push(newBooking);
        }

        this.saveToStorage();
        this.navigate('bookings');
        
        // Cek jika butuh cetak struk
        if (confirm(idInput ? 'Pembaruan tersimpan! Ingin cetak struk untuk pesanan ini?' : 'Pesanan baru tersimpan! Ingin cetak struk sekarang?')) {
            this.printReceipt(newBooking);
        } else {
            this.renderDashboard();
        }
    },

    printReceipt(booking) {
        document.getElementById('r-date').innerText = booking.date;
        document.getElementById('r-id').innerText = '#' + booking.id;
        document.getElementById('r-name').innerText = booking.name;
        document.getElementById('r-session').innerText = booking.session;
        document.getElementById('r-boats').innerText = booking.boats + ' Perahu';
        document.getElementById('r-total').innerText = this.formatIDR(booking.total);
        document.getElementById('r-status').innerText = booking.status;
        
        window.print();
    },

    editBooking(id) {
        const booking = this.bookings.find(b => b.id === id);
        if(!booking) return;

        document.getElementById('booking-id').value = booking.id;
        document.getElementById('b-name').value = booking.name;
        document.getElementById('b-phone').value = booking.phone;
        document.getElementById('b-date').value = booking.date;
        document.getElementById('b-session').value = booking.session;
        document.getElementById('b-boats').value = booking.boats;
        document.getElementById('b-price').value = parseInt(booking.price).toLocaleString('id-ID');
        document.getElementById('b-status').value = booking.status;
        
        this.calculateTotal();
        this.navigate('new-booking');
        
        // Change title
        document.querySelector('#view-new-booking h2').innerText = 'Edit Booking';
    },

    deleteBooking(id) {
        if(confirm('Apakah Anda yakin ingin menghapus data booking ini?')) {
            this.bookings = this.bookings.filter(b => b.id !== id);
            this.saveToStorage();
            this.renderBookingsList();
            this.renderDashboard();
        }
    },

    resetForm() {
        document.getElementById('booking-form').reset();
        document.getElementById('booking-id').value = '';
        document.querySelector('#view-new-booking h2').innerText = 'Tambah Booking Baru';
        
        // Default values
        document.getElementById('b-date').value = new Date().toISOString().split('T')[0];
        this.calculateTotal();
    },

    renderDashboard() {
        const today = new Date().toISOString().split('T')[0];
        
        // Calculate stats for today
        const todaysBookings = this.bookings.filter(b => b.date === today);
        const totalBoats = todaysBookings.reduce((sum, b) => sum + b.boats, 0);
        const totalGuests = totalBoats * 4; // assuming 4 guests max per boat as an estimate
        
        document.getElementById('stat-boats').innerText = totalBoats;
        document.getElementById('stat-guests').innerText = `~${totalGuests}`;
        document.getElementById('stat-today').innerText = todaysBookings.length;

        // Render Recent Bookings (last 5)
        const recent = [...this.bookings].sort((a,b) => b.id - a.id).slice(0, 5);
        const tbody = document.getElementById('dashboard-recent-tbody');
        tbody.innerHTML = '';

        if(recent.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Belum ada pesanan masuk.</td></tr>`;
            return;
        }

        recent.forEach(b => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${b.name}</strong></td>
                <td>${b.date}</td>
                <td>${b.session}</td>
                <td>${b.boats} Perahu</td>
                <td>${this.getStatusBadge(b.status)}</td>
            `;
            tbody.appendChild(tr);
        });
    },

    renderBookingsList(filterQuery = '') {
        const tbody = document.getElementById('bookings-tbody');
        tbody.innerHTML = '';

        const data = this.bookings.filter(b => 
            b.name.toLowerCase().includes(filterQuery.toLowerCase()) || 
            b.phone.includes(filterQuery)
        ).sort((a,b) => new Date(b.date) - new Date(a.date));

        if(data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 2rem;">Tidak ada data ditemukan.</td></tr>`;
            return;
        }

        data.forEach(b => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${b.name}</strong></td>
                <td>${b.phone}</td>
                <td>${b.date}</td>
                <td>${b.session}</td>
                <td>${b.boats} Perahu</td>
                <td style="font-weight:600;">${this.formatIDR(b.total)}</td>
                <td>${this.getStatusBadge(b.status)}</td>
                <td>
                    <div class="action-links">
                        <button class="btn-edit" onclick="app.editBooking(${b.id})" title="Edit"><i class="ri-edit-line"></i></button>
                        <button class="btn-delete" onclick="app.deleteBooking(${b.id})" title="Hapus"><i class="ri-delete-bin-line"></i></button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    },

    handleSearch(query) {
        if(document.getElementById('view-bookings').classList.contains('active')) {
            this.renderBookingsList(query);
        } else {
            // Auto navigate to bookings if searching from another view
            if(query.length > 2) {
                this.navigate('bookings');
                this.renderBookingsList(query);
            }
        }
    },

    renderCalendar() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
        document.getElementById('cal-month-year').innerText = `${monthNames[month]} ${year}`;
        
        const grid = document.getElementById('calendar-grid');
        grid.innerHTML = '';
        
        const firstDay = new Date(year, month, 1).getDay(); // 0 is Sunday
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        // Add empty cells for days before the 1st of the month
        for (let i = 0; i < firstDay; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'calendar-cell empty';
            grid.appendChild(emptyCell);
        }
        
        const todayStr = new Date().toISOString().split('T')[0];
        
        // Add cells for each day
        for (let i = 1; i <= daysInMonth; i++) {
            const cell = document.createElement('div');
            cell.className = 'calendar-cell';
            
            // pad month and day
            const mStr = String(month + 1).padStart(2, '0');
            const dStr = String(i).padStart(2, '0');
            const dateStr = `${year}-${mStr}-${dStr}`;
            
            if (dateStr === todayStr) {
                cell.classList.add('today');
            }
            
            // Find bookings for this date
            const dayBookings = this.bookings.filter(b => b.date === dateStr);
            
            let html = `<span class="date-number">${i}</span>`;
            
            if (dayBookings.length > 0) {
                cell.classList.add('has-booking');
                
                let dotsHtml = '<div class="booking-dots">';
                let tooltipHtml = '<div class="cal-tooltip">';
                
                const pagiBookings = dayBookings.filter(b => b.session.includes('Pagi'));
                const siangBookings = dayBookings.filter(b => b.session.includes('Siang'));
                
                if (pagiBookings.length > 0) {
                    const totalPagi = pagiBookings.reduce((sum, b) => sum + parseInt(b.boats), 0);
                    tooltipHtml += `<div class="tt-item" style="background: rgba(16,185,129,0.1); padding: 4px; text-align: center; border-radius: 4px; font-weight: bold; margin-bottom: 5px; color: var(--success); text-transform: uppercase; font-size: 0.75rem;">Total Pagi: ${totalPagi} Perahu</div>`;
                    
                    pagiBookings.forEach(b => {
                        dotsHtml += `<div class="dot Pagi"></div>`;
                        tooltipHtml += `
                            <div class="tt-item">
                                <strong>${b.name}</strong><br>
                                ${b.boats} Perahu | ${b.session}
                            </div>
                        `;
                    });
                }
                
                if (pagiBookings.length > 0 && siangBookings.length > 0) {
                    tooltipHtml += `<div style="border-bottom: 2px solid #ff4444; margin: 4px 0; opacity: 0.8; border-radius: 2px;"></div>`;
                }
                
                if (siangBookings.length > 0) {
                    const totalSiang = siangBookings.reduce((sum, b) => sum + parseInt(b.boats), 0);
                    tooltipHtml += `<div class="tt-item" style="background: rgba(245,158,11,0.1); padding: 4px; text-align: center; border-radius: 4px; font-weight: bold; margin-bottom: 5px; color: var(--warning); text-transform: uppercase; font-size: 0.75rem;">Total Siang: ${totalSiang} Perahu</div>`;
                    
                    siangBookings.forEach(b => {
                        dotsHtml += `<div class="dot Siang"></div>`;
                        tooltipHtml += `
                            <div class="tt-item">
                                <strong>${b.name}</strong><br>
                                ${b.boats} Perahu | ${b.session}
                            </div>
                        `;
                    });
                }
                
                dotsHtml += '</div>';
                tooltipHtml += '</div>';
                
                html += dotsHtml + tooltipHtml;
            }
            
            cell.innerHTML = html;
            grid.appendChild(cell);
        }
    },
    
    prevMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.renderCalendar();
    },
    
    nextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.renderCalendar();
    },
    
    initChart() {
        // give it a slight delay to ensure the canvas is rendered and visible
        setTimeout(() => {
            this.updateChart();
        }, 100);
    },

    updateChart() {
        const canvas = document.getElementById('boatsChart');
        if (!canvas) return; // canvas might not exist if we modify layout
        
        const typeEl = document.getElementById('chart-type');
        const rangeEl = document.getElementById('chart-range');
        if (!typeEl || !rangeEl) return;
        
        const chartType = typeEl.value;
        const range = rangeEl.value;

        // Group data
        const aggregated = {};
        const now = new Date();

        this.bookings.forEach(b => {
            const bDate = new Date(b.date);
            let key = '';

            // Filtering and Key generation
            if (range === 'daily') {
                // last 7 days inclusive today
                const diffTime = now.getTime() - bDate.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                if (diffDays <= 7 && diffDays >= 0) {
                    key = b.date; 
                }
            } else if (range === 'weekly') {
                // last 4 weeks approx
                const diffTime = now.getTime() - bDate.getTime();
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                if(diffDays <= 28 && diffDays >= 0) {
                    const weekNo = Math.floor(diffDays / 7);
                    key = `Minggu Lalu -${weekNo}`;
                }
            } else if (range === 'monthly') {
                // within this year
                if (bDate.getFullYear() === now.getFullYear()) {
                    key = bDate.toLocaleString('id-ID', { month: 'short' });
                    // Store numeric for sorting 
                    if (!aggregated[key]) aggregated[key] = { count: 0, order: bDate.getMonth() };
                    aggregated[key].count += b.boats;
                    key = null; // Skip direct assignment below
                }
            } else if (range === 'yearly') {
                key = bDate.getFullYear().toString();
            }

            if (key) {
                if(!aggregated[key]) aggregated[key] = 0;
                aggregated[key] += b.boats;
            }
        });

        // Convert object to sorted arrays
        let labels = [];
        let dataPoints = [];

        if (range === 'monthly') {
            const months = Object.keys(aggregated).map(k => ({ name: k, order: aggregated[k].order, count: aggregated[k].count }));
            months.sort((a,b) => a.order - b.order);
            labels = months.map(m => m.name);
            dataPoints = months.map(m => m.count);
        } else {
            labels = Object.keys(aggregated);
            if(range === 'daily' || range === 'yearly') {
                labels.sort((a,b) => new Date(a) - new Date(b) || parseInt(a) - parseInt(b));
            } else if (range === 'weekly') {
                labels.sort().reverse();
            }
            dataPoints = labels.map(l => aggregated[l]);
        }

        // Destroy previous chart
        if (this.chartInstance) {
            this.chartInstance.destroy();
        }

        if (typeof Chart === 'undefined') {
            console.error('Chart.js is not loaded');
            return;
        }

        const ctx = canvas.getContext('2d');
        this.chartInstance = new Chart(ctx, {
            type: chartType,
            data: {
                labels: labels.length ? labels : ['Belum ada data'],
                datasets: [{
                    label: 'Perahu',
                    data: dataPoints.length ? dataPoints : [0],
                    backgroundColor: 'rgba(10, 153, 255, 0.4)',
                    borderColor: '#0a99ff',
                    borderWidth: 2,
                    borderRadius: chartType === 'bar' ? 4 : 0,
                    tension: 0.3,
                    fill: chartType === 'line'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    }
                }
            }
        });
    },

    renderFinance() {
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];

        let totalToday = 0;
        let totalWeek = 0;
        let totalMonth = 0;
        let totalYear = 0;

        this.bookings.forEach(b => {
            if (b.status !== 'Belum Bayar') {
                const bDate = new Date(b.date);
                const bPrice = parseInt(b.total) || 0;

                // Hari ini
                if (b.date === todayStr) {
                    totalToday += bPrice;
                }

                // Tahun ini
                if (bDate.getFullYear() === now.getFullYear()) {
                    totalYear += bPrice;
                    
                    // Bulan ini
                    if (bDate.getMonth() === now.getMonth()) {
                        totalMonth += bPrice;
                    }
                }

                // Minggu ini (7 hari terakhir inclusive)
                const diffTime = now.getTime() - bDate.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays <= 7 && diffDays >= 0) {
                    totalWeek += bPrice;
                }
            }
        });

        document.getElementById('fin-today').innerText = this.formatIDR(totalToday);
        document.getElementById('fin-week').innerText = this.formatIDR(totalWeek);
        document.getElementById('fin-month').innerText = this.formatIDR(totalMonth);
        document.getElementById('fin-year').innerText = this.formatIDR(totalYear);
    },

    initStatusBar() {
        const loginTimeStr = localStorage.getItem('rafting_login_time');
        const loginDate = loginTimeStr ? new Date(parseInt(loginTimeStr)) : new Date();
        
        const loginTimeEl = document.getElementById('status-login-time');
        if (loginTimeEl) {
            loginTimeEl.innerText = loginDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        }

        setInterval(() => {
            const now = new Date();
            
            // Set current time
            const clockEl = document.getElementById('status-clock');
            if (clockEl) {
                clockEl.innerText = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            }
            
            // Set duration
            let diffSeconds = Math.floor((now - loginDate) / 1000);
            
            const hours = Math.floor(diffSeconds / 3600);
            diffSeconds %= 3600;
            const minutes = Math.floor(diffSeconds / 60);
            const seconds = diffSeconds % 60;
            
            const durStr = 
                String(hours).padStart(2, '0') + ':' + 
                String(minutes).padStart(2, '0') + ':' + 
                String(seconds).padStart(2, '0');
            
            const durEl = document.getElementById('status-duration');
            if (durEl) {
                durEl.innerHTML = `<i class="ri-timer-line"></i> ${durStr}`;
            }

        }, 1000);
    },

    renderReports() {
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        
        const summary = {
            today: { boats: 0, pagi: 0, siang: 0, income: 0, label: 'Hari Ini' },
            week: { boats: 0, pagi: 0, siang: 0, income: 0, label: 'Minggu Ini' },
            month: { boats: 0, pagi: 0, siang: 0, income: 0, label: 'Bulan Ini' },
            year: { boats: 0, pagi: 0, siang: 0, income: 0, label: 'Tahun Ini' }
        };

        this.bookings.forEach(b => {
            if (b.status === 'Belum Bayar') return;
            
            const bDate = new Date(b.date);
            const price = parseInt(b.total) || 0;
            const bCount = parseInt(b.boats) || 0;
            const isPagi = b.session.includes('Pagi');

            const addData = (key) => {
                summary[key].boats += bCount;
                summary[key].income += price;
                if(isPagi) summary[key].pagi += 1;
                else summary[key].siang += 1;
            };

            // Today
            if (b.date === todayStr) addData('today');

            // Year
            if (bDate.getFullYear() === now.getFullYear()) {
                addData('year');
                // Month
                if (bDate.getMonth() === now.getMonth()) addData('month');
            }

            // Week (last 7 days inclusive)
            const diffTime = now.getTime() - bDate.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays <= 7 && diffDays >= 0) addData('week');
        });

        const tbody = document.getElementById('reports-tbody');
        if (tbody) {
            tbody.innerHTML = '';
            
            ['today', 'week', 'month', 'year'].forEach(key => {
                const data = summary[key];
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${data.label}</strong></td>
                    <td>${data.boats} Perahu</td>
                    <td><span class="badge" style="background:#d1fae5;color:#065f46">Pagi: ${data.pagi}</span> <span class="badge" style="background:#fef3c7;color:#92400e; margin-left:5px;">Siang: ${data.siang}</span></td>
                    <td style="font-weight:bold; color:var(--success);">${this.formatIDR(data.income)}</td>
                `;
                tbody.appendChild(tr);
            });
        }
    },

    exportExcel() {
        // Generate CSV
        let csvContent = "data:text/csv;charset=utf-8,";
        // Header
        csvContent += "ID,Nama Pemesan,No HP,Tanggal,Sesi Trip,Jml Perahu,Total Pembayaran,Status\n";
        
        this.bookings.forEach(b => {
            const row = [
                b.id,
                `"${b.name}"`,
                `"${b.phone}"`,
                b.date,
                `"${b.session}"`,
                b.boats,
                b.total,
                b.status
            ].join(",");
            csvContent += row + "\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Laporan_Rafting_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },

    printReport() {
        document.body.classList.add('print-a4');
        const printTime = document.getElementById('report-print-time');
        if(printTime) {
            printTime.innerText = new Date().toLocaleString('id-ID');
        }
        window.print();
        setTimeout(() => {
            document.body.classList.remove('print-a4');
        }, 500); // delay to allow print dialog rendering
    },

    async renderUsers() {
        const tbody = document.getElementById('users-tbody');
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Memuat data...</td></tr>';
        
        try {
            const querySnapshot = await getDocs(collection(db, "users"));
            this.users = [];
            querySnapshot.forEach((docSnap) => {
                this.users.push({ id: docSnap.id, ...docSnap.data() });
            });

            tbody.innerHTML = '';
            if(this.users.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Tidak ada data pengguna.</td></tr>';
                return;
            }

            this.users.forEach(u => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${u.username}</strong></td>
                    <td>${u.password}</td>
                    <td><span class="badge" style="background:#e2e8f0;color:#475569">${u.role}</span></td>
                    <td>
                        <div class="action-links">
                            <button class="btn-edit" onclick="app.editUser('${u.id}')" title="Edit"><i class="ri-edit-line"></i></button>
                            <button class="btn-delete" onclick="app.deleteUser('${u.id}', '${u.username}')" title="Hapus"><i class="ri-delete-bin-line"></i></button>
                        </div>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        } catch (error) {
            console.error("Error loading users", error);
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: red;">Gagal memuat data dari database.</td></tr>';
        }
    },

    async saveUser(e) {
        e.preventDefault();
        const id = document.getElementById('u-id').value;
        const btn = document.getElementById('save-user-btn');
        const origText = btn.innerHTML;
        
        const userData = {
            username: document.getElementById('u-username').value,
            password: document.getElementById('u-password').value,
            role: document.getElementById('u-role').value
        };

        btn.innerHTML = 'Menyimpan...';
        btn.disabled = true;

        try {
            if (id) {
                const userRef = doc(db, "users", id);
                await updateDoc(userRef, userData);
            } else {
                await addDoc(collection(db, "users"), userData);
            }
            this.resetUserForm();
            this.renderUsers();
            alert('Data pengguna berhasil disimpan!');
        } catch (error) {
            console.error("Error saving user", error);
            alert('Gagal menyimpan data pengguna!');
        } finally {
            btn.innerHTML = origText;
            btn.disabled = false;
        }
    },

    editUser(id) {
        const user = this.users.find(u => u.id === id);
        if(!user) return;

        document.getElementById('u-id').value = user.id;
        document.getElementById('u-username').value = user.username;
        document.getElementById('u-password').value = user.password;
        document.getElementById('u-role').value = user.role;
        
        document.getElementById('user-form-title').innerText = 'Edit User: ' + user.username;
        document.getElementById('cancel-user-btn').style.display = 'block';
    },

    resetUserForm() {
        document.getElementById('user-form').reset();
        document.getElementById('u-id').value = '';
        document.getElementById('user-form-title').innerText = 'Tambah User Baru';
        document.getElementById('cancel-user-btn').style.display = 'none';
    },

    async deleteUser(id, username) {
        const currentUser = localStorage.getItem('rafting_username');
        if (currentUser === username) {
            alert('Anda tidak bisa menghapus akun Anda sendiri saat sedang login!');
            return;
        }

        if(confirm(`Yakin ingin menghapus pengguna "${username}"?`)) {
            try {
                await deleteDoc(doc(db, "users", id));
                this.renderUsers();
            } catch (error) {
                console.error("Error deleting", error);
                alert('Gagal menghapus data!');
            }
        }
    },

    logout() {
        if(confirm("Sesi Anda akan diakhiri. Apakah Anda yakin ingin keluar?")) {
            localStorage.removeItem('rafting_auth_token');
            window.location.href = 'login.html';
        }
    }
};

// Initialize App Setup
window.app = app;
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
