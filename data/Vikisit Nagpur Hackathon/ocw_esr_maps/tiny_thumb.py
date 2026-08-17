#!/usr/bin/env python3
"""Render tiny thumbnails for AI vision analysis."""
import pymupdf, glob, os

THUMB_DIR = 'tiny_thumbs'
os.makedirs(THUMB_DIR, exist_ok=True)

for f in sorted(glob.glob('**/*.pdf', recursive=True)):
    esr = (os.path.basename(f)
           .replace('_Estimated_Supply__Dec_23', '')
           .replace('.pdf', '').replace('_', ' ').strip())
    nmc_zone = os.path.basename(os.path.dirname(f))
    key = f"{nmc_zone}__{esr}".replace(' ', '_')
    
    doc = pymupdf.open(f)
    pg = doc[0]
    # 25% scale for tiny thumbnails
    mat = pymupdf.Matrix(0.25, 0.25)
    pix = pg.get_pixmap(matrix=mat)
    thumb_path = os.path.join(THUMB_DIR, f'{key}.png')
    pix.save(thumb_path)
    size_kb = os.path.getsize(thumb_path) // 1024
    print(f'{key}: {size_kb}KB')

print(f'\nDone. Thumbnails in {THUMB_DIR}/')
