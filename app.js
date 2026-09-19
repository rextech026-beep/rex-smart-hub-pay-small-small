/* =========================================================
   REX SMART HUB — PAY SMALL SMALL
   Supabase Customer + Owner Payment System
   ========================================================= */

const SUPABASE_URL = "https://wmfpgetondvnoeugptoh.supabase.co";
const SUPABASE_KEY = "sb_publishable_hoSilSnRHkgDyuMKM0ryOw_wOYNM3gM";

let sb = null;
let currentUser = null;
let currentRole = null;

/* ---------- BASIC HELPERS ---------- */

function money(value) {
  return "₦" + Number(value || 0).toLocaleString("en-NG");
}

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function showMessage(message, type = "info") {
  let box = document.getElementById("rexMessage");

  if (!box) {
    box = document.createElement("div");
    box.id = "rexMessage";
    box.style.cssText =
      "position:fixed;top:15px;left:50%;transform:translateX(-50%);z-index:9999;width:90%;max-width:500px;padding:14px;border-radius:10px;text-align:center;font-weight:600;background:#111;color:white;";
    document.body.appendChild(box);
  }

  box.textContent = message;

  if (type === "error") box.style.background = "#b91c1c";
  else if (type === "success") box.style.background = "#15803d";
  else box.style.background = "#111";

  setTimeout(() => {
    if (box) box.remove();
  }, 5000);
}

/* ---------- SUPABASE ---------- */

function loadSupabase() {
  return new Promise((resolve, reject) => {
    if (window.supabase) {
      sb = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
      );
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src =
      "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";

    script.onload = () => {
      sb = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
      );
      resolve();
    };

    script.onerror = () => {
      reject(new Error("Could not load Supabase."));
    };

    document.head.appendChild(script);
  });
}

/* ---------- SECTION HANDLING ---------- */

function getSection(id) {
  return document.getElementById(id);
}

window.showSection = function (id) {
  document.querySelectorAll("section").forEach(section => {
    section.style.display = "none";
  });

  let target = getSection(id);

  if (!target) {
    target = document.createElement("section");
    target.id = id;
    target.style.padding = "25px";
    target.style.maxWidth = "900px";
    target.style.margin = "auto";
    document.body.appendChild(target);
  }

  target.style.display = "block";

  if (id === "login") buildLogin();
  if (id === "signup") buildSignup();
  if (id === "ownerLogin") buildOwnerLogin();

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
};

/* ---------- COMMON UI ---------- */

function card(content) {
  return `
    <div style="
      background:white;
      border-radius:15px;
      padding:20px;
      margin:15px 0;
      box-shadow:0 3px 15px rgba(0,0,0,.08);
    ">
      ${content}
    </div>
  `;
}

function input(id, label, type = "text", placeholder = "") {
  return `
    <label style="display:block;margin:12px 0 5px;font-weight:600;">
      ${esc(label)}
    </label>
    <input
      id="${id}"
      type="${type}"
      placeholder="${esc(placeholder)}"
      style="
        width:100%;
        box-sizing:border-box;
        padding:13px;
        border:1px solid #ccc;
        border-radius:8px;
        font-size:16px;
      "
    >
  `;
}

function button(text, onclick) {
  return `
    <button
      onclick="${onclick}"
      style="
        border:0;
        border-radius:8px;
        padding:13px 18px;
        margin:5px;
        background:#111827;
        color:white;
        font-weight:700;
        font-size:15px;
      "
    >
      ${esc(text)}
    </button>
  `;
}

/* ---------- SIGN UP ---------- */

function buildSignup() {
  const section = getSection("signup");
  if (!section) return;

  section.innerHTML = `
    ${card(`
      <h2>Create Customer Account</h2>
      <p>Create your REX SMART HUB Pay Small Small account.</p>

      ${input("signupName","Full Name","text","Your full name")}
      ${input("signupPhone","Phone Number","tel","080xxxxxxxx")}
      ${input("signupEmail","Email","email","you@example.com")}
      ${input("signupAddress","Address","text","Your address")}
      ${input("signupPassword","Password","password","Create password")}
      ${input("signupConfirm","Confirm Password","password","Repeat password")}

      <div style="margin-top:18px;">
        ${button("Create Account","signupCustomer()")}
        ${button("Back to Login","showSection('login')")}
      </div>

      <p style="font-size:13px;margin-top:15px;">
        You will need to confirm your email if email confirmation is enabled.
      </p>
    `)}
  `;
}

window.signupCustomer = async function () {
  try {
    const name = document.getElementById("signupName").value.trim();
    const phone = document.getElementById("signupPhone").value.trim();
    const email = document.getElementById("signupEmail").value.trim();
    const address = document.getElementById("signupAddress").value.trim();
    const password = document.getElementById("signupPassword").value;
    const confirm = document.getElementById("signupConfirm").value;

    if (!name || !phone || !email || !password) {
      showMessage("Please fill all required fields.", "error");
      return;
    }

    if (password !== confirm) {
      showMessage("Passwords do not match.", "error");
      return;
    }

    const { data, error } = await sb.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          phone: phone,
          address: address
        }
      }
    });

    if (error) {
      showMessage(error.message, "error");
      return;
    }

    if (data.user) {
      showMessage(
        "Account created. Check your email to confirm your account.",
        "success"
      );

      setTimeout(() => {
        showSection("login");
      }, 1500);
    }
  } catch (error) {
    showMessage(error.message, "error");
  }
};

/* ---------- LOGIN ---------- */

function buildLogin() {
  const section = getSection("login");
  if (!section) return;

  section.innerHTML = `
    ${card(`
      <h2>Customer Login</h2>

      ${input("loginEmail","Email","email","you@example.com")}
      ${input("loginPassword","Password","password","Your password")}

      <div style="margin-top:18px;">
        ${button("Login","customerLogin()")}
        ${button("Create Account","showSection('signup')")}
      </div>

      <p style="margin-top:15px;font-size:13px;">
        Owner? Use Owner Login.
      </p>
    `)}
  `;
}

window.customerLogin = async function () {
  try {
    const email =
      document.getElementById("loginEmail").value.trim();

    const password =
      document.getElementById("loginPassword").value;

    if (!email || !password) {
      showMessage("Enter your email and password.", "error");
      return;
    }

    const { data, error } =
      await sb.auth.signInWithPassword({
        email,
        password
      });

    if (error) {
      showMessage(error.message, "error");
      return;
    }

    currentUser = data.user;

    await finishLogin(false);
  } catch (error) {
    showMessage(error.message, "error");
  }
};

/* ---------- OWNER LOGIN ---------- */

function buildOwnerLogin() {
  const section = getSection("ownerLogin");
  if (!section) return;

  section.innerHTML = `
    ${card(`
      <h2>Owner Login</h2>
      <p>Private REX SMART HUB owner area.</p>

      ${input("ownerEmail","Owner Email","email","Owner email")}
      ${input("ownerPassword","Password","password","Owner password")}

      <div style="margin-top:18px;">
        ${button("Owner Login","ownerLogin()")}
        ${button("Back","showSection('login')")}
      </div>
    `)}
  `;
}

window.ownerLogin = async function () {
  try {
    const email =
      document.getElementById("ownerEmail").value.trim();

    const password =
      document.getElementById("ownerPassword").value;

    if (!email || !password) {
      showMessage("Enter owner email and password.", "error");
      return;
    }

    const { data, error } =
      await sb.auth.signInWithPassword({
        email,
        password
      });

    if (error) {
      showMessage(error.message, "error");
      return;
    }

    currentUser = data.user;

    await finishLogin(true);
  } catch (error) {
    showMessage(error.message, "error");
  }
};

/* ---------- LOGIN ROLE CHECK ---------- */

async function finishLogin(ownerLogin) {
  const { data: appUser, error } = await sb
    .from("app_users")
    .select("role")
    .eq("id", currentUser.id)
    .maybeSingle();

  if (error) {
    showMessage(error.message, "error");
    return;
  }

  currentRole = appUser?.role || "customer";

  if (ownerLogin && currentRole !== "owner") {
    await sb.auth.signOut();
    currentUser = null;

    showMessage(
      "This account is not an owner account.",
      "error"
    );

    return;
  }

  if (!ownerLogin && currentRole === "owner") {
    await sb.auth.signOut();
    currentUser = null;

    showMessage(
      "Owner account detected. Use Owner Login.",
      "error"
    );

    return;
  }

  if (currentRole === "owner") {
    await showOwnerDashboard();
  } else {
    await ensureCustomerProfile();
    await showCustomerDashboard();
  }
}

/* ---------- CUSTOMER PROFILE ---------- */

async function ensureCustomerProfile() {
  if (!currentUser) return;

  const { data: existing, error } = await sb
    .from("customer_accounts")
    .select("*")
    .eq("user_id", currentUser.id)
    .maybeSingle();

  if (error) {
    showMessage(error.message, "error");
    return;
  }

  if (existing) return;

  const metadata = currentUser.user_metadata || {};

  const { error: insertError } =
    await sb.from("customer_accounts").insert({
      user_id: currentUser.id,
      full_name: metadata.full_name || "",
      phone_text: metadata.phone || "",
      email: currentUser.email || "",
      address_text: metadata.address || ""
    });

  if (insertError) {
    showMessage(insertError.message, "error");
  }
}

/* ---------- CUSTOMER DASHBOARD ---------- */

async function showCustomerDashboard() {
  const { data: customer, error: customerError } =
    await sb
      .from("customer_accounts")
      .select("*")
      .eq("user_id", currentUser.id)
      .maybeSingle();

  if (customerError) {
    showMessage(customerError.message, "error");
    return;
  }

  if (!customer) {
    showMessage("Customer profile not found.", "error");
    return;
  }

  const {
    data: agreements,
    error: agreementError
  } = await sb
    .from("installment_agreements")
    .select("*")
    .eq("customer_id", customer.id)
    .order("created_at", { ascending: true });

  if (agreementError) {
    showMessage(agreementError.message, "error");
    return;
  }

  const ids = (agreements || []).map(a => a.id);

  let payments = [];

  if (ids.length) {
    const { data, error } = await sb
      .from("installment_payments")
      .select("*")
      .in("agreement_id", ids)
      .order("payment_date", { ascending: false });

    if (error) {
      showMessage(error.message, "error");
      return;
    }

    payments = data || [];
  }

  let html = `
    <div style="max-width:900px;margin:auto;padding:20px;">
      <h1>Welcome, ${esc(customer.full_name)}</h1>

      <p>
        REX SMART HUB — PAY SMALL SMALL
      </p>

      ${button("Refresh","showCustomerDashboard()")}
      ${button("Logout","rexLogout()")}
  `;

  if (!agreements || agreements.length === 0) {
    html += card(`
      <h3>No active payment plan</h3>
      <p>Your payment arrangement will appear here when it is created.</p>
    `);
  }

  for (const agreement of agreements || []) {
    const total = Number(agreement.total_price || 0);

    const paid = payments
      .filter(p => p.agreement_id === agreement.id)
      .reduce(
        (sum, p) => sum + Number(p.amount || 0),
        0
      );

    const balance = Math.max(total - paid, 0);

    const progress =
      total > 0
        ? Math.min(100, Math.round((paid / total) * 100))
        : 0;

    const image =
      /^https?:\/\//i.test(agreement.product_image || "")
        ? agreement.product_image
        : "";

    html += card(`
      ${
        image
          ? `<img src="${esc(image)}"
               style="width:100%;max-height:250px;object-fit:contain;border-radius:10px;">`
          : ""
      }

      <h2>${esc(agreement.product_name)}</h2>

      <p><strong>Total Price:</strong> ${money(total)}</p>

      <p><strong>Amount Paid:</strong> ${money(paid)}</p>

      <p><strong>Balance:</strong> ${money(balance)}</p>

      <p>
        <strong>Installment:</strong>
        ${money(agreement.installment_amount)}
        ${esc(agreement.installment_frequency || "")}
      </p>

      <p>
        <strong>Start Date:</strong>
        ${esc(agreement.start_date || "")}
      </p>

      <div style="
        width:100%;
        height:18px;
        background:#ddd;
        border-radius:20px;
        overflow:hidden;
        margin:15px 0;
      ">
        <div style="
          width:${progress}%;
          height:100%;
          background:#16a34a;
        "></div>
      </div>

      <strong>${progress}% Paid</strong>

      ${
        balance <= 0
          ? `<p style="color:#15803d;font-weight:800;">
               FULLY PAID — ITEM CAN BE RELEASED
             </p>`
          : ""
      }

      <hr>

      <h3>Payment Account</h3>

      <p>
        <strong>Bank:</strong>
        ${esc(agreement.payment_bank || "")}
      </p>

      <p>
        <strong>Account Name:</strong>
        ${esc(agreement.payment_account_name || "")}
      </p>

      <p>
        <strong>Account Number:</strong>
        ${esc(agreement.payment_account_number || "")}
      </p>

      ${
        agreement.notes
          ? `<p><strong>Note:</strong> ${esc(agreement.notes)}</p>`
          : ""
      }

      <h3>Payment History</h3>

      ${
        payments.filter(p => p.agreement_id === agreement.id).length
          ? payments
              .filter(p => p.agreement_id === agreement.id)
              .map(p => `
                <div style="
                  padding:10px;
                  border-bottom:1px solid #ddd;
                ">
                  ${money(p.amount)}
                  — ${esc(p.payment_date || "")}
                  ${
                    p.note
                      ? `<br><small>${esc(p.note)}</small>`
                      : ""
                  }
                </div>
              `)
              .join("")
          : "<p>No payments recorded yet.</p>"
      }
    `);
  }

  html += `</div>`;

  let section = getSection("customerDashboard");

  if (!section) {
    section = document.createElement("section");
    section.id = "customerDashboard";
    document.body.appendChild(section);
  }

  section.innerHTML = html;

  showSection("customerDashboard");
}

/* ---------- OWNER DASHBOARD ---------- */

async function showOwnerDashboard() {
  const { data: customers, error } = await sb
    .from("customer_accounts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    showMessage(error.message, "error");
    return;
  }

  let section = getSection("ownerDashboard");

  if (!section) {
    section = document.createElement("section");
    section.id = "ownerDashboard";
    document.body.appendChild(section);
  }

  section.innerHTML = `
    <div style="max-width:1000px;margin:auto;padding:20px;">

      <h1>REX SMART HUB</h1>
      <h2>Owner Dashboard</h2>

      <p>Manage customers, payment plans and payments.</p>

      ${button("Refresh","showOwnerDashboard()")}
      ${button("Add Customer","showAddCustomerForm()")}
      ${button("Logout","rexLogout()")}

      <div id="ownerCustomerList">
        ${
          customers && customers.length
            ? customers.map(c => `
              ${card(`
                <h3>${esc(c.full_name)}</h3>

                <p>
                  <strong>Phone:</strong>
                  ${esc(c.phone_text)}
                </p>

                <p>
                  <strong>Email:</strong>
                  ${esc(c.email)}
                </p>

                ${button(
                  "View Customer",
                  `viewCustomer('${c.id}')`
                )}
              `)}
            `).join("")
            : card(`
              <p>No customers yet.</p>
            `)
        }
      </div>

      <div id="ownerFormArea"></div>
    </div>
  `;

  showSection("ownerDashboard");
}

/* ---------- ADD CUSTOMER ---------- */

window.showAddCustomerForm = function () {
  const area = document.getElementById("ownerFormArea");

  if (!area) return;

  area.innerHTML = card(`
    <h2>Create Payment Plan</h2>

    ${input("newCustomerName","Customer Name")}
    ${input("newCustomerPhone","Customer Phone","tel")}
    ${input("newCustomerEmail","Customer Email","email")}
    ${input("newCustomerAddress","Customer Address")}

    ${input("productName","Product Name")}
    ${input("productImage","Product Image URL")}
    ${input("totalPrice","Total Price","number")}
    ${input("installmentAmount","Installment Amount","number")}
    ${input("installmentFrequency","Installment Frequency","text","Weekly / Monthly")}

    ${input("startDate","Start Date","date")}

    ${input("paymentBank","Payment Bank")}
    ${input("paymentAccountName","Account Name")}
    ${input("paymentAccountNumber","Account Number")}
    ${input("agreementNotes","Notes")}

    ${button("Save Customer & Plan","saveCustomerPlan()")}
  `);
};

/* ---------- SAVE CUSTOMER + PLAN ---------- */

window.saveCustomerPlan = async function () {
  try {
    const name =
      document.getElementById("newCustomerName").value.trim();

    const phone =
      document.getElementById("newCustomerPhone").value.trim();

    const email =
      document.getElementById("newCustomerEmail").value.trim();

    const address =
      document.getElementById("newCustomerAddress").value.trim();

    const product =
      document.getElementById("productName").value.trim();

    const image =
      document.getElementById("productImage").value.trim();

    const total =
      Number(document.getElementById("totalPrice").value);

    const installment =
      Number(document.getElementById("installmentAmount").value);

    const frequency =
      document.getElementById("installmentFrequency").value.trim();

    const startDate =
      document.getElementById("startDate").value;

    const bank =
      document.getElementById("paymentBank").value.trim();

    const accountName =
      document.getElementById("paymentAccountName").value.trim();

    const accountNumber =
      document.getElementById("paymentAccountNumber").value.trim();

    const notes =
      document.getElementById("agreementNotes").value.trim();

    if (!name || !phone || !product || !total) {
      showMessage(
        "Customer name, phone, product and total price are required.",
        "error"
      );
      return;
    }

    const { data: customer, error: customerError } =
      await sb
        .from("customer_accounts")
        .insert({
          full_name: name,
          phone_text: phone,
          email: email,
          address_text: address
        })
        .select()
        .single();

    if (customerError) {
      showMessage(customerError.message, "error");
      return;
    }

    const { error: agreementError } =
      await sb
        .from("installment_agreements")
        .insert({
          customer_id: customer.id,
          product_name: product,
          product_image: image,
          total_price: total,
          installment_amount: installment,
          installment_frequency: frequency,
          start_date: startDate || null,
          payment_bank: bank,
          payment_account_name: accountName,
          payment_account_number: accountNumber,
          notes: notes
        });

    if (agreementError) {
      showMessage(agreementError.message, "error");
      return;
    }

    showMessage(
      "Customer and payment plan saved successfully.",
      "success"
    );

    await showOwnerDashboard();

  } catch (error) {
    showMessage(error.message, "error");
  }
};

/* ---------- VIEW CUSTOMER ---------- */

window.viewCustomer = async function (customerId) {
  const { data: customer, error } = await sb
    .from("customer_accounts")
    .select("*")
    .eq("id", customerId)
    .single();

  if (error) {
    showMessage(error.message, "error");
    return;
  }

  const { data: agreements } = await sb
    .from("installment_agreements")
    .select("*")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  const section = getSection("ownerDashboard");

  if (!section) return;

  section.innerHTML = `
    <div style="max-width:1000px;margin:auto;padding:20px;">

      ${button("Back","showOwnerDashboard()")}

      <h2>${esc(customer.full_name)}</h2>

      <p>
        <strong>Phone:</strong>
        ${esc(customer.phone_text)}
      </p>

      <p>
        <strong>Email:</strong>
        ${esc(customer.email)}
      </p>

      ${
        agreements && agreements.length
          ? agreements.map(a => `
            ${card(`
              <h3>${esc(a.product_name)}</h3>

              <p>
                Total:
                <strong>${money(a.total_price)}</strong>
              </p>

              <p>
                Installment:
                ${money(a.installment_amount)}
                ${esc(a.installment_frequency)}
              </p>

              ${button(
                "Record Payment",
                `recordPayment('${a.id}')`
              )}

              ${button(
                "View Payments",
                `viewPayments('${a.id}')`
              )}
            `)}
          `).join("")
          : card("<p>No payment plan found.</p>")
      }

    </div>
  `;

  showSection("ownerDashboard");
};

/* ---------- RECORD PAYMENT ---------- */

window.recordPayment = async function (agreementId) {
  const amount = prompt("Enter payment amount:");

  if (!amount) return;

  const numericAmount = Number(amount);

  if (!numericAmount || numericAmount <= 0) {
    showMessage("Enter a valid payment amount.", "error");
    return;
  }

  const note =
    prompt("Payment note (optional):") || "";

  const { error } = await sb
    .from("installment_payments")
    .insert({
      agreement_id: agreementId,
      amount: numericAmount,
      payment_date:
        new Date().toISOString().slice(0, 10),
      note
    });

  if (error) {
    showMessage(error.message, "error");
    return;
  }

  showMessage(
    "Payment recorded successfully.",
    "success"
  );

  await showOwnerDashboard();
};

/* ---------- VIEW PAYMENTS ---------- */

window.viewPayments = async function (agreementId) {
  const { data, error } = await sb
    .from("installment_payments")
    .select("*")
    .eq("agreement_id", agreementId)
    .order("payment_date", { ascending: false });

  if (error) {
    showMessage(error.message, "error");
    return;
  }

  let text = "PAYMENT HISTORY\n\n";

  if (!data || !data.length) {
    text += "No payments recorded.";
  } else {
    data.forEach((p, index) => {
      text +=
        `${index + 1}. ${money(p.amount)} — ${p.payment_date}` +
        (p.note ? ` — ${p.note}` : "") +
        "\n";
    });
  }

  alert(text);
};

/* ---------- LOGOUT ---------- */

window.rexLogout = async function () {
  if (sb) {
    await sb.auth.signOut();
  }

  currentUser = null;
  currentRole = null;

  location.reload();
};

/* ---------- START APPLICATION ---------- */

async function startRexApp() {
  try {
    await loadSupabase();
    console.log("REX SMART HUB connected to Supabase.");
  } catch (error) {
    console.error(error);
    showMessage(
      "Unable to connect to the payment system.",
      "error"
    );
  }
}

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    startRexApp
  );
} else {
  startRexApp();
}
