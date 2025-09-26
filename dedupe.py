#!/usr/bin/env python3
import csv
import re
from collections import defaultdict
import os
from datetime import datetime

def extract_base_image_id(url):
    """Extract base image identifier from PIM URL"""
    match = re.search(r'/pim/([^/]+/[^/]+)/', url)
    return match.group(1) if match else None

def get_width_from_url(url):
    """Extract width parameter from URL"""
    match = re.search(r'width=(\d+)', url)
    return int(match.group(1)) if match else 0

def calculate_score(row, width):
    """Calculate preference score for URL selection"""
    score = 0

    # Prefer 1024px width
    if width == 1024:
        score += 100
    elif 768 <= width <= 1536:
        score += 50
    elif width > 1536:
        score += 25
    else:
        score += 10

    # Prefer AR_16_9 over AR_4_3
    if 'AR_16_9' in row['image_url']:
        score += 20
    elif 'AR_4_3' in row['image_url']:
        score += 10

    return score

def dedupe_webp_csv():
    """Main deduplication function"""
    print("🔄 Starting WebP Images Deduplication...")

    try:
        # Read input file
        with open('public/webp-images.csv', 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            rows = list(reader)

        print(f"📊 Processing {len(rows)} data rows")

        # Group by decor_id + base_image_id
        groups = defaultdict(list)

        for row in rows:
            base_id = extract_base_image_id(row['image_url'])
            if not base_id:
                print(f"⚠️  No base image ID found: {row['image_url']}")
                continue

            key = f"{row['decor_id']}:{base_id}"
            groups[key].append(row)

        print(f"🔍 Found {len(groups)} unique decor_id + base_image combinations")

        # Choose representatives
        deduped_rows = []

        for key, group_rows in groups.items():
            if not group_rows:
                continue

            # Sort by score and pick best
            scored_rows = []
            for row in group_rows:
                width = get_width_from_url(row['image_url'])
                score = calculate_score(row, width)
                scored_rows.append((score, row))

            scored_rows.sort(reverse=True, key=lambda x: x[0])
            chosen_row = scored_rows[0][1]

            # Add metadata
            chosen_row['original_count'] = len(group_rows)
            chosen_row['chosen_width'] = get_width_from_url(chosen_row['image_url'])
            chosen_row['chosen_score'] = scored_rows[0][0]

            deduped_rows.append(chosen_row)

            decor_id = key.split(':')[0]
            print(f"  🎯 {decor_id}: {len(group_rows)} → 1 (kept {chosen_row['chosen_width']}px)")

        print(f"✅ Selected {len(deduped_rows)} representative rows")

        # Create backup
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_file = f'public/webp-images-backup-{timestamp}.csv'

        print(f"💾 Creating backup: {backup_file}")
        with open(backup_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=reader.fieldnames)
            writer.writeheader()
            writer.writerows(rows)

        # Write deduped file
        print("💾 Writing deduped file: public/webp-images.csv")
        with open('public/webp-images.csv', 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=reader.fieldnames + ['original_count', 'chosen_width', 'chosen_score'])
            writer.writeheader()

            for row in deduped_rows:
                # Remove temp fields for final output
                output_row = {k: v for k, v in row.items() if k not in ['original_count', 'chosen_width', 'chosen_score']}
                writer.writerow(output_row)

        # Summary
        original_size = len(rows)
        deduped_size = len(deduped_rows)
        reduction = round((1 - deduped_size / original_size) * 100, 1)

        print("\n🎉 DEDUPLICATION COMPLETE!")
        print("=" * 50)
        print(f"📊 Original rows: {original_size}")
        print(f"📊 Deduped rows: {deduped_size}")
        print(f"📊 Reduction: {reduction}%")
        print(f"📊 Space saved: {original_size - deduped_size} rows")
        print("=" * 50)

        return {
            'original_size': original_size,
            'deduped_size': deduped_size,
            'reduction': reduction,
            'saved_rows': original_size - deduped_size
        }

    except Exception as e:
        print(f"❌ Error during deduplication: {e}")
        raise

if __name__ == '__main__':
    result = dedupe_webp_csv()
    print("\n✅ Process completed successfully!")
