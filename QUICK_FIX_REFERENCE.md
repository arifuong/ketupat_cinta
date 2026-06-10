# ⚡ QUICK FIX REFERENCE - IMAGE BUG

## Problem
Landing page & products showing:
- `Failed to construct 'URL': Invalid URL`
- `Failed to parse src "products/xxxxxxxx.png"`

## Solution
3 backend changes + 4 frontend updates to use absolute image URLs

---

## 🚀 DEPLOY IN 5 MINUTES

```bash
# 1. Clear cache
php artisan config:clear && php artisan cache:clear

# 2. Create storage link (CRITICAL!)
php artisan storage:link

# 3. Restart Laravel
php artisan serve --port=8000

# 4. Restart Next.js (in another terminal)
cd frontend && npm run dev

# 5. Test
# Open http://localhost:3000 - images should load ✅
```

---

## What Changed

### Backend (Laravel)
✅ ProductResource: Added `asset()` helper to image URLs

### Frontend (Next.js)
✅ Created `imageUtils.ts` with `formatImageUrl()` utility
✅ Updated `next.config.ts` with remotePatterns
✅ Updated 3 pages to use formatImageUrl:
  - Landing page
  - Products page
  - Cart page

---

## Verification (30 seconds)

```bash
# Test API
curl http://localhost:8000/api/products | jq '.data[0].image_url'
# Should return: http://localhost:8000/storage/products/...

# Check file exists
dir storage\app\public\products
# Should list your product images

# Browser test
# http://localhost:3000
# Press F12 → Console → No errors ✅
```

---

## Files Modified

| File | Change | Status |
|------|--------|--------|
| ProductResource.php | Add asset() to image_url | ✅ Done |
| imageUtils.ts | NEW utility | ✅ Created |
| next.config.ts | Add remotePatterns | ✅ Updated |
| page.tsx | Use formatImageUrl() | ✅ Updated |
| products/page.tsx | Use formatImageUrl() | ✅ Updated |
| cart/page.tsx | Use formatImageUrl() | ✅ Updated |

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Still getting URL errors | Clear config: `php artisan config:clear` |
| Images still 404 | Create link: `php artisan storage:link` |
| Next.js still error | Hard refresh: Ctrl+Shift+R (not F5) |
| Build fails | Rebuild: `npm run build` then `npm run dev` |

---

## ✅ DONE!
All image loading issues fixed. No breaking changes. Admin upload still works.

Time: ~5 minutes ⏱️
