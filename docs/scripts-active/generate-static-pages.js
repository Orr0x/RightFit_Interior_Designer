#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Create output directories
const outputDir = path.join(__dirname, '..', 'public', 'static-pages');
const materialsDir = path.join(outputDir, 'materials');
const finishesDir = path.join(outputDir, 'finishes');

async function ensureDirectories() {
  await fs.mkdir(outputDir, { recursive: true });
  await fs.mkdir(materialsDir, { recursive: true });
  await fs.mkdir(finishesDir, { recursive: true });
  console.log('📁 Created output directories');
}

// HTML template for materials
function generateMaterialHTML(material) {
  const primaryImage = material.images?.find(img => img.is_primary) || material.images?.[0];
  const imageUrl = primaryImage?.image_url || '';
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${material.decor_name} - RightFit Interiors</title>
    <meta name="description" content="${material.description || `High-quality ${material.decor_name} material from EGGER`}">
    <link rel="stylesheet" href="/src/index.css">
</head>
<body>
    <div class="min-h-screen bg-gray-50">
        <!-- Navigation -->
        <nav class="bg-white shadow-sm border-b">
            <div class="container mx-auto px-4 py-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-8">
                        <img src="/src/assets/logo.png" alt="RightFit Interiors" class="h-8">
                        <div class="hidden md:flex space-x-6">
                            <a href="/" class="text-gray-600 hover:text-blue-600">Home</a>
                            <a href="/services" class="text-gray-600 hover:text-blue-600">Services</a>
                            <a href="/gallery" class="text-gray-600 hover:text-blue-600">Gallery</a>
                            <a href="/blog" class="text-gray-600 hover:text-blue-600">Blog</a>
                            <a href="/egger-boards" class="text-blue-600 font-medium">Materials & Finishes</a>
                            <a href="/contact" class="text-gray-600 hover:text-blue-600">Contact</a>
                        </div>
                    </div>
                </div>
            </div>
        </nav>

        <!-- Main Content -->
        <div class="container mx-auto px-4 py-8">
            <div class="max-w-4xl mx-auto">
                <!-- Breadcrumb -->
                <nav class="mb-6">
                    <a href="/egger-boards" class="text-blue-600 hover:underline">← Back to Materials</a>
                </nav>

                <!-- Product Header -->
                <div class="bg-white rounded-lg shadow-sm p-8 mb-8">
                    <div class="grid md:grid-cols-2 gap-8">
                        <!-- Product Image -->
                        <div class="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                            ${imageUrl ? `<img src="${imageUrl}" alt="${material.decor_name}" class="w-full h-full object-cover">` : '<div class="w-full h-full flex items-center justify-center text-gray-400">No image available</div>'}
                        </div>

                        <!-- Product Details -->
                        <div class="space-y-6">
                            <div>
                                <h1 class="text-3xl font-bold text-gray-900 mb-2">${material.decor_name}</h1>
                                <p class="text-xl text-gray-600">${material.decor_id}</p>
                            </div>

                            <div class="space-y-4">
                                <div>
                                    <h3 class="font-semibold text-gray-900 mb-2">Description</h3>
                                    <p class="text-gray-600">${material.description || 'High-quality material perfect for your interior design needs.'}</p>
                                </div>

                                <div class="grid grid-cols-2 gap-4">
                                    <div>
                                        <h4 class="font-medium text-gray-900">Category</h4>
                                        <p class="text-gray-600">${material.category || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <h4 class="font-medium text-gray-900">Texture</h4>
                                        <p class="text-gray-600">${material.texture || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <h4 class="font-medium text-gray-900">Color Family</h4>
                                        <p class="text-gray-600">${material.color_family || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <h4 class="font-medium text-gray-900">Lead Time</h4>
                                        <p class="text-gray-600">0 days</p>
                                    </div>
                                </div>
                            </div>

                            <div class="pt-4">
                                <a href="/egger-boards" class="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                    View All Materials
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Additional Images -->
                ${material.images && material.images.length > 1 ? `
                <div class="bg-white rounded-lg shadow-sm p-8">
                    <h2 class="text-2xl font-bold text-gray-900 mb-6">Additional Images</h2>
                    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        ${material.images.slice(1, 9).map(img => `
                            <div class="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                                <img src="${img.image_url}" alt="${material.decor_name} - Image ${material.images.indexOf(img) + 1}" class="w-full h-full object-cover">
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
            </div>
        </div>
    </div>
</body>
</html>`;
}

// HTML template for finishes
function generateFinishHTML(finish) {
  const primaryImage = finish.farrow_ball_images?.find(img => img.is_main_image) || finish.farrow_ball_images?.[0];
  const imageUrl = primaryImage?.image_url || '';
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${finish.color_name} - RightFit Interiors</title>
    <meta name="description" content="${finish.description || `Beautiful ${finish.color_name} finish from Farrow & Ball`}">
    <link rel="stylesheet" href="/src/index.css">
</head>
<body>
    <div class="min-h-screen bg-gray-50">
        <!-- Navigation -->
        <nav class="bg-white shadow-sm border-b">
            <div class="container mx-auto px-4 py-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-8">
                        <img src="/src/assets/logo.png" alt="RightFit Interiors" class="h-8">
                        <div class="hidden md:flex space-x-6">
                            <a href="/" class="text-gray-600 hover:text-blue-600">Home</a>
                            <a href="/services" class="text-gray-600 hover:text-blue-600">Services</a>
                            <a href="/gallery" class="text-gray-600 hover:text-blue-600">Gallery</a>
                            <a href="/blog" class="text-gray-600 hover:text-blue-600">Blog</a>
                            <a href="/egger-boards" class="text-blue-600 font-medium">Materials & Finishes</a>
                            <a href="/contact" class="text-gray-600 hover:text-blue-600">Contact</a>
                        </div>
                    </div>
                </div>
            </div>
        </nav>

        <!-- Main Content -->
        <div class="container mx-auto px-4 py-8">
            <div class="max-w-4xl mx-auto">
                <!-- Breadcrumb -->
                <nav class="mb-6">
                    <a href="/egger-boards?tab=finishes" class="text-blue-600 hover:underline">← Back to Finishes</a>
                </nav>

                <!-- Product Header -->
                <div class="bg-white rounded-lg shadow-sm p-8 mb-8">
                    <div class="grid md:grid-cols-2 gap-8">
                        <!-- Product Image -->
                        <div class="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                            ${imageUrl ? `<img src="${imageUrl}" alt="${finish.color_name}" class="w-full h-full object-cover">` : '<div class="w-full h-full flex items-center justify-center text-gray-400">No image available</div>'}
                        </div>

                        <!-- Product Details -->
                        <div class="space-y-6">
                            <div>
                                <h1 class="text-3xl font-bold text-gray-900 mb-2">${finish.color_name}</h1>
                                <p class="text-xl text-gray-600">Farrow & Ball No. ${finish.color_number}</p>
                            </div>

                            <div class="space-y-4">
                                <div>
                                    <h3 class="font-semibold text-gray-900 mb-2">Description</h3>
                                    <p class="text-gray-600">${finish.description || 'Beautiful finish perfect for your interior design needs.'}</p>
                                </div>

                                <div class="grid grid-cols-2 gap-4">
                                    <div>
                                        <h4 class="font-medium text-gray-900">Color Number</h4>
                                        <p class="text-gray-600">${finish.color_number}</p>
                                    </div>
                                    <div>
                                        <h4 class="font-medium text-gray-900">Main Color</h4>
                                        <div class="flex items-center space-x-2">
                                            <div class="w-6 h-6 rounded border" style="background-color: ${finish.main_color_hex}"></div>
                                            <span class="text-gray-600">${finish.main_color_hex}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 class="font-medium text-gray-900">RGB</h4>
                                        <p class="text-gray-600">${finish.main_color_rgb || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <h4 class="font-medium text-gray-900">Category</h4>
                                        <p class="text-gray-600">${finish.category || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>

                            <div class="pt-4">
                                <a href="/egger-boards?tab=finishes" class="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                    View All Finishes
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Additional Images -->
                ${finish.farrow_ball_images && finish.farrow_ball_images.length > 1 ? `
                <div class="bg-white rounded-lg shadow-sm p-8">
                    <h2 class="text-2xl font-bold text-gray-900 mb-6">Additional Images</h2>
                    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        ${finish.farrow_ball_images.slice(1, 9).map(img => `
                            <div class="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                                <img src="${img.image_url}" alt="${finish.color_name} - Image ${finish.farrow_ball_images.indexOf(img) + 1}" class="w-full h-full object-cover">
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
            </div>
        </div>
    </div>
</body>
</html>`;
}

// Generate slug from name
function generateSlug(name, id) {
  return `${name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-${id.toLowerCase().replace(/\s+/g, '-')}`;
}

// Main generation function
async function generateStaticPages() {
  try {
    console.log('🚀 Starting static page generation...');
    
    await ensureDirectories();

    // Load materials
    console.log('📦 Loading materials from database...');
    const { data: materials, error: materialsError } = await supabase
      .from('egger_decors')
      .select(`
        *,
        images:egger_images(*),
        availability:egger_availability(*),
        combinations:egger_combinations(*),
        interior_match:egger_interior_matches(*)
      `)
      .order('decor_name');

    if (materialsError) throw materialsError;

    console.log(`✅ Loaded ${materials.length} materials`);

    // Generate material pages
    for (const material of materials) {
      const slug = generateSlug(material.decor_name, material.decor_id);
      const filename = `${slug}.html`;
      const filepath = path.join(materialsDir, filename);
      
      const html = generateMaterialHTML(material);
      await fs.writeFile(filepath, html, 'utf8');
      
      console.log(`📄 Generated: materials/${filename}`);
    }

    // Load finishes
    console.log('🎨 Loading finishes from database...');
    const { data: finishes, error: finishesError } = await supabase
      .from('farrow_ball_finishes')
      .select(`
        *,
        farrow_ball_color_schemes(*),
        farrow_ball_images(*)
      `)
      .order('color_name');

    if (finishesError) throw finishesError;

    console.log(`✅ Loaded ${finishes.length} finishes`);

    // Generate finish pages
    for (const finish of finishes) {
      const slug = generateSlug(finish.color_name, finish.color_number);
      const filename = `${slug}.html`;
      const filepath = path.join(finishesDir, filename);
      
      const html = generateFinishHTML(finish);
      await fs.writeFile(filepath, html, 'utf8');
      
      console.log(`📄 Generated: finishes/${filename}`);
    }

    // Generate index files
    const materialsIndex = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Materials - RightFit Interiors</title>
    <link rel="stylesheet" href="/src/index.css">
</head>
<body>
    <div class="min-h-screen bg-gray-50">
        <nav class="bg-white shadow-sm border-b">
            <div class="container mx-auto px-4 py-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-8">
                        <img src="/src/assets/logo.png" alt="RightFit Interiors" class="h-8">
                        <div class="hidden md:flex space-x-6">
                            <a href="/" class="text-gray-600 hover:text-blue-600">Home</a>
                            <a href="/services" class="text-gray-600 hover:text-blue-600">Services</a>
                            <a href="/gallery" class="text-gray-600 hover:text-blue-600">Gallery</a>
                            <a href="/blog" class="text-gray-600 hover:text-blue-600">Blog</a>
                            <a href="/egger-boards" class="text-blue-600 font-medium">Materials & Finishes</a>
                            <a href="/contact" class="text-gray-600 hover:text-blue-600">Contact</a>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
        <div class="container mx-auto px-4 py-8">
            <h1 class="text-3xl font-bold text-gray-900 mb-6">Materials</h1>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                ${materials.map(material => {
                  const slug = generateSlug(material.decor_name, material.decor_id);
                  const primaryImage = material.images?.find(img => img.is_primary) || material.images?.[0];
                  return `
                    <div class="bg-white rounded-lg shadow-sm overflow-hidden">
                        <div class="aspect-square bg-gray-100">
                            ${primaryImage ? `<img src="${primaryImage.image_url}" alt="${material.decor_name}" class="w-full h-full object-cover">` : '<div class="w-full h-full flex items-center justify-center text-gray-400">No image</div>'}
                        </div>
                        <div class="p-4">
                            <h3 class="font-semibold text-gray-900 mb-2">${material.decor_name}</h3>
                            <p class="text-gray-600 text-sm mb-4">${material.decor_id}</p>
                            <a href="/static-pages/materials/${slug}.html" class="text-blue-600 hover:underline">View Details →</a>
                        </div>
                    </div>
                  `;
                }).join('')}
            </div>
        </div>
    </div>
</body>
</html>`;

    const finishesIndex = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Finishes - RightFit Interiors</title>
    <link rel="stylesheet" href="/src/index.css">
</head>
<body>
    <div class="min-h-screen bg-gray-50">
        <nav class="bg-white shadow-sm border-b">
            <div class="container mx-auto px-4 py-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-8">
                        <img src="/src/assets/logo.png" alt="RightFit Interiors" class="h-8">
                        <div class="hidden md:flex space-x-6">
                            <a href="/" class="text-gray-600 hover:text-blue-600">Home</a>
                            <a href="/services" class="text-gray-600 hover:text-blue-600">Services</a>
                            <a href="/gallery" class="text-gray-600 hover:text-blue-600">Gallery</a>
                            <a href="/blog" class="text-gray-600 hover:text-blue-600">Blog</a>
                            <a href="/egger-boards" class="text-blue-600 font-medium">Materials & Finishes</a>
                            <a href="/contact" class="text-gray-600 hover:text-blue-600">Contact</a>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
        <div class="container mx-auto px-4 py-8">
            <h1 class="text-3xl font-bold text-gray-900 mb-6">Finishes</h1>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                ${finishes.map(finish => {
                  const slug = generateSlug(finish.color_name, finish.color_number);
                  const primaryImage = finish.farrow_ball_images?.find(img => img.is_main_image) || finish.farrow_ball_images?.[0];
                  return `
                    <div class="bg-white rounded-lg shadow-sm overflow-hidden">
                        <div class="aspect-square bg-gray-100">
                            ${primaryImage ? `<img src="${primaryImage.image_url}" alt="${finish.color_name}" class="w-full h-full object-cover">` : '<div class="w-full h-full flex items-center justify-center text-gray-400">No image</div>'}
                        </div>
                        <div class="p-4">
                            <h3 class="font-semibold text-gray-900 mb-2">${finish.color_name}</h3>
                            <p class="text-gray-600 text-sm mb-4">No. ${finish.color_number}</p>
                            <a href="/static-pages/finishes/${slug}.html" class="text-blue-600 hover:underline">View Details →</a>
                        </div>
                    </div>
                  `;
                }).join('')}
            </div>
        </div>
    </div>
</body>
</html>`;

    await fs.writeFile(path.join(materialsDir, 'index.html'), materialsIndex, 'utf8');
    await fs.writeFile(path.join(finishesDir, 'index.html'), finishesIndex, 'utf8');

    console.log('🎉 Static page generation completed!');
    console.log(`📊 Generated ${materials.length} material pages`);
    console.log(`📊 Generated ${finishes.length} finish pages`);
    console.log(`📁 Output directory: ${outputDir}`);

  } catch (error) {
    console.error('❌ Error generating static pages:', error);
    process.exit(1);
  }
}

// Run the generator
generateStaticPages();
