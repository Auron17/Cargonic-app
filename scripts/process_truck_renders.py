#!/usr/bin/env python3
"""
Pipeline for processing all 6 Cargonic truck models:
- TENT
- REFRIGERATOR
- ISOTHERMAL
- FLATBED
- TIPPER
- CONTAINER

Outputs 760x330 transparent PNGs into mobile/assets/trucks/
"""
import os
import sys
import subprocess
from PIL import Image, ImageFilter, ImageDraw

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SWIFT_TOOL = os.path.join(SCRIPT_DIR, "remove_bg.swift")
TARGET_W, TARGET_H = 760, 330
ASSETS_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, "..", "assets", "trucks"))

MODELS = {
    "tent": {
        "src": "/Users/humoyunrobilov/.gemini/antigravity-cli/brain/6b546345-1720-4f8e-8658-4d584d90d301/truck_tent_curtainside_pure_side_view_1791400317917.jpg",
        "width": 700,
        "ground_y": 286,
        "x": 28,
    },
    "refrigerator": {
        "src": "/Users/humoyunrobilov/.gemini/antigravity-cli/brain/6b546345-1720-4f8e-8658-4d584d90d301/reefer_truck_exact_side_elevation_1791400542020.jpg",
        "width": 700,
        "ground_y": 286,
        "x": 28,
    },
    "isothermal": {
        "src": "/Users/humoyunrobilov/.gemini/antigravity-cli/brain/6b546345-1720-4f8e-8658-4d584d90d301/isothermal_semi_trailer_truck_side_profile_1791400526334.jpg",
        "width": 700,
        "ground_y": 286,
        "x": 28,
    },
    "flatbed": {
        "src": "/Users/humoyunrobilov/.gemini/antigravity-cli/brain/6b546345-1720-4f8e-8658-4d584d90d301/truck_flatbed_side_profile_perfect_1791400548992.jpg",
        "width": 700,
        "ground_y": 286,
        "x": 28,
    },
    "tipper": {
        "src": "/Users/humoyunrobilov/.gemini/antigravity-cli/brain/6b546345-1720-4f8e-8658-4d584d90d301/tipper_dump_truck_side_profile_1791400504961.jpg",
        "width": 700,
        "ground_y": 286,
        "x": 28,
    },
    "container": {
        "src": "/Users/humoyunrobilov/.gemini/antigravity-cli/brain/6b546345-1720-4f8e-8658-4d584d90d301/container_chassis_semi_truck_1791400506314.jpg",
        "width": 700,
        "ground_y": 286,
        "x": 28,
    },
}

def process_one(name, cfg):
    temp_nobg = f"/tmp/nobg_{name}.png"
    out_path = os.path.join(ASSETS_DIR, f"{name}.png")
    
    # Run Apple Vision subject extraction if not cached
    if not os.path.exists(temp_nobg):
        print(f"Extracting background for {name}...")
        subprocess.run(["swift", SWIFT_TOOL, cfg["src"], temp_nobg], check=True)
    
    nobg = Image.open(temp_nobg)
    alpha = nobg.split()[3]
    bbox = alpha.getbbox()
    if bbox:
        nobg_cropped = nobg.crop(bbox)
    else:
        nobg_cropped = nobg
    
    tw = cfg["width"]
    scale = tw / nobg_cropped.width
    th = int(nobg_cropped.height * scale)
    truck_resized = nobg_cropped.resize((tw, th), Image.LANCZOS)
    
    canvas = Image.new('RGBA', (TARGET_W, TARGET_H), (0, 0, 0, 0))
    pos_x = cfg["x"]
    pos_y = cfg["ground_y"] - th
    
    # Realistic soft ground shadow (two layers: contact shadow + ambient spread)
    shadow_layer = Image.new('RGBA', (TARGET_W, TARGET_H), (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(shadow_layer)
    
    # 1. Wider diffused shadow
    sdraw.ellipse([pos_x + 10, cfg["ground_y"] - 10, pos_x + tw - 5, cfg["ground_y"] + 24], fill=(0, 0, 0, 50))
    # 2. Dense contact shadow directly under wheels
    sdraw.ellipse([pos_x + 30, cfg["ground_y"] - 6, pos_x + tw - 20, cfg["ground_y"] + 12], fill=(0, 0, 0, 80))
    
    shadow_blurred = shadow_layer.filter(ImageFilter.GaussianBlur(6))
    
    final_img = Image.alpha_composite(shadow_blurred, Image.new('RGBA', (TARGET_W, TARGET_H), (0, 0, 0, 0)))
    final_img.paste(truck_resized, (pos_x, pos_y), truck_resized)
    
    final_img.save(out_path, optimize=True)
    print(f"Generated {out_path} ({TARGET_W}x{TARGET_H})")

def main():
    os.makedirs(ASSETS_DIR, exist_ok=True)
    for name, cfg in MODELS.items():
        process_one(name, cfg)
    print("All 6 truck assets successfully generated!")

if __name__ == "__main__":
    main()
