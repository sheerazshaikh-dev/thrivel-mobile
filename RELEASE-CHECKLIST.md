# Release checklist

- [ ] `npm install` completes without `ERESOLVE`.
- [ ] `npx expo install --fix` completes.
- [ ] `npx expo-doctor` passes all required checks.
- [ ] Login survives app close/reopen and returns the member to Dashboard.
- [ ] Android hardware Back never exposes the public home while a member is logged in.
- [ ] `/settings` logo and brand assets render on both iOS and Android.
- [ ] Assessment email gate, all question types, optional body photos and recommendation generation complete.
- [ ] Body-profile front/side uploads reach the API; skip path also completes cleanly.
- [ ] Recommended products match the web response and are not auto-added to cart.
- [ ] Purchased products do not appear as "more products".
- [ ] Checkout works for guest assessment and logged-in reorder flows.
- [ ] Account creation after payment logs the customer in and routes to Dashboard.
- [ ] Dashboard weight/check-in/nutrition/progress mutations persist after refresh.
- [ ] Reviewer information request can be answered.
- [ ] Current Plan renders released and pending states; meal regeneration works.
- [ ] AI Health Coach entitlement/configured/rate-limit/clear-chat states work.
- [ ] Subscription cancel/resume and last-product Coach conversion are verified.
- [ ] Profile update, password change and body-profile deletion work.
- [ ] API 401 signs the user out; network/5xx bootstrap errors do not destroy a valid local session.
- [ ] Test iPhone small screen and Android small screen with keyboard open on both chat screens.
- [ ] Test dark status bar/safe areas/notches and Android gesture navigation.
- [ ] Replace prototype recurring billing provider before public launch if backend still reports prototype billing.
- [ ] Increment iOS `buildNumber` and Android `versionCode` for every store upload.

## Navigation and checkout parity fix
- Guest checkout must prefill Email from the assessment email gate.
- Guest checkout must prefill First name from assessment question `first_name`.
- Authenticated customer back navigation must stay inside the dashboard experience and must never expose the public homepage.
