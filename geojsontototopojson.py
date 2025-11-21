import os
import gzip
import shutil
import subprocess

# === INPUT / OUTPUT ===
input_folder = r"C:\Users\deniss.boka\Desktop\Boka_datuparbaude\KEM_upload_DParbaude_Boka\GEOJSON_READY"
output_folder = r"C:\Users\deniss.boka\Desktop\Boka_datuparbaude\KEM_upload_DParbaude_Boka\TOPOJSON"

os.makedirs(output_folder, exist_ok=True)

# === CHECK MAPSHAPER INSTALLATION ===
def ensure_mapshaper():
    try:
        subprocess.run(["mapshaper", "-v"], capture_output=True, text=True)
        print("✔ mapshaper already installed.")
    except FileNotFoundError:
        print("⚠ mapshaper not found. Installing globally with npm...")
        subprocess.run(["npm", "install", "-g", "mapshaper"], check=True)
        print("✔ mapshaper installed.")

ensure_mapshaper()

# === FUNCTION: DECOMPRESS .GZ FILES ===
def decompress_gz(path):
    if not path.endswith(".gz"):
        return path

    new_path = path.replace(".gz", "")
    with gzip.open(path, "rb") as f_in:
        with open(new_path, "wb") as f_out:
            shutil.copyfileobj(f_in, f_out)

    print(f"✔ Decompressed: {path} → {new_path}")
    return new_path

# === PROCESS ALL FILES ===
for file in os.listdir(input_folder):
    if file.endswith(".geojson") or file.endswith(".geojson.gz"):
        full_path = os.path.join(input_folder, file)
        print(f"\n🔹 Processing: {file}")

        # Decompress if needed
        geojson_path = decompress_gz(full_path)

        # Output name
        name = os.path.splitext(os.path.basename(geojson_path))[0]
        topo_path = os.path.join(output_folder, name + ".topojson")

        # Mapshaper conversion
        cmd = [
            "mapshaper",
            geojson_path,
            "-simplify", "5%",          # reduce file size slightly (safe)
            "-o", f"format=topojson", 
            f"quantization=1e5",
            topo_path
        ]

        subprocess.run(cmd, check=True)
        print(f"✔ Saved TopoJSON → {topo_path}")

print("\n🎉 DONE! All GeoJSON converted to TopoJSON.")