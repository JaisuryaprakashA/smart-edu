const db = {
    get: (key) => JSON.parse(localStorage.getItem(key)) ||[],
    set: (key, data) => localStorage.setItem(key, JSON.stringify(data))
};

const app = {
    currentUser: null,
    editingUserId: null, 

    init() {
        // Initialize Default Admin if Database is empty
        if (db.get("users").length === 0) {
            db.set("users",[{ 
                id: 1, username: 'admin', password: 'admin123', role: 'admin', 
                fullName: 'System Admin', department: 'Management', rollNo: ''
            }]);
        }
        
        // Auto Login if session exists
        const session = localStorage.getItem("currentUser");
        if (session) {
            this.currentUser = JSON.parse(session);
            this.loadDashboard();
        }
    },

    showToast(msg) {
        const toast = document.getElementById('toast');
        toast.innerText = msg;
        toast.classList.remove('hidden');
        setTimeout(() => toast.classList.add('hidden'), 3000);
    },

    // ==========================================
    // AUTHENTICATION
    // ==========================================
    login() {
        const userVal = document.getElementById("loginUsername").value;
        const passVal = document.getElementById("loginPassword").value;
        const users = db.get("users");

        const user = users.find(u => u.username === userVal && u.password === passVal);
        
        if (user) {
            localStorage.setItem("currentUser", JSON.stringify(user));
            this.currentUser = user;
            document.getElementById("loginUsername").value = '';
            document.getElementById("loginPassword").value = '';
            this.loadDashboard();
            this.showToast(`Welcome back, ${user.fullName}!`);
        } else {
            this.showToast("Invalid Credentials!");
        }
    },

    logout() {
        localStorage.removeItem("currentUser");
        this.currentUser = null;
        document.getElementById("dashboard-view").classList.remove("active-view");
        document.getElementById("login-view").classList.add("active-view");
    },

    // ==========================================
    // SIDEBAR & NAVIGATION ROUTER
    // ==========================================
    loadDashboard() {
        document.getElementById("login-view").classList.remove("active-view");
        document.getElementById("dashboard-view").classList.add("active-view");
        
        document.getElementById("sidebar-user-name").innerText = this.currentUser.fullName;
        document.getElementById("sidebar-user-role").innerText = this.currentUser.role;
        
        const navMenu = document.getElementById("nav-menu");
        navMenu.innerHTML = ''; 

        if (this.currentUser.role === 'admin') {
            navMenu.innerHTML = `
                <button onclick="app.renderAdminDash()">📊 Overview</button>
                <button onclick="app.renderManageUsers()">👥 Manage Users</button>
                <button onclick="app.renderLibraryAdmin()">📚 Library & Content</button>
                <button onclick="app.renderProfile()">⚙️ My Profile</button>
            `;
            this.renderAdminDash();
        } 
        else if (this.currentUser.role === 'teacher') {
            navMenu.innerHTML = `
                <button onclick="app.renderExplore()">🔍 Explore Content</button>
                <button onclick="app.renderTeacherDash()">📁 My Uploads</button>
                <button onclick="app.renderUploadContent()">☁️ Upload Content</button>
                <button onclick="app.renderManageMarks()">📝 Grade Students</button>
                <button onclick="app.renderProfile()">⚙️ My Profile</button>
            `;
            this.renderExplore();
        }
        else if (this.currentUser.role === 'student') {
            navMenu.innerHTML = `
                <button onclick="app.renderExplore()">🔍 Explore & Search</button>
                <button onclick="app.renderStudentLibrary()">🏫 My Dept Library</button>
                <button onclick="app.renderMyBooks()">📖 Borrowed Books</button>
                <button onclick="app.renderMyMarks()">📊 My Marks</button>
                <button onclick="app.renderProfile()">⚙️ My Profile</button>
            `;
            this.renderExplore(); 
        }
    },

    // ==========================================
    // COMMON: MY PROFILE
    // ==========================================
    renderProfile() {
        const u = this.currentUser;
        document.getElementById("main-content").innerHTML = `
            <h2 class="section-title">⚙️ Edit My Profile</h2>
            <div class="form-card" style="max-width: 600px;">
                <div class="form-grid" style="grid-template-columns: 1fr;">
                    <label>Full Name</label>
                    <input type="text" id="profName" value="${u.fullName}">
                    <label>Password</label>
                    <input type="text" id="profPass" value="${u.password}">
                    <label>Department / Category</label>
                    <input type="text" id="profDept" value="${u.department || ''}">
                </div>
                <button onclick="app.saveProfile()">Update Profile</button>
            </div>
        `;
    },

    saveProfile() {
        const users = db.get("users");
        const index = users.findIndex(u => u.id === this.currentUser.id);
        
        users[index].fullName = document.getElementById("profName").value;
        users[index].password = document.getElementById("profPass").value;
        users[index].department = document.getElementById("profDept").value;

        db.set("users", users);
        this.currentUser = users[index];
        localStorage.setItem("currentUser", JSON.stringify(this.currentUser));
        
        this.showToast("Profile updated successfully!");
        this.loadDashboard(); 
    },

    // ==========================================
    // EXPLORE & SEARCH ENGINE (YouTube Style)
    // ==========================================
    renderExplore(query = '') {
        const allBooks = db.get("books");
        const allVideos = db.get("videos");
        
        let filteredBooks = allBooks;
        let filteredVideos = allVideos;
        
        if (query) {
            const q = query.toLowerCase();
            filteredBooks = allBooks.filter(b => b.title.toLowerCase().includes(q) || b.category.toLowerCase().includes(q) || b.uploadedBy.toLowerCase().includes(q));
            filteredVideos = allVideos.filter(v => v.title.toLowerCase().includes(q) || v.category.toLowerCase().includes(q) || v.uploadedBy.toLowerCase().includes(q));
        } else {
            // Show latest 4 uploads for Suggestions
            filteredBooks = [...allBooks].reverse().slice(0, 4);
            filteredVideos = [...allVideos].reverse().slice(0, 4);
        }

        let html = `
            <div class="search-header">
                <input type="text" id="searchInput" class="search-input" placeholder="Search for videos, books, subjects, or teachers..." value="${query}" onkeypress="if(event.key === 'Enter') app.handleSearch()">
                <button class="search-btn" onclick="app.handleSearch()">Search</button>
            </div>
        `;

        if (query) {
            html += `<h2 class="section-title">🔍 Search Results for "${query}"</h2>`;
            if (filteredVideos.length === 0 && filteredBooks.length === 0) {
                html += `<div class="empty-state">No results found for "<b>${query}</b>".</div>`;
            } else {
                if (filteredVideos.length > 0) html += `<h3 style="margin-bottom:15px; color:var(--primary);">▶ Videos Found</h3><div class="content-grid">${this.generateVideoCards(filteredVideos)}</div>`;
                if (filteredBooks.length > 0) html += `<h3 style="margin-bottom:15px; color:var(--primary);">📚 Books Found</h3><div class="content-grid">${this.generateBookCards(filteredBooks)}</div>`;
            }
        } else {
            html += `<h2 class="section-title">🔥 Trending Videos</h2><div class="content-grid">${this.generateVideoCards(filteredVideos)}</div>
                     <h2 class="section-title">🌟 Suggested Books</h2><div class="content-grid">${this.generateBookCards(filteredBooks)}</div>`;
        }

        document.getElementById("main-content").innerHTML = html;
        if(query) {
            let input = document.getElementById("searchInput");
            input.focus(); 
            input.setSelectionRange(input.value.length, input.value.length);
        }
    },

    handleSearch() {
        this.renderExplore(document.getElementById("searchInput").value.trim());
    },

    // ==========================================
    // ADMIN FUNCTIONS 
    // ==========================================
    renderAdminDash() {
        const users = db.get("users");
        document.getElementById("main-content").innerHTML = `
            <h2 class="section-title">Admin Dashboard</h2>
            <div class="stats-grid">
                <div class="stat-card"><h3>Total Users</h3><h2>${users.length}</h2></div>
                <div class="stat-card"><h3>Books</h3><h2>${db.get("books").length}</h2></div>
                <div class="stat-card"><h3>Videos</h3><h2>${db.get("videos").length}</h2></div>
            </div>
        `;
    },

    renderManageUsers() {
        this.editingUserId = null; 
        let userRows = db.get("users").map(u => `
            <div class="list-item">
                <div>
                    <strong>${u.fullName}</strong> (${u.username}) - <span class="item-category">${u.role}</span><br>
                    <small>Dept: ${u.department || 'N/A'} | Roll No: ${u.rollNo || 'N/A'}</small>
                </div>
                ${u.role !== 'admin' ? `
                <div>
                    <button class="btn-warning action-btn" style="width:auto; padding:5px 15px; border-radius:5px; margin-right:5px;" onclick="app.editUser(${u.id})">Edit</button>
                    <button class="btn-danger action-btn" style="width:auto; padding:5px 15px; border-radius:5px;" onclick="app.deleteUser(${u.id})">Remove</button>
                </div>` : ''}
            </div>
        `).join('');

        document.getElementById("main-content").innerHTML = `
            <h2 class="section-title" id="formTitle">Create New Profile</h2>
            <div class="form-card">
                <div class="form-grid">
                    <input type="text" id="newFullName" placeholder="Full Name">
                    <input type="text" id="newUsername" placeholder="Username">
                    <input type="text" id="newPassword" placeholder="Password">
                    <select id="newRole">
                        <option value="student">Student</option>
                        <option value="teacher">Teacher</option>
                    </select>
                    <input type="text" id="newDept" placeholder="Department / Subject">
                    <input type="text" id="newRollNo" placeholder="Roll No (For Students)">
                </div>
                <button id="userSubmitBtn" onclick="app.saveUser()">Create Profile</button>
            </div>
            <h2 class="section-title">All Users</h2>
            <div class="list-group">${userRows}</div>
        `;
    },

    editUser(id) {
        this.editingUserId = id;
        const user = db.get("users").find(u => u.id === id);
        
        document.getElementById("newFullName").value = user.fullName;
        document.getElementById("newUsername").value = user.username;
        document.getElementById("newPassword").value = user.password;
        document.getElementById("newRole").value = user.role;
        document.getElementById("newDept").value = user.department;
        document.getElementById("newRollNo").value = user.rollNo || '';
        
        document.getElementById("formTitle").innerText = "Edit Profile";
        document.getElementById("userSubmitBtn").innerText = "Update User";
        document.getElementById("userSubmitBtn").className = "btn-warning action-btn";
        
        // Scroll to form
        document.getElementById("main-content").scrollTo({ top: 0, behavior: 'smooth' });
    },

    saveUser() {
        const users = db.get("users");
        
        const userData = {
            fullName: document.getElementById("newFullName").value,
            username: document.getElementById("newUsername").value,
            password: document.getElementById("newPassword").value,
            role: document.getElementById("newRole").value,
            department: document.getElementById("newDept").value,
            rollNo: document.getElementById("newRollNo").value
        };

        if(!userData.fullName || !userData.username || !userData.password) return this.showToast("Fill required fields!");

        if (this.editingUserId) {
            const index = users.findIndex(u => u.id === this.editingUserId);
            users[index] = { ...users[index], ...userData };
            this.showToast("User updated successfully!");
        } else {
            if(users.find(u => u.username === userData.username)) return this.showToast("Username taken!");
            users.push({ id: Date.now(), ...userData });
            this.showToast("User created successfully!");
        }

        db.set("users", users);
        this.renderManageUsers();
    },

    deleteUser(id) {
        if(!confirm("Are you sure you want to delete this user?")) return;
        let users = db.get("users").filter(u => u.id !== id);
        db.set("users", users);
        this.showToast("User deleted!");
        this.renderManageUsers();
    },

    renderLibraryAdmin() {
        const books = db.get("books");
        const videos = db.get("videos");

        let bookHTML = books.map(b => `
            <div class="list-item">
                <div>📚 <strong>${b.title}</strong>[${b.category}] <br><small>By: ${b.uploadedBy}</small></div>
                <button class="btn-danger action-btn" style="width:auto; padding:5px 10px; border-radius:5px;" onclick="app.deleteContent('books', ${b.id})">Delete</button>
            </div>
        `).join('');

        let videoHTML = videos.map(v => `
            <div class="list-item">
                <div>🎥 <strong>${v.title}</strong>[${v.category}] <br><small>By: ${v.uploadedBy}</small></div>
                <button class="btn-danger action-btn" style="width:auto; padding:5px 10px; border-radius:5px;" onclick="app.deleteContent('videos', ${v.id})">Delete</button>
            </div>
        `).join('');

        document.getElementById("main-content").innerHTML = `
            <h2 class="section-title">Library Management</h2>
            <h3>Books</h3><div class="list-group">${bookHTML || '<div class="list-item">No books</div>'}</div>
            <h3>Videos</h3><div class="list-group">${videoHTML || '<div class="list-item">No videos</div>'}</div>
        `;
    },

    deleteContent(type, id) {
        if(!confirm("Delete this content?")) return;
        let items = db.get(type).filter(i => i.id !== id);
        db.set(type, items);
        this.showToast("Content removed.");
        
        if(this.currentUser.role === 'admin') this.renderLibraryAdmin();
        if(this.currentUser.role === 'teacher') this.renderTeacherDash();
    },

    // ==========================================
    // TEACHER: UPLOADS & GRADING SYSTEM
    // ==========================================
    renderTeacherDash() {
        const myBooks = db.get("books").filter(b => b.uploaderId === this.currentUser.id);
        const myVideos = db.get("videos").filter(v => v.uploaderId === this.currentUser.id);

        let bookHTML = myBooks.map(b => `<div class="list-item"><div>📚 ${b.title} (${b.category})</div><button class="btn-danger action-btn" style="width:auto; padding:5px 10px; border-radius:5px;" onclick="app.deleteContent('books', ${b.id})">Delete</button></div>`).join('');
        let videoHTML = myVideos.map(v => `<div class="list-item"><div>🎥 ${v.title} (${v.category})</div><button class="btn-danger action-btn" style="width:auto; padding:5px 10px; border-radius:5px;" onclick="app.deleteContent('videos', ${v.id})">Delete</button></div>`).join('');

        document.getElementById("main-content").innerHTML = `
            <h2 class="section-title">My Uploads Overview</h2>
            <h3>My Books</h3><div class="list-group">${bookHTML || '<div class="list-item">No books uploaded.</div>'}</div>
            <h3>My Videos</h3><div class="list-group">${videoHTML || '<div class="list-item">No videos uploaded.</div>'}</div>
        `;
    },

    renderUploadContent() {
        document.getElementById("main-content").innerHTML = `
            <h2 class="section-title">Upload New Content</h2>
            <div class="form-card">
                <h3>📚 Upload Book (PDF/Drive Link)</h3><br>
                <div class="form-grid">
                    <input type="text" id="bTitle" placeholder="Book Title">
                    <input type="text" id="bCat" placeholder="Category (e.g., Science, Math)">
                    <input type="text" id="bLink" placeholder="Google Drive/PDF Link">
                </div>
                <button onclick="app.uploadBook()">Upload Book</button>
            </div>
            <div class="form-card">
                <h3>🎥 Upload Video (YouTube Link)</h3><br>
                <div class="form-grid">
                    <input type="text" id="vTitle" placeholder="Video Title">
                    <input type="text" id="vCat" placeholder="Category (e.g., Physics, History)">
                    <input type="text" id="vLink" placeholder="YouTube Video Link">
                </div>
                <button onclick="app.uploadVideo()">Publish Video</button>
            </div>
        `;
    },

    uploadBook() {
        const title = document.getElementById("bTitle").value;
        const category = document.getElementById("bCat").value;
        const link = document.getElementById("bLink").value;
        if(!title || !link || !category) return this.showToast("Please fill all fields!");

        let books = db.get("books");
        books.push({ id: Date.now(), title, category, link, uploaderId: this.currentUser.id, uploadedBy: this.currentUser.fullName });
        db.set("books", books);
        this.showToast("Book uploaded!");
        this.renderTeacherDash();
    },

    uploadVideo() {
        const title = document.getElementById("vTitle").value;
        const category = document.getElementById("vCat").value;
        let link = document.getElementById("vLink").value;
        if(!title || !link || !category) return this.showToast("Please fill all fields!");

        // Smart YouTube link to Embed URL conversion
        if (link.includes("watch?v=")) {
            let vidId = link.split("v=")[1].split("&")[0];
            link = `https://www.youtube.com/embed/${vidId}`;
        } else if (link.includes("youtu.be/")) {
            let vidId = link.split("youtu.be/")[1].split("?")[0];
            link = `https://www.youtube.com/embed/${vidId}`;
        }

        let videos = db.get("videos");
        videos.push({ id: Date.now(), title, category, link, uploaderId: this.currentUser.id, uploadedBy: this.currentUser.fullName });
        db.set("videos", videos);
        this.showToast("Video published!");
        this.renderTeacherDash();
    },

    renderManageMarks() {
        const students = db.get("users").filter(u => u.role === 'student');
        let options = students.map(s => `<option value="${s.id}">${s.fullName} - ${s.department || 'N/A'} (Roll: ${s.rollNo || 'N/A'})</option>`).join('');

        const allMarks = db.get("marks").filter(m => m.teacherId === this.currentUser.id);
        let history = allMarks.map(m => `
            <div class="list-item">
                <div><strong>${m.studentName}</strong> <br><small>Subject: ${m.subject} | Date: ${new Date(m.date).toLocaleDateString()}</small></div>
                <div style="font-weight:bold; color:var(--primary); font-size: 18px;">${m.score} / ${m.maxScore}</div>
            </div>
        `).join('');

        document.getElementById("main-content").innerHTML = `
            <h2 class="section-title">📝 Grade Students</h2>
            <div class="form-card">
                <div class="form-grid">
                    <select id="markStudentId"><option value="">-- Select Student --</option>${options}</select>
                    <input type="text" id="markSubject" placeholder="Subject / Exam Name">
                    <input type="number" id="markScore" placeholder="Marks Obtained">
                    <input type="number" id="markMax" placeholder="Maximum Marks (e.g. 100)">
                </div>
                <button onclick="app.saveMarks()">Submit Marks</button>
            </div>
            <h2 class="section-title">Recent Grades Assigned</h2>
            <div class="list-group">${history || '<div class="list-item">No marks assigned yet.</div>'}</div>
        `;
    },

    saveMarks() {
        const studentId = parseInt(document.getElementById("markStudentId").value);
        const subject = document.getElementById("markSubject").value;
        const score = document.getElementById("markScore").value;
        const maxScore = document.getElementById("markMax").value;

        if(!studentId || !subject || !score || !maxScore) return this.showToast("Please fill all details!");

        const student = db.get("users").find(u => u.id === studentId);
        let marks = db.get("marks");

        marks.push({
            id: Date.now(), studentId, studentName: student.fullName, teacherId: this.currentUser.id,
            teacherName: this.currentUser.fullName, subject, score, maxScore, date: new Date().toISOString()
        });

        db.set("marks", marks);
        this.showToast(`Marks added for ${student.fullName}!`);
        this.renderManageMarks(); 
    },

    // ==========================================
    // STUDENT FUNCTIONS & MARKS REPORT
    // ==========================================
    renderStudentLibrary() {
        const allBooks = db.get("books");
        const allVideos = db.get("videos");
        const studentDept = this.currentUser.department || ''; 

        const recommendedBooks = allBooks.filter(b => b.category.toLowerCase().includes(studentDept.toLowerCase()));
        const recommendedVideos = allVideos.filter(v => v.category.toLowerCase().includes(studentDept.toLowerCase()));

        let recHtml = '';
        if (studentDept && (recommendedBooks.length > 0 || recommendedVideos.length > 0)) {
            recHtml = `
                <h2 class="section-title">🌟 Recommended For You (${studentDept})</h2>
                <div class="content-grid">
                    ${this.generateBookCards(recommendedBooks)}
                    ${this.generateVideoCards(recommendedVideos)}
                </div><hr style="margin-bottom:30px; border-color: #ddd;">
            `;
        }

        document.getElementById("main-content").innerHTML = `
            ${recHtml}
            <h2 class="section-title">📚 Global Library</h2>
            <div class="content-grid">${this.generateBookCards(allBooks)}</div>
            <h2 class="section-title">🎥 Video Lectures</h2>
            <div class="content-grid">${this.generateVideoCards(allVideos)}</div>
        `;
    },

    generateBookCards(books) {
        if(books.length === 0) return `<p style="color:var(--text-muted);">No books available in this section.</p>`;
        const borrowed = db.get("borrowRecords").filter(b => b.studentId === this.currentUser.id && !b.returned);
        
        return books.map(b => {
            const isBorrowed = borrowed.find(rec => rec.bookId === b.id);
            let btn = `<button class="action-btn btn-primary" onclick="app.borrowBook(${b.id})">Borrow Book</button>`;
            if(isBorrowed) btn = `<button class="action-btn btn-success" onclick="window.open('${b.link}', '_blank')">Read Now</button>`;

            return `
            <div class="item-card">
                <div style="height:120px; background:#4F46E5; display:flex; align-items:center; justify-content:center; color:white; font-size:40px;">📕</div>
                <div class="item-info">
                    <div class="item-category">${b.category}</div>
                    <div class="item-title">${b.title}</div>
                    <div class="item-author">By ${b.uploadedBy}</div>
                </div>
                ${btn}
            </div>`;
        }).join('');
    },

    generateVideoCards(videos) {
        if(videos.length === 0) return `<p style="color:var(--text-muted);">No videos available in this section.</p>`;
        return videos.map(v => `
            <div class="item-card">
                <iframe src="${v.link}" frameborder="0" allowfullscreen></iframe>
                <div class="item-info">
                    <div class="item-category">${v.category}</div>
                    <div class="item-title">${v.title}</div>
                    <div class="item-author">By ${v.uploadedBy}</div>
                </div>
            </div>
        `).join('');
    },

    borrowBook(bookId) {
        let records = db.get("borrowRecords");
        let activeBorrows = records.filter(r => r.studentId === this.currentUser.id && !r.returned);
        if(activeBorrows.length >= 3) return this.showToast("Library Limit reached! Return a book first.");

        let dueDate = new Date(); 
        dueDate.setDate(dueDate.getDate() + 7); // 7-day borrow period

        records.push({ 
            id: Date.now(), bookId, studentId: this.currentUser.id, 
            borrowDate: new Date().toISOString(), dueDate: dueDate.toISOString(), returned: false 
        });
        
        db.set("borrowRecords", records);
        this.showToast("Book borrowed! Added to your shelf.");
        
        // Refresh Current View
        const searchInput = document.getElementById("searchInput");
        if (searchInput) this.renderExplore(searchInput.value); 
        else this.renderStudentLibrary();
    },

    renderMyBooks() {
        const records = db.get("borrowRecords").filter(r => r.studentId === this.currentUser.id && !r.returned);
        const books = db.get("books");

        let rows = records.map(r => {
            let book = books.find(b => b.id === r.bookId);
            if(!book) return ''; // Skip if admin deleted the book
            
            let due = new Date(r.dueDate);
            let today = new Date();
            let fine = 0;
            if (today > due) fine = Math.ceil((today - due) / (1000 * 60 * 60 * 24)) * 5; // $5/day fine

            let fineHTML = fine > 0 ? `<span class="fine-badge">Late Fine: $${fine}</span>` : `<span style="color:var(--success)">On Time</span>`;
            
            return `
            <div class="list-item">
                <div>
                    <strong>📚 ${book.title}</strong><br>
                    <small>Due Date: ${due.toDateString()} | ${fineHTML}</small>
                </div>
                <div>
                    <button class="btn-success action-btn" style="width:auto; padding:8px 15px; margin-right:5px; border-radius:5px;" onclick="window.open('${book.link}', '_blank')">Read</button>
                    <button class="btn-danger action-btn" style="width:auto; padding:8px 15px; border-radius:5px;" onclick="app.returnBook(${r.id})">Return</button>
                </div>
            </div>`;
        }).join('');

        document.getElementById("main-content").innerHTML = `
            <h2 class="section-title">📖 My Borrowed Books</h2>
            <div class="list-group">${rows || '<div class="list-item">You have no active borrowed books.</div>'}</div>
        `;
    },

    returnBook(recordId) {
        let records = db.get("borrowRecords");
        let record = records.find(r => r.id === recordId);
        if(record) {
            record.returned = true; 
            record.returnDate = new Date().toISOString();
            db.set("borrowRecords", records);
            this.showToast("Book returned to library.");
            this.renderMyBooks();
        }
    },

    renderMyMarks() {
        const myMarks = db.get("marks").filter(m => m.studentId === this.currentUser.id);
        
        let html = myMarks.map(m => `
            <div class="list-item">
                <div>
                    <strong>📘 ${m.subject}</strong><br>
                    <small>Teacher: ${m.teacherName} | Date: ${new Date(m.date).toLocaleDateString()}</small>
                </div>
                <div style="font-size: 18px; font-weight: bold; color: var(--primary);">
                    ${m.score} / ${m.maxScore}
                </div>
            </div>
        `).join('');

        document.getElementById("main-content").innerHTML = `
            <h2 class="section-title">📊 My Report Card</h2>
            <div class="list-group">${html || '<div class="list-item">No marks have been uploaded for you yet.</div>'}</div>
        `;
    }
};

// Start App Initialization
window.onload = () => app.init();