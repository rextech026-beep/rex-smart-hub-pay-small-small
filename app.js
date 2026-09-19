/* =========================================================
   REX SMART HUB — PAY SMALL SMALL
   Supabase-powered customer + owner system
   ========================================================= */

const SUPABASE_URL = "https://wmfpgetondvnoeugptoh.supabase.co";
const SUPABASE_KEY = "sb_publishable_hoSilSnRHkgDyuMKM0ryOw_wOYNM3gM";

let sb = null;
let currentUser = null;
let currentRole = null;

/* ---------- Load Supabase ---------- */

function loadSupabase() {
  return new Promise((resolve, reject) => {
    if (window.supabase) {
      sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
    script.onload = () => {
      sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
      resolve();
    };
    script.onerror = () => reject(new Error("Could not load Supabase."));
    document.head.appendChild(script);
  });
}

/* ---------- Basic helpers ---------- */

function money(value) {
  return "₦" + Number(value || 0).toLocaleString("en-NG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
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
      "position:fixed;top:15px;left:50%;transform:translateX(-50%);" +
      "z-index:99999;width:92%;max-width:500px;padding:14px 16px;" +
      "border-radius:12px;background:#111827;color:white;text-align:center;" +
      "font-size:14px;box-shadow:0 8px 30px rgba(0,0,0,.25)";
    document.body.appendChild(box);
  }

  box.textContent = message;

  if (type === "error") {
    box.style.background = "#b91c1c";
  } else if (type === "success") {
    box.style.background = "#15803d";
  } else {
    box.style.background = "#111827";
  }

  clearTimeout(box._timer);
  box._timer = setTimeout(() => box.remove(), 5000);
}

function section(id) {
  return document.getElementById(id);
}

/* ---------- Navigation ---------- */

window.showSection = function(id) {
  document.querySelectorAll("section").forEach(s => {
    s.classList.add("hidden");
    s.style.display = "none";
  });

  const target = section(id);

  if (target) {
    target.classList.remove("hidden");
    target.style.display = "block";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (id === "login") buildLogin();
  if (id === "signup") buildSignup();
  if (id === "ownerLogin") buildOwnerLogin();
};

/* ---------- Create application area ---------- */

function createAppArea() {
  let app = document.getElementById("rexSecureApp");

  if (!app) {
    app = document.createElement("section");
    app.id = "rexSecureApp";
    app.style.display = "none";
    app.innerHTML = `
      <div style="
        max-width:1000px;
        margin:20px auto;
        padding:20px;
      ">
        <div id="rexSecureContent"></div>
      </div>
    `;

    document.body.appendChild(app);
  }

  return app;
}

function openSecureArea(html) {
  const app = createAppArea();

  document.querySelectorAll("section").forEach(s => {
    if (s.id !== "rexSecureApp") s.style.display = "none";
  });

  app.style.display = "block";
  document.getElementById("rexSecureContent").innerHTML = html;

  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ---------- Signup ---------- */

function buildSignup() {
  const old = section("signup");
  if (!old) return;

  const form = section("signupForm");

  if (!form) return;

  form.onsubmit = async function(e) {
    e.preventDefault();

    const name =
      document.getElementById("signupName")?.value.trim() || "";

    const phone =
      document.getElementById("signupPhone")?.value.trim() || "";

    const email =
      document.getElementById("signupEmail")?.value.trim() || "";

    const password =
      document.getElementById("signupPassword")?.value || "";

    const confirm =
      document.getElementById("signupConfirmPassword")?.value ||
      document.getElementById("signupConfirm")?.value ||
      "";

    if (!name || !phone || !email || !password) {
      showMessage("Please fill all required fields.", "error");
      return;
    }

    if (confirm && password !== confirm) {
      showMessage("Passwords do not match.", "error");
      return;
    }

    if (password.length < 8) {
      showMessage("Password must be at least 8 characters.", "error");
      return;
    }

    showMessage("Creating your account...");

    try {
      const { data, error } = await sb.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            "https://rextech026-beep.github.io/rex-smart-hub-pay-small-small/",
          data: {
            full_name: name,
            phone: phone,
            role: "customer"
          }
        }
      });

      if (error) throw error;

      if (!data.user) {
        throw new Error("Account could not be created.");
      }

      /*
        Customer profile is created after email verification/login.
        This avoids putting unverified accounts into the live customer
        records.
      */

      showMessage(
        "Account created. Check your email and confirm your account before logging in.",
        "success"
      );

      setTimeout(() => {
        showSection("login");
      }, 1800);

    } catch (err) {
      showMessage(err.message || "Signup failed.", "error");
    }
  };
}

/* ---------- Login ---------- */

function buildLogin() {
  const old = section("login");
  if (!old) return;

  const form = old.querySelector("form");

  if (!form) return;

  form.onsubmit = async function(e) {
    e.preventDefault();

    const inputs = [...form.querySelectorAll("input")];

    const identifier =
      inputs.find(i =>
        ["email", "text", "tel"].includes(i.type)
      )?.value.trim() || "";

    const password =
      inputs.find(i => i.type === "password")?.value || "";

    if (!identifier || !password) {
      showMessage("Enter your email/phone and password.", "error");
      return;
    }

    /*
      Free Supabase setup:
      Email/password login is enabled.
      Phone password login requires Supabase phone auth/SMS setup.
    */

    if (!identifier.includes("@")) {
      showMessage(
        "Phone login will be added when SMS authentication is enabled. For now, use your registered email.",
        "error"
      );
      return;
    }

    await loginUser(identifier, password, false);
  };
}

/* ---------- Owner Login ---------- */

function buildOwnerLogin() {
  const old = section("ownerLogin");
  if (!old) return;

  const form = old.querySelector("form");

  if (!form) return;

  form.onsubmit = async function(e) {
    e.preventDefault();

    const inputs = [...form.querySelectorAll("input")];

    const email =
      inputs.find(i => i.type === "email" || i.type === "text")
        ?.value.trim() || "";

    const password =
      inputs.find(i => i.type === "password")?.value || "";

    if (!email || !password) {
      showMessage("Enter owner email and password.", "error");
      return;
    }

    await loginUser(email, password, true);
  };
}

/* ---------- Login engine ---------- */

async function loginUser(email, password, ownerLogin) {
  showMessage("Signing in...");

  try {
    const { data, error } =
      await sb.auth.signInWithPassword({
        email,
        password
      });

    if (error) throw error;

    currentUser = data.user;

    /*
      Check whether this user has MFA configured.
    */

    const { data: aalData, error: aalError } =
      await sb.auth.mfa.getAuthenticatorAssuranceLevel();

    if (aalError) throw aalError;

    if (
      aalData &&
      aalData.nextLevel === "aal2" &&
      aalData.currentLevel !== "aal2"
    ) {
      await showMFAChallenge(ownerLogin);
      return;
    }

    await finishLogin(ownerLogin);

  } catch (err) {
    showMessage(err.message || "Login failed.", "error");
  }
}

/* ---------- MFA challenge ---------- */

async function showMFAChallenge(ownerLogin) {
  const { data, error } =
    await sb.auth.mfa.listFactors();

  if (error) {
    showMessage(error.message, "error");
    return;
  }

  const factor =
    data.totp?.find(f => f.status === "verified");

  if (!factor) {
    await finishLogin(ownerLogin);
    return;
  }

  openSecureArea(`
    <div style="
      max-width:430px;
      margin:40px auto;
      background:white;
      padding:25px;
      border-radius:18px;
      box-shadow:0 5px 25px rgba(0,0,0,.12);
    ">
      <h2>🔐 Security Verification</h2>
      <p>Open your authenticator app and enter the 6-digit code.</p>

      <input
        id="mfaCode"
        inputmode="numeric"
        maxlength="6"
        placeholder="6-digit code"
        style="
          width:100%;
          padding:14px;
          margin:15px 0;
          font-size:20px;
          text-align:center;
          box-sizing:border-box;
        "
      >

      <button id="mfaVerifyBtn" style="
        width:100%;
        padding:14px;
        border:0;
        border-radius:10px;
        background:#111827;
        color:white;
        font-size:16px;
      ">
        Verify
      </button>

      <button id="mfaCancelBtn" style="
        width:100%;
        padding:12px;
        margin-top:10px;
        border:0;
        background:#eee;
        border-radius:10px;
      ">
        Cancel
      </button>
    </div>
  `);

  document.getElementById("mfaVerifyBtn").onclick =
    async function() {

      const code =
        document.getElementById("mfaCode").value.trim();

      if (!/^\d{6}$/.test(code)) {
        showMessage("Enter the 6-digit code.", "error");
        return;
      }

      showMessage("Verifying...");

      try {
        const { data: challenge, error: challengeError } =
          await sb.auth.mfa.challenge({
            factorId: factor.id
          });

        if (challengeError) throw challengeError;

        const { error: verifyError } =
          await sb.auth.mfa.verify({
            factorId: factor.id,
            challengeId: challenge.id,
            code
          });

        if (verifyError) throw verifyError;

        await finishLogin(ownerLogin);

      } catch (err) {
        showMessage(
          err.message || "Invalid verification code.",
          "error"
        );
      }
    };

  document.getElementById("mfaCancelBtn").onclick =
    async function() {
      await sb.auth.signOut();
      location.reload();
    };
}

/* ---------- Finish login ---------- */

async function finishLogin(ownerLogin) {
  const { data: userData } = await sb.auth.getUser();

  if (!userData?.user) {
    throw new Error("Session not found.");
  }

  currentUser = userData.user;

  /*
    Get role from secure database.
  */

  const { data: appUser, error } =
    await sb
      .from("app_users")
      .select("id, role")
      .eq("id", currentUser.id)
      .maybeSingle();

  if (error) {
    showMessage(error.message, "error");
    return;
  }

  currentRole = appUser?.role || "customer";

  if (ownerLogin && currentRole !== "owner") {
    await sb.auth.signOut();
    showMessage(
      "This account is not an owner account.",
      "error"
    );
    return;
  }

  if (!ownerLogin && currentRole === "owner") {
    await sb.auth.signOut();
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

/* ---------- Customer profile ---------- */

async function ensureCustomerProfile() {
  if (!currentUser) return;

  const { data: existing, error } =
    await sb
      .from("customer_accounts")
      .select("*")
      .eq("user_id", currentUser.id)
      .maybeSingle();

  if (error) {
    console.error(error);
    return;
  }

  if (existing) return;

  const meta = currentUser.user_metadata || {};

  await sb.from("customer_accounts").insert({
    user_id: currentUser.id,
    full_name: meta.full_name || "",
    phone_text: meta.phone || "",
    email: currentUser.email || ""
  });
}

/* ---------- Customer dashboard ---------- */

async function showCustomerDashboard() {
  await ensureCustomerProfile();

  const { data: customer, error } =
    await sb
      .from("customer_accounts")
      .select("*")
      .eq("user_id", currentUser.id)
      .single();

  if (error) {
    showMessage(error.message, "error");
    return;
  }

  const { data: agreements, error: agreementError } =
    await sb
      .from("installment_agreements")
      .select("*")
      .eq("customer_id", customer.id)
      .order("created_at", { ascending
