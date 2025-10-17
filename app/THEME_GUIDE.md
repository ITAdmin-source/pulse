# Theme Testing Guide

## 8 Available Themes

Based on the [demo-brand-colors](../app/demo-brand-colors/page.tsx) proposals, you now have 8 theme variations to test:

### 1. Blue Foundation - Standard Voting
**Tagline:** Conservative & Professional
**Import:** `import "./theme-blue-foundation-standard.css";`
- Page Background: Basic Blue gradient
- Poll Headers: Basic Blue → Tomorrow Cyan
- Insights: Daily Gray → Basic Blue → Tomorrow Cyan
- Voting Buttons: Standard (Green/Red/Gray)

### 2. Blue Foundation - Brand Voting
**Tagline:** Conservative & Professional
**Import:** `import "./theme-blue-foundation-brand.css";`
- Same design as above
- Voting Buttons: Brand colors (Green/Orange/Beige)

### 3. Vibrant Spectrum - Standard Voting
**Tagline:** Bold & Energetic
**Import:** `import "./theme-vibrant-spectrum-standard.css";`
- Page Background: Basic Blue → Daily Gray → Basic Blue
- Poll Headers: Contemporary Orange → Tomorrow Cyan
- Insights: Tomorrow Cyan → Daily Gray → Contemporary Orange
- Voting Buttons: Standard (Green/Red/Gray)

### 4. Vibrant Spectrum - Brand Voting
**Tagline:** Bold & Energetic
**Import:** `import "./theme-vibrant-spectrum-brand.css";`
- Same design as above
- Voting Buttons: Brand colors (Green/Orange/Beige)

### 5. Cyan-Centric - Standard Voting
**Tagline:** Balanced & Modern
**Import:** `import "./theme-cyan-centric-standard.css";`
- Page Background: Basic Blue gradient (darker)
- Poll Headers: Tomorrow Cyan → Daily Gray
- Insights: Basic Blue → Tomorrow Cyan → Daily Gray
- Voting Buttons: Standard (Green/Red/Gray)

### 6. Cyan-Centric - Brand Voting
**Tagline:** Balanced & Modern
**Import:** `import "./theme-cyan-centric-brand.css";`
- Same design as above
- Voting Buttons: Brand colors (Green/Orange/Beige)

### 7. Natural Gradient - Standard Voting
**Tagline:** Sophisticated & Warm
**Import:** `import "./theme-natural-gradient-standard.css";`
- Page Background: Basic Blue → Daily Gray → Beige
- Poll Headers: Daily Gray → Tomorrow Cyan
- Insights: Basic Blue → Tomorrow Cyan → Medium Base Green
- Voting Buttons: Standard (Green/Red/Gray)

### 8. Natural Gradient - Brand Voting
**Tagline:** Sophisticated & Warm
**Import:** `import "./theme-natural-gradient-brand.css";`
- Same design as above
- Voting Buttons: Brand colors (Green/Orange/Beige)

## How to Switch Themes

1. Open `app/layout.tsx`
2. Change line 9 to import your desired theme:
   ```typescript
   import "./theme-cyan-centric-brand.css";  // Example
   ```
3. Save - dev server will hot reload instantly!

## Voting Button Colors

**Standard Colors:**
- Agree: Green (#22c55e)
- Disagree: Red (#ef4444)
- Pass: Gray (#f3f4f6)

**Brand Colors:**
- Agree: Medium Base Green (#8dc63f)
- Disagree: Contemporary Orange (#f04e2d)
- Pass: Beige (#cfcfa3)

## Testing Tips

1. **Visual comparison**: Test side-by-side with the [demo page](http://localhost:3000/demo-brand-colors)
2. **Check all views**: Poll list, voting interface, results page, insights
3. **Test components**: Look at poll cards, headers, progress bars, tabs, insight cards
4. **Verify accessibility**: Ensure text contrast meets WCAG standards on all backgrounds

## Current Default

The default theme (when importing `theme-variables.css`) remains the original Purple/Pink design for backward compatibility.
