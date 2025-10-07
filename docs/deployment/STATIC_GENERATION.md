# Static Page Generation

This project includes a static page generator that creates individual HTML pages for all materials and finishes from the Supabase database.

## How it works

1. **Connects to Supabase** and fetches all materials and finishes data
2. **Generates individual HTML files** for each product with embedded content
3. **Creates static pages** with no runtime database calls
4. **Embeds all text content** directly in HTML
5. **Includes image URLs** as static links

## Generated Structure

```
public/static-pages/
├── materials/
│   ├── index.html                    # Materials gallery
│   ├── acapulco-f685-st10.html      # Individual material pages
│   ├── agave-green-u645-st9.html
│   └── ...
└── finishes/
    ├── index.html                    # Finishes gallery
    ├── wainscot-55.html             # Individual finish pages
    ├── off-white-3.html
    └── ...
```

## Usage

### Generate all static pages:
```bash
npm run generate:static
```

### What gets generated:
- **312 material pages** - One for each EGGER material
- **301 finish pages** - One for each Farrow & Ball finish
- **2 index pages** - Gallery views for materials and finishes
- **All content embedded** - No database calls needed at runtime

## Features

### Material Pages:
- Product name and ID
- Description and specifications
- Category, texture, color family
- Primary image and additional images
- Lead time information
- Navigation back to materials gallery

### Finish Pages:
- Color name and number
- Description and specifications
- Color hex codes and RGB values
- Primary image and additional images
- Category information
- Navigation back to finishes gallery

## Benefits

- **Lightning fast** - No JavaScript data loading
- **SEO friendly** - Search engines can index all content
- **Reliable** - No runtime errors from database issues
- **Cacheable** - Static files can be heavily cached
- **Simple** - Just plain HTML with embedded content

## File Naming

Pages are named using a slug format:
- Materials: `{name}-{id}.html` (e.g., `acapulco-f685-st10.html`)
- Finishes: `{name}-{number}.html` (e.g., `wainscot-55.html`)

## Accessing Pages

- Materials: `/static-pages/materials/{slug}.html`
- Finishes: `/static-pages/finishes/{slug}.html`
- Galleries: `/static-pages/materials/index.html` and `/static-pages/finishes/index.html`


