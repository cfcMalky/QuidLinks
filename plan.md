# QuidLinks Project Plan & Checklist

This plan outlines the remaining finishing touches and the logical next steps for QuidLinks, from immediate tasks to future features. Update this document as you progress.

---

## 1. Finishing Touches (Immediate)
- [ ] Finalize formatting of the main site (index, information, privacy-policy, terms)
- [ ] Polish the offers table on the home page (styling, sorting/filtering if needed)
- [ ] Design and implement the minimal program/offer page template
- [ ] Generate individual program pages in `public/programs/` from `partners.csv`
- [ ] Ensure consistent header, nav, and footer across all pages
- [ ] Test site on desktop and mobile for responsiveness and minimalism
- [ ] Check all referral links and program data for accuracy

---

## 2. Backend & Automation (Next Phase)
- [ ] Build a backend CSV editor for `partners.csv`
    - [ ] Integrate Gemini (or similar) for fast description generation
    - [ ] Add validation and easy editing features
- [ ] Automate generation of program pages from CSV (script or backend tool)

---

## 3. User Features (Future)
- [ ] User registration and authentication system
- [ ] User profiles (store/manage their affiliate links)
- [ ] Comments/discussion section on each program page
- [ ] Personalized landing pages for users (with their affiliate links injected)
- [ ] Cookie-based attribution system:
    - [ ] If a visitor clicks a user's link, store their affiliate ID in a cookie
    - [ ] For any offer the visitor signs up for, use the user's affiliate link if available, otherwise use the site owner's
- [ ] Admin dashboard for managing users, comments, and offers

---

## 4. Continuous Improvement
- [ ] Regularly review and refactor code for minimalism and maintainability
- [ ] Optimize site performance and accessibility
- [ ] Update documentation and this plan as features are completed or priorities change

---

**Let's use this as our checklist and update it as we go!** 