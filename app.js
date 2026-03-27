import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
    getAuth,
    onAuthStateChanged,
    signOut,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
    getDatabase,
    ref,
    set,
    push,
    onValue,
    remove,
    update
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyBVdD1gMHn6nwyIovzi4kvRj5thAv2-G4g",
    authDomain: "e-commerce-22fa7.firebaseapp.com",
    projectId: "e-commerce-22fa7",
    rDatabaseUrl: "https://e-commerce-22fa7-default-rtdb.firebaseio.com/",
    storageBucket: "e-commerce-22fa7.firebasestorage.app",
    messagingSenderId: "1029239721435",
    appId: "1:1029239721435:web:a41ddd43ed5fde8e43ebfe",
    measurementId: "G-TTVCC1RVWP"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const provider = new GoogleAuthProvider();
const productsRef = ref(db, 'products/');

onAuthStateChanged(auth, (user) => {
    const loginLink = document.getElementById('login-link');
    const dashLink = document.getElementById('dash-link');
    const userDisp = document.getElementById('user-display');
    const logoutBtn = document.getElementById('logout-btn');

    if (user) {
        if (loginLink) loginLink.style.display = "none";
        if (dashLink) dashLink.style.display = "inline";
        if (logoutBtn) logoutBtn.style.display = "inline";
        if (userDisp) userDisp.innerText = "Hi, " + user.email.split('@')[0];
    } else {
        if (loginLink) loginLink.style.display = "inline";
        if (dashLink) dashLink.style.display = "none";
        if (logoutBtn) logoutBtn.style.display = "none";
        if (userDisp) userDisp.innerText = "";
    }
});

onValue(productsRef, (snap) => {
    if (!snap.exists()) {
        const defaultCaps = [
            { name: "Nike White Classic", price: "400", img: "https://images.unsplash.com/photo-1521335629791-ce4aec67dd15?w=500" },
            { name: "Adidas Running", price: "350", img: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=500" },
            { name: "Puma Sport", price: "300", img: "https://images.unsplash.com/photo-1534215754734-18e55d13e346?w=500" },
            { name: "NY Baseball", price: "250", img: "https://images.unsplash.com/photo-1556306535-0f09a537f0a3?w=500" }
        ];
        defaultCaps.forEach(cap => push(productsRef, cap));
    }
}, { onlyOnce: true });

const productList = document.getElementById('product-list');
if (productList) {
    onValue(productsRef, (snapshot) => {
        productList.innerHTML = "";
        snapshot.forEach((child) => {
            const data = child.val();
            const id = child.key;
            productList.innerHTML += `
                <div class="card" data-aos="zoom-in">
                    <img src="${data.img}" alt="Cap">
                    <div class="card-body">
                        <h3>${data.name}</h3>
                        <span class="price">$${data.price}</span>
                        <button class="buy-btn" onclick="buyNow('${data.name}', '${data.img}')">Buy Now</button>
                        <div class="admin-btns" id="admin-ctrl-${id}" style="display:none;">
                            <button class="edit-btn" onclick="editProduct('${id}', '${data.name}', '${data.price}', '${data.img}')">Edit</button>
                            <button class="delete-btn" onclick="deleteProduct('${id}')">Delete</button>
                        </div>
                    </div>
                </div>`;

            onAuthStateChanged(auth, user => {
                if (user) {
                    const ctrl = document.getElementById(`admin-ctrl-${id}`);
                    if (ctrl) ctrl.style.display = 'flex';
                }
            });
        });
    });
}

window.buyNow = (name, imgURL) => {
    if (!auth.currentUser) {
        alert("Login First!");
        window.location.href = "auth.html";
        return;
    }
    set(push(ref(db, 'orders/')), {
        productName: name,
        productImgURL: imgURL,
        buyerEmail: auth.currentUser.email,
        timestamp: new Date().toLocaleString()
    }).then(() => alert("Order Placed Successfully!"));
};

window.deleteProduct = (id) => {
    if (confirm("Confirm deletion?")) {
        remove(ref(db, 'products/' + id));
    }
};

window.editProduct = (id, name, price, img) => {
    localStorage.setItem("editData", JSON.stringify({ id, name, price, img }));
    window.location.href = "dashboard.html";
};

const addBtn = document.getElementById('add-p-btn');
if (addBtn) {
    const editData = JSON.parse(localStorage.getItem("editData"));

    if (editData) {
        document.getElementById('p-name').value = editData.name;
        document.getElementById('p-price').value = editData.price;
        document.getElementById('p-img').value = editData.img;
        addBtn.innerText = "Update Product Info";
    }

    addBtn.onclick = () => {
        const name = document.getElementById('p-name').value;
        const price = document.getElementById('p-price').value;
        const img = document.getElementById('p-img').value;

        if (!name || !price || !img) {
            alert("Please fill all fields!");
            return;
        }

        if (editData) {
            update(ref(db, 'products/' + editData.id), { name, price, img }).then(() => {
                localStorage.removeItem("editData");
                window.location.href = "index.html";
            });
        } else {
            push(productsRef, { name, price, img }).then(() => {
                window.location.href = "index.html";
            });
        }
    };
}

const mainAuthBtn = document.getElementById('main-btn');
if (mainAuthBtn) {
    mainAuthBtn.onclick = () => {
        const email = document.getElementById('email').value;
        const pass = document.getElementById('password').value;
        const mode = document.getElementById('auth-title').innerText;

        if (!email || !pass) {
            alert("Please fill all fields!");
            return;
        }

        if (mode === "Login") {
            signInWithEmailAndPassword(auth, email, pass)
                .then(() => window.location.href = "index.html")
                .catch(err => alert("Error: " + err.message));
        } else {
            createUserWithEmailAndPassword(auth, email, pass)
                .then(() => window.location.href = "index.html")
                .catch(err => alert("Error: " + err.message));
        }
    };
}

const googleBtn = document.getElementById('google-btn');
if (googleBtn) {
    googleBtn.onclick = () => {
        signInWithPopup(auth, provider)
            .then(() => window.location.href = "index.html")
            .catch(err => alert("Google Error: " + err.message));
    };
}

const contactBtn = document.getElementById('send-msg-btn');
if (contactBtn) {
    contactBtn.onclick = () => {
        const name = document.getElementById('c-name').value;
        const email = document.getElementById('c-email').value;
        const msg = document.getElementById('c-msg').value;

        if (!name || !email || !msg) {
            alert("Please fill all fields!");
            return;
        }

        push(ref(db, 'messages/'), {
            name,
            email,
            msg,
            date: new Date().toLocaleString()
        }).then(() => {
            alert("Message Sent!");
            location.reload();
        });
    };
}

const logoutAction = document.getElementById('logout-btn');
if (logoutAction) {
    logoutAction.onclick = () => {
        signOut(auth).then(() => location.reload());
    };
}

const menuBtn = document.getElementById('menu-btn');
const navLinks = document.getElementById('nav-links');

if (menuBtn) {
    menuBtn.onclick = () => {
        navLinks.classList.toggle('active');
        const icon = menuBtn.querySelector('i');
        if (navLinks.classList.contains('active')) {
            icon.classList.replace('fa-bars', 'fa-times');
        } else {
            icon.classList.replace('fa-times', 'fa-bars');
        }
    };
}