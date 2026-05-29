# ניצוץ — Deploy Guide (First Dollar Sprint)

**Estimated time: 3–4 hours for Itay to complete everything below.**
**Cost: $0/month until ~10,000 active users (free tiers cover it all).**

---

## STEP 1 — Firebase Setup (30 min)

### 1.1 Create Firebase Project
1. Go to https://console.firebase.google.com
2. Click "Add project" → name it `nitzutz`
3. Disable Google Analytics (for now — Ruti's legal advice)

### 1.2 Enable Authentication
1. Firebase Console → Authentication → Get started
2. Sign-in method → Google → Enable
3. Add your domain to "Authorized domains" (add `nitzutz.co.il` when you have it)

### 1.3 Enable Firestore
1. Firebase Console → Firestore Database → Create database
2. **Start in production mode** (not test mode)
3. Choose region: `europe-west3` (Frankfurt — closest to Israel)

### 1.4 Deploy Firestore Security Rules
```bash
npm install -g firebase-tools
firebase login
firebase use --add   # select your nitzutz project
firebase deploy --only firestore:rules
```

### 1.5 Get Web App Config
1. Firebase Console → Project Settings → Your apps → Add app (Web)
2. Copy the config object
3. Create `frontend/.env.local` from `frontend/.env.example`, paste the values

### 1.6 Get Service Account Key (for backend)
1. Firebase Console → Project Settings → Service accounts
2. "Generate new private key" → download JSON
3. Save as `backend/serviceAccountKey.json`
4. **NEVER commit this file to git** (it's in .gitignore)

---

## STEP 2 — Stripe Setup (20 min)

### 2.1 Create Stripe Account
1. Go to https://stripe.com → Sign up
2. Complete identity verification (required for payouts)
3. Switch to Live mode when ready (stay in Test mode for now)

### 2.2 Create Products
1. Stripe Dashboard → Products → Add product
2. **Product 1:** "ניצוץ פרמיום — חודשי"
   - Price: ₪29.00 ILS / month (recurring)
   - Save → copy Price ID
3. **Product 2:** "ניצוץ פרמיום — שנתי"
   - Price: ₪249.00 ILS / year (recurring)
   - Save → copy Price ID

### 2.3 Create Payment Links
1. Stripe Dashboard → Payment Links → New
2. Add product → Monthly → set success URL:
   `https://nitzutz.co.il/?session_id={CHECKOUT_SESSION_ID}`
3. Copy the Payment Link URL → paste into `frontend/.env.local` as `VITE_STRIPE_MONTHLY_LINK`
4. Repeat for Annual plan
5. Add to `backend/.env`: `STRIPE_SECRET_KEY=sk_live_...`

### 2.4 Set Up Webhook (for auto-downgrade on cancellation)
1. Stripe Dashboard → Developers → Webhooks → Add endpoint
2. URL: `https://YOUR_CLOUD_RUN_URL/payment/webhook`
3. Events: `checkout.session.completed`, `customer.subscription.deleted`
4. Copy Signing secret → add to `backend/.env` as `STRIPE_WEBHOOK_SECRET`

---

## STEP 3 — Deploy Backend to Cloud Run (45 min)

### 3.1 Install Google Cloud CLI
```bash
brew install google-cloud-sdk
gcloud init
gcloud auth configure-docker
```

### 3.2 Create GCP Project
```bash
gcloud projects create nitzutz-backend --name="Nitzutz Backend"
gcloud config set project nitzutz-backend
gcloud services enable run.googleapis.com containerregistry.googleapis.com
```

### 3.3 Build and Push Container
```bash
# From project root
docker build -t gcr.io/nitzutz-backend/api:latest .
docker push gcr.io/nitzutz-backend/api:latest
```

### 3.4 Deploy to Cloud Run
```bash
gcloud run deploy nitzutz-api \
  --image gcr.io/nitzutz-backend/api:latest \
  --region europe-west1 \
  --allow-unauthenticated \
  --set-env-vars "GOOGLE_API_KEY=YOUR_KEY,FRONTEND_URL=https://nitzutz.web.app" \
  --set-secrets "FIREBASE_SERVICE_ACCOUNT_KEY=firebase-key:latest,STRIPE_SECRET_KEY=stripe-key:latest"
```

### 3.5 Add Secrets to Secret Manager
```bash
# Add Firebase service account key
gcloud secrets create firebase-key --data-file=backend/serviceAccountKey.json

# Add Stripe key  
echo -n "sk_live_..." | gcloud secrets create stripe-key --data-file=-
```

### 3.6 Get your Cloud Run URL
```bash
gcloud run services describe nitzutz-api --region europe-west1 --format='value(status.url)'
```
→ Copy this URL → add to `frontend/.env.local` as `VITE_API_URL`

---

## STEP 4 — Deploy Frontend to Firebase Hosting (15 min)

### 4.1 Build
```bash
cd frontend
cp .env.example .env.local   # fill in all values first!
npm run build
```

### 4.2 Deploy
```bash
firebase deploy --only hosting
```

Your app is live at: `https://nitzutz-PROJECT_ID.web.app`

### 4.3 Custom Domain (optional but recommended)
1. Firebase Console → Hosting → Add custom domain
2. Add `nitzutz.co.il`
3. Follow DNS verification steps (2–24 hours propagation)

---

## STEP 5 — Test the first payment (10 min)

1. Open the app → sign in with Google → create a child profile
2. Create 10 things → paywall should appear
3. Click "₪249/שנה" → should open Stripe checkout
4. Use Stripe test card: `4242 4242 4242 4242` exp `12/34` cvv `123`
5. Complete payment → should redirect back to app
6. App should show "ברוך הבא לניצוץ פרמיום! 🌟"
7. Try creating more things → should work without limit

**🎉 If step 6 works, you just received your first (test) dollar.**

Switch Stripe to Live mode for real payments.

---

## STEP 6 — Soft launch (day 2)

1. Post in 3 Israeli parenting Facebook groups:
   > "היי, אני אבא ומתכנת. בניתי אפליקציה עם AI שעוזרת לילדים בגיל 3-5 ליצור ציורים, סיפורים ושירים בעברית — ולכל ילד יש דמות AI שמכירה אותו. מחפש 50 משפחות לנסות חינם. 10 יצירות חינם, ללא כרטיס אשראי: [link]"

2. Open the Sparkids WhatsApp group → invite first 10 families

3. Watch the analytics in Firebase Console → Firestore → see new users appear

---

## What you'll need (checklist before posting)

- [ ] Firebase project created + rules deployed
- [ ] Stripe account verified + products created + payment links working
- [ ] Cloud Run URL working (hit `/health` → returns `{"status":"ok"}`)
- [ ] Frontend deployed + custom domain (or .web.app URL)
- [ ] Test payment flow works end-to-end
- [ ] Privacy Policy page live (ask Ruti for the text)
- [ ] Parent age consent checkbox on first login (Ruti's legal requirement)

---

## Support contacts when stuck

- **Firebase:** Danny Friedman (Google SE) — he can get you to the right person in 1 email
- **Stripe Israel:** support@stripe.com or use live chat
- **Cloud Run quota:** `gcloud quotas list --service=run.googleapis.com`
- **Nir Katz (DevOps):** knows every GCP command by heart
